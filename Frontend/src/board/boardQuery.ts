import { queryOptions } from '@tanstack/react-query';
import { listPosts } from '../api/posts';

export const postsQuery = queryOptions({
  queryKey: ['posts'],
  queryFn: ({ signal }) => listPosts(signal),
  staleTime: 60_000,
  retry: false,
});
