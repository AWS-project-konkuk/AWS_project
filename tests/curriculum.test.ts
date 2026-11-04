import { describe, expect, it } from 'vitest';
import {
  legacyLessons as lessons,
  legacyLessonById as lessonById,
  legacyWeeks as weeks,
} from '../src/curriculum/catalog';
import {
  createLab,
  createConnection,
  evaluateGoals,
  experimentSignature,
  runExperiment,
} from '../src/curriculum/engine';
import { emptyLearning, getLab, parseLearning, serializeLearning } from '../src/learning/progress';
import { learningReducer } from '../src/learning/LearningStore';

const passed = (id: string, lab: ReturnType<typeof createLab>) =>
  evaluateGoals(lessonById[id], lab).every((goal) => goal.passed);

describe('사용자의 강의별 학습 목표', () => {
  it('7주 워크북의 출처와 별도 과제를 제공하며 기본 구성을 완료로 취급하지 않는다', () => {
    expect(weeks).toHaveLength(7);
    expect(lessons).toHaveLength(26);
    expect(lessons.filter((item) => item.week === 0)).toHaveLength(5);
    expect(lessons.filter((item) => item.week > 0)).toHaveLength(21);
    expect(new Set(lessons.map((item) => item.id)).size).toBe(26);
    expect(new Set(lessons.map((item) => item.week)).size).toBe(8);
    for (const lesson of lessons) {
      expect(lesson.references[0].title).toContain(
        lesson.week === 0 ? 'DevOps' : `MLOps ${lesson.week}주차`,
      );
      expect(lesson.reading.length).toBeGreaterThanOrEqual(2);
      expect(passed(lesson.id, createLab(lesson))).toBe(false);
    }
  });
  it('IAM 읽기 허용과 최소 권한 달성은 구분한다', () => {
    const lesson = lessonById['iam-access'];
    const lab = createLab(lesson);
    lab.edges.push(createConnection('role', 's3'));
    lab.answers.policy = 'admin';
    expect(runExperiment(lesson, lab).headline).toContain('최소 권한');
    expect(passed(lesson.id, lab)).toBe(false);
    lab.answers.policy = 'read';
    expect(passed(lesson.id, lab)).toBe(true);
  });
  it('올바른 목표 외의 연결을 무작정 추가해도 통과하지 않는다', () => {
    const lesson = lessonById['aws-mlops-map'];
    const lab = createLab(lesson);
    lab.edges = [createConnection('data', 'compute'), createConnection('compute', 'artifact')];
    expect(passed(lesson.id, lab)).toBe(true);
    lab.edges.push(createConnection('artifact', 'data'));
    expect(evaluateGoals(lesson, lab).find((goal) => goal.id === 'unexpected')?.passed).toBe(false);
  });
  it('기본 경로가 끊긴 IAM 과제는 목표 연결과 설정을 맞춰도 실패한다', () => {
    const lesson = lessonById['iam-access'];
    const lab = createLab(lesson);
    lab.edges = [createConnection('role', 's3')];
    lab.answers.policy = 'read';
    expect(passed(lesson.id, lab)).toBe(false);
  });
  it('프라이빗 S3 접근과 일반 인터넷 경로를 구분한다', () => {
    const lesson = lessonById['private-network'];
    const lab = createLab(lesson);
    lab.edges.push(createConnection('route', 's3'));
    lab.answers.route = 'igw';
    expect(runExperiment(lesson, lab).success).toBe(false);
    lab.answers.route = 'endpoint';
    expect(runExperiment(lesson, lab).success).toBe(true);
    expect(runExperiment(lesson, lab).observations.join('')).toContain('패키지');
  });
  it('배치와 정밀도를 바꾸면 메모리 결과가 달라지고 노드 이동은 영향을 주지 않는다', () => {
    const lesson = lessonById['gpu-memory'];
    const lab = createLab(lesson);
    expect(runExperiment(lesson, lab).headline).toContain('OOM');
    lab.answers.batch = 8;
    lab.answers.precision = 'amp';
    expect(runExperiment(lesson, lab).metrics[0].value).toBe('4.6 / 8.0 GiB');
    expect(runExperiment(lesson, lab).success).toBe(true);
    const signature = experimentSignature(lab);
    const result = runExperiment(lesson, lab);
    lab.nodes[0].position = { x: 1000, y: -99 };
    expect(experimentSignature(lab)).toBe(signature);
    expect(runExperiment(lesson, lab)).toEqual(result);
    lab.answers.batch = -8;
    expect(passed(lesson.id, lab)).toBe(false);
    expect(runExperiment(lesson, lab).metrics).toEqual([]);
  });
  it('PVC는 용량과 접근 모드가 모두 맞아야 결합된다', () => {
    const lesson = lessonById['persistent-volumes'];
    const lab = createLab(lesson);
    lab.edges.push(createConnection('pvc', 'pv'));
    lab.answers.capacity = 10;
    expect(runExperiment(lesson, lab).success).toBe(false);
    lab.answers.mode = 'RWX';
    expect(runExperiment(lesson, lab).success).toBe(true);
    lab.answers.capacity = 20;
    expect(runExperiment(lesson, lab).success).toBe(true);
    lab.answers.capacity = 101;
    expect(runExperiment(lesson, lab).success).toBe(false);
  });
  it('Git 포인터 변경만으로 DVC 실제 데이터가 복원되었다고 표시하지 않는다', () => {
    const lesson = lessonById['dvc-time-travel'];
    const lab = createLab(lesson);
    lab.edges.push(createConnection('cache', 'workspace'));
    lab.answers.pointer = 'v1';
    expect(runExperiment(lesson, lab).metrics).toEqual([
      { label: 'Git의 포인터', value: 'v1' },
      { label: '작업 공간 데이터', value: 'v2' },
    ]);
    expect(runExperiment(lesson, lab).success).toBe(false);
    lab.answers.checkout = 'dvc';
    expect(runExperiment(lesson, lab).success).toBe(true);
    expect(runExperiment(lesson, lab).metrics[1].value).toBe('v1');
  });
  it('Shadow 요청은 새 모델의 실제 사용자 응답으로 세지 않는다', () => {
    const lesson = lessonById['safe-release'];
    const lab = createLab(lesson);
    lab.edges.push(createConnection('router', 'new'));
    lab.answers.traffic = 10;
    expect(runExperiment(lesson, lab).metrics[0].value).toBe('0 / 100');
    lab.answers.strategy = 'canary';
    expect(runExperiment(lesson, lab).metrics[0].value).toBe('10 / 100');
    expect(runExperiment(lesson, lab).success).toBe(true);
    lab.answers.strategy = 'bluegreen';
    expect(runExperiment(lesson, lab).metrics[0].value).toBe('100 / 100');
  });
});
describe('MLOps에 필요한 AWS 서비스 기초', () => {
  it('EC2 종료 시 디스크 파일 보존과 실행 메모리를 구분한다', () => {
    const lesson = lessonById['aws-ec2-ebs'];
    const lab = createLab(lesson);
    lab.edges.push(createConnection('ec2', 'ebs'));
    expect(runExperiment(lesson, lab).success).toBe(false);
    lab.answers.volume = 'retain';
    const result = runExperiment(lesson, lab);
    expect(result.success).toBe(true);
    expect(result.headline).toContain('checkpoint.pt');
    expect(result.observations.join('')).toContain('RAM');
  });
  it('S3 과거 버전은 첫 업로드 전의 버전 관리와 버전 ID가 모두 필요하다', () => {
    const lesson = lessonById['aws-s3-versions'];
    const lab = createLab(lesson);
    lab.edges.push(createConnection('bucket', 'restore'));
    lab.answers.version = 'v1';
    expect(runExperiment(lesson, lab).metrics[1].value).toBe('v1 조회 불가');
    lab.answers.versioning = 'on';
    expect(runExperiment(lesson, lab).success).toBe(true);
    expect(runExperiment(lesson, lab).metrics[1].value).toBe('모델 v1');
    lab.answers.version = 'latest';
    expect(runExperiment(lesson, lab).success).toBe(false);
    expect(runExperiment(lesson, lab).metrics[1].value).toBe('최신 v2');
  });
  it('보안 그룹에서 포트를 열어도 전체 인터넷 허용은 목표에 맞지 않는다', () => {
    const lesson = lessonById['aws-vpc-security'];
    const lab = createLab(lesson);
    lab.edges.push(createConnection('sg', 'service'));
    lab.answers.port = '8080';
    lab.answers.source = 'internet';
    expect(runExperiment(lesson, lab).success).toBe(false);
    expect(runExperiment(lesson, lab).headline).toContain('출발지 제한');
    lab.answers.source = 'alb';
    expect(runExperiment(lesson, lab).success).toBe(true);
  });
  it('이미지 저장소는 실행 환경이 아니며 ECS와 컴퓨팅을 따로 선택한다', () => {
    const lesson = lessonById['aws-container-services'];
    const lab = createLab(lesson);
    lab.edges.push(createConnection('runtime', 'endpoint'));
    expect(runExperiment(lesson, lab).headline).toContain('이미지 보관소');
    lab.answers.orchestrator = 'ecs';
    expect(runExperiment(lesson, lab).success).toBe(false);
    lab.answers.compute = 'fargate';
    expect(runExperiment(lesson, lab).success).toBe(true);
  });
  it('ALB의 준비 상태 통과는 모델 예측 품질과 다르다', () => {
    const lesson = lessonById['aws-alb-health'];
    const lab = createLab(lesson);
    lab.edges.push(createConnection('target', 'server'));
    expect(runExperiment(lesson, lab).metrics[1].value).toBe('404');
    lab.answers.healthPath = '/ready';
    const result = runExperiment(lesson, lab);
    expect(result.success).toBe(true);
    expect(result.metrics[1].value).toBe('200');
    expect(result.observations.join('')).toContain('예측 품질을 평가한 결과가 아닙니다');
  });
});

