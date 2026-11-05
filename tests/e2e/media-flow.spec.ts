import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'blockml:preferences:v1',
      JSON.stringify({ theme: 'light', tour: 'skipped' }),
    ),
  );
});

test('본문 그림·캡션과 코드 복사가 동작한다', async ({ page, context }) => {
  await page.goto('/#/learn/container-isolation');
  const diagram = page.getByRole('img', {
    name: '가상 머신별 게스트 커널과 컨테이너의 공유 호스트 커널 비교',
    exact: true,
  });
  await diagram.scrollIntoViewIfNeeded();
  await expect.poll(() => diagram.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(960);
  await expect(diagram.locator('xpath=ancestor::figure').locator('figcaption')).toContainText(
    'BlockML 작성',
  );
  await page.goto('/#/learn/dvc-restore');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: '코드 복사', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: '코드를 복사했습니다.' })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('dvc checkout');
});

test('이미지 오류에서도 대체 설명을 제공한다', async ({ page }) => {
  await page.route('**/images/container-layers.svg', (route) => route.abort());
  await page.goto('/#/learn/container-isolation');
  await page
    .getByRole('heading', { name: '그림으로 비교하는 VM과 컨테이너' })
    .scrollIntoViewIfNeeded();
  await expect(page.getByText(/이미지를 불러오지 못했습니다/)).toBeVisible();
});

test('노드별 아이콘·자료 이동·일시정지·실패 전파를 표시한다', async ({ page }) => {
  await page.goto('/#/learn/feature-workflow');
  await page.getByRole('button', { name: '실습 영역 확장', exact: true }).click();
  await page.getByRole('button', { name: '실습 전체 화면', exact: true }).click();
  await page.getByRole('button', { name: '1. 예시 흐름 추적' }).click();
  const kinds = await page
    .getByTestId('weekly-canvas')
    .locator('[data-node-icon]')
    .evaluateAll((nodes) => nodes.map((n) => n.getAttribute('data-node-icon')));
  expect(new Set(kinds).size).toBeGreaterThanOrEqual(4);
  await page.getByRole('button', { name: '설정·결과 열기', exact: true }).click();
  await page.getByRole('button', { name: '노드 설정', exact: true }).click();
  await page.getByLabel('온라인 집계 시간', { exact: true }).selectOption('day');
  await page.getByRole('button', { name: '패널 닫기', exact: true }).click();
  await page.getByRole('button', { name: '전체 실행', exact: true }).click();
  const packet = page.locator('[data-testid="data-transfer"] circle:has(animateMotion)').first();
  await expect(packet).toBeVisible();
  const initial = await packet.boundingBox();
  await expect
    .poll(async () => {
      const box = await packet.boundingBox();
      return box ? Math.abs(box.x - initial!.x) + Math.abs(box.y - initial!.y) : 0;
    })
    .toBeGreaterThan(2);
  await page.getByRole('button', { name: '일시정지', exact: true }).click();
  await expect(page.locator('animateMotion')).toHaveCount(0);
  await expect(page.getByTestId('data-transfer').first()).toBeVisible();
  await page.screenshot({ path: 'test-results/flow-transfer.png' });
  for (let i = 0; i < 6; i++) {
    const next = page.getByRole('button', { name: '다음 단계', exact: true });
    if (await next.isDisabled()) break;
    await next.click();
  }
  await expect(page.getByLabel('현재 데이터 흐름')).toContainText('상위 단계 실패');
  await expect(page.getByTestId('data-transfer')).toHaveCount(0);
  await page.getByRole('button', { name: '중단', exact: true }).click();
  await expect(page.getByLabel('현재 데이터 흐름')).toHaveCount(0);
});

test('동작 줄이기에서는 움직임 대신 정적인 전달 표식과 설명을 제공한다', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#/learn/feature-workflow');
  await page.getByRole('button', { name: '실습 영역 확장', exact: true }).click();
  await page.getByRole('button', { name: '1. 예시 흐름 추적' }).click();
  await page.getByRole('button', { name: '단계 실행', exact: true }).click();
  await page.getByRole('button', { name: '다음 단계', exact: true }).click();
  await expect(page.getByTestId('data-transfer').first()).toBeVisible();
  await expect(page.locator('animateMotion')).toHaveCount(0);
  await expect(page.getByLabel('현재 데이터 흐름')).toContainText('행동 이벤트');
});
