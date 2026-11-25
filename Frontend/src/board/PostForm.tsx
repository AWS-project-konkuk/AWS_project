import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { createPost, updatePost } from '../api/posts/postPosts';
import { postError, type Post } from '../api/posts/posts';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { NativeSelect } from '../components/ui/native-select';
import { Textarea } from '../components/ui/textarea';
import { usePlaygroundLibrary } from '../playground/library';
import { hasNodes, toWorkflow, workflowShortfall } from '../playground/workflow';
import { playgroundLab } from '../systemLab/labs';
import { labStore } from '../systemLab/store';
import { postListKey, postQuery } from './boardQuery';
import { PasswordNotice } from './PasswordNotice';

export function PostForm({ post }: { post?: Post }) {
  const navigate = useNavigate();
  const cache = useQueryClient();
  const { saved, blocked } = labStore(playgroundLab)();
  const attachable = !blocked && hasNodes(saved.graph);
  const library = usePlaygroundLibrary((state) => state.items);
  const [search] = useSearchParams();
  const requested = search.get('attach');
  const [attachment, setAttachment] = useState(() =>
    post
      ? 'keep'
      : requested === 'current'
        ? 'current'
        : library.some((item) => item.id === requested)
          ? 'saved:' + requested
          : 'keep',
  );
  const back = post ? '/board/' + post.id : '/board';
  const save = useMutation({
    mutationFn: async (fields: FormData) => {
      const title = String(fields.get('title')).trim();
      const body = String(fields.get('body')).trim();
      const password = String(fields.get('password'));
      const author = String(fields.get('author') ?? '').trim();
      if (!title || !password.trim() || (!post && (!author || !body)) || (post?.body && !body)) {
        throw new Error('필수 항목을 입력해 주세요.');
      }
      const savedItem = library.find((item) => 'saved:' + item.id === attachment);
      const attached = attachment === 'current' ? saved.graph : savedItem ? savedItem.graph : null;
      if (attached) {
        const shortfall = workflowShortfall(attached);
        if (shortfall) throw new Error(shortfall);
      }
      const workflow = attached ? toWorkflow(attached) : (post?.workflow ?? null);
      if (!workflow)
        throw new Error('워크플로우를 첨부해 주세요. 워크플로우가 없는 글은 등록할 수 없습니다.');
      if (post) {
        await updatePost(post.id, { title, body: body || undefined, password, workflow });
        return post.id;
      }
      return createPost({ author, title, body, password, workflow });
    },
    onSuccess: async (id) => {
      await Promise.all([
        cache.invalidateQueries({ queryKey: postListKey }),
        cache.invalidateQueries({ queryKey: postQuery(id).queryKey }),
      ]);
      await navigate('/board/' + id, { replace: true });
    },
  });
  return (
    <form
      className="mx-auto grid max-w-2xl gap-4 [&_label]:grid [&_label]:gap-1.5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!save.isPending) save.mutate(new FormData(event.currentTarget));
      }}
    >
      <h1 className="m-0 text-3xl font-bold">{post ? '게시글 수정' : '글 쓰기'}</h1>
      {!post && (
        <label>
          작성자
          <Input name="author" required />
        </label>
      )}
      <label>
        제목
        <Input name="title" required defaultValue={post?.title} />
      </label>
      <label>
        내용
        <Textarea
          name="body"
          required={!post || Boolean(post.body)}
          rows={7}
          defaultValue={post?.body ?? ''}
          placeholder={post && post.body == null ? '비워 두면 기존 본문을 유지합니다.' : undefined}
        />
      </label>
      <label>
        비밀번호
        <Input
          name="password"
          type="password"
          autoComplete={post ? 'current-password' : 'new-password'}
          required
        />
        <PasswordNotice />
      </label>
      <label>
        워크플로우
        <NativeSelect value={attachment} onChange={(event) => setAttachment(event.target.value)}>
          <option value="keep">{post ? '현재 첨부 유지' : '워크플로우 선택'}</option>
          <option value="current" disabled={!attachable}>
            지금 작업 중인 Playground
          </option>
          {library.map((item) => (
            <option key={item.id} value={'saved:' + item.id}>
              저장한 Playground · {item.name}
            </option>
          ))}
        </NativeSelect>
      </label>
      {save.isError && (
        <p role="alert" className="m-0 text-ui-error">
          {postError(save.error)}
        </p>
      )}
      <div className="flex gap-2">
        <Button variant="default" type="submit" disabled={save.isPending}>
          {save.isPending ? '저장 중' : '저장'}
        </Button>
        <Button asChild className="no-underline">
          <Link to={back}>취소</Link>
        </Button>
      </div>
    </form>
  );
}
