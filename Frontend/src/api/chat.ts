import axios from 'axios';
import { api } from './client';

export async function requestChat(message: string, signal?: AbortSignal): Promise<string> {
  if (!message.trim() || message.length > 32_000) {
    throw new Error('요청 내용은 공백이 아닌 32,000자 이내여야 합니다. 작성한 이유를 줄여 주세요.');
  }
  const { data } = await api.post<{ answer: string }>(
    '/chat',
    { message },
    {
      signal,
      timeout: 130_000,
    },
  );
  if (typeof data?.answer !== 'string' || !data.answer.trim()) {
    throw new Error('AI 답변이 비어 있거나 올바르지 않습니다. 다시 요청해 주세요.');
  }
  return data.answer;
}

export function chatErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.response?.status === 504) {
      return 'AI 응답 시간이 초과되었습니다. 잠시 후 다시 요청해 주세요.';
    }
    if (!error.response)
      return '서버에 연결할 수 없습니다. 연결 상태를 확인하고 다시 요청해 주세요.';
    if (error.response.status === 503)
      return 'AI 서버가 아직 준비되지 않았습니다. 잠시 후 다시 요청해 주세요.';
    return 'AI 요청을 처리하지 못했습니다. 잠시 후 다시 요청해 주세요.';
  }
  return error instanceof Error ? error.message : 'AI 요청에 실패했습니다. 다시 요청해 주세요.';
}
