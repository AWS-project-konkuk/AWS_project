import { BaseEdge, getSmoothStepPath, type Edge, type EdgeProps } from '@xyflow/react';

export type TransferFlowEdge = Edge<
  {
    relation?: boolean;
    transferring: boolean;
    delivered: boolean;
    animate: boolean;
    artifact: string;
    content: string;
  },
  'transfer'
>;

export function TransferEdge(props: EdgeProps<TransferFlowEdge>) {
  const [path, labelX, labelY] = getSmoothStepPath(props);
  const { data } = props;
  return (
    <g data-transferring={data?.transferring} data-delivered={data?.delivered}>
      <BaseEdge
        id={props.id}
        path={path}
        markerEnd={props.markerEnd}
        interactionWidth={24}
        style={{
          ...props.style,
          stroke: data?.transferring
            ? 'var(--accent)'
            : data?.delivered
              ? 'var(--success, #0f766e)'
              : props.style?.stroke,
          strokeWidth: data?.transferring ? 3 : props.style?.strokeWidth,
        }}
        label={
          data?.transferring
            ? `${data.relation ? '관계 확인' : '전달 중'} · ${data.artifact}`
            : props.label
        }
        labelX={labelX}
        labelY={labelY}
        labelStyle={props.labelStyle}
        labelBgStyle={props.labelBgStyle}
      />
      {data?.transferring && (
        <g
          data-testid="data-transfer"
          aria-label={`${data.artifact} ${data.relation ? '관계' : '전달'}`}
          style={{ pointerEvents: 'none' }}
        >
          <title>
            {data.artifact}: {data.content}
          </title>
          {data.animate ? (
            <circle r={7} fill="var(--accent)" stroke="var(--panel)" strokeWidth={2}>
              <animateMotion dur="1.1s" repeatCount="1" fill="freeze" path={path} />
            </circle>
          ) : (
            <circle cx={labelX} cy={labelY - 15} r={6} fill="var(--accent)" />
          )}
        </g>
      )}
    </g>
  );
}
