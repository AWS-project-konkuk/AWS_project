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
/** 포트는 테스트 ID(처음 있던 노드) 또는 접근성 이름(학습자가 만든 노드)으로 찾는다. */
const handle = (lab: Locator, port: string) =>
  port.startsWith('port-') ? lab.getByTestId(port) : lab.getByLabel(port, { exact: true });
async function link(lab: Locator, from: string, to: string) {
  await handle(lab, from).click();
  await handle(lab, to).click();
}
async function fit(lab: Locator) {
  await lab.getByRole('button', { name: '전체 서비스', exact: true }).click();
}
async function run(lab: Locator) {
  await lab.getByRole('button', { name: '실습 실행', exact: true }).click();
  await expect(lab.getByRole('button', { name: '실습 실행', exact: true })).toBeVisible();
}
async function select(lab: Locator, node: string) {
  await lab
    .getByLabel('캔버스에서 항목 찾기')
    .selectOption(/\s\d$/.test(node) ? { label: node } : node);
}
async function choose(lab: Locator, node: string, label: string, value: string) {
  await select(lab, node);
  await lab.getByLabel(label, { exact: true }).selectOption(value);
}
async function answer(lab: Locator, page: Page) {
  await lab.getByRole('radio').first().check();
  await lab.getByRole('button', { name: '정답 확인' }).click();
  await expect(page.getByRole('link', { name: '다음 강의', exact: true })).toBeVisible();
}
const observed = (lab: Locator) => lab.getByRole('region', { name: '관찰할 조건' });
const seen = (lab: Locator) => observed(lab).locator('[data-observed="true"]');
const edges = (lab: Locator) => lab.getByTestId('system-lab-canvas').locator('.react-flow__edge');

test('3단원 · 직접 연결하고 Git만 이동한 실패, 캐시 복원, 원격 복원을 비교한다', async ({
  page,
}) => {
  const lab = await openLab(page, 'week4-workflow');
  await expect(lab.getByRole('heading', { name: '과거 실험 재현 실습' })).toBeVisible();
  await expect(edges(lab)).toHaveCount(0);

  await link(lab, 'port-repo-out-code', 'port-restore-in-code');
  await link(lab, 'port-start-out-workdata', 'port-restore-in-workdata');
  await link(lab, 'port-restore-out-restored', 'port-end-in-restored');
  await expect(edges(lab)).toHaveCount(3);
  await run(lab);
  await expect(lab.getByRole('status').first()).toContainText('재현할 실험은 v1인데 v2');

  await choose(lab, 'repo', '커밋', 'v1');
  await run(lab);
  await expect(lab.getByText(/코드는 v1인데 작업 데이터는 v2입니다/).first()).toBeVisible();
  await expect(seen(lab)).toHaveCount(1);
  await expect(lab.getByRole('radio')).toHaveCount(0);

  await choose(lab, 'restore', '복원 작업', 'checkout');
  await choose(lab, 'restore', '로컬 캐시의 데이터', 'present');
  await run(lab);
  await expect(lab.getByRole('status').first()).toContainText('원격 읽기 없이 캐시로 복원');
  await expect(lab.getByLabel('결과 지표')).toContainText('로컬 캐시');

  await choose(lab, 'restore', '로컬 캐시의 데이터', 'missing');
  await choose(lab, 'restore', '복원 작업', 'pull');
  await fit(lab);
  await link(lab, 'port-file-out-file', 'port-restore-in-file');
  await run(lab);
  await expect(lab.getByText(/파일 노드의 데이터 버전을 v1으로 맞추세요/).first()).toBeVisible();
  await choose(lab, 'file', '데이터 버전', 'v1');
  await run(lab);
  await expect(lab.getByRole('status').first()).toContainText('원격에서 가져와 복원');
  await expect(seen(lab)).toHaveCount(3);
  await answer(lab, page);
  await page.reload();
  await page.getByRole('button', { name: '실습 영역 확장', exact: true }).click();
  await expect(lab.getByRole('status').first()).toHaveText('현재 구성 실행 성공');
  await expect(page.getByRole('link', { name: '다음 강의', exact: true })).toBeVisible();
});

