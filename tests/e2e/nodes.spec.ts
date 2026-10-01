// T067: seed K7Q2-M9XA, Terminal Purist: Tasks p1-r1-c3, r2-c4, Standup r3-c4, Free Tier r4-c4,
// registry r5-c4, Standup r6-c4, Idle Cycle r7-c3. Every step is fixed by the seed.
import { expect, type Page, test } from '@playwright/test';

const mapHeading = (page: Page) => page.getByRole('heading', { name: 'Route to the release' });
const credits = async (page: Page) =>
  Number(((await page.getByTitle('Credits').textContent()) ?? '').replace(/\D/g, ''));

async function start(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByLabel('Seed').fill('K7Q2-M9XA');
  await page.getByRole('button', { name: 'New run' }).click();
  await page.getByTestId('harness-terminal_purist').click();
  await page.getByRole('button', { name: 'Start run' }).click();
  await page
    .getByTestId(/^prompt-/)
    .first()
    .click();
}

/** A Task node: skip the fight playback, continue, skip the reward. */
async function task(page: Page, node: string): Promise<void> {
  await page.getByTestId(`node-${node}`).click();
  await page.getByRole('region', { name: 'Fight' }).getByRole('button', { name: 'Skip' }).click();
  await page.getByTestId('result').getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Skip (+6 Credits)' }).click();
  await expect(mapHeading(page)).toBeVisible();
}

/** Start, two Tasks, then open the first Standup. */
async function toStandup(page: Page): Promise<void> {
  await start(page);
  await task(page, 'p1-r1-c3');
  await task(page, 'p1-r2-c4');
  await page.getByTestId('node-p1-r3-c4').click();
  await expect(page.getByRole('heading', { name: 'standup' })).toBeVisible();
}

/** Through the first Standup (Read the comments), the Free Tier and the registry. */
async function toSecondStandup(page: Page): Promise<void> {
  await toStandup(page);
  await page.getByTestId('standup-reply-1').click();
  await page.getByTestId('node-p1-r4-c4').click();
  await expect(page.getByRole('heading', { name: 'unzip free-tier.zip' })).toBeVisible();
  await expect(page.getByTestId('free-tier-card')).toContainText('Keyboard Shortcuts');
  await expect(page.getByTestId('free-tier-card').locator('.diff__add')).not.toHaveCount(0);
  const take = page.getByTestId('free-tier-take');
  await expect(take).toHaveText('Equip in memory slot 1');
  await expect(take).toBeFocused();
  await take.click();
  await expect(mapHeading(page)).toBeVisible();
  await page.getByTestId('node-p1-r5-c4').click();
  await page.getByTestId('shop-leave').click();
  await page.getByTestId('node-p1-r6-c4').click();
  await expect(page.getByTestId('standup-speaker')).toHaveText('A teammate');
}

async function toIdleCycle(page: Page): Promise<void> {
  await toSecondStandup(page);
  await page.getByTestId('standup-reply-0').click();
  await page.getByTestId('node-p1-r7-c3').click();
  await expect(page.getByRole('heading', { name: 'sleep 30' })).toBeVisible();
}

test('Standup: speaker, setup line and replies with exact outcomes; a reply returns to the map', async ({
  page,
}) => {
  await toStandup(page);
  await expect(page.getByTestId('standup-speaker')).toHaveText('search-bot');
  await expect(page.getByTestId('standup-line')).toHaveText([
    'A Stack Underflow answer from 2011 has 3000 upvotes.',
  ]);
  const copy = page.getByTestId('standup-reply-0');
  await expect(copy).toBeFocused();
  await expect(copy.locator('.reply__out')).toHaveText([
    'Gain a random uncommon tool',
    '50%: lose 8 Trust',
  ]);
  const read = page.getByTestId('standup-reply-1');
  await expect(read.locator('.reply__out')).toHaveText(['+5 Credits']);
  await page.keyboard.press('ArrowDown');
  await expect(read).toBeFocused();
  const before = await credits(page);
  await page.keyboard.press('Enter');
  await expect(mapHeading(page)).toBeVisible();
  expect(await credits(page)).toBe(before + 5);
});

test('Free Tier equips its memory; a Standup choice with an unmet requirement states why', async ({
  page,
}) => {
  await toSecondStandup(page);
  await expect(page.getByTestId('standup-line')).toHaveText(['"The tests are green locally."']);
  await expect(page.getByTestId('standup-reply-0').locator('.reply__out')).toHaveText([
    'Restore 20 Trust',
  ]);
  const ci = page.getByTestId('standup-reply-1');
  await expect(ci).toBeEnabled();
  await expect(ci).toContainText('$ 15');
  await expect(ci.locator('.reply__out')).toHaveText(['+1 memory slot']);
  const test3 = page.getByTestId('standup-reply-2');
  await expect(test3).toBeDisabled();
  await expect(page.getByTestId('standup-why-2')).toHaveText('✕ Needs a Test tool equipped');
  const before = await credits(page);
  await ci.click();
  await expect(mapHeading(page)).toBeVisible();
  expect(await credits(page)).toBe(before - 15);
});

test('Idle Cycle: Heal restores the previewed Trust and returns to the map', async ({ page }) => {
  await toIdleCycle(page);
  const heal = page.getByTestId('rest-heal');
  await expect(heal).toBeFocused();
  await expect(heal).toContainText('Restore 24 Trust');
  await expect(heal).toContainText('Trust 42 → 66');
  await heal.click();
  await expect(mapHeading(page)).toBeVisible();
  await expect(page.getByTestId('status-bar')).toContainText('Trust 66/80');
});

test('Idle Cycle: the tool picker upgrades the picked tool and returns to the map', async ({
  page,
}) => {
  await toIdleCycle(page);
  await expect(page.getByTestId(/^rest-upgrade-\d$/)).toHaveCount(3);
  const grep = page.getByTestId('rest-upgrade-0');
  await expect(grep).toContainText('grep');
  await expect(grep).toContainText('v1 → v2');
  await page.keyboard.press('ArrowDown');
  await expect(grep).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(mapHeading(page)).toBeVisible();
});
