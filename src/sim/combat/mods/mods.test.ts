// T033: every combat ModStat changes its number through the collected passive mods; filters
// by tag, tool, weight and family; flat before percent; each applied mod is in the why list.
import { describe, expect, it } from 'vitest';
import type {
  Cond,
  Effect,
  Filter,
  LessonDef,
  ModStat,
  SystemPromptDef,
} from '../../../content/types/index.ts';
import type { CombatEvent } from '../../events.ts';
import {
  fight,
  intent,
  makeEnemy,
  makeMemory,
  makeRule,
  makeSkill,
  makeTool,
  withSkills,
} from '../../testing/builders.ts';
import { resolveCombat } from '../resolve.ts';
import { createSim } from '../state.ts';
import { toolRate } from '../status/charge.ts';
import { applyStatus } from '../status/statuses.ts';
import type { CombatInput } from '../types.ts';

const mod = (stat: ModStat, v: number, filter?: Filter): Effect =>
  filter ? { do: 'mod', stat, v, filter } : { do: 'mod', stat, v };
/** One weightless skill `m` (why id `skill:m`) with a passive rule holding `effects`. */
const withMods = (input: CombatInput, ...effects: Effect[]) =>
  withSkills(input, makeSkill('m', makeRule({ on: 'passive' }, effects)));
const withCond = (input: CombatInput, effect: Effect, cond: Cond) =>
  withSkills(input, makeSkill('m', makeRule({ on: 'passive' }, [effect], [cond])));
const ofKind = (events: readonly CombatEvent[], kind: CombatEvent['kind'], src?: string) =>
  events.filter((e) => e.kind === kind && (!src || e.src === src));
const firstDamage = (input: CombatInput, src = 't0') =>
  ofKind(resolveCombat(input).events, 'damage', src)[0];

const edit = makeTool({ id: 'edit_file', tags: ['Edit'], weight: 4 });
const lint = makeTool({
  id: 'lint',
  tags: ['Test'],
  target: 'self',
  effects: [{ do: 'guard', v: 5 }],
});

describe('collection', () => {
  it('collects once at fight start: trait, prompt, skills, memories, lessons in slot order', () => {
    const passive = () => makeRule({ on: 'passive' }, [mod('window', 1)]);
    const prompt: SystemPromptDef = {
      id: 'p',
      weight: 0,
      rules: [passive()],
      unlock: 'base',
      milestone: 1,
    };
    const lesson = { id: 'l', family: 'Bugs', rules: [passive()] } as LessonDef;
    const input: CombatInput = {
      ...withSkills(fight(), makeSkill('s', passive(), makeRule({ on: 'fightStart' }, []))),
      trait: { id: 't', rules: [passive()] },
      prompt,
      memories: [makeMemory([mod('window', 1)], { id: 'mem', weight: 0 })],
      lessons: [lesson],
    };
    const sim = createSim(input, true);
    const ids = ['trait:t', 'prompt:p', 'skill:s', 'memory:mem', 'lesson:l'];
    expect(sim.mods.map((m) => m.id)).toEqual(ids);
    expect(sim.agent.ctx.W).toBe(65); // window 60 + 5, fixed for the fight
  });
});

describe('tool stats', () => {
  it('rate adds to the harness speed per tool, filtered by weight', () => {
    const input = withMods(fight({ tools: [makeTool(), edit] }), mod('rate', 10, { maxWeight: 3 }));
    const sim = createSim(input, true);
    expect(sim.agent.tools.map((t) => toolRate(sim, t))).toEqual([110, 100]);
  });

  it('dmgPct is filtered by tag and named in the why list', () => {
    const input = withMods(
      fight({ tools: [makeTool(), edit] }),
      mod('dmgPct', 50, { tag: 'Edit' }),
    );
    expect(firstDamage(input, 't0')).toMatchObject({ d: { pct: 20, why: ['zone:focused'] } });
    expect(firstDamage(input, 't1')).toMatchObject({
      d: { pct: 70, why: ['zone:focused', 'skill:m'] },
    });
  });

  it('dmgFlat adds before percentages and is filtered by tool', () => {
    const effects = [mod('dmgFlat', 2, { tool: 'edit_file' }), mod('dmgPct', 50)];
    const input = withMods(fight({ tools: [makeTool(), edit] }), ...effects);
    // (6 + 2) x 170% = 13.6 -> 14; percent first would give 6 x 170% + 2 = 12.
    expect(firstDamage(input, 't1')).toMatchObject({
      v: 14,
      d: { base: 6, flat: 2, pct: 70, why: ['skill:m', 'zone:focused', 'skill:m'] },
    });
    expect(firstDamage(input, 't0')).toMatchObject({ d: { flat: 0, pct: 70 } });
  });

  it('damage mods skip Guardrails and healing; Focused still applies', () => {
    const { events } = resolveCombat(withMods(fight({ tools: [lint] }), mod('dmgPct', 50)));
    expect(ofKind(events, 'guard', 't0')[0]).toMatchObject({ v: 6 }); // 5 x 120%
  });

  it('a family filter applies only against enemies of that family', () => {
    const bugs = withMods(fight(), mod('dmgPct', 15, { family: 'Bugs' }));
    expect(firstDamage(bugs)).toMatchObject({ d: { pct: 35, why: ['zone:focused', 'skill:m'] } });
    const infra = withMods(
      fight({ enemies: [makeEnemy({ family: 'Infra' })] }),
      mod('dmgPct', 15, { family: 'Bugs' }),
    );
    expect(firstDamage(infra)).toMatchObject({ d: { pct: 20, why: ['zone:focused'] } });
  });

  it('output changes the tokens of matching tools (min 0)', () => {
    const tools = [makeTool({ output: 2 }), makeTool({ id: 'cat', output: 2 })];
    const input = withMods(
      fight({ tools }),
      mod('output', -1, { tool: 'cat' }),
      mod('output', -5, { tool: 'grep' }),
    );
    const tokens = ofKind(resolveCombat(input).events, 'tokens');
    expect(tokens[0]).toMatchObject({ src: 't1', v: 1 }); // grep: max(0, 2 - 5) = 0, no event
  });

  it('pipeMs lengthens existing pipes only', () => {
    const sed = makeTool({ id: 'sed', tags: ['Edit'] }); // 2 [Shell]: no POSIX breakpoint
    const tools = [makeTool({ pipeMs: 1000 }), makeTool({ id: 'cat' }), sed];
    const input = withMods(fight({ tools }), mod('pipeMs', 500));
    const pipes = ofKind(resolveCombat(input).events, 'pipe');
    expect(pipes[0]).toMatchObject({ src: 't0', dst: 't1', v: 1500 });
    expect(pipes.every((e) => e.src === 't0')).toBe(true);
  });

  it('conds hold at the activation: piped, and oncePerFight for the first activation', () => {
    const tools = [makeTool({ id: 'cat', pipeMs: 1000 }), makeTool()];
    const piped = withCond(fight({ tools }), mod('dmgPct', 30), { if: 'piped' });
    expect(firstDamage(piped, 't0')).toMatchObject({ d: { pct: 20 } });
    expect(firstDamage(piped, 't1')).toMatchObject({
      d: { pct: 50, why: ['zone:focused', 'skill:m'] },
    });
    const once = withCond(fight(), mod('dmgPct', 100), { if: 'oncePerFight' });
    const hits = ofKind(resolveCombat(once).events, 'damage', 't0');
    expect(hits.slice(0, 2).map((e) => e.d)).toMatchObject([{ pct: 120 }, { pct: 20 }]);
  });
});

