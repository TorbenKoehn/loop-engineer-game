// Search tools (docs/game/content/tools.md "Search").
import { defineTool } from '../dsl/define.ts';
import { base } from '../dsl/unlock.ts';

export const grep = defineTool({
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

export const cat = defineTool({
  id: 'cat',
  tags: ['Search', 'Shell'],
  rarity: 'common',
  weight: 2,
  cooldownMs: 2500,
  output: 2,
  pipeMs: 1000,
  target: 'front',
  effects: [{ do: 'dmg', v: [4, 6, 9] }],
  unlock: base,
  milestone: 1,
});

export const readFile = defineTool({
  id: 'read_file',
  tags: ['Search'],
  rarity: 'common',
  weight: 4,
  cooldownMs: 4000,
  output: 6,
  target: 'front',
  effects: [
    { do: 'dmg', v: [8, 12, 17] },
    { do: 'prime', filter: { tag: 'Edit' }, pct: [30, 45, 60] },
  ],
  unlock: base,
  milestone: 1,
});
