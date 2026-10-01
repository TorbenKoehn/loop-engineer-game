import { parseArgs } from 'node:util';
import { diffBreaches, measureDiff, parseNumstat } from './budgets/forge/diff.ts';
import { budget, findRoot, loadConfig } from './core/config.ts';
import { stagedNumstat } from './core/git.ts';
import { formatFindings, hasErrors, lint } from './core/lint.ts';
import { scanRepo } from './core/scan.ts';
import { writeBoard } from './gen/board.ts';
import { writeIndexes } from './gen/index.ts';
import { scaffold } from './gen/scaffold.ts';
import { writeBudgetsTable } from './gen/table.ts';

export function runIndex(root: string): void {
  const changed = writeIndexes(scanRepo(root));
  console.log(`harness:index ${changed.length} file(s) updated`);
}

export function runBoard(root: string): void {
  console.log(`harness:board ${writeBoard(scanRepo(root)) ? 'updated' : 'unchanged'}`);
}

export function runBudgets(root: string): void {
  console.log(`harness:budgets ${writeBudgetsTable(scanRepo(root)) ? 'updated' : 'unchanged'}`);
}

function runLint(root: string, json: boolean): number {
  const startedAt = Date.now();
  const findings = lint(scanRepo(root), { startedAt });
  if (json) {
    const count = (s: string): number => findings.filter((f) => f.severity === s).length;
    const summary = { errors: count('error'), warnings: count('warn'), info: count('info') };
    console.log(JSON.stringify({ summary, findings }, null, 2));
  } else console.log(formatFindings(findings));
  return hasErrors(findings) ? 1 : 0;
}

function runCheck(root: string, json: boolean): number {
  runBudgets(root);
  runBoard(root);
  runIndex(root);
  return runLint(root, json);
}

/** Staged diff size against `task_diff_lines` and the 2x total rule; exit 1 on a breach. */
export function runDiff(root: string): number {
  const numstat = stagedNumstat(root);
  if (numstat === null) throw new Error('git diff --cached failed (not a git repo?)');
  const size = measureDiff(parseNumstat(numstat));
  const breaches = diffBreaches(size, budget(loadConfig(root), 'task_diff_lines').value);
  console.log(`production=${size.production} total=${size.total}`);
  for (const b of breaches) console.error(`harness:diff ${b}`);
  return breaches.length ? 1 : 0;
}

function runNew(root: string, argv: string[]): void {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      title: { type: 'string' },
      priority: { type: 'string' },
      epic: { type: 'string' },
      model: { type: 'string' },
      size: { type: 'string' },
      task: { type: 'string' },
      verdict: { type: 'string' },
      milestone: { type: 'string' },
    },
  });
  const rel = scaffold(root, positionals[0] ?? '', values);
  runBoard(root);
  runIndex(root);
  console.log(`created ${rel}`);
}

export function main(argv: string[]): number {
  const [cmd, ...rest] = argv;
  const root = findRoot();
  switch (cmd) {
    case 'index':
      runIndex(root);
      return 0;
    case 'board':
      runBoard(root);
      return 0;
    case 'budgets':
      runBudgets(root);
      return 0;
    case 'lint':
      return runLint(root, rest.includes('--json'));
    case 'check':
      return runCheck(root, rest.includes('--json'));
    case 'new':
      runNew(root, rest);
      return 0;
    case 'diff':
      return runDiff(root);
    default:
      console.error(
        'usage: cli.ts index|board|budgets|lint [--json]|check|diff|new <epic|task|review|retro> [--flags]',
      );
      return 2;
  }
}

if (process.argv[1] && import.meta.filename === process.argv[1]) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (e) {
    console.error(`harness: ${(e as Error).message}`);
    process.exitCode = 1;
  }
}
