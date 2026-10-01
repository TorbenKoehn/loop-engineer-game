// Serialisable run actions and reducer results (docs/architecture/run-state.md#actions).
// The union grows with the modes later E004 tasks implement.
import type { PromptId } from '../content/types/ids.ts';
import type { ItemKind, ItemRef, NodeId, Policy, RunState } from './state.ts';

export type Action =
  | { t: 'pickPrompt'; prompt: PromptId }
  | { t: 'travel'; node: NodeId }
  | { t: 'continue' }
  | { t: 'pickReward'; ix: 0 | 1 | 2 }
  | { t: 'skipReward' }
  | { t: 'discardItem'; item: ItemRef }
  | { t: 'buy'; ix: number }
  | { t: 'sell'; item: ItemRef }
  | { t: 'reroll' }
  | { t: 'leaveShop' }
  | { t: 'abandon' }
  | { t: 'restHeal' }
  /** `slot` indexes the equipped tools. */
  | { t: 'restUpgrade'; slot: number }
  | { t: 'takeTreasure' }
  /** `ix` indexes the open event's choices. */
  | { t: 'chooseEvent'; ix: number }
  /** `replace` names the AGENTS.md line to overwrite; required when it is full. */
  | { t: 'pickLesson'; ix: number; replace?: number }
  | { t: 'skipLesson' }
  // Build actions (src/run/build/build.ts): free in map, reward, shop and event modes.
  /** Reorders the equipped tools: the tool at `from` moves to index `to`. */
  | { t: 'moveTool'; from: number; to: number }
  /** Stash item `stashIx` into a free slot of its kind, inserted at `slot`. */
  | { t: 'equip'; stashIx: number; slot: number }
  | { t: 'unequip'; kind: ItemKind; slot: number }
  /** Stash item `stashIx` and the equipped item of its kind at `slot` trade places. */
  | { t: 'swap'; stashIx: number; slot: number }
  | { t: 'setPolicy'; policy: Policy };

/** Why apply rejected an action; the state is unchanged. */
export type ActionError =
  | 'unknownAction'
  | 'wrongMode'
  | 'notOffered'
  | 'notReachable'
  | 'insufficientCredits'
  | 'missingTag'
  | 'lastTool'
  | 'noLessonSlot'
  | 'baselineOverLimit';

export type ApplyResult = { ok: true; state: RunState } | { ok: false; error: ActionError };

export const fail = (error: ActionError): ApplyResult => ({ ok: false, error });
export const ok = (state: RunState): ApplyResult => ({ ok: true, state });
