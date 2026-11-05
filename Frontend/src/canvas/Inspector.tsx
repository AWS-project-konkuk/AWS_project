import { ArrowRight, Cable, Info, Trash2 } from 'lucide-react';
import { stageByKind } from '../content/lesson';
import { useWorkflow } from '../workflow/WorkflowContext';
import { StageIcon } from './StageIcon';
import styles from './Workspace.module.css';

export function Inspector() {
  const { state, dispatch } = useWorkflow();
  const node = state.graph.nodes.find((item) => item.id === state.selectedId);
  const stage = node && stageByKind[node.data.kind];
  const deleteEdge = (id: string) =>
    dispatch({
      type: 'graph',
      graph: { ...state.graph, edges: state.graph.edges.filter((edge) => edge.id !== id) },
    });
  return (
    <aside className={styles.inspector} aria-label="노드 설정">
      <div className={styles.inspectorHeading}>
        <span>노드 살펴보기</span>
        <Info size={15} />
      </div>
      {node && stage ? (
        <div className={styles.inspectorBody}>
          <span className={styles.inspectorIcon} style={{ color: stage.color }}>
            <StageIcon kind={stage.kind} size={25} />
          </span>
          <small>{stage.english.toUpperCase()}</small>
          <h3>{stage.title}</h3>
          <p>{stage.description}</p>
          <label className={styles.fieldLabel}>
            노드 이름
            <input value={stage.title} readOnly aria-label="노드 이름" />
          </label>
          {stage.kind === 'evaluation' && (
            <label className={styles.fieldLabel}>
              정확도 통과 기준
              <input
                data-testid="threshold-input"
                aria-label="정확도 통과 기준"
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={node.data.threshold ?? ''}
                onChange={(event) => {
                  const threshold = event.target.value === '' ? null : Number(event.target.value);
                  dispatch({
                    type: 'graph',
                    graph: {
                      ...state.graph,
                      nodes: state.graph.nodes.map((item) =>
                        item.id === node.id ? { ...item, data: { ...item.data, threshold } } : item,
                      ),
                    },
                  });
                }}
              />
              <em>
                예시 정확도는 0.85입니다.
                <br />
                0.90으로 바꾸고 결과를 비교해 보세요.
              </em>
            </label>
          )}
          {stage.inputs.length > 0 && (
            <div className={styles.portInfo}>
              <strong>필요한 입력</strong>
              {stage.inputs.map((port) => (
                <span key={port.id}>
                  <i />
                  {port.label}
                </span>
              ))}
            </div>
          )}
          {stage.outputs.length > 0 && (
            <div className={styles.portInfo}>
              <strong>다음 단계로 전달</strong>
              {stage.outputs.map((port) => (
                <span key={port.id}>
                  <ArrowRight size={12} />
                  {port.label}
                </span>
              ))}
            </div>
          )}
          <button
            className={styles.deleteNode}
            onClick={() =>
              dispatch({
                type: 'graph',
                graph: {
                  nodes: state.graph.nodes.filter((item) => item.id !== node.id),
                  edges: state.graph.edges.filter(
                    (edge) => edge.source !== node.id && edge.target !== node.id,
                  ),
                },
              })
            }
          >
            <Trash2 size={13} /> 노드 삭제
          </button>
        </div>
      ) : (
        <div className={styles.inspectorEmpty}>
          <span>
            <Info size={22} />
          </span>
          <h3>노드를 선택해 보세요</h3>
          <p>
            역할과 입출력을 살펴보고
            <br />
            단계별 설정을 바꿀 수 있어요.
          </p>
        </div>
      )}
      {state.graph.edges.length > 0 && (
        <div className={styles.connectionList}>
          <h4>
            <Cable size={14} /> 연결 목록 <span>{state.graph.edges.length}</span>
          </h4>
          {state.graph.edges.map((edge) => {
            const from = state.graph.nodes.find((item) => item.id === edge.source);
            const to = state.graph.nodes.find((item) => item.id === edge.target);
            if (!from || !to) return null;
            const name = `${stageByKind[from.data.kind].title} → ${stageByKind[to.data.kind].title}`;
            return (
              <div key={edge.id}>
                <span>{name}</span>
                <button
                  aria-label={`연결 삭제 ${name}`}
                  title="연결 삭제"
                  onClick={() => deleteEdge(edge.id)}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
