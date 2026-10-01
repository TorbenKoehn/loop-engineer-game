// T070: run-end summary and AGENTS.md on the production build. IDE Companion, first prompt.
// Seed S28 loses at p1-r3-c1 (Scope Creep; with the lesson process_off the Deadline lands the
// last hit). Seed S1 ships: Release won at p1-boss. Every step is fixed by the seed.
import { expect, type Page, test } from '@playwright/test';

const newRunButton = (page: Page) => page.getByRole('button', { name: 'New run' });

async function start(page: Page, seed: string): Promise<void> {
  await page.getByLabel('Seed').fill(seed);
  await newRunButton(page).click();
  await page.getByTestId('harness-ide_companion').click();
  await page.getByRole('button', { name: 'Start run' }).click();
  await page
    .getByTestId(/^prompt-/)
    .first()
    .click();
}

/** Travels to `node` and resolves its screen the way the seed paths were recorded. */
async function visit(page: Page, node: string): Promise<void> {
  await page.getByTestId(`node-${node}`).click();
  const fight = page.getByRole('region', { name: 'Fight' });
  const screens = [
    fight,
    page.getByTestId('shop-leave'),
    page.getByTestId('standup-reply-0'),
    page.getByTestId('free-tier-take'),
    page.getByTestId('rest-heal'),
  ];
  await expect(screens.reduce((a, b) => a.or(b))).toBeVisible();
  if (!(await fight.isVisible())) {
    for (const s of screens.slice(1)) if (await s.isVisible()) await s.click();
    return;
  }
  await fight.getByRole('button', { name: 'Skip' }).click();
  await page.getByTestId('result').getByRole('button', { name: 'Continue' }).click();
  const skip = page.getByRole('button', { name: 'Skip (+6 Credits)' });
  const end = page.getByTestId('runend-title');
  await expect(skip.or(end)).toBeVisible();
  if (await skip.isVisible()) await skip.click();
}

async function lose(page: Page): Promise<void> {
  await start(page, 'S28');
  for (const node of ['p1-r1-c0', 'p1-r2-c1', 'p1-r3-c1']) await visit(page, node);
}

const noTrainingData = async (page: Page) =>
  expect(page.locator('body')).not.toContainText(/Training Data|\bTD\b/);

test('a loss shows ^C with cause, top sources, zone time, compactions and one hint', async ({
  page,
}) => {
  await page.goto('/');
  await lose(page);
  const title = page.getByTestId('runend-title');
  await expect(title).toHaveText('^C');
  await expect(title).toHaveCSS('font-size', '64px');
  await expect(title).toHaveCSS('color', 'rgb(217, 30, 54)');
  await expect(page.getByTestId('runend-cause')).toHaveText('Scope Creep');
  await expect(page.getByTestId('runend-damage').locator('li')).toHaveCount(3);
  await expect(page.getByTestId('runend-damage').locator('.tbar__label')).toHaveText([
    'Scope Creep',
    'Typo',
    'The Deadline',
  ]);
  await expect(page.getByTestId('runend-zones').locator('.tbar__label')).toHaveText([
    'Cold',
    'Focused',
    'Rot',
  ]);
  await expect(page.getByTestId('runend-rot')).toContainText('13.0 s');
  await expect(page.getByTestId('runend-compactions')).toHaveText('2');
  await expect(page.getByTestId('runend-hint').locator('[data-hint]')).toHaveAttribute(
    'data-hint',
    'default',
  );
  await noTrainingData(page);
  await expect(page.getByRole('button', { name: 'Open AGENTS.md' })).toBeFocused();
});

test('AGENTS.md: a Markdown file with frontmatter; write, then replace when full', async ({
  page,
}) => {
  await page.goto('/');
  await lose(page);
  await page.getByRole('button', { name: 'Open AGENTS.md' }).click();
  const md = page.getByTestId('agents-md');
  await expect(md.locator('li').first()).toHaveText(/^-{3}$/);
  await expect(md).toContainText('title: AGENTS.md');
  await expect(md).toContainText('lines: 0/1');
  await expect(md).toContainText('# Lessons');
  await expect(page.getByTestId(/^lesson-\d$/)).toHaveText([
    'Write down the scope.',
    'Re-read the task when lost.',
    'Reproduce before you fix.',
  ]);
  await expect(page.getByTestId('lesson-0-write')).toBeFocused();
  await noTrainingData(page);
  await page.getByTestId('lesson-0-write').click();
  await expect(newRunButton(page)).toBeVisible();

  // Second run: the lesson is kept, the Deadline lands the last hit, AGENTS.md is full.
  await lose(page);
  await expect(page.getByTestId('runend-cause')).toHaveText('The Deadline');
  await expect(page.getByTestId('runend-hint')).toContainText('prioritise upgrades');
  await page.getByRole('button', { name: 'Open AGENTS.md' }).click();
  await expect(page.getByTestId('agents-line-0')).toHaveText('- Write down the scope.');
  await expect(md).toContainText('lines: 1/1');
  await expect(page.getByTestId('lesson-1-write')).toHaveText('replace line 1');
  await page.getByTestId('lesson-1-write').click();
  await expect(newRunButton(page)).toBeVisible();
});

test('a win shows "Merged to main!"; skipping keeps AGENTS.md and returns to the title', async ({
  page,
}) => {
  await page.goto('/');
  await start(page, 'S1');
  for (const n of ['r1-c2', 'r2-c1', 'r3-c0', 'r4-c1', 'r5-c1', 'r6-c0', 'r7-c0', 'boss']) {
    await visit(page, `p1-${n}`);
  }
  const title = page.getByTestId('runend-title');
  await expect(title).toHaveText('Merged to main!');
  await expect(title).toHaveCSS('font-size', '64px');
  await expect(page.getByTestId('runend-cause')).toHaveText('none, it shipped');
  await expect(page.getByTestId('runend-damage').locator('li')).toHaveCount(3);
  await expect(page.getByTestId('runend-hint').locator('p')).toHaveCount(1);
  await noTrainingData(page);
  await page.keyboard.press('Enter');
  await expect(page.getByTestId(/^lesson-\d$/)).toHaveCount(3);
  await page.getByRole('button', { name: 'Keep AGENTS.md as it is' }).click();
  await expect(newRunButton(page)).toBeVisible();
});

test('an abandoned run shows ^C and goes back to the title without a lesson offer', async ({
  page,
}) => {
  await page.goto('/');
  await start(page, 'S28');
  await page.getByRole('button', { name: 'Abandon run' }).click();
  await expect(page.getByTestId('runend-title')).toHaveText('^C');
  await expect(page.getByTestId('runend-cause')).toHaveText('run abandoned');
  await page.getByRole('button', { name: 'Back to title' }).click();
  await expect(newRunButton(page)).toBeVisible();
});
