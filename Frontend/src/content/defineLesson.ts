import type { Lesson } from '../curriculum/types';
import { references, sourceWeeks, stages, units } from './course';

export type LessonDefinition = Pick<Lesson, 'id' | 'title' | 'summary' | 'reading'> &
  Partial<Omit<Lesson, 'id' | 'title' | 'summary' | 'reading' | 'week'>> & {
    /** 사이트의 단원 번호. Notion의 원문 주차와 구분합니다. */
    unit: number;
    /** 같은 단원 안의 표시 순서. 중간 삽입에는 2.5 같은 값도 가능합니다. */
    order: number;
  };
export interface LessonDocument {
  format?: 'mdx';
  order: number;
  lesson: Lesson;
}

/** 본문은 같은 이름의 .mdx에서 작성합니다. */
export function defineMdxLesson(definition: Omit<LessonDefinition, 'reading'>): LessonDocument {
  return {
    ...defineLesson({ ...definition, reading: [{ title: '본문', body: '' }] }),
    format: 'mdx',
  };
}

/** 문서는 내용에 집중하고, 기존 화면·실습에서 필요한 기본값은 이 어댑터가 채웁니다. */
export function defineLesson(definition: LessonDefinition): LessonDocument {
  const { unit, order, ...content } = definition;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(content.id))
    throw new Error(`강의 ID는 영문 소문자·숫자·하이픈으로 작성하세요: ${content.id}`);
  if (!units.some((item) => item.week === unit))
    throw new Error(`${content.id}: 존재하지 않는 단원 ${unit}`);
  if (!Number.isFinite(order) || order <= 0)
    throw new Error(`${content.id}: order는 0보다 큰 숫자여야 합니다.`);
  if (!content.title.trim() || !content.reading.length)
    throw new Error(`${content.id}: 제목과 본문 섹션이 필요합니다.`);
  if (!content.assessment && !content.workflow)
    throw new Error(`${content.id}: 이해 확인 문제 또는 종합 실습 연결이 필요합니다.`);
  if (
    content.assessment &&
    (!Number.isInteger(content.assessment.correct) ||
      content.assessment.correct < 0 ||
      content.assessment.correct >= content.assessment.options.length)
  )
    throw new Error(`${content.id}: 정답 번호가 선택지 범위를 벗어났습니다.`);
  return {
    order,
    lesson: {
      minutes: 12,
      concepts: [content.title],
      scenario: content.summary,
      caution: content.summary,
      reflection: content.assessment?.question ?? content.title,
      references: references(unit),
      sourceWeek: sourceWeeks[unit],
      mapStages: stages[unit],
      contentRevision: 1,
      nodes: [],
      initialEdges: [],
      fields: [],
      goals: [],
      experiment: '이해 확인',
      ...content,
      week: unit,
    },
  };
}

/** 파일명을 식별자로 확인한 뒤 단원·순서대로 등록합니다. */
export function collectLessons(modules: Record<string, LessonDocument>): LessonDocument[] {
  const seen = new Set<string>();
  const result = Object.entries(modules)
    .map(([path, document]) => {
      if (!document?.lesson)
        throw new Error(`${path}: defineLesson의 결과를 default export하세요.`);
      const { lesson } = document;
      if (!path.endsWith(`/${lesson.id}.lesson.ts`))
        throw new Error(`${path}: 파일명은 ${lesson.id}.lesson.ts여야 합니다.`);
      if (seen.has(lesson.id)) throw new Error(`중복된 강의 ID: ${lesson.id}`);
      seen.add(lesson.id);
      return document;
    })
    .sort(
      (a, b) =>
        a.lesson.week - b.lesson.week ||
        a.order - b.order ||
        a.lesson.id.localeCompare(b.lesson.id),
    );
  for (const { lesson } of result)
    if (lesson.nodeExample && !seen.has(lesson.nodeExample.nextLesson))
      throw new Error(
        `${lesson.id}: 본문 노드 예제가 가리키는 강의 ${lesson.nodeExample.nextLesson}가 없습니다.`,
      );
  return result;
}
