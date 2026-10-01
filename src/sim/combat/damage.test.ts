import { describe, expect, it } from 'vitest';
import { fight, makeEnemy } from '../testing/builders.ts';
import { computeAmount, dealDamage, MIN_PCT, type Mod } from './damage.ts';
import { createSim, type EnemyRt } from './state.ts';

const sim = () => createSim(fight({ enemies: [makeEnemy(), makeEnemy()] }), true);
const front = (s: ReturnType<typeof sim>): EnemyRt => {
  const [enemy] = s.enemies;
  if (!enemy) throw new Error('no enemy');
  return enemy;
};

describe('damage formula', () => {
  // [base, mods, expected amount]: max(1, floor(((base + flat) * (100 + pct) + 50) / 100))
  const flat = (n: number): Mod => ({ id: `flat${n}`, flat: n });
  const pct = (n: number): Mod => ({ id: `pct${n}`, pct: n });
  const cases: [number, Mod[], number][] = [
    [6, [], 6],
    [6, [flat(2), pct(50)], 12], // 8 * 150 + 50 = 1250 -> 12
    [10, [pct(25)], 13], // 12.5 rounds half up
    [7, [pct(15)], 8], // 8.05 -> 8
    [9, [pct(-50)], 5], // 4.5 rounds half up
    [50, [pct(-70), pct(-50)], 5], // -120 floored at -90: 50 * 10 + 50 = 550 -> 5
    [1, [pct(-90)], 1], // 0.1 -> 0 -> min 1
    [3, [flat(-5)], 1], // negative sum -> min 1
  ];

  it.each(cases)('base %i with %j gives %i', (base, mods, amount) => {
    expect(computeAmount(base, mods).amount).toBe(amount);
  });

  it('reports flat, pct floored at -90 and why ids, flat adds before % mods', () => {
    const mods: Mod[] = [
      { id: 'prime:read_file', pct: 30 },
      { id: 'skill:a', flat: 2 },
      { id: 'skill:b', flat: 1, pct: -200 },
    ];
    expect(computeAmount(10, mods)).toEqual({
      base: 10,
      flat: 3,
      pct: MIN_PCT,
      amount: 1,
      why: ['skill:a', 'skill:b', 'prime:read_file'],
    });
  });
});

describe('Guardrails', () => {
  it('absorb before Severity; the damage event names every step', () => {
    const s = sim();
    const enemy = front(s);
    enemy.guard = 4;
    const mods: Mod[] = [
      { id: 'zone:focused', pct: 20 },
      { id: 'skill:x', flat: 2 },
    ];
    expect(dealDamage(s, 't0', enemy, computeAmount(8, mods))).toBe(8);
    expect(enemy).toMatchObject({ guard: 0, sev: 22 });
    expect(s.events.at(-1)).toEqual({
      seq: 0,
      t: 0,
      kind: 'damage',
      src: 't0',
      dst: 'e1',
      v: 8,
      d: {
        base: 8,
        flat: 2,
        pct: 20,
        armor: 0,
        guard: 4,
        sev: 22,
        zone: 1, // the builder fight starts Focused
        why: ['skill:x', 'zone:focused'],
      },
    });
  });

  it('absorb before Trust and keep the rest', () => {
    const s = sim();
    s.agent.guard = 10;
    expect(dealDamage(s, 'e1', s.agent, computeAmount(4))).toBe(0);
    expect(s.agent).toMatchObject({ guard: 6, trust: 40, taken: 0 });
    expect(s.events.at(-1)).toMatchObject({ dst: 'a', v: 0, d: { guard: 4, sev: 40 } });
  });

  it('discard overkill on enemies and on the agent', () => {
    const s = sim();
    const enemy = front(s);
    enemy.sev = 5;
    expect(dealDamage(s, 't2', enemy, computeAmount(20))).toBe(5);
    expect(enemy).toMatchObject({ sev: 0, killedBy: 't2' });
    expect(s.enemies[1]?.sev).toBe(30);
    s.agent.trust = 3;
    s.agent.guard = 2;
    expect(dealDamage(s, 'e2', s.agent, computeAmount(10))).toBe(3);
    expect(s.agent).toMatchObject({ trust: 0, guard: 0, taken: 3 });
  });
});
