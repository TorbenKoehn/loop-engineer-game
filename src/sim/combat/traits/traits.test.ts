// T036: enemy traits Split, Grow, Outage and Blocked (statuses.md "Enemy traits").
import { describe, expect, it } from 'vitest';
import type { EnemyDef, Trait } from '../../../content/types/index.ts';
import type { CombatEvent } from '../../events.ts';
import {
  fight,
  hitIntent,
  makeEnemy,
  makeMemory,
  makeRule,
  makeSkill,
  makeTool,
  withSkills,
} from '../../testing/builders.ts';
import { computeAmount, dealDamage } from '../damage.ts';
import { createSim } from '../state.ts';
import { resolveDead } from '../tick/end.ts';
import { resolveCombat } from '../tick/resolve.ts';
import { tickTraits } from './traits.ts';

type Of<K> = Extract<CombatEvent, { kind: K }>;
const of = <K extends CombatEvent['kind']>(events: readonly CombatEvent[], kind: K, src?: string) =>
  events.filter((e): e is Of<K> => e.kind === kind && (!src || e.src === src));

/** An enemy that never acts within a test fight. */
const idle = (id: string, sev: number, traits: Trait[] = []): EnemyDef =>
  makeEnemy({ id, sev, traits, cycle: [hitIntent(1, 600_000)] });

const dep = idle('transitive_dep', 60);
const hell = idle('dependency_hell', 120, [
  { trait: 'split', n: 2, pct: 50, child: 'transitive_dep' },
]);

describe('Split(n, pct)', () => {
  it('spawns n children at the parent index at pct% of its max Severity', () => {
    const sim = createSim(
      fight({ enemies: [idle('a', 10), hell, idle('b', 10)], spawnDefs: [dep] }),
      true,
    );
    const parent = sim.enemies[1];
    if (parent) parent.sev = 0;
    resolveDead(sim);
    expect(sim.enemies.map((e) => [e.uid, e.def.id, e.sev, e.maxSev])).toEqual([
      [1, 'a', 10, 10],
      [4, 'transitive_dep', 60, 60],
      [5, 'transitive_dep', 60, 60],
      [3, 'b', 10, 10],
    ]);
    const spawns = of(sim.events, 'spawn').filter((e) => e.d.reason === 'split');
    expect(spawns.map((e) => [e.src, e.dst, e.v, e.d.index])).toEqual([
      ['e2', 'e4', 60, 1],
      ['e2', 'e5', 60, 2],
    ]);
    const kinds = sim.events.slice(-5).map((e) => [e.kind, e.src]);
    expect(kinds).toEqual([
      ['resolved', 'e2'],
      ['spawn', 'e2'],
      ['intentSet', 'e4'],
      ['spawn', 'e2'],
      ['intentSet', 'e5'],
    ]);
  });

  it('uses the phase-scaled max Severity of the parent (floor)', () => {
    const sim = createSim(fight({ enemies: [hell], spawnDefs: [dep], phase: 2 }), true);
    for (const e of sim.enemies) e.sev = 0;
    resolveDead(sim);
    expect(sim.enemies.map((e) => e.sev)).toEqual([102, 102]); // 120 x 1.7 = 204 -> 50%
  });

  it('respects the 5-enemy cap and logs dropped children', () => {
    const line = [idle('a', 9), idle('b', 9), idle('c', 9), idle('d', 9), hell];
    const sim = createSim(fight({ enemies: line, spawnDefs: [dep] }), true);
    const parent = sim.enemies[4];
    if (parent) parent.sev = 0;
    resolveDead(sim);
    expect(sim.enemies.map((e) => e.def.id)).toEqual(['a', 'b', 'c', 'd', 'transitive_dep']);
    const spawns = of(sim.events, 'spawn').filter((e) => e.d.reason === 'split');
    expect(spawns.map((e) => [e.dst, e.v, e.d.index])).toEqual([
      ['e6', 60, 4],
      [undefined, 0, -1],
    ]);
  });

  it('killing the last enemy does not win while its children live', () => {
    const tool = makeTool({ cooldownMs: 1000, target: 'all', effects: [{ do: 'dmg', v: 40 }] });
    const result = resolveCombat(fight({ tools: [tool], enemies: [hell], spawnDefs: [dep] }));
    const resolved = of(result.events, 'resolved').map((e) => [e.t, e.src]);
    expect(resolved).toEqual([
      [3000, 'e1'],
      [5000, 'e2'],
      [5000, 'e3'],
    ]);
    expect(result).toMatchObject({ outcome: 'win', endT: 5000 });
  });
});

