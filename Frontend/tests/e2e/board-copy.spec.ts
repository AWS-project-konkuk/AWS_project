import { expect, test, type Page } from '@playwright/test';
import { applyCommand } from '../../src/systemLab/commands';
import { playgroundLab } from '../../src/systemLab/labs';
import { toWorkflow } from '../../src/playground/workflow';

const postId = '11111111-1111-4111-8111-111111111111';
const workflow = toWorkflow(
  applyCommand(
    playgroundLab.initial(),
    { type: 'add', id: 'shared', kind: 'input', parent: 'sources' },
    playgroundLab,
  ),
);

async function openPost(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'blockml:preferences:v1',
      JSON.stringify({ theme: 'light', tour: 'skipped' }),
    );
    // execCommand('copy') 때 실제로 복사된 텍스트를 기록한다.
    document.addEventListener('copy', () => {
      const field = document.activeElement;
      if (field instanceof HTMLTextAreaElement)
        (window as unknown as { copied: string }).copied = field.value.slice(
          field.selectionStart,
          field.selectionEnd,
        );
    });
  });
  await page.route('**/api/posts/' + postId, (route) =>
    route.fulfill({
      json: {
        id: postId,
        author: '작성자',
        title: '공유 구성',
        body: '본문',
        workflow,
        createdAt: '2026-11-13T10:00:00Z',
        updatedAt: null,
      },
    }),
  );
  await page.route('**/api/posts/' + postId + '/workflow', (route) =>
    route.fulfill({ json: workflow }),
  );
  await page.goto('/#/board/' + postId);
}

const status = (page: Page) => page.getByRole('status').filter({ hasText: '복사' });

const copied = (page: Page) =>
  page.evaluate(() => (window as unknown as { copied?: string }).copied);

test.describe('워크플로우 ID 복사', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test('클립보드 API로 복사하면 성공 문구를 보여준다', async ({ page }) => {
    await openPost(page);
    await page.getByRole('button', { name: '워크플로우 ID 복사' }).click();
    await expect(status(page)).toHaveText('워크플로우 ID를 복사했습니다.');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(postId);
  });

  test('클립보드 API가 없는 환경(http 등)에서도 복사하고 성공 문구를 보여준다', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    });
    await openPost(page);
    await page.getByRole('button', { name: '워크플로우 ID 복사' }).click();
    await expect(status(page)).toHaveText('워크플로우 ID를 복사했습니다.');
    expect(await copied(page)).toBe(postId);
  });

  test('모든 방법이 실패하면 ID를 보여주며 직접 복사하라고 안내한다', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
      document.execCommand = () => false;
    });
    await openPost(page);
    await page.getByRole('button', { name: '워크플로우 ID 복사' }).click();
    await expect(status(page)).toContainText('복사하지 못했습니다');
    await expect(status(page)).toContainText(postId);
  });
});
