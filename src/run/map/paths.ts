// Path drawing for the phase map (docs/game/systems/run-map.md#map-generation-seeded).
import { int, pick, type Rng } from '../../sim/rng.ts';

export const ROWS = 7;
const COLS = 5;
const PATHS = 4;
const STEP_RETRIES = 10;
/** Column of the single tutorial start node. */
const TUTORIAL_COL = 2;
const COLUMNS = Array.from({ length: COLS }, (_, c) => c);

/** Row `row` column `from` to row `row + 1` column `to`. */
type Step = { row: number; from: number; to: number };

/** a->b crosses c->d when a < c and b > d, or vice versa. */
const crosses = (s: Step, e: Step): boolean =>
  s.row === e.row && ((s.from < e.from && s.to > e.to) || (s.from > e.from && s.to < e.to));

function startColumns(rng: Rng, tutorial: boolean): number[] {
  if (tutorial) return Array.from({ length: PATHS }, () => TUTORIAL_COL);
  const first = int(rng, 0, COLS - 1);
  const others = COLUMNS.filter((c) => c !== first);
  const second = pick(rng, others);
  return [first, second, ...Array.from({ length: PATHS - 2 }, () => int(rng, 0, COLS - 1))];
}

/** A uniform -1/0/+1 move (clamped); a crossing step is retried, then the path goes straight. */
function nextColumn(rng: Rng, steps: readonly Step[], row: number, from: number): number {
  for (let i = 0; i <= STEP_RETRIES; i++) {
    const to = Math.min(COLS - 1, Math.max(0, from + int(rng, -1, 1)));
    if (!steps.some((e) => crosses({ row, from, to }, e))) return to;
  }
  return from;
}

/** The 4 paths; each lists its column on rows 1 to 7. */
export function drawPaths(rng: Rng, tutorial: boolean): number[][] {
  const steps: Step[] = [];
  return startColumns(rng, tutorial).map((start) => {
    const path = [start];
    for (let row = 1; row < ROWS; row++) {
      const from = path[row - 1] as number;
      const to = nextColumn(rng, steps, row, from);
      steps.push({ row, from, to });
      path.push(to);
    }
    return path;
  });
}
