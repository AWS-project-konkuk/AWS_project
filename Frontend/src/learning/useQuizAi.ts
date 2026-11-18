import { useEffect, useRef, useState } from 'react';
import { chatErrorMessage } from '../api/chat';
import { requestExplain, type ExplainResponse } from '../api/explain';
import type { Lesson } from '../curriculum/types';

const emptyResult = { loading: false, evaluation: null, error: '' };

export function useQuizAi(lesson: Lesson, answer: unknown, reason: string) {
  const [result, setResult] = useState<{
    loading: boolean;
    evaluation: ExplainResponse | null;
    error: string;
    key: string;
  }>({ ...emptyResult, key: '' });
  const active = useRef<AbortController | null>(null);
  const key = JSON.stringify([lesson.id, answer, reason]);
  useEffect(() => {
    // 입력·강의가 바뀌거나 화면을 떠나면 이전 요청의 응답을 폐기한다.
    return () => {
      active.current?.abort();
      active.current = null;
    };
  }, [key]);
  const visible = result.key === key ? result : emptyResult;
  const assessment = lesson.assessment;
  const canRequest =
    typeof answer === 'number' &&
    Number.isInteger(answer) &&
    assessment?.options[answer] !== undefined &&
    Boolean(reason.trim());
  async function request() {
    if (!canRequest || !assessment || active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setResult({ ...emptyResult, loading: true, key });
    try {
      const { question, options, correct, explanation } = assessment;
      const evaluation = await requestExplain(
        {
          lessonId: lesson.id,
          question,
          options,
          correct,
          explanation,
          selected: answer,
          reason: reason.trim(),
        },
        controller.signal,
      );
      if (!controller.signal.aborted) setResult({ ...emptyResult, evaluation, key });
    } catch (error) {
      if (!controller.signal.aborted)
        setResult({ ...emptyResult, error: chatErrorMessage(error), key });
    } finally {
      if (active.current === controller) active.current = null;
    }
  }
  return {
    loading: visible.loading,
    evaluation: visible.evaluation,
    error: visible.error,
    canRequest,
    request,
  };
}
