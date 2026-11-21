import { expect, test, type Page } from '@playwright/test';
import { applyCommand } from '../../src/systemLab/commands';
import { definition, starterTasks } from '../../src/systemLab/model';

async function openLab(page: Page, lessonId = 'week2-workflow') {
  await page.addInitScript(() => {
    localStorage.setItem(
      'blockml:preferences:v1',
      JSON.stringify({ theme: 'light', tour: 'skipped' }),
    );
  });
  await page.goto('/#/learn/' + lessonId);
  await page.getByRole('button', { name: '실습 영역 확장', exact: true }).click();
  return page.getByTestId('system-lab');
}

test('실패 후 수동 요청, 오류와 fallback 재시도, 평문 표시, 작은 화면', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/chat/ai/hint', async (route) => {
    calls++;
    const body = route.request().postDataJSON();
    expect(body.lessonId).toBe('week2-workflow');
    expect(body.ruleCheck.success).toBe(false);
    expect(body.ruleCheck.first_failure).toContain('응답 0 / 10건');
    expect(body.nodes.find((node: { id: string }) => node.id === 'pod-a').parent).toBe(
      'kubernetes',
    );
    expect(body.nodes[0].position).toBeUndefined();
    expect(body.edges.some((edge: { kind: string }) => edge.kind === 'service-route')).toBe(true);
    if (calls === 1) await route.fulfill({ status: 503, json: {} });
    else if (calls === 2)
      await route.fulfill({
        json: {
          status: 'fallback',
          conecpt: '지금은 힌트를 만들지 못했어요.',
          hint: '실행 결과를 확인할까요?',
        },
      });
    else
      await route.fulfill({
        json: {
          status: 'ok',
          conecpt: 'Pod는 모델 파일을 받은 뒤 요청을 처리합니다. <script>실행 안 됨</script>',
          hint: '모델 입력에 선을 연결했나요?',
        },
      });
  });
  const lab = await openLab(page);
  await lab.getByRole('button', { name: '실행 결과 펼치기' }).click();
  const panel = lab.getByRole('region', { name: '실습 AI 조언', exact: true });
  await expect(panel.getByRole('button', { name: 'AI 조언 받기', exact: true })).toBeDisabled();
  await lab.getByRole('button', { name: '실습 실행', exact: true }).click();
  await expect(panel.getByRole('button', { name: 'AI 조언 받기', exact: true })).toBeEnabled();
  expect(calls).toBe(0);
  await panel.getByRole('button').click();
  await expect(panel.getByRole('alert')).toContainText('아직 준비되지');
  await panel.getByRole('button', { name: 'AI 조언 다시 받기' }).click();
  await expect(panel.getByLabel('AI 조언 결과')).toContainText('지금은 힌트를 만들지 못했어요.');
  await panel.getByRole('button', { name: 'AI 조언 다시 받기' }).click();
  await expect(panel.getByLabel('AI 조언 결과')).toContainText('<script>실행 안 됨</script>');
  await expect(panel.locator('script')).toHaveCount(0);
  await expect(panel.getByRole('button', { name: 'AI 조언 받음' })).toBeDisabled();
  await lab.getByRole('button', { name: '실행 결과 접기' }).click();
  await lab.getByRole('button', { name: '실행 결과 펼치기' }).click();
  await expect(panel.getByLabel('AI 조언 결과')).toBeVisible();
  expect(calls).toBe(3);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel('화면 테마', { exact: true }).selectOption('dark');
  await expect(panel).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await panel.screenshot({ path: 'test-results/system-lab-hint-mobile-dark.png' });
});

