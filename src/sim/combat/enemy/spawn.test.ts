import { describe, expect, it } from 'vitest';
import type { EnemyDef } from '../../../content/types/index.ts';
import { fight, hitIntent, intent, makeEnemy } from '../../testing/builders.ts';
import { createSim, type Sim } from '../state.ts';
import { resolveCombat } from '../tick/resolve.ts';
import { enemiesAct } from './act.ts';
import { MAX_ENEMIES, type SpawnVerb } from './spawn.ts';

const sideQuest = makeEnemy({ id: 'side_quest', sev: 30, cycle: [hitIntent(3, 2500)] });

const spawner = (v: Partial<SpawnVerb> = {}) => {
  const verb: SpawnVerb = { verb: 'spawn', enemy: 'side_quest', max: 9, ...v };
  return makeEnemy({ id: 'yak', sev: 200, cycle: [intent('another', 1000, verb)] });
};

function setup(v: Partial<SpawnVerb> = {}, line: EnemyDef[] = [], phase: 1 | 2 | 3 = 1): Sim {
  return createSim(fight({ enemies: [spawner(v), ...line], spawnDefs: [sideQuest], phase }), true);
}

/** Resolves the spawner's intent once; returns the spawn events. */
function act(sim: Sim) {
  const yak = sim.enemies.find((e) => e.uid === 1);
  if (!yak) throw new Error('missing spawner');
  yak.progress = 1000 * 100;
  const from = sim.events.length;
  enemiesAct(sim);
  return sim.events.slice(from).filter((e) => e.kind === 'spawn');
}

const DROPPED = { kind: 'spawn', src: 'e1', v: 0, d: { def: 'side_quest', index: -1 } };

describe('spawn verb', () => {
  it('inserts the spawn at the back by default and announces its intent', () => {
    const sim = setup({}, [makeEnemy()]);
    const [spawn] = act(sim);
    expect(spawn).toMatchObject({
      src: 'e1',
      dst: 'e3',
      v: 30,
      d: { def: 'side_quest', index: 2, reason: 'intent' },
    });
    expect(sim.enemies.map((e) => e.def.id)).toEqual(['yak', 'typo', 'side_quest']);
    const announced = sim.events.filter((e) => e.kind === 'intentSet').map((e) => [e.src, e.v]);
    expect(announced).toEqual([
      ['e3', 2500],
      ['e1', 1000],
    ]);
  });

  it('inserts at the front with `at: front` and scales Severity to the phase', () => {
    const sim = setup({ at: 'front' }, [], 2);
    expect(act(sim)).toMatchObject([{ dst: 'e2', v: 51, d: { index: 0 } }]);
    expect(sim.enemies.map((e) => e.uid)).toEqual([2, 1]);
  });

  it('respects max living copies and logs dropped spawns', () => {
    const sim = setup({ max: 2 });
    expect(act(sim)).toMatchObject([{ dst: 'e2' }]);
    expect(act(sim)).toMatchObject([{ dst: 'e3' }]);
    const [dropped] = act(sim);
    expect(dropped).toMatchObject(DROPPED);
    expect(dropped?.dst).toBeUndefined();
    const first = sim.enemies.find((e) => e.uid === 2);
    if (first) first.sev = 0; // a dead copy no longer counts
    expect(act(sim)).toMatchObject([{ dst: 'e4' }]);
  });

  it('respects perFight and maxOthers', () => {
    const perFight = setup({ perFight: 1 });
    act(perFight);
    for (const e of perFight.enemies) if (e.uid !== 1) e.sev = 0;
    expect(act(perFight)).toMatchObject([DROPPED]);
    const crowded = setup({ maxOthers: 2 }, [makeEnemy()]);
    expect(act(crowded)).toMatchObject([{ dst: 'e3' }]);
    expect(act(crowded)).toMatchObject([DROPPED]);
  });

  it(`never exceeds ${MAX_ENEMIES} living enemies; dead ones do not count`, () => {
    const sim = setup({}, [makeEnemy(), makeEnemy(), makeEnemy()]);
    expect(act(sim)).toMatchObject([{ dst: 'e5' }]);
    expect(act(sim)).toMatchObject([DROPPED]);
    expect(sim.enemies).toHaveLength(MAX_ENEMIES);
    const [, typo] = sim.enemies;
    if (typo) typo.sev = 0;
    expect(act(sim)).toMatchObject([{ dst: 'e6' }]);
  });

  it('throws on an enemy that is not in the encounter defs', () => {
    const sim = createSim(fight({ enemies: [spawner()] }), true);
    expect(() => act(sim)).toThrow(/side_quest/);
  });

  it('a spawn acts only from the next tick on', () => {
    const input = fight({
      tools: [],
      enemies: [spawner({ max: 1, at: 'front' })],
      spawnDefs: [sideQuest],
    });
    const { events } = resolveCombat(input);
    const quest = events.filter((e) => e.kind === 'enemyActed' && e.src === 'e2');
    expect(quest.map((e) => e.t).slice(0, 2)).toEqual([3500, 6000]);
  });
});
