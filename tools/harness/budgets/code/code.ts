import { countLines } from '../../core/scan.ts';
import type { Check } from '../util.ts';
import { at, check } from '../util.ts';
import { commentChecks } from './comments.ts';
import { codeLines, isTest } from './lines.ts';

const stripStrings = (s: string): string =>
  s.replace(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g, '""');
const FN_START =
  /^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\b|^\s*(?:export\s+)?const\s+\w+\s*=\s*(?:async\s*)?(?:\([^)]*\)|\w+)\s*(?::[^=]+)?=>\s*\{\s*$/;

/** Net brace depth change of one line, and whether it contained an opening brace. */
function braceDelta(line: string): { delta: number; opened: boolean } {
  let delta = 0;
  let opened = false;
  for (const ch of stripStrings(line.replace(/\/\/.*$/, ''))) {
    if (ch === '{') {
      delta++;
      opened = true;
    } else if (ch === '}') delta--;
  }
  return { delta, opened };
}

/** Index of the line where the function starting at `start` closes, or -1. */
function findFnEnd(lines: string[], start: number): number {
  let depth = 0;
  let opened = false;
  for (let j = start; j < lines.length; j++) {
    const d = braceDelta(lines[j] ?? '');
    depth += d.delta;
    opened ||= d.opened;
    if (opened && depth <= 0) return j;
  }
  return -1;
}

/** Heuristic function lengths: brace-balance from a function-looking line. */
export function functionLengths(text: string): { name: string; start: number; lines: number }[] {
  const lines = text.split('\n');
  const out: { name: string; start: number; lines: number }[] = [];
  for (const [i, line] of lines.entries()) {
    if (!FN_START.test(line)) continue;
    const end = findFnEnd(lines, i);
    if (end < 0) continue;
    const name = /(?:function\s+|const\s+)(\w+)/.exec(line)?.[1] ?? '(anonymous)';
    out.push({ name, start: i + 1, lines: end - i + 1 });
  }
  return out;
}

const fileLines: Check = {
  id: 'ts_file_lines',
  run: (ctx) =>
    ctx.scan.code.flatMap((f) =>
      isTest(f.rel)
        ? check(ctx, 'test_file_lines', at(f.rel), countLines(f.text))
        : check(ctx, 'ts_file_lines', at(f.rel), codeLines(f.text)),
    ),
};

const fnLines: Check = {
  id: 'fn_lines',
  run: (ctx) =>
    ctx.scan.code
      .filter((f) => !isTest(f.rel))
      .flatMap((f) =>
        functionLengths(f.text).flatMap((fn) =>
          check(ctx, 'fn_lines', at(f.rel, `${fn.name} (line ${fn.start})`), fn.lines),
        ),
      ),
};

export const codeChecks: Check[] = [fileLines, fnLines, ...commentChecks];
