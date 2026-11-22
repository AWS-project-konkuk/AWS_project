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
  const height = detailed ? 'h-[clamp(19rem,52vh,34rem)]' : 'aspect-[16/10]';
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
        <span className="px-3 text-center text-xs text-ui-muted">
          표시할 워크플로우가 없습니다.
        </span>
      )}
    </div>
  );
}
