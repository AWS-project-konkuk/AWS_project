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
}
function readState(raw: unknown, spec: NodeExampleSpec): ExampleState {
  try {
    const value = JSON.parse(String(raw));
    if (
      value?.mode === 'practice' &&
      Array.isArray(value.links) &&
      value.links.every(
        (id: unknown) => typeof id === 'string' && spec.links.some((link) => link.id === id),
      )
    )
      return { mode: 'practice', links: [...new Set<string>(value.links)] };
  } catch {
    /* Older or absent example records start with the worked example. */
  }
  return { mode: 'example', links: spec.links.map((link) => link.id) };
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
export function InlineNodeExample({ lessonId, spec }: { lessonId: string; spec: NodeExampleSpec }) {
  const key = `_inline:${spec.id}`;
  const raw = useLearningStore((state) => state.data.lessons[lessonId]?.answers[key]);
  const edit = useLearningStore((state) => state.edit);
  const saved = useMemo(() => readState(raw, spec), [raw, spec]);
  const [step, setStep] = useState(-1);
  const [feedback, setFeedback] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [expanded, setExpanded] = useState(false);
  const canvas = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const complete = spec.links.every((link) => saved.links.includes(link.id));
  const active = complete && step >= 0 ? spec.links[step] : undefined;
  const save = (value: ExampleState) => {
    edit(
      lessonId,
      (lab) => ({ ...lab, answers: { ...lab.answers, [key]: JSON.stringify(value) } }),
      false,
    );
    setStep(-1);
    setFeedback('');
  };
  const connect = (connection: Connection) => {
    if (saved.mode !== 'practice') {
      setFeedback('직접 연결해 보기를 누른 뒤 연결을 바꿔보세요.');
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
      setFeedback(`이 포트 조합은 예제의 관계와 맞지 않습니다. ${spec.practiceHint}`);
      return;
    }
    if (saved.links.includes(match.id)) {
      setFeedback('이미 연결된 경로입니다.');
      return;
    }
    save({ mode: 'practice', links: [...saved.links, match.id] });
    setFeedback(`${match.label} 연결을 추가했습니다. 연결 확인으로 이유를 확인하세요.`);
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
            inputs: spec.links
              .filter((link) => link.target === node.id)
              .map((link) => ({ id: link.id, label: link.label, material: link.material })),
            outputs: spec.links
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
          active?.target === node.id
            ? 'active'
            : active?.source === node.id
              ? 'success'
              : 'waiting';
        return node.data.status === status ? node : { ...node, data: { ...node.data, status } };
      }),
    );
  }, [active, setNodes]);
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
            transferring: active?.id === link.id,
            delivered: complete && index < step,
            animate: active?.id === link.id && spec.kind === '자료 전달' && !reduced,
            artifact: link.label,
            content: link.detail,
          },
        })),
    [spec, saved.links, active, complete, step, reduced],
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
        <button
          onClick={() =>
            save({ mode: 'practice', links: spec.links.slice(0, -1).map((link) => link.id) })
          }
        >
          직접 연결해 보기
        </button>
        <button
          disabled={!complete}
          onClick={() => setStep((value) => (value >= spec.links.length - 1 ? 0 : value + 1))}
        >
          {step >= spec.links.length - 1 ? '처음부터 흐름 보기' : '다음 연결 따라가기'}
        </button>
        <button aria-pressed={expanded} onClick={() => setExpanded((value) => !value)}>
          {expanded ? '기본 높이' : '예제 높이 늘리기'}
        </button>
      </div>
      <div ref={canvas} className={styles.canvas} data-expanded={expanded}>
        <ReactFlowProvider>
          <ReactFlow<BoardNode, TransferFlowEdge>
            nodes={nodes}
            edges={edges}
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
                save({ mode: 'practice', links: saved.links.filter((id) => id !== edge.id) });
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
      {active && (
        <p className={styles.trace} role="status">
          <strong>
            {step + 1}/{spec.links.length} · {active.label}
          </strong>{' '}
          {active.detail}
        </p>
      )}
      {saved.mode === 'practice' && (
        <div className={styles.practice}>
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
                  sourceHandle: link?.id ?? '',
                  targetHandle: link?.id ?? '',
                });
              }}
            >
              선택한 노드 연결
            </button>
            <button
              onClick={() =>
                setFeedback(
                  complete
                    ? '연결을 완성했습니다. ' + spec.links.map((link) => link.detail).join(' ')
                    : '아직 빠진 연결이 있습니다. ' + spec.practiceHint,
                )
              }
            >
              연결 확인
            </button>
          </div>
        </div>
      )}
      {feedback && <p role="status">{feedback}</p>}
      <footer>
        <span>작은 예제로 관계를 익힌 뒤 종합 실습에서 여러 조건을 함께 판단합니다.</span>
        <a href={`#/learn/${spec.nextLesson}`} aria-label="관련 종합 실습으로 →">
          관련 종합 실습으로
          <ArrowRight size={16} aria-hidden="true" />
        </a>
      </footer>
    </section>
  );
}
