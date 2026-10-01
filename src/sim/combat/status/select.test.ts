import { describe, expect, it } from 'vitest';
import type { CombatEvent } from '../../events.ts';
import { fight, makeEnemy, makeTool } from '../../testing/builders.ts';
import { applyEffects } from '../effects.ts';
import { createSim, type Sim, type ToolRt, toolRef } from '../state.ts';
import { pickTools, type ToolPick } from './select.ts';
import { applyStatus } from './statuses.ts';

/** Tools with the given cooldowns; slot 1 is [Edit], the rest [Search, Shell]. */
const line = (...cooldowns: number[]) => {
  const tools = cooldowns.map((cooldownMs, i) =>
    makeTool({ id: `t${i}`, cooldownMs, ...(i === 1 ? { tags: ['Edit'] } : {}) }),
  );
  return createSim(fight({ tools, enemies: [makeEnemy(), makeEnemy()] }), true);
};
const slot = (sim: Sim, i: number): ToolRt => {
  const tool = sim.agent.tools[i];
  if (!tool) throw new Error(`no tool ${i}`);
  return tool;
};
const picks = (sim: Sim, sel: ToolPick) => pickTools(sim, sel).map(toolRef);
const throttle = (sim: Sim, i: number) =>
  applyStatus(sim, 'e1', slot(sim, i), { status: 'throttle', ms: 1000 });

describe('tool selectors', () => {
  it('leftmost, rightmost, tag and all', () => {
    const sim = line(3000, 2000, 4000);
    expect(picks(sim, 'leftmost')).toEqual(['t0']);
    expect(picks(sim, 'rightmost')).toEqual(['t2']);
    expect(picks(sim, { tag: 'Search' })).toEqual(['t0', 't2']);
    expect(picks(sim, { tag: 'Web' })).toEqual([]);
    expect(picks(sim, 'all')).toEqual(['t0', 't1', 't2']);
  });

  it('fastest: lowest cooldownMs x 100 / current rate, ties leftmost, rate 0 skipped', () => {
    const sim = line(3000, 2000, 2000);
    expect(picks(sim, 'fastest')).toEqual(['t1']);
    applyStatus(sim, 'e1', slot(sim, 0), { status: 'haste', ms: 1000 }); // 1500 ms
    expect(picks(sim, 'fastest')).toEqual(['t0']);
    throttle(sim, 0);
    expect(picks(sim, 'fastest')).toEqual(['t1']);
    throttle(sim, 1);
    expect(picks(sim, 'fastest')).toEqual(['t2']);
    applyStatus(sim, 'e1', sim.agent, { status: 'stun', ms: 1000 });
    expect(picks(sim, 'fastest')).toEqual([]);
  });

  it('longest remaining charge at the current rate, ties leftmost, rate 0 ranks highest', () => {
    const sim = line(3000, 4000, 4000);
    slot(sim, 1).progress = 1000 * 100;
    expect(picks(sim, 'longestCharge')).toEqual(['t2']); // 4000 ms left
    slot(sim, 2).progress = 1000 * 100;
    expect(picks(sim, 'longestCharge')).toEqual(['t0']); // 3000 = 3000: leftmost
    applyStatus(sim, 'e1', slot(sim, 0), { status: 'haste', ms: 1000 }); // 1500 ms left
    expect(picks(sim, 'longestCharge')).toEqual(['t1']);
    throttle(sim, 2);
    expect(picks(sim, 'longestCharge')).toEqual(['t2']);
  });
});

describe('status, clearStatus and charge effects', () => {
  const ofKind = (sim: Sim, kind: CombatEvent['kind']) => sim.events.filter((e) => e.kind === kind);

  it('one activation picks once: clear Throttle, then Haste the same tool', () => {
    const retry = makeTool({
      id: 'retry_with_backoff',
      target: 'tool',
      effects: [
        { do: 'clearStatus', status: 'throttle', sel: 'longestCharge' },
        { do: 'status', status: 'haste', ms: [2000, 3000, 4000], sel: 'longestCharge' },
      ],
    });
    const sim = createSim(fight({ tools: [retry, makeTool(), makeTool()] }), true);
    slot(sim, 2).progress = 2900 * 100;
    throttle(sim, 2); // 100 ms left at rate 100, but frozen
    applyEffects(sim, slot(sim, 0));
    expect(slot(sim, 2).statuses).toEqual([{ status: 'haste', remaining: 2000 }]);
    expect(ofKind(sim, 'statusOff')).toMatchObject([{ src: 't0', dst: 't2', v: 1000 }]);
  });

  it('charge adds ms x 100 to the right neighbour, capped at full, with a charge event', () => {
    const xargs = makeTool({
      id: 'xargs',
      target: 'rightTool',
      effects: [{ do: 'charge', ms: [1500, 2000, 2500], sel: 'rightTool' }],
    });
    const sim = createSim(fight({ tools: [xargs, makeTool()], version: 2 }), true);
    applyEffects(sim, slot(sim, 0));
    expect(slot(sim, 1).progress).toBe(2000 * 100);
    applyEffects(sim, slot(sim, 0));
    expect(slot(sim, 1).progress).toBe(3000 * 100);
    applyEffects(sim, slot(sim, 1)); // grep has no right neighbour and no charge effect
    expect(ofKind(sim, 'charge')).toEqual([
      { seq: 0, t: 0, kind: 'charge', src: 't0', dst: 't1', v: 2000, d: { cause: 'xargs' } },
      { seq: 1, t: 0, kind: 'charge', src: 't0', dst: 't1', v: 2000, d: { cause: 'xargs' } },
    ]);
  });

  it('status effects reach enemies, all tools, the agent; tool picks none', () => {
    const effects = [
      { do: 'status', status: 'stun', ms: 1000, sel: 'front' },
      { do: 'status', status: 'slow', ms: 1000, sel: 'tools' },
      { do: 'status', status: 'haste', ms: 1000, sel: { tag: 'Edit' } },
      { do: 'status', status: 'stun', ms: 1000, sel: 'self' },
      { do: 'status', status: 'stun', ms: 1000, sel: 'tool' },
      { do: 'charge', ms: 1000, sel: 'back' },
    ] as const;
    const sim = createSim(fight({ tools: [makeTool({ effects })], enemies: [makeEnemy()] }), true);
    applyEffects(sim, slot(sim, 0));
    expect(ofKind(sim, 'statusOn')).toMatchObject([
      { dst: 'e1', d: { status: 'stun' } },
      { dst: 't0', d: { status: 'slow' } },
      { dst: 'a', d: { status: 'stun' } },
    ]);
    expect(ofKind(sim, 'charge')).toEqual([]);
  });
});
