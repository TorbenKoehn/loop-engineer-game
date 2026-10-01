import { describe, expect, expectTypeOf, it } from 'vitest';
import type { Effect, Trigger } from '../types/dsl.ts';
import {
  defineEncounter,
  defineEnemy,
  defineEvent,
  defineHarness,
  defineLesson,
  defineMemory,
  definePrompt,
  defineSkill,
  defineTool,
} from './define.ts';
import { deepFreeze } from './freeze.ts';
import { passive, rule } from './rule.ts';
import { base, unlockedBy } from './unlock.ts';

const tool = defineTool({
  id: 'grep',
  tags: ['Search', 'Shell'],
  rarity: 'common',
  weight: 3,
  cooldownMs: 3000,
  output: 1,
  pipeMs: 1000,
  target: 'front',
  effects: [{ do: 'dmg', v: [6, 9, 13] }],
  unlock: base,
  milestone: 1,
});

const grepFirst = defineSkill({
  id: 'grep_first',
  rarity: 'uncommon',
  weight: 3,
  unlock: base,
  rules: [
    rule({ on: 'toolFired', tag: 'Search' }, [{ do: 'prime', filter: { tag: 'Edit' }, pct: 50 }]),
  ],
});

const memory = defineMemory({
  id: 'keyboard_shortcuts',
  rarity: 'common',
  weight: 1,
  unlock: base,
  rules: [passive({ do: 'mod', stat: 'rate', v: 5 })],
});

const lesson = defineLesson({
  id: 'bugs_off',
  family: 'Bugs',
  rules: [passive({ do: 'mod', stat: 'dmgPct', v: 15 })],
});

const enemy = defineEnemy({
  id: 'dependency_hell',
  family: 'Process',
  homePhase: 1,
  sev: 120,
  traits: [{ trait: 'split', n: 2, pct: 50, child: 'transitive_dep' }],
  cycle: [{ id: 'version_conflict', windupMs: 4000, verbs: [{ verb: 'hit', n: 3 }] }],
  art: ['(dep)'],
});

const encounter = defineEncounter({
  id: 'p1e1',
  phase: 1,
  pool: 'easy',
  enemies: ['typo', 'typo', 'typo'],
  deadlineMs: 45000,
});

const harness = defineHarness({
  id: 'terminal_purist',
  model: { window: 60, speed: 110, accuracy: 'high', trust: 80, baseWeight: 4 },
  slots: { tools: 6, skills: 3, memory: 2, stash: 4 },
  tools: ['grep', 'cat', 'sed'],
  skills: ['unix_philosophy'],
  trait: {
    id: 'muscle_memory',
    rules: [passive({ do: 'mod', stat: 'rate', v: 10, filter: { maxWeight: 3 } })],
  },
  unlock: base,
  milestone: 1,
});

const prompt = definePrompt({
  id: 'concise',
  weight: 4,
  rules: [passive({ do: 'mod', stat: 'output', v: -1 })],
  unlock: base,
  milestone: 1,
});

const event = defineEvent({
  id: 'quick_tiny_change',
  phases: [1, 2, 3],
  unlock: base,
  milestone: 1,
  choices: [
    {
      id: 'sure',
      outcomes: [
        { do: 'credits', n: 25 },
        { do: 'nextFight', mod: { mod: 'addEnemy', enemy: 'scope_creep', count: 1, fights: 2 } },
      ],
    },
    { id: 'ask_for_ticket', outcomes: [] },
  ],
});

const defined = { tool, grepFirst, memory, lesson, enemy, encounter, harness, prompt, event };

function allFrozen(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return true;
  return Object.isFrozen(value) && Object.values(value).every(allFrozen);
}

describe('define helpers', () => {
  it('define helpers freeze content in dev', () => {
    for (const [name, def] of Object.entries(defined)) {
      expect(Object.isFrozen(def), name).toBe(true);
      expect(allFrozen(def), `${name} (nested)`).toBe(true);
    }
  });

  it('return the same definition they were given', () => {
    expect(tool.id).toBe('grep');
    expect(grepFirst.rules[0]?.then[0]).toEqual({ do: 'prime', filter: { tag: 'Edit' }, pct: 50 });
    expect(harness.trait.rules).toHaveLength(1);
  });

  it('deepFreeze freezes nested arrays and leaves primitives alone', () => {
    const value = deepFreeze({ a: [{ b: [1, 2] }], c: 'x' });
    expect(allFrozen(value)).toBe(true);
    expect(deepFreeze(3)).toBe(3);
    expect(deepFreeze(null)).toBe(null);
  });

  it('rule builders produce documented Rule objects', () => {
    const when = { on: 'fightStart' } as const;
    const then: Effect[] = [{ do: 'compact' }];
    const cond = { if: 'oncePerFight' } as const;
    expect(rule(when, then, [cond])).toEqual({ when, if: [cond], then });
    expect(rule(when, then)).toEqual({ when, then });
    expect(passive(...then)).toEqual({ when: { on: 'passive' }, then });
  });

  it('unlock refs are base or an unlock node', () => {
    expect(base).toBe('base');
    expect(unlockedBy('power_tools')).toEqual({ node: 'power_tools' });
  });
});

// Type-level: these checks run under `npx tsc --noEmit`; the vitest bodies are trivial.
describe('DSL types reject typos', () => {
  it('keeps literal ids for id unions', () => {
    expectTypeOf(tool.id).toEqualTypeOf<'grep'>();
    expectTypeOf(encounter.id).toEqualTypeOf<'p1e1'>();
  });

  it('an unknown trigger `on` value fails to compile', () => {
    expectTypeOf<{ on: 'fightStrat' }>().not.toExtend<Trigger>();
    const bad = defineSkill({
      id: 'typo_trigger',
      rarity: 'common',
      weight: 1,
      unlock: base,
      // @ts-expect-error 'fightStrat' is not a Trigger kind
      rules: [rule({ on: 'fightStrat' }, [])],
    });
    expect(bad.id).toBe('typo_trigger');
  });

  it('a misspelled effect `do` fails to compile', () => {
    expectTypeOf<{ do: 'dammage'; v: 5 }>().not.toExtend<Effect>();
    const bad = defineMemory({
      id: 'typo_effect',
      rarity: 'common',
      weight: 1,
      unlock: base,
      // @ts-expect-error 'dammage' is not an Effect kind
      rules: [rule({ on: 'fightStart' }, [{ do: 'dammage', v: 5 }])],
    });
    expect(bad.id).toBe('typo_effect');
  });

  it('a misspelled field fails to compile (excess property check)', () => {
    const bad = defineEncounter({
      id: 'p1e9',
      phase: 1,
      pool: 'easy',
      enemies: [],
      // @ts-expect-error `deadline` is not an EncounterDef field
      deadline: 45000,
    });
    expect(bad.id).toBe('p1e9');
  });
});