describe('agent stats', () => {
  it('window and focusPct: W at fight start, the Focused bonus with its own why id', () => {
    const input = withMods(fight(), mod('window', -10), mod('focusPct', 10));
    const { events } = resolveCombat(input);
    expect(ofKind(events, 'fightStart')[0]).toMatchObject({ d: { W: 50, B: 23 } });
    expect(ofKind(events, 'damage', 't0')[0]).toMatchObject({
      v: 8, // 6 x 130% = 7.8
      d: { pct: 30, why: ['zone:focused', 'skill:m'] },
    });
  });

  it('noiseBlock absorbs enemy noise until the budget is spent', () => {
    const noisy = makeEnemy({ cycle: [intent('drift', 1000, { verb: 'noise', n: 5 })] });
    const input = {
      ...fight({ enemies: [noisy] }),
      memories: [makeMemory([mod('noiseBlock', 7)], { weight: 0 })],
    };
    const noise = ofKind(resolveCombat(input).events, 'tokens', 'e1');
    expect(noise.slice(0, 2).map((e) => e.v)).toEqual([3, 5]); // first 5 blocked (no event), then 2
  });

  it('throttleDurPct shortens Throttle and Slow on tools, not on enemies', () => {
    const sim = createSim(
      withMods(fight({ tools: [makeTool()] }), mod('throttleDurPct', -50)),
      true,
    );
    const [tool] = sim.agent.tools;
    const [enemy] = sim.enemies;
    if (!tool || !enemy) throw new Error('setup');
    applyStatus(sim, 'e1', tool, { status: 'throttle', ms: 3000 });
    applyStatus(sim, 'e1', sim.agent, { status: 'slow', ms: 2001 });
    applyStatus(sim, 't0', enemy, { status: 'slow', ms: 2000 });
    expect(ofKind(sim.events, 'statusOn').map((e) => e.v)).toEqual([1500, 1000, 2000]);
  });

  it('stunDurPct shortens Stun on the agent (enemy stun verb), min 50 ms', () => {
    const stunner = makeEnemy({ cycle: [intent('freeze', 1000, { verb: 'stun', ms: 2000 })] });
    const input = withMods(fight({ enemies: [stunner] }), mod('stunDurPct', -25));
    const stuns = ofKind(resolveCombat(input).events, 'statusOn', 'e1');
    expect(stuns[0]).toMatchObject({ dst: 'a', v: 1500 });
    const sim = createSim(withMods(fight(), mod('stunDurPct', -100)), true);
    applyStatus(sim, 'e1', sim.agent, { status: 'stun', ms: 2000 });
    expect(ofKind(sim.events, 'statusOn')[0]).toMatchObject({ v: 50 });
  });

  it('dmgTakenPct scales enemy hits by family (min 1); Deadline damage is unaffected', () => {
    const big = makeEnemy({ sev: 999, cycle: [intent('hit', 1000, { verb: 'hit', n: 10 })] });
    const effects = [
      mod('dmgTakenPct', -20, { family: 'Bugs' }),
      mod('dmgTakenPct', -100, { family: 'Infra' }),
    ];
    const input = withMods(fight({ tools: [], enemies: [big], deadlineMs: 1000 }), ...effects);
    const { events } = resolveCombat(input);
    expect(ofKind(events, 'damage', 'e1')[0]).toMatchObject({
      v: 8,
      d: { base: 10, pct: -20, why: ['skill:m'] },
    });
    expect(ofKind(events, 'damage', 'sys').find((e) => e.dst === 'a')).toMatchObject({
      v: 1,
      d: { pct: 0, why: [] },
    });
    const infra = {
      ...input,
      encounter: { ...input.encounter, enemies: [{ ...big, family: 'Infra' as const }] },
    };
    expect(ofKind(resolveCombat(infra).events, 'damage', 'e1')[0]).toMatchObject({
      v: 1,
      d: { pct: -90 },
    });
  });
});
