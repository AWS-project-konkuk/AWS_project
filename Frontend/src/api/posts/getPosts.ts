import { readWorkflow } from '../../playground/workflow';
import { api } from '../client';
import { isPostId, type PageResponse, type Post, type PostSummary } from './posts';

function isPostSummary(post: PostSummary) {
  return (
    post &&
    typeof post.id === 'string' &&
    isPostId(post.id) &&
    typeof post.title === 'string' &&
    typeof post.author === 'string' &&
    typeof post.createdAt === 'string'
  );
}

export { readWorkflow };

export async function getPostWorkflow(id: string, signal: AbortSignal) {
  const { data } = await api.get<unknown>('/posts/' + id + '/workflow', { signal });
  return readWorkflow(data);
}

export async function listPosts(page: number, size: number, signal: AbortSignal) {
  const { data } = await api.get<PageResponse<PostSummary>>('/posts', {
    params: { page, size },
    signal,
  });
  if (
    !Array.isArray(data?.content) ||
    !data.content.every(isPostSummary) ||
    data.page !== page ||
    !Number.isSafeInteger(data.size) ||
    data.size < 1 ||
    !Number.isSafeInteger(data.totalElements) ||
    data.totalElements < 0 ||
    !Number.isSafeInteger(data.totalPages) ||
    data.totalPages < 0 ||
    typeof data.hasNext !== 'boolean'
  ) {
    throw new Error('게시판 서버의 응답 형식을 읽을 수 없습니다.');
  }
  return data;
}

export async function getPost(id: string, signal: AbortSignal) {
  const { data } = await api.get<Post>('/posts/' + id, { signal });
  if (!isPostSummary(data) || (data.body != null && typeof data.body !== 'string')) {
    throw new Error('게시글 응답 형식을 읽을 수 없습니다.');
  }
  return data;
}
