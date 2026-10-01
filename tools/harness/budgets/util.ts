import { budget } from '../core/config.ts';
import type { Item } from '../core/forge.ts';
import type { Doc, Finding, Scan } from '../core/types.ts';

export interface Ctx {
  scan: Scan;
  items: Item[];
  today: string;
  /** Content of a repo file at git HEAD, or null (untracked, no repo, no commit). */
  head: (rel: string) => string | null;
  /** Valid, active per-doc overrides: doc path to budget id to value. */
  overrides: Map<string, Map<string, number>>;
  /** Findings about the overrides themselves (invalid, expired, informational). */
  overrideFindings: Finding[];
}

export interface Check {
  id: string;
  run: (ctx: Ctx) => Finding[];
}

export interface Limit {
  value: number;
  warnAt?: number;
  min: boolean;
  severity: 'error' | 'warn';
}

export const tokens = (s: string): number => Math.ceil(s.length / 3);

/** Effective limit for a budget, honouring a doc's validated budget_override. */
export function limit(ctx: Ctx, id: string, doc?: Doc): Limit | null {
  const def = budget(ctx.scan.config, id);
  if (def.severity === 'process') return null;
  const min = def.cmp === 'min';
  const ov = doc ? ctx.overrides.get(doc.rel)?.get(id) : undefined;
  if (ov !== undefined) return { value: ov, min, severity: def.severity };
  return { value: def.value, warnAt: def.warn_at, min, severity: def.severity };
}

/** Where a measurement was taken: file, optional doc (for overrides) and label. */
export interface Loc {
  file: string;
  doc?: Doc;
  what?: string;
}

export const at = (file: string, what?: string): Loc => ({ file, what });
export const inDoc = (doc: Doc, what?: string): Loc => ({ file: doc.rel, doc, what });

/** Compare a measurement with its budget (max or min); warns between warn_at and the hard value. */
export function check(ctx: Ctx, id: string, loc: Loc, actual: number): Finding[] {
  const { file, doc, what = '' } = loc;
  const l = limit(ctx, id, doc);
  if (!l) return [];
  const unit = budget(ctx.scan.config, id).unit;
  const label = what ? `${what}: ` : '';
  const beyond = (bound: number): boolean => (l.min ? actual < bound : actual > bound);
  const verb = l.min ? 'is below minimum' : 'exceeds budget';
  const mk = (severity: 'error' | 'warn', bound: number, extra = ''): Finding[] => [
    { file, severity, rule: id, message: `${label}${actual} ${unit} ${verb} ${bound}${extra}` },
  ];
  if (beyond(l.value)) return mk(l.severity, l.value);
  if (l.warnAt !== undefined && beyond(l.warnAt)) return mk('warn', l.warnAt, ' (warn_at)');
  return [];
}

export const isGenerated = (doc: Doc): boolean =>
  doc.kind === 'index' || doc.data?.generated === true;
