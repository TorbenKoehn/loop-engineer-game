import { budget } from '../core/config.ts';
import { isValidDate } from '../core/frontmatter.ts';
import type { Data, Doc, Finding, Scan } from '../core/types.ts';
import type { Check, Ctx } from './util.ts';
import { at, check } from './util.ts';

export interface Resolved {
  values: Map<string, Map<string, number>>;
  findings: Finding[];
}

const DAY = 86_400_000;
const days = (a: string, b: string): number => Math.round((Date.parse(a) - Date.parse(b)) / DAY);

function problem(scan: Scan, today: string, id: string, e: Data): string | null {
  const c = scan.config.budgets;
  const def = c[id];
  if (!def) return `unknown budget "${id}"`;
  if (def.fixed) return `${id} is fixed and cannot be overridden`;
  if (typeof e.value !== 'number') return `${id}: value must be a number`;
  const minReason = budget(scan.config, 'override_reason_min_chars').value;
  if (typeof e.reason !== 'string' || e.reason.trim().length < minReason)
    return `${id}: reason needs at least ${minReason} chars`;
  if (typeof e.until !== 'string' || !isValidDate(e.until))
    return `${id}: until (YYYY-MM-DD) is required`;
  const maxDays = budget(scan.config, 'override_review_days').value;
  if (days(e.until, today) > maxDays) return `${id}: until is more than ${maxDays} days ahead`;
  const factor = budget(scan.config, 'override_max_factor').value;
  const tooFar = def.cmp === 'min' ? e.value < def.value / factor : e.value > def.value * factor;
  return tooFar
    ? `${id}: ${e.value} is beyond ${factor}x of the default ${def.value}; needs an ADR`
    : null;
}

interface Outcome {
  severity: Finding['severity'];
  message: string;
  /** Set when the override is active. */
  value?: number;
}

function classify(scan: Scan, today: string, id: string, e: Data): Outcome {
  const bad = problem(scan, today, id, e);
  if (bad) return { severity: 'error', message: bad };
  if (days(String(e.until), today) < 0)
    return {
      severity: 'warn',
      message: `${id}: override expired on ${String(e.until)}; original budget applies`,
    };
  return {
    severity: 'info',
    message: `${id} overridden to ${String(e.value)} until ${String(e.until)}: ${String(e.reason)}`,
    value: e.value as number,
  };
}

function docOverrides(scan: Scan, today: string, doc: Doc, out: Resolved): void {
  const ov = doc.data?.budget_override;
  if (!ov || typeof ov !== 'object' || Array.isArray(ov)) return;
  for (const [id, raw] of Object.entries(ov)) {
    const e = (raw && typeof raw === 'object' ? raw : {}) as Data;
    const { severity, message, value } = classify(scan, today, id, e);
    if (value !== undefined) {
      const m = out.values.get(doc.rel) ?? new Map<string, number>();
      m.set(id, value);
      out.values.set(doc.rel, m);
    }
    out.findings.push({ file: doc.rel, severity, rule: 'budget_override', message });
  }
}

export function resolveOverrides(scan: Scan, today: string): Resolved {
  const out: Resolved = { values: new Map(), findings: [] };
  for (const d of scan.docs) docOverrides(scan, today, d, out);
  return out;
}

const overrideCheck: Check = {
  id: 'budget_override',
  run: (ctx: Ctx) => {
    const total = [...ctx.overrides.values()].reduce((n, m) => n + m.size, 0);
    return [
      ...ctx.overrideFindings,
      ...check(ctx, 'overrides_total', at('.', 'active overrides'), total),
    ];
  },
};

export const overrideChecks: Check[] = [overrideCheck];
