// Web tools (docs/game/content/tools.md "Web").
import { defineTool } from '../dsl/define.ts';
import { base } from '../dsl/unlock.ts';

export const webSearch = defineTool({
  id: 'web_search',
  tags: ['Web'],
  rarity: 'uncommon',
  weight: 4,
  cooldownMs: 5000,
  output: 5,
  target: 'lowest',
  effects: [{ do: 'dmg', v: [14, 21, 30] }],
  unlock: base,
  milestone: 1,
});
