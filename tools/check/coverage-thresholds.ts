// Reads coverage budgets from harness.config.json (single source of truth).
import { readFileSync } from 'node:fs';

type Budgets = Record<string, { value: number }>;

function budget(budgets: Budgets, id: string): number {
  const entry = budgets[id];
  if (!entry) throw new Error(`harness.config.json: budget ${id} is missing`);
  return entry.value;
}

/** Warn-severity gate: returns a warning line if total line coverage is below the budget. */
export function totalLinesWarning(): string | undefined {
  const { totalLines } = coverageThresholds();
  try {
    const sum = JSON.parse(readFileSync('coverage/coverage-summary.json', 'utf8')) as {
      total: { lines: { pct: number } };
    };
    const pct = sum.total.lines.pct;
    if (pct < totalLines)
      return `WARNING: total line coverage ${pct}% is below coverage_total_lines ${totalLines}%`;
  } catch {
    return 'WARNING: coverage/coverage-summary.json not readable; total line coverage unchecked';
  }
  return undefined;
}

export function coverageThresholds() {
  const cfg = JSON.parse(
    readFileSync(new URL('../../harness.config.json', import.meta.url), 'utf8'),
  ) as { budgets: Budgets };
  return {
    simLines: budget(cfg.budgets, 'coverage_sim_lines'),
    simBranches: budget(cfg.budgets, 'coverage_sim_branches'),
    totalLines: budget(cfg.budgets, 'coverage_total_lines'),
  };
}
