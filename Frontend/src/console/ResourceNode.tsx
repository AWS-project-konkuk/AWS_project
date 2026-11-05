import { Handle, Position, type NodeProps } from '@xyflow/react';
import { NodeSymbol } from '../nodes/NodeSymbol';
import type { LearningNode } from '../curriculum/types';
import styles from './Console.module.css';

export function ResourceNode({ id, data, selected }: NodeProps<LearningNode>) {
  return (
    <div
      className={`${styles.resource} ${selected ? styles.nodeSelected : ''}`}
      data-testid={`resource-${id}`}
    >
      <span>
        <NodeSymbol name={data.title} service={data.service} size={20} />
        {data.service ?? '학습 노드'}
      </span>
      <strong>{data.title}</strong>
      <small>{data.detail}</small>
      {data.resourceName && <small>{data.resourceName}</small>}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        aria-label={`${data.title} 입력`}
        data-testid={`port-${id}-in`}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        aria-label={`${data.title} 출력`}
        data-testid={`port-${id}-out`}
      />
    </div>
  );
}
