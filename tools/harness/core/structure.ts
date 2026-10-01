import { forgeItems, ofType } from './forge.ts';
import type { Doc, Finding, Scan } from './types.ts';

const err = (file: string, rule: string, message: string): Finding => ({ file, severity: 'error', rule, message });

function idFindings(scan: Scan): Finding[] {
  const items = forgeItems(scan.docs);
  const out: Finding[] = [];
  const seen = new Map<string, string>();
  for (const i of items) {
    const prev = seen.get(i.id);
    if (prev) out.push(err(i.doc.rel, 'id', `duplicate id ${i.id} (also in ${prev})`));
    else seen.set(i.id, i.doc.rel);
  }
  const epics = new Set(ofType(items, 'epic').map((e) => e.id));
  const tasks = new Set(ofType(items, 'task').map((t) => t.id));
  for (const t of ofType(items, 'task')) {
    const d = t.doc.data!;
    if (typeof d.epic === 'string' && !epics.has(d.epic)) out.push(err(t.doc.rel, 'ref', `epic ${d.epic} does not exist`));
    const deps = Array.isArray(d.depends_on) ? d.depends_on : [];
    for (const dep of deps) {
      if (!tasks.has(String(dep))) out.push(err(t.doc.rel, 'ref', `depends_on ${String(dep)} does not exist`));
    }
  }
  for (const r of ofType(items, 'review')) {
    const task = r.doc.data!.task;
    if (typeof task === 'string' && !tasks.has(task)) out.push(err(r.doc.rel, 'ref', `task ${task} does not exist`));
  }
  return out;
}

export const structureFindings = idFindings;
