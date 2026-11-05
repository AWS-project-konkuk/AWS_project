import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() =>
    localStorage.setItem(
      'blockml:preferences:v1',
      JSON.stringify({ theme: 'light', tour: 'skipped' }),
    ),
  );
});

test('읽기에서 실습으로 진입하고 숨겨진 문항까지 완료 안내로 이동한다', async ({ page }) => {
  await page.goto('/#/learn/rag-workflow');
  await expect(
    page.getByTestId('lesson-workspace').locator('..').locator(':scope > footer'),
  ).toContainText('설명을 읽었다면 실습을 시작하세요.');
  await page.getByRole('button', { name: '이제 실습 시작하기', exact: true }).click();
  await expect(page.getByTestId('weekly-canvas')).toBeVisible();
  await expect(page.getByText(/^완료 조건 0\/4:/)).toBeVisible();
  await expect(
    page.getByTestId('lesson-workspace').locator('..').locator(':scope > footer'),
  ).toContainText('남은 목표:');
  await page.getByRole('button', { name: '완료 조건 보기', exact: true }).click();
  await expect(
    page.getByRole('button', { name: '이해 확인하고 실습 완료', exact: true }),
  ).toBeInViewport();
  await page.screenshot({ path: 'test-results/critique-completion.png' });
});

test('RAG 결과 패널의 순번과 화살표는 실제 실행 순서를 따른다', async ({ page }) => {
  await page.goto('/#/learn/rag-workflow');
  await page.getByRole('button', { name: '실습 시작하기', exact: true }).click();
  await page.getByRole('button', { name: '1. 예시 흐름 추적' }).click();
  await page.getByRole('button', { name: '단계 실행', exact: true }).click();
  const next = page.getByRole('button', { name: '다음 단계', exact: true });
  for (let i = 0; i < 10 && !(await next.isDisabled()); i++) await next.click();
  await expect(page.getByLabel('현재 데이터 흐름')).toContainText('6/6');
  await expect(page.getByLabel('현재 데이터 흐름')).toContainText('응답 예시');
  await page.getByRole('button', { name: '설정·결과 열기', exact: true }).click();
  const nav = page.getByRole('navigation', { name: '실행 단계', exact: true });
  await expect(nav).toContainText(/실행 6\s*\/\s*6 응답 예시/);
  await expect(nav.getByRole('button', { name: '다음 단계 살펴보기' })).toBeDisabled();
  await nav.getByRole('button', { name: '이전 단계 살펴보기' }).click();
  await expect(nav).toContainText(/실행 5\s*\/\s*6/);
  await expect(nav).not.toContainText('질문 임베딩');
  await nav.getByRole('button', { name: '다음 단계 살펴보기' }).click();
  await expect(nav).toContainText('응답 예시');
  await page.screenshot({ path: 'test-results/critique-execution-order.png' });
});

test('과제 전환 전의 사용자 설정과 연결을 되돌린다', async ({ page }) => {
  await page.goto('/#/learn/rag-workflow');
  await page.getByRole('button', { name: '실습 시작하기', exact: true }).click();
  await page.getByRole('button', { name: '1. 예시 흐름 추적' }).click();
  const edges = page.getByTestId('weekly-canvas').locator('.react-flow__edge');
  const count = await edges.count();
  expect(count).toBeGreaterThan(0);
  await page.getByRole('button', { name: '설정·결과 열기', exact: true }).click();
  await page.getByRole('button', { name: '노드 설정', exact: true }).click();
  await page.getByLabel('질문 임베딩 공간', { exact: true }).selectOption('other');
  await page.getByRole('button', { name: '3. 새로운 상황 구성' }).click();
  await expect(edges).toHaveCount(0);
  await page.getByRole('button', { name: '직전 구성 되돌리기', exact: true }).click();
  await expect(edges).toHaveCount(count);
  await expect(page.getByLabel('질문 임베딩 공간', { exact: true })).toHaveValue('other');
  await expect(page.getByRole('button', { name: '직전 구성 되돌리기', exact: true })).toHaveCount(
    0,
  );
});

test('실습 모드는 전체 연결, 초기 일부 연결, 연결 없음으로 구분한다', async ({ page }) => {
  await page.goto('/#/learn/rag-workflow');
  await page.getByRole('button', { name: '실습 시작하기', exact: true }).click();
  const edges = page.getByTestId('weekly-canvas').locator('.react-flow__edge');
  const initialCount = await edges.count();
  expect(initialCount).toBeGreaterThan(0);
  await page.getByRole('button', { name: '1. 예시 흐름 추적' }).click();
  expect(await edges.count()).toBeGreaterThan(initialCount + 1);
  await page.getByRole('button', { name: '2. 잘못된 구성 수정' }).click();
  await expect(edges).toHaveCount(initialCount);
  await page.getByRole('button', { name: '3. 새로운 상황 구성' }).click();
  await expect(edges).toHaveCount(0);
});

test('본문 예제의 정상 연결을 키보드로 삭제하고 작은 캔버스를 확장한다', async ({ page }) => {
  await page.goto('/#/learn/s3-objects');
  const example = page.getByTestId('inline-node-s3-objects');
  await example.getByRole('button', { name: '직접 연결해 보기', exact: true }).click();
  await example.getByLabel('예제 출발 노드').selectOption('dataset');
  await example.getByLabel('예제 도착 노드').selectOption('training');
  await example.getByRole('button', { name: '선택한 노드 연결', exact: true }).click();
  const list = example.getByRole('list', { name: '예제 연결 목록' });
  await expect(list.getByRole('button')).toHaveCount(1);
  const remove = list.getByRole('button').first();
  await remove.focus();
  await page.keyboard.press('Enter');
  await expect(example.locator('.react-flow__edge')).toHaveCount(0);
  await expect(example.getByText('연결이 없습니다.', { exact: false })).toBeVisible();
  const canvas = example.locator('.react-flow').locator('..');
  expect((await canvas.boundingBox())!.height).toBeLessThanOrEqual(440);
  await example.getByRole('button', { name: '예제 높이 늘리기', exact: true }).click();
  expect((await canvas.boundingBox())!.height).toBe(840);
  await example.getByRole('button', { name: '기본 높이', exact: true }).click();
  await example.getByRole('button', { name: '다음 연결 따라가기', exact: true }).click();
  await expect(example.getByRole('status').filter({ hasText: '실행 성공' })).toBeVisible();
  await example.screenshot({ path: 'test-results/critique-inline.png' });
});
