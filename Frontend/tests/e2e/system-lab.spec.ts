import { expect, test, type Page } from '@playwright/test';

async function openLab(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'blockml:preferences:v1',
      JSON.stringify({
        theme: localStorage.getItem('pilot-test-dark') ? 'dark' : 'light',
        tour: 'skipped',
      }),
    );
  });
  await page.goto('/#/learn/week2-workflow');
  await page.getByRole('button', { name: '실습 영역 확장', exact: true }).click();
  return page.getByTestId('system-lab');
}

test('마우스로 준비·연결·실행하고 진도와 편집을 복원한다', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  const lab = await openLab(page);
  await expect(lab.getByRole('button', { name: 'EC2 추가' })).toBeEnabled();
  await lab.getByRole('button', { name: '내부 일괄 실행', exact: true }).click();
  const canvas = lab.getByTestId('system-lab-canvas');
  await expect(canvas.locator('.react-flow__edge')).toHaveCount(3);
  const finder = lab.getByLabel('캔버스에서 항목 찾기');
  await finder.selectOption('kubernetes');
  const selector = lab.getByLabel('대상 Pod 라벨');
  await selector.fill('other');
  await selector.press('Tab');
  await expect(canvas.locator('.react-flow__edge')).toHaveCount(1);
  await selector.fill('review');
  await selector.press('Tab');
  await expect(canvas.locator('.react-flow__edge')).toHaveCount(3);
  const inputs = lab.getByRole('region', { name: '입력 포트' });
  await inputs.getByRole('button', { name: '이미지 포트 삭제' }).click();
  await expect(lab.getByTestId('port-kubernetes-in-image')).toHaveCount(0);
  await inputs.getByRole('button', { name: '입력 추가' }).click();
  const imageInput = canvas.getByLabel('Kubernetes 이미지 입력', { exact: true });
  await expect(imageInput).toBeVisible();
  await lab.getByRole('button', { name: '전체 서비스', exact: true }).click();
  await lab.getByTestId('port-image-out-image').click();
  await imageInput.click();
  for (const pod of ['pod-a', 'pod-b']) {
    await lab.getByTestId('port-start-out-model').click();
    await lab.getByTestId('port-' + pod + '-in-model').click();
    await lab.getByTestId('port-' + pod + '-out-prediction').click();
    await lab.getByTestId('port-end-in-prediction').click();
  }
  await lab.getByRole('button', { name: '실습 실행', exact: true }).click();
  await expect(lab.getByRole('status').first()).toContainText('응답 10건이 중복 없이');
  await expect(lab.getByRole('status').first()).toHaveAttribute('data-tone', 'success');
  await expect(lab.getByTestId('node-pod-a')).toHaveAttribute('data-status', '성공');
  await expect(lab.getByRole('button', { name: '실행 결과 접기' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  const modelWire = canvas.getByRole('group', { name: '출발 → Pod 1 모델', exact: true });
  await modelWire.focus();
  await page.keyboard.press('Enter');
  await expect(lab.getByRole('status').filter({ hasText: '출발 → Pod 1' })).toContainText(
    'model.pkl · v1',
  );
  await lab.getByRole('radio').first().check();
  await lab.getByRole('button', { name: '정답 확인' }).click();
  await expect(page.getByRole('link', { name: '다음 강의', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: '실습 영역 확장', exact: true }).click();
  await expect(lab.getByRole('status').first()).toHaveText('현재 구성 실행 성공');
  await lab.getByTestId('port-pod-b-in-model').click({ button: 'right' });
  await lab.getByRole('button', { name: '출발 연결 삭제' }).click();
  await expect(page.getByRole('button', { name: '다음 강의', exact: true })).toBeDisabled();
  await lab.getByRole('button', { name: '실행 취소', exact: true }).click();
  await lab.getByRole('button', { name: '실습 실행', exact: true }).click();
  await expect(page.getByRole('link', { name: '다음 강의', exact: true })).toBeVisible();
  await lab.getByLabel('캔버스에서 항목 찾기').selectOption('kubernetes');
  await lab.getByRole('button', { name: 'Pod 추가', exact: true }).click();
  await expect(lab.getByRole('button', { name: '입력 추가' })).toBeVisible();
  await lab.getByRole('button', { name: '노드 삭제', exact: true }).click();
  await lab.getByRole('button', { name: '실행 취소', exact: true }).click();
  await expect(lab.getByLabel('캔버스에서 항목 찾기').locator('option')).toHaveCount(11);
  await lab.getByRole('button', { name: '초기 복원' }).click();
  await expect(lab.getByTestId('node-pod-b')).toHaveAttribute('data-status', '정지');
  await lab.getByRole('button', { name: '실행 취소', exact: true }).click();
  await expect(lab.getByTestId('node-pod-b')).toHaveAttribute('data-status', '실행 준비');
});

test('실패한 실행도 왼쪽 결과를 펼치고 오른쪽 설정은 좁게 접힌다', async ({ page }) => {
  const lab = await openLab(page);
  const canvas = lab.getByTestId('system-lab-canvas');
  const results = lab.getByRole('complementary', { name: '실행 결과' });
  const settings = lab.getByRole('complementary', { name: '항목 설정' });
  await expect(results.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  const before = (await canvas.boundingBox())!;
  await settings.getByRole('button', { name: '설정 접기' }).click();
  const collapsed = settings.getByRole('button', { name: '설정 펼치기' });
  await expect(settings.getByText('설정', { exact: true })).toBeVisible();
  await expect(results.getByText('실행 결과', { exact: true })).toBeVisible();
  await expect(collapsed.locator('.lucide-chevron-left')).toBeVisible();
  expect((await settings.boundingBox())!.width).toBeLessThan(50);
  expect((await canvas.boundingBox())!.width).toBeGreaterThan(before.width);
  await lab.getByRole('button', { name: '실습 실행', exact: true }).click();
  await expect(results.getByRole('button', { name: '실행 결과 접기' })).toBeVisible();
  await expect(results.getByRole('status').first()).toContainText('0 / 10');
  await expect(results.getByRole('status').first()).toHaveAttribute('data-tone', 'error');
  await expect(lab.getByTestId('node-end')).toHaveAttribute('data-status', '실패');
  const left = (await results.boundingBox())!;
  expect(left.x + left.width).toBeLessThanOrEqual((await canvas.boundingBox())!.x + 1);
  await results.getByRole('button', { name: '실행 결과 접기' }).click();
  await collapsed.click();
  await expect(
    settings.getByRole('button', { name: '설정 접기' }).locator('.lucide-chevron-right'),
  ).toBeVisible();
  await expect(results.getByRole('button', { name: '실행 결과 펼치기' })).toHaveAttribute(
    'aria-expanded',
    'false',
  );

  const connected = canvas.getByTestId('port-start-out-request');
  const empty = canvas.getByTestId('port-pod-a-in-model');
  const painted = (el: Element) => {
    const paint = getComputedStyle(el, '::before');
    return paint.backgroundColor === paint.borderTopColor;
  };
  expect(await connected.evaluate(painted)).toBe(true);
  expect(await empty.evaluate(painted)).toBe(false);
});

test('패널 폭을 따로 선택하고 실행 가능한 항목에서만 스위치를 표시한다', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  const lab = await openLab(page);
  const settings = lab.getByRole('complementary', { name: '항목 설정' });
  const results = lab.getByRole('complementary', { name: '실행 결과' });
  const settingsSizes = settings.getByRole('group', { name: '설정 폭' });
  await results.getByRole('button', { name: '실행 결과 펼치기' }).click();
  const resultsSizes = results.getByRole('group', { name: '실행 결과 폭' });
  const medium = (await settings.boundingBox())!.width;
  await settingsSizes.getByRole('button', { name: '크게' }).click();
  const large = (await settings.boundingBox())!.width;
  expect(large).toBeGreaterThan(medium);
  await resultsSizes.getByRole('button', { name: '작게' }).click();
  expect((await results.boundingBox())!.width).toBeLessThan(medium);
  expect((await settings.boundingBox())!.width).toBe(large);
  await results.getByRole('button', { name: '실행 결과 접기' }).click();
  await results.getByRole('button', { name: '실행 결과 펼치기' }).click();
  await expect(resultsSizes.getByRole('button', { name: '작게' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  const finder = lab.getByLabel('캔버스에서 항목 찾기');
  for (const id of ['image']) {
    await finder.selectOption(id);
    await expect(settings.getByRole('switch')).toHaveCount(0);
    await expect(lab.getByTestId('node-' + id).locator('header small')).toHaveText(
      /진입점|실행 자료/,
    );
  }
  await finder.selectOption('pod-a');
  await expect(settings.getByRole('switch', { name: 'Pod 1 실행 상태' })).toBeVisible();
  await finder.selectOption('kubernetes');
  await expect(settings.getByRole('switch', { name: 'Kubernetes 실행 상태' })).toBeVisible();
});

test('처음부터 포트와 도구를 편집하고 드롭 한 번으로 위치를 저장한다', async ({ page }) => {
  const lab = await openLab(page);
  const finder = lab.getByLabel('캔버스에서 항목 찾기');
  await finder.selectOption('kubernetes');
  const addPod = lab.getByRole('button', { name: 'Pod 추가' });
  await expect(addPod).toBeEnabled();
  await expect(lab.getByRole('button', { name: '시스템과 내부 항목 삭제' })).toHaveCount(0);
  const iconColor = (element: Element) => getComputedStyle(element.querySelector('svg')!).color;
  expect(await addPod.evaluate(iconColor)).toBe(
    await lab.getByTestId('node-pod-a').locator('header').evaluate(iconColor),
  );
  expect(await lab.getByTestId('node-pod-a').locator('header').evaluate(iconColor)).not.toBe(
    await lab.getByTestId('node-image').locator('header').evaluate(iconColor),
  );
  await finder.selectOption('pod-a');
  await expect(lab.getByRole('button', { name: '입력 추가' })).toBeEnabled();
  await expect(lab.getByRole('button', { name: '노드 삭제', exact: true })).toHaveCount(0);
  await lab.getByRole('button', { name: '전체 서비스', exact: true }).click();
  const stored = () =>
    page.evaluate(() => localStorage.getItem('blockml:system-lab:week2-workflow:v1'));
  const initial = await stored();
  for (const id of ['start', 'end', 'pod-a']) {
    const before = await stored();
    const header = lab.getByTestId('node-' + id).locator('header');
    const rect = (await header.boundingBox())!;
    const x = rect.x + rect.width / 2;
    const y = rect.y + rect.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 25, y + 18, { steps: 16 });
    await expect.poll(async () => (await header.boundingBox())!.x).toBeGreaterThan(rect.x + 15);
    expect(await stored()).toBe(before);
    await page.mouse.up();
    await expect.poll(stored).not.toBe(before);
  }
  const edited = await stored();
  const saved = JSON.parse(edited!);
  expect(saved.graph.entities.find((item: { id: string }) => item.id === 'end').parent).toBe(
    'root',
  );
  await page.reload();
  await page.getByRole('button', { name: '실습 영역 확장', exact: true }).click();
  expect(await stored()).toBe(edited);
  expect(await stored()).not.toBe(initial);
});

test('영역을 접고, 선을 우클릭해 삭제한 뒤 되돌린다', async ({ page }) => {
  const lab = await openLab(page);
  const canvas = lab.getByTestId('system-lab-canvas');
  await lab.getByRole('button', { name: 'Kubernetes 접기', exact: true }).click();
  await expect(canvas.getByTestId('node-pod-a')).toHaveCount(0);
  await expect(canvas.getByText('숨겨진 항목 3개')).toBeVisible();
  await expect(canvas.getByTestId('port-kubernetes-in-image')).toBeVisible();
  await expect(canvas.getByText('연결 1', { exact: true }).first()).toBeVisible();
  await lab.getByRole('button', { name: 'Kubernetes 펼치기', exact: true }).click();
  const edge = canvas.getByRole('group', { name: '출발 → Service 요청', exact: true });
  const edgeLayer = await edge.evaluate((element) =>
    Number(getComputedStyle(element.closest('svg')!).zIndex),
  );
  const nodeLayer = await canvas
    .getByTestId('node-image')
    .evaluate((element) => Number(getComputedStyle(element.closest('.react-flow__node')!).zIndex));
  expect(edgeLayer).toBeGreaterThan(nodeLayer);
  const point = await edge
    .locator('path.react-flow__edge-path')
    .evaluate((path: SVGPathElement) => {
      const point = path.getPointAtLength(path.getTotalLength() * 0.18);
      const matrix = path.getScreenCTM()!;
      const screen = new DOMPoint(point.x, point.y).matrixTransform(matrix);
      return { x: screen.x, y: screen.y };
    });
  await page.mouse.click(point.x, point.y, { button: 'right' });
  await lab.getByRole('button', { name: '연결 삭제', exact: true }).click();
  await expect(edge).toHaveCount(0);
  await lab.getByRole('button', { name: '실행 취소', exact: true }).click();
  await expect(edge).toHaveCount(1);
});

test('영역 크기 조절은 한 번의 편집으로 되돌릴 수 있다', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const lab = await openLab(page);
  const area = lab.getByTestId('system-docker');
  await area.getByText('Docker', { exact: true }).click();
  const grip = lab.getByTestId('resize-docker');
  await expect(grip).toBeVisible();
  const old = (await area.boundingBox())!;
  const origin = (await grip.boundingBox())!;
  await page.mouse.move(origin.x + origin.width / 2, origin.y + origin.height / 2);
  await page.mouse.down();
  await page.mouse.move(origin.x + 65, origin.y + 30, { steps: 8 });
  await expect
    .poll(async () => (await lab.getByTestId('resize-preview-docker').boundingBox())?.width ?? 0)
    .toBeGreaterThan(old.width + 30);
  await page.mouse.up();
  await expect.poll(async () => (await area.boundingBox())!.width).toBeGreaterThan(old.width + 30);
  const expanded = (await area.boundingBox())!.width;
  await lab.getByRole('button', { name: '크기 정리' }).click();
  await expect.poll(async () => (await area.boundingBox())!.width).toBeLessThan(expanded - 30);
  await lab.getByRole('button', { name: '실행 취소', exact: true }).click();
  await expect
    .poll(async () => Math.round((await area.boundingBox())!.width))
    .toBe(Math.round(expanded));
  await lab.getByRole('button', { name: '실행 취소', exact: true }).click();
  await expect
    .poll(async () => Math.round((await area.boundingBox())!.width))
    .toBe(Math.round(old.width));
  await expect(lab.getByRole('button', { name: '실행 취소', exact: true })).toBeDisabled();
  expect(errors).toEqual([]);
});

test('손상된 시범 저장만 보호하고 초기화한다', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('blockml:system-lab:week2-workflow:v1', '{broken');
    localStorage.setItem('flow-lab:playground:v1', '{"version":1,"resources":[],"edges":[]}');
  });
  const lab = await openLab(page);
  const keys = await page.evaluate(() => ({
    pilot: localStorage.getItem('blockml:system-lab:week2-workflow:v1'),
    playground: localStorage.getItem('flow-lab:playground:v1'),
  }));
  await expect(lab.getByRole('alert')).toContainText('원본을 보존');
  await lab.getByRole('button', { name: '내부 일괄 실행', exact: true }).click();
  expect(
    await page.evaluate(() => localStorage.getItem('blockml:system-lab:week2-workflow:v1')),
  ).toBe(keys.pilot);
  page.once('dialog', (dialog) => dialog.accept());
  await lab.getByRole('button', { name: '저장 초기화', exact: true }).click();
  await expect(lab.getByRole('alert')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('flow-lab:playground:v1'))).toBe(
    keys.playground,
  );
});

