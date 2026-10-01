import { matchAny } from '../../core/glob.ts';

/** Paths left out of production lines (docs/harness/budgets.md#measuring-task-diffs). */
export const DIFF_EXCLUDE = [
  '**/*.test.ts',
  '**/*.test.tsx',
  'tests/**',
  '**/testing/**',
  '**/fixtures/**',
  '**/*.jsonl',
  '**/package-lock.json',
  '**/*.md',
];

export interface NumstatEntry {
  path: string;
  added: number;
  deleted: number;
}

export interface DiffSize {
  production: number;
  total: number;
}

const count = (s: string): number => (s === '-' ? 0 : Number(s) || 0);

/** Parse `git diff --numstat -z` output; a rename reports its new path. */
export function parseNumstat(z: string): NumstatEntry[] {
  const tokens = z.split('\0');
  const entries: NumstatEntry[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const [a = '', d = '', ...rest] = (tokens[i] ?? '').split('\t');
    if (!a) continue;
    let rel = rest.join('\t');
    if (!rel) {
      rel = tokens[i + 2] ?? '';
      i += 2;
    }
    entries.push({ path: rel, added: count(a), deleted: count(d) });
  }
  return entries;
}

/**
 * Lines one file adds to the budget: added lines plus the deleted lines they replace.
 * Deletions beyond the additions are pure (dead-code) deletions and are free.
 */
export function fileLines(e: NumstatEntry): number {
  return e.added + Math.min(e.added, e.deleted);
}

export function measureDiff(entries: NumstatEntry[]): DiffSize {
  let production = 0;
  let total = 0;
  for (const e of entries) {
    const n = fileLines(e);
    total += n;
    if (!matchAny(e.path, DIFF_EXCLUDE)) production += n;
  }
  return { production, total };
}

/** Budget breaches of a measured diff against `task_diff_lines` = limit. */
export function diffBreaches(size: DiffSize, limit: number): string[] {
  const out: string[] = [];
  if (size.production > limit)
    out.push(`task_diff_lines: production ${size.production} > ${limit}`);
  if (size.total > 2 * limit) out.push(`2x total rule: total ${size.total} > ${2 * limit}`);
  return out;
}
