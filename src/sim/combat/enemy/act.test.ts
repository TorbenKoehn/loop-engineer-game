import { describe, expect, it } from 'vitest';
import type { CombatEvent } from '../../events.ts';
import { fight, hitIntent, intent, makeEnemy, makeTool } from '../../testing/builders.ts';
import { createSim } from '../state.ts';
import { resolveCombat } from '../tick/resolve.ts';
import { enemiesAct } from './act.ts';

type Of<K> = Extract<CombatEvent, { kind: K }>;
const of = <K extends CombatEvent['kind']>(events: readonly CombatEvent[], kind: K, until = 1e9) =>
  events.filter((e): e is Of<K> => e.kind === kind && e.t <= until);

describe('intent cycle', () => {
  const enemy = makeEnemy({
    sev: 1000,
    opening: [intent('warmup', 1000, { verb: 'guard', n: 1 })],
    cycle: [hitIntent(1, 2000, 'jab'), hitIntent(2, 1500, 'cross')],
  });
  const { events } = resolveCombat(fight({ tools: [], enemies: [enemy], deadlineMs: 1000 }));

  it('resolves the opening once, then repeats the cycle with enemyActed events', () => {
    const acted = of(events, 'enemyActed', 8000).map((e) => [e.t, e.src, e.d.intent]);
    expect(acted).toEqual([
      [1000, 'e1', 'warmup'],
      [3000, 'e1', 'jab'],
      [4500, 'e1', 'cross'],
      [6500, 'e1', 'jab'],
      [8000, 'e1', 'cross'],
    ]);
  });

  it('announces each next intent with intentSet (v windupMs, ix in opening ++ cycle)', () => {
    const set = of(events, 'intentSet', 6500).map((e) => [e.t, e.v, e.d.intent, e.d.ix]);
    expect(set).toEqual([
      [0, 1000, 'warmup', 0],
      [1000, 2000, 'jab', 1],
      [3000, 1500, 'cross', 2],
      [4500, 2000, 'jab', 1],
      [6500, 1500, 'cross', 2],
    ]);
    const acted = of(events, 'enemyActed', 1000)[0];
    const next = of(events, 'intentSet', 1000)[1];
    expect(acted && next && acted.seq < next.seq).toBe(true);
  });

  it('resets progress without carry-over and waits below the windup', () => {
    const sim = createSim(fight({ tools: [], enemies: [enemy, makeEnemy()] }), true);
    const [first, second] = sim.enemies;
    if (!first || !second) throw new Error('missing enemies');
    first.progress = 1000 * 100 + 700;
    second.progress = 3000 * 100 - 1;
    enemiesAct(sim);
    expect([first.progress, first.intentIx]).toEqual([0, 1]);
    expect([second.progress, second.intentIx]).toEqual([3000 * 100 - 1, 0]);
    expect(of(sim.events, 'enemyActed').map((e) => e.src)).toEqual(['e1']);
  });

  it('a resolved enemy or one without intents does not act', () => {
    const sim = createSim(
      fight({ tools: [], enemies: [makeEnemy({ cycle: [] }), makeEnemy()] }),
      true,
    );
    for (const e of sim.enemies) e.progress = 10_000 * 100;
    const [, typo] = sim.enemies;
    if (typo) typo.sev = 0;
    enemiesAct(sim);
    expect(sim.agent.trust).toBe(40);
  });
});

describe('phase scaling', () => {
  const brute = (homePhase: 1 | 2 | 3, sev: number) =>
    makeEnemy({ homePhase, sev, cycle: [hitIntent(7, 1000)] });
  const firstHit = (phase: 1 | 2 | 3, homePhase: 1 | 2 | 3, sev: number) => {
    const { events } = resolveCombat(fight({ tools: [], phase, enemies: [brute(homePhase, sev)] }));
    const spawn = of(events, 'spawn')[0];
    const hit = of(events, 'damage')[0];
    return [spawn?.v, hit?.v, hit?.d.base];
  };

  it('a homePhase-1 enemy in phase 2 has Severity x170/100 and damage x150/100 (floor)', () => {
    const sim = createSim(fight({ phase: 2, enemies: [brute(1, 30)] }), true);
    expect(sim.enemies[0]).toMatchObject({ sev: 51, maxSev: 51 });
    expect(firstHit(2, 1, 30)).toEqual([51, 10, 10]); // 7 x 150 / 100 = 10.5 -> 10
  });

  it('scales by the ratio to the home phase and never down', () => {
    expect(firstHit(3, 2, 100)).toEqual([152, 9, 9]); // 100 x 260/170, 7 x 210/150
    expect(firstHit(3, 1, 100)).toEqual([260, 14, 14]);
    expect(firstHit(1, 1, 30)).toEqual([30, 7, 7]);
    expect(firstHit(1, 2, 30)).toEqual([30, 7, 7]);
  });
});

describe('agent acts before enemies in the same tick', () => {
  const duel = (sev: number) =>
    resolveCombat(fight({ enemies: [makeEnemy({ sev, cycle: [hitIntent(5, 3000)] })] }));

  it('a tool and an intent due in the same tick: the tool fires first', () => {
    const { events } = duel(100);
    const fired = of(events, 'toolFired', 3000)[0];
    const acted = of(events, 'enemyActed', 3000)[0];
    expect([fired?.t, acted?.t]).toEqual([3000, 3000]);
    expect(fired && acted && fired.seq < acted.seq).toBe(true);
  });

  it('an enemy resolved by that tool never acts', () => {
    const result = duel(6);
    expect(result).toMatchObject({ outcome: 'win', endT: 3000 });
    expect(of(result.events, 'enemyActed')).toEqual([]);
    expect(result.agentAfter.trust).toBe(40);
  });

  it('holds for a later enemy in the line too', () => {
    const line = [makeEnemy({ sev: 100 }), makeEnemy({ sev: 100, cycle: [hitIntent(5, 1000)] })];
    const tool = makeTool({ cooldownMs: 1000, target: 'back' });
    const { events } = resolveCombat(fight({ tools: [tool], enemies: line }));
    const at1000 = events.filter((e) => e.t === 1000).map((e) => e.kind);
    expect(at1000.indexOf('toolFired')).toBeLessThan(at1000.indexOf('enemyActed'));
  });
});
