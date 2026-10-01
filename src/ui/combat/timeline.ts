// Time helpers for the combat screen: tool charge read from the event log, intent countdowns
// and the Deadline clock tone. The log has no per-tick charge events, so a tool's charge is
// the share of the interval between two of its `toolFired` events that has elapsed.
import type { CombatEvent } from '../../sim/events.ts';

/** `toolFired` times per tool slot, ascending. */
export function fireTimes(events: readonly CombatEvent[], slots: number): number[][] {
  const out: number[][] = Array.from({ length: slots }, () => []);
  for (const e of events) {
    if (e.kind !== 'toolFired' || !e.src?.startsWith('t')) continue;
    out[Number(e.src.slice(1))]?.push(e.t);
  }
  return out;
}

/** Index of the last entry `<= t`, or -1. */
function lastAtOrBefore(times: readonly number[], t: number): number {
  let lo = 0;
  let hi = times.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if ((times[mid] ?? 0) <= t) {
      found = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return found;
}

/**
 * Charge in [0, 1) at time `t`. Between two fires it is linear; after the last fire it
 * continues at the last observed interval (or `fallbackMs`) and stops just short of full.
 */
export function chargeAt(times: readonly number[], t: number, fallbackMs: number): number {
  const i = lastAtOrBefore(times, t);
  const prev = i >= 0 ? (times[i] ?? 0) : 0;
  const next = times[i + 1];
  const before = i >= 1 ? (times[i - 1] ?? 0) : undefined;
  const span = next !== undefined ? next - prev : before === undefined ? fallbackMs : prev - before;
  if (span <= 0) return 0;
  return Math.min(0.99, Math.max(0, (t - prev) / span));
}

/** Remaining windup of an intent in ms (never negative). */
export function windupLeft(intent: { windupMs: number; setAt: number }, t: number): number {
  return Math.max(0, intent.windupMs - (t - intent.setAt));
}

/** The clock turns amber this long before the Deadline (screens.md "Clock"). */
export const DEADLINE_WARN_MS = 10_000;

export type ClockTone = 'ok' | 'warn' | 'over';

/** `warn` from 10 s before the Deadline, `over` once it has passed. */
export function clockTone(t: number, deadlineMs: number): ClockTone {
  if (t > deadlineMs) return 'over';
  return t >= deadlineMs - DEADLINE_WARN_MS ? 'warn' : 'ok';
}
