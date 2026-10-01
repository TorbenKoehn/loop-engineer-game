import { describe, expect, it } from 'vitest';
import { fight } from '../../testing/builders.ts';
import { createSim } from '../state.ts';
import { updateZone } from './zone.ts';

/** An empty loadout with base weight 0: B = 0, so F can start Cold. */
function emptyBar(W: number) {
  const input = fight({ window: W, tools: [] });
  const model = { ...input.agent.model, baseWeight: 0 };
  return createSim({ ...input, agent: { ...input.agent, model } }, true);
}

describe('updateZone', () => {
  it.each([60, 100])('W %i: zoneChanged at 25%, 70% and F >= W with from, to, F and W', (W) => {
    const sim = emptyBar(W);
    const { ctx } = sim.agent;
    expect(ctx.zone).toBe('cold');
    const cold = (W * 25) / 100;
    const rot = (W * 70) / 100;
    // Fill through S and N alike: F = S + N.
    const fills: [number, number][] = [
      [cold - 1, 0],
      [cold - 1, 1],
      [rot - 1, 0],
      [rot - 2, 2],
      [W - 1, 0],
      [W - 5, 5],
      [cold - 1, 0],
    ];
    for (const [S, N] of fills) {
      ctx.S = S;
      ctx.N = N;
      updateZone(sim);
    }
    const changed = (from: number, to: number, F: number) => ({
      kind: 'zoneChanged',
      src: 'ctx',
      v: to,
      d: { from, to, F, W },
    });
    expect(sim.events).toMatchObject([
      changed(0, 1, cold),
      changed(1, 2, rot),
      changed(2, 3, W),
      changed(3, 0, cold - 1),
    ]);
    expect(ctx.zone).toBe('cold');
  });

  it('emits nothing while the zone stays the same', () => {
    const sim = emptyBar(60);
    for (const S of [0, 5, 14]) {
      sim.agent.ctx.S = S;
      updateZone(sim);
    }
    expect(sim.events).toEqual([]);
  });
});
