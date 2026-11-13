import { ResultFeedback } from './ResultFeedback';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MarkerType,
  useReactFlow,
  useNodesState,
  type Connection,
} from '@xyflow/react';
import { useReducedMotion } from 'motion/react';
import { traceInline } from './inlineExecution';
import type { Wire } from '../weekly/types';
import { ArrowRight } from 'lucide-react';
import type { NodeExampleSpec } from '../curriculum/nodeExamples';
import { WorkflowNode, type BoardNode } from '../weekly/WorkflowNode';
import { TransferEdge, type TransferFlowEdge } from '../weekly/TransferEdge';
import { useLearningStore } from './LearningStore';
import styles from './InlineNodeExample.module.css';

const nodeTypes = { workflow: WorkflowNode };
const edgeTypes = { transfer: TransferEdge };
interface ExampleState {
  mode: 'example' | 'practice';
  links: string[];
  extra?: Wire[];
}
function readState(raw: unknown, spec: NodeExampleSpec, startInPractice: boolean): ExampleState {
  try {
    const value = JSON.parse(String(raw));
    if (
      value?.mode === 'practice' &&
      Array.isArray(value.links) &&
      value.links.every(
        (id: unknown) => typeof id === 'string' && spec.links.some((link) => link.id === id),
      )
    )
      return {
        mode: 'practice',
        links: [...new Set<string>(value.links)],
        extra: Array.isArray(value.extra)
          ? value.extra.filter(
              (edge: Wire) =>
                edge &&
                spec.nodes.some((node) => node.id === edge.source) &&
                spec.nodes.some((node) => node.id === edge.target) &&
                typeof edge.sourceHandle === 'string' &&
                typeof edge.targetHandle === 'string',
            )
          : [],
      };
  } catch {
    /* Older or absent example records start with the worked example. */
  }
  return startInPractice
    ? { mode: 'practice', links: [], extra: [] }
    : { mode: 'example', links: spec.links.map((link) => link.id) };
}
function FitExample({
  container,
  expanded,
}: {
  container: RefObject<HTMLDivElement | null>;
  expanded: boolean;
}) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    if (!container.current) return;
    let frame = 0;
    let width = 0;
    let height = 0;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width < 100 || entry.contentRect.height < 100) return;
      if (width === entry.contentRect.width && height === entry.contentRect.height) return;
      width = entry.contentRect.width;
      height = entry.contentRect.height;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        void fitView({ padding: 0.15, maxZoom: 1 });
      });
    });
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [container, fitView, expanded]);
  return null;
}
export function InlineNodeExample({
  lessonId,
  spec,
  startInPractice = false,
}: {
  lessonId: string;
  spec: NodeExampleSpec;
  startInPractice?: boolean;
}) {
  const key = `_inline:${spec.id}`;
  const raw = useLearningStore((state) => state.data.lessons[lessonId]?.answers[key]);
  const edit = useLearningStore((state) => state.edit);
  const saved = useMemo(() => readState(raw, spec, startInPractice), [raw, spec, startInPractice]);
  const [step, setStep] = useState(-1);
  const [feedback, setFeedback] = useState('');
  const [feedbackTone, setFeedbackTone] = useState<'success' | 'error' | 'info'>('info');
  const [feedbackVersion, setFeedbackVersion] = useState(0);
  const announce = (text: string, tone: 'success' | 'error' | 'info' = 'info') => {
    setFeedback(text);
    setFeedbackTone(tone);
    setFeedbackVersion((value) => value + 1);
  };
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [expanded, setExpanded] = useState(false);
  const canvas = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const complete =
    !saved.extra?.length && spec.links.every((link) => saved.links.includes(link.id));
  const stages = useMemo(
    () => traceInline(spec, saved.links, saved.extra ?? []),
    [spec, saved.links, saved.extra],
  );
  const currentStage = step >= 0 ? stages[step] : undefined;
  const active =
    currentStage?.status === 'success'
      ? spec.links.find(
          (link) => link.target === currentStage.node || link.source === currentStage.node,
        )
      : undefined;
  const save = (value: ExampleState) => {
    edit(
      lessonId,
      (lab) => ({ ...lab, answers: { ...lab.answers, [key]: JSON.stringify(value) } }),
      false,
    );
    setStep(-1);
    announce('');
  };
  const connect = (connection: Connection) => {
    if (saved.mode !== 'practice') {
      announce('직접 연결해 보기를 누른 뒤 연결을 바꿔보세요.');
      return;
    }
    const match = spec.links.find(
      (link) =>
        link.source === connection.source &&
        link.target === connection.target &&
        link.id === connection.sourceHandle &&
        link.id === connection.targetHandle,
    );
    if (!match) {
      const edge = {
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle ?? '__output',
        targetHandle: connection.targetHandle ?? '__input',
      };
      if ((saved.extra ?? []).some((item) => JSON.stringify(item) === JSON.stringify(edge))) return;
      save({ ...saved, extra: [...(saved.extra ?? []), edge] });
      announce('연결을 추가했습니다. 실행 시 도착 노드에서 입력과 출력을 확인합니다.');
      return;
    }
    if (saved.links.includes(match.id)) {
      announce('이미 연결된 경로입니다.');
      return;
    }
    save({ ...saved, mode: 'practice', links: [...saved.links, match.id] });
    announce(`${match.label} 연결을 추가했습니다. 연결 확인으로 이유를 확인하세요.`);
  };
  const initialNodes = useMemo<BoardNode[]>(
    () =>
      spec.nodes.map((node, index) => ({
        id: node.id,
        type: 'workflow',
        position: { x: node.x, y: node.y },
        data: {
          order: index,
          status: 'waiting',
          stage: {
            ...node,
            lane: spec.kind,
            inputs: !spec.links.some((link) => link.target === node.id)
              ? [{ id: '__input', label: '추가 입력', material: 'data' }]
              : spec.links
                  .filter((link) => link.target === node.id)
                  .map((link) => ({ id: link.id, label: link.label, material: link.material })),
            outputs: !spec.links.some((link) => link.source === node.id)
              ? [{ id: '__output', label: '추가 출력', material: 'data' }]
              : spec.links
                  .filter((link) => link.source === node.id)
                  .map((link) => ({ id: link.id, label: link.label, material: link.material })),
          },
        },
      })),
    [spec],
  );
  // 위치뿐 아니라 React Flow가 측정한 크기와 드래그 상태도 함께 유지합니다.
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  useEffect(() => setNodes(initialNodes), [initialNodes, setNodes]);
  useEffect(() => {
    setNodes((current) =>
      current.map((node) => {
        const status =
          stages.slice(0, step + 1).find((stage) => stage.node === node.id)?.status ?? 'waiting';
        return node.data.status === status ? node : { ...node, data: { ...node.data, status } };
      }),
    );
  }, [stages, step, setNodes]);
  const edges = useMemo<TransferFlowEdge[]>(
    () =>
      spec.links
        .filter((link) => saved.links.includes(link.id))
        .map((link, index) => ({
          id: link.id,
          source: link.source,
          target: link.target,
          sourceHandle: link.id,
          targetHandle: link.id,
          type: 'transfer',
          label: link.label,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: 'var(--soft)', strokeWidth: 1.5 },
          labelStyle: { fill: 'var(--text)', fontSize: 11 },
          labelBgStyle: { fill: 'var(--panel)' },
          data: {
            relation: spec.kind === '구성 관계',
            transferring: active?.id === link.id && currentStage?.status === 'success',
            delivered: complete && index < step,
            animate: active?.id === link.id && spec.kind === '자료 전달' && !reduced,
            artifact: link.label,
            content: link.detail,
          },
        })),
    [spec, saved.links, active, complete, step, reduced, currentStage?.status],
  );
  return (
    <section
      className={styles.example}
      aria-label={`본문 노드 예제 · ${spec.title}`}
      data-testid={`inline-node-${lessonId}`}
    >
      <header>
        <h3>{spec.title}</h3>
        <span>본문 노드 학습, {spec.kind}</span>
        <p>{spec.prompt}</p>
      </header>
      <div className={styles.tools}>
        <button
          onClick={() => {
            save({ mode: 'example', links: spec.links.map((link) => link.id) });
            setNodes(initialNodes);
          }}
        >
          완성 예시 보기
        </button>
        <button onClick={() => save({ mode: 'practice', links: [], extra: [] })}>
          직접 연결해 보기
        </button>
        <button onClick={() => setStep((value) => (value >= stages.length - 1 ? 0 : value + 1))}>
          {step >= stages.length - 1 ? '처음부터 흐름 보기' : '다음 연결 따라가기'}
        </button>
        <button aria-pressed={expanded} onClick={() => setExpanded((value) => !value)}>
          {expanded ? '기본 높이' : '예제 높이 늘리기'}
        </button>
      </div>
      {currentStage && (
        <ResultFeedback
          key={`stage-${step}`}
          tone={currentStage.status === 'success' ? 'success' : 'error'}
          title={
            currentStage.status === 'success'
              ? '실행 성공'
              : currentStage.status === 'failed'
                ? '실행 실패'
                : '후속 단계 차단'
          }
        >
          <strong>
            {step + 1}/{stages.length}{' '}
            {spec.nodes.find((node) => node.id === currentStage.node)?.title}
          </strong>{' '}
          {currentStage.status === 'success'
            ? '실행 성공. '
            : currentStage.status === 'failed'
              ? '실행 실패. '
              : '후속 차단. '}
          {currentStage.detail}
        </ResultFeedback>
      )}
      <div
        ref={canvas}
        className={styles.canvas}
        data-expanded={expanded}
        style={{
          height: expanded
            ? 840
            : Math.min(
                440,
                Math.max(
                  320,
                  Math.max(...spec.nodes.map((node) => node.y)) -
                    Math.min(...spec.nodes.map((node) => node.y)) +
                    284,
                ),
              ),
        }}
      >
        <ReactFlowProvider>
          <ReactFlow<BoardNode, TransferFlowEdge>
            nodes={nodes}
            edges={[
              ...edges,
              ...(saved.extra ?? []).map((edge, index) => ({
                ...edge,
                id: `extra-${index}`,
                type: 'transfer' as const,
                data: {
                  relation: true,
                  artifact: '',
                  content: '',
                  transferring: false,
                  delivered: false,
                  animate: false,
                },
              })),
            ]}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onConnect={connect}
            nodesConnectable={saved.mode === 'practice'}
            deleteKeyCode={null}
            minZoom={0.2}
            maxZoom={1.5}
            fitView
            onNodesChange={onNodesChange}
            onEdgeClick={(_, edge) => {
              if (saved.mode === 'practice')
                save({
                  ...saved,
                  mode: 'practice',
                  links: saved.links.filter((id) => id !== edge.id),
                  extra: (saved.extra ?? []).filter((_, index) => edge.id !== `extra-${index}`),
                });
            }}
            zoomOnScroll={false}
            preventScrolling={false}
            zoomOnDoubleClick={false}
          >
            <Background gap={24} color="var(--border)" />
            <Controls showInteractive={false} />
            <FitExample container={canvas} expanded={expanded} />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
      {saved.mode === 'practice' && (
        <div className={styles.practice}>
          <h4 className={styles.connectionTitle}>현재 연결</h4>
          <ul className={styles.connectionList} aria-label="예제 연결 목록">
            {spec.links
              .filter((link) => saved.links.includes(link.id))
              .map((link) => (
                <li key={link.id}>
                  <span>
                    {spec.nodes.find((node) => node.id === link.source)?.title} →{' '}
                    {spec.nodes.find((node) => node.id === link.target)?.title}: {link.label}
                  </span>
                  <button
                    aria-label={`${spec.nodes.find((node) => node.id === link.source)?.title}에서 ${spec.nodes.find((node) => node.id === link.target)?.title}로 ${link.label} 연결 삭제`}
                    onClick={() =>
                      save({ ...saved, links: saved.links.filter((id) => id !== link.id) })
                    }
                  >
                    연결 삭제
                  </button>
                </li>
              ))}
          </ul>
          {!saved.links.length && !saved.extra?.length && (
            <p>연결이 없습니다. 아래에서 출발·도착 노드를 선택해 연결하세요.</p>
          )}
          {!!saved.extra?.length && (
            <ul aria-label="추가한 연결">
              {saved.extra.map((edge, index) => (
                <li key={index}>
                  {spec.nodes.find((node) => node.id === edge.source)?.title} →{' '}
                  {spec.nodes.find((node) => node.id === edge.target)?.title}{' '}
                  <button
                    onClick={() =>
                      save({ ...saved, extra: saved.extra!.filter((_, item) => item !== index) })
                    }
                  >
                    추가 연결 삭제
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p>{spec.practiceHint}</p>
          <p>
            출력 포트에서 입력 포트로 드래그하거나 아래에서 두 노드를 선택하세요. 연결선을 누르면
            지울 수 있습니다.
          </p>
          <div className={styles.connectionForm}>
            <label>
              출발 노드
              <select
                aria-label="예제 출발 노드"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              >
                <option value="">선택하세요</option>
                {spec.nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              도착 노드
              <select
                aria-label="예제 도착 노드"
                value={to}
                onChange={(event) => setTo(event.target.value)}
              >
                <option value="">선택하세요</option>
                {spec.nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.title}
                  </option>
                ))}
              </select>
            </label>
            <button
              disabled={!from || !to}
              onClick={() => {
                const link = spec.links.find((link) => link.source === from && link.target === to);
                connect({
                  source: from,
                  target: to,
                  sourceHandle:
                    link?.id ?? spec.links.find((item) => item.source === from)?.id ?? '__output',
                  targetHandle:
                    link?.id ?? spec.links.find((item) => item.target === to)?.id ?? '__input',
                });
              }}
            >
              선택한 노드 연결
            </button>
            <button
              onClick={() =>
                announce(
                  complete
                    ? '연결을 완성했습니다. ' + spec.links.map((link) => link.detail).join(' ')
                    : (saved.extra?.length
                        ? '맞지 않습니다. 연결한 자료와 입력의 관계를 확인하세요. '
                        : '아직 빠진 연결이 있습니다. ') + spec.practiceHint,
                  complete ? 'success' : 'error',
                )
              }
            >
              연결 확인
            </button>
          </div>
        </div>
      )}
      {feedback && (
        <ResultFeedback
          key={`feedback-${feedbackVersion}`}
          tone={feedbackTone}
          title={
            feedbackTone === 'success'
              ? '연결 확인 성공'
              : feedbackTone === 'error'
                ? '연결 확인 실패'
                : '연결 안내'
          }
        >
          {feedback}
        </ResultFeedback>
      )}
      {spec.nextLesson && (
        <footer>
          <span>작은 예제로 관계를 익힌 뒤 종합 실습에서 여러 조건을 함께 판단합니다.</span>
          <a href={`#/learn/${spec.nextLesson}`} aria-label="관련 종합 실습으로 →">
            관련 종합 실습으로
            <ArrowRight size={16} aria-hidden="true" />
          </a>
        </footer>
      )}
    </section>
  );
}
