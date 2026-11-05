import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { lessonDocuments } from '../src/content/lessons';
import { lessonMdxComponents, LessonMdxProvider } from '../src/learning/LessonMdx';

const lessonRoot = resolve('src/content/lessons');
const sources = Object.fromEntries(
  readdirSync(lessonRoot, { recursive: true })
    .filter((file) => String(file).endsWith('.mdx'))
    .map((file) => [String(file), readFileSync(resolve(lessonRoot, String(file)), 'utf8')]),
);

describe('레슨 편집 기준', () => {
  it('53개 레슨의 첫 문제 제기 뒤에 설명이 있는 도입 이미지를 제공한다', () => {
    expect(Object.keys(sources)).toHaveLength(53);
    for (const [path, source] of Object.entries(sources)) {
      const secondHeading = source.indexOf('\n## ', source.indexOf('## ') + 3);
      const opening = source.slice(0, secondHeading);
      expect(opening, path).toMatch(/<Figure\s/);
      expect(opening, path).toMatch(/alt="[^"]{10,}"/);
      for (const image of source.matchAll(/src="(\/images\/[^"\s]+)"/g)) {
        const file = resolve('public', image[1].slice(1));
        expect(existsSync(file), `${path}: ${image[1]}`).toBe(true);
        expect(readFileSync(file).length).toBeGreaterThan(0);
      }
      const summary = source.match(/<LessonSummary>([\s\S]*?)<\/LessonSummary>/)?.[1];
      expect(summary?.trim().length, path).toBeGreaterThan(100);
      expect(source, path).not.toContain('<LessonSummary />');
    }
  });
  it('핵심 정리에 직접 쓴 문단·목록을 렌더링하고 기존 빈 태그도 지원한다', () => {
    const Summary = lessonMdxComponents.LessonSummary as React.ComponentType<{
      children?: React.ReactNode;
    }>;
    const lesson = lessonDocuments[0].lesson;
    const render = (children?: React.ReactNode) =>
      renderToStaticMarkup(
        createElement(LessonMdxProvider, {
          lesson,
          children: createElement(Summary, null, children),
        }),
      );
    const authored = render(
      createElement('ul', null, createElement('li', null, '입력에서 결과까지 복기')),
    );
    expect(authored).toContain('<ul><li>입력에서 결과까지 복기</li></ul>');
    expect(authored).not.toContain(lesson.caution);
    expect(render()).toContain(lesson.caution);
  });
});
