import { describe, expect, it } from 'vitest';
import type { Status } from '../../../content/types/index.ts';
import { fight, makeEnemy, makeTool } from '../../testing/builders.ts';
import { createSim, type EnemyRt, type Sim, type ToolRt } from '../state.ts';
import {
  applyStatus,
  clearStatus,
  type Holder,
  hasStatus,
  modDuration,
  STATUS_CAP_MS,
  tickStatuses,
} from './statuses.ts';

const setup = () => {
  const sim = createSim(fight({ tools: [makeTool(), makeTool()], enemies: [makeEnemy()] }), true);
  const [tool, other] = sim.agent.tools;
  const [enemy] = sim.enemies;
  if (!tool || !other || !enemy) throw new Error('missing units');
  return { sim, tool, other, enemy };
};
/** Applies `ms` values in turn; returns the remaining after each application. */
const stack = (sim: Sim, h: Holder, status: Status, ...ms: number[]) =>
  ms.map((n) => {
    applyStatus(sim, 'e1', h, { status, ms: n });
    return h.statuses.find((s) => s.status === status)?.remaining;
  });

describe('stacking and caps', () => {
  it('Haste and Slow add duration up to 10 000 ms', () => {
    const { sim, tool, enemy } = setup();
    expect(stack(sim, tool, 'haste', 4000, 3000, 6000)).toEqual([4000, 7000, 10_000]);
    expect(stack(sim, enemy, 'slow', 2000, 2500, 9000)).toEqual([2000, 4500, 10_000]);
    expect(STATUS_CAP_MS.haste).toBe(10_000);
  });

  it('Throttle and Stun take the longer remaining', () => {
    const { sim, tool, enemy } = setup();
    expect(stack(sim, tool, 'throttle', 3000, 2000, 4000)).toEqual([3000, 3000, 4000]);
    expect(stack(sim, enemy, 'stun', 2000, 1000, 2500)).toEqual([2000, 2000, 2500]);
  });

  it('Throttle caps at 10 000 ms and Stun at 5000 ms', () => {
    const { sim, tool, enemy } = setup();
    expect(stack(sim, tool, 'throttle', 12_000)).toEqual([10_000]);
    expect(stack(sim, enemy, 'stun', 8000, 6000)).toEqual([5000, 5000]);
    expect(stack(sim, sim.agent, 'stun', 7000)).toEqual([5000]);
  });

  it('statusOn carries the applied ms as v, status and remaining after stacking', () => {
    const { sim, tool } = setup();
    stack(sim, tool, 'haste', 4000, 3000);
    expect(sim.events.at(-1)).toEqual({
      seq: 1,
      t: 0,
      kind: 'statusOn',
      src: 'e1',
      dst: 't0',
      v: 3000,
      d: { status: 'haste', remaining: 7000 },
    });
  });

  it('agent-wide Haste, Slow and Throttle go to every tool; Stun stays on the agent', () => {
    const { sim, tool, other } = setup();
    applyStatus(sim, 't0', sim.agent, { status: 'haste', ms: 2000 });
    applyStatus(sim, 't0', sim.agent, { status: 'stun', ms: 1000 });
    expect(sim.events.map((e) => e.dst)).toEqual(['t0', 't1', 'a']);
    expect([hasStatus(tool, 'haste'), hasStatus(other, 'haste')]).toEqual([true, true]);
    expect([hasStatus(sim.agent, 'haste'), hasStatus(sim.agent, 'stun')]).toEqual([false, true]);
  });
});

describe('duration modifiers', () => {
  it('a 50% modifier shortens a Throttle with floor and a 50 ms minimum', () => {
    expect(modDuration(3000, 50)).toBe(1500);
    expect(modDuration(1001, 50)).toBe(500); // 500.5 floors
    expect(modDuration(75, 50)).toBe(50); // 37 -> min 50
    expect(modDuration(2000)).toBe(2000);
    const { sim, tool } = setup();
    applyStatus(sim, 'e1', tool, { status: 'throttle', ms: 3001, mod: 50 });
    expect(sim.events.at(-1)).toMatchObject({
      v: 1500,
      d: { status: 'throttle', remaining: 1500 },
    });
  });
});

describe('timers', () => {
  const remaining = (h: ToolRt | EnemyRt) => h.statuses.map((s) => [s.status, s.remaining]);

  it('lose 50 ms per tick and expire at <= 0 with statusOff, agent, tools, then enemies', () => {
    const { sim, tool, enemy } = setup();
    applyStatus(sim, 't0', enemy, { status: 'stun', ms: 50 });
    applyStatus(sim, 'e1', tool, { status: 'slow', ms: 100 });
    applyStatus(sim, 'e1', tool, { status: 'throttle', ms: 50 });
    applyStatus(sim, 'e1', sim.agent, { status: 'stun', ms: 50 });
    sim.t = 50;
    tickStatuses(sim);
    expect(remaining(tool)).toEqual([['slow', 50]]);
    expect(enemy.statuses).toEqual([]);
    const offs = sim.events.filter((e) => e.kind === 'statusOff');
    expect(offs.map((e) => [e.t, e.src, e.dst, e.v, e.d])).toEqual([
      [50, 'sys', 'a', 0, { status: 'stun', remaining: 0 }],
      [50, 'sys', 't0', 0, { status: 'throttle', remaining: 0 }],
      [50, 'sys', 'e1', 0, { status: 'stun', remaining: 0 }],
    ]);
    tickStatuses(sim);
    expect(tool.statuses).toEqual([]);
  });

  it('clearStatus removes a status early with the ms cut short as v', () => {
    const { sim, tool } = setup();
    applyStatus(sim, 'e1', tool, { status: 'throttle', ms: 3000 });
    clearStatus(sim, 't1', tool, 'throttle');
    clearStatus(sim, 't1', tool, 'throttle');
    expect(tool.statuses).toEqual([]);
    expect(sim.events).toHaveLength(2);
    expect(sim.events.at(-1)).toMatchObject({ kind: 'statusOff', src: 't1', dst: 't0', v: 3000 });
  });
});
