import { LoaderCircle } from 'lucide-react';
import type { ExplainResponse } from '../api/explain';
import { ResultFeedback } from './ResultFeedback';
import styles from './QuizAi.module.css';

export function QuizAiFeedback({
  loading,
  evaluation,
  error,
  request,
}: {
  loading: boolean;
  evaluation: ExplainResponse | null;
  error: string;
  request: () => Promise<void>;
}) {
  if (loading)
    return (
      <p className={styles.loading} role="status">
        <LoaderCircle size={17} className={styles.spinner} aria-hidden="true" />
        AI가 선택한 이유를 검토하고 있습니다.
      </p>
    );
  if (error)
    return (
      <ResultFeedback tone="error" title="AI 요청 실패" label="AI 요청 실패">
        <p>{error}</p>
        <button type="button" onClick={() => void request()}>
          다시 요청하기
        </button>
      </ResultFeedback>
    );
  if (!evaluation) return null;
  const correct = evaluation.display === 'correct';
  const needsWork = evaluation.display === 'needs_work';
  return (
    <ResultFeedback
      tone={correct ? 'success' : 'info'}
      title={correct ? '정확해요' : needsWork ? '보완이 필요해요' : 'AI 검토 안내'}
      label="AI 검토 결과"
    >
      <p className={styles.feedback}>{evaluation.feedback}</p>
      {evaluation.status === 'fallback' && (
        <button type="button" onClick={() => void request()}>
          다시 요청하기
        </button>
      )}
    </ResultFeedback>
  );
}
