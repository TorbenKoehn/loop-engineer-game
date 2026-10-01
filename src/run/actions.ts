// Serialisable run actions and reducer results (docs/architecture/run-state.md#actions).
// The union grows with the modes later E004 tasks implement.
import type { PromptId } from '../content/types/ids.ts';
import type { NodeId, RunState } from './state.ts';

export type Action = { t: 'pickPrompt'; prompt: PromptId } | { t: 'travel'; node: NodeId };

/** Why apply rejected an action; the state is unchanged. */
export type ActionError = 'unknownAction' | 'wrongMode' | 'notOffered' | 'notReachable';

export type ApplyResult = { ok: true; state: RunState } | { ok: false; error: ActionError };
