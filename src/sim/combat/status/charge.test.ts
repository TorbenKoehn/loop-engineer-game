import { describe, expect, it } from 'vitest';
import type { Status, ToolDef } from '../../../content/types/index.ts';
import type { CombatEvent } from '../../events.ts';
import { fight, makeEnemy, makeTool } from '../../testing/builders.ts';
import { resolveCombat } from '../resolve.ts';
import { createSim } from '../state.ts';
import { chargeAll, chargeRate, enemyRate, toolRate } from './charge.ts';
import { applyStatus } from './statuses.ts';

const has =
  (...on: Status[]) =>
  (s: Status) =>
    on.includes(s);

describe('charge rate formula', () => {
  // [add, statuses, rate]
  const cases: [number, Status[], number][] = [
    [100, [], 100],
    [5, [], 10], // clamp low
    [500, [], 400], // clamp high
    [400, ['haste'], 800], // Haste doubles after the clamp
    [130, ['haste'], 260],
    [101, ['slow'], 50], // floor
    [5, ['slow'], 5], // clamp 10, then /2
    [101, ['haste', 'slow'], 101], // x2 then /2 = x1
    [100, ['throttle'], 0],
    [100, ['stun'], 0],
    [100, ['haste', 'throttle'], 0], // Throttle overrides Haste
    [100, ['haste', 'stun'], 0],
  ];

  it.each(cases)('add %i with %j gives rate %i', (add, on, rate) => {
    expect(chargeRate(add, has(...on))).toBe(rate);
  });

  it('a Stun on the agent stops all tools; a Throttle stops only its tool', () => {
    const sim = createSim(fight({ tools: [makeTool(), makeTool()], speed: 150 }), true);
    const [a, b] = sim.agent.tools;
    if (!a || !b) throw new Error('no tools');
    applyStatus(sim, 'e1', a, { status: 'throttle', ms: 1000 });
    expect([toolRate(sim, a), toolRate(sim, b)]).toEqual([0, 150]);
    applyStatus(sim, 'e1', sim.agent, { status: 'stun', ms: 1000 });
    expect([toolRate(sim, a), toolRate(sim, b)]).toEqual([0, 0]);
  });

  it('enemies use base 100 with their own statuses', () => {
    const sim = createSim(fight({ enemies: [makeEnemy()] }), true);
    const [enemy] = sim.enemies;
    if (!enemy) throw new Error('no enemy');
    expect(enemyRate(enemy)).toBe(100);
    applyStatus(sim, 't0', enemy, { status: 'haste', ms: 1000 });
    expect(enemyRate(enemy)).toBe(200);
  });

  it('rate 0 keeps progress: charging resumes from where it stopped', () => {
    const sim = createSim(fight({ enemies: [makeEnemy()] }), true);
    const [tool] = sim.agent.tools;
    const [enemy] = sim.enemies;
    if (!tool || !enemy) throw new Error('no units');
    chargeAll(sim);
    expect([tool.progress, enemy.progress]).toEqual([5000, 5000]);
    applyStatus(sim, 'e1', tool, { status: 'throttle', ms: 500 });
    applyStatus(sim, 't0', enemy, { status: 'stun', ms: 500 });
    chargeAll(sim);
    expect([tool.progress, enemy.progress]).toEqual([5000, 5000]);
    tool.statuses = [];
    chargeAll(sim);
    expect(tool.progress).toBe(10_000);
  });
});

describe('status timers in the tick order', () => {
  const ofKind = (events: readonly CombatEvent[], kind: CombatEvent['kind']) =>
    events.filter((e) => e.kind === kind);
  /** Fires every 1000 ms and throttles the rightmost tool for 500 ms. */
  const stall: ToolDef = makeTool({
    id: 'stall',
    cooldownMs: 1000,
    target: 'tool',
    effects: [{ do: 'status', status: 'throttle', ms: 500, sel: 'rightmost' }],
  });
  const input = () =>
    fight({ tools: [stall, makeTool()], enemies: [makeEnemy({ sev: 999, cycle: [] })] });

  it('statusOn and statusOff carry status and remaining; expiry happens in step 1', () => {
    const { events } = resolveCombat(input());
    expect(ofKind(events, 'statusOn')[0]).toEqual({
      seq: expect.any(Number),
      t: 1000,
      kind: 'statusOn',
      src: 't0',
      dst: 't1',
      v: 500,
      d: { status: 'throttle', remaining: 500 },
    });
    const offs = ofKind(events, 'statusOff').slice(0, 4);
    expect(offs.map((e) => e.t)).toEqual([1500, 2500, 3500, 4500]);
    expect(offs[0]).toMatchObject({ src: 'sys', dst: 't1', v: 0, d: { remaining: 0 } });
    // grep charges 1000 ms, then 550 ms per second: the expiry tick (step 1) charges in
    // step 3 of the same tick. Progress is kept while throttled. Full at 4800 ms.
    const grep = ofKind(events, 'toolFired').filter((e) => e.src === 't1');
    expect(grep[0]?.t).toBe(4800);
  });
});
