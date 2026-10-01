// T061: the combat log in the terminal on the seeded fight of combat.spec.ts (Typo + Context
// Drift). Checked after Skip, so every line is listed and nothing moves. Text and roles only.
import { expect, test } from '@playwright/test';

const LINE = /^\[\d\d:\d\d\.\d{3}\] [^:]+( -> [^:]+)?: \S/;

test('Combat log: why lines, filters, virtual rows, click and keyboard seeking', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/');
  await page.getByLabel('Seed').fill('K7Q2-M9XA');
  await page.getByRole('button', { name: 'New run' }).click();
  await page.getByTestId('harness-terminal_purist').click();
  await page.getByRole('button', { name: 'Start run' }).click();
  await page
    .getByTestId(/^prompt-/)
    .first()
    .click();
  await page.getByTestId('node-p1-r1-c0').click();
  const fight = page.getByRole('region', { name: 'Fight' });
  await fight.getByRole('button', { name: 'Skip' }).click();
  await expect(page.getByTestId('result')).toBeVisible();

  // The log lives in the terminal: one line per event, virtualised (far fewer rows than lines).
  const log = page.getByRole('region', { name: 'Terminal' }).getByTestId('combat-log');
  const count = log.locator('.log__count');
  const rows = log.getByRole('option');
  await expect(count).toHaveText(/^\d+ lines$/);
  const total = Number((await count.textContent())?.split(' ')[0]);
  expect(total).toBeGreaterThan(100);
  const rendered = await rows.count();
  expect(rendered).toBeGreaterThan(0);
  expect(rendered).toBeLessThan(Math.min(200, total));
  for (const text of await rows.allTextContents()) expect(text).toMatch(LINE);

  // A hit names its modifiers with their values.
  const hit = rows.filter({ hasText: / dmg \(/ }).last();
  await expect(hit).toHaveText(/^\[[\d:.]+\] \w+ v\d -> [^:]+: \d+ dmg \(.*[+-]\d+%.*\)$/);

  // Filters: each shows only its kinds and fewer lines than All.
  const only = async (name: string, pattern: RegExp) => {
    await log.getByRole('button', { name }).click();
    await expect(log.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'true');
    await expect(rows.first()).toBeVisible();
    for (const text of await rows.allTextContents()) expect(text).toMatch(pattern);
    expect(Number((await count.textContent())?.split(' ')[0])).toBeLessThan(total);
  };
  await only('Damage', /: (\d+ dmg|\+\d+ Guardrails|\+\d+ heal|armor|resolved by)/);
  await only('Context', /: ([+-]\d+k |zone |.*compact)/);
  await only('Enemies', /\] (Typo|Context Drift|system -> (Typo|Context Drift))/);
  await log.getByRole('button', { name: 'All' }).click();
  await expect(count).toHaveText(`${total} lines`);

  // Clicking a line seeks to its time, pauses and highlights its source and target.
  const time = (await hit.textContent())?.slice(1, 10) ?? '';
  const src = (await hit.locator('.log__src').textContent())?.split(' ')[0] ?? '';
  await hit.click();
  await expect(hit).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByTestId('clock')).toContainText(time);
  await expect(fight.getByRole('button', { name: 'Pause' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByTestId('result')).toHaveCount(0);
  await expect(fight.locator('.is-picked')).toHaveCount(2);
  await expect(fight.locator('.tool.is-picked .tool__name')).toHaveText(src);
  await expect(fight.locator('.card--enemy.is-picked')).toHaveCount(1);

  // Keyboard: the list keeps focus; arrows step line by line, Home jumps to the first line.
  const listbox = log.getByRole('listbox');
  await expect(listbox).toBeFocused();
  const before = await hit.locator('xpath=preceding-sibling::*[1]').textContent();
  await page.keyboard.press('ArrowUp');
  await expect(log.locator('[aria-selected="true"]')).toHaveText(before ?? '');
  await page.keyboard.press('Home');
  await expect(log.locator('[aria-selected="true"]')).toContainText('fight starts');
  await expect(page.getByTestId('clock')).toContainText('00:00.000');
  await expect(listbox).toHaveAttribute('aria-activedescendant', 'log-0');

  // Resuming clears the highlight; Skip ends the fight again.
  await fight.getByRole('button', { name: '4x' }).click();
  await expect(fight.locator('.is-picked')).toHaveCount(0);
  await fight.getByRole('button', { name: 'Skip' }).click();
  await expect(page.getByTestId('result')).toBeVisible();
  expect(errors).toEqual([]);
});
