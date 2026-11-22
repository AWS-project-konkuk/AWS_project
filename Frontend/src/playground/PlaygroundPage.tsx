import { useMutation } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { getPostWorkflow } from '../api/posts/getPosts';
import { isPostId, postError } from '../api/posts/posts';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { NativeSelect } from '../components/ui/native-select';
import { playgroundLab } from '../systemLab/labs';
import { exampleWorkflows } from '../systemLab/labs/playground-example';
import { labStore } from '../systemLab/store';
import { PlaygroundLab } from '../systemLab/SystemLab';
import { usePlaygroundLibrary } from './library';
import { PlaygroundLibrary } from './PlaygroundLibrary';
import { hasNodes } from './workflow';

/** 게시판에 올린 워크플로우를 ID로 불러온다. 현재 구성은 확인 뒤에 바꾼다. */
function ImportWorkflow() {
  const [searchParams] = useSearchParams();
  const [workflowId, setWorkflowId] = useState(searchParams.get('workflow') ?? '');
  const store = labStore(playgroundLab);
  const load = useMutation({
    mutationFn: (id: string) => {
      if (!isPostId(id)) throw new Error('게시판에서 복사한 워크플로우 ID를 입력해 주세요.');
      return getPostWorkflow(id);
    },
    onSuccess: ({ graph }) => {
      store.getState().load(graph);
      usePlaygroundLibrary.getState().open(null);
    },
  });
  return (
    <form
      className="flex flex-wrap items-center gap-1.5"
      onSubmit={(event) => {
        event.preventDefault();
        const id = workflowId.trim();
        if (
          load.isPending ||
          (hasNodes(store.getState().saved.graph) &&
            !window.confirm('현재 구성을 불러온 워크플로우로 바꿀까요?'))
        )
          return;
        load.mutate(id);
      }}
    >
      <Input
        value={workflowId}
        onChange={(event) => setWorkflowId(event.target.value)}
        placeholder="게시판 워크플로우 ID"
        aria-label="게시판 워크플로우 ID"
        className="w-52"
      />
      <Button type="submit" disabled={load.isPending || !workflowId.trim()}>
        <Download size={15} /> {load.isPending ? '불러오는 중' : '불러오기'}
      </Button>
      {load.isError && (
        <span role="alert" className="text-ui-error">
          {postError(load.error)}
        </span>
      )}
    </form>
  );
}

/** 쉬운 구성부터 전체 MLOps까지 5단계 예시 중 하나를 불러온다. 현재 구성은 확인 뒤에 바꾼다. */
function LoadExample() {
  const store = labStore(playgroundLab);
  return (
    <NativeSelect
      aria-label="MLOps 예시"
      value=""
      onChange={(event) => {
        const example = exampleWorkflows.find((item) => item.id === event.target.value);
        if (!example) return;
        if (
          hasNodes(store.getState().saved.graph) &&
          !window.confirm('현재 구성을 "' + example.title + '"으로 바꿀까요?')
        )
          return;
        store.getState().load(example.build());
        usePlaygroundLibrary.getState().open(null);
      }}
    >
      <option value="">MLOps 예시 (1~5단계)</option>
      {exampleWorkflows.map((item) => (
        <option key={item.id} value={item.id}>
          {item.title}
        </option>
      ))}
    </NativeSelect>
  );
}

export function PlaygroundPage() {
  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col" data-testid="playground">
      <PlaygroundLab
        actions={
          <>
            <PlaygroundLibrary />
            <LoadExample />
            <ImportWorkflow />
          </>
        }
      />
    </main>
  );
}
