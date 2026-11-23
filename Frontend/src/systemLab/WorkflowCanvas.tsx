import { ReactFlowProvider } from '@xyflow/react';
import { Canvas } from './Canvas';
import { rootId, type Graph } from './lab';
import { LabProvider } from './labContext';
import { playgroundLab } from './labs';
import { playgroundView } from './labs/playground-view';

const noop = () => undefined;

/** 노드가 없는 서비스 영역은 빼서 구성이 화면을 가득 채우게 한다. 보기만 하는 화면에서만 쓴다. */
function withoutEmptyServices(graph: Graph): Graph {
  const used = new Set<string>([rootId]);
  for (const entity of graph.entities) {
    if (entity.type !== 'resource') continue;
    for (let parent = graph.entities.find((e) => e.id === entity.parent); parent;) {
      used.add(parent.id);
      parent = graph.entities.find((e) => e.id === parent?.parent);
    }
  }
  return {
    ...graph,
    entities: graph.entities.filter((e) => e.type === 'resource' || used.has(e.id)),
  };
}
const reject = () => false;

/** 저장한 구성을 실습과 같은 캔버스로 보여 준다. 편집은 할 수 없다. */
export function WorkflowCanvas({
  graph,
  mode,
  label,
}: {
  graph: Graph;
  mode: 'detail' | 'thumbnail';
  label: string;
}) {
  const shown = withoutEmptyServices(graph);
  return (
    <LabProvider value={{ lab: playgroundLab, view: playgroundView }}>
      <ReactFlowProvider>
        <div
          className={
            mode === 'thumbnail'
              ? 'pointer-events-none absolute inset-0 grid'
              : 'absolute inset-0 grid'
          }
          role="img"
          aria-label={label}
        >
          <Canvas
            graph={shown}
            selected=""
            select={noop}
            dispatch={reject}
            editable={false}
            run={null}
            cursor={0}
            onMenu={noop}
            clearMenu={noop}
            selectedEdge=""
            selectEdge={noop}
            mode={mode}
          />
        </div>
      </ReactFlowProvider>
    </LabProvider>
  );
}
