import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { NodeSymbol, nodeVisual } from '../nodes/NodeSymbol';
import type { Stage } from './types';
import styles from './Weekly.module.css';
export type BoardNode = Node<{ stage: Stage; status: string; order: number }, 'workflow'>;
const materialNames: Record<string, string> = {
  data: '데이터',
  model: '모델',
  task: '할당 작업',
  gradient: '기울기',
  activation: '활성값',
  partial: '부분 결과',
  checkpoint: '체크포인트',
  image: '이미지',
  control: '관리 선언',
  request: '요청',
  prediction: '응답',
  volume: '볼륨',
  claim: '볼륨 연결',
  metadata: '메타데이터',
  document: '문서',
  vector: '벡터',
  context: '문맥',
  metrics: '관측 지표',
  decision: '판단',
  approval: '평가 승인',
  feedback: '개선 피드백',
};
export function WorkflowNode({ id, data, selected }: NodeProps<BoardNode>) {
  const n = data.stage;
  const visual = nodeVisual(n.title, n.id);
  return (
    <div
      className={styles.node}
      data-selected={selected}
      data-status={data.status}
      style={{ borderLeftColor: visual.color, borderLeftWidth: 4 }}
      data-testid={`weekly-node-${id}`}
    >
      <header>
        <span>
          {String(data.order + 1).padStart(2, '0')} · {n.lane}
        </span>
        <b>
          {data.status === 'success'
            ? '완료'
            : data.status === 'failed'
              ? '실패'
              : data.status === 'blocked'
                ? '차단'
                : data.status === 'active'
                  ? '관찰 중'
                  : '대기'}
        </b>
      </header>
      <div className={styles.nodeHeading}>
        <span className={styles.nodeSymbol}>
          <NodeSymbol name={n.title} service={n.id} size={26} />
        </span>
        <div>
          <small>{visual.label}</small>
          <strong>{n.title}</strong>
        </div>
      </div>
      <div className={styles.ports}>
        <div>
          {n.inputs.map((p) => (
            <div className={styles.input} key={p.id}>
              <Handle
                type="target"
                position={Position.Left}
                id={p.id}
                aria-label={`${n.title} ${p.label} 입력`}
                data-testid={`weekly-port-${id}-${p.id}-in`}
              />
              <span>
                {p.label}
                <small>{materialNames[p.material]}</small>
              </span>
            </div>
          ))}
        </div>
        <div>
          {n.outputs.map((p) => (
            <div className={styles.output} key={p.id}>
              <span>
                {p.label}
                <small>{materialNames[p.material]}</small>
              </span>
              <Handle
                type="source"
                position={Position.Right}
                id={p.id}
                aria-label={`${n.title} ${p.label} 출력`}
                data-testid={`weekly-port-${id}-${p.id}-out`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
