import { describe, expect, it } from 'vitest';
import { functionLengths } from '../budgets/code/code.ts';
import { lint } from '../core/lint.ts';
import { scanRepo } from '../core/scan.ts';
import { generateBoard } from '../gen/board.ts';
import { generateIndexes } from '../gen/index.ts';
import { doc, makeRepo } from './testutil.ts';

function findings(files: Record<string, string>, rule: string): string[] {
  const root = makeRepo(files);
  const scan = scanRepo(root);
  return lint(scan, { now: '2026-10-01', head: () => null })
    .filter((f) => f.rule === rule)
    .map((f) => `${f.severity}:${f.file}`);
}

describe('budgets', () => {
  it('flags md files over md_lines', () => {
    const big = doc({}, 'line\n'.repeat(310));
    expect(findings({ 'docs/big.md': big }, 'md_lines')).toEqual(['error:docs/big.md']);
  });

  it('honours a valid budget_override', () => {
    const ov = '{md_lines: {value: 400, reason: "long reference table, T031", until: 2026-10-20}}';
    const big = doc({ budget_override: ov }, 'line\n'.repeat(310));
    const files = { 'docs/big.md': big };
    expect(findings(files, 'md_lines')).toEqual([]);
    expect(findings(files, 'budget_override')).toEqual(['info:docs/big.md']);
  });

  it('rejects overrides that are too short, too far, too big, expired or fixed', () => {
    const cases = [
      '{md_lines: {value: 400, reason: "short", until: 2026-10-20}}',
      '{md_lines: {value: 400, reason: "long enough reason here", until: 2026-12-20}}',
      '{md_lines: {value: 900, reason: "long enough reason here", until: 2026-10-20}}',
      '{md_lines: {value: 400, reason: "long enough reason here"}}',
      '{broken_links: {value: 5, reason: "long enough reason here", until: 2026-10-20}}',
    ];
    for (const ov of cases) {
      const f = findings({ 'docs/a.md': doc({ budget_override: ov }) }, 'budget_override');
      expect(f).toEqual(['error:docs/a.md']);
    }
    const expired =
      '{md_lines: {value: 400, reason: "long enough reason here", until: 2026-09-20}}';
    expect(findings({ 'docs/a.md': doc({ budget_override: expired }) }, 'budget_override')).toEqual(
      ['warn:docs/a.md'],
    );
  });

  it('warns between warn_at and the hard limit', () => {
    const mid = doc({}, 'line\n'.repeat(230));
    expect(findings({ 'docs/mid.md': mid }, 'md_lines')).toEqual(['warn:docs/mid.md']);
  });

  it('checks keyword counts and stale docs', () => {
    const d = doc({ keywords: '[a]', updated: '2026-01-01' });
    expect(findings({ 'docs/a.md': d }, 'fm_keywords_min')).toEqual(['error:docs/a.md']);
    expect(findings({ 'docs/a.md': d }, 'doc_stale_days')).toEqual(['warn:docs/a.md']);
  });

  it('measures function lengths heuristically', () => {
    const src =
      'export function a() {\n  return 1;\n}\nconst b = (x: number) => {\n  if (x) {\n    return 2;\n  }\n  return 3;\n};\n';
    expect(functionLengths(src).map((f) => [f.name, f.lines])).toEqual([
      ['a', 3],
      ['b', 6],
    ]);
  });

  it('keeps generated files fresh in lint', () => {
    const files = { 'docs/a.md': doc() };
    const root = makeRepo(files);
    const scan = scanRepo(root);
    expect(
      lint(scan, { now: '2026-10-01', head: () => null }).filter((f) => f.rule === 'index').length,
    ).toBeGreaterThan(0);
    expect(generateBoard(scan)).toContain('## In Progress (0/3)');
    expect(generateIndexes(scan).has('docs/INDEX.md')).toBe(true);
  });
});
