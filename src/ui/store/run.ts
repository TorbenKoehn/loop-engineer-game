// The run in signals (ui.md "Store"); every change goes through apply, like tests and bots.
import { computed, signal } from '@preact/signals';
import { content } from '../../content/index.ts';
import type { Action, ActionError } from '../../run/actions.ts';
import { apply } from '../../run/apply.ts';
import { newRun } from '../../run/new-run.ts';
import type { Mode, RunSetup, RunState } from '../../run/state.ts';
import { meta } from './meta.ts';

export type UiMode = Mode | 'title';

export const run = signal<RunState | null>(null);
export const lastError = signal<ActionError | null>(null);
/** Accepted actions since the run started (saves, E008). */
export const actionLog = signal<readonly Action[]>([]);
export const mode = computed<UiMode>(() => run.value?.mode ?? 'title');

/** Context window W of the run's harness. TODO(T045): window and baseline from run selectors. */
export const ctxWindow = computed(
  () => content.harnesses.find((h) => h.id === run.value?.setup.harness)?.model.window ?? 0,
);

export function startRun(setup: RunSetup): void {
  run.value = newRun(setup, meta.value);
  lastError.value = null;
  actionLog.value = [];
}

/** Applies `action`; a rejection sets lastError and leaves the run unchanged. */
export function dispatch(action: Action): void {
  const res = run.value ? apply(run.value, action) : ({ ok: false, error: 'wrongMode' } as const);
  if (!res.ok) {
    lastError.value = res.error;
    return;
  }
  lastError.value = null;
  run.value = res.state;
  actionLog.value = [...actionLog.value, action];
}
