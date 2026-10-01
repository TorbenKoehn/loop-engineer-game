import path from 'node:path';
import { budget } from '../core/config.ts';
import { forgeItems, ofType } from '../core/forge.ts';
import type { Item } from '../core/forge.ts';
import { GENERATED_MARK, writeIfChanged } from './index.ts';
import type { Scan } from '../core/types.ts';

const COLUMNS: { status: string; label: string; wip?: string }[] = [
  { status: 'backlog', label: 'Backlog' },
  { status: 'ready', label: 'Ready' },
  { status: 'in-progress', label: 'In Progress', wip: 'wip_in_progress' },
  { status: 'review', label: 'Review', wip: 'wip_review' },
  { status: 'blocked', label: 'Blocked' },
  { status: 'done', label: 'Done' },
  { status: 'cancelled', label: 'Cancelled' },
];

const cell = (s: string): string => s.replace(/\s+/g, ' ').replace(/\|/g, '\\|').trim();
const byPrioId = (a: Item, b: Item): number =>
  a.priority < b.priority ? -1 : a.priority > b.priority ? 1 : a.id < b.id ? -1 : 1;

const upd = (t: Item): string => String(t.doc.data!.updated ?? '');
const byDoneDesc = (a: Item, b: Item): number =>
  upd(a) !== upd(b) ? (upd(a) < upd(b) ? 1 : -1) : a.id < b.id ? 1 : -1;

function taskTable(tasks: Item[], boardDir: string): string[] {
  if (tasks.length === 0) return ['_none_', ''];
  const rows = tasks.map((t) => {
    const link = path.posix.relative(boardDir, t.doc.rel);
    const d = t.doc.data!;
    const v = (k: string): string => (typeof d[k] === 'string' ? (d[k] as string) : '');
    return `| [${t.id}](${link}) | ${cell(t.title)} | ${v('epic')} | ${t.priority} | ${v('model')} | ${v('size')} |`;
  });
  return ['| ID | Title | Epic | Priority | Model | Size |', '|---|---|---|---|---|---|', ...rows, ''];
}

function column(tasks: Item[], col: (typeof COLUMNS)[number], scan: Scan, boardDir: string): string[] {
  let items = tasks.filter((t) => t.status === col.status);
  let head = `## ${col.label} (${items.length})`;
  if (col.wip) head = `## ${col.label} (${items.length}/${budget(scan.config, col.wip).value})`;
  if (col.status === 'cancelled') return [head, ''];
  let note: string[] = [];
  if (col.status === 'done') {
    const shown = budget(scan.config, 'board_done_visible').value;
    const total = items.length;
    items = items.sort(byDoneDesc).slice(0, shown);
    head = `## Done (${total})`;
    if (total > shown) note = [`_Showing the last ${shown} of ${total} done tasks._`, ''];
  } else items.sort(byPrioId);
  return [head, '', ...note, ...taskTable(items, boardDir)];
}

function epicTable(items: Item[], tasks: Item[], scan: Scan, boardDir: string): string[] {
  const epics = ofType(items, 'epic').sort((a, b) => (a.id < b.id ? -1 : 1));
  const active = epics.filter((e) => e.status === 'in-progress').length;
  const lines = [`## Epic Progress (active ${active}/${budget(scan.config, 'epics_active').value})`, ''];
  if (epics.length === 0) return [...lines, '_none_', ''];
  lines.push('| Epic | Title | Status | Priority | Done/Total |', '|---|---|---|---|---|');
  for (const e of epics) {
    const mine = tasks.filter((t) => t.doc.data!.epic === e.id);
    const done = mine.filter((t) => t.status === 'done').length;
    const link = path.posix.relative(boardDir, e.doc.rel);
    lines.push(`| [${e.id}](${link}) | ${cell(e.title)} | ${e.status} | ${e.priority} | ${done}/${mine.length} |`);
  }
  return [...lines, ''];
}

export function generateBoard(scan: Scan): string {
  const items = forgeItems(scan.docs);
  const tasks = ofType(items, 'task');
  const boardDir = path.posix.dirname(scan.config.boardPath);
  const dates = items.map((i) => i.doc.data!.updated).filter((d): d is string => typeof d === 'string');
  const updated = dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : scan.config.index.fallbackDate;
  const lines = [
    '---',
    'title: "Forge Board"',
    'summary: "Generated Kanban board of forge tasks with WIP counts and epic progress"',
    'keywords: ["kanban", "board", "forge", "tasks", "epics"]',
    'type: index',
    'status: active',
    `updated: ${updated}`,
    'generated: true',
    '---',
    GENERATED_MARK,
    '',
    '# Forge Board',
    '',
    ...epicTable(items, tasks, scan, boardDir),
  ];
  for (const col of COLUMNS) lines.push(...column(tasks, col, scan, boardDir));
  return lines.join('\n');
}

export function writeBoard(scan: Scan): boolean {
  return writeIfChanged(scan.root, scan.config.boardPath, generateBoard(scan));
}
