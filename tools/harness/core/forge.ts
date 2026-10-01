import type { Doc } from './types.ts';

export interface Item {
  id: string;
  type: 'epic' | 'task' | 'review' | 'retro';
  title: string;
  status: string;
  priority: string;
  doc: Doc;
}

const TYPES = ['epic', 'task', 'review', 'retro'];
const str = (v: unknown): string => (typeof v === 'string' ? v : '');

export function forgeItems(docs: Doc[]): Item[] {
  const out: Item[] = [];
  for (const doc of docs) {
    const d = doc.data;
    if (!d || !TYPES.includes(str(d.type)) || !str(d.id)) continue;
    out.push({
      id: str(d.id),
      type: d.type as Item['type'],
      title: str(d.title),
      status: str(d.status),
      priority: str(d.priority),
      doc,
    });
  }
  return out;
}

export function ofType(items: Item[], type: Item['type']): Item[] {
  return items.filter((i) => i.type === type);
}

/** Checklist items ("- [ ]" / "- [x]") under a "## <heading>" section of a doc body. */
export function checklistCount(body: string, heading: string): number {
  let inSection = false;
  let n = 0;
  for (const line of body.split('\n')) {
    const h = /^##\s+(.*?)\s*$/.exec(line);
    if (h) {
      inSection = h[1]!.toLowerCase() === heading.toLowerCase();
      continue;
    }
    if (inSection && /^\s*[-*]\s+\[[ xX]\]/.test(line)) n++;
  }
  return n;
}
