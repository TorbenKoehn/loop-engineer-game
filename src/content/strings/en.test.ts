import { describe, expect, expectTypeOf, it } from 'vitest';
import { kindKey } from '../text/fill.ts';
import {
  COND_KINDS,
  EFFECT_KINDS,
  TRAIT_KINDS,
  TRIGGER_KINDS,
  VERB_KINDS,
} from '../types/kinds.ts';
import { en } from './en.ts';

const KEY = /^[a-z0-9_]+(\.[a-z0-9_]+)+$/;
const BRACES = /[{}]/g;
const NAMED = /\{[a-zA-Z]+\}/g;

const groups = {
  effect: EFFECT_KINDS,
  trigger: TRIGGER_KINDS,
  cond: COND_KINDS,
  trait: TRAIT_KINDS,
  verb: VERB_KINDS,
} as const;

describe('en string table', () => {
  it('en.ts is a flat as-const record with dotted lower-case keys', () => {
    expectTypeOf(en['effect.dmg']).toEqualTypeOf<'deal {n} damage to {target}'>();
    expect(Object.getPrototypeOf(en)).toBe(Object.prototype);
    for (const [key, value] of Object.entries(en)) {
      expect(key, key).toMatch(KEY);
      expect(typeof value, key).toBe('string');
    }
  });

  it('uses named placeholders only', () => {
    for (const [key, value] of Object.entries(en)) {
      const stripped = value.replace(NAMED, '');
      expect(stripped.match(BRACES), `${key}: ${value}`).toBeNull();
    }
  });

  it('every Effect, Trigger, Cond, Trait and Verb kind has exactly one template key', () => {
    const keys = Object.keys(en);
    for (const [group, kinds] of Object.entries(groups)) {
      const expected = kinds.map((kind) => kindKey(group, kind)).sort();
      const actual = keys.filter((k) => k.startsWith(`${group}.`)).sort();
      expect(actual, group).toEqual(expected);
    }
  });

  it('maps camelCase kinds to snake_case keys', () => {
    expect(kindKey('effect', 'removeCtx')).toBe('effect.remove_ctx');
    expect(kindKey('stat', 'slots.tool')).toBe('stat.slots.tool');
  });
});
