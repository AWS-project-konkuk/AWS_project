import { beforeEach, expect, it, vi } from 'vitest';
const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock('../src/api/client', () => ({ api: { post } }));
import { requestHint, type HintRequest } from '../src/api/hint';
import { applyCommand } from '../src/systemLab/commands';
import { runLab } from '../src/systemLab/engine';
import { buildHintRequest, canRequestHint, type HintRun } from '../src/systemLab/hint';
import { definition, signature, starterTasks, type Graph } from '../src/systemLab/model';
import { labConfigs } from '../src/systemLab/labs';

const lesson = {
  id: 'week2-workflow',
  title: '학습된 모델을 Pod 안에서 서비스하기',
  scenario: '두 Pod로 요청을 처리하세요.',
  summary: '모델·이미지·요청 경로를 이해합니다.',
};
function completedRun(graph: Graph): HintRun {
  const result = runLab(graph, 'run-1');
  return { result, stamp: signature(graph), cursor: result.steps.length, stopped: false };
}
function payload() {
  const graph = definition.initial();
  return buildHintRequest(lesson, graph, completedRun(graph));
}
beforeEach(() => {
  post.mockReset();
});

it('실패 실행과 계층·자동 경로를 전송하고 화면 좌표는 제외한다', async () => {
  const request = payload();
  const reply = {
    status: 'ok',
    concept: 'Pod에 모델을 연결해야 합니다.',
    hint: '시작의 모델 포트를 확인했나요?',
  };
  post.mockResolvedValue({
    data: {
      status: reply.status,
      conecpt: reply.concept,
      hint: reply.hint,
      errorBasis: '모델 입력 누락',
      display: reply.concept + ' ' + reply.hint,
    },
  });
  const controller = new AbortController();
  await expect(requestHint(request, controller.signal)).resolves.toEqual(reply);
  expect(post).toHaveBeenCalledWith('/chat/ai/hint', request, {
    signal: controller.signal,
    timeout: 130_000,
  });
  expect(Object.keys(request).sort()).toEqual([
    'edges',
    'lessonId',
    'nodes',
    'ruleCheck',
    'settings',
  ]);
  expect(request.nodes.find((node) => node.id === 'pod-a')).toMatchObject({
    parent: 'kubernetes',
  });
  expect(
    request.edges.filter((edge) => edge.kind === 'service-route').map((edge) => edge.to.node),
  ).toEqual(['pod-a', 'pod-b']);
  expect(
    request.nodes.every(
      (node) => !('position' in node) && !('width' in node) && !('enabled' in node),
    ),
  ).toBe(true);
  expect(request.ruleCheck.first_failure).toContain('응답 0 / 10건');
  expect(request.ruleCheck.issues).toContain(request.ruleCheck.first_failure);
});

it('실행 전·실행 중·중단·없는 강의·구성 변경 후 요청을 만들지 않는다', () => {
  const graph = definition.initial();
  const run = completedRun(graph);
  expect(run.cursor).toBeGreaterThan(0);
  for (const current of [null, { ...run, cursor: run.cursor - 1 }, { ...run, stopped: true }]) {
    expect(canRequestHint(lesson.id, graph, current)).toBe(false);
    expect(() => buildHintRequest(lesson, graph, current)).toThrow('끝까지 실행');
  }
  expect(() => buildHintRequest({ ...lesson, id: 'unknown-lesson' }, graph, run)).toThrow();
  const edited = applyCommand(graph, { type: 'connect', edge: starterTasks[0] });
  expect(canRequestHint(lesson.id, edited, run)).toBe(false);
  const moved = structuredClone(graph);
  moved.entities[1].position.x += 10;
  expect(canRequestHint(lesson.id, moved, run)).toBe(true);
});

it('성공 실행은 거절하고 API 호출도 성공·빈 강의 ID 요청을 방어한다', async () => {
  let graph = definition.initial();
  for (const edge of starterTasks) graph = applyCommand(graph, { type: 'connect', edge });
  const run = completedRun(graph);
  expect(run.result.success).toBe(true);
  expect(() => buildHintRequest(lesson, graph, run)).toThrow();
  const request = payload();
  for (const invalid of [
    { ...request, ruleCheck: { ...request.ruleCheck, success: true } },
    { ...request, lessonId: ' ' },
    { ...request, ruleCheck: { ...request.ruleCheck, first_failure: ' ' } },
  ]) {
    await expect(requestHint(invalid as unknown as HintRequest)).rejects.toThrow();
  }
  expect(post).not.toHaveBeenCalled();
});

