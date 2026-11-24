import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';
import { postError } from '../src/api/posts/posts';
import type { Graph } from '../src/systemLab/lab';
import { workflowShortfall } from '../src/playground/workflow';

const fail = (status: number, data: unknown) =>
  new AxiosError('x', undefined, undefined, undefined, {
    status,
    data,
  } as AxiosError['response']);

describe('postError', () => {
  it('422 요건 미달은 서버 메시지를 그대로 보여준다', () => {
    const message = '워크플로우에는 엔티티가 2개 이상, 연결이 1개 이상 필요합니다.';
    expect(postError(fail(422, { code: 'WORKFLOW_REQUIREMENTS_NOT_MET', message }))).toBe(message);
  });
  it('400 워크플로우 형식 오류를 구분한다', () => {
    const data = {
      code: 'INVALID_REQUEST',
      message: 'workflow: workflow 형식이 올바르지 않습니다.',
    };
    expect(postError(fail(400, data))).toContain('워크플로우의 형식');
  });
  it('그 외 400은 일반 안내를 쓴다', () => {
    expect(postError(fail(400, { code: 'INVALID_REQUEST', message: 'title: 필수' }))).toBe(
      '입력한 내용을 확인해 주세요.',
    );
  });
});

describe('workflowShortfall', () => {
  const graph = (entities: number, connections: number) =>
    ({ entities: Array(entities).fill({}), connections: Array(connections).fill({}) }) as Graph;
  it('부족한 항목과 개수를 알려준다', () => {
    const message = workflowShortfall(graph(1, 0));
    expect(message).toContain('엔티티가 1개');
    expect(message).toContain('연결이 0개');
  });
  it('조건을 채우면 null', () => expect(workflowShortfall(graph(2, 1))).toBeNull());
});
