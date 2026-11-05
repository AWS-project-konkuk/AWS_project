import { useEffect, type CSSProperties } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  useReactFlow,
  type NodeProps,
} from '@xyflow/react';
import { Plus, MousePointer2, ArrowUpRight, Network } from 'lucide-react';
import { stages, stageByKind } from '../content/lesson';
import { createNode } from '../workflow/graph';
import { useWorkflow } from '../workflow/WorkflowContext';
import type { WorkflowNode } from '../workflow/types';
import { StageIcon } from './StageIcon';
import styles from './Workspace.module.css';

function StageNode({ id, data, selected }: NodeProps<WorkflowNode>) {
  const { state } = useWorkflow();
  const stage = stageByKind[data.kind];
  const hasIssue = state.issues.some((issue) => issue.nodeIds.includes(id));
  const stepIndex = state.steps.findIndex((step) => step.nodeId === id);
  const result = stepIndex >= 0 && stepIndex < state.cursor ? state.steps[stepIndex] : undefined;
  const running = state.playing && stepIndex === state.cursor;
  return (
    <div
      className={`${styles.node} ${selected ? styles.selected : ''} ${hasIssue ? styles.invalid : ''}`}
      style={{ '--stage-color': stage.color } as CSSProperties}
      data-testid={`stage-${id}`}
    >
      <div className={styles.nodeHeader}>
        <span className={styles.nodeIcon}>
          <StageIcon kind={data.kind} />
        </span>
        <span>
          <strong>{stage.title}</strong>
          <small>{stage.english}</small>
        </span>
        <span
          className={`${styles.nodeDot} ${result?.status === 'failed' ? styles.failedDot : ''}`}
        />
      </div>
      <div className={styles.ports}>
        <div>
          {stage.inputs.map((port, index) => (
            <div className={styles.portRow} key={port.id}>
              <Handle
                type="target"
                position={Position.Left}
                id={port.id}
                style={{ top: 73 + index * 23 }}
                data-testid={`port-${id}-in-${port.id}`}
                aria-label={`${stage.title} ${port.label} 입력`}
              />
              <span>{port.label}</span>
            </div>
          ))}
        </div>
        <div className={styles.outputPorts}>
          {stage.outputs.map((port, index) => (
            <div className={styles.portRow} key={port.id}>
              <span>{port.label}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={port.id}
                style={{ top: 73 + index * 23 }}
                data-testid={`port-${id}-out-${port.id}`}
                aria-label={`${stage.title} ${port.label} 출력`}
              />
            </div>
          ))}
        </div>
      </div>
      <div className={styles.nodeFooter}>
        {running
          ? '● 시뮬레이션 진행 중'
          : result
            ? {
                success: '✓ 완료',
                failed: '평가 기준 미달',
                blocked: '진행 차단',
                waiting: '대기 중',
                running: '진행 중',
              }[result.status]
            : data.kind === 'evaluation'
              ? `통과 기준 ${data.threshold ?? '미설정'}`
              : '입출력을 연결하세요'}
      </div>
    </div>
  );
}
const nodeTypes = { stage: StageNode };

export function WorkflowCanvas({ onExample }: { onExample: () => void }) {
  const { state, dispatch } = useWorkflow();
  const { fitView, setCenter, getZoom } = useReactFlow<WorkflowNode>();
  const { graph } = state;
  const count = graph.nodes.length;
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (count) void fitView({ padding: 0.18, duration: 250, maxZoom: 1 });
    }, 60);
    return () => clearTimeout(timer);
  }, [count, fitView]);
  return (
    <section className={styles.canvasSection} aria-label="워크플로 편집기">
      <div className={styles.palette}>
        <span className={styles.paletteLabel}>노드 추가</span>
        {stages.map((stage) => (
          <button
            key={stage.kind}
            className={styles.paletteButton}
            title={`${stage.title} 추가`}
            aria-label={`${stage.title} 추가`}
            disabled={graph.nodes.some((node) => node.data.kind === stage.kind)}
            onClick={() => {
              const node = createNode(stage.kind);
              dispatch({ type: 'graph', graph: { ...graph, nodes: [...graph.nodes, node] } });
              dispatch({ type: 'select', id: node.id, kind: stage.kind });
            }}
          >
            <StageIcon kind={stage.kind} size={15} />
            <span>{stage.title}</span>
            <Plus size={12} />
          </button>
        ))}
      </div>
      <div className={styles.flow} data-testid="workflow-canvas">
        <ReactFlow<WorkflowNode>
          nodes={graph.nodes}
          edges={graph.edges.map((edge) => ({
            ...edge,
            animated: state.playing,
            style: {
              stroke: state.issues.some((issue) => issue.edgeIds.includes(edge.id))
                ? '#bf6259'
                : '#8a9e97',
              strokeWidth: 1.6,
            },
            selected: edge.selected,
          }))}
          nodeTypes={nodeTypes}
          onNodesChange={(changes) => dispatch({ type: 'nodes', changes })}
          onEdgesChange={(changes) => dispatch({ type: 'edges', changes })}
          onConnect={(connection) => dispatch({ type: 'connect', connection })}
          onNodeClick={(_, node) => dispatch({ type: 'select', id: node.id, kind: node.data.kind })}
          onPaneClick={() => dispatch({ type: 'select', id: null })}
          onNodeDoubleClick={(_, node) => {
            void setCenter(node.position.x + 110, node.position.y + 65, {
              zoom: Math.max(getZoom(), 0.85),
              duration: 250,
            });
          }}
          minZoom={0.25}
          maxZoom={1.8}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          deleteKeyCode={['Backspace', 'Delete']}
          connectOnClick
          ariaLabelConfig={{
            'controls.zoomIn.ariaLabel': '확대',
            'controls.zoomOut.ariaLabel': '축소',
            'controls.fitView.ariaLabel': '전체 보기',
            'controls.interactive.ariaLabel': '편집 잠금 전환',
          }}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#d1d9d3" />
          <Controls showInteractive={false} />
        </ReactFlow>
        {count === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyDiagram}>
              <span>
                <StageIcon kind="dataset" size={27} />
              </span>
              <i />
              <span>
                <StageIcon kind="training" size={27} />
              </span>
              <i />
              <span>
                <StageIcon kind="serving" size={27} />
              </span>
            </div>
            <h2>
              작은 연결로 시작하는
              <br />
              MLOps의 전체 흐름
            </h2>
            <span className={styles.eyebrow}>첫 워크플로</span>
            <p>
              위에서 노드를 추가하고 입출력을 연결해 보세요.
              <br />
              직접 만들며 각 단계의 역할을 이해할 수 있어요.
            </p>
            <button className={styles.emptyButton} onClick={onExample}>
              예제로 시작하기 <ArrowUpRight size={16} />
            </button>
            <small>
              <MousePointer2 size={13} /> 노드 클릭으로 설명 확인 · 배경 드래그로 이동
            </small>
          </div>
        )}
        <div className={styles.canvasCaption}>
          <Network size={13} /> {count}개 노드 <span>·</span> {graph.edges.length}개 연결
        </div>
      </div>
    </section>
  );
}
