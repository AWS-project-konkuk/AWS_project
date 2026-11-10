import { describe, it, expect } from 'vitest';
import { lessons, lessonById, weeks } from '../src/curriculum/blockml';
import {
  simulate,
  activitySignature,
  observationHistory,
  dockerCommand,
  metricSamples,
} from '../src/activities/simulation';
import { createNodeLab } from '../src/nodes/lessonNodes';
import { evaluateGoals, experimentSignature } from '../src/curriculum/engine';
import {
  emptyLearning,
  parseLearning,
  serializeLearning,
  learningKey,
} from '../src/learning/blockProgress';
import {
  runPipeline,
  runPlayground,
  templatePlayground,
  templates,
} from '../src/playground/pipeline';
import { examplePlayground, validatePlayground, parsePlayground } from '../src/playground/model';
import type { LabState } from '../src/curriculum/types';
const lab = (id: string) => createNodeLab(lessonById[id]);
const result = (id: string, changes: Record<string, string | number | boolean> = {}) =>
  simulate(lessonById[id].activity!, { ...lab(id).answers, ...changes });
function observed(state: LabState): LabState {
  const sig = activitySignature(state.answers);
  return {
    ...state,
    attempts: 2,
    answers: {
      ...state.answers,
      _observed: sig,
      _history: JSON.stringify(['previous-settings', sig]),
      _quiz: 'a',
      _understanding: lessonById['cpu-gpu'].assessment!.correct,
    },
  };
}
describe('BlockML 과정과 활동 계약', () => {
  it('0~9단원의 설명과 선택 활동을 제공한다', () => {
    expect(weeks).toHaveLength(9);
    expect(lessons).toHaveLength(54);
    for (const l of lessons.filter((l) => l.activity)) {
      expect(l.minutes).toBeGreaterThanOrEqual(5);
      expect(l.minutes).toBeLessThanOrEqual(18);
      expect(l.activity).toBeDefined();
      expect(l.reading.length, l.id).toBeGreaterThanOrEqual(4);
      expect(l.references[0].url).toContain('notion.so');
      expect(result(l.id).steps.length).toBeGreaterThan(0);
      expect(evaluateGoals(l, lab(l.id)).some((g) => !g.passed)).toBe(true);
    }
  });
  it('개념 페이지의 옛 연결은 완료 조건에 영향을 주지 않는다', () => {
    const s = observed(lab('data-parallel'));
    s.answers._understanding = lessonById['data-parallel'].assessment!.correct;
    s.activeNodes = [];
    s.edges = [];
    expect(evaluateGoals(lessonById['data-parallel'], s).every((g) => g.passed)).toBe(true);
  });
  it('새 설정은 관찰 기록을 무효화하고 노드 이동은 결과를 바꾸지 않는다', () => {
    const s = observed(lab('cpu-gpu'));
    const signature = experimentSignature(s);
    s.nodes[0].position.x = 900;
    expect(experimentSignature(s)).toBe(signature);
    s.answers.jobs = 64;
    s.answers._understanding = -1;
    expect(
      evaluateGoals(lessonById['cpu-gpu'], s).find((g) => g.id === 'understanding')?.passed,
    ).toBe(false);
    expect(observationHistory({ _history: 'broken' })).toEqual([]);
  });
});
describe('교육용 계산의 핵심 조건', () => {
  it('작은 작업은 준비 비용, 큰 작업은 병렬 처리량의 영향을 받는다', () => {
    expect(result('cpu-gpu', { jobs: 1, setup: 10 }).metrics[1].amount).toBeGreaterThan(1);
    expect(result('cpu-gpu', { jobs: 128, setup: 5 }).metrics[1].amount).toBeLessThan(128);
    expect(result('cpu-gpu', { jobs: -1 }).warning).toBeTruthy();
  });
  it('마이크로 배치·혼합 정밀도·기울기 누적의 역할을 구분한다', () => {
    expect(result('vram-oom').warning).toContain('배치');
    expect(result('vram-oom', { batch: 8, precision: 'amp' }).warning).toBeUndefined();
    expect(result('vram-oom', { batch: 8, accumulation: 4 }).metrics[3].value).toBe('32');
  });
  it('데이터 병렬은 모델을 복제하고 레이어·텐서 병렬은 분할한다', () => {
    expect(result('data-parallel').metrics[0].amount).toBe(24);
    expect(result('model-parallel').metrics[0].amount).toBe(12);
    expect(result('tensor-parallel').metrics[0].amount).toBe(12);
    expect(result('data-parallel', { gpus: 4 }).metrics[0].amount).toBe(24);
    expect(result('tensor-parallel', { communication: 20 }).metrics[3].amount).toBeGreaterThan(
      result('tensor-parallel', { communication: 0 }).metrics[3].amount!,
    );
  });
  it('Docker 명령은 실제 상태 전이를 수행하고 잘못된 순서를 설명한다', () => {
    let a = dockerCommand({}, 'run');
    expect(a._container).toBeUndefined();
    a = dockerCommand(a, 'build');
    a = dockerCommand(a, 'run');
    expect(a._container).toBe('실행 중');
    expect(dockerCommand(a, 'rm')._container).toBe('실행 중');
    a = dockerCommand(a, 'stop');
    expect(a._container).toBe('중지됨');
    a = dockerCommand(a, 'rm');
    expect(a._container).toBe('없음');
    expect(a._image).toBe(true);
  });
  it('공급 속도와 캐시 적용에 따라 GPU 대기가 달라진다', () => {
    expect(result('io-starvation', { supply: 30 }).metrics[2].amount).toBe(70);
    expect(result('io-starvation', { supply: 100 }).metrics[2].amount).toBe(0);
    expect(result('io-starvation', { supply: 30, cache: 'on' }).metrics[2].amount).toBe(40);
  });
  it('Git 포인터 이동과 실제 데이터 복원을 구분한다', () => {
    expect(result('dvc-restore', { version: 'v1', checkout: 'none' }).metrics[1].value).toBe('v2');
    expect(result('dvc-restore', { version: 'v1', checkout: 'checkout' }).metrics[1].value).toBe(
      'v1',
    );
  });
  it('배포 방식마다 실제 응답과 복제 요청 수가 다르다', () => {
    expect(result('canary', { traffic: 10 }).metrics[0].amount).toBe(10);
    expect(result('shadow', { traffic: 100 }).metrics[0].amount).toBe(0);
    expect(result('shadow', { traffic: 100 }).metrics[3].amount).toBe(100);
    expect(result('blue-green', { phase: 'switch' }).metrics[0].amount).toBe(100);
    expect(result('blue-green', { phase: 'rollback' }).metrics[0].amount).toBe(0);
    expect(result('recreate-release', { gap: 20 }).metrics[2].amount).toBe(20);
  });
  it('수집 간격이 짧은 스파이크 관측에 영향을 준다', () => {
    expect(metricSamples(30).some((p) => p.y > 200)).toBe(false);
    expect(metricSamples(1).some((p) => p.y > 200)).toBe(true);
    expect(result('model-drift', { change: 'data' }).metrics[1].value).toContain('90%');
    expect(result('model-drift', { change: 'concept' }).metrics[0].value).toBe('0%');
  });
});
describe('종합 실행·피드백·저장', () => {
  it('평가용 데이터 연결이 필요하며 평가 미달 시 후속 단계를 차단한다', () => {
    const data = examplePlayground();
    expect(runPipeline(data).stages.every((s) => s.status === 'success')).toBe(true);
    data.resources.find((r) => r.config.service === 'evaluation')!.config.settings.threshold = 0.9;
    expect(runPipeline(data).stages.map((s) => s.status)).toEqual([
      'success',
      'success',
      'success',
      'failed',
      'blocked',
      'blocked',
      'blocked',
    ]);
    data.edges = data.edges.filter((e) => !(e.source === 'preprocess' && e.target === 'evaluate'));
    expect(runPipeline(data).issues.length).toBeGreaterThan(0);
  });
  it('개선 피드백은 실행 순환과 구분하고 잘못된 피드백은 거절한다', () => {
    const data = examplePlayground();
    expect(validatePlayground(data)).toEqual([]);
    expect(parsePlayground(JSON.stringify(data))).toEqual(data);
    data.edges.find((e) => e.relation === 'feedback')!.relation = undefined;
    expect(validatePlayground(data).some((i) => i.message.includes('순환'))).toBe(true);
    data.edges.find((e) => e.source === 'preprocess')!.relation = 'feedback';
    expect(validatePlayground(data).some((i) => i.message.includes('피드백'))).toBe(true);
  });
  it('분야별 템플릿이 유효하고 GPU 전략 변경을 실행에 반영한다', () => {
    for (const t of templates) expect(validatePlayground(templatePlayground(t.id))).toEqual([]);
    const data = templatePlayground('parallel');
    const gpu = data.resources.find((r) => r.config.service === 'gpu')!;
    expect(runPlayground(data).headline).toContain('부족');
    gpu.config.settings.strategy = 'tensor';
    expect(runPlayground(data).headline).not.toContain('부족');
  });
  it('새 저장 버전으로 복원하며 변경된 목표를 재검사한다', () => {
    const data = emptyLearning();
    data.lessons['cpu-gpu'] = observed(lab('cpu-gpu'));
    data.lessons['cpu-gpu'].completed = true;
    const restored = parseLearning(serializeLearning(data));
    expect(restored.lessons['cpu-gpu'].completed).toBe(true);
    expect(learningKey).not.toContain('flow-lab');
    restored.lessons['cpu-gpu'].answers._understanding = -1;
    expect(parseLearning(serializeLearning(restored)).lessons['cpu-gpu'].completed).toBe(false);
    expect(() => parseLearning('{broken')).toThrow();
    expect(() => parseLearning('{"version":2,"lessons":{}}')).toThrow();
  });
  it('중복 노드·손상 연결·범위 밖 설정을 복원하지 않는다', () => {
    const data = emptyLearning();
    data.lessons['cpu-gpu'] = lab('cpu-gpu');
    data.lessons['cpu-gpu'].answers.jobs = 10000;
    expect(() => parseLearning(serializeLearning(data))).toThrow();
    data.lessons['cpu-gpu'] = lab('cpu-gpu');
    data.lessons['cpu-gpu'].nodes[1].id = 'n0';
    expect(() => parseLearning(serializeLearning(data))).toThrow();
  });
});
