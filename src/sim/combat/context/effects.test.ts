import { describe, expect, it } from 'vitest';
import type { Accuracy, Status } from '../../../content/types/index.ts';
import type { CombatEvent } from '../../events.ts';
import { type FightSpec, fight, hitIntent, makeEnemy, makeTool } from '../../testing/builders.ts';
import { resolveCombat } from '../resolve.ts';
import { createSim } from '../state.ts';
import { chargeRate, enemyRate, toolRate } from '../status/charge.ts';

/** dmg, guard and heal 10 each; the agent starts at 20 of 40 Trust. */
const tri = (weight = 3) =>
  makeTool({
    weight,
    effects: [
      { do: 'dmg', v: 10 },
      { do: 'guard', v: 10 },
      { do: 'heal', v: 10 },
    ],
  });
const enemies = [makeEnemy({ sev: 100, cycle: [hitIntent(2, 1000)] })];

function firstActivation(spec: FightSpec): CombatEvent[] {
  const input = fight({ enemies, ...spec });
  const { events } = resolveCombat({ ...input, agent: { ...input.agent, trust: 20 } });
  const fired = events.find((e) => e.kind === 'toolFired')?.seq ?? -1;
  return events.slice(fired + 1, fired + 4);
}

const amounts = (spec: FightSpec) => firstActivation(spec).map((e) => [e.kind, e.v]);

describe('zone % in the damage formula', () => {
  it('Focused adds +20 to tool damage, Guardrails and healing', () => {
    // Default builder fight: B 23 of W 60 (38%).
    const [hit] = firstActivation({ tools: [tri()] });
    expect(hit).toMatchObject({ kind: 'damage', d: { pct: 20, zone: 1, why: ['zone:focused'] } });
    expect(amounts({ tools: [tri()] })).toEqual([
      ['damage', 12],
      ['guard', 12],
      ['heal', 12],
    ]);
  });

  it.each<[Accuracy, number]>([
    ['high', 9],
    ['normal', 8],
    ['low', 7],
  ])('Cold with %s accuracy turns 10 into %i for damage, guard and heal', (accuracy, n) => {
    const spec = { tools: [tri()], window: 200, accuracy }; // B 23 of 200: 11%
    const [hit] = firstActivation(spec);
    expect(hit).toMatchObject({ d: { zone: 0, why: ['zone:cold'] } });
    expect(amounts(spec)).toEqual([
      ['damage', n],
      ['guard', n],
      ['heal', n],
    ]);
  });

  it('Rot and enemy hits get no zone %', () => {
    const rot = { tools: [tri(10)], window: 40 }; // B 30 of 40: 75%
    expect(firstActivation(rot)[0]).toMatchObject({ d: { pct: 0, zone: 2, why: [] } });
    expect(amounts(rot).map(([, v]) => v)).toEqual([10, 10, 10]);
    const { events } = resolveCombat(fight({ enemies }));
    const enemyHit = events.find((e) => e.kind === 'damage' && e.src === 'e1');
    expect(enemyHit).toMatchObject({ v: 2, d: { pct: 0, zone: 1, why: [] } });
  });
});

describe('Rot charge rate', () => {
  const has =
    (...on: Status[]) =>
    (s: Status) =>
      on.includes(s);

  it('multiplies the rate by 70/100 (floor) after Haste and Slow, before Throttle and Stun', () => {
    // [add, statuses, rate in Rot]
    const cases: [number, Status[], number][] = [
      [100, [], 70],
      [101, [], 70], // 70.7 floors
      [5, [], 7], // clamp 10 first
      [130, ['haste'], 182],
      [101, ['slow'], 35],
      [100, ['stun'], 0],
      [100, ['throttle'], 0],
    ];
    for (const [add, on, rate] of cases) expect(chargeRate(add, has(...on), true)).toBe(rate);
  });

  it("slows the agent's tools in Rot only; enemies keep their rate", () => {
    const rot = createSim(fight({ tools: [makeTool({ weight: 10 })], window: 40 }), true);
    const [tool] = rot.agent.tools;
    const [enemy] = rot.enemies;
    if (!tool || !enemy) throw new Error('setup');
    expect([toolRate(rot.agent, tool), enemyRate(enemy)]).toEqual([70, 100]);
    rot.agent.ctx.zone = 'focused';
    expect(toolRate(rot.agent, tool)).toBe(100);
  });

  it('a Rot fight fires grep every 4300 ms while the Typo still acts every 3000 ms', () => {
    const input = fight({ tools: [makeTool({ weight: 10 })], window: 40 });
    const { events } = resolveCombat(input);
    const at = (kind: CombatEvent['kind']) => events.filter((e) => e.kind === kind).map((e) => e.t);
    expect(at('toolFired').slice(0, 2)).toEqual([4300, 8600]);
    expect(at('enemyActed').slice(0, 2)).toEqual([3000, 6000]);
  });
});
