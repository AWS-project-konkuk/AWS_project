import { ReactFlowProvider } from '@xyflow/react';
import { Canvas } from './Canvas';
import type { Graph } from './lab';
import { LabProvider } from './labContext';
import { playgroundLab } from './labs';
import { playgroundView } from './labs/playground-view';

const noop = () => undefined;
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
            graph={graph}
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
