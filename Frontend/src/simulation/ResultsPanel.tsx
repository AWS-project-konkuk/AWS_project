import {
  AlertCircle,
  CheckCircle2,
  Circle,
  FlaskConical,
  LockKeyhole,
  ArrowUpRight,
} from 'lucide-react';
import { stageByKind } from '../content/lesson';
import { useWorkflow } from '../workflow/WorkflowContext';
import styles from '../canvas/Workspace.module.css';

export function ResultsPanel() {
  const { state, dispatch } = useWorkflow();
  const completed = state.steps.length > 0 && state.cursor === state.steps.length;
  const failed = state.steps.some((step) => step.status === 'failed');
  return (
    <section className={styles.results} aria-label="검증과 시뮬레이션 결과" aria-live="polite">
      <div className={styles.resultsHeading}>
        <span>
          <FlaskConical size={16} />
          실행 결과
        </span>
        <div>
          {state.steps.length > 0
            ? `${state.cursor} / ${state.steps.length} 단계`
            : state.validated
              ? state.issues.length
                ? `${state.issues.length}개 확인 필요`
                : '검증 통과'
              : '실행 대기'}
          <span className={styles.simBadge}>학습용 시뮬레이션</span>
        </div>
      </div>
      {state.issues.length > 0 ? (
        <div className={styles.issues} data-testid="validation-issues">
          {state.issues.map((issue) => (
            <button
              key={issue.id}
              onClick={() => {
                const id = issue.nodeIds[0];
                const node = state.graph.nodes.find((item) => item.id === id);
                dispatch({
                  type: 'select',
                  id: id ?? null,
                  kind:
                    node?.data.kind ?? (issue.id === 'stage-evaluation' ? 'evaluation' : undefined),
                });
              }}
            >
              <AlertCircle size={17} />
              <span>
                <strong>{issue.message}</strong>
                <small>{issue.hint}</small>
              </span>
              <ArrowUpRight size={15} />
            </button>
          ))}
        </div>
      ) : state.steps.length > 0 ? (
        <div className={styles.steps}>
          {completed && (
            <div
              className={`${styles.outcome} ${failed ? styles.outcomeFail : ''}`}
              data-testid="simulation-outcome"
            >
              {failed ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}
              {failed
                ? '평가 기준 미달 · 모델 등록과 서빙이 차단되었습니다.'
                : '전체 흐름 완료 · 평가를 통과한 모델이 서빙까지 전달되었습니다.'}
            </div>
          )}
          <div className={styles.stepGrid}>
            {state.steps.map((step, index) => {
              const revealed = index < state.cursor;
              const status = revealed
                ? step.status
                : state.playing && index === state.cursor
                  ? 'running'
                  : 'waiting';
              return (
                <div
                  key={step.nodeId}
                  className={`${styles.step} ${styles[status]}`}
                  data-testid={`result-${step.kind}`}
                >
                  <div>
                    {status === 'success' ? (
                      <CheckCircle2 size={15} />
                    ) : status === 'blocked' ? (
                      <LockKeyhole size={14} />
                    ) : status === 'failed' ? (
                      <AlertCircle size={15} />
                    ) : (
                      <Circle size={14} />
                    )}
                    <strong>{stageByKind[step.kind].title}</strong>
                    <span>
                      {
                        {
                          waiting: '대기',
                          running: '진행 중',
                          success: '완료',
                          failed: '실패',
                          blocked: '차단',
                        }[status]
                      }
                    </span>
                  </div>
                  <p>{revealed ? step.artifact : '차례를 기다리고 있어요'}</p>
                  {revealed && <small>{step.explanation}</small>}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={styles.resultsEmpty}>
          {state.validated ? <CheckCircle2 size={22} /> : <FlaskConical size={24} />}
          <div>
            <strong>
              {state.validated ? '연결이 준비되었습니다.' : '연결을 완성하면 흐름이 보입니다.'}
            </strong>
            <p>
              {state.validated
                ? '실행 또는 다음 단계 버튼으로 결과를 확인하세요.'
                : '검증을 눌러 구성을 확인하고, 시뮬레이션을 실행해 보세요.'}
            </p>
          </div>
          <span>실제 모델 학습 · 외부 API 호출 없음</span>
        </div>
      )}
    </section>
  );
}
