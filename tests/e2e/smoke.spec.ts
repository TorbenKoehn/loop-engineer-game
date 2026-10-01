// E2E smoke test (Playwright, Chromium). One-time browser install: `npx playwright install chromium`.
// Run with `npm run e2e` (builds the app and serves it via vite preview). Asserts text and
// roles only, never pixels.
import { expect, test } from '@playwright/test';

test('combat sandbox loads, resolves a fight and logs no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/?sandbox');
  await expect(page).toHaveTitle(/Loop Engineer/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/loop engineer/i);

  // The sandbox auto-runs a fight; skip to its end and read the result strip.
  await page.getByRole('button', { name: /skip/i }).click();
  await expect(page.getByTestId('result')).toContainText(/Resolved|Trust lost|Timed out/);
  await expect(page.getByRole('group', { name: 'Playback' })).toBeVisible();

  expect(errors).toEqual([]);
});
