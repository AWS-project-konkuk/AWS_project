import { isAxiosError } from 'axios';

export interface PostSummary {
  id: string;
  title: string;
  author: string;
  createdAt: string;
  updatedAt: string | null;
  workflow: unknown;
}

export interface Post extends PostSummary {
  body?: string | null;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface PostDraft {
  title: string;
  body: string;
  password: string;
  workflow: unknown;
}

export const isPostId = (value: string) =>
  /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);

/** 서버가 내려준 `{ code, message }` 오류 본문을 읽는다. 형식이 다르면 null. */
function serverError(data: unknown): { code: string; message: string } | null {
  if (!data || typeof data !== 'object') return null;
  const { code, message } = data as { code?: unknown; message?: unknown };
  return typeof code === 'string' && typeof message === 'string' ? { code, message } : null;
}

export function postError(error: unknown): string {
  if (!isAxiosError(error)) return error instanceof Error ? error.message : '요청에 실패했습니다.';
  const server = serverError(error.response?.data);
  switch (error.response?.status) {
    case 400:
      if (server?.message.startsWith('workflow:'))
        return '첨부한 워크플로우의 형식이 올바르지 않습니다. Playground에서 다시 저장한 뒤 첨부해 주세요.';
      return '입력한 내용을 확인해 주세요.';
    case 422:
      return server?.code === 'WORKFLOW_REQUIREMENTS_NOT_MET'
        ? server.message
        : '입력한 내용을 처리할 수 없습니다. 내용을 확인해 주세요.';
    case 401:
    case 403:
      return '비밀번호가 맞는지 확인해 주세요.';
    case 404:
      return '게시글 또는 워크플로우를 찾을 수 없습니다.';
    case 429:
      return '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
    default:
      return '게시판 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.';
  }
}
