// Time helpers for the sandbox replay (T098): tool charge read from the event log, intent
// countdowns and clock formatting. The log has no per-tick charge events, so a tool's charge
// is the share of the interval between two of its `toolFired` events that has elapsed.
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

const pad = (n: number, width: number): string => String(n).padStart(width, '0');

/** `mm:ss.mmm` (docs/game/ux/screens.md "Clock"). */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms));
  const minutes = Math.floor(total / 60_000);
  const seconds = Math.floor((total % 60_000) / 1000);
  return `${pad(minutes, 2)}:${pad(seconds, 2)}.${pad(total % 1000, 3)}`;
}

/** Seconds with one decimal, e.g. `3.5 s`. */
export function formatSeconds(ms: number): string {
  return `${(Math.max(0, ms) / 1000).toFixed(1)} s`;
}
