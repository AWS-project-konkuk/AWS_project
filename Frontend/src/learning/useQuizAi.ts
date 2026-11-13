import { useEffect, useRef, useState } from 'react';
import { chatErrorMessage, requestChat } from '../api/chat';
import type { Lesson } from '../curriculum/types';
import { aiReasonSchema } from '../validation/userInput';

export function buildQuizMessage(lesson: Lesson, answer: number, reason: string): string {
  const assessment = lesson.assessment!;
  return [
    '학습자의 선택 이유를 검토해 주세요. 한국어로 이유의 타당성, 잘못 이해한 부분, 보완할 설명을 알려 주세요. 답변은 마크다운으로 작성해 주세요.',
    `강의: ${lesson.title}`,
    `문제: ${assessment.question}`,
    ...assessment.options.map((option, index) => `${index + 1}. ${option}`),
    `정답: ${assessment.correct + 1}. ${assessment.options[assessment.correct]}`,
    `해설: ${assessment.explanation}`,
    `학습자의 선택: ${answer + 1}. ${assessment.options[answer]}`,
    `학습자의 이유:\n${reason.trim()}`,
  ].join('\n');
}

export function useQuizAi(lesson: Lesson, answer: unknown, reason: string) {
  const [result, setResult] = useState({ loading: false, answer: '', error: '', key: '' });
  const active = useRef<AbortController | null>(null);
  const key = JSON.stringify([lesson.id, answer, reason]);
  useEffect(() => {
    // 입력·강의가 바뀌거나 화면을 떠나면 이전 요청의 응답을 폐기한다.
    return () => {
      active.current?.abort();
      active.current = null;
    };
  }, [key]);
  const visible = result.key === key ? result : { loading: false, answer: '', error: '' };
  const canRequest =
    typeof answer === 'number' &&
    Number.isInteger(answer) &&
    lesson.assessment?.options[answer] !== undefined &&
    aiReasonSchema.safeParse(reason).success;
  async function request() {
    if (!canRequest || active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setResult({ loading: true, answer: '', error: '', key });
    try {
      const text = await requestChat(buildQuizMessage(lesson, answer, reason), controller.signal);
      if (!controller.signal.aborted) setResult({ loading: false, answer: text, error: '', key });
    } catch (error) {
      if (!controller.signal.aborted)
        setResult({ loading: false, answer: '', error: chatErrorMessage(error), key });
    } finally {
      if (active.current === controller) active.current = null;
    }
  }
  return {
    loading: visible.loading,
    answer: visible.answer,
    error: visible.error,
    canRequest,
    request,
  };
}
