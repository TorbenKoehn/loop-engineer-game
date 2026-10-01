// Golden-file helpers for tests only (Node: node:fs, node:crypto). Never import from sim
// runtime code. Workflow and update command: see the header of golden.test.ts.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

/** Set to `1` only by `npm run golden:update`. */
export const UPDATE_ENV = 'GOLDEN_UPDATE';
const UPDATE_HINT = 'If the change is intended, run `npm run golden:update` and say why.';
const MAX_DIFF_LINES = 10;

/** SHA-256 hex of UTF-8 text (event-log.md log hash). */
export function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

export function isUpdateMode(env: NodeJS.ProcessEnv = process.env): boolean {
  return env[UPDATE_ENV] === '1';
}

/** Positional line diff (an inserted event shifts every later `seq` anyway), capped. */
export function lineDiff(expected: string, actual: string): string | undefined {
  if (expected === actual) return undefined;
  const a = expected.split('\n');
  const b = actual.split('\n');
  const out: string[] = [];
  let differing = 0;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] === b[i]) continue;
    differing++;
    if (differing > MAX_DIFF_LINES) continue;
    out.push(`@@ line ${i + 1}`, `- ${a[i] ?? '(missing)'}`, `+ ${b[i] ?? '(missing)'}`);
  }
  if (differing > MAX_DIFF_LINES) out.push(`... and ${differing - MAX_DIFF_LINES} more lines`);
  return out.join('\n');
}

/** Throws a line diff on mismatch, or a hint when missing; update mode writes instead. */
export function checkGolden(path: string, actual: string, update = isUpdateMode()): void {
  if (update) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, actual, 'utf8');
    return;
  }
  if (!existsSync(path)) throw new Error(`Golden file missing: ${path}\n${UPDATE_HINT}`);
  const expected = readFileSync(path, 'utf8').replaceAll('\r\n', '\n');
  const diff = lineDiff(expected, actual);
  if (diff) throw new Error(`Golden mismatch: ${path}\n${diff}\n${UPDATE_HINT}`);
}
