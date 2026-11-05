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
import {
  examplePlayground,
  parsePlayground,
  playgroundSignature,
  validatePlayground,
} from '../src/playground/model';

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
describe('Playground 워크플로', () => {
  it('콘솔로 설정한 예제와 연결·위치를 복원한다', () => {
    const data = examplePlayground();
    expect(validatePlayground(data)).toEqual([]);
    expect(parsePlayground(JSON.stringify(data))).toEqual(data);
    const signature = playgroundSignature(data);
    data.resources[0].position.x += 50;
    expect(playgroundSignature(data)).toBe(signature);
    data.resources[1].config.settings.image = 'al2023';
    expect(playgroundSignature(data)).not.toBe(signature);
  });
  it('잘못된 관계와 순환·중복 연결을 구분해 점검한다', () => {
    const data = examplePlayground();
    data.edges.push({ source: 'model', target: 'data' });
    expect(validatePlayground(data).some((issue) => issue.message.includes('연결 규칙'))).toBe(
      true,
    );
    data.edges.pop();
    data.edges.push({ source: 'compute', target: 'data' });
    expect(validatePlayground(data).some((issue) => issue.message.includes('순환'))).toBe(true);
    data.edges.pop();
    data.edges.push(data.edges[0]);
    expect(validatePlayground(data).some((issue) => issue.message.includes('중복'))).toBe(true);
  });
  it('손상 데이터·없는 자원·중복 이름·알 수 없는 서비스를 거절한다', () => {
    expect(() => parsePlayground('{broken')).toThrow();
    const data = examplePlayground();
    data.edges[0].target = 'missing';
    expect(() => parsePlayground(JSON.stringify(data))).toThrow();
    const duplicate = examplePlayground();
    duplicate.resources.push({ ...structuredClone(duplicate.resources[0]), id: 'duplicate' });
    expect(() => parsePlayground(JSON.stringify(duplicate))).toThrow();
    expect(() => parseResource({ service: 'toString', name: 'bad', settings: {} })).toThrow();
  });
  it('AMI와 연결된 EC2의 이미지가 다르면 알려준다', () => {
    const data = examplePlayground();
    data.resources.find((resource) => resource.id === 'compute')!.config = resourceDefaults(
      'ec2',
      'legacy-worker',
    );
    const ami = resourceDefaults('ami', 'base-image');
    ami.settings.image = 'al2023';
    data.resources.push({ id: 'ami', position: { x: 0, y: 300 }, config: ami });
    data.edges.push({ source: 'ami', target: 'compute' });
    expect(validatePlayground(data).some((issue) => issue.message.includes('시작 이미지'))).toBe(
      true,
    );
  });
});
