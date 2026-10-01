import { countLines } from '../../core/scan.ts';
import { check } from '../util.ts';
import type { Check } from '../util.ts';
import { commentChecks } from './comments.ts';
import { codeLines, isTest } from './lines.ts';

const stripStrings = (s: string): string => s.replace(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g, '""');
const FN_START = /^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\b|^\s*(?:export\s+)?const\s+\w+\s*=\s*(?:async\s*)?(?:\([^)]*\)|\w+)\s*(?::[^=]+)?=>\s*\{\s*$/;

/** Heuristic function lengths: brace-balance from a function-looking line. */
export function functionLengths(text: string): { name: string; start: number; lines: number }[] {
  const lines = text.split('\n');
  const out: { name: string; start: number; lines: number }[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (!FN_START.test(lines[i]!)) continue;
    let depth = 0;
    let opened = false;
    for (let j = i; j < lines.length; j++) {
      for (const ch of stripStrings(lines[j]!.replace(/\/\/.*$/, ''))) {
        if (ch === '{') {
          depth++;
          opened = true;
        } else if (ch === '}') depth--;
      }
      if (opened && depth <= 0) {
        const name = /(?:function\s+|const\s+)(\w+)/.exec(lines[i]!)?.[1] ?? '(anonymous)';
        out.push({ name, start: i + 1, lines: j - i + 1 });
        break;
      }
    }
  }
  return out;
}

const fileLines: Check = {
  id: 'ts_file_lines',
  run: (ctx) =>
    ctx.scan.code.flatMap((f) =>
      isTest(f.rel) ? check(ctx, 'test_file_lines', f.rel, countLines(f.text)) : check(ctx, 'ts_file_lines', f.rel, codeLines(f.text)),
    ),
};

const fnLines: Check = {
  id: 'fn_lines',
  run: (ctx) =>
    ctx.scan.code
      .filter((f) => !isTest(f.rel))
      .flatMap((f) =>
        functionLengths(f.text).flatMap((fn) =>
          check(ctx, 'fn_lines', f.rel, fn.lines, undefined, `${fn.name} (line ${fn.start})`),
        ),
      ),
};

export const codeChecks: Check[] = [fileLines, fnLines, ...commentChecks];
