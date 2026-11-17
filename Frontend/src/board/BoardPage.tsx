import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { ClipboardCopy, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import { readWorkflow } from '../api/posts/getPosts';
import { deletePost } from '../api/posts/postPosts';
import { isPostId, postError, type Post, type PostSummary } from '../api/posts/posts';
import { ErrorPage } from '../components/ErrorPage';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { postListKey, postQuery, postsQuery } from './boardQuery';
import { BoardPagination } from './BoardPagination';
import { PostForm } from './PostForm';
import { WorkflowPreview } from './WorkflowPreview';

const pageSize = 30;

function previewData(post: PostSummary) {
  if (post.workflow == null) return null;
  try {
    return readWorkflow(post.workflow);
  } catch {
    return null;
  }
}

export function BoardPage() {
  const [search] = useSearchParams();
  const requestedPage = Number(search.get('page'));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const posts = useQuery(postsQuery(page - 1, pageSize));
  const pagination = posts.data;
  const lastPage = Math.max(1, pagination?.totalPages ?? 0);
  const pageSearch = (target: number) => {
    const params = new URLSearchParams(search);
    params.set('page', String(target));
    return params;
  };

  if (posts.isSuccess && !posts.isFetching && page > lastPage) {
    return <Navigate to={{ search: '?' + pageSearch(lastPage).toString() }} replace />;
  }

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-8 sm:py-12">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-3xl font-bold">워크플로우 게시판</h1>
          {pagination && (
            <p className="mt-2 mb-0 text-ui-muted" aria-live="polite">
              {pagination.totalElements}개 게시글
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={posts.isFetching} onClick={() => void posts.refetch()}>
            <RefreshCw size={16} /> 새로고침
          </Button>
          <Button asChild variant="default" className="no-underline">
            <Link to="/board/new">글 쓰기</Link>
          </Button>
        </div>
      </header>
      {posts.isPending && <p role="status">게시글을 불러오는 중입니다.</p>}
      {posts.isError && (
        <p role="alert" className="text-ui-error">
          {postError(posts.error)}
        </p>
      )}
      {pagination?.totalElements === 0 && page === 1 && (
        <p className="border-0 border-y border-solid border-ui-rule py-14 text-center text-ui-muted">
          아직 게시글이 없습니다.
        </p>
      )}
      {pagination && pagination.content.length > 0 && (
        <>
          <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {pagination.content.map((post) => (
              <li key={post.id} className="min-w-0">
                <Link
                  to={'/board/' + post.id}
                  className="block h-full overflow-hidden rounded-lg border border-solid border-ui-rule-2 bg-ui-paper no-underline hover:border-ui-accent"
                >
                  <WorkflowPreview workflow={previewData(post)} />
                  <div className="flex items-baseline justify-between gap-2 px-3 py-2.5">
                    <strong className="min-w-0 truncate text-sm">{post.title}</strong>
                    <span className="max-w-[42%] truncate text-xs text-ui-muted">
                      {post.author}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <BoardPagination page={page} totalPages={pagination.totalPages} pageSearch={pageSearch} />
        </>
      )}
    </main>
  );
}

function PostDetails({ post }: { post: Post }) {
  const [copyStatus, setCopyStatus] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const navigate = useNavigate();
  const cache = useQueryClient();
  const workflow = previewData(post);
  const remove = useMutation({
    mutationFn: (password: string) => deletePost(post.id, password),
    onSuccess: async () => {
      await cache.invalidateQueries({ queryKey: postListKey });
      await navigate('/board', { replace: true });
      cache.removeQueries({ queryKey: postQuery(post.id).queryKey });
    },
  });
  return (
    <>
      <Link to="/board" className="text-sm text-ui-accent">
        게시판 목록
      </Link>
      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="m-0 break-words text-3xl font-bold">{post.title}</h1>
          <p className="mt-2 mb-0 break-words text-ui-muted">{post.author}</p>
        </div>
        {post.workflow != null && (
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(post.id);
                  setCopyStatus('워크플로우 ID를 복사했습니다.');
                } catch {
                  setCopyStatus('복사할 수 없습니다. ID ' + post.id);
                }
              }}
            >
              <ClipboardCopy size={16} /> 워크플로우 ID 복사
            </Button>
            <Button asChild variant="default" className="no-underline">
              <Link to={'/playground?workflow=' + post.id}>Playground에서 열기</Link>
            </Button>
          </div>
        )}
      </header>
      {copyStatus && (
        <p role="status" className="break-all text-sm text-ui-muted">
          {copyStatus}
        </p>
      )}
      {post.body && (
        <p className="my-6 break-words whitespace-pre-wrap text-ui-ink-2">{post.body}</p>
      )}
      <div className="mt-6 overflow-hidden rounded-lg border border-solid border-ui-rule-2">
        <WorkflowPreview workflow={workflow} detailed />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button asChild className="no-underline">
          <Link to={'/board/' + post.id + '/edit'}>수정</Link>
        </Button>
        <Button
          variant="destructive"
          disabled={remove.isPending}
          onClick={() => setConfirmDelete(!confirmDelete)}
        >
          삭제
        </Button>
      </div>
      {confirmDelete && (
        <form
          className="mt-4 flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!remove.isPending)
              remove.mutate(String(new FormData(event.currentTarget).get('password')));
          }}
        >
          <label className="grid gap-1">
            비밀번호
            <Input type="password" name="password" autoComplete="current-password" required />
          </label>
          <Button type="submit" variant="destructive" disabled={remove.isPending}>
            삭제 확인
          </Button>
        </form>
      )}
      {remove.isError && (
        <p role="alert" className="text-ui-error">
          {postError(remove.error)}
        </p>
      )}
    </>
  );
}

export function BoardPost({ mode }: { mode: 'read' | 'new' | 'edit' }) {
  const { postId = '' } = useParams();
  const validId = isPostId(postId);
  const detail = useQuery({ ...postQuery(postId), enabled: mode !== 'new' && validId });
  const post = detail.data;
  const notFound = isAxiosError(detail.error) && detail.error.response?.status === 404;
  if (mode !== 'new' && (!validId || notFound))
    return <ErrorPage code={404} description="게시글을 찾을 수 없습니다." />;
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
      {mode === 'new' ? (
        <PostForm />
      ) : post ? (
        mode === 'edit' ? (
          <PostForm key={post.id} post={post} />
        ) : (
          <PostDetails key={post.id} post={post} />
        )
      ) : detail.isError ? (
        <>
          <p role="alert" className="text-ui-error">
            {postError(detail.error)}
          </p>
          <Button onClick={() => void detail.refetch()}>다시 시도</Button>
        </>
      ) : (
        <p role="status">게시글을 불러오는 중입니다.</p>
      )}
    </main>
  );
}
