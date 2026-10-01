// Rebuild a run from its setup snapshot (which holds the seed) and the accepted actions.
// See docs/architecture/adr/adr-005-save-action-log.md.
import type { Action, ApplyResult } from './actions.ts';
import { apply } from './apply.ts';
import { initialState } from './new-run.ts';
import type { SetupSnapshot } from './state.ts';

/** Folds `actions` over the initial state; stops at the first rejected action. */
export function replay(setup: SetupSnapshot, actions: readonly Action[]): ApplyResult {
  let state = initialState(setup);
  for (const action of actions) {
    const r = apply(state, action);
    if (!r.ok) return r;
    state = r.state;
  }
  return { ok: true, state };
}
