import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() =>
    localStorage.setItem(
      'blockml:preferences:v1',
      JSON.stringify({ theme: 'light', tour: 'skipped' }),
    ),
  );
});

test('정답·오답은 제출 뒤 색상과 아이콘으로 구분하고 동작 줄이기를 존중한다', async ({ page }) => {
  await page.goto('/#/learn/mlops-overview');
  const quiz = page.getByLabel('이해 확인', { exact: true });
  await quiz.getByRole('radio').nth(1).check();
  await expect(quiz.locator('[data-feedback]')).toHaveCount(0);
  await quiz.getByRole('button', { name: '정답 확인하기', exact: true }).click();
  const wrong = quiz.locator('[data-feedback="error"]');
  await expect(wrong).toContainText('오답입니다');
  await expect(wrong.locator('svg')).toHaveCount(1);
  const wrongColor = await wrong.evaluate((el) => getComputedStyle(el).color);
  expect(await wrong.evaluate((el) => getComputedStyle(el).animationName)).not.toBe('none');
  await wrong.screenshot({ path: 'test-results/feedback-quiz-wrong.png' });
  await quiz.getByRole('radio').nth(0).check();
  await expect(quiz.locator('[data-feedback]')).toHaveCount(0);
  await quiz.getByRole('button', { name: '정답 확인하기', exact: true }).click();
  const correct = quiz.locator('[data-feedback="success"]');
  await expect(correct).toContainText('정답입니다');
  expect(await correct.evaluate((el) => getComputedStyle(el).color)).not.toBe(wrongColor);
  await correct.screenshot({ path: 'test-results/feedback-quiz-correct.png' });
  await page.getByLabel('화면 테마', { exact: true }).selectOption('dark');
  await expect(correct).toBeVisible();
  await correct.screenshot({ path: 'test-results/feedback-quiz-dark.png' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect
    .poll(() => correct.evaluate((el) => getComputedStyle(el).animationName))
    .toBe('none');
});

test('선택 활동과 본문 노드 학습을 테두리로 구분하고 연결 판정도 강조한다', async ({ page }) => {
  await page.goto('/#/learn/cpu-gpu');
  const optional = page
    .locator('details')
    .filter({ has: page.getByText('선택 활동 · 결과를 예측하고 비교하기', { exact: true }) });
  expect(await optional.evaluate((el) => getComputedStyle(el).borderRightStyle)).toBe('solid');
  expect(
    await optional.evaluate((el) => parseFloat(getComputedStyle(el).borderRightWidth)),
  ).toBeGreaterThan(0);
  await optional.locator('summary').click();
  await expect(page.getByTestId('inline-activity')).toBeVisible();
  await optional.screenshot({ path: 'test-results/feedback-optional-boundary.png' });
  await page.goto('/#/learn/s3-objects');
  const example = page.getByTestId('inline-node-s3-objects');
  expect(await example.evaluate((el) => getComputedStyle(el).borderRightStyle)).toBe('solid');
  await example.getByRole('button', { name: '직접 연결해 보기', exact: true }).click();
  await example.getByLabel('예제 출발 노드').selectOption('artifact');
  await example.getByLabel('예제 도착 노드').selectOption('dataset');
  await example.getByRole('button', { name: '선택한 노드 연결', exact: true }).click();
  await expect(example.locator('[data-feedback="info"]')).toContainText('연결을 추가했습니다');
  await example.getByRole('button', { name: '연결 확인', exact: true }).click();
  await expect(example.locator('[data-feedback="error"]')).toContainText('맞지 않습니다');
  await example
    .locator('[data-feedback="error"]')
    .screenshot({ path: 'test-results/feedback-connection-wrong.png' });
  await example.getByRole('button', { name: '추가 연결 삭제', exact: true }).click();
  await example.getByLabel('예제 출발 노드').selectOption('dataset');
  await example.getByLabel('예제 도착 노드').selectOption('training');
  await example.getByRole('button', { name: '선택한 노드 연결', exact: true }).click();
  await example.getByLabel('예제 출발 노드').selectOption('training');
  await example.getByLabel('예제 도착 노드').selectOption('artifact');
  await example.getByRole('button', { name: '선택한 노드 연결', exact: true }).click();
  await example.getByRole('button', { name: '연결 확인', exact: true }).click();
  await expect(example.locator('[data-feedback="success"]')).toContainText('연결을 완성했습니다');
  await example
    .locator('[data-feedback="success"]')
    .screenshot({ path: 'test-results/feedback-connection-correct.png' });
});

test('실습 실행 단계의 성공과 실패를 표시한다', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#/learn/rag-workflow');
  await page.getByRole('button', { name: '실습 시작하기', exact: true }).click();
  await page.getByRole('button', { name: '3. 새로운 상황 구성' }).click();
  await page.getByRole('button', { name: '단계 실행', exact: true }).click();
  const status = page.getByLabel('현재 데이터 흐름');
  await expect(status).toHaveAttribute('data-result', 'success');
  for (let i = 0; i < 6 && (await status.getAttribute('data-result')) === 'success'; i++)
    await page.getByRole('button', { name: '다음 단계', exact: true }).click();
  await expect(status).toHaveAttribute('data-result', 'failed');
  await expect(status).toContainText('단계 실패');
  await page.getByRole('button', { name: '설정·결과 열기', exact: true }).click();
  await expect(
    page.getByTestId('weekly-inspector').locator('[data-feedback="error"]'),
  ).toContainText('입력');
});
