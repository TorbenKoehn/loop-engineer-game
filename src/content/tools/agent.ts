// Agent tools (docs/game/content/tools.md "Agent").
import { defineTool } from '../dsl/define.ts';
import { base } from '../dsl/unlock.ts';

export const summarize = defineTool({
  id: 'summarize',
  tags: ['Agent'],
  rarity: 'uncommon',
  weight: 4,
  cooldownMs: 7000,
  output: 0,
  target: 'self',
  effects: [
    { do: 'removeCtx', v: [10, 14, 18] },
    { do: 'guard', v: [3, 5, 7] },
  ],
  unlock: base,
  milestone: 1,
});
