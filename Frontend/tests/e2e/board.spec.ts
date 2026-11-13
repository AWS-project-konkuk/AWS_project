import { expect, test } from '@playwright/test';
import { resourceDefaults } from '../../src/console/resources';

const firstId = '11111111-1111-4111-8111-111111111111';
const newId = '22222222-2222-4222-8222-222222222222';
const workflow = {
  version: 1,
  resources: [
    { id: 'shared', position: { x: 0, y: 0 }, config: resourceDefaults('s3', '공유 버킷') },
  ],
  edges: [],
};
const first = {
  id: firstId,
  author: '작성자',
  title: '공유 구성',
  body: '게시글 내용',
  workflow,
  createdAt: '2026-11-13T10:00:00Z',
  updatedAt: null,
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'blockml:preferences:v1',
      JSON.stringify({ theme: 'light', tour: 'skipped' }),
    ),
  );
});

test('게시글을 30개씩 표시하고 새로고침과 워크플로우 가져오기를 지원한다', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  let requests = 0;
  const posts = [
    first,
    ...Array.from({ length: 30 }, (_, index) => ({
      ...first,
      id: '33333333-3333-4333-8333-' + String(index).padStart(12, '0'),
      title: '게시글 ' + (index + 1),
      workflow: null,
    })),
  ];
  await page.route('**/api/posts', (route) => {
    requests++;
    return route.fulfill({ json: posts });
  });
  await page.route('**/api/posts/' + firstId + '/workflow', (route) =>
    route.fulfill({ json: workflow }),
  );
  await page.goto('/#/board');
  const main = page.getByRole('main');
  await expect(main.getByRole('listitem')).toHaveCount(30);
  await expect(main.getByRole('img', { name: '워크플로우 미리보기' })).toBeVisible();
  const initialRequests = requests;
  await page.screenshot({ path: 'test-results/board-desktop.png' });
  await main.getByRole('button', { name: '다음', exact: true }).click();
  await expect(main.getByRole('listitem')).toHaveCount(1);
  await main.getByRole('button', { name: '이전', exact: true }).click();
  expect(requests).toBe(initialRequests);
  await main.getByRole('button', { name: '새로고침', exact: true }).click();
  await expect.poll(() => requests).toBe(initialRequests + 1);
  await main.getByRole('link', { name: /공유 구성/ }).click();
  await expect(main.getByRole('heading', { name: '공유 구성' })).toBeVisible();
  await expect(main.getByRole('img', { name: '공유 버킷' })).toBeVisible();
  await main.getByRole('button', { name: '워크플로우 ID 복사' }).click();
  await expect(main.getByRole('status')).toHaveText('워크플로우 ID를 복사했습니다.');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(firstId);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(main.getByRole('img', { name: '공유 버킷' })).toBeVisible();
  await page.screenshot({ path: 'test-results/board-mobile.png' });
  await main.getByRole('link', { name: 'Playground에서 열기' }).click();
  await expect(page.getByRole('textbox', { name: '워크플로우 ID' })).toHaveValue(firstId);
  await page.getByRole('button', { name: '불러오기', exact: true }).click();
  await expect(page.getByTestId('resource-shared')).toContainText('공유 버킷');
});

test('글을 등록하고 비밀번호 오류를 확인한 뒤 수정과 삭제를 수행한다', async ({ page }) => {
  let posts: (typeof first)[] = [];
  await page.route('**/api/posts', (route) => {
    if (route.request().method() === 'GET') return route.fulfill({ json: posts });
    const draft = route.request().postDataJSON();
    expect(draft).toMatchObject({
      author: '작성자',
      title: '새 글',
      body: '새 내용',
      password: 'correct',
      workflow: null,
    });
    posts = [{ ...first, ...draft, id: newId }];
    return route.fulfill({ status: 201, json: { id: newId } });
  });
  await page.route('**/api/posts/' + newId, (route) => {
    const draft = route.request().postDataJSON();
    if (draft.password !== 'correct') return route.fulfill({ status: 403 });
    if (route.request().method() === 'PATCH') {
      posts = posts.map((post) => ({ ...post, title: draft.title, body: draft.body }));
    } else {
      expect(route.request().method()).toBe('DELETE');
      posts = [];
    }
    return route.fulfill({ status: 204 });
  });
  await page.goto('/#/board');
  await page.getByRole('link', { name: '글 쓰기' }).click();
  await page.getByLabel('작성자').fill('작성자');
  await page.getByLabel('제목').fill('새 글');
  await page.getByLabel('내용').fill('새 내용');
  await page.getByLabel('비밀번호').fill('correct');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByRole('heading', { name: '새 글' })).toBeVisible();
  await page.getByRole('link', { name: '수정', exact: true }).click();
  await page.getByLabel('제목').fill('수정한 글');
  await page.getByLabel('비밀번호').fill('wrong');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('비밀번호');
  await page.getByLabel('비밀번호').fill('correct');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByRole('heading', { name: '수정한 글' })).toBeVisible();
  await page.getByRole('button', { name: '삭제', exact: true }).click();
  await page.getByLabel('비밀번호').fill('correct');
  await page.getByRole('button', { name: '삭제 확인' }).click();
  await expect(page.getByText('아직 게시글이 없습니다.')).toBeVisible();
});
