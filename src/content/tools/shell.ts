// Shell tools (docs/game/content/tools.md "Shell", "Special rules").
import { defineTool } from '../dsl/define.ts';
import { base, unlockedBy } from '../dsl/unlock.ts';

/** Clears Throttle from, then hastes, the own tool with the longest remaining charge. */
export const retryWithBackoff = defineTool({
  id: 'retry_with_backoff',
  tags: ['Shell'],
  rarity: 'uncommon',
  weight: 3,
  cooldownMs: 5000,
  output: 1,
  target: 'tool',
  effects: [
    { do: 'clearStatus', status: 'throttle', sel: 'longestCharge' },
    { do: 'status', status: 'haste', ms: [2000, 3000, 4000], sel: 'longestCharge' },
  ],
  unlock: base,
  milestone: 1,
});

/** +1/2/3 base damage per floor(S x 10 / W): Signal only, in tenths of the window. */
export const bruteForce = defineTool({
  id: 'brute_force',
  tags: ['Shell'],
  rarity: 'rare',
  weight: 5,
  cooldownMs: 4500,
  output: 4,
  target: 'front',
  effects: [{ do: 'dmg', v: [6, 9, 13], perSignalTenth: [1, 2, 3] }],
  // M1 grants this node on the first Critical Bug win (vertical-slice.md deviations).
  unlock: unlockedBy('power_tools'),
  milestone: 1,
});
