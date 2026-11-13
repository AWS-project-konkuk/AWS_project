import { useState } from 'react';
import { Minimize2, Minus, Plus, Trash2 } from 'lucide-react';
import { reparent, type Command } from './commands';
import { blockedBy } from './engine';
import {
  descendants,
  hasRunState,
  labels,
  materials,
  portLabel,
  portTypes,
  protectedKind,
  requiredLabEntities,
  resourceRoles,
  rootId,
  tools,
  type Direction,
  type Entity,
  type Graph,
  type Material,
  type PortSpec,
  type Version,
} from './model';
import { KindIcon } from './Canvas';
import styles from './SystemLab.module.css';

type Dispatch = (command: Command) => boolean;
function PortRow({
  node,
  graph,
  port,
  dispatch,
}: {
  node: Extract<Entity, { type: 'resource' }>;
  graph: Graph;
  port: PortSpec;
  dispatch: Dispatch;
}) {
  const [choose, setChoose] = useState(false);
  const attached = graph.connections.filter((e) => e.to.node === node.id && e.to.port === port.id);
  const label = portLabel(node.ports, port);
  return (
    <div className={styles.portEditor}>
      <div className={styles.portControls}>
        <select
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
          {portTypes[node.kind][port.direction].map((type) => (
            <option key={type} value={type}>
              {materials[type]}
            </option>
          ))}
        </select>
        {port.direction === 'in' && (
          <select
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
          </select>
        )}
        <button
          type="button"
          aria-label={label + ' 포트 삭제'}
          onClick={() => dispatch({ type: 'port-remove', id: node.id, port: port.id })}
        >
          <Minus size={15} />
        </button>
      </div>
      {choose && port.multiple && attached.length > 1 && (
        <label>
          유지할 연결
          <select
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
          </select>
          <button type="button" onClick={() => setChoose(false)}>
            취소
          </button>
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
  node: Extract<Entity, { type: 'resource' }>;
  graph: Graph;
  direction: Direction;
  dispatch: Dispatch;
}) {
  const choices = portTypes[node.kind][direction];
  const [draft, setDraft] = useState<Material>(choices[0]);
  const title = direction === 'in' ? '입력' : '출력';
  if (!choices.length) return null;
  return (
    <section className={styles.portGroup} aria-label={title + ' 포트'}>
      <h4>{title}</h4>
      {node.ports
        .filter((p) => p.direction === direction)
        .map((p) => (
          <PortRow key={p.id} node={node} graph={graph} port={p} dispatch={dispatch} />
        ))}
      <div className={styles.portControls}>
        <select
          aria-label={'추가할 ' + title + ' 타입'}
          value={draft}
          onChange={(e) => setDraft(e.target.value as Material)}
        >
          {choices.map((type) => (
            <option key={type} value={type}>
              {materials[type]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() =>
            dispatch({
              type: 'port-add',
              id: node.id,
              port: crypto.randomUUID(),
              direction,
              material: draft,
            })
          }
        >
          <Plus size={15} /> {title} 추가
        </button>
      </div>
    </section>
  );
}
const hints = {
  root: '시스템을 선택하면 아래에서 만들 수 있는 도구를 볼 수 있습니다.',
  ec2: 'Docker와 Kubernetes를 배치할 실행 환경입니다.',
  docker: '서빙 앱을 실행할 이미지와 컨테이너를 준비합니다.',
  kubernetes: 'Pod의 실행과 요청 전달을 구성합니다.',
  start: '학습된 모델 파일과 리뷰 요청 10건을 각각의 출력 포트로 제공합니다.',
  end: '두 Pod의 응답 10건이 빠짐없이 도착했는지 확인합니다.',
  model: '학습과 평가를 마친 예제 모델을 제공합니다.',
  image: '서빙 앱과 의존성을 묶은 실행 자료입니다. Pod가 이 이미지로 컨테이너를 시작합니다.',
  deployment: 'Pod의 수와 사용할 이미지 버전을 지정합니다.',
  service: '요청을 연결된 대상에 순서대로 나눠 보냅니다.',
  pod: '이미지의 서빙 앱이 모델을 읽고 예측 응답을 만듭니다.',
  container: '이미지와 모델을 사용해 예제 요청을 처리합니다.',
};

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
  const locked = protectedKind(node.kind);
  const required = requiredLabEntities(graph.entities).has(node.id);
  const runnable = hasRunState(node.kind);
  const blocked = !runnable || node.enabled ? blockedBy(graph, node.id) : undefined;
  const children = descendants(graph, node.id);
  const parents = graph.entities.filter(
    (item) =>
      item.type === 'system' && tools[item.kind].includes(node.kind) && !children.has(item.id),
  );
  return (
    <>
      <header className={styles.inspectHeader}>
        <KindIcon kind={node.kind} size={21} />
        <div>
          <h3>{node.name}</h3>
          <small>
            {node.type === 'system' ? '시스템' : (resourceRoles[node.kind] ?? labels[node.kind])}
          </small>
        </div>
      </header>
      <p className={styles.hint}>{hints[node.kind]}</p>
      <fieldset className={styles.settings} disabled={busy}>
        {!locked && (
          <>
            <label>
              이름{' '}
              <input
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
            {runnable && (
              <div className={styles.settingLine}>
                <span>실행 상태</span>
                <button
                  type="button"
                  role="switch"
                  aria-label={node.name + ' 실행 상태'}
                  aria-checked={node.enabled}
                  onClick={() => dispatch({ type: 'toggle', id: node.id, enabled: !node.enabled })}
                >
                  {node.enabled ? '실행' : '정지'}
                </button>
              </div>
            )}
            {blocked && <p className={styles.hint}>{blocked} 정지로 차단</p>}
          </>
        )}
        {node.type === 'system' && !locked && (
          <button type="button" onClick={() => dispatch({ type: 'compact', id: node.id })}>
            <Minimize2 size={15} /> 크기 정리
          </button>
        )}
        {node.type === 'system' && (
          <div className={styles.settingLine}>
            <button
              type="button"
              onClick={() =>
                dispatch({ type: 'toggle', id: node.id, enabled: true, children: true })
              }
            >
              내부 일괄 실행
            </button>
            <button
              type="button"
              onClick={() =>
                dispatch({ type: 'toggle', id: node.id, enabled: false, children: true })
              }
            >
              내부 일괄 정지
            </button>
          </div>
        )}
        {!locked && (
          <>
            <label>
              소속 시스템
              <select
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
              </select>
            </label>
            {node.type === 'resource' && ['model', 'image', 'deployment'].includes(node.kind) && (
              <label>
                {node.kind === 'model' ? '모델 버전' : '이미지 태그'}
                <select
                  value={node.version}
                  onChange={(e) =>
                    dispatch({ type: 'settings', id: node.id, version: e.target.value as Version })
                  }
                >
                  <option value="v1">v1</option>
                  <option value="v2">v2</option>
                </select>
              </label>
            )}
            {node.type === 'resource' && node.kind === 'deployment' && (
              <label>
                원하는 Pod 수
                <select
                  value={node.replicas}
                  onChange={(e) =>
                    dispatch({ type: 'settings', id: node.id, replicas: Number(e.target.value) })
                  }
                >
                  {Array.from({ length: 10 }, (_, i) => (
                    <option key={i} value={i + 1}>
                      {i + 1}개
                    </option>
                  ))}
                </select>
              </label>
            )}
            {node.type === 'resource' && (
              <>
                <PortList node={node} graph={graph} direction="in" dispatch={dispatch} />
                <PortList node={node} graph={graph} direction="out" dispatch={dispatch} />
              </>
            )}
            {required ? (
              <p className={styles.hint}>실습에 필요한 항목입니다.</p>
            ) : (
              <button
                type="button"
                className={styles.danger}
                onClick={() => dispatch({ type: 'remove', id: node.id })}
              >
                <Trash2 size={15} />{' '}
                {node.type === 'system' ? '시스템과 내부 항목 삭제' : '노드 삭제'}
              </button>
            )}
          </>
        )}
        {node.id === rootId && (
          <p className={styles.hint}>설정할 노드나 시스템 영역을 선택하세요.</p>
        )}
      </fieldset>
    </>
  );
}
