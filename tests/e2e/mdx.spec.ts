import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'blockml:preferences:v1',
      JSON.stringify({ theme: 'light', tour: 'skipped' }),
    ),
  );
});

test('MDX 본문 연습은 문항별로 복원되고 강의 완료와 분리된다', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/#/learn/ec2-compute');
  const age = page.getByRole('region', { name: /연습 문제 · 학습 코드를 실제로/ });
  const location = page.getByRole('region', { name: /연습 문제 · 학습 결과 파일을/ });
  await age.getByRole('radio').nth(0).check();
  await location.getByRole('radio').nth(0).check();
  await expect(age.getByRole('status')).toHaveCount(0);
  await age.getByRole('button', { name: '정답 확인하기' }).click();
  await location.getByRole('button', { name: '정답 확인하기' }).click();
  await expect(age.getByRole('status')).toContainText('맞습니다.');
  await expect(location.getByRole('status')).toContainText('다시 생각해 보세요.');
  await expect(age.getByRole('radio').nth(0)).toBeChecked();
  await location.getByRole('radio').nth(1).check();
  await page.getByText('컴퓨터와 파일을 구분해 보기', { exact: true }).click();
  await expect(page.getByText(/Python 파일을 보관하는 것과/)).toBeVisible();
  await expect(page.getByRole('button', { name: '다음 강의', exact: true })).toBeDisabled();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('blockml:learning:v5')))
    .toContain('_mdxQuestion:result-storage');
  await page.reload();
  await expect(age.getByRole('radio').nth(0)).toBeChecked();
  await expect(location.getByRole('radio').nth(1)).toBeChecked();
  await expect(page.getByRole('button', { name: '다음 강의', exact: true })).toBeDisabled();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.getByTestId('lesson-reading').evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  ).toBe(true);
  await age.scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/mdx-mobile.png' });
  expect(errors).toEqual([]);
});
