import { describe, expect, it } from 'vitest';
import { parseResource, resourceDefaults, resourceErrors } from '../src/console/resources';
import {
  configureLessonResource,
  draftForLesson,
  lessonBindings,
  lessonCanvas,
  provisionedGoals,
  runProvisionedExperiment,
} from '../src/console/lessonResources';
import { createConnection, createLab, experimentSignature } from '../src/curriculum/engine';
import { legacyLessonById as lessonById } from '../src/curriculum/catalog';
import { parseLearning, serializeLearning } from '../src/learning/progress';

describe('간소화한 리소스 콘솔', () => {
  it('EC2 이미지·인스턴스·디스크 설정을 보관한다', () => {
    const resource = resourceDefaults('ec2', 'ml-worker');
    resource.settings.image = 'dlami';
    resource.settings.instance = 'g4dn.xlarge';
    resource.settings.disk = 80;
    expect(resourceErrors(resource)).toEqual([]);
    expect(parseResource(JSON.parse(JSON.stringify(resource)))).toEqual(resource);
  });
  it('잘못된 이름·디스크·옵션·중복 이름을 생성하지 않는다', () => {
    const ec2 = resourceDefaults('ec2', '');
    expect(resourceErrors(ec2).length).toBeGreaterThan(0);
    ec2.name = 'worker';
    ec2.settings.disk = -1;
    expect(resourceErrors(ec2).length).toBeGreaterThan(0);
    ec2.settings.disk = 30;
    ec2.settings.image = 'unknown';
    expect(() => parseResource(ec2)).toThrow();
    const bucket = resourceDefaults('s3', 'My bucket');
    expect(resourceErrors(bucket).length).toBeGreaterThan(0);
    bucket.name = 'ml-input';
    expect(resourceErrors(bucket, [bucket])).toContain(
      '이 구성에서 같은 서비스의 이름을 중복 사용할 수 없습니다.',
    );
  });
  it('AWS 자원을 생성하지 않고 연결만 맞추어도 강의 실험은 차단한다', () => {
    const lesson = lessonById['aws-mlops-map'];
    let lab = createLab(lesson);
    lab.edges = [createConnection('data', 'compute'), createConnection('compute', 'artifact')];
    expect(lessonCanvas(lesson, lab).nodes).toHaveLength(0);
    expect(runProvisionedExperiment(lesson, lab).success).toBe(false);
    for (const binding of lessonBindings(lesson))
      lab = configureLessonResource(lesson, lab, binding, draftForLesson(lesson, lab, binding));
    expect(lessonCanvas(lesson, lab).nodes).toHaveLength(3);
    expect(provisionedGoals(lesson, lab).every((goal) => goal.passed)).toBe(true);
    expect(runProvisionedExperiment(lesson, lab).success).toBe(true);
  });
  it('콘솔의 버전 관리 설정이 과제 답과 저장 데이터에 함께 반영된다', () => {
    const lesson = lessonById['aws-s3-versions'];
    let lab = createLab(lesson);
    const binding = lessonBindings(lesson)[0];
    const draft = draftForLesson(lesson, lab, binding);
    draft.settings.versioning = 'on';
    lab = configureLessonResource(lesson, lab, binding, draft);
    expect(lab.answers.versioning).toBe('on');
    const restored = parseLearning(serializeLearning({ version: 2, lessons: { [lesson.id]: lab } }))
      .lessons[lesson.id];
    expect(restored.resources?.bucket.settings.versioning).toBe('on');
    expect(restored.answers.versioning).toBe('on');
    lab.answers.versioning = 'off';
    expect(
      parseLearning(serializeLearning({ version: 2, lessons: { [lesson.id]: lab } })).lessons[
        lesson.id
      ].answers.versioning,
    ).toBe('off');
  });
  it('이미지 변경은 기존 결과를 무효화하고 위치 이동은 유지한다', () => {
    const lesson = lessonById['aws-ec2-ebs'];
    let lab = createLab(lesson);
    const binding = lessonBindings(lesson).find((binding) => binding.node === 'ec2')!;
    lab = configureLessonResource(lesson, lab, binding, draftForLesson(lesson, lab, binding));
    const before = experimentSignature(lab);
    lab.nodes[1].position.x += 100;
    expect(experimentSignature(lab)).toBe(before);
    const updated = structuredClone(lab.resources!.ec2);
    updated.settings.image = 'dlami';
    lab = configureLessonResource(lesson, lab, binding, updated);
    expect(experimentSignature(lab)).not.toBe(before);
    expect(() =>
      configureLessonResource(lesson, lab, binding, resourceDefaults('s3', 'wrong-service')),
    ).toThrow();
  });
  it('이전 강의 저장은 기본 리소스로 복원하고 완료 기록을 보존한다', () => {
    const lesson = lessonById['aws-mlops-map'];
    const lab = createLab(lesson);
    lab.resources = undefined;
    lab.edges = [createConnection('data', 'compute'), createConnection('compute', 'artifact')];
    lab.completed = true;
    lab.attempts = 1;
    const restored = parseLearning(serializeLearning({ version: 2, lessons: { [lesson.id]: lab } }))
      .lessons[lesson.id];
    expect(restored.completed).toBe(true);
    expect(restored.activeNodes).toHaveLength(3);
    expect(
      parseLearning(serializeLearning({ version: 2, lessons: { [lesson.id]: restored } })).lessons[
        lesson.id
      ].completed,
    ).toBe(true);
  });
});
describe('리소스 파서', () => {
  it('알 수 없는 서비스는 거절한다', () => {
    expect(() => parseResource({ service: 'toString', name: 'bad', settings: {} })).toThrow();
  });
});
