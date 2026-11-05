import { legacyLessons as lessons, legacyLessonById as lessonById } from '../curriculum/catalog';
import { createLab, createConnection, evaluateGoals } from '../curriculum/engine';
import type { LearningData, LabState } from '../curriculum/types';
import { lessonBindings } from '../console/lessonResources';
import { parseResource } from '../console/resources';
import { createNodeLab } from '../nodes/lessonNodes';

export const learningKey = 'flow-lab:learning:v2';
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
export function emptyLearning(): LearningData {
  return { version: 2, lessons: {} };
}
export function parseLearning(raw: string): LearningData {
  const value: unknown = JSON.parse(raw);
  if (!record(value) || value.version !== 2 || !record(value.lessons))
    throw new Error('학습 저장 형식이 올바르지 않습니다.');
  const labs: LearningData['lessons'] = {};
  for (const [id, item] of Object.entries(value.lessons)) {
    const definition = Object.hasOwn(lessonById, id) ? lessonById[id] : undefined;
    if (!definition) continue;
    if (
      !record(item) ||
      !Array.isArray(item.nodes) ||
      !Array.isArray(item.edges) ||
      !record(item.answers) ||
      typeof item.completed !== 'boolean' ||
      typeof item.attempts !== 'number' ||
      !Number.isSafeInteger(item.attempts) ||
      item.attempts < 0
    )
      throw new Error('강의 진행 데이터를 읽을 수 없습니다.');
    const lab = createLab(definition);
    if (item.nodes.length !== lab.nodes.length) throw new Error('강의 노드가 일치하지 않습니다.');
    const seen = new Set<string>();
    lab.nodes = item.nodes.map((candidate: unknown) => {
      if (
        !record(candidate) ||
        typeof candidate.id !== 'string' ||
        seen.has(candidate.id) ||
        !record(candidate.position) ||
        typeof candidate.position.x !== 'number' ||
        !Number.isFinite(candidate.position.x) ||
        typeof candidate.position.y !== 'number' ||
        !Number.isFinite(candidate.position.y)
      )
        throw new Error('노드 위치를 읽을 수 없습니다.');
      seen.add(candidate.id);
      const base = lab.nodes.find((node) => node.id === candidate.id);
      if (!base) throw new Error('알 수 없는 학습 노드입니다.');
      return { ...base, position: { x: candidate.position.x, y: candidate.position.y } };
    });
    const edgeIds = new Set<string>();
    lab.edges = item.edges.map((edge: unknown) => {
      if (
        !record(edge) ||
        typeof edge.source !== 'string' ||
        typeof edge.target !== 'string' ||
        edge.source === edge.target ||
        !seen.has(edge.source) ||
        !seen.has(edge.target)
      )
        throw new Error('연결을 읽을 수 없습니다.');
      const parsed = createConnection(edge.source, edge.target);
      if (edgeIds.has(parsed.id)) throw new Error('중복 연결입니다.');
      edgeIds.add(parsed.id);
      return parsed;
    });
    for (const field of definition.fields) {
      const answer = item.answers[field.id];
      if (
        field.options
          ? typeof answer !== 'string' || !field.options.some((option) => option.value === answer)
          : typeof answer !== 'number' || !Number.isFinite(answer)
      )
        throw new Error('강의 설정을 읽을 수 없습니다.');
      lab.answers[field.id] = answer as string | number;
    }
    lab.attempts = item.attempts;
    if (item.resources !== undefined) {
      if (!record(item.resources)) throw new Error('이전 노드 설정을 읽을 수 없습니다.');
      lab.resources = Object.fromEntries(
        Object.entries(item.resources).map(([node, config]) => {
          if (!seen.has(node)) throw new Error('알 수 없는 노드 설정입니다.');
          return [node, parseResource(config)];
        }),
      );
    } else lab.resources = undefined;
    if (item.activeNodes !== undefined) {
      if (
        !Array.isArray(item.activeNodes) ||
        item.activeNodes.some((id) => typeof id !== 'string' || !seen.has(id)) ||
        new Set(item.activeNodes).size !== item.activeNodes.length
      )
        throw new Error('추가한 노드 목록을 읽을 수 없습니다.');
      lab.activeNodes = item.activeNodes as string[];
    } else {
      const managed = lessonBindings(definition);
      lab.activeNodes = lab.nodes
        .filter(
          (node) =>
            item.resources === undefined ||
            !managed.some((binding) => binding.node === node.id) ||
            lab.resources?.[node.id],
        )
        .map((node) => node.id);
    }
    lab.completed =
      item.completed &&
      item.attempts > 0 &&
      evaluateGoals(definition, lab).every((goal) => goal.passed);
    labs[id] = lab;
  }
  return { version: 2, lessons: labs };
}
export function serializeLearning(data: LearningData): string {
  return JSON.stringify({
    version: 2,
    lessons: Object.fromEntries(
      Object.entries(data.lessons).map(([id, lab]) => [
        id,
        {
          ...lab,
          nodes: lab.nodes.map((node) => ({ id: node.id, position: node.position })),
          edges: lab.edges.map((edge) => ({ source: edge.source, target: edge.target })),
        },
      ]),
    ),
  });
}
export function getLab(data: LearningData, id: string): LabState {
  return data.lessons[id] ?? createNodeLab(lessonById[id]);
}
export function completedCount(data: LearningData): number {
  return lessons.filter((lesson) => data.lessons[lesson.id]?.completed).length;
}
