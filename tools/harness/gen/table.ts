import fs from 'node:fs';
import path from 'node:path';
import { today } from '../core/date.ts';
import type { BudgetDef, Config, Scan } from '../core/types.ts';
import { GENERATED_MARK, writeIfChanged } from './index.ts';

export const TABLE_PATH = 'docs/harness/budgets-table.md';

const AREAS: [string, string][] = [
  ['docs', 'Docs and context'],
  ['code', 'Code'],
  ['perf', 'Tests, performance and assets'],
  ['forge', 'Forge (tasks and epics)'],
  ['agents', 'Agents'],
  ['meta', 'Harness meta'],
];

const cell = (s: string): string => s.replace(/\|/g, '\\|');

function valueCell(b: BudgetDef): string {
  const sign = b.cmp === 'min' ? '>= ' : '';
  return `${sign}${b.value} ${b.unit}${b.fixed ? ' (fixed)' : ''}`;
}

function section(label: string, rows: [string, BudgetDef][]): string[] {
  const head = [
    '| Budget | Value | Warn at | Severity | Enforced by | Description |',
    '|---|---|---|---|---|---|',
  ];
  const body = rows.map(
    ([id, b]) =>
      `| \`${id}\` | ${cell(valueCell(b))} | ${b.warn_at ?? ''} | ${b.severity} | ${b.enforced_by} | ${cell(b.description)} |`,
  );
  return [`## ${label}`, '', ...head, ...body, ''];
}

function summary(config: Config): string {
  const all = Object.values(config.budgets);
  const n = (by: string): number => all.filter((b) => b.enforced_by === by).length;
  return `${all.length} budgets: ${n('harness')} harness, ${n('biome')} biome, ${n('vitest')} vitest, ${n('process')} process`;
}

export function renderBudgetsTable(config: Config, updated: string): string {
  const entries = Object.entries(config.budgets);
  const lines = [
    '---',
    'title: "Budgets table"',
    `summary: "Generated table of every repo budget by area: value, warn_at, severity and who enforces it"`,
    'keywords: ["budgets", "limits", "harness", "lint", "table"]',
    'type: index',
    'status: active',
    `updated: ${updated}`,
    'generated: true',
    '---',
    GENERATED_MARK,
    '',
    '# Budgets table',
    '',
    `Source: harness.config.json (edit there, then run npm run harness:budgets). ${summary(config)}.`,
    'Severity process budgets are checked by the orchestrator or reviewer, not linted.',
    '',
  ];
  for (const [area, label] of AREAS) {
    const rows = entries.filter(([, b]) => b.area === area);
    if (rows.length) lines.push(...section(label, rows));
  }
  return lines.join('\n');
}

function existing(scan: Scan): string | null {
  const abs = path.join(scan.root, TABLE_PATH);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8').replace(/\r\n/g, '\n') : null;
}

/** Expected file content; keeps the old `updated` date while the table itself is unchanged. */
export function generateBudgetsTable(scan: Scan, now: string = today()): string {
  const cur = existing(scan);
  const prev = cur ? /^updated: (\S+)$/m.exec(cur)?.[1] : undefined;
  if (cur && prev && renderBudgetsTable(scan.config, prev) === cur) return cur;
  return renderBudgetsTable(scan.config, now);
}

export function writeBudgetsTable(scan: Scan): boolean {
  return writeIfChanged(scan.root, TABLE_PATH, generateBudgetsTable(scan));
}
