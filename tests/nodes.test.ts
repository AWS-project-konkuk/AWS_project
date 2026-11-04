import { describe, expect, it } from 'vitest';
import {
  createLab,
  createConnection,
  evaluateGoals,
  experimentSignature,
  runExperiment,
} from '../src/curriculum/engine';
import { legacyLessonById as lessonById } from '../src/curriculum/catalog';
import {
  createNodeLab,
  addLessonNode,
  removeLessonNode,
  nodeCanvas,
} from '../src/nodes/lessonNodes';
import { parseLearning, serializeLearning } from '../src/learning/progress';
import { examplePlayground, parsePlayground, validatePlayground } from '../src/playground/model';
import { resourceDefaults } from '../src/console/resources';

describe('폼 없이 추가하는 학습 노드', () => {
  it('클릭으로 바로 추가하며 중복·알 수 없는 노드는 추가하지 않는다', () => {
    const lesson = lessonById['aws-mlops-map'];
    let lab = createNodeLab(lesson);
    expect(nodeCanvas(lab).nodes).toHaveLength(0);
    expect(runExperiment(lesson, lab).headline).toContain('노드를 추가');
    lab = addLessonNode(lab, 'data');
    expect(nodeCanvas(lab).nodes).toHaveLength(1);
    expect(addLessonNode(lab, 'data')).toBe(lab);
    expect(addLessonNode(lab, 'missing')).toBe(lab);
  });
  it('노드를 연결하면 실험하고 삭제하면 연결과 완료를 취소한다', () => {
    const lesson = lessonById['aws-mlops-map'];
    let lab = createNodeLab(lesson);
    for (const id of ['data', 'compute', 'artifact']) lab = addLessonNode(lab, id);
    lab.edges = [createConnection('data', 'compute'), createConnection('compute', 'artifact')];
    expect(runExperiment(lesson, lab).success).toBe(true);
    const original = experimentSignature(lab);
    lab.activeNodes = [...lab.activeNodes!].reverse();
    expect(experimentSignature(lab)).toBe(original);
    const signature = experimentSignature(lab);
    lab.completed = true;
    lab = removeLessonNode(lab, 'compute');
    expect(lab.completed).toBe(false);
    expect(lab.edges).toHaveLength(0);
    expect(experimentSignature(lab)).not.toBe(signature);
    expect(evaluateGoals(lesson, lab).every((goal) => goal.passed)).toBe(false);
  });
  it('노드 위치·추가 목록을 복원하고 잘못된 목록을 거절한다', () => {
    const lesson = lessonById['aws-mlops-map'];
    const lab = addLessonNode(createNodeLab(lesson), 'data');
    lab.nodes[0].position.x = 300;
    const data = { version: 2 as const, lessons: { [lesson.id]: lab } };
    const restored = parseLearning(serializeLearning(data)).lessons[lesson.id];
    expect(restored.activeNodes).toEqual(['data']);
    expect(restored.nodes[0].position.x).toBe(300);
    lab.activeNodes = ['data', 'data'];
    expect(() => parseLearning(serializeLearning(data))).toThrow();
    lab.activeNodes = ['toString'];
    expect(() => parseLearning(serializeLearning(data))).toThrow();
  });
  it('이전 콘솔에서 만든 노드·연결·과제 설정을 보존한다', () => {
    const lesson = lessonById['aws-s3-versions'];
    const lab = createLab(lesson);
    lab.resources = { bucket: resourceDefaults('s3', 'old-bucket') };
    lab.resources.bucket.settings.versioning = 'on';
    lab.answers.versioning = 'on';
    lab.edges.push(createConnection('bucket', 'restore'));
    lab.answers.version = 'v1';
    lab.completed = true;
    lab.attempts = 1;
    const restored = parseLearning(serializeLearning({ version: 2, lessons: { [lesson.id]: lab } }))
      .lessons[lesson.id];
    expect(restored.activeNodes).toHaveLength(3);
    expect(restored.completed).toBe(true);
    expect(restored.edges).toHaveLength(2);
    restored.answers.versioning = 'off';
    expect(
      parseLearning(serializeLearning({ version: 2, lessons: { [lesson.id]: restored } })).lessons[
        lesson.id
      ].answers.versioning,
    ).toBe('off');
  });
});
describe('MLOps 노드 Playground', () => {
  it('기본 예제는 7개 학습 노드와 평가 데이터 경로를 포함한다', () => {
    const data = examplePlayground();
    expect(data.resources).toHaveLength(7);
    expect(validatePlayground(data)).toEqual([]);
    expect(data.edges).toContainEqual({ source: 'preprocess', target: 'evaluate' });
    expect(parsePlayground(JSON.stringify(data))).toEqual(data);
  });
  it('이름은 AWS 자원 이름 대신 학습용 레이블로 사용한다', () => {
    const legacy = {
      version: 1,
      resources: [
        { id: 'old', position: { x: 5, y: 8 }, config: resourceDefaults('s3', '한글 데이터 노드') },
      ],
      edges: [],
    };
    expect(parsePlayground(JSON.stringify(legacy)).resources[0].config.name).toBe(
      '한글 데이터 노드',
    );
  });
});
