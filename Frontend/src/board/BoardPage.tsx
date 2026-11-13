import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardCopy, RefreshCw } from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { deletePost, postError, readWorkflow, type Post } from '../api/posts';
import { ErrorPage } from '../components/ErrorPage';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { postsQuery } from './boardQuery';
import { PostForm } from './PostForm';
import { WorkflowPreview } from './WorkflowPreview';

const pageSize = 30;

function previewData(post: Post) {
  if (post.workflow == null) return null;
  try {
    return readWorkflow(post.workflow);
  } catch {
    return null;
  }
}

export function BoardPage() {
  const posts = useQuery(postsQuery);
  const [search, setSearch] = useSearchParams();
  const count = posts.data?.length ?? 0;
  const pages = Math.max(1, Math.ceil(count / pageSize));
  const requestedPage = Number(search.get('page'));
  const page = Number.isSafeInteger(requestedPage)
    ? Math.max(1, Math.min(pages, requestedPage))
    : 1;
  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-8 sm:py-12">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-3xl font-bold">워크플로우 게시판</h1>
          {posts.data && (
            <p className="mt-2 mb-0 text-ui-muted" aria-live="polite">
              {count}개 게시글
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
      {posts.data && !count && (
        <p className="border-0 border-y border-solid border-ui-rule py-14 text-center text-ui-muted">
          아직 게시글이 없습니다.
        </p>
      )}
      {!!count && (
        <>
          <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {posts.data?.slice((page - 1) * pageSize, page * pageSize).map((post) => (
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
          {pages > 1 && (
            <nav className="mt-6 flex items-center justify-center gap-3" aria-label="게시판 페이지">
              <Button disabled={page === 1} onClick={() => setSearch({ page: String(page - 1) })}>
                이전
              </Button>
              <span aria-live="polite">
                {page} / {pages}
              </span>
              <Button
                disabled={page === pages}
                onClick={() => setSearch({ page: String(page + 1) })}
              >
                다음
              </Button>
            </nav>
          )}
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
      cache.setQueryData(postsQuery.queryKey, (items) =>
        items?.filter((item) => item.id !== post.id),
      );
      await navigate('/board', { replace: true });
      await cache.invalidateQueries({ queryKey: postsQuery.queryKey });
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
      <p className="my-6 break-words whitespace-pre-wrap text-ui-ink-2">{post.body}</p>
      <div className="overflow-hidden rounded-lg border border-solid border-ui-rule-2">
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
  const { postId } = useParams();
  const posts = useQuery({ ...postsQuery, enabled: mode !== 'new' });
  const post = posts.data?.find((item) => item.id === postId);
  if (mode !== 'new' && !post && posts.isSuccess && !posts.isFetching)
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
      ) : posts.isError ? (
        <>
          <p role="alert" className="text-ui-error">
            {postError(posts.error)}
          </p>
          <Button onClick={() => void posts.refetch()}>다시 시도</Button>
        </>
      ) : (
        <p role="status">게시글을 불러오는 중입니다.</p>
      )}
    </main>
  );
}
