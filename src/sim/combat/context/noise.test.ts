import { describe, expect, it, vi } from 'vitest';
import type { FightModifier, MemoryDef } from '../../../content/types/index.ts';
import { type FightSpec, fight, intent, makeEnemy, makeMemory } from '../../testing/builders.ts';
import { enemiesAct } from '../enemy/act.ts';
import { createSim, PROGRESS_PER_MS, type Sim } from '../state.ts';
import { resolveCombat } from '../tick/resolve.ts';
import type { CombatInput } from '../types.ts';
import { createCtx } from './ctx.ts';
import { updateZone } from './zone.ts';

// Pass-through spy: counts the fight-start overflow check (zone recomputation).
vi.mock('./zone.ts', async (importOriginal) => {
  const zone = await importOriginal<typeof import('./zone.ts')>();
  return { ...zone, updateZone: vi.fn(zone.updateZone) };
});

type Phase = 1 | 2 | 3;

/** The .gitignore memory as in content: passive noiseBlock 12, weight 1. */
const gitignore = makeMemory();

/** grep (B 23, +1 with .gitignore) in W 60 vs one enemy e1 of home phase `home`. */
function input(spec: FightSpec, home: Phase, memories: MemoryDef[] = []): CombatInput {
  const enemies = [makeEnemy({ homePhase: home })];
  return { ...fight({ ...spec, window: 60, enemies }), memories };
}

const withMods = (base: CombatInput, modifiers: FightModifier[]): CombatInput => ({
  ...base,
  modifiers,
});

/** e1 resolves a full `noise n` intent through the default hooks; returns the tokens events. */
function noise(sim: Sim, n: number) {
  const [enemy] = sim.enemies;
  if (!enemy) throw new Error('missing enemy');
  const cycle = [intent('drift', 1000, { verb: 'noise', n })];
  Object.assign(enemy, { def: { ...enemy.def, cycle } });
  enemy.progress = 1000 * PROGRESS_PER_MS;
  const from = sim.events.length;
  enemiesAct(sim);
  return sim.events.slice(from).filter((e) => e.kind === 'tokens');
}

/** The tokens deltas of one `noise n` intent. */
const noiseV = (sim: Sim, n: number) => noise(sim, n).map((e) => e.v);

describe('noise verb', () => {
  // [phase, home, Rot, .gitignore, n, n'] — n' = n x scale[phase] / scale[home], x2, - blockers
  const cases: [Phase, Phase, boolean, boolean, number, number][] = [
    [1, 1, false, false, 6, 6],
    [2, 1, false, false, 6, 7], // 6 x 125 / 100 = 7.5, floor
    [3, 1, false, false, 6, 9], // 6 x 150 / 100
    [2, 2, false, false, 6, 6], // home phase: unscaled
    [3, 2, false, false, 6, 7], // 6 x 150 / 125 = 7.2
    [2, 1, true, false, 3, 6], // floor(3.75) = 3, then x2 (x2 first would give 7)
    [1, 1, true, true, 9, 6], // 9 x2 = 18, then 12 blocked (blocking first would give 0)
    [3, 1, true, true, 6, 6], // 9 x2 = 18 - 12
  ];
  it.each(cases)('phase %i, home %i, Rot %s, .gitignore %s: noise %i adds %i to N', (...c) => {
    const [phase, home, rot, block, n, added] = c;
    const sim = createSim(input({ phase }, home, block ? [gitignore] : []), true);
    const { ctx } = sim.agent;
    if (rot) ctx.S = 45; // F 45 of 60: Rot
    updateZone(sim);
    expect(ctx.zone).toBe(rot ? 'rot' : 'focused');
    const S = ctx.S;
    const N = added;
    const d = { S, N, F: S + N, kind: 'noise' };
    expect(noise(sim, n)).toMatchObject([{ kind: 'tokens', src: 'e1', dst: 'ctx', v: added, d }]);
    expect(ctx.N).toBe(added);
  });

  it('a noise push into Rot changes the zone after N grows', () => {
    const sim = createSim(input({}, 1), true); // F 23 of 60
    expect(noise(sim, 19)).toHaveLength(1);
    expect(sim.events.at(-2)).toMatchObject({ kind: 'zoneChanged', v: 2, d: { F: 42 } });
  });
});

describe('blocker budget per fight', () => {
  it('a 12-token blocker absorbs only the first 12 noise across several injections', () => {
    const sim = createSim(input({}, 1, [gitignore]), true); // B 24 of 60, stays Focused
    const { ctx } = sim.agent;
    expect(ctx.block).toBe(12);
    const steps = [5, 5, 5, 5].map((n) => [noiseV(sim, n), ctx.N, ctx.block]);
    expect(steps).toEqual([
      [[], 0, 7],
      [[], 0, 2],
      [[3], 3, 0],
      [[5], 8, 0],
    ]);
  });
});

describe('fight-start modifiers', () => {
  const mods: FightModifier[] = [
    { mod: 'startNoise', tokens: 20 },
    { mod: 'startSignal', tokens: 5 },
  ];

  it('startSignal adds to S; startNoise goes through blockers into N', () => {
    const blocked = createCtx(withMods(input({}, 1, [gitignore]), mods));
    expect(blocked).toMatchObject({ B: 24, S: 29, N: 8, block: 0, zone: 'focused' });
    const open = createCtx(withMods(input({}, 1), mods));
    expect(open).toMatchObject({ B: 23, S: 28, N: 20, block: 0, zone: 'rot' }); // F 48
  });

  it('start noise spends the blocker budget, so later enemy noise is not blocked', () => {
    const sim = createSim(withMods(input({}, 1, [gitignore]), mods), true);
    expect(noiseV(sim, 5)).toEqual([5]);
    expect(sim.agent.ctx.N).toBe(13);
  });

  it('fightStart carries the modified bar, then the overflow check runs once', () => {
    const [start] = resolveCombat(withMods(input({}, 1, [gitignore]), mods)).events;
    expect(start).toMatchObject({ kind: 'fightStart', d: { B: 24, S: 29, N: 8, zone: 1 } });
    // No tools and a hit-only enemy: nothing else recomputes the zone in the whole fight.
    const overflow = withMods(input({ tools: [] }, 1), [{ mod: 'startNoise', tokens: 40 }]);
    vi.mocked(updateZone).mockClear();
    const { events } = resolveCombat(overflow);
    expect(events[0]).toMatchObject({ kind: 'fightStart', d: { B: 20, S: 20, N: 40, zone: 3 } });
    expect(updateZone).toHaveBeenCalledOnce();
  });
});
