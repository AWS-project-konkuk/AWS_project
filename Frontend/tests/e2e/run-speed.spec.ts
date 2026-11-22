import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('blockml:preferences:v1'))
      localStorage.setItem(
        'blockml:preferences:v1',
        JSON.stringify({ theme: 'light', tour: 'skipped' }),
      );
  });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
});

test('실행 속도 슬라이더 값을 기억하고 단계가 그 속도로 진행된다', async ({ page }) => {
  await page.goto('/#/playground');
  const playground = page.getByTestId('playground');
  const speed = playground.getByRole('slider', { name: /실행 속도/ });
  await expect(speed).toHaveValue('5');
  await speed.fill('1');
  await page.reload();
  await expect(playground.getByRole('slider', { name: /실행 속도/ })).toHaveValue('1');
  await playground.getByLabel('MLOps 예시', { exact: true }).selectOption('level-1');
  await playground.getByRole('button', { name: '실행', exact: true }).click();
  // 가장 느린 속도(단계당 3초)에서는 2초가 지나도 노드 3개의 실행이 끝나지 않는다.
  await page.waitForTimeout(2000);
  await expect(playground.getByRole('button', { name: '중단' })).toBeVisible();
  await playground.getByRole('slider', { name: /실행 속도/ }).fill('10');
  await expect(playground.getByRole('button', { name: '실행', exact: true })).toBeVisible({
    timeout: 5000,
  });
  const saved = await page.evaluate(() => localStorage.getItem('blockml:preferences:v1'));
  expect(JSON.parse(saved ?? '{}')).toMatchObject({ runSpeed: 10 });
});

test('자료를 보내는 동안 선을 따라 동그라미가 움직인다', async ({ page }) => {
  await page.goto('/#/playground');
  const playground = page.getByTestId('playground');
  await playground.getByLabel('MLOps 예시', { exact: true }).selectOption('level-1');
  await playground.getByRole('slider', { name: /실행 속도/ }).fill('2');
  await playground.getByRole('button', { name: '실행', exact: true }).click();
  const packet = playground
    .locator('[data-testid="data-transfer"] circle:has(animateMotion)')
    .first();
  await expect(packet).toBeVisible();
  const first = await packet.boundingBox();
  await expect
    .poll(async () => {
      const box = await packet.boundingBox();
      return box && first ? Math.abs(box.x - first.x) + Math.abs(box.y - first.y) : 0;
    })
    .toBeGreaterThan(5);
  await expect(playground.getByRole('button', { name: '실행', exact: true })).toBeVisible({
    timeout: 15000,
  });
  await expect(playground.locator('[data-testid="data-transfer"]')).toHaveCount(0);
});

test('단원 실습에서도 동그라미가 움직인다', async ({ page }) => {
  await page.goto('/#/learn/intro-workflow');
  await page.getByRole('button', { name: '실습 영역 확장', exact: true }).click();
  const lab = page.getByTestId('system-lab');
  await lab.getByRole('slider', { name: /실행 속도/ }).fill('2');
  await lab.getByRole('button', { name: '실습 실행', exact: true }).click();
  await expect(
    lab.locator('[data-testid="data-transfer"] circle:has(animateMotion)').first(),
  ).toBeVisible({ timeout: 10000 });
});
