import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router';
import { createPost, postError, updatePost, type Post } from '../api/posts';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { NativeSelect } from '../components/ui/native-select';
import { Textarea } from '../components/ui/textarea';
import { usePlaygroundStore } from '../playground/usePlayground';
import { postsQuery } from './boardQuery';

export function PostForm({ post }: { post?: Post }) {
  const navigate = useNavigate();
  const cache = useQueryClient();
  const { data, blocked } = usePlaygroundStore();
  const [attachment, setAttachment] = useState('keep');
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
      const workflow = attachment === 'current' ? data : (post?.workflow ?? null);
      if (post) {
        await updatePost(post.id, { title, body: body || undefined, password, workflow });
        return post.id;
      }
      return createPost({ author, title, body, password, workflow });
    },
    onSuccess: async (id) => {
      await cache.invalidateQueries({ queryKey: postsQuery.queryKey });
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
      </label>
      <label>
        워크플로우
        <NativeSelect value={attachment} onChange={(event) => setAttachment(event.target.value)}>
          <option value="keep">{post ? '현재 첨부 유지' : '첨부하지 않음'}</option>
          <option value="current" disabled={blocked || !data.resources.length}>
            내 Playground 첨부
          </option>
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
