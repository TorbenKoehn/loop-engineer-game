// Serialisable run actions and reducer results (docs/architecture/run-state.md#actions).
// The union grows with the modes later E004 tasks implement.
import type { PromptId } from '../content/types/ids.ts';
import type { ItemRef, NodeId, RunState } from './state.ts';

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
  /** `replace` names the AGENTS.md line to overwrite; required when it is full. */
  | { t: 'pickLesson'; ix: number; replace?: number }
  | { t: 'skipLesson' };

/** Why apply rejected an action; the state is unchanged. */
export type ActionError =
  | 'unknownAction'
  | 'wrongMode'
  | 'notOffered'
  | 'notReachable'
  | 'insufficientCredits'
  | 'lastTool'
  | 'noLessonSlot';

export type ApplyResult = { ok: true; state: RunState } | { ok: false; error: ActionError };

export const fail = (error: ActionError): ApplyResult => ({ ok: false, error });
export const ok = (state: RunState): ApplyResult => ({ ok: true, state });
