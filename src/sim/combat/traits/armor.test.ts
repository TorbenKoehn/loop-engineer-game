// T037: the Armor(layers, hp) trait (statuses.md "Enemy traits", combat.md "Damage formula").
import { describe, expect, it } from 'vitest';
import type { CombatEvent } from '../../events.ts';
import { fight, hitIntent, makeEnemy, makeTool } from '../../testing/builders.ts';
import { computeAmount, dealDamage } from '../damage.ts';
import { createSim } from '../state.ts';
import { enemyRate } from '../status/charge.ts';
import { ARMOR_STUN_MS } from './traits.ts';

type Of<K> = Extract<CombatEvent, { kind: K }>;
const of = <K extends CombatEvent['kind']>(events: readonly CombatEvent[], kind: K) =>
  events.filter((e): e is Of<K> => e.kind === kind);

const boss = makeEnemy({
  id: 'monolith',
  sev: 100,
  traits: [{ trait: 'armor', layers: 3, hp: 50 }],
  cycle: [hitIntent(1, 600_000)],
});
const edit = makeTool({ id: 'sed', tags: ['Edit', 'Shell'] }); // t0
const search = makeTool(); // t1: grep, Search + Shell

function setup() {
  const sim = createSim(fight({ tools: [edit, search], enemies: [boss] }), true);
  const enemy = sim.enemies[0];
  if (!enemy) throw new Error('setup');
  const hit = (src: 't0' | 't1' | 'sys', n: number, bypass = false) =>
    dealDamage(sim, src, enemy, { ...computeAmount(n), ...(bypass && { bypass }) });
  return { sim, enemy, hit };
}

describe('Armor(3, 50)', () => {
  it('[Edit] damage counts 100% and other damage 50% (floor) against the current layer', () => {
    const { sim, enemy, hit } = setup();
    expect([hit('t0', 30), enemy.armor, enemy.sev]).toEqual([0, { layers: 3, hp: 20 }, 100]);
    expect([hit('t1', 15), enemy.armor]).toEqual([0, { layers: 3, hp: 13 }]);
    const dmg = of(sim.events, 'damage');
    expect(dmg.map((e) => [e.src, e.v, e.d.base, e.d.armor, e.d.sev])).toEqual([
      ['t0', 0, 30, 30, 100],
      ['t1', 0, 15, 7, 100],
    ]);
  });

  it('discards the excess; a break emits armorBroken and stuns the enemy 1500 ms', () => {
    const { sim, enemy, hit } = setup();
    enemy.guard = 10;
    hit('t0', 80);
    expect([enemy.armor, enemy.sev, enemy.guard]).toEqual([{ layers: 2, hp: 50 }, 100, 10]);
    const kinds = sim.events.map((e) => [e.kind, e.src, e.dst, e.v]);
    expect(kinds).toEqual([
      ['damage', 't0', 'e1', 0],
      ['armorBroken', 't0', 'e1', 0],
      ['statusOn', 't0', 'e1', ARMOR_STUN_MS],
    ]);
    expect(of(sim.events, 'armorBroken')[0]?.d).toEqual({ remaining: 2 });
    expect(of(sim.events, 'damage')[0]?.d.armor).toBe(50);
    expect(enemyRate(enemy)).toBe(0);
  });

  it('after the last layer, hits go to Guardrails and Severity; layer indexes count up', () => {
    const { sim, enemy, hit } = setup();
    for (let i = 0; i < 3; i++) hit('t0', 50);
    expect(enemy.armor).toEqual({ layers: 0, hp: 0 });
    const broken = of(sim.events, 'armorBroken').map((e) => [e.v, e.d.remaining]);
    expect(broken).toEqual([
      [0, 2],
      [1, 1],
      [2, 0],
    ]);
    enemy.guard = 5;
    expect([hit('t1', 20), enemy.guard, enemy.sev]).toEqual([15, 0, 85]);
    expect(of(sim.events, 'damage').at(-1)?.d.armor).toBe(0);
  });

  it('a 1-damage non-Edit hit does nothing; Deadline damage bypasses armor', () => {
    const { enemy, hit } = setup();
    expect([hit('t1', 1), enemy.armor]).toEqual([0, { layers: 3, hp: 50 }]);
    expect([hit('sys', 4, true), enemy.armor, enemy.sev]).toEqual([4, { layers: 3, hp: 50 }, 96]);
  });

  it('enemies without the trait carry no armor', () => {
    const sim = createSim(fight(), false);
    expect(sim.enemies.map((e) => [e.armor, e.stage])).toEqual([[{ layers: 0, hp: 0 }, -1]]);
  });
});
