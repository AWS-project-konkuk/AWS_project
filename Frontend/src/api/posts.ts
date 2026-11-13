import { isAxiosError } from 'axios';
import { parsePlayground, type PlaygroundData } from '../playground/model';
import { api } from './client';

export interface Post {
  id: string;
  title: string;
  author: string;
  body: string;
  createdAt: string;
  updatedAt: string | null;
  workflow: unknown;
}

export interface PostDraft {
  title: string;
  body: string;
  password: string;
  workflow: unknown;
}

export const isPostId = (value: string) =>
  /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);

export async function listPosts(signal: AbortSignal): Promise<Post[]> {
  const { data } = await api.get<Post[]>('/posts', { signal });
  if (
    !Array.isArray(data) ||
    data.some(
      (post) =>
        !post ||
        typeof post.id !== 'string' ||
        !isPostId(post.id) ||
        typeof post.title !== 'string' ||
        typeof post.author !== 'string' ||
        typeof post.body !== 'string' ||
        typeof post.createdAt !== 'string',
    )
  ) {
    throw new Error('게시판 서버의 응답 형식을 읽을 수 없습니다.');
  }
  return [...data].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function createPost(draft: PostDraft & { author: string }) {
  const { data } = await api.post<Pick<Post, 'id'>>('/posts', draft);
  if (typeof data?.id !== 'string' || !isPostId(data.id))
    throw new Error('등록한 게시글 ID를 확인할 수 없습니다.');
  return data.id;
}

export async function updatePost(id: string, draft: PostDraft) {
  await api.patch('/posts/' + id, draft);
}

export async function deletePost(id: string, password: string) {
  await api.delete('/posts/' + id, { data: { password } });
}

export function readWorkflow(value: unknown): PlaygroundData {
  if (value && typeof value === 'object' && 'workflow' in value) value = value.workflow;
  try {
    return parsePlayground(JSON.stringify(value));
  } catch {
    throw new Error('이 워크플로우의 Playground 형식을 읽을 수 없습니다.');
  }
}

export async function getPostWorkflow(id: string) {
  const { data } = await api.get<unknown>('/posts/' + id + '/workflow');
  return readWorkflow(data);
}

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
