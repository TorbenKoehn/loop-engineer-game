// Pure skip logic for the build and e2e steps of `npm run check`.
import { execSync } from 'node:child_process';

const WATCHED = ['src/', 'tests/e2e/'];

/** Skip reason when no changed path is under src/ or tests/e2e/, else undefined. */
export function e2eSkipReason(changed: string[]): string | undefined {
  if (changed.length === 0) return undefined; // clean tree (or git failed): always run
  if (changed.some((p) => WATCHED.some((w) => p.startsWith(w)))) return undefined;
  return 'no changes under src/ or tests/e2e/';
}

/** Paths from `git status --porcelain` output; renames use the new path. */
export function parsePorcelain(out: string): string[] {
  return out
    .split('\n')
    .filter((l) => l.length > 3)
    .map((l) => (l.slice(3).split(' -> ').pop() as string).replace(/^"|"$/g, ''));
}

/** Changed paths against HEAD, including untracked files; empty if git fails. */
export function changedPaths(): string[] {
  try {
    return parsePorcelain(execSync('git status --porcelain -uall', { encoding: 'utf8' }));
  } catch {
    return [];
  }
}
