import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'blockml:preferences:v1',
      JSON.stringify({ theme: 'light', tour: 'skipped' }),
    ),
  );
});

for (const viewport of [
  { width: 1366, height: 768 },
  { width: 1600, height: 1000 },
]) {
  test(`실습 캔버스가 남은 화면을 사용하고 전체 화면에서 더 커진다 ${viewport.width}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto('/#/learn/rag-workflow');
    await page.getByRole('button', { name: '실습 영역 확장', exact: true }).click();
    await expect(page.getByRole('button', { name: '강의 목차 열기' })).toBeVisible();
    const canvas = page.getByTestId('weekly-canvas');
    const lab = page.getByLabel('단원 종합 워크플로', { exact: true });
    const before = await canvas.boundingBox();
    const space = await lab.boundingBox();
    expect(before!.width).toBeGreaterThan(viewport.width * 0.95);
    expect(before!.height).toBeGreaterThan(space!.height * 0.7);
    expect(before!.height).toBeGreaterThanOrEqual(720);
    const heightControl = page.getByRole('slider', { name: '캔버스 높이' });
    await heightControl.focus();
    await heightControl.press('ArrowRight');
    await expect.poll(async () => (await canvas.boundingBox())!.height).toBeGreaterThanOrEqual(800);
    expect((await canvas.boundingBox())!.width).toBe(before!.width);
    await expect(page.getByLabel('워크플로 결과와 설정')).toBeHidden();
    await page.getByRole('button', { name: '실습 전체 화면', exact: true }).click();
    await expect
      .poll(async () => (await canvas.boundingBox())!.height)
      .toBeGreaterThan(viewport.height * 0.75);
    await page.getByRole('button', { name: '1. 예시 흐름 추적' }).click();
    await expect(canvas.locator('.react-flow__edge')).not.toHaveCount(0);
    await page.getByRole('button', { name: '설정·결과 열기', exact: true }).click();
    await expect(page.getByLabel('워크플로 결과와 설정')).toBeVisible();
    expect((await canvas.boundingBox())!.height).toBeGreaterThan(viewport.height * 0.7);
    await page.getByRole('button', { name: '패널 닫기', exact: true }).click();
    await expect
      .poll(async () => (await canvas.locator('.react-flow__node').first().boundingBox())!.width)
      .toBeGreaterThan(90);
    await page.screenshot({ path: `test-results/workspace-${viewport.width}.png` });
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: '실습 전체 화면', exact: true })).toBeVisible();
    await expect(canvas.locator('.react-flow__edge')).not.toHaveCount(0);
    await page.getByRole('button', { name: '학습 영역 확장', exact: true }).click();
    await expect(canvas).toBeHidden();
    await page.getByRole('button', { name: '실습 영역 확장', exact: true }).click();
    await expect(canvas.locator('.react-flow__edge')).not.toHaveCount(0);
  });
}

test('모바일 전체 화면과 설정 패널을 닫으면 넓은 캔버스로 돌아온다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/learn/feature-workflow');
  await page.getByRole('button', { name: '실습 영역 확장', exact: true }).click();
  await page.getByRole('button', { name: '실습 전체 화면', exact: true }).click();
  const canvas = page.getByTestId('weekly-canvas');
  expect((await canvas.boundingBox())!.height).toBeGreaterThan(600);
  await page.getByRole('button', { name: '설정·결과 열기', exact: true }).click();
  await expect(page.getByLabel('워크플로 결과와 설정')).toBeVisible();
  await page.getByRole('button', { name: '패널 닫기', exact: true }).click();
  await expect(page.getByLabel('워크플로 결과와 설정')).toBeHidden();
  await page.screenshot({ path: 'test-results/workspace-mobile.png' });
  await page.getByRole('button', { name: '전체 화면 나가기', exact: true }).click();
  await expect(page.getByRole('button', { name: '실습 전체 화면', exact: true })).toBeVisible();
});

test('목차와 과정 목록에서 노드 실습과 선택 활동을 구분한다', async ({ page }) => {
  await page.goto('/#/learn/mlops-overview');
  const sidebar = page.getByRole('navigation', { name: '강의 목차' });
  await expect(sidebar.locator('a[href="#/learn/rag-workflow"]')).toContainText('노드 실습');
  await expect(sidebar.locator('a[href="#/learn/cpu-gpu"]')).toContainText('선택 활동');
  await expect(sidebar.locator('a[href="#/learn/mlops-overview"]')).not.toContainText('실습');
  await page.goto('/#/learn');
  await expect(page.getByTestId('lesson-card-rag-workflow')).toContainText('노드 실습');
  await expect(page.getByTestId('lesson-card-cpu-gpu')).toContainText('선택 활동');
});
