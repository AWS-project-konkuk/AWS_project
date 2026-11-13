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
  await page.route('**/api/chat', async (route) => {
    calls++;
    const body = route.request().postDataJSON();
    expect(route.request().method()).toBe('POST');
    expect(body.message).toContain('학습자의 이유:\n운영 피드백이 필요합니다');
    expect(body.message).toContain('정답:');
    expect(body.messages).toBeUndefined();
    if (calls === 1) await pending;
    if (calls === 2) await route.fulfill({ status: 503, json: { code: 'VLLM_NOT_CONFIGURED' } });
    else
      await route.fulfill({
        json: {
          answer:
            '### 이유 검토\n\n- **핵심 개념**을 설명합니다.\n\n' +
            '| 항목 | 결과 |\n| --- | --- |\n| 이유 | 타당함 |\n\n' +
            '```yaml\nreplicas: 2\n```\n\n' +
            '<script>위험</script>\n\n' +
            '긴 한글 답변 '.repeat(100),
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
  await expect(result.getByRole('heading', { name: '이유 검토' })).toBeVisible();
  await expect(result.getByRole('listitem')).toContainText('핵심 개념');
  await expect(result.getByRole('cell', { name: '타당함' })).toBeVisible();
  await expect(result.locator('pre code')).toContainText('replicas: 2');
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
  await expect(result).toBeVisible();
  await quiz.getByLabel('선택한 이유', { exact: true }).fill('다른 이유');
  await expect(result).toHaveCount(0);
  expect(calls).toBe(3);
});

test('지연 응답은 입력 변경 및 강의 이동 후 표시하지 않는다', async ({ page }) => {
  let release: () => void = () => {};
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/chat', async (route) => {
    await pending;
    await route.fulfill({ json: { answer: '이전 요청의 답변' } }).catch(() => {});
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
