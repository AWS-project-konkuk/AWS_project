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
import { Button } from '../components/ui/button';
import { cn } from '../components/ui/styles';
import { divider, hint, kindColor, panel, panelBody } from './appearance';

const question = resolveScenario(pilotLesson, {});
const panelSizes = [
  ['small', '작게'],
  ['medium', '중간'],
  ['large', '크게'],
] as const;
type PanelSize = (typeof panelSizes)[number][0];

const panelHeader =
  'group/panel flex min-h-11 shrink-0 items-center justify-center gap-2 p-1 has-[h3]:justify-between has-[h3]:pr-1 has-[h3]:pl-2.5 not-has-[h3]:flex-col not-has-[h3]:gap-1 [&_h3]:m-0 [&_h3]:flex-1 [&_h3]:text-sm @max-[901px]:flex-col @max-[901px]:gap-1 @max-[901px]:justify-center @max-[901px]:px-1 @max-[901px]:[&_h3]:hidden';
const railLabel =
  'hidden text-center text-[11px] leading-[1.2] font-[650] break-keep group-not-has-[h3]/panel:block @max-[901px]:block';
const panelOverlay =
  '@max-[901px]:data-[open=true]:absolute @max-[901px]:data-[open=true]:inset-y-0 @max-[901px]:data-[open=true]:z-6 @max-[901px]:data-[open=true]:w-[min(var(--panel-width),calc(100%-2*var(--rail-width)))] @max-[901px]:data-[open=true]:bg-ui-paper';

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
    <div
      className={cn(divider, 'sticky top-0 z-1 grid grid-cols-3 gap-1 bg-ui-paper px-2.5 py-1.5')}
      role="group"
      aria-label={panel + ' 폭'}
    >
      {panelSizes.map(([value, label]) => (
        <Button
          key={value}
          type="button"
          size="small"
          className="aria-pressed:border-ui-accent aria-pressed:bg-ui-accent-wash aria-pressed:text-ui-accent aria-pressed:font-bold!"
          aria-pressed={size === value}
          onClick={() => choose(value)}
        >
          {label}
        </Button>
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
      className="group/lab flex min-h-full w-full min-w-0 flex-1 flex-col bg-ui-paper text-sm text-ui-ink data-[focused=true]:fixed data-[focused=true]:inset-0 data-[focused=true]:z-(--z-modal) data-[focused=true]:h-dvh data-[focused=true]:overflow-auto [--lab-request:var(--color-accent)] [--lab-prediction:var(--color-success)] [--lab-model:light-dark(#815098,#dcb4f1)] [--lab-image:light-dark(#895b23,#f0c68e)] [--lab-control:light-dark(#356978,#a4dbe3)]"
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
      <header
        className={cn(
          divider,
          'flex flex-wrap items-center justify-between gap-x-[18px] gap-y-2.5 px-[18px] py-3.5 group-data-[focused=true]/lab:py-2 max-[540px]:px-2.5',
        )}
      >
        <div className="min-w-0 flex-[1_1_440px] [&_h2]:m-0 [&_h2]:text-xl [&_h2]:tracking-[-0.02em] [&_p]:mt-[3px] [&_p]:mb-0 [&_p]:break-keep [&_p]:text-ui-muted [&_p]:[overflow-wrap:anywhere] group-data-[focused=true]/lab:[&_p]:hidden">
          <h2>모델 서빙 실습</h2>
          <p>
            이미지는 Kubernetes에, 요청은 내부 Service에 연결하세요. 두 Pod에 모델을 전달하고 각
            응답을 도착에 연결하세요.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button type="button" aria-pressed={focused} onClick={() => setFocused(!focused)}>
            {focused ? <Minimize size={15} /> : <Maximize size={15} />}
            {focused ? '전체 화면 나가기' : '실습 전체 화면'}
          </Button>
          {busy ? (
            <Button
              type="button"
              variant="default"
              onClick={() => {
                setRun({ ...active, stopped: true });
                showResults(true);
                setFrontPanel('results');
              }}
            >
              <Square size={15} /> 중단
            </Button>
          ) : (
            <Button type="button" variant="default" onClick={start}>
              <Play size={16} /> 실습 실행
            </Button>
          )}
          <Button
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
          </Button>
          <Button
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
          </Button>
          <Button
            type="button"
            disabled={busy}
            onClick={() => {
              setRun(null);
              setSelected(rootId);
              dispatch({ type: 'restore' });
            }}
          >
            <RotateCcw size={15} /> 초기 복원
          </Button>
        </div>
      </header>
      {blocked && (
        <div
          className="m-0 bg-ui-paper-2 px-[18px] py-2 text-ui-error [&>button]:ml-2.5"
          role="alert"
        >
          저장 데이터를 읽지 못했습니다. 원본을 보존했습니다.
          <Button
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
          </Button>
        </div>
      )}
      {warning && (
        <p
          className="m-0 bg-ui-paper-2 px-[18px] py-2 text-ui-error [&>button]:ml-2.5"
          role="alert"
        >
          {warning}
        </p>
      )}
      <div ref={workspaceShell} className="@container flex min-h-0 flex-1 flex-col">
        <div
          className="relative grid min-w-0 flex-1 grid-cols-[var(--results-width)_minmax(0,1fr)_var(--settings-width)] grid-rows-[minmax(0,1fr)] [--rail-width:44px] [--panel-small:208px] [--panel-medium:260px] [--panel-large:min(360px,34cqi)] [--results-size:var(--panel-medium)] [--settings-size:var(--panel-medium)] [--results-width:var(--rail-width)] [--settings-width:var(--rail-width)] data-[results=true]:[--results-width:var(--results-size)] data-[settings=true]:[--settings-width:var(--settings-size)] data-[results-size=small]:[--results-size:var(--panel-small)] data-[results-size=large]:[--results-size:var(--panel-large)] data-[settings-size=small]:[--settings-size:var(--panel-small)] data-[settings-size=large]:[--settings-size:var(--panel-large)] @max-[901px]:grid-cols-[var(--rail-width)_minmax(0,1fr)_var(--rail-width)] @max-[901px]:[--panel-large:360px]"
          data-settings={settingsVisible}
          data-results={resultsVisible}
          data-results-size={resultsSize}
          data-settings-size={settingsSize}
        >
          <aside
            className={cn(panel, 'border-0 border-r border-solid border-ui-rule')}
            aria-label="실행 결과"
          >
            <header className={cn(divider, panelHeader)}>
              {resultsVisible && <h3>실행 결과</h3>}
              <Button
                size="icon"
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
              </Button>
              <span className={railLabel} aria-hidden="true">
                실행 결과
              </span>
            </header>
            <div
              id={resultsId}
              className={cn(
                panelBody,
                panelOverlay,
                'data-[open=false]:sr-only @max-[901px]:left-(--rail-width) @max-[901px]:border-0 @max-[901px]:border-r @max-[901px]:border-solid @max-[901px]:border-ui-rule-2 [--panel-width:var(--results-size)]',
              )}
              data-open={resultsVisible}
            >
              {resultsVisible && (
                <PanelSizes panel="실행 결과" size={resultsSize} choose={setResultsSize} />
              )}
              <span
                className="block p-3 text-[13px] text-ui-ink-2 [overflow-wrap:anywhere] data-[tone=success]:text-ui-success data-[tone=error]:text-ui-error"
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
                <div className="grid gap-[9px] px-3 pt-1 pb-4">
                  {active && (
                    <ol className="my-0 grid list-decimal gap-[7px] pl-5 [&>li]:marker:text-ui-muted [&>li[data-status=success]_strong]:text-ui-success [&>li[data-status=failed]_strong]:text-ui-error [&>li[data-status=blocked]_strong]:text-ui-error [&_ul]:pl-4 [&_ul]:text-xs [&_ul]:text-ui-muted">
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
                      <ul className="my-2 list-none p-0 [&_li]:flex [&_li]:gap-2.5 [&_li]:border-0 [&_li]:border-b [&_li]:border-solid [&_li]:border-ui-rule [&_li]:p-1">
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
                    <p className={hint}>
                      실습을 실행하면 자료가 어디에서 처리됐는지 확인할 수 있습니다.
                    </p>
                  )}
                  {saved.proof && (
                    <fieldset
                      className="m-0 grid min-w-0 gap-[7px] border-0 border-t border-solid border-ui-rule p-0 pt-[7px] [&_legend]:font-bold [&_p]:my-1 [&_label]:leading-normal [&_button]:justify-self-start"
                      disabled={busy}
                    >
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
                      <Button
                        type="button"
                        disabled={answer === null}
                        onClick={() => {
                          quiz(answer === 0);
                          setChecked(true);
                        }}
                      >
                        정답 확인
                      </Button>
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
          <div className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)]">
            <div
              className={cn(
                divider,
                'flex flex-wrap items-center gap-1.5 px-3.5 py-2.5 max-[540px]:px-2',
              )}
              aria-label="시스템 도구"
            >
              <div className="mr-1.5 grid max-[540px]:w-full">
                <strong>{parent?.name} 도구</strong>
              </div>
              {parent?.type === 'system' &&
                tools[parent.kind].map((kind) => (
                  <Button
                    key={kind}
                    data-kind={kind}
                    className={cn(
                      kindColor[kind],
                      'border-[color:color-mix(in_srgb,var(--kind-color)_32%,var(--color-rule))] bg-[color-mix(in_srgb,var(--kind-color)_10%,var(--color-paper))] enabled:hover:bg-[color-mix(in_srgb,var(--kind-color)_18%,var(--color-paper))]',
                    )}
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
                  </Button>
                ))}
              {chosenWire && chosenMaterial && (
                <span role="status">
                  {name(chosenWire.from.node)} → {name(chosenWire.to.node)} ·{' '}
                  {materials[chosenMaterial]}
                  {delivered && ' · ' + delivered.description}
                </span>
              )}
              {selectedEdge && graph.connections.some((e) => e.id === selectedEdge) && (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={busy}
                  onClick={() => {
                    dispatch({ type: 'disconnect', ids: [selectedEdge] });
                    selectEdge('');
                  }}
                >
                  선택한 연결 삭제
                </Button>
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
          <aside
            className={cn(panel, 'border-0 border-l border-solid border-ui-rule')}
            aria-label="항목 설정"
          >
            <header className={cn(divider, panelHeader)}>
              <Button
                size="icon"
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
              </Button>
              {settingsVisible && <h3>설정</h3>}
              <span className={railLabel} aria-hidden="true">
                설정
              </span>
            </header>
            <div
              id={settingsId}
              className={cn(
                panelBody,
                panelOverlay,
                '@max-[901px]:right-(--rail-width) @max-[901px]:border-0 @max-[901px]:border-l @max-[901px]:border-solid @max-[901px]:border-ui-rule-2 [--panel-width:var(--settings-size)]',
              )}
              data-open={settingsVisible}
              hidden={!settingsVisible}
            >
              {settingsVisible && (
                <PanelSizes panel="설정" size={settingsSize} choose={setSettingsSize} />
              )}
              {settingsVisible && (
                <div className="p-[13px]">
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
          className="fixed z-[900] grid max-h-[280px] min-w-40 max-w-[230px] gap-1 overflow-auto rounded-[7px] border border-solid border-ui-rule-2 bg-ui-paper p-1.5 shadow-[0_6px_20px_#0002] [&_button]:justify-start [&_button]:overflow-hidden [&_button]:text-ellipsis"
          role="group"
          aria-label="연결 작업"
          style={{ left: menu.x, top: menu.y }}
        >
          {menu.items.map((item) => (
            <Button
              key={item.ids.join(',')}
              type="button"
              onClick={() => {
                dispatch({ type: 'disconnect', ids: item.ids });
                setMenu(null);
                selectEdge('');
              }}
            >
              {item.label}
            </Button>
          ))}
        </div>
      )}
    </section>
  );
}
