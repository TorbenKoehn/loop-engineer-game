import { execFileSync } from 'node:child_process';

function git(root: string, args: string[]): string | null {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000 });
  } catch {
    return null;
  }
}

/** Reader for file content at git HEAD; null when untracked, uncommitted or not a repo. */
export function gitHead(root: string): (rel: string) => string | null {
  return (rel) => git(root, ['show', `HEAD:${rel}`]);
}

/** Date (YYYY-MM-DD) of the last commit touching a path, or null when untracked or no repo. */
export function lastCommitDate(root: string, rel: string): string | null {
  const out = git(root, ['log', '-1', '--format=%cs', '--', rel])?.trim();
  return out || null;
}
