// Rule 2: number budgets. Item weight 0-6, tool cooldown and intent windup >= 1000 ms in
// steps of 50, `every` intervals in steps of 50 (one tick), tool output -20..10, v1/v2/v3
// triples non-decreasing, Severity > 0.
import type { Content } from '../index.ts';
import { effectsOf, intentsOf, rulesOf } from './walk.ts';

export const WEIGHT_MIN = 0;
export const WEIGHT_MAX = 6;
export const TIMING_MIN_MS = 1000;
export const TIMING_STEP_MS = 50;
export const OUTPUT_MIN = -20;
export const OUTPUT_MAX = 10;

const err = (msg: string) => `[rule 2] ${msg}`;

const timingOk = (ms: number) =>
  Number.isInteger(ms) && ms >= TIMING_MIN_MS && ms % TIMING_STEP_MS === 0;

const isTriple = (x: unknown): x is readonly [number, number, number] =>
  Array.isArray(x) && x.length === 3 && x.every((n) => typeof n === 'number');

function weights(c: Content): string[] {
  const items = [
    ...c.tools.map((t) => [`tool ${t.id}`, t.weight] as const),
    ...c.skills.map((s) => [`skill ${s.id}`, s.weight] as const),
    ...c.memories.map((m) => [`memory ${m.id}`, m.weight] as const),
  ];
  return items.flatMap(([owner, w]) =>
    Number.isInteger(w) && w >= WEIGHT_MIN && w <= WEIGHT_MAX
      ? []
      : [err(`${owner}: weight ${w} outside ${WEIGHT_MIN}-${WEIGHT_MAX}`)],
  );
}

function timings(c: Content): string[] {
  const cooldowns = c.tools.flatMap((t) =>
    timingOk(t.cooldownMs) ? [] : [err(`tool ${t.id}: cooldownMs ${t.cooldownMs}`)],
  );
  const windups = c.enemies.flatMap((e) =>
    intentsOf(e).flatMap((i) =>
      timingOk(i.windupMs) ? [] : [err(`enemy ${e.id}.${i.id}: windupMs ${i.windupMs}`)],
    ),
  );
  const intervals = rulesOf(c).flatMap(({ owner, item: { when } }) =>
    when.on !== 'every' || (when.ms > 0 && when.ms % TIMING_STEP_MS === 0)
      ? []
      : [err(`${owner}: every.ms ${when.ms} is not a multiple of ${TIMING_STEP_MS}`)],
  );
  return [...cooldowns, ...windups, ...intervals];
}

function outputs(c: Content): string[] {
  return c.tools.flatMap((t) =>
    t.output >= OUTPUT_MIN && t.output <= OUTPUT_MAX
      ? []
      : [err(`tool ${t.id}: output ${t.output} outside ${OUTPUT_MIN}..${OUTPUT_MAX}`)],
  );
}

function triples(c: Content): string[] {
  return effectsOf(c).flatMap(({ owner, item }) =>
    Object.entries(item).flatMap(([field, v]) =>
      isTriple(v) && !(v[0] <= v[1] && v[1] <= v[2])
        ? [err(`${owner}: ${item.do}.${field} [${v.join(', ')}] decreases`)]
        : [],
    ),
  );
}

function severities(c: Content): string[] {
  return c.enemies.flatMap((e) => [
    ...(e.sev > 0 ? [] : [err(`enemy ${e.id}: Severity ${e.sev} must be > 0`)]),
    ...(e.stages ?? []).flatMap((s) =>
      s.sev === undefined || s.sev > 0 ? [] : [err(`enemy ${e.id}.${s.id}: Severity ${s.sev}`)],
    ),
  ]);
}

export function checkNumbers(c: Content): string[] {
  return [...weights(c), ...timings(c), ...outputs(c), ...triples(c), ...severities(c)];
}
