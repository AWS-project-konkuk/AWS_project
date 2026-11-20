import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'blockml:preferences:v1',
      JSON.stringify({ theme: 'light', tour: 'skipped' }),
    ),
  );
});

test('괄호가 포함된 강조는 한글 어미와 붙어 있어도 굵게 표시된다', async ({ page }) => {
  await page.goto('/#/learn/git-lfs');
  const reading = page.getByTestId('lesson-reading');
  const term = reading.locator('strong').getByText('포인터(pointer)', { exact: true });
  await expect(term).toBeVisible();
  await expect(term.locator('..')).toContainText('포인터(pointer)입니다.');
});

test('강의의 인라인 코드는 문장 안에서 구분되고 코드 블록도 렌더링된다', async ({ page }) => {
  await page.goto('/#/learn/feature-store');
  const reading = page.getByTestId('lesson-reading');
  const code = reading.locator('p > code').getByText('최근 1시간 클릭 수', { exact: true });
  await expect(code).toBeVisible();
  await expect(code).toHaveCSS('display', 'inline');
  await expect(code).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');

  await page.goto('/#/learn/git-lfs');
  const block = reading.locator('pre > code').filter({ hasText: 'git lfs install' });
  await expect(block).toBeVisible();
  await expect(block).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
});

test('MDX 본문 연습의 응답은 복원되고 강의 완료와 분리된다', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/#/learn/ec2-compute');
  const question = page.getByRole('region', { name: /연습 문제 · 학습 코드를 실제로/ });
  const correct = question.getByRole('radio', { name: 'EC2 인스턴스' });
  const incorrect = question.getByRole('radio', { name: 'S3에 저장된 데이터 파일 자체' });
  const checkAnswer = question.getByRole('button', { name: '정답 확인하기' });
  const feedback = question.getByRole('status');
  await incorrect.check();
  await expect(feedback).toHaveCount(0);
  await checkAnswer.click();
  await expect(feedback).toContainText('다시 생각해 보세요.');
  await correct.check();
  await expect(feedback).toHaveCount(0);
  await checkAnswer.click();
  await expect(feedback).toContainText('맞습니다.');
  await page.getByText('컴퓨터와 파일을 구분해 보기', { exact: true }).click();
  await expect(page.getByText(/Python 파일을 보관하는 것과/)).toBeVisible();
  await expect(page.getByRole('button', { name: '다음 강의', exact: true })).toBeDisabled();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('blockml:learning:v5')))
    .toContain('_mdxQuestion:execution-place');
  await page.reload();
  await expect(correct).toBeChecked();
  await expect(feedback).toContainText('맞습니다.');
  await expect(page.getByRole('button', { name: '다음 강의', exact: true })).toBeDisabled();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.getByTestId('lesson-reading').evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  ).toBe(true);
  await question.scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/mdx-mobile.png' });
  expect(errors).toEqual([]);
});
