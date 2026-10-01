// Test tools (docs/game/content/tools.md "Test").
import { defineTool } from '../dsl/define.ts';
import { base } from '../dsl/unlock.ts';

export const lint = defineTool({
  id: 'lint',
  tags: ['Test'],
  rarity: 'common',
  weight: 3,
  cooldownMs: 3500,
  output: 2,
  target: 'self',
  effects: [{ do: 'guard', v: [6, 9, 13] }],
  unlock: base,
  milestone: 1,
});

export const runTests = defineTool({
  id: 'run_tests',
  tags: ['Test'],
  rarity: 'uncommon',
  weight: 6,
  cooldownMs: 6000,
  output: 4,
  target: 'all',
  effects: [
    { do: 'dmg', v: [8, 12, 17] },
    { do: 'guard', v: [4, 6, 9] },
  ],
  unlock: base,
  milestone: 1,
});
