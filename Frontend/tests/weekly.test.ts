import { describe, expect, it } from 'vitest';
import { lessonById, lessons } from '../src/curriculum/blockml';
import type { Answer, LabState } from '../src/curriculum/types';
import { emptyLearning, parseLearning, serializeLearning } from '../src/learning/blockProgress';
import { createNodeLab } from '../src/nodes/lessonNodes';
import {
  runWorkflow,
  workflowEdge,
  workflowGoals,
  workflowIssues,
  workflowSignature,
} from '../src/weekly/engine';
import { resolveScenario, wire } from '../src/weekly/scenarios';
const fixes: Record<string, Record<string, Answer>> = {
  'week1-workflow': { strategy: 'tensor' },
  'week2-workflow': { deployment: 'v2', healing: 'on' },
  'week3-workflow': { cache: 'on', shard: 'on', persistent: 'volume' },
  'week4-workflow': { operation: 'pull' },
  'week5-workflow': { window: 'hour', embedding: 'same', retrieval: 'relevant' },
  'week6-workflow': { strategy: 'shadow', ready: 'yes' },
  'week7-workflow': { decision: 'investigate', quality: 0.9 },
  'pipeline-capstone': { threshold: 0.8 },
};
const connected = (id: string, changes: Record<string, Answer> = {}): LabState => {
  const lab = createNodeLab(lessonById[id]);
  lab.answers = { ...lab.answers, ...changes };
  lab.edges = resolveScenario(id, lab.answers).wires.map(workflowEdge);
  return lab;
};
describe('개념과 주차 종합 과정 분리', () => {
  it('기존 주소와 독립된 피처·검색 실습을 제공한다', () => {
    expect(lessons).toHaveLength(53);
    expect(lessons.filter((l) => l.activity)).toHaveLength(30);
    expect(lessonById['feature-workflow'].week).toBe(5);
    expect(lessonById['rag-workflow'].week).toBe(6);
    expect(lessonById['pipeline-capstone'].week).toBe(9);
  });
  for (const id of Object.keys(fixes))
    it(`${id}: 조건 실패 후 개선하면 실제 자료를 전달해 완료한다`, () => {
      const bad = connected(id);
      expect(workflowIssues(resolveScenario(id, bad.answers), bad)).toEqual([]);
      const failed = runWorkflow(id, bad);
      expect(failed.success).toBe(false);
      expect(failed.stages.some((s) => s.status === 'failed')).toBe(true);
      expect(
        failed.stages.filter((s) => s.status !== 'success').every((s) => s.outputs.length === 0),
      ).toBe(true);
      const good = connected(id, fixes[id]);
      const result = runWorkflow(id, good);
      expect(result.success).toBe(true);
      expect(result.stages.every((s) => s.status === 'success')).toBe(true);
      expect(result.stages.at(-1)!.outputs.length).toBeGreaterThan(0);
    });
  it('노드 이동·배열 순서는 결과에 영향을 주지 않는다', () => {
    const lab = connected('week1-workflow', fixes['week1-workflow']);
    const signature = workflowSignature(lab),
      run = runWorkflow('week1-workflow', lab);
    lab.nodes[0].position.x = -3000;
    lab.nodes.reverse();
    lab.edges.reverse();
    lab.activeNodes!.reverse();
    expect(workflowSignature(lab)).toBe(signature);
    expect(runWorkflow('week1-workflow', lab)).toEqual(run);
  });
});
describe('자료 종류·입출력·차단', () => {
  it('모델을 평가 데이터 입력에 연결하면 자료 종류 불일치를 설명한다', () => {
    const lab = connected('pipeline-capstone', { threshold: 0.8 });
    lab.edges = lab.edges.filter((e) => e.targetHandle !== 'data' || e.target !== 'eval');
    lab.edges.push(workflowEdge(wire('train', 'model', 'eval', 'data')));
    const r = runWorkflow('pipeline-capstone', lab);
    expect(r.stages.find((s) => s.node === 'eval')!.reason).toContain('자료 종류가 다릅니다');
    expect(r.stages.find((s) => s.node === 'registry')!.status).toBe('blocked');
  });
  it('같은 데이터 종류라도 학습용을 평가용에 연결하면 거절한다', () => {
    const lab = connected('pipeline-capstone', { threshold: 0.8 });
    lab.edges = lab.edges.filter((e) => !(e.target === 'eval' && e.targetHandle === 'data'));
    lab.edges.push(workflowEdge(wire('prep', 'train', 'eval', 'data')));
    expect(
      workflowIssues(resolveScenario('pipeline-capstone', lab.answers), lab).some((i) =>
        i.message.includes('생산자가 다릅니다'),
      ),
    ).toBe(true);
  });
  it('순환·삭제·입력 중복을 감지하고 실패 출력은 만들지 않는다', () => {
    const lab = connected('pipeline-capstone', { threshold: 0.8 });
    lab.edges.push(workflowEdge(wire('registry', 'model', 'train', 'data')));
    expect(
      runWorkflow('pipeline-capstone', lab).stages.some((s) => s.reason.includes('순환')),
    ).toBe(true);
    const missing = connected('week4-workflow', fixes['week4-workflow']);
    missing.activeNodes = missing.activeNodes!.filter((id) => id !== 'cache');
    expect(
      workflowIssues(resolveScenario('week4-workflow', missing.answers), missing).length,
    ).toBeGreaterThan(0);
  });
  it('레이어 병렬은 GPU 1 활성값을 GPU 2에 전달해야 한다', () => {
    const lab = connected('week1-workflow', { strategy: 'model' });
    const r = runWorkflow('week1-workflow', lab);
    expect(r.success).toBe(true);
    expect(r.stages.find((s) => s.node === 'gpu2')!.inputs[0].content).toContain('중간 활성값');
    lab.answers.strategy = 'data';
    expect(
      workflowIssues(resolveScenario('week1-workflow', lab.answers), lab).length,
    ).toBeGreaterThan(0);
  });
  it('캐시가 없으면 checkout이 실패하고 pull로 복원할 수 있다', () => {
    const bad = connected('week4-workflow', { operation: 'checkout' });
    expect(
      runWorkflow('week4-workflow', bad).stages.find((s) => s.node === 'cache')!.reason,
    ).toContain('로컬 캐시에 없어');
    expect(
      runWorkflow('week4-workflow', connected('week4-workflow', { operation: 'pull' })).success,
    ).toBe(true);
  });
  it('Shadow의 비교 실패가 신규 사용자 응답으로 집계되지 않는다', () => {
    const r = runWorkflow(
      'week6-workflow',
      connected('week6-workflow', { strategy: 'shadow', ready: 'no', traffic: 100 }),
    );
    expect(r.metrics[0].value).toBe('0 / 100');
    expect(r.metrics[1].value).toBe('0 / 100');
    expect(r.stages.find((s) => s.node === 'response')!.status).toBe('success');
    expect(r.stages.find((s) => s.node === 'observe')!.status).toBe('failed');
  });
  it('정답 표본이 없을 때 모니터가 정확도를 지어내지 않는다', () => {
    const r = runWorkflow('week7-workflow', connected('week7-workflow', { labels: 'missing' }));
    expect(r.stages.find((s) => s.node === 'prom')!.status).toBe('blocked');
    expect(r.metrics[1].value).toContain('품질 확정 불가');
  });
});
describe('학습 증거·포트 저장·이전 진행 복구', () => {
  it('3단원 종합 실습은 실패 비교를 완료 조건으로 요구하지 않는다', () => {
    const goals = workflowGoals(
      lessonById['week3-workflow'],
      connected('week3-workflow', fixes['week3-workflow']),
    );
    expect(goals.some((goal) => goal.id === 'compare')).toBe(false);
  });
  it('현재 성공을 끝까지 관찰하고 실패 비교·정답이 있어야 완료한다', () => {
    const id = 'pipeline-capstone',
      lesson = lessonById[id],
      lab = connected(id, { threshold: 0.8 });
    expect(workflowGoals(lesson, lab).every((g) => g.passed)).toBe(false);
    const bad = runWorkflow(id, connected(id));
    const good = runWorkflow(id, lab);
    lab.answers._workflowHistory = JSON.stringify([
      { signature: bad.signature, success: false, diagnostic: true, metrics: bad.metrics },
      { signature: good.signature, success: true, diagnostic: false, metrics: good.metrics },
    ]);
    lab.answers._workflowQuiz = 'correct';
    expect(workflowGoals(lesson, lab).every((g) => g.passed)).toBe(true);
    lab.answers.threshold = 0.81;
    expect(workflowGoals(lesson, lab).find((g) => g.id === 'trace')!.passed).toBe(false);
  });
  it('포트별 연결과 완료를 복원하고 잘못된 포트 저장을 거절한다', () => {
    const id = 'week1-workflow',
      lab = connected(id, fixes[id]),
      data = emptyLearning();
    data.lessons[id] = lab;
    const restored = parseLearning(serializeLearning(data));
    expect(restored.lessons[id].edges).toEqual(lab.edges);
    const raw = JSON.parse(serializeLearning(data));
    delete raw.lessons[id].edges[0].targetHandle;
    expect(() => parseLearning(JSON.stringify(raw))).toThrow();
  });
  it('이전 저장의 완료를 개편 목표로 승격하지 않는다', () => {
    const lab = createNodeLab(lessonById['cpu-gpu']);
    const data = { version: 3, lessons: { 'cpu-gpu': lab, 'pipeline-capstone': { old: 'graph' } } };
    const restored = parseLearning(JSON.stringify(data));
    expect(restored.version).toBe(5);
    expect(restored.lessons['cpu-gpu']).toBeUndefined();
    expect(restored.lessons['pipeline-capstone']).toBeUndefined();
  });
});
