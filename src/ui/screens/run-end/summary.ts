// Run-end summary data (onboarding.md "Why did I lose?"): pure, from RunStats and the last
// fight's event log; no extra tracking. Exactly one hint, by the onboarding rules in order.

import type { RunState } from '../../../run/state.ts';
import { DEADLINE } from '../../../run/stats.ts';
import type { CombatEvent } from '../../../sim/events.ts';

export type Hint = 'rot' | 'throttle' | 'deadline' | 'default';

/** Rot hint: more than this share of the last fight spent in Rot. */
export const ROT_SHARE = 0.4;
/** Throttle hint: more than this many Throttles on the agent or its tools in the last fight. */
export const MAX_THROTTLES = 3;
/** Event zone index of Rot (cold, focused, rot, overflow). */
const ROT = 2;

export interface HintInput {
  zoneMs: readonly number[];
  throttles: number;
  outcome: 'shipped' | 'ctrlc' | 'abandoned';
  cause: string | null;
}

/** The first matching rule: Rot > 40%, > 3 Throttles, died to the Deadline; else default. */
export function pickHint(h: HintInput): Hint {
  const total = h.zoneMs.reduce((a, b) => a + b, 0);
  if (total > 0 && (h.zoneMs[ROT] ?? 0) / total > ROT_SHARE) return 'rot';
  if (h.throttles > MAX_THROTTLES) return 'throttle';
  if (h.outcome === 'ctrlc' && h.cause === DEADLINE) return 'deadline';
  return 'default';
}

/** Throttles applied to the agent (`a`) or one of its tools (`t<slot>`). */
export const countThrottles = (events: readonly CombatEvent[]): number =>
  events.filter(
    (e) => e.kind === 'statusOn' && e.d.status === 'throttle' && /^(a|t\d+)$/.test(e.dst ?? ''),
  ).length;

export interface Summary extends HintInput {
  /** Up to 3 damage sources (enemy def id or `deadline`), most damage first. */
  top: { src: string; dmg: number }[];
  compactions: number;
  hint: Hint;
}

/** The summary of an ended run; `events` is the log of its last fight (empty if none). */
export function summarize(state: RunState, events: readonly CombatEvent[]): Summary {
  const { stats } = state;
  const top = Object.entries(stats.damageBySource)
    .map(([src, dmg]) => ({ src, dmg }))
    .sort((a, b) => b.dmg - a.dmg || (a.src < b.src ? -1 : 1))
    .slice(0, 3);
  const input: HintInput = {
    zoneMs: stats.lastFight.zoneMs,
    throttles: countThrottles(events),
    outcome: state.result?.outcome ?? 'abandoned',
    cause: stats.cause,
  };
  return { ...input, top, compactions: stats.lastFight.compactions, hint: pickHint(input) };
}
