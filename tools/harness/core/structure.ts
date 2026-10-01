import { forgeItems, type Item, ofType } from './forge.ts';
import type { Finding, Scan } from './types.ts';

const err = (file: string, rule: string, message: string): Finding => ({
  file,
  severity: 'error',
  rule,
  message,
});

function duplicateIds(items: Item[]): Finding[] {
  const out: Finding[] = [];
  const seen = new Map<string, string>();
  for (const i of items) {
    const prev = seen.get(i.id);
    if (prev) out.push(err(i.doc.rel, 'id', `duplicate id ${i.id} (also in ${prev})`));
    else seen.set(i.id, i.doc.rel);
  }
  return out;
}

function taskRefs(items: Item[]): Finding[] {
  const epics = new Set(ofType(items, 'epic').map((e) => e.id));
  const tasks = new Set(ofType(items, 'task').map((t) => t.id));
  const out: Finding[] = [];
  for (const t of ofType(items, 'task')) {
    const d = t.doc.data!;
    if (typeof d.epic === 'string' && !epics.has(d.epic))
      out.push(err(t.doc.rel, 'ref', `epic ${d.epic} does not exist`));
    const deps = Array.isArray(d.depends_on) ? d.depends_on : [];
    for (const dep of deps.filter((x) => !tasks.has(String(x))))
      out.push(err(t.doc.rel, 'ref', `depends_on ${String(dep)} does not exist`));
  }
  return out;
}

function reviewRefs(items: Item[]): Finding[] {
  const tasks = new Set(ofType(items, 'task').map((t) => t.id));
  const out: Finding[] = [];
  for (const r of ofType(items, 'review')) {
    const task = r.doc.data!.task;
    if (typeof task === 'string' && !tasks.has(task))
      out.push(err(r.doc.rel, 'ref', `task ${task} does not exist`));
  }
  return out;
}

function idFindings(scan: Scan): Finding[] {
  const items = forgeItems(scan.docs);
  return [...duplicateIds(items), ...taskRefs(items), ...reviewRefs(items)];
}

export const structureFindings = idFindings;
