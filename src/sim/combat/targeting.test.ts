import { describe, expect, it } from 'vitest';
import type { CombatEvent } from '../events.ts';
import { fight, makeEnemy, makeTool } from '../testing/builders.ts';
import { createSim } from './state.ts';
import { selectTargets, unitRef } from './targeting.ts';
import { resolveCombat } from './tick/resolve.ts';

/** A line of enemies with the given Severities, front to back. */
const line = (...sevs: number[]) =>
  createSim(fight({ enemies: sevs.map((sev) => makeEnemy({ sev, cycle: [] })) }), true);
const refs = (sim: ReturnType<typeof line>, sel: Parameters<typeof selectTargets>[1]) =>
  selectTargets(sim, sel).map(unitRef);

const damageAt = (events: readonly CombatEvent[], t: number) =>
  events.filter((e) => e.kind === 'damage' && e.t === t);

describe('target selectors', () => {
  it('front is the first living enemy', () => {
    const sim = line(30, 20, 10);
    expect(refs(sim, 'front')).toEqual(['e1']);
    const [first] = sim.enemies;
    if (first) first.sev = 0;
    expect(refs(sim, 'front')).toEqual(['e2']);
  });

  it('back is the last living enemy', () => {
    const sim = line(30, 20, 10);
    expect(refs(sim, 'back')).toEqual(['e3']);
    const last = sim.enemies.at(-1);
    if (last) last.sev = 0;
    expect(refs(sim, 'back')).toEqual(['e2']);
  });

  it('lowest is the lowest Severity, ties go to the frontmost', () => {
    expect(refs(line(30, 10, 20), 'lowest')).toEqual(['e2']);
    expect(refs(line(30, 10, 20, 10), 'lowest')).toEqual(['e2']);
  });

  it('all is every living enemy, front to back', () => {
    const sim = line(30, 20, 10);
    expect(refs(sim, 'all')).toEqual(['e1', 'e2', 'e3']);
    const [, second] = sim.enemies;
    if (second) second.sev = 0;
    expect(refs(sim, 'all')).toEqual(['e1', 'e3']);
  });

  it('self is the agent; tool selectors pick no combat target', () => {
    const sim = line(30);
    expect(refs(sim, 'self')).toEqual(['a']);
    expect(refs(sim, 'tools')).toEqual([]);
    expect(refs(line(), 'front')).toEqual([]);
    expect(refs(line(), 'lowest')).toEqual([]);
  });
});

// Builder fights start Focused: tool damage 6 lands as 7.
describe('targeting in a fight', () => {
  it('a back tool hits the last enemy', () => {
    const tool = makeTool({ target: 'back', effects: [{ do: 'dmg', v: 6 }] });
    const enemies = [makeEnemy({ cycle: [] }), makeEnemy({ cycle: [] })];
    const { events } = resolveCombat(fight({ tools: [tool], enemies }));
    expect(damageAt(events, 3000)).toMatchObject([{ src: 't0', dst: 'e2', v: 7 }]);
  });

  it('an all hit is computed separately per enemy, overkill stays with each', () => {
    const tool = makeTool({ target: 'all', effects: [{ do: 'dmg', v: 6 }] });
    const enemies = [4, 30, 6].map((sev) => makeEnemy({ sev, cycle: [] }));
    const result = resolveCombat(fight({ tools: [tool], enemies }));
    expect(damageAt(result.events, 3000)).toMatchObject([
      { dst: 'e1', v: 4, d: { sev: 0 } },
      { dst: 'e2', v: 7, d: { sev: 23 } },
      { dst: 'e3', v: 6, d: { sev: 0 } },
    ]);
    expect(damageAt(result.events, 6000).map((e) => e.dst)).toEqual(['e2']);
    expect(result.stats.toolDamage).toEqual([40]);
  });

  it('an effect target overrides the tool target; self-damage hits the agent', () => {
    const effects = [{ do: 'dmg', v: 6 } as const, { do: 'dmg', v: 2, target: 'self' } as const];
    const tool = makeTool({ target: 'front', effects });
    const result = resolveCombat(fight({ tools: [tool], enemies: [makeEnemy({ cycle: [] })] }));
    expect(damageAt(result.events, 3000)).toMatchObject([
      { src: 't0', dst: 'e1', v: 7 },
      { src: 't0', dst: 'a', v: 2, d: { sev: 38 } },
    ]);
    expect(result.stats).toEqual({ toolDamage: [30], damageTaken: 10 });
  });
});
