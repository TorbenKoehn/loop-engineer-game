import { execFileSync } from 'node:child_process';

/** Number of git subprocesses spawned so far (asserted constant by tests). */
export const gitStats = { spawns: 0 };

function git(root: string, args: string[], input?: string): Buffer | null {
  gitStats.spawns++;
  try {
    return execFileSync('git', args, {
      cwd: root,
      input,
      stdio: [input === undefined ? 'ignore' : 'pipe', 'pipe', 'ignore'],
      timeout: 20000,
      maxBuffer: 1 << 29,
    });
  } catch {
    return null;
  }
}

/** Parse `git cat-file --batch` output for the given specs, in order. */
function parseBatch(out: Buffer, specs: string[]): Map<string, string | null> {
  const res = new Map<string, string | null>();
  let pos = 0;
  for (const spec of specs) {
    const nl = out.indexOf(10, pos);
    if (nl < 0) break;
    const [, kind, size] = out.toString('utf8', pos, nl).split(' ');
    pos = nl + 1;
    const len = kind === 'blob' ? Number(size) : -1;
    res.set(spec, len < 0 ? null : out.toString('utf8', pos, pos + len));
    pos += len < 0 ? 0 : len + 1;
  }
  return res;
}

/**
 * Reader for file content at git HEAD; null when untracked, uncommitted or not a repo.
 * All `rels` are fetched with a single `git cat-file --batch` on first use.
 */
export function gitHead(root: string, rels: string[]): (rel: string) => string | null {
  let cache: Map<string, string | null> | undefined;
  const load = (): Map<string, string | null> => {
    const specs = rels.map((r) => `HEAD:${r}`);
    const out = specs.length ? git(root, ['cat-file', '--batch'], `${specs.join('\n')}\n`) : null;
    const parsed = out ? parseBatch(out, specs) : new Map<string, string | null>();
    return new Map(rels.map((r) => [r, parsed.get(`HEAD:${r}`) ?? null]));
  };
  return (rel) => {
    cache ??= load();
    return cache.get(rel) ?? null;
  };
}

function parseLog(text: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const chunk of text.split(String.fromCharCode(0)).slice(1)) {
    const [date = '', ...files] = chunk.split(String.fromCharCode(10));
    for (const f of files) if (f && !map.has(f)) map.set(f, date.trim());
  }
  return map;
}

/** Last commit date (YYYY-MM-DD) per path, from one `git log --name-only` pass. */
export function lastCommitDates(root: string): (rel: string) => string | null {
  let cache: Map<string, string> | undefined;
  const load = (): Map<string, string> => {
    const args = ['-c', 'core.quotepath=off', 'log', '--name-only', '--format=%x00%cs'];
    const out = git(root, args);
    return out ? parseLog(out.toString('utf8')) : new Map();
  };
  return (rel) => {
    cache ??= load();
    return cache.get(rel) ?? null;
  };
}

/** Staged `--numstat -z -M --diff-filter=d` (whole-file deletions dropped); null outside a repo. */
export function stagedNumstat(root: string): string | null {
  const args = ['diff', '--cached', '--numstat', '-z', '-M', '--diff-filter=d'];
  return git(root, args)?.toString('utf8') ?? null;
}
