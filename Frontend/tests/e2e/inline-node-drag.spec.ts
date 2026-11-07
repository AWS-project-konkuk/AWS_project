import { test, expect } from '@playwright/test';

for (const lessonId of ['s3-objects', 'dvc-restore', 'pv-pvc']) {
  for (const width of [1600, 390]) {
    test(`노드를 끌고 놓은 뒤 위치와 화면이 안정된다 ${lessonId} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (/not initialized|ResizeObserver loop|Maximum update depth/.test(message.text()))
          errors.push(message.text());
      });
      await page.addInitScript(() =>
        localStorage.setItem(
          'blockml:preferences:v1',
          JSON.stringify({ theme: 'light', tour: 'skipped' }),
        ),
      );
      await page.goto(`/#/learn/${lessonId}`);
      const example = page.getByTestId(`inline-node-${lessonId}`);
      await example.scrollIntoViewIfNeeded();
      await example.getByRole('button', { name: '다음 연결 따라가기', exact: true }).click();
      const trace = await example.getByRole('status').innerText();
      const node = example.locator('.react-flow__node').first();
      await expect(node).toBeVisible();
      const header = node.locator('header');
      const before = await header.boundingBox();
      expect(before).not.toBeNull();
      await page.mouse.move(before!.x + before!.width / 2, before!.y + before!.height / 2);
      await page.mouse.down();
      await page.mouse.move(
        before!.x + before!.width / 2 + 65,
        before!.y + before!.height / 2 + 45,
        {
          steps: 15,
        },
      );
      await page.mouse.up();
      await page.waitForTimeout(300);
      const transform = await node.getAttribute('style');
      await node.evaluate((element) => {
        const state = { changes: 0 };
        (window as unknown as { dragObservation: typeof state }).dragObservation = state;
        const observer = new MutationObserver(() => {
          state.changes++;
        });
        observer.observe(element, { attributes: true, attributeFilter: ['style'] });
        setTimeout(() => observer.disconnect(), 600);
      });
      await page.waitForTimeout(700);
      const count = await page.evaluate(
        () =>
          (window as unknown as { dragObservation: { changes: number } }).dragObservation.changes,
      );

      expect(errors).toEqual([]);
      expect(count).toBeLessThan(5);
      const after = await header.boundingBox();
      expect(Math.abs(after!.x - before!.x)).toBeGreaterThan(30);
      expect(await node.getAttribute('style')).toBe(transform);
      await expect(example.getByRole('status')).toHaveText(trace);
      await example.getByRole('button', { name: '직접 연결해 보기', exact: true }).click();
      await expect(example.getByLabel('예제 출발 노드')).toBeVisible();
    });
  }
}
