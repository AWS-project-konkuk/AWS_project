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

export function postError(error: unknown): string {
  if (!isAxiosError(error)) return error instanceof Error ? error.message : '요청에 실패했습니다.';
  switch (error.response?.status) {
    case 400:
      return '입력한 내용을 확인해 주세요.';
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
