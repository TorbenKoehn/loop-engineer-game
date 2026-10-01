import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { lint } from '../core/lint.ts';
import { scanRepo } from '../core/scan.ts';
import { generateBoard } from '../gen/board.ts';
import { writeIndexes } from '../gen/index.ts';
import { nextId, scaffold, slugify } from '../gen/scaffold.ts';
import { writeBudgetsTable } from '../gen/table.ts';
import { doc, makeRepo } from './testutil.ts';

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
    const epic = scaffold(root, 'epic', {
      title: 'Core loop',
      milestone: 'm1',
      date: '2026-10-01',
    });
    expect(epic).toBe('forge/epics/m1/E001-core-loop/EPIC.md');
    const t1 = scaffold(root, 'task', { epic: 'E001', title: 'First task', date: '2026-10-01' });
    scaffold(root, 'epic', { title: 'Second', milestone: 'm1', date: '2026-10-01' });
    const t2 = scaffold(root, 'task', { epic: 'E002', title: 'Other task', date: '2026-10-01' });
    expect(t1).toBe('forge/epics/m1/E001-core-loop/T001-first-task.md');
    expect(t2).toBe('forge/epics/m1/E002-second/T002-other-task.md');
    expect(
      scaffold(root, 'review', { task: 'T001', verdict: 'approved', date: '2026-10-01' }),
    ).toBe('forge/reviews/E001/R001-T001.md');
    expect(scaffold(root, 'retro', { title: 'Sprint one', date: '2026-10-01' })).toBe(
      'forge/retros/RT001-sprint-one.md',
    );
    const task = fs.readFileSync(path.join(root, t1), 'utf8');
    for (const h of [
      '## Goal',
      '## Context',
      '## Acceptance Criteria',
      '## Subtasks',
      '## Notes',
      '## Log',
    ]) {
      expect(task).toContain(h);
    }
    const scan = scanRepo(root);
    fs.writeFileSync(path.join(root, scan.config.boardPath), generateBoard(scan));
    writeBudgetsTable(scanRepo(root));
    writeIndexes(scanRepo(root));
    const errors = lint(scanRepo(root), { now: '2026-10-01', head: () => null }).filter(
      (f) => f.severity === 'error',
    );
    expect(errors).toEqual([]);
  });

  it('rejects unknown epics and bad enums', () => {
    const root = makeRepo();
    expect(() => scaffold(root, 'task', { epic: 'E001', title: 'x' })).toThrow(/not found/);
    scaffold(root, 'epic', { title: 'E' });
    expect(() => scaffold(root, 'task', { epic: 'E001', title: 'x', size: 'L' })).toThrow(/--size/);
  });

  it('scaffolds an epic under its milestone dir', () => {
    const root = makeRepo();
    const rel = scaffold(root, 'epic', { title: 'Nested', milestone: 'm2', date: '2026-10-01' });
    expect(rel).toBe('forge/epics/m2/E001-nested/EPIC.md');
    expect(fs.readFileSync(path.join(root, rel), 'utf8')).toContain('milestone: m2');
  });

  it('scaffolds a task next to a nested epic', () => {
    const root = makeRepo();
    scaffold(root, 'epic', { title: 'Nested', milestone: 'm1' });
    const rel = scaffold(root, 'task', { epic: 'E001', title: 'Inner' });
    expect(rel).toBe('forge/epics/m1/E001-nested/T001-inner.md');
    expect(fs.readFileSync(path.join(root, rel), 'utf8')).toContain('[E001](EPIC.md)');
  });

  it('rejects an unknown milestone', () => {
    const root = makeRepo();
    expect(() => scaffold(root, 'epic', { title: 'x', milestone: 'm9' })).toThrow(/m0, m1, m2, m3/);
  });

  it('review title fits fm_title_chars', () => {
    const root = makeRepo();
    scaffold(root, 'epic', { title: 'E' });
    const long = 'A'.repeat(60);
    scaffold(root, 'task', { epic: 'E001', title: long });
    const rel = scaffold(root, 'review', { task: 'T001', verdict: 'approved' });
    const m = /^title: (.*)$/m.exec(fs.readFileSync(path.join(root, rel), 'utf8'));
    const title = JSON.parse(m![1]!.startsWith('"') ? m![1]! : JSON.stringify(m![1]!)) as string;
    expect(title.length).toBeLessThanOrEqual(60);
    expect(title.startsWith('Review of T001')).toBe(true);
  });

  it('milestone must match parent dir', () => {
    const epic = (m: string): string =>
      doc({
        type: 'epic',
        id: 'E001',
        priority: 'p2',
        status: 'backlog',
        ...(m ? { milestone: m } : {}),
      });
    const errs = (files: Record<string, string>): string[] =>
      lint(scanRepo(makeRepo(files)), { now: '2026-10-01', head: () => null })
        .filter((f) => f.rule === 'milestone')
        .map((f) => f.severity);
    expect(errs({ 'forge/epics/m1/E001-x/EPIC.md': epic('m2') })).toEqual(['error']);
    expect(errs({ 'forge/epics/m2/E001-x/EPIC.md': epic('m2') })).toEqual([]);
    expect(errs({ 'forge/epics/E001-x/EPIC.md': epic('') })).toEqual([]);
  });

  it('scaffolds a review under its epic dir', () => {
    const root = makeRepo();
    scaffold(root, 'epic', { title: 'E', milestone: 'm0' });
    scaffold(root, 'task', { epic: 'E001', title: 'T' });
    expect(scaffold(root, 'review', { task: 'T001', verdict: 'approved' })).toBe(
      'forge/reviews/E001/R001-T001.md',
    );
  });

  it('shows WIP counts on the board', () => {
    const root = makeRepo();
    scaffold(root, 'epic', { title: 'E' });
    const rel = scaffold(root, 'task', { epic: 'E001', title: 'x' });
    const abs = path.join(root, rel);
    fs.writeFileSync(
      abs,
      fs.readFileSync(abs, 'utf8').replace('status: backlog', 'status: in-progress'),
    );
    const board = generateBoard(scanRepo(root));
    expect(board).toContain('## In Progress (1/3)');
    expect(board).toContain('| E001 |');
  });
});
