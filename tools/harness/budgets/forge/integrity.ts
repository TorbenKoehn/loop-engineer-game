import type { Item } from '../../core/forge.ts';
import { checklistCount, ofType } from '../../core/forge.ts';
import { parseFrontmatter } from '../../core/frontmatter.ts';
import type { Finding } from '../../core/types.ts';
import type { Check, Ctx } from '../util.ts';

const err = (file: string, rule: string, message: string): Finding => ({
  file,
  severity: 'error',
  rule,
  message,
});

const FLOW = ['backlog', 'ready', 'in-progress', 'review', 'done'];

/** Forward along the flow (skips ok), review back to in-progress, any to blocked or cancelled. */
export function transitionAllowed(from: string, to: string): boolean {
  if (from === to) return true;
  if (from === 'done' || from === 'cancelled') return false;
  if (to === 'blocked' || to === 'cancelled') return true;
  if (from === 'blocked') return to === 'ready' || to === 'in-progress';
  if (from === 'review' && to === 'in-progress') return true;
  return FLOW.indexOf(to) > FLOW.indexOf(from) && FLOW.includes(from);
}

const doneNeedsReview: Check = {
  id: 'done_needs_review',
  run: (ctx) => {
    const approved = new Set(
      ofType(ctx.items, 'review')
        .filter(
          (r) =>
            r.doc.data!.verdict === 'approved' &&
            /(?:^|\/)forge\/reviews\/R\d{3}-T\d{3}\.md$/.test(r.doc.rel),
        )
        .map((r) => String(r.doc.data!.task)),
    );
    return ofType(ctx.items, 'task')
      .filter((t) => t.status === 'done' && !approved.has(t.id))
      .map((t) =>
        err(
          t.doc.rel,
          'done_needs_review',
          `${t.id} is done without an approved review (forge/reviews/R###-${t.id}.md)`,
        ),
      );
  },
};

function againstHead(ctx: Ctx, item: Item): Finding[] {
  const text = ctx.head(item.doc.rel);
  if (text === null) return [];
  const prev = parseFrontmatter(text.replace(/\r\n/g, '\n'));
  const was = typeof prev.data?.status === 'string' ? prev.data.status : '';
  if (!was) return [];
  const out: Finding[] = [];
  if (!transitionAllowed(was, item.status)) {
    out.push(
      err(
        item.doc.rel,
        'status_transition',
        `${item.id}: illegal status change ${was} -> ${item.status} (vs HEAD)`,
      ),
    );
  }
  if (!['backlog', 'ready'].includes(was) && item.type === 'task') {
    const before = checklistCount(prev.body, 'Acceptance Criteria');
    const now = checklistCount(item.doc.body, 'Acceptance Criteria');
    if (now < before)
      out.push(
        err(
          item.doc.rel,
          'ac_decrease',
          `${item.id}: acceptance criteria ${before} -> ${now} after leaving backlog/ready`,
        ),
      );
  }
  return out;
}

const vsHead: Check = {
  id: 'forge_vs_head',
  run: (ctx) =>
    ctx.items
      .filter((i) => i.type === 'task' || i.type === 'epic')
      .flatMap((i) => againstHead(ctx, i)),
};

export const integrityChecks: Check[] = [doneNeedsReview, vsHead];
