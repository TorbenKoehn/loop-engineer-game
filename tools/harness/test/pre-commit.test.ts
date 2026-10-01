import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { scanRepo } from '../core/scan.ts';
import { writeBoard } from '../gen/board.ts';
import { writeIndexes } from '../gen/index.ts';
import { writeBudgetsTable } from '../gen/table.ts';
import { doc, makeRepo } from './testutil.ts';

function cleanRepo(): string {
  const root = makeRepo();
  writeBudgetsTable(scanRepo(root));
  writeBoard(scanRepo(root));
  writeIndexes(scanRepo(root));
  return root;
}

const HOOK = path.resolve(import.meta.dirname, '../hooks/pre-commit.ts');
const TASK = 'forge/epics/E001-x/T001-a.md';
const BAD_TASK = doc(
  {
    type: 'task',
    id: 'T001',
    epic: 'E001',
    priority: 'p1',
    model: 'sonnet',
    size: 'S',
    status: 'done',
  },
  '# T\n\n## Acceptance Criteria\n- [ ] c1\n\n## Log\n',
);

function run(command: string, cwd: string) {
  const input = JSON.stringify({ cwd, tool_name: 'Bash', tool_input: { command } });
  return spawnSync('node', [HOOK], {
    input,
    encoding: 'utf8',
    env: { ...process.env, HARNESS_ROOT: cwd },
  });
}

describe('pre-commit hook', () => {
  it('blocks git commit on lint error', () => {
    const repo = makeRepo({ [TASK]: BAD_TASK });
    const heredoc = 'git commit -m "$(cat <<\'EOF\'\nmsg\nEOF\n)"';
    for (const cmd of ['git commit -m x', 'git add -A && git commit -q -m "x"', heredoc]) {
      const r = run(cmd, repo);
      expect(r.status).toBe(2);
      expect(r.stderr).toContain('done_ac_unchecked');
    }
  });

  it('allows clean commit and other commands', () => {
    const c = run('git commit -m x', cleanRepo());
    expect(c.stderr).toBe('');
    expect(c.status).toBe(0);
    const bad = makeRepo({ [TASK]: BAD_TASK });
    for (const cmd of ['git status', 'git log --grep commit', 'echo git commit']) {
      const r = run(cmd, bad);
      expect(r.status).toBe(0);
      expect(r.stderr).toBe('');
    }
  });
});