it('단계 기록이 없는 순환 실패의 근거와 스냅샷을 보존한다', () => {
  const graph = definition.initial();
  // A graph-level failure can finish without any animated steps.
  graph.connections.push({
    id: 'loop',
    from: { node: 'service', port: 'out-request' },
    to: { node: 'start', port: 'in-request' },
  });
  const run = completedRun(graph);
  expect(run.result.steps).toHaveLength(0);
  expect(run.result.cycle.length).toBeGreaterThan(0);
  const request = buildHintRequest(lesson, graph, run);
  expect(request.settings.cycle).toEqual(run.result.cycle);
  expect(request.ruleCheck.first_failure).toBe(run.result.message);
  graph.entities[1].name = '변경된 이름';
  graph.connections[0].to.node = 'edited';
  run.result.cycle.length = 0;
  expect(request.nodes[1].name).not.toBe('변경된 이름');
  expect(request.edges[0].to.node).not.toBe('edited');
  expect(request.settings.cycle.length).toBeGreaterThan(0);
});

it('fallback은 정상 응답이며 잘못된 형식·길이·빈 성공 응답은 거절한다', async () => {
  const fallback = {
    status: 'fallback',
    concept: '지금은 힌트를 만들지 못했어요.',
    hint: '실행 결과를 다시 확인할까요?',
  };
  post.mockResolvedValue({
    data: { status: fallback.status, conecpt: fallback.concept, hint: fallback.hint },
  });
  await expect(requestHint(payload())).resolves.toEqual(fallback);
  for (const data of [
    null,
    {},
    { status: 'ok', errorBasis: '', conecpt: '', hint: '', display: '모든 단계가 성공했어요!' },
    { ...fallback, concept: ' ' },
    { ...fallback, hint: null },
    { ...fallback, hint: '질문이 아님' },
    { ...fallback, concept: '가'.repeat(201) },
    { ...fallback, hint: '가'.repeat(160) + '?' },
  ]) {
    post.mockResolvedValue({ data });
    await expect(requestHint(payload())).rejects.toThrow('올바르지');
  }
  const boundary = { status: 'ok', concept: '가'.repeat(200), hint: '가'.repeat(159) + '?' };
  post.mockResolvedValue({ data: boundary });
  await expect(requestHint(payload())).resolves.toEqual(boundary);
});

it('통신 오류를 그대로 전달하며 자동 재시도하지 않는다', async () => {
  const error = new Error('timeout');
  post.mockRejectedValue(error);
  await expect(requestHint(payload())).rejects.toBe(error);
  expect(post).toHaveBeenCalledTimes(1);
});

it('요청 취소 오류를 그대로 전달한다', async () => {
  const cancelled = Object.assign(new Error('cancelled'), { code: 'ERR_CANCELED' });
  post.mockRejectedValue(cancelled);
  await expect(requestHint(payload())).rejects.toBe(cancelled);
  expect(post).toHaveBeenCalledTimes(1);
});

it('시스템 실습이 있는 모든 강의에서 실패한 실행의 조언 요청을 만든다', () => {
  for (const [id, lab] of Object.entries(labConfigs)) {
    const graph = lab.initial();
    const result = runLab(graph, 'run-' + id, lab);
    const run: HintRun = {
      result,
      stamp: signature(graph),
      cursor: result.steps.length,
      stopped: false,
    };
    expect(result.success, id).toBe(false);
    expect(canRequestHint(id, graph, run), id).toBe(true);
    const request = buildHintRequest({ ...lesson, id }, graph, run);
    expect(request.lessonId).toBe(id);
    expect(request.ruleCheck.first_failure.trim(), id).not.toBe('');
    expect(request.nodes.length, id).toBe(graph.entities.length);
    expect(request.settings.metrics, id).toBeInstanceOf(Array);
  }
});
