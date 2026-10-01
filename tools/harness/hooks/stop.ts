import { hookRoot } from '../core/config.ts';
import { lint } from '../core/lint.ts';
import { scanRepo } from '../core/scan.ts';
import { writeBoard } from '../gen/board.ts';
import { writeIndexes } from '../gen/index.ts';
import { writeBudgetsTable } from '../gen/table.ts';
import { parsePayload, readStdin } from './io.ts';

const MAX_SHOWN = 15;

const payload = parsePayload<{ stop_hook_active: boolean; cwd: string }>(await readStdin());
const active = payload.stop_hook_active === true;
let code = 0;
try {
  const root = hookRoot(payload.cwd);
  writeBudgetsTable(scanRepo(root));
  writeBoard(scanRepo(root));
  writeIndexes(scanRepo(root));
  const errors = lint(scanRepo(root)).filter((f) => f.severity === 'error');
  if (errors.length > 0 && !active) {
    const shown = errors.slice(0, MAX_SHOWN).map((f) => `- ${f.file} [${f.rule}] ${f.message}`);
    const more = errors.length > MAX_SHOWN ? [`... and ${errors.length - MAX_SHOWN} more`] : [];
    console.error(
      ['harness lint failed; fix these before finishing:', ...shown, ...more].join('\n'),
    );
    code = 2;
  }
} catch (e) {
  console.error(`harness stop: lint crashed: ${(e as Error).message}`);
  if (!active) code = 2;
}
process.exit(code);
