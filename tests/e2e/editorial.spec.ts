import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'blockml:preferences:v1',
      JSON.stringify({ theme: 'light', tour: 'skipped' }),
    ),
  );
});

for (const width of [1600, 390]) {
  test(`도입 이미지와 전체 과정을 정리한 본문이 읽힌다 ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    for (const id of ['ec2-compute', 'dvc-restore', 'model-drift', 's3-objects']) {
      await page.goto(`/#/learn/${id}`);
      const article = page.getByTestId('lesson-reading');
      const figure = article.locator('figure').first();
      await figure.scrollIntoViewIfNeeded();
      await expect
        .poll(() => figure.locator('img').evaluate((image: HTMLImageElement) => image.naturalWidth))
        .toBeGreaterThan(0);
      expect(
        await article.evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
      ).toBe(true);
      if (id === 'model-drift')
        await figure.screenshot({ path: `test-results/editorial-intro-${width}.png` });
      const recap = article.getByRole('heading', { name: '핵심 정리', exact: true }).locator('..');
      await recap.scrollIntoViewIfNeeded();
      await expect(recap.locator('p').first()).toBeVisible();
      await expect(recap.locator('li')).toHaveCount(1);
      expect((await recap.innerText()).length).toBeGreaterThan(100);
      if (id === 'dvc-restore')
        await recap.screenshot({ path: `test-results/editorial-summary-${width}.png` });
    }
    expect(errors).toEqual([]);
  });
}
