import { describe, expect, it } from 'vitest';
import { lessons, lessonById, chapters } from '../src/curriculum/blockml';
import { createNodeLab } from '../src/nodes/lessonNodes';
import { evaluateGoals } from '../src/curriculum/engine';
import { resolveScenario } from '../src/weekly/scenarios';
import { runWorkflow, workflowEdge } from '../src/weekly/engine';
import { emptyLearning, parseLearning, serializeLearning } from '../src/learning/blockProgress';

describe('설명 중심 학습과 과거 기록의 경계', () => {
  it('모든 강의가 독립적인 이해 확인 또는 워크플로 평가를 가진다', () => {
    expect(new Set(lessons.map((l) => l.id)).size).toBe(lessons.length);
    expect(chapters.map((c) => c.week)).toEqual(Array.from({ length: 10 }, (_, i) => i));
    for (const lesson of lessons) {
      expect(lesson.assessment || lesson.workflow).toBeTruthy();
      expect(lesson.mapStages?.length).toBeGreaterThan(0);
      expect(lesson.references[0].url).toMatch(/^https:\/\/www.notion.so\/[a-f0-9]{32}$/);
    }
  });
  it('노드와 활동이 없는 강의도 정답과 해설 판단으로 완료·복원한다', () => {
    const lesson = lessonById['mlops-overview'];
    const lab = createNodeLab(lesson);
    expect(lab.nodes).toEqual([]);
    expect(evaluateGoals(lesson, lab).every((g) => g.passed)).toBe(false);
    lab.answers._understanding = lesson.assessment!.correct;
    expect(evaluateGoals(lesson, lab).every((g) => g.passed)).toBe(true);
    lab.completed = true;
    lab.attempts = 1;
    const data = emptyLearning();
    data.lessons[lesson.id] = lab;
    expect(parseLearning(serializeLearning(data)).lessons[lesson.id].completed).toBe(true);
    lab.answers._understanding = -1;
    expect(parseLearning(serializeLearning(data)).lessons[lesson.id].completed).toBe(false);
  });
  it('이전 두 버전의 목표·완료를 새 목표로 승격하지 않는다', () => {
    for (const version of [3, 4]) {
      const raw = JSON.stringify({ version, lessons: { 'cpu-gpu': { completed: true } } });
      expect(parseLearning(raw).lessons).toEqual({});
      expect(JSON.parse(raw).lessons['cpu-gpu'].completed).toBe(true);
    }
  });
});

describe('피처 제공과 문서 검색의 독립성', () => {
  for (const [id, changes] of [
    ['feature-workflow', { window: 'hour' }],
    ['rag-workflow', { embedding: 'same', retrieval: 'relevant' }],
  ] as const) {
    it(`${id}: 자기 경로의 조건만으로 실패를 수정할 수 있다`, () => {
      const lab = createNodeLab(lessonById[id]);
      lab.edges = resolveScenario(id, lab.answers).wires.map(workflowEdge);
      expect(runWorkflow(id, lab).success).toBe(false);
      Object.assign(lab.answers, changes);
      const result = runWorkflow(id, lab);
      expect(result.success).toBe(true);
      expect(result.stages.at(-1)?.outputs.length).toBeGreaterThan(0);
      if (id === 'feature-workflow') {
        expect(result.stages.some((s) => s.node === 'search')).toBe(false);
        expect(result.stages.at(-1)?.outputs[0].content).not.toContain('doc-return');
      } else {
        expect(result.stages.some((s) => s.node === 'offline')).toBe(false);
        expect(
          result.stages
            .find((s) => s.node === 'search')
            ?.inputs.some((i) => i.content.includes('질문')),
        ).toBe(true);
      }
    });
  }
});
