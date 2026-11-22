import { BaseEdge, getSmoothStepPath, type Edge, type EdgeProps } from '@xyflow/react';

export type TransferEdgeType = Edge<
  {
    /** 방금 실행한 노드가 이 선으로 자료를 보내고 있는지. */
    moving: boolean;
    /** 동그라미가 선을 지나는 시간(초). 실행 속도에 맞춘다. */
    seconds: number;
    /** 움직임을 줄이도록 설정한 환경이면 선을 따라가지 않고 한 자리에 둔다. */
    still: boolean;
    /** 보내는 자료를 설명한다. */
    description: string;
    /** 같은 선을 다시 지날 때 애니메이션을 처음부터 시작하게 하는 값. */
    step: number;
    color: string;
  },
  'transfer'
>;

/** 자료가 전달되는 동안 선을 따라 움직이는 동그라미를 그린다. */
export function TransferEdge(props: EdgeProps<TransferEdgeType>) {
  const [path, labelX, labelY] = getSmoothStepPath(props);
  const { data } = props;
  return (
    <g data-transferring={data?.moving}>
      <BaseEdge
        id={props.id}
        path={path}
        markerEnd={props.markerEnd}
        interactionWidth={props.interactionWidth}
        style={props.style}
        label={props.label}
        labelX={labelX}
        labelY={labelY}
        labelStyle={props.labelStyle}
        labelBgStyle={props.labelBgStyle}
      />
      {data?.moving && (
        <g
          data-testid="data-transfer"
          aria-label={data.description + ' 전달'}
          style={{ pointerEvents: 'none' }}
        >
          <title>{data.description}</title>
          {data.still ? (
            <circle cx={labelX} cy={labelY} r={6} fill={data.color} stroke="var(--color-paper)" />
          ) : (
            <circle
              key={data.step}
              r={7}
              fill={data.color}
              stroke="var(--color-paper)"
              strokeWidth={2}
            >
              <animateMotion dur={data.seconds + 's'} repeatCount="1" fill="freeze" path={path} />
            </circle>
          )}
        </g>
      )}
    </g>
  );
}