test('생성 도구가 캔버스 위에 있고 전체 화면에서 실습에 집중한다', async ({ page }) => {
  await page.setViewportSize({ width: 1536, height: 695 });
  const lab = await openLab(page);
  const canvas = lab.getByTestId('system-lab-canvas');
  const tool = lab.getByRole('button', { name: 'EC2 추가' });
  await expect(tool).toBeInViewport({ ratio: 1 });
  await expect(lab.getByTestId('node-pod-b')).toBeInViewport({ ratio: 0.99 });
  const height = (await canvas.boundingBox())!.height;
  expect((await tool.boundingBox())!.y).toBeLessThan((await canvas.boundingBox())!.y);
  await lab.getByRole('button', { name: '실습 전체 화면' }).click();
  await expect(lab.getByRole('button', { name: '전체 화면 나가기' })).toBeVisible();
  await expect.poll(async () => (await canvas.boundingBox())!.height).toBeGreaterThan(height + 140);
  expect((await lab.boundingBox())!.y).toBe(0);
  await expect(lab.getByTestId('node-pod-b')).toBeInViewport({ ratio: 0.99 });
  await page.keyboard.press('Escape');
  await expect(lab.getByRole('button', { name: '실습 전체 화면' })).toBeVisible();
});

for (const width of [1440, 1024, 390]) {
  test(width + 'px에서 캔버스와 패널이 겹치지 않는다', async ({ page }) => {
    await page.setViewportSize({ width, height: 960 });
    const lab = await openLab(page);
    const canvas = lab.getByTestId('system-lab-canvas');
    const panel = lab.getByLabel('항목 설정', { exact: true });
    await expect(canvas).toBeVisible();
    const c = (await canvas.boundingBox())!;
    const p = (await panel.boundingBox())!;
    const practice = (await page.getByTestId('lesson-practice').boundingBox())!;
    const labBounds = (await lab.boundingBox())!;
    expect(labBounds.y + labBounds.height).toBeGreaterThanOrEqual(practice.y + practice.height - 1);
    await expect(lab.getByRole('button', { name: '실습 힌트' })).toHaveCount(0);
    await expect(lab.getByText(/이미지는 Kubernetes.*도착에 연결하세요/)).toBeVisible();
    expect(c.x + c.width).toBeLessThanOrEqual(width + 1);
    expect(p.x >= c.x + c.width - 1 || p.y >= c.y + c.height - 1).toBe(true);
    await page.screenshot({ path: 'test-results/system-lab-' + width + '.png' });
    await page.evaluate(() => localStorage.setItem('pilot-test-dark', '1'));
    await page.reload();
    await page.getByRole('button', { name: '실습 영역 확장', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.screenshot({ path: 'test-results/system-lab-dark-' + width + '.png' });
  });
}
