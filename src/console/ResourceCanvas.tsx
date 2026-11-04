import { useEffect, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MarkerType,
  useReactFlow,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type NodeMouseHandler,
} from '@xyflow/react';
import type { LearningNode } from '../curriculum/types';
import type { Edge } from '@xyflow/react';
import { ResourceNode } from './ResourceNode';
const nodeTypes = { resource: ResourceNode };
interface Props {
  nodes: LearningNode[];
  edges: Edge[];
  onNodesChange: OnNodesChange<LearningNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onNodeDoubleClick?: NodeMouseHandler<LearningNode>;
}
function Canvas({ nodes, edges, ...handlers }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();
  const ids = nodes.map((node) => node.id).join(',');
  useEffect(() => {
    let frame = 0;
    const resize = () => {
      if (!container.current?.clientWidth || !container.current.clientHeight) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        void fitView({ padding: 0.2, maxZoom: 1 });
      });
    };
    const observer = new ResizeObserver(resize);
    if (container.current) observer.observe(container.current);
    resize();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [fitView, ids]);
  return (
    <div ref={container} style={{ width: '100%', height: '100%' }}>
      <ReactFlow<LearningNode>
        nodes={nodes}
        edges={edges.map((edge) => ({
          ...edge,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: 'var(--soft)', strokeWidth: 1.6, ...edge.style },
          labelStyle: { fill: 'var(--text)', fontSize: 11 },
          labelBgStyle: { fill: 'var(--panel)' },
        }))}
        nodeTypes={nodeTypes}
        {...handlers}
        fitView
        minZoom={0.2}
        maxZoom={1.6}
        zoomOnDoubleClick={false}
        deleteKeyCode={null}
        ariaLabelConfig={{
          'controls.zoomIn.ariaLabel': '확대',
          'controls.zoomOut.ariaLabel': '축소',
          'controls.fitView.ariaLabel': '전체 보기',
        }}
      >
        <Background color="var(--border)" gap={22} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
export function ResourceCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  );
}
