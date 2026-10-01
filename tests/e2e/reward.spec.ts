// T065: the reward screen on the production build. Seed K7Q2-M9XA, Terminal Purist.
import { expect, type Page, test } from '@playwright/test';

async function toReward(page: Page): Promise<void> {
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
  await page.getByTestId('result').getByRole('button', { name: 'Continue' }).click();
}

test('reward screen: 3 diff cards, Skip (+6) and a receipt with an Interest line', async ({
  page,
}) => {
  await toReward(page);
  await expect(page.getByRole('heading', { name: 'PR ready to merge' })).toBeVisible();
  const cards = page.getByTestId(/^reward-\d$/);
  await expect(cards).toHaveCount(3);
  await expect(cards.first()).toBeFocused();
  await expect(cards.first().locator('.diff__add')).not.toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Skip (+6 Credits)' })).toBeVisible();
  const receipt = page.getByTestId('receipt');
  await expect(receipt).toContainText('Reward');
  await expect(receipt).toContainText('Interest');
  await expect(receipt).toContainText('Total');
  await page.keyboard.press('ArrowRight');
  await expect(cards.nth(1)).toBeFocused();
});

test('a duplicate tool shows its upgrade as v1 → v2 with the old and new line', async ({
  page,
}) => {
  await toReward(page);
  // The first card of this seed is the starting tool cat: v1 steps up to v2.
  const cat = page.getByTestId('reward-0');
  await expect(cat).toContainText('cat');
  await expect(page.getByTestId('reward-0-version')).toHaveText('v1 → v2');
  await expect(cat.locator('.diff__del')).toHaveCount(1);
  await expect(cat.locator('.diff__add')).toHaveCount(1);
  await expect(page.getByTestId('reward-1-version')).toHaveText('new');
  await cat.click();
  await expect(page.getByRole('heading', { name: 'Route to the release' })).toBeVisible();
});

test('picking a card dispatches pickReward and returns to the map', async ({ page }) => {
  await toReward(page);
  const credits = page.getByTitle('Credits');
  const before = await credits.textContent();
  await page.getByTestId('reward-0').click();
  await expect(page.getByRole('heading', { name: 'Route to the release' })).toBeVisible();
  await expect(credits).toHaveText(before ?? '');
});

test('skipping adds 6 credits and returns to the map', async ({ page }) => {
  await toReward(page);
  const credits = page.getByTitle('Credits');
  const before = Number(((await credits.textContent()) ?? '').replace(/\D/g, ''));
  await page.getByRole('button', { name: 'Skip (+6 Credits)' }).click();
  await expect(page.getByRole('heading', { name: 'Route to the release' })).toBeVisible();
  await expect(credits).toHaveText(`$ ${before + 6}`);
});
