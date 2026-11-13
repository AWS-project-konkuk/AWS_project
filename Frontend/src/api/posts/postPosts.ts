import { api } from '../client';
import { isPostId, type PostDraft, type PostSummary } from './posts';

export async function createPost(draft: PostDraft & { author: string }) {
  const { data } = await api.post<Pick<PostSummary, 'id'>>('/posts', draft);
  if (typeof data?.id !== 'string' || !isPostId(data.id))
    throw new Error('등록한 게시글 ID를 확인할 수 없습니다.');
  return data.id;
}

export async function updatePost(id: string, draft: Omit<PostDraft, 'body'> & { body?: string }) {
  await api.patch('/posts/' + id, draft);
}

export async function deletePost(id: string, password: string) {
  await api.delete('/posts/' + id, { data: { password } });
}
