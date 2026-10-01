import { describe, expect, it } from 'vitest';
import { resolveCombat } from '../../sim/index.ts';
import { buildInput, sandboxEncounters, sandboxHarnesses } from './adapter.ts';
import { advanceTo, foldAll, foldEvent, initialView, MAX_POPS } from './fold.ts';

const SEED = { harness: 'terminal_purist', encounter: 'p1e1', seed: 'fold-test' };

function fightOf(input = buildInput(SEED)) {
  const result = resolveCombat(input);
  const start = initialView(input.agent.tools.map((s) => ({ def: s.def.id, version: s.version })));
  return { input, result, start };
}

const sevLost = (enemies: readonly { sev: number; maxSev: number }[]): number =>
  enemies.reduce((sum, e) => sum + e.maxSev - e.sev, 0);
const sum = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0);

describe('sandbox view fold', () => {
  it('final Trust and Severity match the sim result for a fixed seed', () => {
    const { input, result, start } = fightOf();
    const view = foldAll(start, result.events);
    expect(result.outcome).toBe('win');
    expect(view.agent.trust).toBe(result.agentAfter.trust);
    expect(view.agent.maxTrust).toBe(result.agentAfter.maxTrust);
    expect(view.agent.maxTrust - view.agent.trust).toBe(result.stats.damageTaken);
    expect(view.enemies.map((e) => e.def)).toEqual(input.encounter.enemies.map((e) => e.id));
    expect(view.enemies.map((e) => e.sev)).toEqual([0, 0, 0]);
    expect(view.enemies.every((e) => e.resolvedAt !== undefined)).toBe(true);
    expect(sevLost(view.enemies)).toBe(sum(result.stats.toolDamage));
    expect(view.tools.map((t) => t.dealt)).toEqual(result.stats.toolDamage);
    const { outcome, reason, endT, agentAfter } = result;
    expect(view.end).toEqual({ outcome, reason, trust: agentAfter.trust, t: endT });
    expect(view.cursor).toBe(result.events.length);
  });

  it('matches the sim for a lost fight (Trust runs out)', () => {
    const base = buildInput({ ...SEED, encounter: 'p1h3' });
    const input = { ...base, agent: { ...base.agent, trust: 5 } };
    const { result, start } = fightOf(input);
    const view = foldAll(start, result.events);
    expect(view.end?.outcome).toBe('loss');
    expect(view.end?.reason).toBe('trust');
    expect(view.agent.trust).toBe(result.agentAfter.trust);
    expect(sevLost(view.enemies)).toBe(sum(result.stats.toolDamage));
    expect(view.enemies.some((e) => e.sev > 0)).toBe(true);
  });

  // Since T023, Deadline damage (not the timeout cap) ends this fight; expectations follow the sim.
  it('matches an overtime fight (no tools, huge Trust)', () => {
    const base = buildInput(SEED);
    const agent = { ...base.agent, tools: [], trust: 1e9, maxTrust: 1e9 };
    const { result, start } = fightOf({ ...base, agent, skills: [] });
    const view = foldAll(start, result.events);
    expect(view.end?.outcome).toBe(result.outcome);
    expect(view.end?.reason).toBe(result.reason);
    expect(view.agent.trust).toBe(result.agentAfter.trust);
    const resolved = result.events.filter((e) => e.kind === 'resolved').length;
    expect(view.enemies.filter((e) => e.resolvedAt !== undefined)).toHaveLength(resolved);
  });

  it('matches every harness x Phase-1 encounter', () => {
    for (const h of sandboxHarnesses) {
      for (const enc of sandboxEncounters) {
        const { result, start } = fightOf(
          buildInput({ ...SEED, harness: h.id, encounter: enc.id }),
        );
        const view = foldAll(start, result.events);
        expect(view.agent.trust, `${h.id} ${enc.id}`).toBe(result.agentAfter.trust);
        expect(view.end?.outcome).toBe(result.outcome);
      }
    }
  });

  it('advanceTo stops at the given time and continues from the cursor', () => {
    const { result, start } = fightOf();
    const mid = advanceTo(start, result.events, 5000);
    expect(mid.end).toBeUndefined();
    expect(result.events[mid.cursor]?.t).toBeGreaterThan(5000);
    expect(mid.t).toBeLessThanOrEqual(5000);
    expect(advanceTo(mid, result.events, Number.POSITIVE_INFINITY)).toEqual(
      foldAll(start, result.events),
    );
  });

  it('tracks guard, statuses and caps pops', () => {
    let view = initialView([{ def: 'grep', version: 1 }]);
    view = foldEvent(view, { seq: 0, t: 0, kind: 'guard', dst: 'a', v: 5, d: { total: 5 } });
    view = foldEvent(view, {
      seq: 1,
      t: 10,
      kind: 'statusOn',
      dst: 't0',
      v: 3000,
      d: { status: 'throttle', remaining: 3000 },
    });
    expect(view.agent.guard).toBe(5);
    expect(view.tools[0]?.statuses).toEqual([{ status: 'throttle', until: 3010 }]);
    view = foldEvent(view, {
      seq: 2,
      t: 20,
      kind: 'statusOff',
      dst: 't0',
      v: 0,
      d: { status: 'throttle', remaining: 0 },
    });
    expect(view.tools[0]?.statuses).toEqual([]);
    for (let i = 0; i < MAX_POPS + 4; i++)
      view = foldEvent(view, { seq: 3 + i, t: 30, kind: 'heal', dst: 'a', v: 1, d: { total: 1 } });
    expect(view.pops).toHaveLength(MAX_POPS);
    expect(view.agent.trust).toBe(1);
  });
});
