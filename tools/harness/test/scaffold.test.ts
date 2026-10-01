import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { generateBoard } from '../gen/board.ts';
import { writeIndexes } from '../gen/index.ts';
import { writeBudgetsTable } from '../gen/table.ts';
import { lint } from '../core/lint.ts';
import { nextId, scaffold, slugify } from '../gen/scaffold.ts';
import { scanRepo } from '../core/scan.ts';
import { makeRepo } from './testutil.ts';

describe('scaffold', () => {
  it('allocates next free ids per prefix', () => {
    expect(nextId([], 'T')).toBe('T001');
    expect(nextId(['T001', 'T007', 'E009', 'RT004'], 'T')).toBe('T008');
    expect(nextId(['R001', 'RT005'], 'R')).toBe('R002');
    expect(nextId(['R001', 'RT005'], 'RT')).toBe('RT006');
  });

  it('slugifies titles', () => {
    expect(slugify('Hello, World! Ünï')).toBe('hello-world-n');
    expect(slugify('***')).toBe('untitled');
  });

  it('creates epic, tasks, review, retro with globally unique ids and lints clean', () => {
    const root = makeRepo();
    const epic = scaffold(root, 'epic', { title: 'Core loop', date: '2026-10-01' });
    expect(epic).toBe('forge/epics/E001-core-loop/EPIC.md');
    const t1 = scaffold(root, 'task', { epic: 'E001', title: 'First task', date: '2026-10-01' });
    scaffold(root, 'epic', { title: 'Second', date: '2026-10-01' });
    const t2 = scaffold(root, 'task', { epic: 'E002', title: 'Other task', date: '2026-10-01' });
    expect(t1).toBe('forge/epics/E001-core-loop/T001-first-task.md');
    expect(t2).toBe('forge/epics/E002-second/T002-other-task.md');
    expect(scaffold(root, 'review', { task: 'T001', verdict: 'approved', date: '2026-10-01' })).toBe('forge/reviews/R001-T001.md');
    expect(scaffold(root, 'retro', { title: 'Sprint one', date: '2026-10-01' })).toBe('forge/retros/RT001-sprint-one.md');
    const task = fs.readFileSync(path.join(root, t1), 'utf8');
    for (const h of ['## Goal', '## Context', '## Acceptance Criteria', '## Subtasks', '## Notes', '## Log']) {
      expect(task).toContain(h);
    }
    const scan = scanRepo(root);
    fs.writeFileSync(path.join(root, scan.config.boardPath), generateBoard(scan));
    writeBudgetsTable(scanRepo(root));
    writeIndexes(scanRepo(root));
    const errors = lint(scanRepo(root), { now: '2026-10-01', head: () => null }).filter((f) => f.severity === 'error');
    expect(errors).toEqual([]);
  });

  it('rejects unknown epics and bad enums', () => {
    const root = makeRepo();
    expect(() => scaffold(root, 'task', { epic: 'E001', title: 'x' })).toThrow(/not found/);
    scaffold(root, 'epic', { title: 'E' });
    expect(() => scaffold(root, 'task', { epic: 'E001', title: 'x', size: 'L' })).toThrow(/--size/);
  });

  it('shows WIP counts on the board', () => {
    const root = makeRepo();
    scaffold(root, 'epic', { title: 'E' });
    const rel = scaffold(root, 'task', { epic: 'E001', title: 'x' });
    const abs = path.join(root, rel);
    fs.writeFileSync(abs, fs.readFileSync(abs, 'utf8').replace('status: backlog', 'status: in-progress'));
    const board = generateBoard(scanRepo(root));
    expect(board).toContain('## In Progress (1/3)');
    expect(board).toContain('| E001 |');
  });
});
