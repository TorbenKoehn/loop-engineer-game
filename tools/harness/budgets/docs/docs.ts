import type { Doc } from '../../core/types.ts';
import { matchGlob } from '../../core/glob.ts';
import { check, isGenerated, limit, tokens } from '../util.ts';
import type { Check, Ctx } from '../util.ts';
import { headingLevels, splitMd } from './md.ts';

/** Size budget ids (lines, tokens) that apply to a doc, by its kind. */
function sizeBudgets(doc: Doc): [string, string] | null {
  if (doc.kind === 'claude') return ['claude_md_lines', 'claude_md_tokens'];
  if (doc.kind === 'skill') return ['skill_md_lines', 'skill_md_tokens'];
  if (doc.kind === 'index') return null;
  if (doc.kind === 'exempt' || isGenerated(doc)) return null;
  return ['md_lines', 'md_tokens'];
}

const sizes: Check = {
  id: 'md_size',
  run: (ctx) =>
    ctx.scan.docs.flatMap((d) => {
      const ids = sizeBudgets(d);
      const lines = ids ? check(ctx, ids[0], d.rel, d.lines, d) : [];
      const toks = ids ? check(ctx, ids[1], d.rel, tokens(d.raw), d) : [];
      const idx = d.kind === 'index' ? check(ctx, 'index_tokens', d.rel, tokens(d.raw), d) : [];
      const rule = matchGlob(d.rel, '.claude/rules/**') ? check(ctx, 'rule_file_lines', d.rel, d.lines, d) : [];
      return [...lines, ...toks, ...idx, ...rule];
    }),
};

const prose = (ctx: Ctx): Doc[] => ctx.scan.docs.filter((d) => d.kind === 'doc' && !isGenerated(d));

const structure: Check = {
  id: 'md_structure',
  run: (ctx) =>
    prose(ctx).flatMap((d) => {
      const parts = splitMd(d.body);
      const deepest = Math.max(0, ...headingLevels(parts.prose));
      const out = check(ctx, 'md_heading_depth', d.rel, deepest, d);
      for (const f of parts.fences) {
        if (f.lang !== 'json') out.push(...check(ctx, 'md_code_block_lines', d.rel, f.lines, d, 'code block'));
      }
      const tocLimit = limit(ctx, 'md_toc_over_lines', d);
      if (tocLimit && d.lines > tocLimit.value && !/^##\s+Contents\s*$/m.test(d.body)) {
        out.push({ file: d.rel, severity: tocLimit.severity, rule: 'md_toc_over_lines', message: `${d.lines} lines but no "## Contents" section` });
      }
      return out;
    }),
};

const frontmatter: Check = {
  id: 'fm_limits',
  run: (ctx) =>
    prose(ctx).flatMap((d) => {
      const { title, summary, keywords, related } = d.data ?? {};
      return [
        ...(typeof title === 'string' ? check(ctx, 'fm_title_chars', d.rel, title.length, d) : []),
        ...(typeof summary === 'string' ? check(ctx, 'fm_summary_chars', d.rel, summary.length, d) : []),
        ...(Array.isArray(keywords)
          ? [...check(ctx, 'fm_keywords_min', d.rel, keywords.length, d), ...check(ctx, 'fm_keywords_max', d.rel, keywords.length, d)]
          : []),
        ...(Array.isArray(related) ? check(ctx, 'fm_related_max', d.rel, related.length, d) : []),
      ];
    }),
};

const stale: Check = {
  id: 'doc_stale_days',
  run: (ctx) =>
    prose(ctx).flatMap((d) => {
      const { updated, status } = d.data ?? {};
      if (typeof updated !== 'string' || status !== 'active') return [];
      const days = Math.floor((Date.parse(ctx.today) - Date.parse(updated)) / 86_400_000);
      return Number.isNaN(days) ? [] : check(ctx, 'doc_stale_days', d.rel, days, d, 'last updated');
    }),
};

const adrs: Check = {
  id: 'adr',
  run: (ctx) => {
    const all = ctx.scan.docs.filter((d) => d.data?.type === 'adr');
    const active = all.filter((d) => d.data?.status === 'active').length;
    return [...all.flatMap((d) => check(ctx, 'adr_lines', d.rel, d.lines, d)), ...check(ctx, 'adr_active', 'docs', active, undefined, 'active ADRs')];
  },
};

export const docChecks: Check[] = [sizes, structure, frontmatter, stale, adrs];
