import { LoaderCircle } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ResultFeedback } from './ResultFeedback';
import styles from './QuizAi.module.css';

export function QuizAiFeedback({
  loading,
  answer,
  error,
  request,
}: {
  loading: boolean;
  answer: string;
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
  if (!answer) return null;
  return (
    <ResultFeedback tone="info" title="AI 검토 결과" label="AI 검토 결과">
      <div className={styles.answer}>
        <Markdown remarkPlugins={[remarkGfm]} disallowedElements={['img', 'input']}>
          {answer}
        </Markdown>
      </div>
    </ResultFeedback>
  );
}
