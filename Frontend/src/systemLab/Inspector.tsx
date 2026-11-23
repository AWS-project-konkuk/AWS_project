import { useState } from 'react';
import { Minimize2, Minus, Plus, Trash2 } from 'lucide-react';
import { reparent, type Command } from './commands';
import {
  descendants,
  editablePortTypes,
  portLabel,
  protectedKind,
  requiredLabEntities,
  rootId,
  type Direction,
  type Entity,
  type Graph,
  type Material,
  type PortSpec,
} from './lab';
import { useLab } from './labContext';
import { KindIcon } from './Canvas';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { NativeSelect } from '../components/ui/native-select';
import { hint } from './appearance';
import { newId } from '../ids';

type Dispatch = (command: Command) => boolean;
const portControls = 'flex gap-[5px] [&>select]:min-w-0 [&>select]:flex-1 [&>button]:px-1.5';

function PortRow({
  node,
  graph,
  port,
  dispatch,
}: {
  node: Entity;
  graph: Graph;
  port: PortSpec;
  dispatch: Dispatch;
}) {
  const { lab } = useLab();
  const [choose, setChoose] = useState(false);
  const attached = graph.connections.filter((e) => e.to.node === node.id && e.to.port === port.id);
  const label = portLabel(lab, node.ports ?? [], port);
  return (
    <div className="[&_label]:my-[5px]">
      <div className={portControls}>
        <NativeSelect
          aria-label={label + ' 타입'}
          value={port.material}
          onChange={(e) =>
            dispatch({
              type: 'port-change',
              id: node.id,
              port: port.id,
              changes: { material: e.target.value as Material },
            })
          }
        >
          {editablePortTypes(lab, node.kind, port.direction).map((type) => (
            <option key={type} value={type}>
              {lab.materials[type]}
            </option>
          ))}
        </NativeSelect>
        {port.direction === 'in' && (
          <NativeSelect
            aria-label={label + ' 연결 수'}
            value={port.multiple ? 'many' : 'one'}
            onChange={(e) => {
              const multiple = e.target.value === 'many';
              if (!multiple && attached.length > 1) {
                setChoose(true);
                return;
              }
              setChoose(false);
              dispatch({ type: 'port-change', id: node.id, port: port.id, changes: { multiple } });
            }}
          >
            <option value="one">단일</option>
            <option value="many">여러 개</option>
          </NativeSelect>
        )}
        <Button
          type="button"
          aria-label={label + ' 포트 삭제'}
          onClick={() => dispatch({ type: 'port-remove', id: node.id, port: port.id })}
        >
          <Minus size={15} />
        </Button>
      </div>
      {choose && port.multiple && attached.length > 1 && (
        <label>
          유지할 연결
          <NativeSelect
            value=""
            onChange={(e) => {
              if (!e.target.value) return;
              dispatch({
                type: 'port-change',
                id: node.id,
                port: port.id,
                changes: { multiple: false },
                keep: e.target.value,
              });
              setChoose(false);
            }}
          >
            <option value="">연결 선택</option>
            {attached.map((e) => (
              <option key={e.id} value={e.id}>
                {graph.entities.find((n) => n.id === e.from.node)?.name} · {e.from.port}
              </option>
            ))}
          </NativeSelect>
          <Button type="button" onClick={() => setChoose(false)}>
            취소
          </Button>
        </label>
      )}
    </div>
  );
}
function PortList({
  node,
  graph,
  direction,
  dispatch,
}: {
  node: Entity;
  graph: Graph;
  direction: Direction;
  dispatch: Dispatch;
}) {
  const { lab } = useLab();
  const choices = editablePortTypes(lab, node.kind, direction);
  const [draft, setDraft] = useState<Material>(choices[0]);
  const title = direction === 'in' ? '입력' : '출력';
  if (!choices.length) return null;
  return (
    <section
      className="grid gap-1.5 border-0 border-t border-solid border-ui-rule pt-2 [&_h4]:m-0 [&_h4]:text-[13px]"
      aria-label={title + ' 포트'}
    >
      <h4>{title}</h4>
      {node.ports
        ?.filter((p) => p.direction === direction)
        .map((p) => (
          <PortRow key={p.id} node={node} graph={graph} port={p} dispatch={dispatch} />
        ))}
      <div className={portControls}>
        <NativeSelect
          aria-label={'추가할 ' + title + ' 타입'}
          value={draft}
          onChange={(e) => setDraft(e.target.value as Material)}
        >
          {choices.map((type) => (
            <option key={type} value={type}>
              {lab.materials[type]}
            </option>
          ))}
        </NativeSelect>
        <Button
          type="button"
          onClick={() =>
            dispatch({
              type: 'port-add',
              id: node.id,
              port: newId(),
              direction,
              material: draft,
            })
          }
        >
          <Plus size={15} /> {title} 추가
        </Button>
      </div>
    </section>
  );
}
export function Inspector({
  node,
  graph,
  busy,
  dispatch,
}: {
  node: Entity;
  graph: Graph;
  busy: boolean;
  dispatch: Dispatch;
}) {
  const { lab, view } = useLab();
  const locked = protectedKind(lab, node.kind);
  const required = requiredLabEntities(lab, graph.entities).has(node.id);
  const settings = { node, graph, dispatch, PortList };
  const children = descendants(graph, node.id);
  const parents = graph.entities.filter(
    (item) =>
      item.type === 'system' && lab.tools[item.kind]?.includes(node.kind) && !children.has(item.id),
  );
  return (
    <>
      <header className="flex items-center gap-[9px] [&_h3]:m-0 [&_h3]:text-base [&_h3]:[overflow-wrap:anywhere] [&_small]:text-ui-muted">
        <KindIcon kind={node.kind} size={21} />
        <div>
          <h3>{node.name}</h3>
          <small>
            {node.type === 'system'
              ? '시스템'
              : (lab.resourceRoles[node.kind] ?? lab.labels[node.kind])}
          </small>
        </div>
      </header>
      <p className={hint}>{view.hints[node.kind]}</p>
      {view.panels[node.kind]?.(graph, lab)}
      <fieldset
        className="m-0 grid min-w-0 gap-2.5 border-0 p-0 [&_label]:grid [&_label]:gap-1"
        disabled={busy}
      >
        {!locked && (
          <>
            <label>
              이름{' '}
              <Input
                key={node.name}
                defaultValue={node.name}
                maxLength={63}
                onBlur={(e) => {
                  if (
                    node.name !== e.target.value &&
                    !dispatch({ type: 'settings', id: node.id, name: e.target.value })
                  )
                    e.target.value = node.name;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                }}
              />
            </label>
          </>
        )}
        {node.type === 'system' && !locked && (
          <Button type="button" onClick={() => dispatch({ type: 'compact', id: node.id })}>
            <Minimize2 size={15} /> 크기 정리
          </Button>
        )}
        {lab.settingSpecs[node.kind]?.map((spec) => {
          const current = node.settings?.[spec.key] ?? spec.initial;
          return (
            <label key={spec.key}>
              {spec.label}
              {spec.type === 'number' ? (
                <Input
                  aria-label={spec.label}
                  type="number"
                  min={spec.min}
                  max={spec.max}
                  step={spec.step}
                  key={String(current)}
                  defaultValue={current}
                  onBlur={(e) => {
                    if (
                      !dispatch({
                        type: 'setting',
                        id: node.id,
                        key: spec.key,
                        value: Number(e.target.value),
                      })
                    )
                      e.target.value = String(current);
                  }}
                />
              ) : (
                <NativeSelect
                  aria-label={spec.label}
                  value={String(current)}
                  onChange={(e) =>
                    dispatch({ type: 'setting', id: node.id, key: spec.key, value: e.target.value })
                  }
                >
                  {spec.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </NativeSelect>
              )}
              {spec.help && <small className="text-ui-muted">{spec.help}</small>}
            </label>
          );
        })}
        {node.type === 'system' && view.systemSettings?.(settings)}
        {!locked && (
          <>
            {view.resourceHeader?.(settings)}
            <label>
              소속 시스템
              <NativeSelect
                value={node.parent}
                onChange={(event) => {
                  const parent = parents.find((p) => p.id === event.target.value);
                  if (parent) dispatch(reparent(graph, node, parent));
                }}
              >
                {parents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </NativeSelect>
            </label>
            {view.resourceSettings?.(settings)}
            {node.type === 'resource' && (
              <>
                <PortList node={node} graph={graph} direction="in" dispatch={dispatch} />
                <PortList node={node} graph={graph} direction="out" dispatch={dispatch} />
              </>
            )}
            {required ? (
              <p className={hint}>실습에 필요한 항목입니다.</p>
            ) : (
              <Button
                type="button"
                variant="destructive"
                onClick={() => dispatch({ type: 'remove', id: node.id })}
              >
                <Trash2 size={15} />{' '}
                {node.type === 'system' ? '시스템과 내부 항목 삭제' : '노드 삭제'}
              </Button>
            )}
          </>
        )}
        {node.id === rootId && <p className={hint}>설정할 노드나 시스템 영역을 선택하세요.</p>}
      </fieldset>
    </>
  );
}
