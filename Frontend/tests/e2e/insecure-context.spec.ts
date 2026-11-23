import { expect, test, type Page } from '@playwright/test';

/** HTTP로 배포한 환경처럼 보안 컨텍스트가 아니고 randomUUID가 없는 브라우저를 흉내 낸다. */
async function useInsecureContext(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'blockml:preferences:v1',
      JSON.stringify({ theme: 'light', tour: 'skipped' }),
    );
    Object.defineProperty(window, 'isSecureContext', { value: false });
    Object.defineProperty(crypto, 'randomUUID', { value: undefined });
    Object.defineProperty(crypto, 'subtle', { value: undefined });
  });
}

test('randomUUID가 없는 HTTP 환경에서도 노드를 만들고 실행한다', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await useInsecureContext(page);
  await page.goto('/#/playground');
  const playground = page.getByTestId('playground');
  expect(await page.evaluate(() => typeof crypto.randomUUID)).toBe('undefined');
  const nodes = playground.locator('.react-flow__node');
  await expect(nodes.first()).toBeVisible();
  const before = await nodes.count();
  await playground.getByRole('button', { name: '입력 소스 추가' }).click();
  await expect(nodes).toHaveCount(before + 1);
  await playground.getByLabel('MLOps 예시', { exact: true }).selectOption('level-1');
  await playground.getByRole('slider', { name: /실행 속도/ }).fill('10');
  await playground.getByRole('button', { name: '실행', exact: true }).click();
  await expect(playground.getByRole('button', { name: '실행', exact: true })).toBeVisible({
    timeout: 15000,
  });
  await expect(playground.getByRole('status').first()).toContainText('모두 실행됐습니다');
  expect(errors).toEqual([]);
});

test('HTTP 환경에서는 비밀번호 안내를 보여 주고 HTTPS(보안 컨텍스트)에서는 숨긴다', async ({
  page,
}) => {
  await useInsecureContext(page);
  await page.goto('/#/board/new');
  await expect(page.getByRole('note')).toContainText('HTTP로 접속 중');
  await expect(page.getByRole('note')).toContainText('실제로 쓰는 비밀번호는 입력하지 마세요');
});

test('보안 컨텍스트에서는 비밀번호 안내가 없다', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'blockml:preferences:v1',
      JSON.stringify({ theme: 'light', tour: 'skipped' }),
    ),
  );
  await page.goto('/#/board/new');
  expect(await page.evaluate(() => window.isSecureContext)).toBe(true);
  await expect(page.getByLabel('비밀번호')).toBeVisible();
  await expect(page.getByRole('note')).toHaveCount(0);
});
