import { describe, expect, it } from 'vitest';
import type { CombatEvent } from '../events.ts';
import { fight, hitIntent, makeEnemy, makeTool } from '../testing/builders.ts';
import { computeAmount } from './damage.ts';
import { gainGuard, heal } from './effects.ts';
import { resolveCombat } from './resolve.ts';
import { createSim } from './state.ts';
import type { CombatInput } from './types.ts';

const ofKind = (events: readonly CombatEvent[], kind: CombatEvent['kind']) =>
  events.filter((e) => e.kind === kind);
const sim = () => createSim(fight({ enemies: [makeEnemy()] }), true);
const wounded = (input: CombatInput, trust: number): CombatInput => ({
  ...input,
  agent: { ...input.agent, trust },
});

describe('guard effect', () => {
  it('gains Guardrails through the formula and emits guard events', () => {
    const lint = makeTool({
      id: 'lint',
      target: 'self',
      effects: [{ do: 'guard', v: [6, 9, 13] }],
    });
    const result = resolveCombat(fight({ tools: [lint], version: 2 }));
    const guards = ofKind(result.events, 'guard');
    expect(guards[0]).toMatchObject({ t: 3000, src: 't0', dst: 'a', v: 9, d: { total: 9 } });
    expect(guards[1]).toMatchObject({ t: 6000, v: 9, d: { total: 16 } });
    // Typo's Nitpick (hit 2) at 3000 ms lands on the fresh Guardrails, not on Trust.
    const hits = ofKind(result.events, 'damage');
    expect(hits[0]).toMatchObject({ t: 3000, dst: 'a', v: 0, d: { guard: 2, sev: 40 } });
    // Only Deadline damage (1 + ... + 8, until it resolves the Typo) bypasses Guardrails.
    expect(result.stats.damageTaken).toBe(36);
  });

  it('applies % mods and caps at max Trust or max Severity', () => {
    const s = sim();
    expect(gainGuard(s, 't0', s.agent, computeAmount(10, [{ id: 'p', pct: 50 }]))).toBe(15);
    expect(gainGuard(s, 't0', s.agent, computeAmount(30))).toBe(25);
    expect(s.agent.guard).toBe(40);
    const [enemy] = s.enemies;
    if (!enemy) throw new Error('no enemy');
    expect(gainGuard(s, 'e1', enemy, computeAmount(99))).toBe(30);
    expect(s.events.at(-1)).toMatchObject({ kind: 'guard', dst: 'e1', v: 30, d: { total: 30 } });
  });
});

describe('heal effect', () => {
  it('restores Trust through the formula and emits heal events', () => {
    const askHuman = makeTool({
      id: 'ask_human',
      target: 'self',
      effects: [{ do: 'heal', v: 10 }],
    });
    const input = wounded(fight({ tools: [askHuman], enemies: [makeEnemy({ cycle: [] })] }), 25);
    const heals = ofKind(resolveCombat(input).events, 'heal');
    expect(heals.slice(0, 2)).toMatchObject([
      { t: 3000, src: 't0', dst: 'a', v: 10, d: { total: 35 } },
      { t: 6000, v: 5, d: { total: 40 } },
    ]);
  });

  it('applies flat mods and caps at max Trust or max Severity', () => {
    const s = sim();
    s.agent.trust = 30;
    expect(heal(s, 't0', s.agent, computeAmount(1, [{ id: 'f', flat: 3 }]))).toBe(4);
    expect(heal(s, 't0', s.agent, computeAmount(20))).toBe(6);
    expect(s.events.at(-1)).toMatchObject({ kind: 'heal', dst: 'a', v: 6, d: { total: 40 } });
    const [enemy] = s.enemies;
    if (!enemy) throw new Error('no enemy');
    enemy.sev = 12;
    expect(heal(s, 'e1', enemy, computeAmount(50))).toBe(18);
    expect(enemy.sev).toBe(30);
  });

  it('enemy hits drain Guardrails before Trust over a fight', () => {
    const lint = makeTool({ cooldownMs: 1000, target: 'self', effects: [{ do: 'guard', v: 6 }] });
    const enemies = [makeEnemy({ cycle: [hitIntent(20, 3000)] })];
    const result = resolveCombat(fight({ tools: [lint], enemies }));
    // Guardrails 18 at 3000 ms absorb 18 of 20.
    const [first] = ofKind(result.events, 'damage');
    expect(first).toMatchObject({ t: 3000, v: 2, d: { guard: 18, sev: 38 } });
  });
});
