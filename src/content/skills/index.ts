// The M1 skill catalogue (docs/game/content/skills.md "Vertical slice skills (M1)"), in
// catalogue order. The 16 M2 skills join with E014. Behaviour in combat lives in E007.
import { defineSkill } from '../dsl/define.ts';
import { passive, rule } from '../dsl/rule.ts';
import { base, unlockedBy } from '../dsl/unlock.ts';

export const unixPhilosophy = defineSkill({
  id: 'unix_philosophy',
  rarity: 'common',
  weight: 3,
  rules: [rule({ on: 'passive' }, [{ do: 'mod', stat: 'dmgPct', v: 30 }], [{ if: 'piped' }])],
  unlock: base,
});

export const inlineSuggestions = defineSkill({
  id: 'inline_suggestions',
  rarity: 'common',
  weight: 3,
  rules: [passive({ do: 'mod', stat: 'dmgFlat', v: 2, filter: { tag: 'Edit' } })],
  unlock: base,
});

export const grepFirst = defineSkill({
  id: 'grep_first',
  rarity: 'uncommon',
  weight: 3,
  rules: [
    rule({ on: 'toolFired', tag: 'Search' }, [{ do: 'prime', filter: { tag: 'Edit' }, pct: 50 }]),
  ],
  unlock: base,
});

// Slow duration has no ModStat of its own: throttleDurPct covers Throttle and Slow on
// the player's tools (its string says so), so no new stat is needed (T013).
export const lockfile = defineSkill({
  id: 'lockfile',
  rarity: 'common',
  weight: 2,
  rules: [passive({ do: 'mod', stat: 'throttleDurPct', v: -50 })],
  unlock: base,
});

export const summarizer = defineSkill({
  id: 'summarizer',
  rarity: 'uncommon',
  weight: 3,
  rules: [
    rule({ on: 'compaction' }, [
      { do: 'guard', v: 8 },
      { do: 'status', status: 'haste', ms: 2000, sel: 'leftmost' },
    ]),
  ],
  unlock: base,
});

export const longContextTraining = defineSkill({
  id: 'long_context_training',
  rarity: 'rare',
  weight: 4,
  rules: [passive({ do: 'custom', handler: 'rot_no_slow' })],
  unlock: base,
});

export const feedbackLoop = defineSkill({
  id: 'feedback_loop',
  rarity: 'rare',
  weight: 4,
  rules: [passive({ do: 'custom', handler: 'feedback_loop', args: { ms: 1000 } })],
  unlock: unlockedBy('loop_theory'),
});

export const rubberDuck = defineSkill({
  id: 'rubber_duck',
  rarity: 'common',
  weight: 2,
  rules: [rule({ on: 'fightStart' }, [{ do: 'guard', v: 10 }])],
  unlock: base,
});

export const skills = [
  unixPhilosophy,
  inlineSuggestions,
  grepFirst,
  lockfile,
  summarizer,
  longContextTraining,
  feedbackLoop,
  rubberDuck,
] as const;

/** Literal union of every skill id in the catalogue. */
export type SkillKey = (typeof skills)[number]['id'];
