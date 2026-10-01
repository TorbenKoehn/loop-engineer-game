import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { gitHead, gitStats, lastCommitDates } from '../core/git.ts';

function repo(n: number): { root: string; files: string[] } {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-git-'));
  const run = (...a: string[]): void => {
    execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], {
      cwd: root,
      stdio: 'ignore',
    });
  };
  run('init', '-q');
  const files = Array.from({ length: n }, (_, i) => `d/f${i}.md`);
  fs.mkdirSync(path.join(root, 'd'));
  for (const f of files) fs.writeFileSync(path.join(root, f), `content ${f}\n`);
  run('add', '.');
  run('commit', '-q', '-m', 'x');
  return { root, files };
}

function spawnsFor(n: number): number {
  const { root, files } = repo(n);
  fs.writeFileSync(path.join(root, 'untracked.md'), 'u');
  const before = gitStats.spawns;
  const head = gitHead(root, [...files, 'untracked.md']);
  const date = lastCommitDates(root);
  for (const f of files) {
    expect(head(f)).toBe(`content ${f}\n`);
    expect(date(f)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  }
  expect(head('untracked.md')).toBeNull();
  expect(date('untracked.md')).toBeNull();
  return gitStats.spawns - before;
}

describe('git batching', () => {
  it('spawns a constant number of git processes regardless of file count', () => {
    const small = spawnsFor(2);
    const large = spawnsFor(40);
    expect(large).toBe(small);
    expect(large).toBe(2);
  });
});