test('요청 중 구성 변경과 재실행은 이전 조언을 폐기한다', async ({ page }) => {
  let release = () => {};
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  let finish = () => {};
  const finished = new Promise<void>((resolve) => {
    finish = resolve;
  });
  let calls = 0;
  const selectors: string[] = [];
  await page.route('**/api/chat/ai/hint', async (route) => {
    calls++;
    const first = calls === 1;
    selectors.push(
      route
        .request()
        .postDataJSON()
        .nodes.find((node: { id: string }) => node.id === 'kubernetes').kubernetes.serviceSelector,
    );
    if (first) await pending;
    await route
      .fulfill({
        json: {
          status: 'ok',
          conecpt: first ? '오래된 실행의 조언' : '새 실행의 조언',
          hint: '입력을 확인할까요?',
        },
      })
      .catch(() => {});
    if (first) finish();
  });
  const lab = await openLab(page);
  const panel = lab.getByRole('region', { name: '실습 AI 조언', exact: true });
  await lab.getByRole('button', { name: '실습 실행', exact: true }).click();
  await panel.getByRole('button', { name: 'AI 조언 받기', exact: true }).click();
  await expect(panel.getByRole('button', { name: 'AI 조언 요청 중…' })).toBeDisabled();
  await lab.getByLabel('캔버스에서 항목 찾기').selectOption('kubernetes');
  const selector = lab.getByLabel('대상 Pod 라벨');
  await selector.fill('different');
  await selector.blur();
  await expect(panel.getByRole('button', { name: 'AI 조언 받기', exact: true })).toBeDisabled();
  release();
  await finished;
  await expect(panel.getByText('오래된 실행의 조언')).toHaveCount(0);
  await lab.getByRole('button', { name: '실습 실행', exact: true }).click();
  await panel.getByRole('button', { name: 'AI 조언 받기', exact: true }).click();
  await expect(panel.getByText('새 실행의 조언')).toBeVisible();
  expect(selectors).toEqual(['review', 'different']);
  await lab.getByRole('button', { name: '실습 실행', exact: true }).click();
  await expect(panel.getByLabel('AI 조언 결과')).toHaveCount(0);
  await expect(panel.getByRole('button', { name: 'AI 조언 받기', exact: true })).toBeEnabled();
  expect(calls).toBe(2);
});

test('성공 실행은 AI 호출을 하지 않는다', async ({ page }) => {
  let graph = definition.initial();
  for (const edge of starterTasks) graph = applyCommand(graph, { type: 'connect', edge });
  await page.addInitScript((graph) => {
    localStorage.setItem(
      'blockml:system-lab:week2-workflow:v1',
      JSON.stringify({ version: 1, graph, quiz: false, proof: null }),
    );
  }, graph);
  let calls = 0;
  await page.route('**/api/chat/ai/hint', async (route) => {
    calls++;
    await route.abort();
  });
  const lab = await openLab(page);
  await lab.getByRole('button', { name: '실습 실행', exact: true }).click();
  const panel = lab.getByRole('region', { name: '실습 AI 조언', exact: true });
  await expect(panel).toContainText('현재 구성은 실행에 성공했습니다');
  await expect(panel.getByRole('button')).toBeDisabled();
  expect(calls).toBe(0);
});

test('다른 단원의 실습도 실패 후 자신의 강의 ID로 조언을 요청한다', async ({ page }) => {
  let lessonId = '';
  await page.route('**/api/chat/ai/hint', async (route) => {
    const body = route.request().postDataJSON();
    lessonId = body.lessonId;
    expect(body.ruleCheck.success).toBe(false);
    expect(body.nodes.length).toBeGreaterThan(0);
    expect(body.settings.metrics).toBeDefined();
    await route.fulfill({
      json: {
        status: 'ok',
        conecpt: '공급 병목은 어디서 생길까요.',
        hint: '배치 준비 설정을 확인했나요?',
      },
    });
  });
  const lab = await openLab(page, 'week3-workflow');
  await lab.getByRole('button', { name: '실행 결과 펼치기' }).click();
  await lab.getByRole('button', { name: '실습 실행', exact: true }).click();
  const panel = lab.getByRole('region', { name: '실습 AI 조언', exact: true });
  await expect(panel.getByRole('button', { name: 'AI 조언 받기', exact: true })).toBeEnabled();
  await panel.getByRole('button', { name: 'AI 조언 받기', exact: true }).click();
  await expect(panel.getByLabel('AI 조언 결과')).toContainText('배치 준비 설정을 확인했나요?');
  expect(lessonId).toBe('week3-workflow');
});

test('실행 도중과 중단 상태에서는 조언을 요청할 수 없다', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const lab = await openLab(page);
  await lab.getByRole('button', { name: '실행 결과 펼치기' }).click();
  await lab.getByRole('button', { name: '실습 실행', exact: true }).click();
  const panel = lab.getByRole('region', { name: '실습 AI 조언', exact: true });
  await expect(panel.getByRole('button')).toBeDisabled();
  await lab.getByRole('button', { name: '중단', exact: true }).click();
  await expect(panel).toContainText('실행이 중단되었습니다');
  await expect(panel.getByRole('button')).toBeDisabled();
});
