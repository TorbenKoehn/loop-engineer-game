// Edit tools (docs/game/content/tools.md "Edit").
import { defineTool } from '../dsl/define.ts';
import { base } from '../dsl/unlock.ts';

export const sed = defineTool({
  id: 'sed',
  tags: ['Edit', 'Shell'],
  rarity: 'common',
  weight: 4,
  cooldownMs: 4500,
  output: 2,
  pipeMs: 1000,
  target: 'all',
  effects: [{ do: 'dmg', v: [5, 8, 11] }],
  unlock: base,
  milestone: 1,
});

export const editFile = defineTool({
  id: 'edit_file',
  tags: ['Edit'],
  rarity: 'common',
  weight: 5,
  cooldownMs: 5000,
  output: 3,
  target: 'front',
  effects: [{ do: 'dmg', v: [16, 24, 34] }],
  unlock: base,
  milestone: 1,
});

export const autocomplete = defineTool({
  id: 'autocomplete',
  tags: ['Edit'],
  rarity: 'common',
  weight: 2,
  cooldownMs: 1500,
  output: 1,
  target: 'front',
  effects: [{ do: 'dmg', v: [3, 4, 6] }],
  unlock: base,
  milestone: 1,
});
