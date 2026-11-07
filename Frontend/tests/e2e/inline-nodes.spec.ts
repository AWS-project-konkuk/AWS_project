import { test, expect } from '@playwright/test';
import { readLessons } from './readCurriculum';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'blockml:preferences:v1',
      JSON.stringify({ theme: 'light', tour: 'skipped' }),
    ),
  );
});

test('11개 개념 강의의 본문 중간에 작은 노드 예제가 열린다', async ({ page }) => {
  await page.goto('/');
  const examples = (await readLessons(page)).filter((lesson) => lesson.nodeExample);
  expect(examples).toHaveLength(11);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const lesson of examples) {
    await page.goto(`/#/learn/${lesson.id}`);
    const example = page.getByTestId(`inline-node-${lesson.id}`);
    await example.scrollIntoViewIfNeeded();
    await expect(example).toBeVisible();
    await expect(example.locator('.react-flow__node')).toHaveCount(
      lesson.nodeExample!.nodes.length,
    );
    expect(
      await example.evaluate((element) => {
        const article = element.closest('article')!;
        const quiz = article.querySelector('[aria-label="이해 확인"]')!;
        return (
          !!(element.compareDocumentPosition(quiz) & Node.DOCUMENT_POSITION_FOLLOWING) &&
          Array.from(article.children).some(
            (child) =>
              child.tagName === 'SECTION' &&
              !!(element.compareDocumentPosition(child) & Node.DOCUMENT_POSITION_FOLLOWING),
          )
        );
      }),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});

test('빠진 연결을 직접 채우고 저장·복원하며 본 강의 완료와 분리한다', async ({ page }) => {
  await page.goto('/#/learn/s3-objects');
  const example = page.getByTestId('inline-node-s3-objects');
  await example.scrollIntoViewIfNeeded();
  await example.getByRole('button', { name: '직접 연결해 보기', exact: true }).click();
  await expect(example.locator('.react-flow__edge')).toHaveCount(0);
  await example.getByRole('button', { name: '연결 확인', exact: true }).click();
  await expect(example.getByRole('status')).toContainText('빠진 연결');
  await example.getByLabel('예제 출발 노드').selectOption('artifact');
  await example.getByLabel('예제 도착 노드').selectOption('dataset');
  await example.getByRole('button', { name: '선택한 노드 연결', exact: true }).click();
  await expect(example.getByRole('status')).toContainText('연결을 추가했습니다');
  await expect(example.locator('.react-flow__edge')).toHaveCount(1);
  await example.getByRole('button', { name: '다음 연결 따라가기', exact: true }).click();
  await expect(example.getByRole('status').filter({ hasText: '실행 실패' })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('blockml:learning:v5')))
    .toContain('extra');
  await page.reload();
  await expect(example.locator('.react-flow__edge')).toHaveCount(1);
  await example.getByRole('button', { name: '추가 연결 삭제', exact: true }).click();
  await example.getByLabel('예제 출발 노드').selectOption('dataset');
  await example.getByLabel('예제 도착 노드').selectOption('training');
  await example.getByRole('button', { name: '선택한 노드 연결', exact: true }).click();
  await example.getByLabel('예제 출발 노드').selectOption('training');
  await example.getByLabel('예제 도착 노드').selectOption('artifact');
  await example.getByRole('button', { name: '선택한 노드 연결', exact: true }).click();
  await example.getByRole('button', { name: '연결 확인', exact: true }).click();
  await expect(example.getByRole('status')).toContainText('연결을 완성했습니다');
  await expect(page.getByRole('button', { name: '다음 강의', exact: true })).toBeDisabled();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const data = JSON.parse(localStorage.getItem('blockml:learning:v5') ?? '{}');
        const raw = data.lessons?.['s3-objects']?.answers?.['_inline:s3-read-train'];
        return raw ? JSON.parse(raw).links : [];
      }),
    )
    .toEqual(['dataset-training', 'training-artifact']);
  await page.reload();
  await expect(example.locator('.react-flow__edge')).toHaveCount(2);
  await expect(example.getByLabel('예제 출발 노드')).toHaveCount(1);
  await example.getByRole('button', { name: '다음 연결 따라가기', exact: true }).click();
  await expect(example.getByRole('status').filter({ hasText: 'train-v1.csv' })).toBeVisible();
  await page.screenshot({ path: 'test-results/inline-node-desktop.png' });
  await example.getByLabel('예제 출발 노드').selectOption('artifact');
  await example.getByLabel('예제 도착 노드').selectOption('dataset');
  await example.getByRole('button', { name: '선택한 노드 연결', exact: true }).click();
  await expect(example.locator('.react-flow__edge')).toHaveCount(3);
  await example.getByRole('button', { name: '직접 연결해 보기', exact: true }).click();
  await expect(example.locator('.react-flow__edge')).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const data = JSON.parse(localStorage.getItem('blockml:learning:v5') ?? '{}');
        const raw = data.lessons?.['s3-objects']?.answers?.['_inline:s3-read-train'];
        return raw ? JSON.parse(raw) : null;
      }),
    )
    .toEqual({ mode: 'practice', links: [], extra: [] });
  await page.reload();
  await expect(example.locator('.react-flow__edge')).toHaveCount(0);
  await example.getByRole('button', { name: '완성 예시 보기', exact: true }).click();
  await expect(example.locator('.react-flow__edge')).toHaveCount(2);
});

test('구성 관계는 전송 애니메이션으로 오해시키지 않으며 목차에서 구분한다', async ({ page }) => {
  await page.goto('/#/learn/pv-pvc');
  const example = page.getByTestId('inline-node-pv-pvc');
  await example.scrollIntoViewIfNeeded();
  await example.getByRole('button', { name: '다음 연결 따라가기', exact: true }).click();
  await expect(example).toContainText('구성 관계');
  await expect(example.locator('animateMotion')).toHaveCount(0);
  await expect(example).toContainText('관계 확인');
  const sidebar = page.getByRole('navigation', { name: '강의 목차' });
  await expect(sidebar.locator('a[href="#/learn/pv-pvc"]')).toContainText('본문 노드 학습');
  await expect(example.getByRole('link', { name: '관련 종합 실습으로 →' })).toHaveAttribute(
    'href',
    `#/learn/${(await readLessons(page)).find((lesson) => lesson.id === 'pv-pvc')!.nodeExample!.nextLesson}`,
  );
});

test('모바일에서도 본문을 스크롤하고 키보드 방식으로 연결할 수 있다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/learn/rag');
  const example = page.getByTestId('inline-node-rag');
  await example.scrollIntoViewIfNeeded();
  await example.getByRole('button', { name: '직접 연결해 보기', exact: true }).click();
  await example.getByLabel('예제 출발 노드').selectOption('search');
  await example.getByLabel('예제 도착 노드').selectOption('generation');
  await example.getByRole('button', { name: '선택한 노드 연결', exact: true }).click();
  await expect(example.locator('.react-flow__edge')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
