// Outcome builders. Biome's noThenProperty flags a written-out `then` key, so the roll
// outcome is built here (same reason as rule() in src/content/dsl/rule.ts).
import type { Outcome } from '../types/event.ts';

const THEN = 'then';

/** A declared roll: with `pct`% chance, apply `outcomes`. */
export const chance = (pct: number, outcomes: readonly Outcome[]): Outcome =>
  ({ do: 'chance', pct, [THEN]: outcomes }) as Outcome;
