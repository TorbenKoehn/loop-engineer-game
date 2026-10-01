// T034: passive custom hooks - double_first_resolve (step_by_step), context_noise_cut and
// throttle_shorter (lessons); T037: rot_no_slow and feedback_loop (skills). Real content is
// tested through the run in src/run/combat/combat.test.ts.
import { describe, expect, it } from 'vitest';
import type { Effect, Family, LessonDef } from '../../../content/types/index.ts';
import type { CombatEvent } from '../../events.ts';
import {
  fight,
  makeEnemy,
  makeRule,
  makeSkill,
  makeTool,
  withSkills,
} from '../../testing/builders.ts';
import { injectNoise } from '../context/noise.ts';
import { createSim, type EnemyRt, type ToolRt } from '../state.ts';
import { toolRate } from '../status/charge.ts';
import { applyStatus } from '../status/statuses.ts';
import { resolveCombat } from '../tick/resolve.ts';
import type { CombatInput } from '../types.ts';

const custom = (handler: string, args?: Record<string, number>): Effect =>
  args ? { do: 'custom', handler, args } : { do: 'custom', handler };
const lesson = (...then: Effect[]): LessonDef => ({
  id: 'l',
  family: 'Bugs',
  rules: [makeRule({ on: 'passive' }, then)],
});
const withLesson = (input: CombatInput, ...then: Effect[]): CombatInput => ({
  ...input,
  lessons: [lesson(...then)],
});
const kinds = (events: readonly CombatEvent[], kind: CombatEvent['kind']) =>
  events.filter((e) => e.kind === kind);

describe('double_first_resolve', () => {
  const doubled = withSkills(
    fight(),
    makeSkill('s', makeRule({ on: 'passive' }, [custom('double_first_resolve')])),
  );
  const { events } = resolveCombat(doubled);
  const fired = kinds(events, 'toolFired');
  const at = (kind: CombatEvent['kind'], t: number) =>
    kinds(events, kind).filter((e) => e.src === 't0' && e.t === t);

  it('the first tool activation of the fight resolves twice and is marked echo 1', () => {
    expect(fired[0]?.d).toEqual({ def: 'grep', version: 1, echo: 1 });
    expect(at('damage', 3000).map((e) => e.v)).toEqual([7, 7]); // grep 6, Focused +20%
  });

  it('the second copy adds its output too', () => {
    expect(at('tokens', 3000).map((e) => e.v)).toEqual([1, 1]);
  });

  it('later activations resolve once', () => {
    const t = fired[1]?.t ?? -1;
    expect(fired[1]?.d).toEqual({ def: 'grep', version: 1 });
    expect(at('damage', t)).toHaveLength(1);
  });
});

describe('context_noise_cut', () => {
  const noiseAdded = (family: Family, n: number): number[] => {
    const input = fight({ window: 200, enemies: [makeEnemy({ family })] });
    const sim = createSim(withLesson(input, custom('context_noise_cut', { pct: 25 })), true);
    injectNoise(sim, sim.enemies[0] as EnemyRt, n);
    return kinds(sim.events, 'tokens').map((e) => e.v ?? 0);
  };

  it('cuts noise from Context enemies by 25% (floor)', () => {
    expect(noiseAdded('Context', 8)).toEqual([6]);
    expect(noiseAdded('Context', 5)).toEqual([3]);
  });

  it('leaves other families alone', () => {
    expect(noiseAdded('Bugs', 8)).toEqual([8]);
  });
});

describe('throttle_shorter', () => {
  const applied = (src: 'e1' | 't0', ms: number, ...extra: Effect[]): number[] => {
    const cut = custom('throttle_shorter', { ms: 1000, min: 50 });
    const sim = createSim(withLesson(fight(), cut, ...extra), true);
    applyStatus(sim, src, sim.agent.tools[0] as ToolRt, { status: 'throttle', ms });
    return kinds(sim.events, 'statusOn').map((e) => e.v ?? 0);
  };

  it('enemy Throttles on a tool last 1000 ms less, min 50', () => {
    expect(applied('e1', 3000)).toEqual([2000]);
    expect(applied('e1', 1000)).toEqual([50]);
  });

  it('the cut comes before % duration mods', () => {
    expect(applied('e1', 3000, { do: 'mod', stat: 'throttleDurPct', v: -50 })).toEqual([1000]);
  });

  it('Throttle from a non-enemy source is not cut', () => {
    expect(applied('t0', 3000)).toEqual([3000]);
  });
});

describe('rot_no_slow', () => {
  const rateInRot = (...then: Effect[]): number => {
    const sim = createSim(withLesson(fight(), ...then), true);
    sim.agent.ctx.zone = 'rot';
    return toolRate(sim, sim.agent.tools[0] as ToolRt);
  };

  it('Rot no longer slows tools', () => {
    expect([rateInRot(), rateInRot(custom('rot_no_slow'))]).toEqual([70, 100]);
  });
});

describe('feedback_loop', () => {
  const tools = [makeTool({ cooldownMs: 3000 }), makeTool({ id: 'cat', cooldownMs: 1000 })];
  const loop = custom('feedback_loop', { ms: 1000 });
  const pipes = (...then: Effect[]) =>
    kinds(resolveCombat(withLesson(fight({ tools }), ...then)).events, 'pipe');

  it('the rightmost tool pipes 1000 ms into the leftmost tool', () => {
    expect(pipes()).toEqual([]);
    const first = pipes(loop)[0];
    expect([first?.t, first?.src, first?.dst, first?.v]).toEqual([1000, 't1', 't0', 1000]);
  });

  it('pipeMs mods lengthen the wrapped pipe', () => {
    const longer = pipes(loop, { do: 'mod', stat: 'pipeMs', v: 500 })[0];
    expect(longer?.v).toBe(1500);
  });
});
