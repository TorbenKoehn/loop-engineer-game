import fs from 'node:fs';
import path from 'node:path';
import { today } from '../core/date.ts';
import { forgeItems, ofType } from '../core/forge.ts';
import { scanRepo } from '../core/scan.ts';
import type { Scan } from '../core/types.ts';

export interface ScaffoldOpts {
  title?: string;
  priority?: string;
  epic?: string;
  model?: string;
  size?: string;
  task?: string;
  verdict?: string;
  date?: string;
  milestone?: string;
}

export function slugify(s: string): string {
  const slug = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '');
  return slug || 'untitled';
}

/** Next free numeric id for a prefix (E, T, R, RT) among the given existing ids. */
export function nextId(existing: string[], prefix: string): string {
  const re = new RegExp(`^${prefix}(\\d+)$`);
  let max = 0;
  for (const id of existing) {
    const m = re.exec(id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

function existingIds(scan: Scan): string[] {
  const ids = forgeItems(scan.docs).map((i) => i.id);
  for (const d of scan.docs) {
    const m = /^(RT\d+|[ETR]\d+)(?:-|\.)/.exec(d.rel.slice(d.rel.lastIndexOf('/') + 1));
    if (m) ids.push(m[1]!);
  }
  return ids;
}

function keywords(title: string, base: string[]): string[] {
  const words = title
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3);
  const all = [...new Set([...base, ...words])].slice(0, 6);
  for (const pad of ['forge', 'planning', 'todo'])
    if (all.length < 3 && !all.includes(pad)) all.push(pad);
  return all;
}

function frontmatter(fields: Record<string, unknown>): string {
  const lines = Object.entries(fields).map(([k, v]) =>
    Array.isArray(v)
      ? `${k}: [${v.map((x) => JSON.stringify(x)).join(', ')}]`
      : `${k}: ${typeof v === 'string' && /[:#"']|^\s|\s$/.test(v) ? JSON.stringify(v) : v}`,
  );
  return `---\n${lines.join('\n')}\n---\n`;
}

function need<T>(v: T | undefined, flag: string): T {
  if (v === undefined || v === '') throw new Error(`missing required --${flag}`);
  return v;
}

function oneOf(v: string, allowed: string[], flag: string): string {
  if (!allowed.includes(v))
    throw new Error(`--${flag} must be one of ${allowed.join(', ')} (got ${v})`);
  return v;
}

const P = ['p0', 'p1', 'p2', 'p3'];
const MILESTONES = ['m0', 'm1', 'm2', 'm3'];
const TITLE_MAX = 60;

function epicDoc(scan: Scan, o: ScaffoldOpts): { rel: string; text: string } {
  const title = need(o.title, 'title');
  const id = nextId(existingIds(scan), 'E');
  const milestone =
    o.milestone === undefined ? undefined : oneOf(o.milestone, MILESTONES, 'milestone');
  const fm = frontmatter({
    id,
    title,
    summary: `Epic: ${title}`,
    keywords: keywords(title, ['epic']),
    type: 'epic',
    status: 'backlog',
    priority: oneOf(o.priority ?? 'p2', P, 'priority'),
    ...(milestone ? { milestone } : {}),
    updated: o.date ?? today(),
  });
  const body = `\n# ${id}: ${title}\n\n## Goal\n\n## Scope\n\n## Out of Scope\n\n## Definition of Done\n\n- [ ] \n`;
  const dir = `forge/epics/${milestone ? `${milestone}/` : ''}${id}-${slugify(title)}`;
  return { rel: `${dir}/EPIC.md`, text: fm + body };
}

function taskDoc(scan: Scan, o: ScaffoldOpts): { rel: string; text: string } {
  const title = need(o.title, 'title');
  const epicId = need(o.epic, 'epic');
  const epic = ofType(forgeItems(scan.docs), 'epic').find((e) => e.id === epicId);
  if (!epic) throw new Error(`epic ${epicId} not found`);
  const id = nextId(existingIds(scan), 'T');
  const fm = frontmatter({
    id,
    epic: epicId,
    title,
    summary: `Task: ${title}`,
    keywords: keywords(title, ['task']),
    type: 'task',
    status: 'backlog',
    priority: oneOf(o.priority ?? 'p2', P, 'priority'),
    model: oneOf(o.model ?? 'sonnet', ['opus', 'sonnet'], 'model'),
    size: oneOf(o.size ?? 'S', ['S', 'M'], 'size'),
    updated: o.date ?? today(),
    related: ['EPIC.md'],
  });
  const body = `\n# ${id}: ${title}\n\n## Goal\n\n## Context\n\n- Epic: [${epicId}](EPIC.md)\n\n## Acceptance Criteria\n\n- [ ] \n\n## Subtasks\n\n- [ ] \n\n## Notes\n\n## Log\n\n- ${o.date ?? today()}: created\n`;
  return { rel: `${path.posix.dirname(epic.doc.rel)}/${id}-${slugify(title)}.md`, text: fm + body };
}

function reviewDoc(scan: Scan, o: ScaffoldOpts): { rel: string; text: string } {
  const taskId = need(o.task, 'task');
  const task = ofType(forgeItems(scan.docs), 'task').find((t) => t.id === taskId);
  if (!task) throw new Error(`task ${taskId} not found`);
  const verdict = oneOf(need(o.verdict, 'verdict'), ['approved', 'changes-requested'], 'verdict');
  const id = nextId(existingIds(scan), 'R');
  const dir = `forge/reviews/${String(task.doc.data!.epic)}`;
  const prefix = `Review of ${taskId}: `;
  const title =
    prefix.length + task.title.length <= TITLE_MAX
      ? prefix + task.title
      : `${prefix}${task.title.slice(0, TITLE_MAX - prefix.length - 1).trimEnd()}…`;
  const fm = frontmatter({
    id,
    task: taskId,
    verdict,
    title,
    summary: `Review of ${taskId} (${verdict})`,
    keywords: keywords(task.title, ['review']),
    type: 'review',
    status: 'active',
    updated: o.date ?? today(),
    related: [path.posix.relative(dir, task.doc.rel)],
  });
  const body = `\n# ${id}: Review of ${taskId}\n\n## Summary\n\n## Findings\n\n## Verdict\n\n${verdict}\n`;
  return { rel: `${dir}/${id}-${taskId}.md`, text: fm + body };
}

function retroDoc(scan: Scan, o: ScaffoldOpts): { rel: string; text: string } {
  const title = need(o.title, 'title');
  const id = nextId(existingIds(scan), 'RT');
  const fm = frontmatter({
    id,
    title,
    summary: `Retrospective: ${title}`,
    keywords: keywords(title, ['retro']),
    type: 'retro',
    status: 'active',
    updated: o.date ?? today(),
  });
  const body = `\n# ${id}: ${title}\n\n## What Went Well\n\n## What Went Wrong\n\n## Learnings\n\n## Actions\n\n- [ ] \n`;
  return { rel: `forge/retros/${id}-${slugify(title)}.md`, text: fm + body };
}

const KINDS = { epic: epicDoc, task: taskDoc, review: reviewDoc, retro: retroDoc };

/** Creates a forge item and returns its repo-relative path. */
export function scaffold(root: string, kind: string, opts: ScaffoldOpts): string {
  const make = KINDS[kind as keyof typeof KINDS];
  if (!make) throw new Error(`unknown kind "${kind}" (epic|task|review|retro)`);
  const { rel, text } = make(scanRepo(root), opts);
  const abs = path.join(root, rel);
  if (fs.existsSync(abs)) throw new Error(`refusing to overwrite ${rel}`);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, text, 'utf8');
  return rel;
}
