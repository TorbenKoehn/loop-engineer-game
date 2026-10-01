import { describe, expect, expectTypeOf, it } from 'vitest';
import type { Cond, Effect, Trait, Trigger, Verb } from '../types/index.ts';
import {
  COND_KINDS,
  EFFECT_KINDS,
  TRAIT_KINDS,
  TRIGGER_KINDS,
  VERB_KINDS,
} from '../types/index.ts';

describe('DSL kind lists', () => {
  it('each kind list equals its union exactly', () => {
    expectTypeOf<(typeof TRIGGER_KINDS)[number]>().toEqualTypeOf<Trigger['on']>();
    expectTypeOf<(typeof COND_KINDS)[number]>().toEqualTypeOf<Cond['if']>();
    expectTypeOf<(typeof EFFECT_KINDS)[number]>().toEqualTypeOf<Effect['do']>();
    expectTypeOf<(typeof TRAIT_KINDS)[number]>().toEqualTypeOf<Trait['trait']>();
    expectTypeOf<(typeof VERB_KINDS)[number]>().toEqualTypeOf<Verb['verb']>();
  });

  it('kind lists have no duplicates', () => {
    for (const list of [TRIGGER_KINDS, COND_KINDS, EFFECT_KINDS, TRAIT_KINDS, VERB_KINDS]) {
      expect(new Set(list).size).toBe(list.length);
    }
  });

  it('covers the M1 traits and the documented enemy verbs', () => {
    expect([...TRAIT_KINDS].sort()).toEqual(['armor', 'blocked', 'grow', 'outage', 'split']);
    expect(VERB_KINDS).toHaveLength(11);
  });
});
