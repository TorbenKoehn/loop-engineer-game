// Balance report: folds run records into the metrics the M1 exit criteria are judged by
// (docs/game/vertical-slice.md#exit-criteria). Pure and key-sorted: same records, same JSON.
import type { BatchSpec, FightClass, FightRecord, RunRecord } from './batch.ts';

/** Successes out of n with a 95% Wilson score interval. */
export interface Rate {
  n: number;
  k: number;
  rate: number;
  ci95: [number, number];
}

export type ReportConfig = BatchSpec & { phase: number };
export type Report = ReturnType<typeof buildReport>;

const Z95 = 1.96;
const round = (x: number): number => Math.round(x * 10_000) / 10_000;
const mean = (xs: readonly number[]): number =>
  round(xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length));

export function wilson(k: number, n: number): Rate {
  if (n === 0) return { n, k, rate: 0, ci95: [0, 0] };
  const p = k / n;
  const d = 1 + (Z95 * Z95) / n;
  const mid = (p + (Z95 * Z95) / (2 * n)) / d;
  const half = (Z95 * Math.sqrt((p * (1 - p)) / n + (Z95 * Z95) / (4 * n * n))) / d;
  return { n, k, rate: round(p), ci95: [round(mid - half), round(mid + half)] };
}

/** Nearest-rank quantile; 0 for an empty list. */
export function quantile(xs: readonly number[], q: number): number {
  const sorted = [...xs].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(q * sorted.length) - 1)] ?? 0;
}

/** Groups by key into an object with sorted keys. */
function groupBy<T>(xs: readonly T[], key: (x: T) => string): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const x of xs) {
    const group = out[key(x)] ?? [];
    group.push(x);
    out[key(x)] = group;
  }
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => (a < b ? -1 : 1)));
}

/** Applies `f` to every group of `groupBy(xs, key)`. */
function foldBy<T, U>(xs: readonly T[], key: (x: T) => string, f: (g: T[]) => U) {
  return Object.fromEntries(Object.entries(groupBy(xs, key)).map(([k, g]) => [k, f(g)]));
}

const tally = (xs: readonly string[]) => foldBy(xs, String, (g) => g.length);
const rateOf = (runs: readonly RunRecord[], hit: (r: RunRecord) => boolean): Rate =>
  wilson(runs.filter(hit).length, runs.length);
const won = (runs: readonly RunRecord[]): Rate => rateOf(runs, (r) => r.won);
const reached = (runs: readonly RunRecord[]): Rate => rateOf(runs, (r) => r.boss);

function fightMetrics(fights: readonly FightRecord[]) {
  const ms = fights.map((f) => f.ms);
  return {
    fights: fights.length,
    medianMs: quantile(ms, 0.5),
    p90Ms: quantile(ms, 0.9),
    trustLostMean: mean(fights.map((f) => f.trustLost)),
    compactionsMean: mean(fights.map((f) => f.compactions)),
  };
}

/** Offers and picks count every occurrence; win-when-picked counts the runs that picked it. */
function itemMetrics(runs: readonly RunRecord[]) {
  const offers = tally(runs.flatMap((r) => r.offered));
  const picks = tally(runs.flatMap((r) => r.picked));
  const keys = [...new Set([...Object.keys(offers), ...Object.keys(picks)])];
  return foldBy(keys, String, ([key = '']) => {
    const [offered, picked] = [offers[key] ?? 0, picks[key] ?? 0];
    const winWhenPicked = won(runs.filter((r) => r.picked.includes(key)));
    return { offered, picked, pickRate: round(picked / Math.max(1, offered)), winWhenPicked };
  });
}

/** Share of won runs whose final loadout holds the tool. */
function winningLoadoutShare(runs: readonly RunRecord[]): Record<string, number> {
  const wins = runs.filter((r) => r.won);
  const held = wins.flatMap((r) => [...new Set(r.tools)]);
  return foldBy(held, String, (g) => round(g.length / wins.length));
}

/** Mean credits on the map after `step` nodes, over the runs that got that far. */
function creditsCurve(runs: readonly RunRecord[]) {
  const steps = Math.max(0, ...runs.map((r) => r.credits.length));
  return Array.from({ length: steps }, (_, step) => {
    const at = runs.flatMap((r) => r.credits[step] ?? []);
    return { step, runs: at.length, mean: mean(at) };
  });
}

export function buildReport(runs: readonly RunRecord[], config: ReportConfig) {
  const fights = runs.flatMap((r) => r.fights);
  const byClass = groupBy(fights, (f) => f.cls);
  const cls = (c: FightClass) => fightMetrics(byClass[c] ?? []);
  return {
    config,
    winRate: {
      byHarness: foldBy(runs, (r) => r.harness, won),
      byHarnessPrompt: foldBy(runs, (r) => `${r.harness}/${r.prompt}`, won),
    },
    bossReach: foldBy(runs, (r) => r.harness, reached),
    outcomes: tally(runs.map((r) => r.outcome)),
    phaseReached: tally(runs.map((r) => String(r.phase))),
    winningLoadoutShare: winningLoadoutShare(runs),
    items: itemMetrics(runs),
    fights: {
      all: fightMetrics(fights),
      normal: cls('normal'),
      elite: cls('elite'),
      boss: cls('boss'),
    },
    creditsCurve: creditsCurve(runs),
  };
}

/** Stable JSON: two-space indent, trailing newline. */
export const reportJson = (report: Report): string => `${JSON.stringify(report, null, 2)}\n`;
