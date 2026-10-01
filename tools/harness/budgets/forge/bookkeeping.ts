import { ofType } from '../../core/forge.ts';
import type { Finding } from '../../core/types.ts';
import type { Check } from '../util.ts';

const err = (file: string, rule: string, message: string): Finding => ({
  file,
  severity: 'error',
  rule,
  message,
});

/** Lines of a "## <heading>" section of a doc body. */
function section(body: string, heading: string): string[] {
  const out: string[] = [];
  let inSection = false;
  for (const line of body.split('\n')) {
    const h = /^##\s+(.*?)\s*$/.exec(line);
    if (h) {
      inSection = h[1]!.toLowerCase() === heading.toLowerCase();
      continue;
    }
    if (inSection) out.push(line);
  }
  return out;
}

/** Acceptance criteria as checked flags, in order (AC n is index n-1). */
const criteria = (body: string): boolean[] =>
  section(body, 'Acceptance Criteria').flatMap((l) => {
    const m = /^\s*[-*]\s+\[([ xX])\]/.exec(l);
    return m ? [m[1] !== ' '] : [];
  });

const logLines = (body: string): string[] => section(body, 'Log').filter((l) => /^\s*-/.test(l));

const doneNeedsAllAc: Check = {
  id: 'done_ac_unchecked',
  run: (ctx) =>
    ofType(ctx.items, 'task')
      .filter((t) => t.status === 'done')
      .flatMap((t) => {
        const open = criteria(t.doc.body).filter((c) => !c).length;
        return open === 0
          ? []
          : [err(t.doc.rel, 'done_ac_unchecked', `${t.id} is done with ${open} unchecked AC`)];
      }),
};

const checkedNeedsLog: Check = {
  id: 'ac_checked_needs_log',
  run: (ctx) =>
    ofType(ctx.items, 'task')
      .filter((t) => t.status === 'review' || t.status === 'done')
      .flatMap((t) => {
        const log = logLines(t.doc.body).filter((l) => /verified/i.test(l));
        return criteria(t.doc.body).flatMap((checked, i) => {
          const n = i + 1;
          const named = new RegExp(`\\bAC${n}(?!\\d)`);
          if (!checked || log.some((l) => named.test(l))) return [];
          return [
            err(
              t.doc.rel,
              'ac_checked_needs_log',
              `${t.id}: AC${n} is checked but no Log line has "AC${n}" and "verified"`,
            ),
          ];
        });
      }),
};

const doneLogNeedsDone: Check = {
  id: 'done_log_not_done',
  run: (ctx) =>
    ofType(ctx.items, 'task')
      .filter((t) => t.status !== 'done')
      .filter((t) => logLines(t.doc.body).some((l) => /\bdone \(R\d{3}\)/.test(l)))
      .map((t) =>
        err(
          t.doc.rel,
          'done_log_not_done',
          `${t.id} has a "done (R###)" Log line but is ${t.status}`,
        ),
      ),
};

export const bookkeepingChecks: Check[] = [doneNeedsAllAc, checkedNeedsLog, doneLogNeedsDone];
