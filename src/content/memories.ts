// The M1 memory catalogue (docs/game/content/memories-lessons.md "Memories", M1 rows), in
// catalogue order. The other memories join with E014. Behaviour in combat lives in E007.
import { defineMemory } from './dsl/define.ts';
import { passive, rule } from './dsl/rule.ts';
import { base } from './dsl/unlock.ts';

export const gitignore = defineMemory({
  id: 'gitignore',
  rarity: 'common',
  weight: 1,
  rules: [passive({ do: 'mod', stat: 'noiseBlock', v: 12 })],
  unlock: base,
});

export const cache = defineMemory({
  id: 'cache',
  rarity: 'uncommon',
  weight: 2,
  rules: [
    passive({ do: 'custom', handler: 'web_ignores_outage' }),
    rule(
      { on: 'passive' },
      [{ do: 'mod', stat: 'dmgPct', v: 100, filter: { tag: 'Web' } }],
      [{ if: 'oncePerFight' }],
    ),
  ],
  unlock: base,
});

export const longContext = defineMemory({
  id: 'long_context',
  rarity: 'rare',
  weight: 0,
  rules: [passive({ do: 'mod', stat: 'window', v: 40 }, { do: 'mod', stat: 'rate', v: -10 })],
  unlock: base,
});

export const keyboardShortcuts = defineMemory({
  id: 'keyboard_shortcuts',
  rarity: 'common',
  weight: 1,
  rules: [passive({ do: 'mod', stat: 'rate', v: 5 })],
  unlock: base,
});

export const memories = [gitignore, cache, longContext, keyboardShortcuts] as const;

/** Literal union of every memory id in the catalogue. */
export type MemoryKey = (typeof memories)[number]['id'];
