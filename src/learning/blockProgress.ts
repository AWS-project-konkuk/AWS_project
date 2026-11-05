import { lessonById, lessons } from '../curriculum/blockml';
import { createNodeLab } from '../nodes/lessonNodes';
import { createConnection, evaluateGoals } from '../curriculum/engine';
import type { LearningData, LabState, Answer } from '../curriculum/types';
import { validInputs } from '../activities/simulation';
export const learningKey = 'blockml:learning:v5';
export const emptyLearning = (): LearningData => ({ version: 5, lessons: {} });
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
export function parseLearning(raw: string): LearningData {
  const data: unknown = JSON.parse(raw);
  if (
    !record(data) ||
    (data.version !== 3 && data.version !== 4 && data.version !== 5) ||
    !record(data.lessons)
  )
    throw new Error('학습 저장 형식이 올바르지 않습니다.');
  const result = emptyLearning();
  if (data.version !== 5) return result;
  for (const [id, value] of Object.entries(data.lessons)) {
    if (!Object.hasOwn(lessonById, id)) continue;
    const lesson = lessonById[id],
      lab = createNodeLab(lesson);
    if (
      !record(value) ||
      !Array.isArray(value.nodes) ||
      value.nodes.length !== lab.nodes.length ||
      !Array.isArray(value.edges) ||
      !Array.isArray(value.activeNodes) ||
      !record(value.answers) ||
      typeof value.completed !== 'boolean' ||
      !Number.isSafeInteger(value.attempts) ||
      Number(value.attempts) < 0
    )
      throw new Error('강의 저장을 읽을 수 없습니다.');
    const seen = new Set<string>();
    lab.nodes = value.nodes.map((v: unknown) => {
      if (
        !record(v) ||
        typeof v.id !== 'string' ||
        seen.has(v.id) ||
        !record(v.position) ||
        typeof v.position.x !== 'number' ||
        !Number.isFinite(v.position.x) ||
        typeof v.position.y !== 'number' ||
        !Number.isFinite(v.position.y)
      )
        throw new Error('노드 위치 오류');
      const base = lab.nodes.find((n) => n.id === v.id);
      if (!base) throw new Error('알 수 없는 노드');
      seen.add(v.id);
      return { ...base, position: { x: v.position.x, y: v.position.y } };
    });
    lab.activeNodes = value.activeNodes.map((v: unknown) => {
      if (typeof v !== 'string' || !seen.has(v)) throw new Error('노드 목록 오류');
      return v;
    });
    if (new Set(lab.activeNodes).size !== lab.activeNodes.length) throw new Error('중복 노드');
    const edges = new Set<string>();
    lab.edges = value.edges.map((v: unknown) => {
      if (
        !record(v) ||
        typeof v.source !== 'string' ||
        typeof v.target !== 'string' ||
        v.source === v.target ||
        !seen.has(v.source) ||
        !seen.has(v.target)
      )
        throw new Error('연결 오류');
      const edge = createConnection(v.source, v.target);
      if (lesson.workflow) {
        if (typeof v.sourceHandle !== 'string' || typeof v.targetHandle !== 'string')
          throw new Error('입출력 포트 오류');
        edge.sourceHandle = v.sourceHandle;
        edge.targetHandle = v.targetHandle;
        edge.id = `${v.source}:${v.sourceHandle}->${v.target}:${v.targetHandle}`;
      }
      if (edges.has(edge.id)) throw new Error('중복 연결');
      edges.add(edge.id);
      return edge;
    });
    lab.answers = {};
    for (const [key, v] of Object.entries(value.answers)) {
      if (
        !['string', 'number', 'boolean'].includes(typeof v) ||
        (typeof v === 'number' && !Number.isFinite(v))
      )
        throw new Error('활동 설정 오류');
      lab.answers[key] = v as Answer;
    }
    if (!validInputs({ fields: lesson.fields }, lab.answers))
      throw new Error('활동 설정 범위 오류');
    lab.attempts = Number(value.attempts);
    lab.completed =
      value.completed && lab.attempts > 0 && evaluateGoals(lesson, lab).every((g) => g.passed);
    result.lessons[id] = lab;
  }
  return result;
}
export function serializeLearning(data: LearningData): string {
  return JSON.stringify({
    version: 5,
    lessons: Object.fromEntries(
      Object.entries(data.lessons).map(([id, lab]) => [
        id,
        {
          ...lab,
          resources: undefined,
          nodes: lab.nodes.map((n) => ({ id: n.id, position: n.position })),
          edges: lab.edges.map((e) => ({
            source: e.source,
            target: e.target,
            ...(e.sourceHandle ? { sourceHandle: e.sourceHandle } : {}),
            ...(e.targetHandle ? { targetHandle: e.targetHandle } : {}),
          })),
        },
      ]),
    ),
  });
}
export const getLab = (data: LearningData, id: string): LabState =>
  data.lessons[id] ?? createNodeLab(lessonById[id]);
export const completedCount = (data: LearningData) =>
  lessons.filter((l) => data.lessons[l.id]?.completed).length;
