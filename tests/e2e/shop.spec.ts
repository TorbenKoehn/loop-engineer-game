// T066: the Package Registry on the production build. Seed K7Q2-M9XA, Terminal Purist:
// p1-r1-c3 -> r2-c4 -> r3-c4 -> r4-c4 -> the registry p1-r5-c4.
import { expect, type Page, test } from '@playwright/test';

const PATH = ['p1-r1-c3', 'p1-r2-c4', 'p1-r3-c4', 'p1-r4-c4', 'p1-r5-c4'];

/** Plays whatever the node opened until the map or the registry shows. */
async function resolve(page: Page): Promise<void> {
  const map = page.getByRole('heading', { name: 'Route to the release' });
  const shop = page.getByRole('heading', { name: 'Package Registry' });
  const fight = page.getByRole('region', { name: 'Fight' });
  const reward = page.getByRole('button', { name: 'Skip (+6 Credits)' });
  const stub = page.locator('.placeholder button');
  for (let i = 0; i < 6; i++) {
    const seen = page.locator('h2, .placeholder, [aria-label="Fight"]').first();
    await seen.waitFor();
    if ((await map.count()) || (await shop.count())) return;
    if (await fight.count()) {
      await fight.getByRole('button', { name: 'Skip' }).click();
      await page.getByTestId('result').getByRole('button', { name: 'Continue' }).click();
    } else if (await reward.count()) await reward.click();
    else if (await stub.count()) await stub.first().click();
  }
}

async function toShop(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByLabel('Seed').fill('K7Q2-M9XA');
  await page.getByRole('button', { name: 'New run' }).click();
  await page.getByTestId('harness-terminal_purist').click();
  await page.getByRole('button', { name: 'Start run' }).click();
  await page
    .getByTestId(/^prompt-/)
    .first()
    .click();
  for (const id of PATH) {
    await page.getByTestId(`node-${id}`).click();
    await resolve(page);
  }
  await expect(page.getByRole('heading', { name: 'Package Registry' })).toBeVisible();
}

const credits = async (page: Page) =>
  Number(((await page.getByTitle('Credits').textContent()) ?? '').replace(/\D/g, ''));

test('the registry lists 5 packages with prices, sale tag and a reroll cost', async ({ page }) => {
  await toShop(page);
  const offers = page.getByTestId(/^shop-offer-\d$/);
  await expect(offers).toHaveCount(5);
  await expect(offers.first().locator('.pkg__id')).toHaveText(/^[a-z_]+@\d\.0\.0$/);
  await expect(page.locator('.tag--brand')).toHaveCount(1);
  await expect(page.getByTestId('shop-reroll')).toContainText('Reroll ($ 2)');
});

test('unaffordable offers are disabled with the reason; buy and reroll spend credits', async ({
  page,
}) => {
  await toShop(page);
  const offers = page.getByTestId(/^shop-offer-\d$/);
  const have = await credits(page);
  await page.getByTestId('shop-reroll').click();
  await expect.poll(() => credits(page)).toBe(have - 2);
  await expect(page.getByTestId('shop-reroll')).toContainText('Reroll ($ 3)');
  await expect(page.getByTestId('shop-credits')).toHaveText(`Credits: ${have - 2}`);
  const enabled = offers.and(page.locator(':enabled')).first();
  const price = Number(
    ((await enabled.locator('.pkg__price').textContent()) ?? '').replace(/\D/g, ''),
  );
  await enabled.click();
  await expect.poll(() => credits(page)).toBe(have - 2 - price);
});

test('selling a spare item pays out; selling the last tool is refused', async ({ page }) => {
  await toShop(page);
  const have = await credits(page);
  const sell = page.getByTestId(/^shop-sell-tool-\d$/);
  const count = await sell.count();
  for (let i = 0; i < count - 1; i++) await sell.first().click();
  await expect.poll(() => credits(page)).toBeGreaterThan(have - 1);
  await expect(page.getByTestId(/^shop-sell-tool-\d$/)).toHaveCount(1);
  await page.getByTestId(/^shop-sell-tool-\d$/).click();
  await expect(page.getByTestId('shop-error')).toHaveText('An agent with no tools is a chatbot');
  await page.getByTestId('shop-leave').click();
  await expect(page.getByRole('heading', { name: 'Route to the release' })).toBeVisible();
});

test('rerolling until an offer is unaffordable disables it and states the reason', async ({
  page,
}) => {
  await toShop(page);
  const offers = page.getByTestId(/^shop-offer-\d$/);
  const disabled = offers.and(page.locator(':disabled'));
  // Each reroll costs one more Credit than the last, so the balance only falls.
  for (let i = 0; i < 12 && (await disabled.count()) === 0; i++) {
    await page.getByTestId('shop-reroll').click();
    await expect(page.getByTestId('shop-reroll')).toContainText(`Reroll ($ ${3 + i})`);
  }
  const have = await credits(page);
  await expect(disabled.first()).toBeVisible();
  const price = Number(
    ((await disabled.first().locator('.pkg__price').textContent()) ?? '').replace(/\D/g, ''),
  );
  expect(price).toBeGreaterThan(have);
  await expect(disabled.first()).toContainText(`Need ${price - have} more Credits`);
});
