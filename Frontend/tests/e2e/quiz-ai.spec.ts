import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'blockml:preferences:v1',
      JSON.stringify({ theme: 'light', tour: 'skipped' }),
    ),
  );
});

test('퀴즈 AI 요청의 입력·로딩·응답·오류·재시도와 이전 결과 폐기', async ({ page }) => {
  let calls = 0;
  let release: () => void = () => {};
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/chat/ai/explain', async (route) => {
    calls++;
    const body = route.request().postDataJSON();
    expect(route.request().method()).toBe('POST');
    expect(body).toEqual({
      lessonId: 'mlops-overview',
      question: expect.any(String),
      options: expect.arrayContaining([expect.any(String), expect.any(String)]),
      correct: expect.any(Number),
      explanation: expect.any(String),
      selected: 0,
      reason: '운영 피드백이 필요합니다',
    });
    if (calls === 1) await pending;
    if (calls === 2) await route.fulfill({ status: 503, json: { code: 'VLLM_NOT_CONFIGURED' } });
    else if (calls === 3)
      await route.fulfill({
        json: {
          status: 'fallback',
          verdict: null,
          display: null,
          feedback: '지금은 답안을 평가하지 못했어요',
        },
      });
    else if (calls === 4)
      await route.fulfill({
        json: {
          status: 'ok',
          verdict: '정확',
          display: 'correct',
          feedback: '운영 피드백의 역할을 잘 설명했어요.',
        },
      });
    else
      await route.fulfill({
        json: {
          status: 'ok',
          verdict: '부분 정확',
          display: 'needs_work',
          feedback: '피드백을 어떤 단계에 활용하는지도 설명해 보세요. <script>위험</script>',
        },
      });
  });
  await page.goto('/#/learn/mlops-overview');
  const quiz = page.getByLabel('이해 확인', { exact: true });
  const button = quiz.getByRole('button', { name: 'AI에게 요청하기', exact: true });
  await expect(button).toBeDisabled();
  await quiz.getByRole('radio').nth(0).check();
  await quiz.getByLabel('선택한 이유', { exact: true }).fill('   ');
  await expect(button).toBeDisabled();
  await quiz.getByLabel('선택한 이유', { exact: true }).fill('운영 피드백이 필요합니다');
  await button.click();
  await expect(quiz.getByText('AI가 선택한 이유를 검토하고 있습니다.')).toBeVisible();
  await expect(quiz.getByRole('button', { name: 'AI 검토 중…' })).toBeDisabled();
  release();
  const result = quiz.getByLabel('AI 검토 결과', { exact: true });
  await expect(result).toContainText('보완이 필요해요');
  await expect(result).toContainText('피드백을 어떤 단계에 활용하는지도 설명해 보세요.');
  await expect(result).toContainText('<script>위험</script>');
  await expect(result.locator('script')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '다음 강의', exact: true })).toBeDisabled();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel('화면 테마', { exact: true }).selectOption('dark');
  await expect(result).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await result.screenshot({ path: 'test-results/quiz-ai-mobile-dark.png' });
  await button.click();
  await expect(quiz.getByLabel('AI 요청 실패', { exact: true })).toContainText('아직 준비되지');
  await quiz.getByRole('button', { name: '다시 요청하기' }).click();
  await expect(result).toContainText('지금은 답안을 평가하지 못했어요');
  await result.getByRole('button', { name: '다시 요청하기' }).click();
  await expect(result).toContainText('정확해요');
  await expect(result).toHaveAttribute('data-feedback', 'success');
  await quiz.getByLabel('선택한 이유', { exact: true }).fill('다른 이유');
  await expect(result).toHaveCount(0);
  expect(calls).toBe(4);
});

test('지연 응답은 입력 변경 및 강의 이동 후 표시하지 않는다', async ({ page }) => {
  let release: () => void = () => {};
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/chat/ai/explain', async (route) => {
    await pending;
    await route
      .fulfill({
        json: { status: 'ok', verdict: '정확', display: 'correct', feedback: '이전 요청의 답변' },
      })
      .catch(() => {});
  });
  await page.goto('/#/learn/mlops-overview');
  const quiz = page.getByLabel('이해 확인', { exact: true });
  await quiz.getByRole('radio').nth(0).check();
  await quiz.getByLabel('선택한 이유', { exact: true }).fill('이유');
  await quiz.getByRole('button', { name: 'AI에게 요청하기' }).click();
  await expect(quiz.getByText('AI가 선택한 이유를 검토하고 있습니다.')).toBeVisible();
  await quiz.getByLabel('선택한 이유', { exact: true }).fill('수정한 이유');
  await expect(quiz.getByRole('button', { name: 'AI에게 요청하기' })).toBeEnabled();
  await page.goto('/#/learn/cpu-gpu');
  release();
  await expect(page.getByText('이전 요청의 답변')).toHaveCount(0);
});
