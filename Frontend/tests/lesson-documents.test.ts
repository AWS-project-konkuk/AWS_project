import { describe, expect, it } from 'vitest';
import { defineLesson, collectLessons } from '../src/content/defineLesson';
import { lessonDocuments } from '../src/content/lessons';
import { lessonById } from '../src/curriculum/blockml';
import template from '../src/content/templates/new-lesson';
import { readingIndex } from '../src/content/templates/new-lesson.mdx';

describe('강의 문서 작성과 자동 등록', () => {
  it('실제 강의 문서만 등록하고 작성용 템플릿은 노출하지 않는다', () => {
    expect(lessonDocuments).toHaveLength(53);
    expect(lessonById['my-first-lesson']).toBeUndefined();
    expect(lessonById['ec2-compute'].reading[1].body).toContain('EC2');
    expect(lessonDocuments.filter((document) => document.lesson.nodeExample)).toHaveLength(12);
  });
  it('0단원을 전체 흐름·EC2·S3 순서로 통합하고 삭제한 두 강의를 노출하지 않는다', () => {
    const foundation = lessonDocuments.filter((document) => document.lesson.week === 0);
    expect(foundation.map((document) => document.lesson.id)).toEqual([
      'mlops-overview',
      'ec2-compute',
      's3-objects',
    ]);
    expect(foundation.map((document) => document.order)).toEqual([1, 2, 3]);
    expect(lessonById['iam-role-network']).toBeUndefined();
    expect(lessonById['ami-spot-recovery']).toBeUndefined();
    expect(lessonById['container-isolation'].week).toBe(1);
    expect(lessonById['ec2-compute'].sourceWeek).toBe(1);
  });
  it('템플릿 문서를 추가하면 기존 강의 사이의 지정한 순서에 배치한다', () => {
    const document = defineLesson({
      ...template.lesson,
      reading: readingIndex,
      unit: 1,
      order: 2.5,
      id: 'new-topic',
    });
    const modules = Object.fromEntries(
      lessonDocuments.map((document) => [`./${document.lesson.id}.lesson.ts`, document]),
    );
    modules['./new-topic.lesson.ts'] = document;
    const result = collectLessons(modules);
    expect(result).toHaveLength(54);
    const index = result.findIndex((item) => item.lesson.id === 'new-topic');
    expect(result[index - 1].order).toBe(2);
    expect(result[index + 1].order).toBe(3);
    expect(document.lesson.reading[2].code?.text).toContain('print(message)');
    expect(document.lesson.nodes).toEqual([]);
  });
  it('중복 주소와 파일명 불일치를 알려준다', () => {
    expect(() =>
      collectLessons({
        './a/my-first-lesson.lesson.ts': template,
        './b/my-first-lesson.lesson.ts': template,
      }),
    ).toThrow('중복된 강의 ID');
    expect(() => collectLessons({ './wrong-name.lesson.ts': template })).toThrow('파일명');
  });
  it('작성 중 잘못된 단원과 정답 번호를 알려준다', () => {
    expect(() => defineLesson({ ...template.lesson, unit: 99, order: 1 })).toThrow(
      '존재하지 않는 단원',
    );
    expect(() =>
      defineLesson({
        ...template.lesson,
        unit: 1,
        order: 1,
        assessment: { ...template.lesson.assessment!, correct: 99 },
      }),
    ).toThrow('정답 번호');
  });
});
