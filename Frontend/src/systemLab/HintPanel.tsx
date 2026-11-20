import { Lightbulb, LoaderCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import type { useSystemLabHint } from './useSystemLabHint';

export function HintPanel({
  hint,
  unavailableReason,
}: {
  hint: ReturnType<typeof useSystemLabHint>;
  unavailableReason: string;
}) {
  const received = hint.advice?.status === 'ok';
  const retry = Boolean(hint.error || hint.advice?.status === 'fallback');
  return (
    <section
      aria-label="실습 AI 조언"
      className="grid min-w-0 gap-2 rounded-lg border border-solid border-ui-rule bg-ui-paper-2 p-3 text-[13px] leading-relaxed [overflow-wrap:anywhere]"
    >
      <div className="flex items-center gap-1.5 font-bold text-ui-ink">
        <Lightbulb size={16} aria-hidden="true" />
        실패 원인 함께 살펴보기
      </div>
      <Button
        type="button"
        className="w-full whitespace-normal text-[13px]"
        disabled={!hint.canRequest || hint.loading || received}
        onClick={() => void hint.request()}
      >
        {hint.loading && (
          <LoaderCircle
            size={15}
            className="animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
        )}
        {hint.loading
          ? 'AI 조언 요청 중…'
          : received
            ? 'AI 조언 받음'
            : retry
              ? 'AI 조언 다시 받기'
              : 'AI 조언 받기'}
      </Button>
      {!hint.canRequest && <p className="m-0 text-ui-muted">{unavailableReason}</p>}
      <div aria-live="polite" aria-busy={hint.loading}>
        {hint.loading && (
          <p className="m-0 text-ui-muted">실행 결과와 현재 구성을 살펴보고 있어요.</p>
        )}
        {hint.error && (
          <p className="m-0 text-ui-error" role="alert">
            {hint.error}
          </p>
        )}
        {hint.advice && (
          <div aria-label="AI 조언 결과" className="grid gap-2">
            <div>
              <strong>{received ? '왜 실패했나요?' : '조언을 준비하지 못했어요'}</strong>
              <p className="mt-1 mb-0 whitespace-pre-wrap">{hint.advice.concept}</p>
            </div>
            <div className="rounded-md bg-ui-accent-wash p-2.5 text-ui-ink">
              <strong>확인해 보세요</strong>
              <p className="mt-1 mb-0 whitespace-pre-wrap">{hint.advice.hint}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
