import { checklistCount, ofType } from '../../core/forge.ts';
import type { Item } from '../../core/forge.ts';
import { check } from '../util.ts';
import type { Check, Ctx } from '../util.ts';

const tasks = (ctx: Ctx): Item[] => ofType(ctx.items, 'task');

const tasksPerEpic: Check = {
  id: 'tasks_per_epic',
  run: (ctx) =>
    ofType(ctx.items, 'epic').flatMap((e) => {
      const n = tasks(ctx).filter((t) => t.doc.data!.epic === e.id).length;
      return check(ctx, 'tasks_per_epic', e.doc.rel, n, e.doc, `epic ${e.id}`);
    }),
};

const checklists: Check = {
  id: 'task_checklists',
  run: (ctx) =>
    tasks(ctx).flatMap((t) => {
      const ac = checklistCount(t.doc.body, 'Acceptance Criteria');
      return [
        ...check(ctx, 'subtasks_per_task', t.doc.rel, checklistCount(t.doc.body, 'Subtasks'), t.doc),
        ...check(ctx, 'acceptance_criteria_max', t.doc.rel, ac, t.doc),
        ...(t.status === 'backlog' ? [] : check(ctx, 'acceptance_criteria_min', t.doc.rel, ac, t.doc)),
      ];
    }),
};

const COUNTED: [string, string, 'task' | 'epic'][] = [
  ['wip_in_progress', 'in-progress', 'task'],
  ['wip_review', 'review', 'task'],
  ['wip_blocked', 'blocked', 'task'],
  ['wip_ready', 'ready', 'task'],
  ['backlog_items', 'backlog', 'task'],
  ['epics_active', 'in-progress', 'epic'],
];

const wip: Check = {
  id: 'wip',
  run: (ctx) =>
    COUNTED.flatMap(([id, status, type]) => {
      const n = ofType(ctx.items, type).filter((t) => t.status === status).length;
      return check(ctx, id, ctx.scan.config.boardPath, n, undefined, `${n} ${type}s ${status}`);
    }),
};

const AGE: [string, string][] = [
  ['in_progress_age_days', 'in-progress'],
  ['blocked_age_days', 'blocked'],
];

const age: Check = {
  id: 'task_age',
  run: (ctx) =>
    AGE.flatMap(([id, status]) =>
      tasks(ctx)
        .filter((t) => t.status === status && typeof t.doc.data!.updated === 'string')
        .flatMap((t) => {
          const days = Math.round((Date.parse(ctx.today) - Date.parse(String(t.doc.data!.updated))) / 86_400_000);
          return Number.isNaN(days) ? [] : check(ctx, id, t.doc.rel, days, t.doc, `${t.id} ${status} since update`);
        }),
    ),
};

export const forgeChecks: Check[] = [tasksPerEpic, checklists, wip, age];
