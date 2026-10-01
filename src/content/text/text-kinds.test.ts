// Every kind renders through its template: one fixture per Trigger, Cond, Trait and Verb kind.
import { describe, expect, it } from 'vitest';
import { rule } from '../dsl/rule.ts';
import { en } from '../strings/en.ts';
import { describeEnemy, describeRule } from '../text.ts';
import type { Cond, Trait, Trigger, Verb } from '../types/index.ts';
import { COND_KINDS, TRAIT_KINDS, TRIGGER_KINDS, VERB_KINDS } from '../types/index.ts';
import { condClause, triggerClause } from './clauses.ts';

const triggers: Trigger[] = [
  { on: 'fightStart' },
  { on: 'fightWon' },
  { on: 'every', ms: 5000 },
  { on: 'toolFired' },
  { on: 'toolFired', tool: 'grep' },
  { on: 'compaction' },
  { on: 'damaged' },
  { on: 'guardGained', fromTool: true },
  { on: 'guardGained' },
  { on: 'trustBelow', pct: 30 },
  { on: 'passive' },
];

const conds: Cond[] = [
  { if: 'zone', is: 'focused' },
  { if: 'piped' },
  { if: 'nth', n: 4 },
  { if: 'adjacentSharesTag' },
  { if: 'cooldownAtMost', ms: 3000 },
  { if: 'oncePerFight' },
  { if: 'oncePerRun' },
  { if: 'cooldown', ms: 3000 },
];

const traits: Trait[] = [
  { trait: 'split', n: 2, pct: 50, child: 'transitive_dep' },
  { trait: 'grow', ms: 4000, sev: 10, dmg: 1 },
  { trait: 'outage', tag: 'Web' },
  { trait: 'blocked' },
  { trait: 'armor', layers: 3, hp: 40 },
];

const verbs: Verb[] = [
  { verb: 'hit', n: 3 },
  { verb: 'multiHit', n: 2, times: 3 },
  { verb: 'noise', n: 4 },
  { verb: 'throttle', sel: { tag: 'Edit' }, ms: 2000 },
  { verb: 'slow', sel: 'fastest', ms: 3000 },
  { verb: 'stun', ms: 1500 },
  { verb: 'guard', n: 5 },
  { verb: 'heal', n: 6 },
  { verb: 'spawn', enemy: 'typo', max: 2 },
  { verb: 'redirect' },
  { verb: 'custom', handler: 'monolith_stage' },
];

const LEFTOVER = /[{}]/;
const strings = { ...en, 'handler.monolith_stage': 'switch stage' };

describe('kind templates render', () => {
  it('fixtures cover every kind', () => {
    expect(new Set(triggers.map((t) => t.on))).toEqual(new Set(TRIGGER_KINDS));
    expect(new Set(conds.map((c) => c.if))).toEqual(new Set(COND_KINDS));
    expect(new Set(traits.map((t) => t.trait))).toEqual(new Set(TRAIT_KINDS));
    expect(new Set(verbs.map((v) => v.verb))).toEqual(new Set(VERB_KINDS));
  });

  it('every trigger and cond wraps the effect clause', () => {
    for (const t of triggers) {
      const line = triggerClause(t, en, 'X');
      expect(line, t.on).toContain('X');
      expect(line, t.on).not.toMatch(LEFTOVER);
    }
    for (const c of conds) {
      const line = condClause(c, en, 'X');
      expect(line, c.if).toContain('X');
      expect(line, c.if).not.toMatch(LEFTOVER);
    }
  });

  it('every trait and verb renders a sentence', () => {
    const intent = (v: Verb) => ({ id: 'i', windupMs: 1000, verbs: [v] as const });
    const text = describeEnemy(
      {
        id: 'e',
        family: 'Bugs',
        homePhase: 1,
        sev: 10,
        traits: [],
        opening: [intent({ verb: 'redirect' })],
        cycle: verbs.map(intent),
        stages: [{ id: 's', traits, cycle: [] }],
        art: [],
      },
      strings,
    );
    expect(text.traits).toHaveLength(TRAIT_KINDS.length);
    expect(text.intents).toHaveLength(VERB_KINDS.length + 1);
    for (const line of [...text.traits, ...text.intents]) {
      expect(line).toMatch(/^[A-Z0-9].*\.$/);
      expect(line).not.toMatch(LEFTOVER);
    }
    expect(text.traits[2]).toBe('While alive, Web tools time out.');
    expect(text.intents[4]).toBe('Throttle your Edit tools for 2000 ms.');
  });

  it('uses tool names when the string table has them', () => {
    const named = { ...en, 'tool.grep.name': 'grep' };
    const healOnGrep = rule({ on: 'toolFired', tool: 'grep' }, [{ do: 'heal', v: 2 }]);
    const r = describeRule(healOnGrep, { strings: named });
    expect(r).toBe('After grep fires, restore 2 Trust.');
  });
});
