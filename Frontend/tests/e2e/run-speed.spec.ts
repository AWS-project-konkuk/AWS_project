import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('blockml:preferences:v1'))
      localStorage.setItem(
        'blockml:preferences:v1',
        JSON.stringify({ theme: 'light', tour: 'skipped' }),
      );
  });
});

test('실행 속도를 고르면 기억하고 단계가 그 속도로 진행된다', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/#/playground');
  const playground = page.getByTestId('playground');
  const speed = playground.getByLabel('실행 속도');
  await expect(speed).toHaveValue('normal');
  await speed.selectOption('slower');
  await page.reload();
  await expect(playground.getByLabel('실행 속도')).toHaveValue('slower');
  await playground.getByLabel('MLOps 예시', { exact: true }).selectOption('level-1');
  await playground.getByRole('button', { name: '실행', exact: true }).click();
  // 아주 느린 속도에서는 2초가 지나도 3개 노드의 실행이 끝나지 않는다.
  await page.waitForTimeout(2000);
  await expect(playground.getByRole('button', { name: '중단' })).toBeVisible();
  await playground.getByLabel('실행 속도').selectOption('fast');
  await expect(playground.getByRole('button', { name: '실행', exact: true })).toBeVisible({
    timeout: 5000,
  });
  const saved = await page.evaluate(() => localStorage.getItem('blockml:preferences:v1'));
  expect(JSON.parse(saved ?? '{}')).toMatchObject({ runSpeed: 'fast' });
});
