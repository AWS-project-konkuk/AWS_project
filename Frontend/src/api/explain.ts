import { api } from './client';

export interface ExplainRequest {
  lessonId: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  selected: number;
  reason: string;
}

export type ExplainResponse =
  | {
      status: 'ok';
      verdict: '정확' | '부분 정확' | '오개념';
      display: 'correct' | 'needs_work';
      feedback: string;
    }
  | { status: 'fallback' | 'blocked'; verdict: null; display: null; feedback: string };

function isExplainResponse(value: unknown): value is ExplainResponse {
  if (!value || typeof value !== 'object') return false;
  const { status, verdict, display, feedback } = value as Record<string, unknown>;
  if (typeof feedback !== 'string' || !feedback.trim() || feedback.length > 250) return false;
  if (status === 'fallback' || status === 'blocked') return verdict === null && display === null;
  return (
    status === 'ok' &&
    ((verdict === '정확' && display === 'correct') ||
      ((verdict === '부분 정확' || verdict === '오개념') && display === 'needs_work'))
  );
}

export async function requestExplain(
  request: ExplainRequest,
  signal?: AbortSignal,
): Promise<ExplainResponse> {
  if (!request.reason.trim() || request.reason.length > 32_000) {
    throw new Error('선택한 이유를 공백이 아닌 32,000자 이내로 작성해 주세요.');
  }
  const { data } = await api.post<unknown>('/chat/ai/explain', request, {
    signal,
    timeout: 130_000,
  });
  if (!isExplainResponse(data)) {
    throw new Error('AI 평가 응답이 비어 있거나 올바르지 않습니다. 다시 요청해 주세요.');
  }
  return data;
}
