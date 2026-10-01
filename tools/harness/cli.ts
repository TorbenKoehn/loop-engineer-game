import { parseArgs } from 'node:util';
import { findRoot } from './core/config.ts';
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
      runBudgets(root);
      runBoard(root);
      runIndex(root);
      return runLint(root, rest.includes('--json'));
    case 'new':
      runNew(root, rest);
      return 0;
    default:
      console.error(
        'usage: cli.ts index|board|budgets|lint [--json]|check|new <epic|task|review|retro> [--flags]',
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
