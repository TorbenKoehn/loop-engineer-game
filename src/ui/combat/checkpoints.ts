// Seeking (docs/architecture/ui.md "Seeking"): views stored every CHECKPOINT_EVERY events, so a
// seek restores the nearest earlier checkpoint and folds forward instead of from the start.
import type { CombatEvent } from '../../sim/events.ts';
import { type CombatView, foldEvent } from './fold.ts';

export const CHECKPOINT_EVERY = 100;

/** `views[k]` is the view after the first `k x every` events; `views[0]` is `start`. */
export interface Checkpoints {
  readonly every: number;
  readonly views: readonly CombatView[];
}

export function buildCheckpoints(
  start: CombatView,
  events: readonly CombatEvent[],
  every = CHECKPOINT_EVERY,
): Checkpoints {
  const views = [start];
  let view = start;
  for (const e of events) {
    view = foldEvent(view, e);
    if (view.cursor % every === 0) views.push(view);
  }
  return { every, views };
}

/** The view after `events[0..index)`, with `index` clamped to the log. */
export function viewAt(cp: Checkpoints, events: readonly CombatEvent[], index: number): CombatView {
  const target = Math.max(0, Math.min(events.length, Math.floor(index)));
  const k = Math.min(Math.floor(target / cp.every), cp.views.length - 1);
  let view = cp.views[k] as CombatView;
  for (let e = events[view.cursor]; e && view.cursor < target; e = events[view.cursor]) {
    view = foldEvent(view, e);
  }
  return view;
}