describe('강의별 저장과 완료 상태', () => {
  it('다른 강의의 상태를 공유하지 않으며 설정 변경은 현재 완료만 취소한다', () => {
    const lab = createLab(lessonById['aws-mlops-map']);
    lab.edges = [createConnection('data', 'compute'), createConnection('compute', 'artifact')];
    lab.completed = true;
    lab.attempts = 1;
    lab.resources = undefined;
    const data = emptyLearning();
    data.lessons['aws-mlops-map'] = lab;
    const restored = parseLearning(serializeLearning(data));
    expect(restored.lessons['aws-mlops-map'].completed).toBe(true);
    expect(getLab(restored, 'iam-access').completed).toBe(false);
    const state = learningReducer(
      { data: restored, blocked: false, warning: '' },
      {
        type: 'edit',
        id: 'iam-access',
        semantic: true,
        change: (current) => ({ ...current, answers: { policy: 'read' } }),
      },
    );
    expect(state.data.lessons['aws-mlops-map'].completed).toBe(true);
    const changed = learningReducer(state, {
      type: 'edit',
      id: 'aws-mlops-map',
      semantic: true,
      change: (current) => ({ ...current, edges: [] }),
    });
    expect(changed.data.lessons['aws-mlops-map'].completed).toBe(false);
  });
  it('실험 없이 조작한 완료나 잘못된 설정의 완료를 복원하지 않는다', () => {
    const lab = createLab(lessonById['iam-access']);
    lab.completed = true;
    const data = { version: 2 as const, lessons: { 'iam-access': lab } };
    expect(parseLearning(serializeLearning(data)).lessons['iam-access'].completed).toBe(false);
    lab.attempts = 1;
    expect(parseLearning(serializeLearning(data)).lessons['iam-access'].completed).toBe(false);
  });
  it('손상·중복 노드·미지의 설정을 거절한다', () => {
    expect(() => parseLearning('{broken')).toThrow();
    expect(parseLearning('{"version":2,"lessons":{"toString":{}}}').lessons).toEqual({});
    const lab = createLab(lessonById['iam-access']);
    lab.nodes[1].id = lab.nodes[0].id;
    expect(() =>
      parseLearning(serializeLearning({ version: 2, lessons: { 'iam-access': lab } })),
    ).toThrow();
    const valid = createLab(lessonById['iam-access']);
    valid.answers.policy = 'mystery';
    expect(() =>
      parseLearning(serializeLearning({ version: 2, lessons: { 'iam-access': valid } })),
    ).toThrow();
  });
});
