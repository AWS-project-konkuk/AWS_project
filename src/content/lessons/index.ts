import { collectLessons, type LessonDocument } from '../defineLesson';
import type { LessonMdxModule } from '../mdxTypes';

// 새 .lesson.ts 문서는 이 패턴에 따라 자동으로 학습 목록과 주소에 등록됩니다.
const modules = import.meta.glob<LessonDocument>('./**/*.lesson.ts', {
  eager: true,
  import: 'default',
});
const bodies = import.meta.glob<LessonMdxModule>('./**/*.mdx', { eager: true });
const connected = Object.fromEntries(
  Object.entries(modules).map(([path, document]) => {
    const bodyPath = path.replace(/\.lesson\.ts$/, '.mdx');
    const body = bodies[bodyPath];
    if (document.format === 'mdx' && !body)
      throw new Error(`${path}: 짝이 되는 본문 ${bodyPath}가 필요합니다.`);
    return [
      path,
      body
        ? {
            ...document,
            lesson: {
              ...document.lesson,
              reading: body.readingIndex,
              contentFeatures: body.contentFeatures,
            },
          }
        : document,
    ];
  }),
);
for (const path of Object.keys(bodies))
  if (!modules[path.replace(/\.mdx$/, '.lesson.ts')])
    throw new Error(`${path}: 강의 설정 .lesson.ts 파일이 필요합니다.`);
export const lessonDocuments = collectLessons(connected);
export const lessonBodies = Object.fromEntries(
  Object.entries(bodies).map(([path, module]) => [
    path
      .split('/')
      .at(-1)!
      .replace(/\.mdx$/, ''),
    module.default,
  ]),
);
