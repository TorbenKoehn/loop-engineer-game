import { describe, expect, it } from 'vitest';
import type { ToolDef } from '../../../content/types/index.ts';
import type { CombatEvent } from '../../events.ts';
import { type FightSpec, fight, makeTool } from '../../testing/builders.ts';
import { createSim, PROGRESS_PER_MS, type Sim } from '../state.ts';
import { fireTools } from '../tick/fire.ts';
import { resolveCombat } from '../tick/resolve.ts';
import { addOutput, removeTokens } from './tokens.ts';
import { updateZone } from './zone.ts';

const tokens = (v: number, S: number, N: number, kind: string) => ({
  kind: 'tokens',
  src: 't0',
  dst: 'ctx',
  v,
  d: { S, N, F: S + N, kind },
});

/** One-tool sim (B = 20 + tool weight) with S and N set and the zone recomputed silently. */
function bar(tool: ToolDef, S: number, N: number, spec: FightSpec = {}): Sim {
  const sim = createSim(fight({ ...spec, tools: [tool] }), true);
  Object.assign(sim.agent.ctx, { S, N });
  updateZone(sim);
  sim.events.length = 0;
  return sim;
}

/** Fires the sim's first tool once; returns that activation's events. */
function fireOnce(sim: Sim): CombatEvent[] {
  const [tool] = sim.agent.tools;
  if (!tool) throw new Error('setup');
  tool.progress = tool.def.cooldownMs * PROGRESS_PER_MS;
  fireTools(sim);
  return sim.events;
}

const kinds = (events: CombatEvent[]) => events.map((e) => e.kind);

describe('tool output', () => {
  it('adds max(0, output + mods) to S after the effects, with a tokens event of kind output', () => {
    // Default fight: grep (output 1), B 23 of W 60.
    const { events } = resolveCombat(fight());
    const fired = events.findIndex((e) => e.kind === 'toolFired');
    expect(kinds(events.slice(fired, fired + 3))).toEqual(['toolFired', 'damage', 'tokens']);
    expect(events[fired + 2]).toMatchObject(tokens(1, 24, 0, 'output'));
    const sim = bar(makeTool({ output: 3 }), 23, 0);
    const [tool] = sim.agent.tools;
    if (!tool) throw new Error('setup');
    addOutput(sim, tool, 2);
    addOutput(sim, tool, -9); // max(0, 3 - 9) = 0: no change, no event
    expect(sim.events).toEqual([expect.objectContaining(tokens(5, 28, 0, 'output'))]);
    expect(sim.agent.ctx.S).toBe(28);
  });

  it('ignores the zone %: Focused and Cold add the same tokens (never for tokens)', () => {
    const tool = makeTool({ output: 5 });
    const focused = fireOnce(bar(tool, 23, 0)); // 23 of 60
    const cold = fireOnce(bar(tool, 23, 0, { window: 200 })); // 23 of 200
    expect(focused[1]).toMatchObject({ kind: 'damage', v: 7, d: { why: ['zone:focused'] } });
    expect(cold[1]).toMatchObject({ kind: 'damage', v: 5, d: { why: ['zone:cold'] } });
    expect(focused[2]).toMatchObject(tokens(5, 28, 0, 'output'));
    expect(cold[2]).toMatchObject(tokens(5, 28, 0, 'output'));
  });
});

describe('removal', () => {
  // [[S, N] before, remove, [S, N] after, delta]; B is 23
  type Case = [[number, number], number, [number, number], number];
  const cases: Case[] = [
    [[30, 6], 4, [30, 2], -4], // noise only
    [[30, 6], 10, [26, 0], -10], // noise first, then signal
    [[30, 6], 20, [23, 0], -13], // never below B
    [[23, 0], 5, [23, 0], 0], // nothing to remove: no event
  ];
  it.each(cases)('%j remove %i: %j (delta %i)', ([S, N], n, [S2, N2], v) => {
    const sim = bar(makeTool(), S, N);
    expect(removeTokens(sim, 't0', n)).toBe(Math.abs(v));
    expect(sim.agent.ctx).toMatchObject({ S: S2, N: N2 });
    expect(sim.events).toMatchObject(v === 0 ? [] : [tokens(v, S2, N2, 'removal')]);
  });

  it('negative output removes noise first, then signal, never below B', () => {
    const sim = bar(makeTool({ output: -4 }), 25, 3); // B 23
    const [tool] = sim.agent.tools;
    if (!tool) throw new Error('setup');
    addOutput(sim, tool);
    addOutput(sim, tool);
    expect(sim.events).toMatchObject([tokens(-4, 24, 0, 'removal'), tokens(-1, 23, 0, 'removal')]);
  });

  it('removeCtx removes the version value during the effects; the zone follows after', () => {
    const summarize = makeTool({
      weight: 4,
      output: 0,
      effects: [
        { do: 'removeCtx', v: [10, 14, 18] },
        { do: 'guard', v: [3, 5, 7] },
      ],
    });
    // B 24 of W 40; F 36 is Rot. v2 removes 14: 6 noise, then 6 signal down to B.
    const events = fireOnce(bar(summarize, 30, 6, { window: 40, version: 2 }));
    expect(kinds(events)).toEqual(['toolFired', 'tokens', 'guard', 'zoneChanged']);
    expect(events[1]).toMatchObject(tokens(-12, 24, 0, 'removal'));
    expect(events[2]).toMatchObject({ v: 5 }); // guard with the zone before: Rot, no %
    expect(events[3]).toMatchObject({ d: { from: 2, to: 1, F: 24, W: 40 } });
  });
});

describe('event order per activation', () => {
  it('toolFired, effect events, tokens, zoneChanged', () => {
    // B 41 of W 60 (68%, Focused); grep output 1 makes F 42 (70%): Rot.
    const events = fireOnce(bar(makeTool({ weight: 21 }), 41, 0));
    expect(kinds(events)).toEqual(['toolFired', 'damage', 'tokens', 'zoneChanged']);
    expect(events[1]).toMatchObject({ d: { zone: 1, why: ['zone:focused'] } }); // zone before
    expect(events[2]).toMatchObject(tokens(1, 42, 0, 'output'));
    expect(events[3]).toMatchObject({ kind: 'zoneChanged', d: { from: 1, to: 2, F: 42, W: 60 } });
  });

  it('the zone is recomputed once per activation, after the output tokens', () => {
    const tool = makeTool({ weight: 19, output: 3, effects: [{ do: 'removeCtx', v: 2 }] });
    const sim = bar(tool, 41, 1); // B 39, F 42 of 60: Rot
    const events = fireOnce(sim);
    // Removal to F 40 (Focused) and output back to F 43 (Rot): no zone flicker in the log.
    expect(kinds(events)).toEqual(['toolFired', 'tokens', 'tokens']);
    expect(events[1]).toMatchObject(tokens(-2, 40, 0, 'removal'));
    expect(events[2]).toMatchObject(tokens(3, 43, 0, 'output'));
    expect(sim.agent.ctx.zone).toBe('rot');
  });
});
