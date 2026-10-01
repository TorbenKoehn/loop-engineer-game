// T063: Title -> New run -> harness select -> system prompt pick -> map, by keyboard alone on
// the production build. A fresh profile is the first run. Text, roles and test ids only.
import { expect, type Page, test } from '@playwright/test';

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

test('title, harness cards and prompt cards work by keyboard and set initial focus', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await page.goto('/');

  // Title: New run has focus, Enter opens harness select.
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Loop Engineer');
  await expect(page.getByText('$ loop-engineer')).toBeVisible();
  const newRun = page.getByRole('button', { name: 'New run' });
  await expect(newRun).toBeFocused();
  await expect(page.getByRole('region', { name: 'Terminal' })).toHaveCount(0);
  await page.getByLabel('Seed').fill('K7Q2-M9XA');
  await newRun.focus();
  await page.keyboard.press('Enter');

  // Harness select: both M1 cards with config block, fantasy line, difficulty tag and trait.
  await expect(page.getByRole('heading', { name: 'Select a harness' })).toBeVisible();
  const purist = page.getByTestId('harness-terminal_purist');
  const companion = page.getByTestId('harness-ide_companion');
  for (const [card, name, fantasy, level, trait, window] of [
    [
      purist,
      'Terminal Purist',
      'CLI agent. Everything is a pipe.',
      'Medium',
      'Muscle Memory',
      '60',
    ],
    [companion, 'IDE Companion', 'lives in your editor', 'Easy', 'Undo Stack', '100'],
  ] as const) {
    await expect(card).toContainText(name);
    await expect(card).toContainText(fantasy);
    await expect(card.locator('.tag', { hasText: 'Difficulty' })).toHaveText(
      `Difficulty: ${level}`,
    );
    await expect(card.locator('.hcard__trait')).toContainText(trait);
    const config = card.locator('dl.cfg');
    await expect(config).toContainText(`window${window}`);
    await expect(config).toContainText('slots');
    await expect(config).toContainText('tools');
  }
  await expect(purist).toContainText('grep | cat | sed');

  // First run: IDE Companion is preselected, focused and tagged as recommended.
  const ide = page.getByRole('radio', { name: 'IDE Companion' });
  const term = page.getByRole('radio', { name: 'Terminal Purist' });
  await expect(ide).toBeChecked();
  await expect(ide).toBeFocused();
  await expect(companion).toContainText('Recommended for your first run');
  await expect(purist).not.toContainText('Recommended');

  // Esc goes back to the title; New run again restores the preselection.
  await page.keyboard.press('Escape');
  await expect(newRun).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(ide).toBeFocused();

  // Arrow keys choose, Enter starts the run.
  await page.keyboard.press('ArrowLeft');
  await expect(term).toBeChecked();
  await expect(term).toBeFocused();
  await page.keyboard.press('Enter');

  // System prompt pick: 3 quoted cards with weight and effect line, plus the tip.
  await expect(page.getByRole('banner')).toContainText('phase-1/implement');
  await expect(page.getByRole('heading', { name: 'Pick a system prompt' })).toBeVisible();
  await expect(page.getByTestId('status-bar')).toContainText('Trust 80/80');
  await expect(page.getByText('Prompts cost context. Smaller is leaner.')).toBeVisible();
  const cards = page.getByTestId(/^prompt-/);
  await expect(cards).toHaveCount(3);
  await expect(cards.nth(0)).toContainText('“You are a senior engineer.”');
  await expect(cards.nth(0)).toContainText('weight 8');
  await expect(cards.nth(0)).toContainText('All tool damage +10%; window -10.');
  await expect(cards.nth(1)).toContainText('weight 4');
  await expect(cards.nth(2)).toContainText('weight 10');
  await expect(cards.nth(0)).toBeFocused();

  // Arrow keys move between cards; Enter dispatches pickPrompt and the map shows.
  await page.keyboard.press('ArrowRight');
  await expect(cards.nth(1)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Route to the release' })).toBeVisible();

  expect(errors).toEqual([]);
});

test('reduced motion stops the title cursor blink and card transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const cursor = page.locator('.title__logo .cursor');
  await expect(cursor).toHaveCSS('animation-name', 'none');
  await page.getByRole('button', { name: 'New run' }).click();
  await expect(page.getByTestId('harness-ide_companion')).toHaveCSS('transition-duration', '0s');
});
