import type { Lesson } from '../curriculum/types';
import { scenarioById } from './scenarios';
export function weeklyLesson(id: string, references: Lesson['references']): Lesson {
  const s = scenarioById[id];
  return {
    id,
    workflow: id,
    week: s.week,
    title: s.title,
    summary: `주차 종합 실습 · ${s.takeaway}`,
    minutes: 15,
    concepts: ['워크플로 실습', '자료 전달', '실패·개선 비교'],
    reading: [
      { title: '이번 미션', body: s.problem },
      { title: '설계하고 비교할 것', body: s.task },
      { title: '실습에서 가져갈 이해', body: s.takeaway },
    ],
    caution: s.explanation,
    scenario: s.task,
    nodes: s.nodes.map((n) => ({ id: n.id, title: n.title, detail: n.purpose })),
    initialEdges: [],
    fields: s.fields,
    goals: [],
    experiment: '워크플로 실행',
    reflection: s.question,
    references,
  };
}
