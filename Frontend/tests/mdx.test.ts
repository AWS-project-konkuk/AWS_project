import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Template, { readingIndex, contentFeatures } from '../src/content/templates/new-lesson.mdx';
import { lessonDocuments, lessonBodies } from '../src/content/lessons';

describe('MDX 강의', () => {
  it('모든 강의에 렌더링 본문과 검색 색인이 연결된다', () => {
    for (const document of lessonDocuments) {
      expect(document.format).toBe('mdx');
      expect(lessonBodies[document.lesson.id]).toBeTypeOf('function');
      expect(document.lesson.reading.some((part) => part.body.trim())).toBe(true);
      if (document.lesson.nodeExample)
        expect(document.lesson.contentFeatures?.nodeExamples).toBe(true);
      if (document.lesson.activity) expect(document.lesson.contentFeatures?.activities).toBe(true);
      if (document.lesson.assessment) expect(document.lesson.contentFeatures?.quiz).toBe(true);
    }
  });
  it('문단·이미지·문단·코드·문제·해설·표의 작성 순서를 유지한다', () => {
    const html = renderToStaticMarkup(
      createElement(Template, {
        components: {
          Question: () => createElement('div', null, '독립 연습'),
          Quiz: () => createElement('div', null, '강의 평가'),
          References: () => null,
          LessonSummary: ({ children }) => createElement('section', null, children),
          Reveal: ({ children }) => createElement('details', null, children),
          Callout: ({ children }) => createElement('aside', null, children),
        },
      }),
    );
    const markers = [
      '학습자가 겪는',
      '<img',
      '이미지 뒤에도',
      '<pre',
      '독립 연습',
      '<details',
      '<table',
      '강의 평가',
    ];
    let previous = -1;
    for (const marker of markers) {
      const position = html.indexOf(marker);
      expect(position).toBeGreaterThan(previous);
      previous = position;
    }
    expect(readingIndex[2].code?.text).toContain('print(message)');
    expect(readingIndex[3].table?.columns).toEqual(['필요한 구성', '작성 방법']);
    expect(contentFeatures.activities).toBe(true);
  });
});
