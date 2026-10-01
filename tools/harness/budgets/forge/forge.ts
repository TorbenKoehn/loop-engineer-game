import type { Item } from '../../core/forge.ts';
import { checklistCount, ofType } from '../../core/forge.ts';
import type { Check, Ctx } from '../util.ts';
import { at, check, inDoc } from '../util.ts';

const tasks = (ctx: Ctx): Item[] => ofType(ctx.items, 'task');

const tasksPerEpic: Check = {
  id: 'tasks_per_epic',
  run: (ctx) =>
    ofType(ctx.items, 'epic').flatMap((e) => {
      const n = tasks(ctx).filter((t) => t.doc.data!.epic === e.id).length;
      return check(ctx, 'tasks_per_epic', inDoc(e.doc, `epic ${e.id}`), n);
    }),
};

const checklists: Check = {
  id: 'task_checklists',
  run: (ctx) =>
    tasks(ctx).flatMap((t) => {
      const ac = checklistCount(t.doc.body, 'Acceptance Criteria');
      return [
        ...check(ctx, 'subtasks_per_task', inDoc(t.doc), checklistCount(t.doc.body, 'Subtasks')),
        ...check(ctx, 'acceptance_criteria_max', inDoc(t.doc), ac),
        ...(t.status === 'backlog' ? [] : check(ctx, 'acceptance_criteria_min', inDoc(t.doc), ac)),
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
      return check(ctx, id, at(ctx.scan.config.boardPath, `${n} ${type}s ${status}`), n);
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
          const days = Math.round(
            (Date.parse(ctx.today) - Date.parse(String(t.doc.data!.updated))) / 86_400_000,
          );
          return Number.isNaN(days)
            ? []
            : check(ctx, id, inDoc(t.doc, `${t.id} ${status} since update`), days);
        }),
    ),
};

export const forgeChecks: Check[] = [tasksPerEpic, checklists, wip, age];
