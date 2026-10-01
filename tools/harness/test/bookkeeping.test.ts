import { describe, expect, it } from 'vitest';
import { lint } from '../core/lint.ts';
import { scanRepo } from '../core/scan.ts';
import { doc, makeRepo } from './testutil.ts';

const TASK = 'forge/epics/E001-x/T001-a.md';

function task(status: string, boxes: string, log: string[] = []): string {
  const ac = boxes
    .split('')
    .map((b, i) => `- [${b}] c${i + 1}`)
    .join('\n');
  const fields = {
    type: 'task',
    id: 'T001',
    epic: 'E001',
    priority: 'p1',
    model: 'sonnet',
    size: 'S',
    status,
  };
  const lines = log.map((l) => `- 2026-10-01: ${l}`).join('\n');
  return doc(fields, `# T\n\n## Acceptance Criteria\n${ac}\n\n## Log\n${lines}\n`);
}

function errors(content: string, rule: string): string[] {
  const repo = makeRepo({ [TASK]: content });
  return lint(scanRepo(repo), { now: '2026-10-01', head: () => null })
    .filter((f) => f.rule === rule)
    .map((f) => f.message);
}

describe('forge bookkeeping', () => {
  it('done task with unchecked AC is an error', () => {
    expect(errors(task('done', 'x '), 'done_ac_unchecked')).toHaveLength(1);
    expect(errors(task('done', 'xx'), 'done_ac_unchecked')).toEqual([]);
    expect(errors(task('review', 'x '), 'done_ac_unchecked')).toEqual([]);
  });

  it('checked AC without verified Log line is an error', () => {
    for (const status of ['review', 'done']) {
      const found = errors(task(status, 'xx'), 'ac_checked_needs_log');
      expect(found).toHaveLength(2);
      expect(found[1]).toContain('AC2');
      const one = errors(task(status, 'xx', ['AC1 verified: ok']), 'ac_checked_needs_log');
      expect(one).toHaveLength(1);
      expect(one[0]).toContain('AC2');
      expect(errors(task(status, 'xx', ['AC1, AC2 verified: ok']), 'ac_checked_needs_log')).toEqual(
        [],
      );
    }
    expect(errors(task('review', 'x ', ['AC1 verified']), 'ac_checked_needs_log')).toEqual([]);
    expect(errors(task('review', ' '), 'ac_checked_needs_log')).toEqual([]);
    expect(errors(task('in-progress', 'x'), 'ac_checked_needs_log')).toEqual([]);
    expect(errors(task('review', 'x', ['AC10 verified']), 'ac_checked_needs_log')).toHaveLength(1);
  });

  it('done Log line on a task not done is an error', () => {
    const log = ['done (R012)'];
    expect(errors(task('review', ' ', log), 'done_log_not_done')).toHaveLength(1);
    expect(errors(task('done', 'x', [...log, 'AC1 verified']), 'done_log_not_done')).toEqual([]);
  });
});
