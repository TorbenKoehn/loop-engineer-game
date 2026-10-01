import { describe, expect, it } from 'vitest';
import { fight, intent, makeEnemy, makeTool } from '../testing/builders.ts';
import { OVERTIME_CAP_MS } from './deadline.ts';
import { resolveCombat } from './resolve.ts';

/** Gains `n` Guardrails every second, from 1000 ms on. */
const shield = (n: number) =>
  makeTool({ id: 'shield', cooldownMs: 1000, target: 'self', effects: [{ do: 'guard', v: n }] });
const passive = (sev: number) => makeEnemy({ sev, cycle: [] });

describe('deadline damage', () => {
  it('deals k to every enemy then k to the agent at each full second k, bypassing Guardrails', () => {
    const guarded = makeEnemy({
      sev: 100,
      cycle: [intent('wall', 1000, { verb: 'guard', n: 50 })],
    });
    const input = fight({
      tools: [shield(100)],
      enemies: [guarded, passive(100)],
      trust: 100,
      deadlineMs: 1000,
    });
    const { events } = resolveCombat(input);
    const overtime = events.filter((e) => e.src === 'sys' && e.t >= 2000 && e.t <= 3000);
    expect(
      overtime.map((e) => [e.t, e.kind, e.dst, e.v, e.kind === 'damage' && e.d.guard]),
    ).toEqual([
      [2000, 'deadline', undefined, 1, false],
      [2000, 'damage', 'e1', 1, 0],
      [2000, 'damage', 'e2', 1, 0],
      [2000, 'damage', 'a', 1, 0],
      [3000, 'deadline', undefined, 2, false],
      [3000, 'damage', 'e1', 2, 0],
      [3000, 'damage', 'e2', 2, 0],
      [3000, 'damage', 'a', 2, 0],
    ]);
    // Guardrails stay untouched: the agent and the first enemy keep theirs.
    const sevAt3000 = overtime.filter((e) => e.kind === 'damage' && e.t === 3000);
    expect(sevAt3000.map((e) => e.kind === 'damage' && e.d.sev)).toEqual([97, 97, 97]);
  });

  it('does not hit at the Deadline itself or between full seconds', () => {
    const input = fight({ tools: [], enemies: [passive(1000)], trust: 1000, deadlineMs: 2500 });
    const { events } = resolveCombat(input);
    const deadlines = events.filter((e) => e.kind === 'deadline');
    expect(deadlines.slice(0, 3).map((e) => [e.t, e.v])).toEqual([
      [3500, 1],
      [4500, 2],
      [5500, 3],
    ]);
  });

  it('resolves enemies it drops to 0, by sys', () => {
    const input = fight({ tools: [], enemies: [passive(3)], trust: 100, deadlineMs: 1000 });
    const result = resolveCombat(input);
    expect(result).toMatchObject({ outcome: 'win', reason: 'resolved', endT: 3000 });
    expect(result.events.at(-2)).toMatchObject({ kind: 'resolved', src: 'e1', d: { by: 'sys' } });
    expect(result.agentAfter.trust).toBe(97);
    expect(result.stats.damageTaken).toBe(3);
  });
});

describe('fight end', () => {
  it('a fight reaching deadlineMs + 30 000 ends with loss by timeout', () => {
    const input = fight({ tools: [], enemies: [passive(1000)], trust: 1000, deadlineMs: 1000 });
    const result = resolveCombat(input);
    expect(result).toMatchObject({ outcome: 'loss', reason: 'timeout' });
    expect(result.endT).toBe(1000 + OVERTIME_CAP_MS);
    // Cumulative Deadline damage at the cap is 1 + 2 + ... + 30 = 465.
    expect(result.agentAfter.trust).toBe(1000 - 465);
    expect(result.events.at(-1)).toMatchObject({ kind: 'fightEnd', d: { reason: 'timeout' } });
  });

  it('all enemies and the agent at 0 in the same tick is a win', () => {
    const input = fight({
      tools: [],
      enemies: [passive(1), passive(1)],
      trust: 1,
      deadlineMs: 1000,
    });
    const result = resolveCombat(input);
    expect(result).toMatchObject({ outcome: 'win', reason: 'resolved', endT: 2000 });
    expect(result.agentAfter.trust).toBe(0);
  });

  it('agentAfter carries Trust and maxTrust, not Guardrails or statuses', () => {
    const haste = { do: 'status', status: 'haste', ms: 60_000, sel: 'self' } as const;
    const buffer = makeTool({
      id: 'buffer',
      target: 'self',
      effects: [{ do: 'guard', v: 5 }, haste],
    });
    const input = fight({ tools: [buffer, makeTool()], enemies: [makeEnemy()], trust: 40 });
    const result = resolveCombat(input);
    expect(result.outcome).toBe('win');
    const guardGains = result.events.filter((e) => e.kind === 'guard' && e.dst === 'a');
    expect(guardGains.length).toBeGreaterThan(0);
    // Haste on the agent lands on its tools.
    expect(result.events.some((e) => e.kind === 'statusOn' && e.dst === 't0')).toBe(true);
    expect(result.agentAfter).toEqual({
      trust: 40 - result.stats.damageTaken,
      maxTrust: 40,
      usedOncePerRun: [],
    });
  });
});
