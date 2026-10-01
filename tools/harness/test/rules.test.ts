import { describe, expect, it } from 'vitest';
import { matchRelatedCode } from '../budgets/docs/drift.ts';
import { transitionAllowed } from '../budgets/forge/integrity.ts';
import { lint } from '../core/lint.ts';
import { scanRepo } from '../core/scan.ts';
import { generateBudgetsTable } from '../gen/table.ts';
import { doc, makeRepo } from './testutil.ts';

const NOW = '2026-10-01';

function run(
  files: Record<string, string>,
  rule: string,
  head: (rel: string) => string | null = () => null,
): string[] {
  const found = lint(scanRepo(makeRepo(files)), { now: NOW, head });
  return found.filter((f) => f.rule === rule).map((f) => `${f.severity}:${f.file}`);
}

const task = (status: string, criteria = 2, extra: Record<string, string> = {}): string => {
  const items = Array.from({ length: criteria }, (_, i) => `- [ ] c${i}`).join('\n');
  const fields = {
    type: 'task',
    id: 'T001',
    epic: 'E001',
    priority: 'p1',
    model: 'sonnet',
    size: 'S',
    status,
    ...extra,
  };
  return doc(fields, `# T\n\n## Acceptance Criteria\n${items}\n`);
};

const TASK = 'forge/epics/E001-x/T001-a.md';
const review = (verdict: string): string =>
  doc({ type: 'review', id: 'R001', task: 'T001', verdict });

describe('forge integrity', () => {
  it('requires an approved review for done tasks', () => {
    expect(run({ [TASK]: task('done') }, 'done_needs_review')).toEqual([`error:${TASK}`]);
    const changes = {
      [TASK]: task('done'),
      'forge/reviews/R001-T001.md': review('changes-requested'),
    };
    expect(run(changes, 'done_needs_review')).toEqual([`error:${TASK}`]);
    const ok = { [TASK]: task('done'), 'forge/reviews/R001-T001.md': review('approved') };
    expect(run(ok, 'done_needs_review')).toEqual([]);
  });

  it('knows the legal status transitions', () => {
    expect(transitionAllowed('backlog', 'ready')).toBe(true);
    expect(transitionAllowed('review', 'in-progress')).toBe(true);
    expect(transitionAllowed('in-progress', 'blocked')).toBe(true);
    expect(transitionAllowed('blocked', 'ready')).toBe(true);
    expect(transitionAllowed('ready', 'review')).toBe(true);
    expect(transitionAllowed('ready', 'done')).toBe(true);
    expect(transitionAllowed('ready', 'cancelled')).toBe(true);
    expect(transitionAllowed('done', 'cancelled')).toBe(false);
    expect(transitionAllowed('cancelled', 'ready')).toBe(false);
    expect(transitionAllowed('review', 'ready')).toBe(false);
    expect(transitionAllowed('in-progress', 'ready')).toBe(false);
    expect(transitionAllowed('done', 'in-progress')).toBe(false);
    expect(transitionAllowed('done', 'blocked')).toBe(false);
  });

  it('compares status and acceptance criteria with HEAD', () => {
    const files = { [TASK]: task('done'), 'forge/reviews/R001-T001.md': review('approved') };
    expect(run({ [TASK]: task('review') }, 'status_transition', () => task('done'))).toEqual([
      `error:${TASK}`,
    ]);
    expect(run(files, 'status_transition', () => task('review'))).toEqual([]);
    expect(run(files, 'status_transition', () => null)).toEqual([]);
    expect(run({ [TASK]: task('review', 1) }, 'ac_decrease', () => task('in-progress', 3))).toEqual(
      [`error:${TASK}`],
    );
    expect(run({ [TASK]: task('ready', 1) }, 'ac_decrease', () => task('backlog', 3))).toEqual([]);
  });

  it('enforces acceptance criteria minimum past backlog and age limits', () => {
    expect(run({ [TASK]: task('ready', 0) }, 'acceptance_criteria_min')).toEqual([`error:${TASK}`]);
    expect(run({ [TASK]: task('backlog', 0) }, 'acceptance_criteria_min')).toEqual([]);
    const old = task('in-progress', 2, { updated: '2026-09-01' });
    expect(run({ [TASK]: old }, 'in_progress_age_days')).toEqual([`warn:${TASK}`]);
  });
});

describe('doc rules', () => {
  it('flags broken relative links in the body and related', () => {
    const body = '[ok](b.md) [bad](nope.md) [web](https://x.y) [anchor](#a) `[code](nothing.md)`\n';
    const files = { 'docs/a.md': doc({ related: '[b.md, gone.md]' }, body), 'docs/b.md': doc() };
    expect(run(files, 'broken_links')).toEqual(['error:docs/a.md', 'error:docs/a.md']);
  });

  it('checks heading depth, long code blocks and toc', () => {
    const fence = `\`\`\`ts\n${'x\n'.repeat(45)}\`\`\`\n`;
    const body = `#### deep\n${fence}${'line\n'.repeat(110)}`;
    expect(run({ 'docs/a.md': doc({}, body) }, 'md_heading_depth')).toEqual(['warn:docs/a.md']);
    expect(run({ 'docs/a.md': doc({}, body) }, 'md_code_block_lines')).toEqual(['warn:docs/a.md']);
    expect(run({ 'docs/a.md': doc({}, body) }, 'md_toc_over_lines')).toEqual(['warn:docs/a.md']);
  });

  it('warns on npm run mentions without a script and on unmatched related_code', () => {
    const files = {
      'package.json': '{"scripts":{"test":"x"}}',
      'docs/a.md': doc(
        { related_code: '[src/nothing/**]' },
        'Run `npm run test` or `npm run nope`.\n',
      ),
    };
    expect(run(files, 'npm_script')).toEqual(['warn:docs/a.md']);
    expect(run(files, 'doc_drift')).toEqual(['warn:docs/a.md']);
  });

  it('matches related_code entries as globs, files or directories', () => {
    const files = ['src/a/x.ts', 'src/a/y.ts', 'src/b.ts'];
    expect(matchRelatedCode(files, 'src/a')).toEqual(['src/a/x.ts', 'src/a/y.ts']);
    expect(matchRelatedCode(files, 'src/**/*.ts')).toEqual(files);
    expect(matchRelatedCode(files, 'src/b.ts')).toEqual(['src/b.ts']);
  });
});

describe('code rules and budgets table', () => {
  it('flags untracked TODOs and tracks tracked ones', () => {
    const src = '// TODO fix this\n// FIXME(T012) later\nexport const a = 1;\n';
    expect(run({ 'src/a.ts': src }, 'todo_untracked')).toEqual(['error:src/a.ts']);
  });

  it('keeps generated table byte-stable and complete', () => {
    const scan = scanRepo(makeRepo({}));
    const table = generateBudgetsTable(scan, NOW);
    expect(table).toContain('| `dir_depth` | 4 levels |');
    expect(table).toContain('| `fm_keywords_min` | >= 3 items |');
    expect(Object.keys(scan.config.budgets).every((id) => table.includes(`\`${id}\``))).toBe(true);
  });
});
