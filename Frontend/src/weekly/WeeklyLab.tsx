import { ResultFeedback } from '../learning/ResultFeedback';
import { CheckCircle2, CircleAlert, ChevronLeft, ChevronRight } from 'lucide-react';
import { validInputs } from '../activities/simulation';
import { useEffect, useRef, useState, type RefObject } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MarkerType,
  useReactFlow,
  type Connection,
} from '@xyflow/react';
import { useInView, useReducedMotion } from 'motion/react';
import type { Lesson, LabState } from '../curriculum/types';
import { evaluateGoals } from '../curriculum/engine';
import { useLearning } from '../learning/LearningStore';
import { getLab } from '../learning/blockProgress';
import { Fields } from '../activities/Fields';
import { resolveScenario } from './scenarios';
import { TransferEdge, type TransferFlowEdge } from './TransferEdge';
import { WorkflowNode, type BoardNode } from './WorkflowNode';
import {
  workflowEdge,
  workflowSignature,
  workflowIssues,
  runWorkflow,
  workflowHistory,
  portName,
} from './engine';
import type { Run } from './types';
import styles from './Weekly.module.css';
import { applyWorkflowPreset } from './presets';
const nodeTypes = { workflow: WorkflowNode };
const edgeTypes = { transfer: TransferEdge };
function Camera({
  selected,
  ids,
  container,
}: {
  selected: string;
  ids: string;
  container: RefObject<HTMLDivElement | null>;
}) {
  const { getNode, setCenter, fitView } = useReactFlow();
  const reduced = useReducedMotion();
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let frame = 0;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width < 100 || entry.contentRect.height < 100) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        void fitView({ padding: 0.15, maxZoom: 1 });
      });
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [ids, fitView, container]);
  useEffect(() => {
    const n = getNode(selected);
    if (!selected) {
      void fitView({ padding: 0.15, maxZoom: 1 });
      return;
    }
    if (n)
      void setCenter(n.position.x + 115, n.position.y + 80, {
        zoom: 1,
        duration: reduced ? 0 : 250,
      });
  }, [selected, getNode, setCenter, reduced, fitView]);
  return null;
}
export function WeeklyLab({ lesson }: { lesson: Lesson }) {
  const { state, edit, resetLesson } = useLearning();
  const lab = getLab(state.data, lesson.id),
    spec = resolveScenario(lesson.id, lab.answers),
    signature = workflowSignature(lab);
  const [execution, setExecution] = useState<{ run: Run; cursor: number; playing: boolean } | null>(
      null,
    ),
    [selected, setSelected] = useState(''),
    [cameraTarget, setCameraTarget] = useState(''),
    [selectedEdge, setSelectedEdge] = useState(''),
    [from, setFrom] = useState(''),
    [to, setTo] = useState(''),
    [showIssues, setShowIssues] = useState(false),
    [message, setMessage] = useState(''),
    [tab, setTab] = useState<'trace' | 'settings' | 'connections'>('trace');
  const [messageTone, setMessageTone] = useState<'success' | 'error' | 'info'>('info');
  const [messageVersion, setMessageVersion] = useState(0);
  const announceMessage = (text: string, tone: 'success' | 'error' | 'info' = 'info') => {
    setMessage(text);
    setMessageTone(tone);
    setMessageVersion((value) => value + 1);
  };
  const [previousPreset, setPreviousPreset] = useState<LabState | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [canvasHeight, setCanvasHeight] = useState(720);
  const detailsId = `workflow-details-${lesson.id}`;
  useEffect(() => {
    if (!focused) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFocused(false);
    };
    window.addEventListener('keydown', escape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', escape);
    };
  }, [focused]);
  const [hidden, setHidden] = useState(() => document.hidden);
  const reduced = Boolean(useReducedMotion());
  const root = useRef<HTMLElement>(null);
  const canvasRoot = useRef<HTMLDivElement>(null);
  const inView = useInView(root, { amount: 0.1 });
  const current = execution?.run.signature === signature ? execution : null;
  const issues = workflowIssues(spec, lab),
    history = workflowHistory(lab.answers);
  const goals = evaluateGoals(lesson, lab),
    ready = goals.every((g) => g.passed);
  // 실행 전 미리보기와 실행 후 탐색 모두 동일한 위상 실행 순서를 쓴다.
  const stageNodes = (current?.run ?? runWorkflow(lesson.id, lab)).stages
    .map((stage) => spec.nodes.find((node) => node.id === stage.node))
    .filter((node): node is NonNullable<typeof node> => Boolean(node));
  const openCompletion = () => {
    setDetailsOpen(true);
    requestAnimationFrame(() => {
      const target = document
        .getElementById(detailsId)
        ?.querySelector<HTMLElement>('[data-tour="goals"]');
      target?.scrollIntoView({ block: 'center', behavior: 'instant' });
      target?.focus({ preventScroll: true });
    });
  };
  const inspect = spec.nodes.find((n) => n.id === selected);
  const selectedStage = current?.run.stages
    .slice(0, current.cursor + 1)
    .find((s) => s.node === selected);
  const latestFailure = [...history].reverse().find((h) => h.diagnostic && !h.success),
    latestSuccess = [...history].reverse().find((h) => h.success);
  const record = (run: Run) => {
    const domainFailure =
      validInputs({ fields: spec.fields }, lab.answers) &&
      run.stages.some(
        (s) => s.status === 'failed' && !workflowIssues(spec, lab).some((i) => i.node === s.node),
      );
    edit(
      lesson.id,
      (c) => ({
        ...c,
        attempts: c.attempts + 1,
        answers: {
          ...c.answers,
          _workflowHistory: JSON.stringify(
            [
              ...workflowHistory(c.answers).filter((h) => h.signature !== run.signature),
              {
                signature: run.signature,
                success: run.success,
                diagnostic: domainFailure,
                metrics: run.metrics,
              },
            ].slice(-8),
          ),
        },
      }),
      false,
    );
  };
  const recordRef = useRef(record);
  recordRef.current = record;
  useEffect(() => {
    const update = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  useEffect(() => {
    if (!current?.playing || hidden || reduced || !inView) return;
    const timer = setTimeout(() => {
      const next = Math.min(current.cursor + 1, current.run.stages.length - 1);
      setExecution({ ...current, cursor: next, playing: next < current.run.stages.length - 1 });
      setSelected(current.run.stages[next]?.node ?? '');
      if (next === current.run.stages.length - 1) recordRef.current(current.run);
    }, 1600);
    return () => clearTimeout(timer);
  }, [current, hidden, reduced, inView]);
  const change = (fn: (c: LabState) => LabState, semantic = true) => {
    edit(lesson.id, fn, semantic);
    if (semantic) {
      setExecution(null);
      announceMessage('구성이 바뀌어 이전 실행을 중단했습니다. 다시 실행해 비교하세요.');
    }
  };
  const connect = (connection: Connection) => {
    const e = workflowEdge({
      source: connection.source,
      sourceHandle: connection.sourceHandle ?? '',
      target: connection.target,
      targetHandle: connection.targetHandle ?? '',
    });
    if (lab.edges.some((v) => v.id === e.id)) {
      announceMessage('이미 같은 포트가 연결되어 있습니다.');
      return;
    }
    change((c) => ({ ...c, edges: [...c.edges, e] }));
  };
  const start = (playing: boolean) => {
    const run = runWorkflow(lesson.id, lab);
    setExecution({ run, cursor: 0, playing: playing && !reduced });
    setCameraTarget('');
    setSelected(run.stages[0]?.node ?? '');
    setTab('trace');
    setShowIssues(false);
    announceMessage('');
    if (run.stages.length === 1) record(run);
  };
  const next = () => {
    if (!current) return;
    const cursor = Math.min(current.cursor + 1, current.run.stages.length - 1);
    setExecution({ ...current, cursor, playing: false });
    setSelected(current.run.stages[cursor]?.node ?? '');
    if (cursor === current.run.stages.length - 1) record(current.run);
  };
  const currentTrace = current?.run.stages[current.cursor];
  const nodes: BoardNode[] = spec.nodes
    .filter((n) => lab.activeNodes?.includes(n.id))
    .map((n, i) => ({
      id: n.id,
      type: 'workflow',
      position: lab.nodes.find((v) => v.id === n.id)?.position ?? { x: n.x, y: n.y },
      selected: n.id === selected,
      data: {
        stage: n,
        order: i,
        status:
          current?.playing && currentTrace?.node === n.id
            ? 'active'
            : (current?.run.stages.slice(0, current.cursor + 1).find((s) => s.node === n.id)
                ?.status ?? 'waiting'),
      },
    }));
  const edges: TransferFlowEdge[] = lab.edges.map((e) => {
    const sourceIndex = current?.run.stages.findIndex((stage) => stage.node === e.source) ?? -1;
    const targetIndex = current?.run.stages.findIndex((stage) => stage.node === e.target) ?? -1;
    const producer = current?.run.stages[sourceIndex];
    const receiver = current?.run.stages[targetIndex];
    const artifact = producer?.outputs.find((output) => output.port === e.sourceHandle);
    const available =
      !!current &&
      sourceIndex >= 0 &&
      sourceIndex < current.cursor &&
      !!artifact &&
      producer?.status === 'success' &&
      receiver?.status !== 'blocked';
    const transferring = available && currentTrace?.node === e.target;
    return {
      ...e,
      type: 'transfer',
      animated: false,
      label: portName(spec, e.source, e.sourceHandle ?? '', 'out')?.label ?? '출력 포트 확인',
      selected: e.id === selectedEdge,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: 'var(--soft)', strokeWidth: 1.5 },
      labelStyle: { fill: 'var(--text)', fontSize: 11 },
      labelBgStyle: { fill: 'var(--panel)' },
      data: {
        transferring,
        delivered: available && targetIndex < current!.cursor,
        animate: transferring && !!current?.playing && !reduced && !hidden && inView,
        artifact: artifact?.name ?? '',
        content: artifact?.content ?? '',
      },
    };
  });
  return (
    <section
      ref={root}
      className={styles.lab}
      data-focused={focused}
      aria-label="단원 종합 워크플로"
    >
      <header className={styles.mission}>
        <details>
          <summary>실습 과제 · {lesson.title}</summary>
          <strong>{spec.problem}</strong>
          <p>{spec.task}</p>
        </details>
        <div className={styles.workspaceActions}>
          <button onClick={openCompletion}>완료 조건 보기</button>
          <button
            aria-expanded={detailsOpen}
            aria-controls={detailsId}
            onClick={() => setDetailsOpen((value) => !value)}
          >
            {detailsOpen ? '설정·결과 닫기' : '설정·결과 열기'}
          </button>
          <button aria-pressed={focused} onClick={() => setFocused((value) => !value)}>
            {focused ? '전체 화면 나가기' : '실습 전체 화면'}
          </button>
        </div>
      </header>
      <div className={styles.tools} aria-label="실습 단계">
        {!focused && (
          <label className={styles.heightControl}>
            캔버스 높이
            <input
              aria-label="캔버스 높이"
              type="range"
              min={480}
              max={1440}
              step={80}
              value={canvasHeight}
              onChange={(event) => setCanvasHeight(Number(event.target.value))}
            />
            <output>{canvasHeight}px</output>
          </label>
        )}
        <button
          onClick={() => {
            setPreviousPreset(structuredClone(lab));
            change((c) => applyWorkflowPreset(lesson.id, c, 'example'));
            announceMessage(
              '1. 실행 가능한 연결과 설정을 불러왔습니다. 전체 실행하며 단계별 입력과 출력을 추적하세요.',
            );
          }}
        >
          1. 예시 흐름 추적
        </button>
        <button
          onClick={() => {
            setPreviousPreset(structuredClone(lab));
            change((c) => applyWorkflowPreset(lesson.id, c, 'repair'));
            announceMessage(
              '2. 처음 실습과 같은 일부 연결과 기본 설정을 불러왔습니다. 빠진 연결을 구성하고 잘못된 설정을 수정하세요.',
            );
          }}
        >
          2. 잘못된 구성 수정
        </button>
        <button
          onClick={() => {
            setPreviousPreset(structuredClone(lab));
            change((c) => applyWorkflowPreset(lesson.id, c, 'new'));
            announceMessage(
              '3. 요구 조건을 만족하는 경로를 직접 구성하세요. 두 가지 설정을 비교하고 왜 결과가 다른지 설명하세요.',
            );
          }}
        >
          3. 새로운 상황 구성
        </button>
        {previousPreset && (
          <button
            onClick={() => {
              const snapshot = previousPreset;
              change((c) => ({
                ...snapshot,
                attempts: c.attempts,
                answers: {
                  ...snapshot.answers,
                  _workflowHistory:
                    c.answers._workflowHistory ?? snapshot.answers._workflowHistory ?? '[]',
                },
              }));
              setPreviousPreset(null);
              announceMessage(
                '과제를 바꾸기 전 연결과 설정을 복원했습니다. 다시 실행해 결과를 확인하세요.',
              );
            }}
          >
            직전 구성 되돌리기
          </button>
        )}
      </div>
      <p className={styles.presetNotice} hidden={focused}>
        과제를 불러오면 현재 연결과 설정이 교체됩니다. 직전 구성은 되돌릴 수 있습니다.
      </p>
      {!focused && (
        <details className={styles.completionGuide}>
          <summary>
            완료 조건 {goals.filter((goal) => goal.passed).length}/{goals.length}:{' '}
            {goals.find((goal) => !goal.passed)?.label ?? '모든 조건 충족'}
          </summary>
          <ol>
            {goals.map((goal) => (
              <li key={goal.id}>
                {goal.passed ? '완료' : '남음'}: {goal.label}
              </li>
            ))}
          </ol>
          <button onClick={openCompletion}>완료 문항과 목표 확인하기</button>
        </details>
      )}
      <div className={styles.tools} data-testid="weekly-run">
        <button
          onClick={() => {
            setShowIssues(true);
            announceMessage(
              issues.length
                ? `${issues.length}개 연결 조건을 확인하세요.`
                : '포트 연결 조건을 충족했습니다. 실행 조건도 확인하세요.',
              issues.length ? 'error' : 'success',
            );
          }}
        >
          연결 검사
        </button>
        <button onClick={() => start(false)}>단계 실행</button>
        <button onClick={() => start(true)}>전체 실행</button>
        <button
          onClick={next}
          disabled={!current || current.cursor >= current.run.stages.length - 1}
        >
          다음 단계
        </button>
        <button
          onClick={() => setExecution((c) => (c ? { ...c, playing: false } : c))}
          disabled={!current?.playing}
        >
          일시정지
        </button>
        <button
          onClick={() => {
            setExecution(null);
            announceMessage('실행을 중단했습니다. 관찰이 끝난 비교 기록은 유지합니다.');
          }}
        >
          중단
        </button>
        <button
          onClick={() => {
            if (confirm('이 주차의 연결·설정·비교 기록을 처음 구성으로 되돌릴까요?')) {
              resetLesson(lesson.id);
              setExecution(null);
              setSelected('');
            }
          }}
        >
          처음 구성
        </button>
        <span>
          {reduced
            ? '동작 줄이기 · 다음 단계로 관찰'
            : current
              ? `${current.cursor + 1} / ${current.run.stages.length} 단계`
              : '실제 인프라 실행 없음'}
        </span>
      </div>
      {currentTrace && (
        <div
          key={`${signature}-${current!.cursor}`}
          className={styles.transferStatus}
          data-result={currentTrace.status}
          role="status"
          aria-label="현재 데이터 흐름"
        >
          {currentTrace.status === 'success' ? (
            <CheckCircle2 size={20} aria-hidden="true" />
          ) : (
            <CircleAlert size={20} aria-hidden="true" />
          )}
          <strong>
            {currentTrace.status === 'success'
              ? '단계 성공: '
              : currentTrace.status === 'failed'
                ? '단계 실패: '
                : '후속 차단: '}
            {current!.cursor + 1}/{current!.run.stages.length} · {currentTrace.title}
          </strong>
          <span>
            {currentTrace.status === 'blocked'
              ? '상위 단계 실패 · 전달할 출력 없음'
              : currentTrace.inputs.length
                ? currentTrace.inputs.map((input) => `${input.from} → ${input.name}`).join(' / ')
                : '시작 자료 준비'}
          </span>
          <small>
            {currentTrace.status === 'failed'
              ? `실패 · ${currentTrace.reason}`
              : currentTrace.status === 'blocked'
                ? currentTrace.reason
                : currentTrace.outputs.map((output) => output.name).join(' · ')}
          </small>
        </div>
      )}
      {message && messageTone === 'info' && !detailsOpen && (
        <p className={styles.workspaceNotice} role="status">
          {message}
        </p>
      )}
      {message && messageTone !== 'info' && !detailsOpen && (
        <ResultFeedback
          key={messageVersion}
          tone={messageTone}
          title={messageTone === 'success' ? '연결 확인 성공' : '연결 확인 실패'}
        >
          {message}
        </ResultFeedback>
      )}
      <div
        className={styles.workArea}
        data-panel={detailsOpen}
        style={focused ? undefined : { height: canvasHeight, flex: 'none' }}
      >
        <div ref={canvasRoot} className={styles.canvas} data-testid="weekly-canvas">
          <ReactFlowProvider>
            <ReactFlow<BoardNode, TransferFlowEdge>
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodeClick={(_, node) => {
                setSelected(node.id);
                setCameraTarget(node.id);
                setDetailsOpen(true);
                setTab('trace');
              }}
              onEdgeClick={(_, edge) => {
                setSelectedEdge(edge.id);
                setDetailsOpen(true);
                setTab('connections');
              }}
              onConnect={connect}
              onNodesChange={(changes) => {
                const positions = changes.filter((c) => c.type === 'position');
                if (positions.length)
                  change(
                    (c) => ({
                      ...c,
                      nodes: c.nodes.map((n) => {
                        const v = positions.find((v) => v.id === n.id);
                        return v?.type === 'position' && v.position
                          ? { ...n, position: v.position }
                          : n;
                      }),
                    }),
                    false,
                  );
              }}
              onEdgesChange={(changes) => {
                const removed = new Set(
                  changes.filter((c) => c.type === 'remove').map((c) => c.id),
                );
                if (removed.size)
                  change((c) => ({ ...c, edges: c.edges.filter((e) => !removed.has(e.id)) }));
              }}
              minZoom={0.2}
              maxZoom={1.4}
              fitView
              deleteKeyCode={null}
              zoomOnDoubleClick={false}
            >
              <Background color="var(--border)" gap={24} />
              <Controls showInteractive={false} />
              <Camera
                selected={cameraTarget}
                ids={nodes.map((n) => n.id).join(',')}
                container={canvasRoot}
              />
            </ReactFlow>
          </ReactFlowProvider>
          <span className={styles.canvasHint}>
            노드를 선택해 역할과 입출력을 확인하세요. 출력 점에서 입력 점으로 연결합니다.
          </span>
        </div>
        <div
          id={detailsId}
          className={styles.details}
          aria-label="워크플로 결과와 설정"
          hidden={!detailsOpen}
        >
          <div className={styles.panelHeading}>
            <strong>설정·실행 결과</strong>
            <button onClick={() => setDetailsOpen(false)}>패널 닫기</button>
          </div>
          {message && messageTone === 'info' && detailsOpen && (
            <p role="status" className={styles.notice}>
              {message}
            </p>
          )}
          {message && messageTone !== 'info' && detailsOpen && (
            <ResultFeedback
              key={messageVersion}
              tone={messageTone}
              title={messageTone === 'success' ? '연결 확인 성공' : '연결 확인 실패'}
            >
              {message}
            </ResultFeedback>
          )}
          {showIssues && issues.length > 0 && (
            <div className={styles.issues} aria-label="연결 진단">
              {issues.map((i, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelected(i.node);
                    setCameraTarget(i.node);
                    setTab('trace');
                  }}
                >
                  {i.message} ↗
                </button>
              ))}
            </div>
          )}
          <div className={styles.tabs} role="group" aria-label="워크플로 패널">
            <button aria-pressed={tab === 'trace'} onClick={() => setTab('trace')}>
              단계와 전달 자료
            </button>
            <button aria-pressed={tab === 'settings'} onClick={() => setTab('settings')}>
              노드 설정
            </button>
            <button aria-pressed={tab === 'connections'} onClick={() => setTab('connections')}>
              연결 편집
            </button>
          </div>
          {tab === 'trace' && (
            <div className={styles.traceGrid}>
              <nav aria-label="실행 단계" className={styles.timeline}>
                <button
                  className={styles.stageArrow}
                  aria-label="이전 단계 살펴보기"
                  disabled={stageNodes.findIndex((n) => n.id === selected) <= 0}
                  onClick={() => {
                    const node =
                      stageNodes[Math.max(0, stageNodes.findIndex((n) => n.id === selected) - 1)];
                    setSelected(node.id);
                    setCameraTarget(node.id);
                  }}
                >
                  <ChevronLeft size={18} aria-hidden="true" />
                </button>
                {stageNodes
                  .filter((n, index) => (selected ? n.id === selected : index === 0))
                  .map((n) => {
                    const index = current?.run.stages.findIndex((s) => s.node === n.id) ?? -1;
                    const stage =
                      current && index <= current.cursor && index >= 0
                        ? current.run.stages[index]
                        : undefined;
                    return (
                      <button
                        key={n.id}
                        aria-current={selected === n.id ? 'step' : undefined}
                        onClick={() => {
                          setSelected(n.id);
                          setCameraTarget(n.id);
                        }}
                      >
                        <i data-status={stage?.status ?? 'waiting'} />
                        <span>
                          실행 {stageNodes.indexOf(n) + 1} / {stageNodes.length} {n.title}
                          <small>
                            {stage?.status === 'success'
                              ? '자료 생성 완료'
                              : stage?.status === 'failed'
                                ? '실패 원인 확인'
                                : stage?.status === 'blocked'
                                  ? '상위 실패로 차단'
                                  : '아직 실행 전'}
                          </small>
                        </span>
                      </button>
                    );
                  })}
                <button
                  className={styles.stageArrow}
                  aria-label="다음 단계 살펴보기"
                  disabled={
                    stageNodes.findIndex((n) => n.id === selected) === stageNodes.length - 1
                  }
                  onClick={() => {
                    const node =
                      stageNodes[
                        Math.min(
                          stageNodes.length - 1,
                          Math.max(
                            0,
                            stageNodes.findIndex((n) => n.id === selected),
                          ) + 1,
                        )
                      ];
                    setSelected(node.id);
                    setCameraTarget(node.id);
                  }}
                >
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              </nav>
              <section className={styles.inspector} data-testid="weekly-inspector">
                {inspect ? (
                  <>
                    <h3>{inspect.title}</h3>
                    <span className={styles.eyebrow}>
                      {inspect.lane}, {selectedStage ? '관찰한 실행 결과' : '노드 역할'}
                    </span>
                    <p>{inspect.purpose}</p>
                    {selectedStage ? (
                      <>
                        <ResultFeedback
                          key={selectedStage.node + selectedStage.status}
                          tone={selectedStage.status === 'success' ? 'success' : 'error'}
                          title={
                            selectedStage.status === 'success'
                              ? '실행 성공'
                              : selectedStage.status === 'failed'
                                ? '실행 실패'
                                : '후속 단계 차단'
                          }
                        >
                          {selectedStage.reason}
                        </ResultFeedback>
                        {selectedStage.fix && (
                          <p>
                            <strong>수정 방향</strong>: {selectedStage.fix}
                          </p>
                        )}
                        <h4>실제로 받은 입력</h4>
                        {selectedStage.inputs.length ? (
                          <ul>
                            {selectedStage.inputs.map((i, index) => (
                              <li key={index}>
                                <b>
                                  {i.from} → {i.name}
                                </b>
                                <span>{i.content}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>외부 입력이 없는 시작 단계이거나 입력이 도착하지 않았습니다.</p>
                        )}
                        <h4>실제로 만든 출력</h4>
                        {selectedStage.outputs.length ? (
                          <ul>
                            {selectedStage.outputs.map((o) => (
                              <li key={o.port}>
                                <b>{o.name}</b>
                                <span>{o.content}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>출력이 없습니다. 후속 단계에 자료를 전달하지 않습니다.</p>
                        )}
                      </>
                    ) : (
                      <>
                        <p>
                          아직 이 단계의 실행을 관찰하지 않았습니다. 입력이 어디서 오는지 확인하고
                          실행하세요.
                        </p>
                        <h4>필요한 입력</h4>
                        <p>
                          {inspect.inputs
                            .map((p) => `${p.label}${p.required ? ' (필수)' : ' (선택)'}`)
                            .join(' · ') || '시작 노드 · 입력 없음'}
                        </p>
                        <button onClick={() => setTab('settings')}>이 노드 설정 보기</button>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <h3>화살표 안의 자료를 따라가세요</h3>
                    <p>
                      노드를 선택하면 역할을, 실행하면 그 단계가 실제로 받은 입력·만든 출력을 볼 수
                      있습니다. 실패한 단계는 출력이 없고 후속 단계는 차단됩니다.
                    </p>
                    <p>먼저 연결 검사로 빠진 입력을 확인하고 단계 실행을 시작하세요.</p>
                  </>
                )}
              </section>
            </div>
          )}
          {tab === 'settings' && (
            <section className={styles.settings}>
              <h3>실행 조건{inspect ? ` (${inspect.title} 선택 중)` : ''}</h3>
              {inspect?.fields?.length ? (
                <p>
                  이 노드와 관련된 설정:{' '}
                  {spec.fields
                    .filter((f) => inspect.fields!.includes(f.id))
                    .map((f) => f.label)
                    .join(', ')}
                </p>
              ) : null}
              <Fields
                fields={spec.fields}
                answers={lab.answers}
                onChange={(id, value) =>
                  change((c) => ({ ...c, answers: { ...c.answers, [id]: value } }))
                }
              />
              <p>
                설정 변경은 이전 실행을 중단합니다. 관찰을 끝낸 실패·성공 비교는 아래에 남습니다.
              </p>
            </section>
          )}
          {tab === 'connections' && (
            <section className={styles.connections}>
              <div className={styles.connectionForm}>
                <label>
                  출력
                  <select
                    aria-label="워크플로 출력"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                  >
                    <option value="">출력 선택</option>
                    {spec.nodes
                      .filter((n) => lab.activeNodes?.includes(n.id))
                      .flatMap((n) =>
                        n.outputs.map((p) => (
                          <option key={`${n.id}.${p.id}`} value={`${n.id}.${p.id}`}>
                            {n.title}, {p.label} ({p.material})
                          </option>
                        )),
                      )}
                  </select>
                </label>
                <span>→</span>
                <label>
                  입력
                  <select
                    aria-label="워크플로 입력"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  >
                    <option value="">입력 선택</option>
                    {spec.nodes
                      .filter((n) => lab.activeNodes?.includes(n.id))
                      .flatMap((n) =>
                        n.inputs.map((p) => (
                          <option key={`${n.id}.${p.id}`} value={`${n.id}.${p.id}`}>
                            {n.title}, {p.label} ({p.material})
                          </option>
                        )),
                      )}
                  </select>
                </label>
                <button
                  disabled={!from || !to}
                  onClick={() => {
                    const [source, sourceHandle] = from.split('.'),
                      [target, targetHandle] = to.split('.');
                    connect({ source, sourceHandle, target, targetHandle });
                  }}
                >
                  포트 연결
                </button>
              </div>
              {lab.edges.map((e) => (
                <div className={styles.edgeRow} data-selected={e.id === selectedEdge} key={e.id}>
                  <span>
                    {spec.nodes.find((n) => n.id === e.source)?.title},{' '}
                    {portName(spec, e.source, e.sourceHandle ?? '', 'out')?.label ?? '없어진 포트'}{' '}
                    → {spec.nodes.find((n) => n.id === e.target)?.title},{' '}
                    {portName(spec, e.target, e.targetHandle ?? '', 'in')?.label ?? '없어진 포트'}
                  </span>
                  <button
                    aria-label={`연결 삭제 ${e.id}`}
                    onClick={() =>
                      change((c) => ({ ...c, edges: c.edges.filter((v) => v.id !== e.id) }))
                    }
                  >
                    삭제
                  </button>
                </div>
              ))}
              <details>
                <summary>노드 추가·제거</summary>
                {spec.nodes.map((n) => (
                  <div className={styles.edgeRow} key={n.id}>
                    <span>{n.title}</span>
                    <button
                      onClick={() =>
                        change((c) => ({
                          ...c,
                          activeNodes: c.activeNodes?.includes(n.id)
                            ? c.activeNodes.filter((id) => id !== n.id)
                            : [...(c.activeNodes ?? []), n.id],
                          edges: c.activeNodes?.includes(n.id)
                            ? c.edges.filter((e) => e.source !== n.id && e.target !== n.id)
                            : c.edges,
                        }))
                      }
                    >
                      {lab.activeNodes?.includes(n.id) ? '노드 제거' : '노드 추가'}
                    </button>
                  </div>
                ))}
              </details>
            </section>
          )}
          {current && (
            <div className={styles.metrics} aria-label="실행 비교 지표">
              {current.run.metrics.map((m) => (
                <div key={m.label}>
                  <small>{m.label}</small>
                  <strong>{m.value}</strong>
                </div>
              ))}
            </div>
          )}
          <section className={styles.comparison} aria-label="실패와 개선 비교">
            <h3>무엇을 바꿨고 결과는 왜 달라졌나요?</h3>
            <p>
              조건 실패와 개선 성공을 각각 마지막 단계까지 관찰하면 비교 기록이 남습니다. 연결
              누락만으로 생긴 실패는 조건 비교에 포함하지 않습니다.
            </p>
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>관측 항목</th>
                    <th>실패 조건</th>
                    <th>개선 성공</th>
                  </tr>
                </thead>
                <tbody>
                  {(
                    latestSuccess?.metrics ??
                    latestFailure?.metrics ??
                    spec.fields.map((f) => ({ label: f.label, value: '아직 관찰 전' }))
                  ).map((m) => (
                    <tr key={m.label}>
                      <th scope="row">{m.label}</th>
                      <td>
                        {latestFailure?.metrics.find((x) => x.label === m.label)?.value ??
                          '관찰 전'}
                      </td>
                      <td>
                        {latestSuccess?.metrics.find((x) => x.label === m.label)?.value ??
                          '관찰 전'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className={styles.goals} data-tour="goals" tabIndex={-1}>
            <fieldset>
              <legend>{spec.question}</legend>
              {(spec.week % 2 ? [0, 1] : [1, 0]).map((i) => (
                <label key={i}>
                  <input
                    type="radio"
                    name={`workflow-quiz-${lesson.id}`}
                    checked={lab.answers._workflowQuiz === (i === 0 ? 'correct' : 'wrong')}
                    onChange={() =>
                      edit(lesson.id, (c) => ({
                        ...c,
                        answers: { ...c.answers, _workflowQuiz: i === 0 ? 'correct' : 'wrong' },
                      }))
                    }
                  />
                  {spec.options[i]}
                </label>
              ))}
            </fieldset>
            {lab.answers._workflowQuiz && (
              <ResultFeedback
                key={String(lab.answers._workflowQuiz)}
                tone={lab.answers._workflowQuiz === 'correct' ? 'success' : 'error'}
                title={lab.answers._workflowQuiz === 'correct' ? '정답입니다' : '오답입니다'}
              >
                {lab.answers._workflowQuiz === 'correct' ? '맞습니다. ' : '다시 생각해 보세요. '}
                {spec.explanation}
              </ResultFeedback>
            )}
            {goals.map((g) => (
              <p key={g.id} data-passed={g.passed}>
                {g.passed ? '✓' : '○'} {g.label}
                {showIssues && !g.passed && <small>{g.hint}</small>}
              </p>
            ))}
            <button
              data-testid="weekly-complete"
              onClick={() => {
                setShowIssues(true);
                if (ready) edit(lesson.id, (c) => ({ ...c, completed: true }), false);
              }}
            >
              {lab.completed ? '워크플로 이해 확인 완료' : '이해 확인하고 실습 완료'}
            </button>
          </section>
        </div>
      </div>
    </section>
  );
}
