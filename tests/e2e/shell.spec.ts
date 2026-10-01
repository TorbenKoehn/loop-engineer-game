// T055 walking skeleton: a run with a fixed seed lives in the store, renders in the IDE shell
// and takes actions through the run reducer. Text and roles only, never pixels.
import { expect, test } from '@playwright/test';

test('a run with a fixed seed shows the shell and the status bar from RunState', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/');
  await expect(page).toHaveTitle(/Loop Engineer/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Loop Engineer');
  await page.getByLabel('Seed').fill('K7Q2-M9XA');
  await page.getByRole('button', { name: 'New run' }).click();
  await page.getByTestId('harness-terminal_purist').click();
  await page.getByRole('button', { name: 'Start run' }).click();

  await expect(page.getByRole('banner')).toContainText('phase-1/implement');
  await expect(page.getByRole('heading', { name: 'Pick a system prompt' })).toBeVisible();
  await expect(page.getByRole('banner')).toContainText('seed K7Q2-M9XA');
  await expect(page.getByRole('complementary', { name: 'Explorer' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Terminal' })).toBeVisible();
  const status = page.getByTestId('status-bar');
  await expect(status).toContainText('Trust 80/80');
  await expect(status).toContainText('$ 10');
  await expect(status).toContainText('ctx –/60');
  await expect(status).toContainText('P1');

  // Actions go through dispatch -> apply: picking a prompt moves the run to the map.
  await page
    .getByTestId(/^prompt-/)
    .first()
    .click();
  await expect(page.getByRole('heading', { name: 'Route to the release' })).toBeVisible();

  expect(errors).toEqual([]);
});
