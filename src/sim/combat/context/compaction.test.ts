import { describe, expect, it } from 'vitest';
import type { FightModifier, ToolDef } from '../../../content/types/index.ts';
import type { CombatEvent } from '../../events.ts';
import { fight, makeTool } from '../../testing/builders.ts';
import { fireTools } from '../fire.ts';
import { addPrimes } from '../order/primes.ts';
import { resolveCombat } from '../resolve.ts';
import { createSim, PROGRESS_PER_MS, type Sim, type ToolRt } from '../state.ts';
import { chargeAll } from '../status/charge.ts';
import { applyStatus, hasStatus } from '../status/statuses.ts';
import { AUTO_COMPACT_STUN_MS } from './compaction.ts';
import { injectNoise } from './noise.ts';
import { updateZone } from './zone.ts';

/** B = 20 + Σ tool weight; S and N set, the zone recomputed silently, no events. */
function bar(tools: ToolDef[], S: number, N: number, window = 60): Sim {
  const sim = createSim(fight({ tools, window }), true);
  Object.assign(sim.agent.ctx, { S, N });
  updateZone(sim);
  sim.events.length = 0;
  return sim;
}

const at = (sim: Sim, slot: number): ToolRt => {
  const tool = sim.agent.tools[slot];
  if (!tool) throw new Error(`no tool ${slot}`);
  return tool;
};
const fill = (tool: ToolRt) => {
  tool.progress = tool.def.cooldownMs * PROGRESS_PER_MS;
};
const kinds = (events: CombatEvent[]) => events.map((e) => e.kind);
const compaction = (sim: Sim) => sim.events.find((e) => e.kind === 'compaction');

/** t0 `big` (weight 3, output 20) fires first; t1 `a` and t2 `b` (weight 0) hold buffs. */
const big = makeTool({ id: 'big', output: 20 });
const trio = () => [big, makeTool({ id: 'a', weight: 0 }), makeTool({ id: 'b', weight: 0 })];

describe('auto-compaction', () => {
  // [W, tool weight, S, N, output]: B = 20 + weight; reset S = min(B + floor(W x 10 / 100), W - 1)
  const cases: [number, number, number, number, number, number][] = [
    [60, 3, 45, 5, 10, 29], // F 60 = W: 23 + 6
    [60, 3, 50, 5, 12, 29], // F 67 > W
    [40, 16, 36, 0, 4, 39], // 36 + 4 = 40, capped at W - 1
  ];
  it.each(cases)('overflow compacts: W %i, weight %i, S %i, N %i, +%i -> S %i', (...c) => {
    const [W, weight, S, N, output, reset] = c;
    const sim = bar([makeTool({ output, weight })], S, N, W);
    fill(at(sim, 0));
    fireTools(sim);
    expect(compaction(sim)).toMatchObject({ t: 0, src: 'ctx', v: AUTO_COMPACT_STUN_MS });
    expect(compaction(sim)?.d).toEqual({ kind: 'auto', S: reset }); // no lostBuff: none held
    expect(sim.agent.ctx).toMatchObject({ S: reset, N: 0 });
    expect(sim.agent.ctx.zone).not.toBe('overflow');
  });

  it('orders tokens, compaction, Stun, then one zoneChanged from the zone before', () => {
    const sim = bar([makeTool({ output: 10 })], 45, 5); // Rot
    fill(at(sim, 0));
    fireTools(sim);
    expect(kinds(sim.events)).toEqual([
      'toolFired',
      'damage',
      'tokens',
      'compaction',
      'statusOn',
      'zoneChanged',
    ]);
    expect(sim.events[2]).toMatchObject({ v: 10, d: { S: 55, N: 5, F: 60 } });
    expect(sim.events[5]).toMatchObject({ v: 1, d: { from: 2, to: 1, F: 29 } });
  });

  it('stuns the agent for 2000 ms; tool progress is kept', () => {
    const sim = bar([big, makeTool({ id: 'a' })], 50, 0);
    fill(at(sim, 0));
    at(sim, 1).progress = 1200 * PROGRESS_PER_MS;
    fireTools(sim);
    expect(sim.agent.statuses).toMatchObject([{ status: 'stun', remaining: AUTO_COMPACT_STUN_MS }]);
    expect(sim.events).toContainEqual(
      expect.objectContaining({ kind: 'statusOn', src: 'ctx', dst: 'a', v: 2000 }),
    );
    chargeAll(sim);
    expect(at(sim, 1).progress).toBe(1200 * PROGRESS_PER_MS);
  });

  it('skips tools that had not fired yet this tick; they stay full', () => {
    const sim = bar([big, makeTool({ id: 'a' })], 50, 0);
    for (const tool of sim.agent.tools) fill(tool);
    fireTools(sim);
    expect(sim.events.filter((e) => e.kind === 'toolFired').map((e) => e.src)).toEqual(['t0']);
    expect(at(sim, 1).progress).toBe(3000 * PROGRESS_PER_MS);
    fireTools(sim); // a later tick: the full tool fires, Stunned or not
    expect(sim.events.filter((e) => e.kind === 'toolFired').map((e) => e.src)).toEqual([
      't0',
      't1',
    ]);
  });

  it('compacts at fight start when the start modifiers overflow', () => {
    const modifiers: FightModifier[] = [{ mod: 'startNoise', tokens: 40 }]; // B 20, F 60 of 60
    const { events } = resolveCombat({ ...fight({ tools: [] }), modifiers });
    expect(kinds(events.slice(0, 4))).toEqual([
      'fightStart',
      'compaction',
      'statusOn',
      'zoneChanged',
    ]);
    expect(events[1]).toMatchObject({ t: 0, v: 2000, d: { kind: 'auto', S: 26 } });
  });
});

