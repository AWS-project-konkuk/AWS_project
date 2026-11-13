import type { z } from 'zod';
import {
  createPostSchema,
  passwordSchema,
  updatePostSchema,
  validateInput,
} from '../../validation/userInput';
import { api } from '../client';
import { isPostId, type PostSummary } from './posts';

export async function createPost(draft: z.input<typeof createPostSchema> & { workflow: unknown }) {
  const fields = validateInput(createPostSchema, draft);
  const { data } = await api.post<Pick<PostSummary, 'id'>>('/posts', {
    ...fields,
    workflow: draft.workflow,
  });
  if (typeof data?.id !== 'string' || !isPostId(data.id))
    throw new Error('등록한 게시글 ID를 확인할 수 없습니다.');
  return data.id;
}

export async function updatePost(
  id: string,
  draft: z.input<typeof updatePostSchema> & { workflow: unknown },
) {
  const fields = validateInput(updatePostSchema, draft);
  await api.patch('/posts/' + id, { ...fields, workflow: draft.workflow });
}

export async function deletePost(id: string, password: string) {
  await api.delete('/posts/' + id, { data: { password: validateInput(passwordSchema, password) } });
}
