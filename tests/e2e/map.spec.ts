// T064: the map screen on the production build. Seed K7Q2-M9XA, Terminal Purist, first
// prompt: row 1 holds p1-r1-c0 (Typo + Context Drift), c1 and c3; the elite sits on p1-r5-c1.
// Text, roles, attributes and computed styles only, never pixels.
import { expect, type Page, test } from '@playwright/test';

async function toMap(page: Page): Promise<string[]> {
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
  await expect(page.getByRole('heading', { name: 'Route to the release' })).toBeVisible();
  return errors;
}

const node = (page: Page, id: string) => page.getByTestId(`node-${id}`);

/** Skips the fight, continues and skips the reward pick: back on the map. */
async function finishFight(page: Page): Promise<void> {
  const fight = page.getByRole('region', { name: 'Fight' });
  await expect(fight).toBeVisible();
  await fight.getByRole('button', { name: 'Skip' }).click();
  await page.getByTestId('result').getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: /^Skip \(/ }).click();
  await expect(page.getByRole('heading', { name: 'Route to the release' })).toBeVisible();
}

test('the map draws the DAG bottom to top with box-drawing links, icons and aria labels', async ({
  page,
}) => {
  const errors = await toMap(page);
  const map = page.getByRole('group', { name: 'Map nodes' });

  // Bottom to top: row 1 below row 7, the boss on top.
  const top = async (id: string) => (await node(page, id).boundingBox())?.y ?? Number.NaN;
  expect(await top('p1-r1-c0')).toBeGreaterThan(await top('p1-r4-c0'));
  expect(await top('p1-r4-c0')).toBeGreaterThan(await top('p1-r7-c0'));
  expect(await top('p1-r7-c0')).toBeGreaterThan(await top('p1-boss'));

  // One ASCII icon and an aria label per node type, with encounter, row and state.
  for (const [id, icon, label] of [
    ['p1-r1-c0', '>_', 'Task: Typo + Context Drift, row 1, reachable'],
    ['p1-r2-c2', '?', 'Standup, row 2, ahead'],
    ['p1-r4-c0', '[]', 'Free Tier, row 4, ahead'],
    ['p1-r5-c1', '!!', 'Critical Bug, row 5, ahead'],
    ['p1-r5-c4', '$', 'Package Registry, row 5, ahead'],
    ['p1-r7-c0', 'zz', 'Idle Cycle, row 7, ahead'],
    ['p1-boss', '##', 'Release: Legacy Monolith, release, ahead'],
  ] as const) {
    await expect(node(page, id)).toHaveText(icon);
    await expect(node(page, id)).toHaveAttribute('aria-label', label);
  }

  // Links are box-drawing glyphs: verticals, diagonals and the bus into the boss.
  const links = (await map.locator('.link').allTextContents()).join('');
  expect(links).toMatch(/│/);
  expect(links).toMatch(/[╱╲]/);
  expect(links).toMatch(/[┌┐┴┼├┤└┘]/);
  expect(links.replace(/[─│╱╲┌┐└┘├┤┬┴┼]/g, '')).toBe('');

  // The legend names every icon.
  const legend = page.getByRole('list', { name: 'Legend' });
  for (const name of ['Task', 'Critical Bug', 'Package Registry', 'Standup', 'Idle Cycle']) {
    await expect(legend).toContainText(name);
  }
  await expect(legend).toContainText('Free Tier');
  await expect(legend).toContainText('Release');
  expect(errors).toEqual([]);
});

test('reachable nodes pulse, focus and hover preview, Enter and click travel, breadcrumb row', async ({
  page,
}) => {
  const errors = await toMap(page);
  const preview = page.getByTestId('map-preview');
  const crumbs = page.getByRole('navigation', { name: 'Location' });
  await expect(crumbs).toHaveText('phase-1/implement');

  // Initial focus on the first reachable node; reachable nodes pulse, others do not.
  await expect(node(page, 'p1-r1-c0')).toBeFocused();
  for (const id of ['p1-r1-c0', 'p1-r1-c1', 'p1-r1-c3']) {
    await expect(node(page, id)).toHaveCSS('animation-name', 'node-pulse');
    await expect(node(page, id)).toHaveAttribute('aria-disabled', 'false');
  }
  await expect(node(page, 'p1-r2-c0')).toHaveCSS('animation-name', 'none');
  await expect(node(page, 'p1-r2-c0')).toHaveAttribute('aria-disabled', 'true');

  // Focus shows the encounter; hover too, and an elite shows only "Critical Bug".
  await expect(preview.getByRole('heading')).toHaveText('Task: Typo + Context Drift');
  await expect(preview).toContainText('Enter or click to travel');
  await node(page, 'p1-r5-c1').hover();
  await expect(preview.getByRole('heading')).toHaveText('Critical Bug');
  await expect(preview).not.toContainText('Enter or click to travel');
  await node(page, 'p1-boss').hover();
  await expect(preview.getByRole('heading')).toHaveText('Release: Legacy Monolith');
  await page.mouse.move(0, 0);

  // Arrow keys move between nodes; the preview follows focus. Unreachable nodes do not travel.
  await page.keyboard.press('ArrowRight');
  await expect(node(page, 'p1-r1-c1')).toBeFocused();
  await expect(preview.getByRole('heading')).toHaveText('Task: Typo + Typo + Typo');
  await page.keyboard.press('ArrowUp');
  await expect(node(page, 'p1-r2-c0')).toBeFocused();
  await page.keyboard.press('Enter');
  await node(page, 'p1-r2-c0').click({ force: true });
  await expect(page.getByRole('region', { name: 'Fight' })).toHaveCount(0);

  // Enter on a reachable node travels; back on the map the current node is red.
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowLeft');
  await expect(node(page, 'p1-r1-c0')).toBeFocused();
  await page.keyboard.press('Enter');
  await finishFight(page);
  await expect(crumbs).toHaveText('phase-1/implement › row 1');
  const here = node(page, 'p1-r1-c0');
  await expect(here).toHaveAttribute('aria-current', 'location');
  await expect(here).toHaveAttribute('aria-label', /you are here$/);
  await expect(here).toHaveCSS('background-color', 'rgb(217, 30, 54)');
  await expect(node(page, 'p1-r1-c3')).toHaveAttribute('aria-label', /out of reach$/);
  await expect(node(page, 'p1-r2-c0')).toBeFocused();
  await expect(node(page, 'p1-r2-c0')).toHaveCSS('animation-name', 'node-pulse');

  // Clicking a reachable node travels too.
  await node(page, 'p1-r2-c0').click();
  await finishFight(page);
  await expect(crumbs).toHaveText('phase-1/implement › row 2');
  await expect(node(page, 'p1-r1-c0')).toHaveAttribute('aria-label', /visited$/);

  // Abandon stays available on the map and ends the run.
  await page.getByRole('button', { name: 'Abandon run' }).click();
  await expect(page.getByRole('heading', { name: 'Route to the release' })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('reduced motion: reachable nodes keep a static ring instead of the pulse', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await toMap(page);
  const first = node(page, 'p1-r1-c0');
  await expect(first).toHaveCSS('animation-name', 'none');
  await expect(first).toHaveCSS('transition-duration', '0s');
  await expect(first).not.toHaveCSS('box-shadow', 'none');
});
