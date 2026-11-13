import { test, expect } from '@playwright/test';
import { units as chapters } from '../../src/content/course';
import { readLessons } from './readCurriculum';
import { resourceDefaults } from '../../src/console/resources';
const pg = 'flow-lab:playground:v1';
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'blockml:preferences:v1',
      JSON.stringify({ theme: 'light', tour: 'skipped' }),
    ),
  );
});
test('전체 과정·단원 필터·검색', async ({ page }) => {
  await page.goto('/');
  const lessons = await readLessons(page);
  await expect(page.locator('[data-testid^="lesson-card-"]')).toHaveCount(lessons.length);
  for (const chapter of chapters) {
    await page.getByRole('button', { name: `${chapter.week}단원`, exact: true }).click();
    await expect(page.locator('[data-testid^="lesson-card-"]')).toHaveCount(
      lessons.filter((l) => l.week === chapter.week).length,
    );
  }
  await page.getByRole('button', { name: '전체 과정', exact: true }).click();
  await page.getByLabel('강의 검색').fill('HNSW');
  await expect(page.getByTestId('lesson-card-ann-hnsw')).toBeVisible();
});
test('모든 강의 주소·본문·지도·출처가 열리고 오류가 없다', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  const lessons = await readLessons(page);
  for (const lesson of lessons) {
    await page.goto(`/#/learn/${lesson.id}`);
    await expect(page.getByRole('heading', { name: lesson.title, exact: true })).toBeVisible();
    await expect(page.getByLabel('전체 워크플로우 지도')).toBeVisible();
    if (lesson.id === 'mlops-overview')
      await page.screenshot({ path: 'test-results/overview-desktop.png', fullPage: true });
    await expect(page.locator('a[href*="notion.so"]').first()).toHaveAttribute('href', /notion.so/);
  }
  expect(errors).toEqual([]);
});
test('읽기 전용 강의도 이해 확인으로 완료하고 새로고침 후 복원한다', async ({ page }) => {
  await page.goto('/#/learn/mlops-overview');
  const quiz = page.getByLabel('이해 확인', { exact: true });
  await expect(page.getByRole('button', { name: '다음 강의', exact: true })).toBeDisabled();
  await quiz.getByRole('radio').nth(1).check();
  await expect(page.getByRole('button', { name: '다음 강의', exact: true })).toBeDisabled();
  await quiz.getByRole('radio').nth(0).check();
  await expect(quiz.getByRole('status')).toHaveCount(0);
  await quiz.getByRole('button', { name: '정답 확인하기', exact: true }).click();
  await expect(page).toHaveURL(/mlops-overview$/);
  await expect(page.getByRole('link', { name: '다음 강의', exact: true })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('blockml:learning:v5')))
    .toContain('mlops-overview');
  await page.reload();
  await expect(page.getByRole('link', { name: '다음 강의', exact: true })).toBeVisible();
});
test('선택 활동을 조작하지 않고 이해 확인을 완료한다', async ({ page }) => {
  await page.goto('/#/learn/cpu-gpu');
  await expect(page.getByTestId('activity-run')).toBeHidden();
  const lesson = (await readLessons(page)).find((l) => l.id === 'cpu-gpu')!;
  const quiz = page.getByLabel('이해 확인', { exact: true });
  await quiz.getByRole('radio').nth(lesson.assessment!.correct).check();
  await expect(quiz.getByRole('status')).toHaveCount(0);
  await quiz.getByRole('button', { name: '정답 확인하기', exact: true }).click();
  await expect(page).toHaveURL(/cpu-gpu$/);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('blockml:learning:v5') ?? '{}').lessons?.['cpu-gpu']
            ?.completed,
      ),
    )
    .toBe(true);
  await page.goto('/#/learn/cpu-gpu');
  await expect(page.getByRole('link', { name: '다음 강의', exact: true })).toBeVisible();
  await page.getByText('선택 활동 · 결과를 예측하고 비교하기', { exact: true }).click();
  await expect(page.getByTestId('activity-run')).toBeVisible();
});
test('이전 기록·Playground를 보존하고 새 평가로 승격하지 않는다', async ({ page }) => {
  const raw = JSON.stringify({ version: 4, lessons: { 'cpu-gpu': { completed: true } } });
  await page.addInitScript((raw) => {
    localStorage.setItem('blockml:learning:v4', raw);
    localStorage.setItem('flow-lab:playground:v1', 'previous');
  }, raw);
  await page.goto('/#/learn/cpu-gpu');
  await expect(page.getByRole('button', { name: '다음 강의', exact: true })).toBeDisabled();
  expect(await page.evaluate(() => localStorage.getItem('blockml:learning:v4'))).toBe(raw);
  expect(await page.evaluate(() => localStorage.getItem('flow-lab:playground:v1'))).toBe(
    'previous',
  );
});
test('노드 실습은 본문부터 열리고 단계별 편집을 제공한다', async ({ page }) => {
  await page.goto('/#/learn/rag-workflow');
  await expect(page.getByTestId('weekly-canvas')).toBeHidden();
  await page.getByRole('button', { name: '실습 영역 확장', exact: true }).click();
  await page.getByRole('button', { name: '1. 예시 흐름 추적' }).click();
  await expect(
    page.getByTestId('weekly-canvas').getByText('질문 임베딩', { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole('button', { name: '연결 검사', exact: true }).click();
  await expect(
    page.getByText('포트 연결 조건을 충족했습니다. 실행 조건도 확인하세요.', { exact: true }),
  ).toBeVisible();
});
test('모바일 읽기·목차·지도 이동', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/learn/mlops-overview');
  await page.getByRole('button', { name: '강의 목차 열기' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/overview-mobile.png', fullPage: true });
  await page.getByLabel('전체 워크플로우 지도').getByRole('link').first().click();
  await expect(page).toHaveURL(/storage-compare/);
});
test('손상 저장은 원본을 보존하며 학습을 허용한다', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('blockml:learning:v5', 'broken'));
  await page.goto('/#/learn/mlops-overview');
  await expect(page.getByRole('alert')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('blockml:learning:v5'))).toBe('broken');
});
test('이전 AWS Playground 그래프 복원과 잘못된 주소', async ({ page }) => {
  const data = {
    version: 1,
    resources: [
      { id: 'old', position: { x: 10, y: 20 }, config: resourceDefaults('s3', '이전 데이터') },
    ],
    edges: [],
  };
  await page.addInitScript(({ key, data }) => localStorage.setItem(key, JSON.stringify(data)), {
    key: pg,
    data,
  });
  await page.goto('/#/playground');
  await expect(page.getByTestId('resource-old')).toContainText('이전 데이터');
  await page.getByRole('button', { name: '이전 데이터 노드 설정', exact: true }).click();
  const nodeName = page.getByLabel('노드 이름', { exact: true });
  await expect(nodeName).toHaveAttribute('maxlength', '20');
  await nodeName.fill('보존된 노드');
  await expect(nodeName).toHaveAccessibleDescription('6 / 20자');
  await page.getByRole('button', { name: '설정 저장', exact: true }).click();
  await expect(page.getByTestId('resource-old')).toContainText('보존된 노드');
  await page.goto('/#/learn/no-such-lesson');
  await expect(page.getByRole('heading', { name: '404', exact: true })).toBeVisible();
  await expect(page.getByText('강의를 찾을 수 없습니다.', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: '학습 과정으로 돌아가기' }).click();
  await expect(page).toHaveURL(/#\/learn$/);
});

test('강의 화면을 불러오지 못하면 500을 표시하고 다시 열 수 있다', async ({ page }) => {
  const lessonModule = '**/src/learning/LessonPage.tsx*';
  await page.route(lessonModule, (route) => route.abort());
  await page.goto('/#/learn/week2-workflow');
  await expect(page.getByRole('heading', { name: '500', exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('화면을 불러오는 중 문제가 발생했습니다.');
  await page.unroute(lessonModule);
  await page.getByRole('button', { name: '다시 시도' }).click();
  await expect(page.getByRole('heading', { name: '500', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '실습 영역 확장' })).toBeVisible();
});

test('라우터가 기본 주소, Playground, 404와 브라우저 뒤로 가기를 처리한다', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('BlockML | MLOps 학습 과정');
  await page.getByRole('link', { name: 'Playground', exact: true }).click();
  await expect(page).toHaveURL(/#\/playground$/);
  await expect(page).toHaveTitle('Playground | BlockML');
  await page.goBack();
  await expect(page).toHaveTitle('BlockML | MLOps 학습 과정');
  await page.goto('/#/unknown');
  await expect(page.getByRole('heading', { name: '404', exact: true })).toBeVisible();
  await expect(page.getByText('페이지를 찾을 수 없습니다.', { exact: true })).toBeVisible();
});

test('오류 화면에 응답 상태와 설명을 표시하고 다시 시도할 수 있다', async ({ page }) => {
  const module = '**/src/learning/LessonPage.tsx*';
  await page.route(module, (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: "throw Object.assign(new Error('Unavailable'), { isAxiosError: true, response: { status: 503 } });",
    }),
  );
  await page.goto('/#/learn/week2-workflow');
  await expect(page.getByRole('heading', { name: '503', exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('서비스를 일시적으로 이용할 수 없습니다.');
  await page.unroute(module);
  await page.getByRole('button', { name: '다시 시도' }).click();
  await expect(page.getByRole('button', { name: '실습 영역 확장' })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('combobox', { name: '화면 테마' }).selectOption('dark');
  await page.goto('/#/invalid-page');
  await expect(page.getByRole('heading', { name: '404', exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.screenshot({ path: 'test-results/error-page-mobile.png' });
});

test('통합된 0단원은 전체 흐름·EC2·S3만 순서대로 표시한다', async ({ page }) => {
  await page.goto('/#/learn');
  await readLessons(page);
  await page.getByRole('button', { name: '0단원', exact: true }).click();
  await expect(page.locator('[data-testid^="lesson-card-"]')).toHaveCount(3);
  expect(
    await page
      .locator('[data-testid^="lesson-card-"]')
      .evaluateAll((cards) => cards.map((card) => card.getAttribute('data-testid'))),
  ).toEqual(['lesson-card-mlops-overview', 'lesson-card-ec2-compute', 'lesson-card-s3-objects']);
  await page.goto('/#/learn/ec2-compute');
  await expect(page.getByText('전체 지도 + 0~9단원', { exact: true })).toBeVisible();
  const foundation = page.getByRole('navigation', { name: '강의 목차' }).locator('details[open]');
  await expect(foundation.locator('a')).toHaveCount(3);
  expect(
    await foundation
      .locator('a')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href'))),
  ).toEqual(['#/learn/mlops-overview', '#/learn/ec2-compute', '#/learn/s3-objects']);
  await expect(foundation.locator('a > span')).toHaveText(['01', '02', '03']);
});
