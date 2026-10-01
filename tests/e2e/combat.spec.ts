// T101: a real fight from the title screen on the production build. Seed K7Q2-M9XA, first
// prompt, node p1-r1-c0: Typo + Context Drift, won with auto-compactions, each stunning the
// agent for 2 s. Text, roles and test ids only, never pixels.
import { expect, type Page, test } from '@playwright/test';

async function travel(page: Page, node: string): Promise<void> {
  await page.getByTestId(`node-${node}`).click();
  await expect(page.getByRole('region', { name: 'Fight' })).toBeVisible();
}

test('New run -> pick -> travel -> fight -> Continue, with controls and persisted speed', async ({
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
  await travel(page, 'p1-r1-c0');

  const fight = page.getByRole('region', { name: 'Fight' });
  const speedLabel = page.getByTestId('speed');
  const clock = page.getByTestId('clock');

  // Agent card: name, Trust, Guardrails.
  const agent = page.getByTestId('agent-card');
  await expect(agent).toContainText('Terminal Purist');
  await expect(agent).toContainText('Trust');
  await expect(agent).toContainText('Guardrails');
  await expect(page.getByTestId('trust')).toHaveText(/^\d+\/80$/);

  // Tool cards in slot order: name, version, cooldown bar, next value, output.
  for (const [slot, name] of ['grep', 'cat', 'sed'].entries()) {
    const tool = page.getByTestId(`tool-${slot}`);
    await expect(tool.locator('.tool__name')).toHaveText(name);
    await expect(tool.locator('.tool__version')).toHaveText(/^v\d$/);
    await expect(tool.locator('.tool__next')).toHaveText(/\d/);
    await expect(tool).toContainText(/output \+\d+k/);
    await expect(tool.locator('.bar--charge .bar__fill')).toHaveAttribute('style', /scaleX\(/);
  }

  // Enemy cards with intent chip and countdown.
  const enemies = fight.locator('[data-testid^="enemy-"]');
  await expect(enemies.first()).toContainText('Typo');
  await expect(fight).toContainText('Context Drift');
  const intent = enemies.first().getByTestId('intent');
  await expect(intent).toBeVisible();
  await expect(intent.locator('.intent__left')).toHaveText(/^\d+\.\d s$/);
  // Bars scale with transform only (ui.md "Performance budgets").
  for (const fill of await fight.locator('.bar__fill').all()) {
    await expect(fill).toHaveAttribute('style', /transform: scaleX\(/);
  }

  // Speed buttons set the shared speed; the status bar names it.
  await expect(speedLabel).toHaveText('1x');
  await fight.getByRole('button', { name: '4x' }).click();
  await expect(speedLabel).toHaveText('4x');
  await fight.getByRole('button', { name: '1x' }).click();
  await expect(speedLabel).toHaveText('1x');
  await expect(fight.getByRole('button', { name: '1x' })).toHaveAttribute('aria-pressed', 'true');

  // 2x, then pause while the agent is stunned: the status chip shows and the clock stands still.
  await fight.getByRole('button', { name: '2x' }).click();
  await expect(speedLabel).toHaveText('2x');
  await agent.locator('.chip--stun').waitFor();
  await fight.getByRole('button', { name: 'Pause' }).click();
  await expect(agent.locator('.chip--stun')).toContainText('Stun');
  const held = await clock.textContent();
  await page.waitForTimeout(300);
  await expect(clock).toHaveText(held ?? '');

  // 4x resumes, skip folds to the end; the status bar names each speed.
  await fight.getByRole('button', { name: '4x' }).click();
  await expect(speedLabel).toHaveText('4x');
  await expect(clock).not.toHaveText(held ?? '');
  await fight.getByRole('button', { name: 'Skip' }).click();
  await expect(speedLabel).toHaveText('⏭ Skip');

  // Result strip: time, Trust delta, compactions; Continue takes focus and dispatches continue.
  const result = page.getByTestId('result');
  await expect(result).toContainText(/Resolved in \d+\.\d s/);
  // Format only: the exact outcome moves with sim balance (T029 changed -18 to -20 Trust).
  await expect(result).toContainText(/-\d+ Trust/);
  await expect(result).toContainText(/\d+ compactions?/);
  const next = result.getByRole('button', { name: 'Continue' });
  await expect(next).toBeFocused();
  await next.click();
  await expect(page.getByRole('heading', { name: 'PR ready to merge' })).toBeVisible();
  await expect(page.getByRole('banner')).toContainText('phase-1/implement › row 1');
  await expect(fight).toHaveCount(0);

  // The next fight starts at the persisted speed (skip) and ends at once.
  await page.getByRole('button', { name: /^Skip \(/ }).click();
  await travel(page, 'p1-r2-c0');
  await expect(fight.getByRole('button', { name: 'Skip' })).toHaveAttribute('aria-pressed', 'true');
  await expect(speedLabel).toHaveText('⏭ Skip');
  await expect(result).toContainText(/Resolved in/);
  await result.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'PR ready to merge' })).toBeVisible();
  await expect(page.getByRole('banner')).toContainText('phase-1/implement › row 2');

  expect(errors).toEqual([]);
});

// T060: the context bar on the same seeded fight; paused once Context Drift's noise is in.
test('Context bar shows zone, ticks, F/W and the noise source on hover', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Seed').fill('K7Q2-M9XA');
  await page.getByRole('button', { name: 'New run' }).click();
  await page.getByTestId('harness-terminal_purist').click();
  await page.getByRole('button', { name: 'Start run' }).click();
  await page
    .getByTestId(/^prompt-/)
    .first()
    .click();
  await travel(page, 'p1-r1-c0');
  const fight = page.getByRole('region', { name: 'Fight' });
  await fight.getByRole('button', { name: '4x' }).click();

  const bar = page.getByTestId('ctx-bar');
  await expect(bar).toBeVisible();
  await expect(page.getByTestId('ctx-fill')).toHaveText(/^\d+\/\d+k$/);
  await expect(page.getByTestId('ctx-zone')).toHaveAttribute('aria-label', /^Zone: \w+/);
  await expect(bar.locator('.ctx__tick')).toHaveText(['25%', '70%']);
  await expect(bar.locator('.ctx__seg--base')).toBeVisible();

  await bar.locator('.ctx__seg--noise').first().waitFor();
  await fight.getByRole('button', { name: 'Pause' }).click();
  await bar.locator('.ctx__seg--noise').first().hover();
  await expect(bar.locator('.ctx__seg--noise .ctx__tip').first()).toHaveText(
    /^Context Drift: \d+k$/,
  );
  // The status bar follows the fight's fill.
  await expect(page.getByTestId('status-bar')).toContainText(/ctx \d+\/\d+/);
});
