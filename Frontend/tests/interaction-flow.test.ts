import { describe, expect, it } from 'vitest';
import { scenarioById } from '../src/weekly/scenarios';
import { applyWorkflowPreset } from '../src/weekly/presets';
import { runWorkflow, workflowEdge } from '../src/weekly/engine';
import { traceInline } from '../src/learning/inlineExecution';
import type { LabState } from '../src/curriculum/types';
import type { NodeExampleSpec } from '../src/curriculum/nodeExamples';

describe('과제별 초기 상태와 실행 중 오류', () => {
  for (const scenario of Object.values(scenarioById)) {
    const lab: LabState = {
      nodes: [],
      edges: [],
      activeNodes: [],
      answers: {},
      attempts: 0,
      completed: false,
    };
    it(`${scenario.id}: 완성 예시는 실행에 성공하고 새 구성은 기본값으로 돌아온다`, () => {
      const example = applyWorkflowPreset(scenario.id, lab, 'example');
      expect(runWorkflow(scenario.id, example).success).toBe(true);
      const fresh = applyWorkflowPreset(scenario.id, example, 'new');
      expect(fresh.edges).toEqual([]);
      for (const field of scenario.fields) expect(fresh.answers[field.id]).toBe(field.initial);
      const repair = applyWorkflowPreset(scenario.id, example, 'repair');
      expect(repair.edges.length).toBeLessThan(example.edges.length);
      expect(repair.edges).toEqual(scenario.starter.map(workflowEdge));
      for (const field of scenario.fields) expect(repair.answers[field.id]).toBe(field.initial);
      const run = runWorkflow(scenario.id, fresh);
      expect(run.stages.some((stage) => stage.status === 'success')).toBe(true);
      expect(
        run.stages.some((stage) => stage.status === 'failed' && stage.reason.includes('입력')),
      ).toBe(true);
    });
  }
});

const spec: NodeExampleSpec = {
  id: 'trace',
  title: '자료 흐름',
  prompt: '',
  afterSection: 0,
  kind: '자료 전달',
  practiceHint: '',
  nextLesson: '',
  nodes: ['a', 'b', 'c'].map((id) => ({ id, title: id, purpose: '', x: 0, y: 0 })),
  links: [
    { id: 'ab', source: 'a', target: 'b', label: '데이터', detail: '자료 전달', material: 'data' },
    { id: 'bc', source: 'b', target: 'c', label: '모델', detail: '모델 전달', material: 'model' },
  ],
};
it('본문 노드: 입력 누락 전까지 실행하고 도착 노드에서 실패한다', () => {
  expect(traceInline(spec, ['ab'], []).map((stage) => stage.status)).toEqual([
    'success',
    'success',
    'failed',
  ]);
});
it('본문 노드: 오답 선을 실행 결과에서 판별하고 순환도 종료한다', () => {
  const wrong = { source: 'a', target: 'c', sourceHandle: 'ab', targetHandle: 'bc' };
  expect(traceInline(spec, ['ab', 'bc'], [wrong]).find((stage) => stage.node === 'c')?.status).toBe(
    'failed',
  );
  const cycle = { source: 'c', target: 'a', sourceHandle: 'bc', targetHandle: 'ab' };
  expect(traceInline(spec, ['ab', 'bc'], [cycle]).every((stage) => stage.status === 'failed')).toBe(
    true,
  );
});
