import { expect, test, type Locator, type Page } from '@playwright/test';

async function openLab(page: Page, lesson: string) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1680, height: 1000 });
  await page.addInitScript(() => {
    localStorage.setItem(
      'blockml:preferences:v1',
      JSON.stringify({ theme: 'light', tour: 'skipped' }),
    );
  });
  await page.goto('/#/learn/' + lesson);
  await page.getByRole('button', { name: '실습 영역 확장', exact: true }).click();
  return page.getByTestId('system-lab');
}
async function link(lab: Locator, from: string, to: string) {
  await lab.getByTestId('port-' + from).click();
  await lab.getByTestId('port-' + to).click();
}
async function run(lab: Locator) {
  await lab.getByRole('button', { name: '실습 실행', exact: true }).click();
  await expect(lab.getByRole('button', { name: '실습 실행', exact: true })).toBeVisible();
}
async function choose(lab: Locator, node: string, label: string, value: string) {
  await lab.getByLabel('캔버스에서 항목 찾기').selectOption(node);
  await lab.getByLabel(label, { exact: true }).selectOption(value);
}
async function answer(lab: Locator, page: Page) {
  await lab.getByRole('radio').first().check();
  await lab.getByRole('button', { name: '정답 확인' }).click();
  await expect(page.getByRole('link', { name: '다음 강의', exact: true })).toBeVisible();
}
const observed = (lab: Locator) => lab.getByRole('region', { name: '관찰할 조건' });

test('3단원 · Git만 이동한 실패, 캐시 복원, 원격 복원을 비교하고 완료한다', async ({ page }) => {
  const lab = await openLab(page, 'week4-workflow');
  await expect(lab.getByRole('heading', { name: '과거 실험 재현 실습' })).toBeVisible();
  await expect(lab.getByTestId('system-lab-canvas').locator('.react-flow__edge')).toHaveCount(4);
  await run(lab);
  await expect(lab.getByText(/코드는 v1인데 작업 데이터는 v2입니다/).first()).toBeVisible();
  await expect(observed(lab).locator('[data-observed="true"]')).toHaveCount(1);
  await expect(lab.getByRole('radio')).toHaveCount(0);

  await choose(lab, 'restore', '복원 작업', 'checkout');
  await choose(lab, 'restore', '로컬 캐시의 v1', 'present');
  await run(lab);
  await expect(lab.getByRole('status').first()).toContainText('원격 읽기 없이 캐시로 복원');
  await expect(lab.getByRole('group', { name: '결과 지표', exact: true })).toHaveCount(0);
  await expect(lab.getByLabel('결과 지표')).toContainText('로컬 캐시');

  await choose(lab, 'restore', '로컬 캐시의 v1', 'missing');
  await choose(lab, 'restore', '복원 작업', 'pull');
  await lab.getByRole('button', { name: '전체 서비스', exact: true }).click();
  await link(lab, 'start-out-version', 's3-files-in-version');
  await link(lab, 's3-files-out-file', 'restore-in-file');
  await run(lab);
  await expect(lab.getByRole('status').first()).toContainText('원격에서 가져와 복원');
  await expect(observed(lab).locator('[data-observed="true"]')).toHaveCount(3);
  await answer(lab, page);
  await page.reload();
  await page.getByRole('button', { name: '실습 영역 확장', exact: true }).click();
  await expect(lab.getByRole('status').first()).toHaveText('현재 구성 실행 성공');
  await expect(page.getByRole('link', { name: '다음 강의', exact: true })).toBeVisible();
});

test('4단원 · 데이터 병렬 OOM을 관찰하고 텐서 병렬로 두 워커를 사용한다', async ({ page }) => {
  const lab = await openLab(page, 'week1-workflow');
  await link(lab, 'worker1-out-result', 'merge-in-a');
  await link(lab, 'worker2-out-result', 'merge-in-b');
  await run(lab);
  await expect(
    lab.getByText(/OOM: 한 장에 24GiB가 필요하지만 16GiB뿐입니다/).first(),
  ).toBeVisible();
  await expect(lab.getByTestId('node-worker1')).toHaveAttribute('data-status', '실패');
  await expect(observed(lab).locator('[data-observed="true"]')).toHaveCount(1);

  await choose(lab, 'gpu', '병렬 전략', 'tensor');
  await expect(lab.getByTestId('system-lab-canvas').locator('.react-flow__edge')).toHaveCount(7);
  await run(lab);
  await expect(lab.getByRole('status').first()).toContainText('체크포인트를 갱신');
  await expect(lab.getByLabel('결과 지표')).toContainText('부분 행렬 결과');
  await expect(lab.getByLabel('결과 지표')).toContainText('12 / 16 GiB');
  await expect(observed(lab).locator('[data-observed="true"]')).toHaveCount(2);

  // 핵심 노드는 삭제할 수 없다.
  await lab.getByLabel('캔버스에서 항목 찾기').selectOption('worker1');
  await expect(lab.getByRole('button', { name: '노드 삭제', exact: true })).toHaveCount(0);
  await answer(lab, page);
});

test('4단원 · 레이어 분할은 앞 워커의 활성값을 뒤 워커에 연결해야 한다', async ({ page }) => {
  const lab = await openLab(page, 'week1-workflow');
  await link(lab, 'worker1-out-result', 'merge-in-a');
  await link(lab, 'worker2-out-result', 'merge-in-b');
  await choose(lab, 'gpu', '병렬 전략', 'model');
  await run(lab);
  await expect(lab.getByText(/마지막 레이어를 맡은 워커의 결과가 필요합니다/)).toBeVisible();
  await link(lab, 'worker1-out-result', 'worker2-in-act');
  await run(lab);
  await expect(lab.getByLabel('결과 지표')).toContainText('중간 활성값');
});

test('6단원 · 다른 임베딩 공간의 검색 차단을 확인한 뒤 근거가 붙은 답변을 받는다', async ({
  page,
}) => {
  const lab = await openLab(page, 'rag-workflow');
  await link(lab, 'start-out-question', 'query-embed-in-question');
  await link(lab, 'index-out-index', 'search-in-index');
  await link(lab, 'query-embed-out-qvec', 'search-in-qvec');
  await link(lab, 'search-out-evidence', 'answer-in-evidence');
  await link(lab, 'start-out-question', 'answer-in-question');
  await run(lab);
  await expect(lab.getByText(/서로 다른 공간의 벡터는 거리를 비교할 수 없어/)).toBeVisible();
  await expect(lab.getByTestId('node-search')).toHaveAttribute('data-status', '실패');

  await choose(lab, 'query-embed', '임베딩 공간', 'A');
  await run(lab);
  await expect(lab.getByRole('status').first()).toContainText('doc-return');
  await expect(lab.getByLabel('결과 지표')).toContainText('[doc-return]');
  await expect(observed(lab).locator('[data-observed="true"]')).toHaveCount(2);
  await answer(lab, page);
});