describe('buff loss', () => {
  const prime = (sim: Sim, tool: string, pct = 50) =>
    addPrimes(sim, 't0', 'big', { filter: { tool }, pct, count: 1 });
  const haste = (sim: Sim, slot: number) =>
    applyStatus(sim, 't0', at(sim, slot), { status: 'haste', ms: 3000 });

  it('loses a later prime and keeps an earlier Haste', () => {
    const sim = bar(trio(), 50, 0);
    haste(sim, 1);
    prime(sim, 'b');
    fill(at(sim, 0));
    fireTools(sim);
    expect(compaction(sim)).toMatchObject({ d: { lostBuff: 't2:prime:big' } });
    expect([hasStatus(at(sim, 1), 'haste'), at(sim, 2).primes]).toEqual([true, []]);
  });

  it('loses a later Haste with statusOff from ctx and keeps an earlier prime', () => {
    const sim = bar(trio(), 50, 0);
    prime(sim, 'b');
    haste(sim, 1);
    fill(at(sim, 0));
    fireTools(sim);
    expect(compaction(sim)).toMatchObject({ d: { lostBuff: 't1:haste' } });
    const off = {
      kind: 'statusOff',
      src: 'ctx',
      dst: 't1',
      v: 3000,
      d: { status: 'haste', remaining: 0 },
    };
    expect(sim.events).toContainEqual(expect.objectContaining(off));
    expect([hasStatus(at(sim, 1), 'haste'), at(sim, 2).primes.length]).toEqual([false, 1]);
  });

  it('agent-wide Haste: only the highest-seq application is lost (rightmost tool)', () => {
    const sim = bar(trio(), 50, 0);
    applyStatus(sim, 't0', sim.agent, { status: 'haste', ms: 3000 });
    fill(at(sim, 0));
    fireTools(sim);
    expect(compaction(sim)).toMatchObject({ d: { lostBuff: 't2:haste' } });
    expect(sim.agent.tools.map((t) => hasStatus(t, 'haste'))).toEqual([true, true, false]);
  });

  it('re-applying Haste makes it the most recent again', () => {
    const sim = bar(trio(), 50, 0);
    haste(sim, 1);
    prime(sim, 'b');
    haste(sim, 1);
    fill(at(sim, 0));
    fireTools(sim);
    expect(compaction(sim)).toMatchObject({ d: { lostBuff: 't1:haste' } });
  });

  it('Slow and negative primes are no positive buffs: nothing is lost', () => {
    const sim = bar(trio(), 50, 0);
    applyStatus(sim, 't0', at(sim, 1), { status: 'slow', ms: 3000 });
    prime(sim, 'b', -20);
    fill(at(sim, 0));
    fireTools(sim);
    expect(compaction(sim)?.d).toEqual({ kind: 'auto', S: 29 });
    expect([hasStatus(at(sim, 1), 'slow'), at(sim, 2).primes.length]).toEqual([true, 1]);
  });
});

describe('overflow sources', () => {
  it('tool output overflow triggers auto-compaction', () => {
    const sim = bar([makeTool({ output: 7 })], 53, 0); // F 60
    fill(at(sim, 0));
    fireTools(sim);
    expect(compaction(sim)).toMatchObject({ src: 'ctx', v: 2000, d: { kind: 'auto', S: 29 } });
  });

  it('noise overflow triggers auto-compaction', () => {
    const sim = bar([makeTool()], 50, 0); // Rot: noise x2
    const [enemy] = sim.enemies;
    if (!enemy) throw new Error('setup');
    injectNoise(sim, enemy, 5);
    expect(kinds(sim.events)).toEqual(['tokens', 'compaction', 'statusOn', 'zoneChanged']);
    expect(sim.events[0]).toMatchObject({ src: 'e1', v: 10, d: { F: 60, kind: 'noise' } });
    expect(compaction(sim)).toMatchObject({ v: 2000, d: { kind: 'auto', S: 29 } });
    expect(sim.agent.ctx.N).toBe(0);
  });
});
