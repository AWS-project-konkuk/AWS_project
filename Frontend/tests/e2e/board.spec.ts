import { expect, test } from '@playwright/test';
import type { PageResponse, Post, PostSummary } from '../../src/api/posts/posts';
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
  workflow,
  createdAt: '2026-11-13T10:00:00Z',
  updatedAt: null,
};

function postPage(url: URL, posts: PostSummary[]): PageResponse<PostSummary> {
  const page = Number(url.searchParams.get('page'));
  const size = Number(url.searchParams.get('size'));
  expect(size).toBe(30);
  const totalPages = Math.ceil(posts.length / size);
  return {
    content: posts.slice(page * size, (page + 1) * size),
    page,
    size,
    totalElements: posts.length,
    totalPages,
    hasNext: page + 1 < totalPages,
  };
}

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
  const requestedPages: string[] = [];
  let detailRequests = 0;
  const posts = [
    first,
    ...Array.from({ length: 30 }, (_, index) => ({
      ...first,
      id: '33333333-3333-4333-8333-' + String(index).padStart(12, '0'),
      title: '게시글 ' + (index + 1),
      workflow: null,
    })),
  ];
  await page.route(
    (url) => url.pathname === '/api/posts',
    (route) => {
      const url = new URL(route.request().url());
      requestedPages.push(url.searchParams.get('page') ?? '');
      return route.fulfill({ json: postPage(url, posts) });
    },
  );
  await page.route('**/api/posts/' + firstId, (route) => {
    detailRequests++;
    return route.fulfill({ json: { ...first, body: '상세 본문' } });
  });
  await page.route('**/api/posts/' + firstId + '/workflow', (route) =>
    route.fulfill({ json: workflow }),
  );
  await page.goto('/#/board');
  const main = page.getByRole('main');
  const cards = main.locator(':scope > ul > li');
  const pagination = main.getByRole('navigation', { name: '게시판 페이지' });
  const pageNumbers = pagination.getByRole('link', { name: /^\d+페이지$/ });
  await expect(cards).toHaveCount(30);
  await expect(pageNumbers).toHaveText(['1', '2']);
  await expect(pagination.getByRole('link', { name: '1페이지' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(main.getByRole('img', { name: '워크플로우 미리보기' })).toBeVisible();
  await expect(main.getByText('31개 게시글')).toBeVisible();
  expect(requestedPages).toEqual(['0']);
  await page.screenshot({ path: 'test-results/board-desktop.png' });
  await pagination.getByRole('link', { name: '다음', exact: true }).click();
  await expect(cards).toHaveCount(1);
  await expect(main.getByRole('link', { name: /게시글 30/ })).toBeVisible();
  await expect(main.getByRole('button', { name: '다음', exact: true })).toBeDisabled();
  expect(requestedPages).toEqual(['0', '1']);
  await pagination.getByRole('link', { name: '이전', exact: true }).click();
  await expect(cards).toHaveCount(30);
  expect(requestedPages).toEqual(['0', '1']);
  await main.getByRole('button', { name: '새로고침', exact: true }).click();
  await expect.poll(() => requestedPages).toEqual(['0', '1', '0']);
  await main.getByRole('link', { name: /공유 구성/ }).click();
  await expect(main.getByRole('heading', { name: '공유 구성' })).toBeVisible();
  await expect(main.getByText('상세 본문')).toBeVisible();
  expect(detailRequests).toBe(1);
  expect(requestedPages).toEqual(['0', '1', '0']);
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

  await page.goto('/#/board?page=3');
  await expect(page).toHaveURL(/#\/board\?page=2$/);
  await expect(cards).toHaveCount(1);
});

test('페이지 번호를 최대 10개 표시하고 첫 페이지와 마지막 페이지로 이동한다', async ({ page }) => {
  const posts = Array.from({ length: 361 }, (_, index) => ({
    ...first,
    id: '33333333-3333-4333-8333-' + String(index).padStart(12, '0'),
    title: '게시글 ' + (index + 1),
    workflow: null,
  }));
  await page.route(
    (url) => url.pathname === '/api/posts',
    (route) => route.fulfill({ json: postPage(new URL(route.request().url()), posts) }),
  );
  await page.goto('/#/board?filter=shared');
  const pagination = page.getByRole('navigation', { name: '게시판 페이지' });
  const pageNumbers = pagination.getByRole('link', { name: /^\d+페이지$/ });
  await expect(pageNumbers).toHaveText(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
  await expect(pagination.getByRole('button', { name: '첫 페이지' })).toBeDisabled();
  await pagination.screenshot({ path: 'test-results/board-pagination-desktop.png' });

  await pagination.getByRole('link', { name: '마지막 페이지' }).click();
  await expect(page).toHaveURL(/filter=shared&page=13$/);
  await expect(pageNumbers).toHaveText(['4', '5', '6', '7', '8', '9', '10', '11', '12', '13']);
  await expect(pagination.getByRole('button', { name: '마지막 페이지' })).toBeDisabled();
  await page.setViewportSize({ width: 320, height: 844 });
  const paginationWidth = await pagination.evaluate((nav) => nav.scrollWidth <= nav.clientWidth);
  expect(paginationWidth).toBe(true);
  await pagination.screenshot({ path: 'test-results/board-pagination-mobile.png' });

  await pagination.getByRole('link', { name: '8페이지' }).click();
  await expect(pagination.getByRole('link', { name: '8페이지' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await pagination.getByRole('link', { name: '첫 페이지' }).click();
  await expect(pagination.getByRole('link', { name: '1페이지' })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('글을 등록하고 비밀번호 오류를 확인한 뒤 수정과 삭제를 수행한다', async ({ page }) => {
  let post: Post | undefined;
  await page.route(
    (url) => url.pathname === '/api/posts',
    (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          json: postPage(new URL(route.request().url()), post ? [post] : []),
        });
      }
      const draft = route.request().postDataJSON();
      expect(draft).toMatchObject({
        author: '작성자',
        title: '새 글',
        body: '새 내용',
        password: 'correct',
        workflow: null,
      });
      post = {
        ...first,
        id: newId,
        title: draft.title,
        body: draft.body,
        workflow: draft.workflow,
      };
      return route.fulfill({ status: 201, json: { id: newId } });
    },
  );
  await page.route('**/api/posts/' + newId, (route) => {
    if (!post) return route.fulfill({ status: 404 });
    if (route.request().method() === 'GET') return route.fulfill({ json: post });
    const draft = route.request().postDataJSON();
    if (draft.password !== 'correct') return route.fulfill({ status: 403 });
    if (route.request().method() === 'PATCH') {
      expect(draft.body).toBe('새 내용');
      post = { ...post, title: draft.title };
    } else {
      expect(route.request().method()).toBe('DELETE');
      post = undefined;
    }
    return route.fulfill({ status: 204 });
  });
  await page.goto('/#/board');
  await page.getByRole('link', { name: '글 쓰기' }).click();
  await expect(page.getByLabel('작성자')).toHaveAttribute('maxlength', '20');
  await expect(page.getByLabel('제목')).toHaveAttribute('maxlength', '20');
  await expect(page.getByLabel('내용')).toHaveAttribute('maxlength', '500');
  await expect(page.getByLabel('비밀번호')).toHaveAttribute('maxlength', '20');
  await page.getByLabel('제목').evaluate((input) => input.removeAttribute('maxlength'));
  await page.getByLabel('제목').fill('가'.repeat(21));
  await page.getByLabel('작성자').fill('작성자');
  await expect(page.getByLabel('작성자')).toHaveAccessibleDescription('3 / 20자');
  await page.getByLabel('내용').fill('새 내용');
  await page.getByLabel('비밀번호').fill('correct');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('제목 항목은 20자 이하');
  await page.getByLabel('제목').fill('새 글');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByRole('heading', { name: '새 글' })).toBeVisible();
  await page.getByRole('link', { name: '수정', exact: true }).click();
  await expect(page.getByLabel('내용')).toHaveValue('새 내용');
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
  await expect(page.getByRole('navigation', { name: '게시판 페이지' })).toHaveCount(0);
  await page.goto('/#/board/' + newId);
  await expect(page.getByText('게시글을 찾을 수 없습니다.')).toBeVisible();
});
