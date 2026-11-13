import { ReactFlowProvider } from '@xyflow/react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Play,
  Plus,
  Redo2,
  RotateCcw,
  Square,
  Undo2,
} from 'lucide-react';
import { useEffect, useId, useRef, useState, type MouseEvent } from 'react';
import { resolveScenario } from '../weekly/scenarios';
import { Canvas, KindIcon, type MenuItem } from './Canvas';
import type { Command } from './commands';
import { runLab, type RunResult } from './engine';
import { Inspector } from './Inspector';
import {
  findPort,
  labels,
  materials,
  pilotLesson,
  rootId,
  serviceRoutes,
  signature,
  tools,
} from './model';
import { useSystemLab } from './store';
import styles from './SystemLab.module.css';

const question = resolveScenario(pilotLesson, {});
const panelSizes = [
  ['small', '작게'],
  ['medium', '중간'],
  ['large', '크게'],
] as const;
type PanelSize = (typeof panelSizes)[number][0];

function PanelSizes({
  panel,
  size,
  choose,
}: {
  panel: string;
  size: PanelSize;
  choose: (value: PanelSize) => void;
}) {
  return (
    <div className={styles.panelSizes} role="group" aria-label={panel + ' 폭'}>
      {panelSizes.map(([value, label]) => (
        <button
          key={value}
          type="button"
          aria-pressed={size === value}
          onClick={() => choose(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
interface Menu {
  x: number;
  y: number;
  items: MenuItem[];
}
export function SystemLab() {
  const {
    saved,
    past,
    future,
    warning,
    blocked,
    dispatch: commit,
    undo,
    redo,
    prove,
    quiz,
    recover,
  } = useSystemLab();
  const { graph } = saved;
  const stamp = signature(graph);
  const [selectedId, setSelected] = useState(rootId);
  const [selectedEdge, selectEdge] = useState('');
  const [settingsOpen, showSettings] = useState(() => matchMedia('(min-width: 901px)').matches);
  const [resultsOpen, showResults] = useState(false);
  const [resultsSize, setResultsSize] = useState<PanelSize>('medium');
  const [settingsSize, setSettingsSize] = useState<PanelSize>('medium');
  const [frontPanel, setFrontPanel] = useState<'results' | 'settings'>('settings');
  const [focused, setFocused] = useState(false);
  const workspaceShell = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = useState(false);
  const resultsVisible = resultsOpen && (!narrow || frontPanel === 'results' || !settingsOpen);
  const settingsVisible = settingsOpen && (!narrow || frontPanel === 'settings' || !resultsOpen);
  const resultsId = useId();
  const settingsId = useId();
  const [menu, setMenu] = useState<Menu | null>(null);
  const [run, setRun] = useState<{
    result: RunResult;
    stamp: string;
    cursor: number;
    stopped: boolean;
  } | null>(null);
  const [answer, setAnswer] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const menuBox = useRef<HTMLDivElement>(null);
  const selected =
    graph.entities.find((e) => e.id === selectedId) ?? graph.entities.find((e) => e.id === rootId)!;
  const active = run?.stamp === stamp ? run : null;
  const busy = !!active && !active.stopped && active.cursor < active.result.steps.length;
  const done = !!active && !busy && !active.stopped;
  const parent =
    selected.type === 'system' ? selected : graph.entities.find((e) => e.id === selected.parent);
  useEffect(() => {
    if (!busy || !active) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(
      () => {
        const cursor = active.cursor + 1;
        setRun({ ...active, cursor });
        if (cursor === active.result.steps.length) {
          showResults(true);
          setFrontPanel('results');
          if (active.result.success) prove(active.stamp);
        }
      },
      reduced ? 25 : 270,
    );
    return () => clearTimeout(timer);
  }, [active, busy, prove]);
  useEffect(() => {
    if (!menu) return;
    menuBox.current?.querySelector('button')?.focus();
    const close = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuBox.current?.contains(event.target)) setMenu(null);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [menu]);
  useEffect(() => {
    if (!workspaceShell.current) return;
    const observer = new ResizeObserver(([entry]) => setNarrow(entry.contentRect.width <= 900));
    observer.observe(workspaceShell.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!focused) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const close = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      setFocused(false);
    };
    window.addEventListener('keydown', close);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', close);
    };
  }, [focused]);
  const dispatch = (command: Command) => {
    if (busy) return false;
    const changed = commit(command);
    if (changed && signature(useSystemLab.getState().saved.graph) !== stamp) setRun(null);
    return changed;
  };
  const name = (id: string) => graph.entities.find((e) => e.id === id)?.name ?? id;
  const select = (id: string) => {
    setSelected(id);
  };
  const onMenu = (event: MouseEvent, items: MenuItem[]) => {
    event.preventDefault();
    event.stopPropagation();
    if (!busy && items.length)
      setMenu({
        x: Math.max(8, Math.min(event.clientX, window.innerWidth - 238)),
        y: Math.max(
          8,
          Math.min(event.clientY, window.innerHeight - Math.min(280, items.length * 39 + 16)),
        ),
        items,
      });
  };
  const start = () => {
    setMenu(null);
    const result = runLab(graph, crypto.randomUUID());
    setRun({ stamp, result, cursor: 0, stopped: false });
    if (!result.steps.length) {
      showResults(true);
      setFrontPanel('results');
    }
  };
  const chosenWire = [...graph.connections, ...serviceRoutes(graph)].find(
    (edge) => edge.id === selectedEdge,
  );
  const chosenMaterial = chosenWire && findPort(graph, chosenWire.from)?.material;
  const delivered = active?.result.steps
    .slice(0, active.cursor)
    .flatMap((step) => step.transfers)
    .find((transfer) => transfer.edge === selectedEdge);
  const completed = !!saved.proof && saved.quiz;
  return (
    <section
      className={styles.lab}
      data-focused={focused}
      aria-label="Docker·Kubernetes 시스템 실습"
      data-testid="system-lab"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          if (menu) event.preventDefault();
          setMenu(null);
          return;
        }
        if (
          busy ||
          !['Delete', 'Backspace'].includes(event.key) ||
          (event.target instanceof HTMLElement &&
            event.target.closest('input,select,textarea,button'))
        )
          return;
        if (selectedEdge) {
          dispatch({ type: 'disconnect', ids: [selectedEdge] });
          selectEdge('');
        } else dispatch({ type: 'remove', id: selected.id });
      }}
    >
      <header className={styles.toolbar}>
        <div className={styles.toolbarTitle}>
          <h2>모델 서빙 실습</h2>
          <p>
            이미지를 Kubernetes에 연결하고 Service 대상 라벨을 확인하세요. 두 Pod에 모델을 전달하고
            각 응답을 도착에 연결하세요.
          </p>
        </div>
        <div className={styles.actions}>
          <button type="button" aria-pressed={focused} onClick={() => setFocused(!focused)}>
            {focused ? <Minimize size={15} /> : <Maximize size={15} />}
            {focused ? '전체 화면 나가기' : '실습 전체 화면'}
          </button>
          {busy ? (
            <button
              type="button"
              className={styles.primary}
              onClick={() => {
                setRun({ ...active, stopped: true });
                showResults(true);
                setFrontPanel('results');
              }}
            >
              <Square size={15} /> 중단
            </button>
          ) : (
            <button type="button" className={styles.primary} onClick={start}>
              <Play size={16} /> 실습 실행
            </button>
          )}
          <button
            type="button"
            title="실행 취소"
            aria-label="실행 취소"
            disabled={busy || !past.length}
            onClick={() => {
              setRun(null);
              undo();
            }}
          >
            <Undo2 size={16} />
          </button>
          <button
            type="button"
            title="다시 실행"
            aria-label="다시 실행"
            disabled={busy || !future.length}
            onClick={() => {
              setRun(null);
              redo();
            }}
          >
            <Redo2 size={16} />
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setRun(null);
              setSelected(rootId);
              dispatch({ type: 'restore' });
            }}
          >
            <RotateCcw size={15} /> 초기 복원
          </button>
        </div>
      </header>
      {blocked && (
        <div className={styles.notice} role="alert">
          저장 데이터를 읽지 못했습니다. 원본을 보존했습니다.
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (window.confirm('이 실습의 저장을 초기화할까요?')) {
                setRun(null);
                recover();
              }
            }}
          >
            저장 초기화
          </button>
        </div>
      )}
      {warning && (
        <p className={styles.notice} role="alert">
          {warning}
        </p>
      )}
      <div ref={workspaceShell} className={styles.workspaceShell}>
        <div
          className={styles.workspace}
          data-settings={settingsVisible}
          data-results={resultsVisible}
          data-results-size={resultsSize}
          data-settings-size={settingsSize}
        >
          <aside className={styles.results} aria-label="실행 결과">
            <header className={styles.panelHeader}>
              {resultsVisible && <h3>실행 결과</h3>}
              <button
                className={styles.panelToggle}
                type="button"
                aria-expanded={resultsVisible}
                aria-controls={resultsId}
                aria-label={resultsVisible ? '실행 결과 접기' : '실행 결과 펼치기'}
                title={resultsVisible ? '실행 결과 접기' : '실행 결과 펼치기'}
                onClick={() => {
                  showResults(!resultsVisible);
                  setFrontPanel(resultsVisible ? 'settings' : 'results');
                }}
              >
                {resultsVisible ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
              </button>
              <span className={styles.railLabel} aria-hidden="true">
                실행 결과
              </span>
            </header>
            <div id={resultsId} className={styles.panelBody} data-open={resultsVisible}>
              {resultsVisible && (
                <PanelSizes panel="실행 결과" size={resultsSize} choose={setResultsSize} />
              )}
              <span
                className={styles.resultStatus}
                role="status"
                data-tone={
                  done
                    ? active.result.success
                      ? 'success'
                      : 'error'
                    : saved.proof && !active
                      ? 'success'
                      : undefined
                }
              >
                {busy
                  ? '실행 중 · ' + active.cursor + ' / ' + active.result.steps.length
                  : active?.stopped
                    ? '실행 중단'
                    : done
                      ? active.result.message
                      : saved.proof
                        ? '현재 구성 실행 성공'
                        : '실행 대기'}
              </span>
              {resultsVisible && (
                <div className={styles.resultsBody}>
                  {active && (
                    <ol className={styles.trace}>
                      {active.result.steps.slice(0, active.cursor).map((step) => (
                        <li key={step.node} data-status={step.status}>
                          <strong>{name(step.node)}</strong> <span>{step.message}</span>
                          {step.transfers.length > 0 && (
                            <ul>
                              {step.transfers.map((t) => (
                                <li key={t.edge}>
                                  {name(t.to)} · {t.description}
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                  {done && active.result.responses.length > 0 && (
                    <details>
                      <summary>요청별 응답 {active.result.responses.length}건</summary>
                      <ul className={styles.responses}>
                        {[...active.result.responses]
                          .sort((a, b) => a.id - b.id)
                          .map((r, i) => (
                            <li key={i}>
                              <span>요청 {r.id}</span> <strong>{r.label}</strong>{' '}
                              <span>{name(r.pod)}</span>
                            </li>
                          ))}
                      </ul>
                    </details>
                  )}
                  {!active && !saved.proof && (
                    <p className={styles.hint}>
                      실습을 실행하면 자료가 어디에서 처리됐는지 확인할 수 있습니다.
                    </p>
                  )}
                  {saved.proof && (
                    <fieldset className={styles.quiz} disabled={busy}>
                      <legend>이해 확인</legend>
                      <p>{question.question}</p>
                      {question.options.map((option, i) => (
                        <label key={option}>
                          <input
                            type="radio"
                            name="system-lab-quiz"
                            checked={(answer ?? (saved.quiz ? 0 : null)) === i}
                            onChange={() => {
                              setAnswer(i);
                              setChecked(false);
                              quiz(false);
                            }}
                          />{' '}
                          {option}
                        </label>
                      ))}
                      <button
                        type="button"
                        disabled={answer === null}
                        onClick={() => {
                          quiz(answer === 0);
                          setChecked(true);
                        }}
                      >
                        정답 확인
                      </button>
                      {(checked || completed) && (
                        <p role="status">
                          {completed ? '실습 완료. ' : '다시 생각해 보세요. '}
                          {question.explanation}
                        </p>
                      )}
                    </fieldset>
                  )}
                </div>
              )}
            </div>
          </aside>
          <div className={styles.board}>
            <div className={styles.palette} aria-label="시스템 도구">
              <div className={styles.paletteLabel}>
                <strong>{parent?.name} 도구</strong>
              </div>
              {parent?.type === 'system' &&
                tools[parent.kind].map((kind) => (
                  <button
                    key={kind}
                    data-kind={kind}
                    type="button"
                    disabled={busy}
                    title={labels[kind] + ' 추가'}
                    aria-label={labels[kind] + ' 추가'}
                    onClick={() => {
                      const id = crypto.randomUUID();
                      if (dispatch({ type: 'add', id, kind, parent: parent.id })) select(id);
                    }}
                  >
                    <KindIcon kind={kind} /> {labels[kind]} <Plus size={14} />
                  </button>
                ))}
              {chosenWire && chosenMaterial && (
                <span role="status">
                  {name(chosenWire.from.node)} → {name(chosenWire.to.node)} ·{' '}
                  {materials[chosenMaterial]}
                  {delivered && ' · ' + delivered.description}
                </span>
              )}
              {selectedEdge && graph.connections.some((e) => e.id === selectedEdge) && (
                <button
                  type="button"
                  className={styles.danger}
                  disabled={busy}
                  onClick={() => {
                    dispatch({ type: 'disconnect', ids: [selectedEdge] });
                    selectEdge('');
                  }}
                >
                  선택한 연결 삭제
                </button>
              )}
            </div>
            <ReactFlowProvider>
              <Canvas
                graph={graph}
                selected={selected.id}
                select={select}
                dispatch={dispatch}
                editable={!busy}
                run={active?.result ?? null}
                cursor={active?.cursor ?? 0}
                onMenu={onMenu}
                clearMenu={() => setMenu(null)}
                selectedEdge={selectedEdge}
                selectEdge={selectEdge}
              />
            </ReactFlowProvider>
          </div>
          <aside className={styles.inspector} aria-label="항목 설정">
            <header className={styles.panelHeader}>
              <button
                className={styles.panelToggle}
                type="button"
                aria-expanded={settingsVisible}
                aria-controls={settingsId}
                aria-label={settingsVisible ? '설정 접기' : '설정 펼치기'}
                title={settingsVisible ? '설정 접기' : '설정 펼치기'}
                onClick={() => {
                  showSettings(!settingsVisible);
                  setFrontPanel(settingsVisible ? 'results' : 'settings');
                }}
              >
                {settingsVisible ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>
              {settingsVisible && <h3>설정</h3>}
              <span className={styles.railLabel} aria-hidden="true">
                설정
              </span>
            </header>
            <div
              id={settingsId}
              className={styles.panelBody}
              data-open={settingsVisible}
              hidden={!settingsVisible}
            >
              {settingsVisible && (
                <PanelSizes panel="설정" size={settingsSize} choose={setSettingsSize} />
              )}
              {settingsVisible && (
                <div className={styles.inspectBody}>
                  <Inspector
                    key={selected.id}
                    node={selected}
                    graph={graph}
                    busy={busy}
                    dispatch={dispatch}
                  />
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
      {menu && (
        <div
          ref={menuBox}
          className={styles.contextMenu}
          role="group"
          aria-label="연결 작업"
          style={{ left: menu.x, top: menu.y }}
        >
          {menu.items.map((item) => (
            <button
              key={item.ids.join(',')}
              type="button"
              onClick={() => {
                dispatch({ type: 'disconnect', ids: item.ids });
                setMenu(null);
                selectEdge('');
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
