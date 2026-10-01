// E2E smoke test (Playwright, Chromium). One-time browser install: `npx playwright install chromium`.
// Run with `npm run e2e` (builds the app and serves it via vite preview). Asserts text and
// roles only, never pixels.
import { expect, test } from '@playwright/test';

test('the production build ignores ?sandbox: title only, no sandbox link, no console errors', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/?sandbox');
  await expect(page).toHaveTitle(/Loop Engineer/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Loop Engineer');
  await expect(page.getByRole('button', { name: 'New run' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Combat sandbox' })).toHaveCount(0);
  await expect(page.getByTestId('run')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Fight' })).toHaveCount(0);

  expect(errors).toEqual([]);
});
