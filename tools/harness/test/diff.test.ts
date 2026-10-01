import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { measureDiff, parseNumstat } from '../budgets/forge/diff.ts';
import { stagedNumstat } from '../core/git.ts';
import { makeRepo } from './testutil.ts';

const cli = path.resolve(import.meta.dirname, '../cli.ts');

const lines = (n: number, tag = 'l'): string =>
  Array.from({ length: n }, (_, i) => `${tag}${i}\n`).join('');

function git(root: string, ...args: string[]): void {
  const id = ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'core.autocrlf=false'];
  execFileSync('git', [...id, ...args], { cwd: root, stdio: 'ignore' });
}

function write(root: string, files: Record<string, string>): void {
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  }
}

/** Temp repo committing `base`, then staging `staged` on top. */
function stagedRepo(base: Record<string, string>, staged: Record<string, string>): string {
  const root = makeRepo(base);
  git(root, 'init', '-q');
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', 'base');
  write(root, staged);
  git(root, 'add', '-A');
  return root;
}

function measure(root: string): ReturnType<typeof measureDiff> {
  return measureDiff(parseNumstat(stagedNumstat(root) ?? ''));
}

/** Runs `node tools/harness/cli.ts diff` (= npm run harness:diff) inside the repo. */
function runCli(root: string): { status: number | null; out: string } {
  const env = { ...process.env };
  delete env.HARNESS_ROOT;
  delete env.CLAUDE_PROJECT_DIR;
  const r = spawnSync(process.execPath, [cli, 'diff'], { cwd: root, env, encoding: 'utf8' });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

const excluded = [
  'src/sim/a.test.ts',
  'src/ui/b.test.tsx',
  'tests/e2e/c.spec.ts',
  'src/sim/testing/d.ts',
  'tools/golden/fixtures/e.json',
  'content/f.jsonl',
  'package-lock.json',
  'docs/g.md',
];

describe('parseNumstat', () => {
  it('reads plain, binary and renamed records', () => {
    const z = '3\t1\tsrc/a.ts\0-\t-\timg.png\0' + '2\t0\t\0src/old.ts\0src/new.ts\0';
    expect(parseNumstat(z)).toEqual([
      { path: 'src/a.ts', added: 3, deleted: 1 },
      { path: 'img.png', added: 0, deleted: 0 },
      { path: 'src/new.ts', added: 2, deleted: 0 },
    ]);
  });
});

describe('measureDiff on a staged temp repo', () => {
  it('leaves each exclusion out of production but keeps it in total', () => {
    const staged = Object.fromEntries(excluded.map((p) => [p, lines(10)]));
    const root = stagedRepo({}, { ...staged, 'src/sim/prod.ts': lines(7) });
    const entries = parseNumstat(stagedNumstat(root) ?? '');
    expect(measureDiff(entries)).toEqual({ production: 7, total: 7 + 10 * excluded.length });
    for (const p of excluded) {
      const entry = entries.find((e) => e.path === p);
      expect(entry, p).toBeDefined();
      expect(measureDiff(entry ? [entry] : []), p).toEqual({ production: 0, total: 10 });
    }
  });

  it('counts a pure rename as 0', () => {
    const root = stagedRepo({ 'src/old.ts': lines(50) }, {});
    git(root, 'mv', 'src/old.ts', 'src/new.ts');
    expect(measure(root)).toEqual({ production: 0, total: 0 });
  });

  it('drops a deleted 500-line file from both numbers', () => {
    const root = stagedRepo({ 'src/dead.ts': lines(500) }, {});
    git(root, 'rm', '-q', 'src/dead.ts');
    expect(measure(root)).toEqual({ production: 0, total: 0 });
  });

  it('counts modified lines on both sides but not pure deletions in a kept file', () => {
    const root = stagedRepo(
      { 'src/kept.ts': lines(100), 'src/edit.ts': lines(20) },
      { 'src/kept.ts': lines(40), 'src/edit.ts': lines(20, 'x') },
    );
    expect(measure(root)).toEqual({ production: 40, total: 40 });
  });
});

describe('harness:diff limits (task_diff_lines 400)', () => {
  it('exits 0 at 400 production lines', () => {
    const r = runCli(stagedRepo({}, { 'src/a.ts': lines(400) }));
    expect(r.out).toContain('production=400 total=400');
    expect(r.status).toBe(0);
  });

  it('exits 1 naming task_diff_lines at 401 production lines', () => {
    const r = runCli(stagedRepo({}, { 'src/a.ts': lines(401) }));
    expect(r.out).toContain('production=401 total=401');
    expect(r.out).toContain('task_diff_lines');
    expect(r.status).toBe(1);
  });

  it('exits 1 naming the 2x total rule at 300 production and 801 total', () => {
    const r = runCli(stagedRepo({}, { 'src/a.ts': lines(300), 'docs/a.md': lines(501) }));
    expect(r.out).toContain('production=300 total=801');
    expect(r.out).toContain('2x total rule');
    expect(r.out).not.toContain('task_diff_lines');
    expect(r.status).toBe(1);
  });
});
