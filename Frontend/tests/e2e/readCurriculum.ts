import type { Page } from '@playwright/test';
import type { Lesson } from '../../src/curriculum/types';

// 문서 자동 탐색은 Vite가 처리하므로, 브라우저가 실제 등록한 결과를 읽습니다.
export async function readLessons(page: Page): Promise<Lesson[]> {
  return page.evaluate(async () => {
    const modulePath = '/src/curriculum/blockml.ts';
    const curriculum = await import(modulePath);
    return curriculum.lessons;
  });
}