test('4단원 · 워커 하나의 OOM에서 시작해 워커·분할·결합을 만들고 분할 방식을 바꾼다', async ({
  page,
}) => {
  const lab = await openLab(page, 'week1-workflow');
  await expect(lab.getByTestId('node-worker1')).toBeVisible();
  await expect(edges(lab)).toHaveCount(0);
  await link(lab, 'port-start-out-job', 'port-worker1-in-job');
  await link(lab, 'port-worker1-out-result', 'port-end-in-checkpoint');
  await run(lab);
  await expect(
    lab.getByText(/OOM: 한 장에 24GiB가 필요하지만 16GiB뿐입니다/).first(),
  ).toBeVisible();
  await expect(seen(lab)).toHaveCount(1);

  // 워커 하나로는 안 되므로 워커, 분할, 결합을 만든다.
  await select(lab, 'ec2');
  for (const kind of ['GPU 워커', '분할', '결합'])
    await lab.getByRole('button', { name: kind + ' 추가', exact: true }).click();
  // 분할을 만들면 워커 출력 타입이 바뀌어 도착으로 가던 연결이 사라진다.
  await expect(edges(lab)).toHaveCount(1);
  await fit(lab);
  await handle(lab, 'port-worker1-in-job').click({ button: 'right' });
  await lab.getByRole('button', { name: '시작 연결 삭제' }).click();
  await expect(edges(lab)).toHaveCount(0);

  await link(lab, 'port-start-out-job', '분할 1 학습 작업 입력');
  await link(lab, '분할 1 학습 작업 2 출력', 'GPU 워커 2 학습 작업 입력');
  await link(lab, '분할 1 학습 작업 1 출력', 'port-worker1-in-job');
  await link(lab, 'port-worker1-out-result', '결합 1 기울기 1 입력');
  await link(lab, 'GPU 워커 2 기울기 출력', '결합 1 기울기 2 입력');
  await link(lab, '결합 1 체크포인트 출력', 'port-end-in-checkpoint');
  await run(lab);
  await expect(lab.getByText(/데이터 병렬은 모델을 장치마다 복제/).first()).toBeVisible();
  await expect(seen(lab)).toHaveCount(2);

  await choose(lab, '분할 1', '분할 방식', 'tensor');
  await expect(edges(lab)).toHaveCount(6);
  await run(lab);
  await expect(lab.getByRole('status').first()).toContainText('체크포인트를 갱신');
  await expect(lab.getByLabel('결과 지표')).toContainText('부분 행렬 결과');
  await expect(lab.getByLabel('결과 지표')).toContainText('12 / 16 GiB');
  await expect(seen(lab)).toHaveCount(3);

  // 처음 있던 워커는 삭제할 수 없고 만든 노드는 삭제할 수 있다.
  await select(lab, 'worker1');
  await expect(lab.getByRole('button', { name: '노드 삭제', exact: true })).toHaveCount(0);
  await select(lab, 'GPU 워커 2');
  await expect(lab.getByRole('button', { name: '노드 삭제', exact: true })).toBeVisible();
  await answer(lab, page);
});

test('6단원 · 질문 경로를 직접 만들고 저장소 유형과 임베딩 공간을 맞춘다', async ({ page }) => {
  const lab = await openLab(page, 'rag-workflow');
  await expect(edges(lab)).toHaveCount(3);
  await select(lab, 'ec2');
  await lab.getByRole('button', { name: '임베딩 추가', exact: true }).click();
  await select(lab, 'storage');
  await lab.getByRole('button', { name: '검색 추가', exact: true }).click();
  await fit(lab);
  await link(lab, 'port-start-out-question', '임베딩 1 텍스트 입력');
  await link(lab, '임베딩 1 벡터 출력', '검색 1 질문 벡터 입력');
  await link(lab, 'port-index-out-index', '검색 1 색인 입력');
  await link(lab, '검색 1 근거 출력', 'port-api-in-evidence');
  await link(lab, 'port-start-out-question', 'port-api-in-question');
  await expect(edges(lab)).toHaveCount(8);

  await run(lab);
  await expect(lab.getByText(/저장소 유형을 Vector DB로 바꾸세요/).first()).toBeVisible();
  await choose(lab, 'storage', '저장소 유형', 'vector');
  await run(lab);
  await expect(
    lab.getByText(/서로 다른 공간의 벡터는 거리를 비교할 수 없어/).first(),
  ).toBeVisible();
  await expect(seen(lab)).toHaveCount(1);

  await choose(lab, '임베딩 1', '임베딩 공간', 'A');
  await run(lab);
  await expect(lab.getByRole('status').first()).toContainText('doc-return');
  await expect(lab.getByLabel('결과 지표')).toContainText('[doc-return]');
  await expect(seen(lab)).toHaveCount(2);
  await answer(lab, page);
});
