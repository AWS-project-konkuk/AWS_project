import { WorkflowCanvas } from '../systemLab/WorkflowCanvas';
import { hasNodes, type PlaygroundWorkflow } from '../playground/workflow';

/** 게시글에 첨부된 Playground를 실습과 같은 캔버스로 보여 준다. */
export function WorkflowPreview({
  workflow,
  detailed = false,
}: {
  workflow: PlaygroundWorkflow | null;
  detailed?: boolean;
}) {
  const height = detailed ? 'h-[clamp(19rem,52vh,34rem)]' : 'aspect-[4/3]';
  const shown = workflow && hasNodes(workflow.graph) ? workflow : null;
  return (
    <div
      className={height + ' relative grid w-full place-items-center overflow-hidden bg-ui-paper-2'}
    >
      {shown ? (
        <WorkflowCanvas
          graph={shown.graph}
          mode={detailed ? 'detail' : 'thumbnail'}
          label={
            detailed
              ? shown.graph.entities
                  .filter((entity) => entity.type === 'resource')
                  .map((entity) => entity.name)
                  .join(', ')
              : '워크플로우 미리보기'
          }
        />
      ) : (
        <div className="flex flex-col items-center gap-1 px-3">
          <img
            src="images/board-empty.svg"
            alt=""
            className={(detailed ? 'w-48' : 'w-28') + ' max-w-full'}
          />
          <span className="text-center text-xs text-ui-muted">워크플로우 없이 작성된 글이에요.</span>
        </div>
      )}
    </div>
  );
}
