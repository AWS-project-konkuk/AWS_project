import { expect, test } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'blockml:preferences:v1',
      JSON.stringify({ theme: 'light', tour: 'skipped' }),
    ),
  );
});
test('정답 제출 전에는 해설을 숨기고 선택 변경 시 판정을 초기화한다', async ({ page }) => {
  await page.goto('/#/learn/mlops-overview');
  const quiz = page.getByLabel('이해 확인', { exact: true });
  await quiz.getByRole('radio').nth(1).check();
  await expect(quiz.getByRole('status')).toHaveCount(0);
  await quiz
    .getByLabel('선택한 이유', { exact: true })
    .fill('운영까지 데이터와 모델의 흐름을 연결해야 합니다.');
  await quiz.getByRole('button', { name: '정답 확인하기', exact: true }).click();
  await expect(quiz.getByRole('status')).toContainText('다시 생각해 보세요');
  await expect(page.getByRole('button', { name: '다음 강의', exact: true })).toBeDisabled();
  await quiz.getByRole('radio').nth(0).check();
  await expect(quiz.getByRole('status')).toHaveCount(0);
  await quiz.getByRole('button', { name: '정답 확인하기', exact: true }).click();
  await expect(quiz.getByRole('status')).toContainText('맞습니다');
  await expect(
    quiz.getByRole('button', { name: '내가 말한 이유 검증하기', exact: true }),
  ).toBeDisabled();
  await quiz.screenshot({ path: 'test-results/quiz-submit.png' });
  await expect(page).toHaveURL(/mlops-overview$/);
  await expect(quiz.getByRole('button', { name: /이해 확인.*완료/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: '다음 강의', exact: true })).toBeVisible();
  await quiz.getByRole('radio').nth(1).check();
  await expect(page.getByRole('button', { name: '다음 강의', exact: true })).toBeDisabled();
  await quiz.getByRole('radio').nth(0).check();
  await expect(page.getByRole('button', { name: '다음 강의', exact: true })).toBeDisabled();
  await quiz.getByRole('button', { name: '정답 확인하기', exact: true }).click();
  await page.getByRole('link', { name: '다음 강의', exact: true }).click();
  await expect(page).toHaveURL(/ec2-compute$/);
});
test('좁은 설정 패널에서 화살표로 단계를 탐색한다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/learn/rag-workflow');
  await page.getByRole('button', { name: '실습 영역 확장', exact: true }).click();
  await page.getByRole('button', { name: '설정·결과 열기', exact: true }).click();
  const nav = page.getByRole('navigation', { name: '실행 단계', exact: true });
  await expect(nav.getByRole('button', { name: '이전 단계 살펴보기' })).toBeDisabled();
  const title = await page
    .getByTestId('weekly-inspector')
    .getByRole('heading', { level: 3 })
    .textContent();
  await nav.getByRole('button', { name: '다음 단계 살펴보기' }).click();
  await expect(
    page.getByTestId('weekly-inspector').getByRole('heading', { level: 3 }),
  ).not.toHaveText(title!);
  expect(await nav.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/stage-arrows-mobile.png' });
});
