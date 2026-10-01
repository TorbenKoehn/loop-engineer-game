import fs from 'node:fs';
import path from 'node:path';
import { runBudgets } from '../budgets/index.ts';
import { resolveOverrides } from '../budgets/overrides.ts';
import type { Ctx } from '../budgets/util.ts';
import { at, check } from '../budgets/util.ts';
import { generateBoard } from '../gen/board.ts';
import { generateIndexes } from '../gen/index.ts';
import { generateBudgetsTable, TABLE_PATH } from '../gen/table.ts';
import { today } from './date.ts';
import { forgeItems } from './forge.ts';
import { validateDoc } from './frontmatter.ts';
import { gitHead } from './git.ts';
import { matchGlob } from './glob.ts';
import { structureFindings } from './structure.ts';
import type { Finding, Scan } from './types.ts';

export { today };

function read(root: string, rel: string): string | null {
  const abs = path.join(root, rel);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8').replace(/\r\n/g, '\n') : null;
}

const stale = (file: string, rule: string, message: string): Finding => ({
  file,
  severity: 'error',
  rule,
  message,
});

function indexFreshness(scan: Scan): Finding[] {
  const out: Finding[] = [];
  const hint = 'run `npm run harness:index`';
  const expected = generateIndexes(scan);
  for (const [rel, content] of expected) {
    const cur = read(scan.root, rel);
    if (cur === null) out.push(stale(rel, 'index', `INDEX.md missing; ${hint}`));
    else if (cur !== content) out.push(stale(rel, 'index', `INDEX.md out of date; ${hint}`));
  }
  for (const d of scan.docs) {
    if (d.kind === 'index' && !expected.has(d.rel))
      out.push(stale(d.rel, 'index', `orphan INDEX.md; ${hint}`));
  }
  return out;
}

function freshness(scan: Scan, now: string): Finding[] {
  const out = indexFreshness(scan);
  const board = scan.config.boardPath;
  if (read(scan.root, board) !== generateBoard(scan))
    out.push(stale(board, 'board', 'BOARD.md out of date; run `npm run harness:board`'));
  if (read(scan.root, TABLE_PATH) !== generateBudgetsTable(scan, now))
    out.push(stale(TABLE_PATH, 'budgets_table', 'out of date; run `npm run harness:budgets`'));
  return out;
}

const ORDER = { error: 0, warn: 1, info: 2 } as const;

export interface LintOpts {
  now?: string;
  head?: (rel: string) => string | null;
  /** Wall-clock start (ms) of the whole run, enabling the lint_s budget. */
  startedAt?: number;
}

function tail(ctx: Ctx, found: Finding[], startedAt?: number): Finding[] {
  const warnings = found.filter((f) => f.severity === 'warn').length;
  const extra = check(ctx, 'budget_warnings_total', at('.', 'warnings'), warnings);
  if (startedAt === undefined) return extra;
  return [
    ...extra,
    ...check(ctx, 'lint_s', at('.', 'lint run'), Math.round((Date.now() - startedAt) / 100) / 10),
  ];
}

export function lint(scan: Scan, opts: LintOpts = {}): Finding[] {
  const { config } = scan;
  const now = opts.now ?? today();
  const schema = scan.docs.flatMap((d) => {
    const def = config.frontmatter.special.find((s) => matchGlob(d.rel, s.glob));
    return validateDoc(d, config, def);
  });
  const ov = resolveOverrides(scan, now);
  const ctx: Ctx = {
    scan,
    items: forgeItems(scan.docs),
    today: now,
    head: opts.head ?? gitHead(scan.root),
    overrides: ov.values,
    overrideFindings: ov.findings,
  };
  const all = [...schema, ...structureFindings(scan), ...runBudgets(ctx), ...freshness(scan, now)];
  all.push(...tail(ctx, all, opts.startedAt));
  return all.sort((a, b) =>
    a.file < b.file
      ? -1
      : a.file > b.file
        ? 1
        : ORDER[a.severity] - ORDER[b.severity] || (a.rule < b.rule ? -1 : 1),
  );
}

export function hasErrors(findings: Finding[]): boolean {
  return findings.some((f) => f.severity === 'error');
}

export function formatFindings(findings: Finding[]): string {
  if (findings.length === 0) return 'harness lint: no findings';
  const lines: string[] = [];
  let current = '';
  for (const f of findings) {
    if (f.file !== current) {
      current = f.file;
      lines.push('', current);
    }
    lines.push(`  ${f.severity.padEnd(5)} [${f.rule}] ${f.message}`);
  }
  const n = (s: string): number => findings.filter((f) => f.severity === s).length;
  lines.push('', `harness lint: ${n('error')} errors, ${n('warn')} warnings, ${n('info')} info`);
  return lines.join('\n').trimStart();
}
