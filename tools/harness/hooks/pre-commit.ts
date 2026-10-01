import { parsePayload, readStdin } from './io.ts';

const MAX_SHOWN = 15;
const COMMIT = /^\s*(?:\S+=\S*\s+)*git(?:\s+-\S+(?:\s+\S+)?)*?\s+commit(?:\s|$)/;

/** True when any `&&`, `;`, `||`, `|` or newline separated segment is a `git commit`. */
export function isGitCommit(command: string): boolean {
  const head = command.split('<<')[0] ?? '';
  return head.split(/&&|\|\||;|\||\n/).some((s) => COMMIT.test(s));
}

const payload = parsePayload<{ tool_input: { command?: unknown }; cwd: string }>(await readStdin());
const command = payload.tool_input?.command;
let code = 0;
if (typeof command === 'string' && isGitCommit(command)) {
  try {
    const { hookRoot } = await import('../core/config.ts');
    const { lint } = await import('../core/lint.ts');
    const { scanRepo } = await import('../core/scan.ts');
    const errors = lint(scanRepo(hookRoot(payload.cwd))).filter((f) => f.severity === 'error');
    if (errors.length > 0) {
      const shown = errors.slice(0, MAX_SHOWN).map((f) => `- ${f.file} [${f.rule}] ${f.message}`);
      const more = errors.length > MAX_SHOWN ? [`... and ${errors.length - MAX_SHOWN} more`] : [];
      console.error(
        ['harness lint failed; fix these before committing:', ...shown, ...more].join('\n'),
      );
      code = 2;
    }
  } catch (e) {
    console.error(`harness pre-commit: lint crashed: ${(e as Error).message}`);
    code = 2;
  }
}
process.exit(code);
