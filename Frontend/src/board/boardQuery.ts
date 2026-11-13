import { queryOptions } from '@tanstack/react-query';
import { getPost, listPosts } from '../api/posts/getPosts';

export const postListKey = ['posts', 'list'] as const;

export const postsQuery = (page: number, size: number) =>
  queryOptions({
    queryKey: [...postListKey, page, size],
    queryFn: ({ signal }) => listPosts(page, size, signal),
    staleTime: 60_000,
    retry: false,
  });

export const postQuery = (id: string) =>
  queryOptions({
    queryKey: ['posts', 'detail', id],
    queryFn: ({ signal }) => getPost(id, signal),
    staleTime: 60_000,
    retry: false,
  });
