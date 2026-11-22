import { expect, test } from '@playwright/test';
import { examplePipeline } from '../../src/systemLab/labs/playground-example';
import { toWorkflow } from '../../src/playground/workflow';

const postId = '44444444-4444-4444-8444-444444444444';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('blockml:preferences:v1'))
      localStorage.setItem(
        'blockml:preferences:v1',
        JSON.stringify({ theme: 'light', tour: 'skipped' }),
      );
  });
});

test('내 Playground를 저장하고 복제·이름 변경·삭제하며 새로고침 뒤에도 남긴다', async ({
  page,
}) => {
  page.on(
    'dialog',
    (dialog) => void dialog.accept(dialog.type() === 'prompt' ? '실험 A' : undefined),
  );
  await page.goto('/#/playground');
  const playground = page.getByTestId('playground');
  await playground.getByRole('button', { name: 'MLOps 예시' }).click();
  await playground.getByRole('button', { name: /^내 Playground/ }).click();
  const panel = playground.getByRole('region', { name: '내 Playground', exact: true });
  await expect(panel.getByText('저장한 Playground가 없습니다.')).toBeVisible();
  await panel.getByLabel('저장할 이름').fill('파이프라인');
  await panel.getByRole('button', { name: '새로 저장' }).click();
  await expect(panel.getByText('열어 둔 구성: 파이프라인')).toBeVisible();
  await expect(panel.getByRole('button', { name: '파이프라인 불러오기' })).toBeVisible();

  await page.reload();
  await playground.getByRole('button', { name: /^내 Playground \(1\)/ }).click();
  await expect(panel.getByRole('button', { name: '파이프라인 불러오기' })).toBeVisible();

  await panel.getByRole('button', { name: '파이프라인 복제' }).click();
  await expect(panel.getByRole('button', { name: '파이프라인 복사본 불러오기' })).toBeVisible();
  await panel.getByRole('button', { name: '파이프라인 복사본 이름 변경' }).click();
  await expect(panel.getByRole('button', { name: '실험 A 불러오기' })).toBeVisible();
  await panel.getByRole('button', { name: '실험 A 삭제' }).click();
  await expect(panel.getByRole('button', { name: '실험 A 불러오기' })).toHaveCount(0);
  await expect(playground.getByRole('button', { name: /^내 Playground \(1\)/ })).toBeVisible();
});

test('저장한 구성을 게시판 글쓰기로 바로 올릴 수 있다', async ({ page }) => {
  await page.goto('/#/playground');
  const playground = page.getByTestId('playground');
  await playground.getByRole('button', { name: 'MLOps 예시' }).click();
  await playground.getByRole('button', { name: /^내 Playground/ }).click();
  const panel = playground.getByRole('region', { name: '내 Playground', exact: true });
  await panel.getByLabel('저장할 이름').fill('올릴 구성');
  await panel.getByRole('button', { name: '새로 저장' }).click();

  await panel.getByRole('link', { name: '게시판에 올리기' }).click();
  await expect(page).toHaveURL(/#\/board\/new\?attach=current$/);
  const attach = page.getByLabel('워크플로우');
  await expect(attach).toHaveValue('current');

  await page.goBack();
  await playground.getByRole('button', { name: /^내 Playground/ }).click();
  await panel
    .getByRole('link', { name: /올리기$/ })
    .last()
    .click();
  await expect(attach).toHaveValue(/^saved:pg-/);
  await expect(attach.locator('option:checked')).toHaveText('저장한 Playground · 올릴 구성');
});

test('게시글의 워크플로우는 실습과 같은 캔버스에서 꺾은 선으로 보인다', async ({ page }) => {
  const workflow = toWorkflow(examplePipeline());
  const post = {
    id: postId,
    author: '작성자',
    title: '공유 구성',
    body: '본문',
    workflow,
    createdAt: '2026-11-13T10:00:00Z',
    updatedAt: null,
  };
  await page.route('**/api/posts/' + postId, (route) => route.fulfill({ json: post }));
  await page.route('**/api/posts/' + postId + '/workflow', (route) =>
    route.fulfill({ json: workflow }),
  );
  await page.goto('/#/board/' + postId);
  const canvas = page.getByRole('main').locator('.react-flow');
  await expect(canvas).toBeVisible();
  await expect(canvas.locator('.react-flow__node').first()).toBeVisible();
  const paths = await canvas
    .locator('.react-flow__edge-path')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('d') ?? ''));
  expect(paths.length).toBeGreaterThan(0);
  // 곡선(C)이 아니라 직선과 모서리 둥근 꺾임(L, Q)으로만 그려진다.
  expect(paths.every((d) => !/C/.test(d))).toBe(true);
  // 미리보기는 편집할 수 없다.
  await expect(canvas.getByRole('button', { name: '전체 서비스' })).toHaveCount(0);
  await expect(page.getByTestId('playground')).toHaveCount(0);
});