describe('Grow(ms, sev, dmg)', () => {
  const creep = makeEnemy({
    id: 'scope_creep',
    sev: 100,
    traits: [{ trait: 'grow', ms: 4000, sev: 6, dmg: 1 }],
    cycle: [hitIntent(2, 3000, 'feature_request')],
  });
  const poke = makeTool({ cooldownMs: 4000, effects: [{ do: 'dmg', v: 1 }] });
  const every = makeRule({ on: 'every', ms: 4000 }, [{ do: 'guard', v: 1 }]);
  const input = withSkills(fight({ tools: [poke], enemies: [creep] }), makeSkill('tick', every));
  const { events } = resolveCombat(input);

  it('every ms: max and current Severity +sev and attack +dmg, with trait events', () => {
    const traits = of(events, 'trait').filter((e) => e.t <= 8000);
    expect(traits.map((e) => [e.t, e.src, e.v, e.d.trait, e.d.what])).toEqual([
      [4000, 'e1', 6, 'grow', 'sev'],
      [4000, 'e1', 1, 'grow', 'dmg'],
      [8000, 'e1', 6, 'grow', 'sev'],
      [8000, 'e1', 1, 'grow', 'dmg'],
    ]);
    const hits = of(events, 'damage', 'e1').filter((e) => e.t <= 9000);
    expect(hits.map((e) => [e.t, e.d.base])).toEqual([
      [3000, 2],
      [6000, 3],
      [9000, 4],
    ]);
    const sim = createSim(input, false);
    for (let t = 0; t < 8000; t += 50) tickTraits(sim);
    expect(sim.enemies.map((e) => [e.sev, e.maxSev, e.traitState.dmg])).toEqual([[112, 112, 2]]);
  });

  it('ticks in step 2: before every rules (same step) and tool fire (step 4)', () => {
    const at4000 = events.filter((e) => e.t === 4000).map((e) => e.kind);
    expect(at4000.slice(0, 4)).toEqual(['trait', 'trait', 'guard', 'toolFired']);
    const poked = of(events, 'damage', 't0')[0];
    expect([poked?.t, poked?.d.sev]).toEqual([4000, 105]); // 100 + 6 before the hit
  });
});

describe('Outage(tag)', () => {
  const unreachable = idle('unreachable_service', 15, [{ trait: 'outage', tag: 'Web' }]);
  const web = makeTool({ id: 'web_fetch', tags: ['Web'], cooldownMs: 1000, output: 2 });
  const shell = makeTool({ cooldownMs: 1000, target: 'back', effects: [{ do: 'dmg', v: 5 }] });
  const spec = { tools: [web, shell], enemies: [idle('typo', 1000), unreachable] };

  it('tools with the tag fire and add output but their effects do nothing while it lives', () => {
    const { events } = resolveCombat(fight(spec));
    expect(of(events, 'toolFired', 't0').length).toBeGreaterThan(4);
    expect(of(events, 'tokens', 't0')[0]).toMatchObject({ t: 1000, v: 2 });
    const timedOut = of(events, 'trait', 'e2');
    expect(timedOut.map((e) => [e.t, e.dst, e.d.trait, e.d.what])).toEqual([
      [1000, 't0', 'outage', 'timedOut'],
      [2000, 't0', 'outage', 'timedOut'],
      [3000, 't0', 'outage', 'timedOut'],
    ]);
    expect(of(events, 'resolved', 'e2')[0]?.t).toBe(3000);
    expect(of(events, 'damage', 't0')[0]?.t).toBe(4000);
  });

  it("Cache's web_ignores_outage hook exempts Web tools", () => {
    const cache = makeMemory([{ do: 'custom', handler: 'web_ignores_outage' }], { id: 'cache' });
    const { events } = resolveCombat({ ...fight(spec), memories: [cache] });
    expect(of(events, 'trait')).toEqual([]);
    expect(of(events, 'damage', 't0')[0]?.t).toBe(1000);
  });
});

describe('Blocked', () => {
  const yak = idle('yak_shave', 100, [{ trait: 'blocked' }]);

  it('takes 0 damage while any non-Blocked enemy lives', () => {
    const front = makeTool({ cooldownMs: 2000, effects: [{ do: 'dmg', v: 10 }] });
    const back = makeTool({ cooldownMs: 1000, target: 'back', effects: [{ do: 'dmg', v: 6 }] });
    const { events } = resolveCombat(
      fight({ tools: [front, back], enemies: [idle('task', 10), yak] }),
    );
    const onYak = of(events, 'damage', 't1').filter((e) => e.t <= 3000);
    expect(onYak.map((e) => [e.t, e.v, e.d.sev])).toEqual([
      [1000, 0, 100],
      [2000, 7, 93], // 6, Focused +20%; the task fell to t0 earlier in this step
      [3000, 7, 86],
    ]);
  });

  it('Guardrails stay untouched and Deadline damage still applies', () => {
    const input = fight({ tools: [], enemies: [idle('task', 500), yak], deadlineMs: 1000 });
    const sim = createSim(input, true);
    const [, blocked] = sim.enemies;
    if (!blocked) throw new Error('missing yak');
    blocked.guard = 5;
    expect(dealDamage(sim, 't0', blocked, computeAmount(9))).toBe(0);
    expect([blocked.guard, blocked.sev]).toEqual([5, 100]);
    const deadline = of(resolveCombat(input).events, 'damage', 'sys').filter((e) => e.t <= 2000);
    expect(deadline.map((e) => [e.t, e.dst, e.v])).toEqual([
      [2000, 'e1', 1],
      [2000, 'e2', 1],
      [2000, 'a', 1],
    ]);
  });

  it('only Blocked enemies left: they take damage', () => {
    const tool = makeTool({ cooldownMs: 1000, target: 'all', effects: [{ do: 'dmg', v: 3 }] });
    const twin = { ...yak, id: 'yak_twin' };
    const { events } = resolveCombat(fight({ tools: [tool], enemies: [yak, twin] }));
    const first = of(events, 'damage', 't0').filter((e) => e.t === 1000);
    expect(first.map((e) => [e.dst, e.v])).toEqual([
      ['e1', 4], // 3, Focused +20%
      ['e2', 4],
    ]);
  });
});
