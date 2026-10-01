import { describe, expect, it } from 'vitest';
import type { LessonDef, MemoryDef, SkillDef } from '../../../content/types/index.ts';
import { fight, makeTool } from '../../testing/builders.ts';
import { resolveCombat } from '../resolve.ts';
import type { CombatInput } from '../types.ts';
import { baseline, type Ctx, createCtx, WINDOW_MIN, zoneMods, zoneOf } from './ctx.ts';

const skill = (id: string, weight: number): SkillDef => ({
  id,
  rarity: 'common',
  weight,
  rules: [],
  unlock: 'base',
});
const memory = (id: string, weight: number): MemoryDef => ({ ...skill(id, weight) });
const lesson = (id: string): LessonDef => ({ id, family: 'Context', rules: [] });

/** context.md "Worked example": Terminal Purist (W 60, base 4) with "Be concise" (4). */
function purist(): CombatInput {
  const tools = [
    makeTool({ id: 'grep', weight: 3 }),
    makeTool({ id: 'cat', weight: 2 }),
    makeTool({ id: 'sed', weight: 4 }),
  ];
  const input = fight({ window: 60, tools });
  return {
    ...input,
    agent: { ...input.agent, model: { ...input.agent.model, baseWeight: 4 } },
    prompt: { ...input.prompt, id: 'be_concise', weight: 4 },
    skills: [skill('unix_philosophy', 3)],
  };
}

describe('context quantities', () => {
  it('baseline sums loadout weights', () => {
    const input = purist();
    expect(baseline(input)).toBe(20);
    // 20 / 60 = 33%: Focused.
    expect(createCtx(input)).toMatchObject({ W: 60, B: 20, S: 20, N: 0, zone: 'focused' });
    const more = { ...input, memories: [memory('m', 2)], lessons: [lesson('a'), lesson('b')] };
    expect(baseline(more)).toBe(24); // + memory weight + 1 per lesson
  });

  it('W never drops below 40', () => {
    expect(WINDOW_MIN).toBe(40);
    const W = (window: number) => createCtx(fight({ window })).W;
    expect([W(10), W(39), W(40), W(41), W(200)]).toEqual([40, 40, 40, 41, 200]);
  });

  it('fightStart carries W, B, S, N and the zone index', () => {
    const [start] = resolveCombat(purist()).events;
    expect(start).toMatchObject({ kind: 'fightStart', d: { W: 60, B: 20, S: 20, N: 0, zone: 1 } });
    // B 23 in a window clamped to 40: 57%, Focused.
    const [clamped] = resolveCombat(fight({ window: 20 })).events;
    expect(clamped).toMatchObject({ d: { W: 40, B: 23, S: 23, N: 0, zone: 1 } });
    // B 23 of 200: 11%, Cold.
    const [cold] = resolveCombat(fight({ window: 200 })).events;
    expect(cold).toMatchObject({ d: { W: 200, B: 23, zone: 0 } });
  });
});

describe('zoneOf', () => {
  // [W, F, zone] at the integer boundaries 25%, 70% and F >= W
  const cases: [number, number, Ctx['zone']][] = [
    [60, 0, 'cold'],
    [60, 14, 'cold'],
    [60, 15, 'focused'],
    [60, 41, 'focused'],
    [60, 42, 'rot'],
    [60, 59, 'rot'],
    [60, 60, 'overflow'],
    [60, 61, 'overflow'],
    [100, 24, 'cold'],
    [100, 25, 'focused'],
    [100, 69, 'focused'],
    [100, 70, 'rot'],
    [100, 99, 'rot'],
    [100, 100, 'overflow'],
    [41, 10, 'cold'], // 1000 < 1025
    [41, 11, 'focused'],
    [41, 28, 'focused'], // 2800 < 2870
    [41, 29, 'rot'],
  ];
  it.each(cases)('W %i, F %i is %s', (W, F, zone) => {
    expect(zoneOf(F, W)).toBe(zone);
  });
});

describe('zoneMods', () => {
  const ctx = (zone: Ctx['zone']): Ctx => {
    return { W: 60, B: 20, S: 20, N: 0, zone, coldPenalty: 35, block: 0 };
  };
  it('Focused +20, Cold minus the accuracy penalty, nothing in Rot or Overflow', () => {
    expect(zoneMods(ctx('focused'))).toEqual([{ id: 'zone:focused', pct: 20 }]);
    expect(zoneMods(ctx('cold'))).toEqual([{ id: 'zone:cold', pct: -35 }]);
    expect(zoneMods(ctx('rot'))).toEqual([]);
    expect(zoneMods(ctx('overflow'))).toEqual([]);
  });

  it('the Cold penalty comes from model accuracy: high 15, normal 25, low 35', () => {
    const penalty = (accuracy: 'high' | 'normal' | 'low') =>
      createCtx(fight({ accuracy })).coldPenalty;
    expect([penalty('high'), penalty('normal'), penalty('low')]).toEqual([15, 25, 35]);
  });
});
