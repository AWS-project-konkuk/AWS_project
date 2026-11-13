import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { createPost, updatePost } from '../api/posts/postPosts';
import { postError, type Post } from '../api/posts/posts';
import { Button } from '../components/ui/button';
import { LimitedInput, LimitedTextarea } from '../components/ui/character-limit';
import { NativeSelect } from '../components/ui/native-select';
import { usePlaygroundStore } from '../playground/usePlayground';
import { inputLimits } from '../validation/userInput';
import { postListKey, postQuery } from './boardQuery';

export function PostForm({ post }: { post?: Post }) {
  const navigate = useNavigate();
  const cache = useQueryClient();
  const { data, blocked } = usePlaygroundStore();
  const [attachment, setAttachment] = useState('keep');
  const bodyRequired = !post || Boolean(post.body);
  const back = post ? '/board/' + post.id : '/board';
  const save = useMutation({
    mutationFn: async (fields: FormData) => {
      const title = String(fields.get('title') ?? '');
      const body = String(fields.get('body') ?? '');
      const password = String(fields.get('password') ?? '');
      const workflow = attachment === 'current' ? data : (post?.workflow ?? null);
      if (post) {
        await updatePost(post.id, {
          title,
          body: bodyRequired || body !== '' ? body : undefined,
          password,
          workflow,
        });
        return post.id;
      }
      return createPost({
        author: String(fields.get('author') ?? ''),
        title,
        body,
        password,
        workflow,
      });
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
          <LimitedInput aria-label="작성자" name="author" maxLength={inputLimits.author} required />
        </label>
      )}
      <label>
        제목
        <LimitedInput
          aria-label="제목"
          name="title"
          required
          maxLength={inputLimits.title}
          defaultValue={post?.title}
        />
      </label>
      <label>
        내용
        <LimitedTextarea
          aria-label="내용"
          name="body"
          required={bodyRequired}
          maxLength={inputLimits.body}
          rows={7}
          defaultValue={post?.body?.replace(/\r\n?/g, '\n') ?? ''}
          placeholder={post && post.body == null ? '비워 두면 기존 본문을 유지합니다.' : undefined}
        />
      </label>
      <label>
        비밀번호
        <LimitedInput
          aria-label="비밀번호"
          name="password"
          maxLength={inputLimits.password}
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
