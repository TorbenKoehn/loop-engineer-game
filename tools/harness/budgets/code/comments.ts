import type { Check } from '../util.ts';
import { at, check } from '../util.ts';
import { codeLines, commentLines, isComment, isTest } from './lines.ts';

const MARKER = /\b(?:TODO|FIXME|HACK|XXX)\b/;
const TRACKED = /\b[TB]\d{3}\b/;
const COMMENT_PART = /\/\/.*|\/\*.*|^\s*\*.*/;

const lineChars: Check = {
  id: 'comment_line_chars',
  run: (ctx) =>
    ctx.scan.code.flatMap((f) =>
      f.text
        .split('\n')
        .flatMap((l, i) =>
          isComment(l)
            ? check(ctx, 'comment_line_chars', at(f.rel, `line ${i + 1}`), l.length)
            : [],
        ),
    ),
};

const blockLines: Check = {
  id: 'comment_block_lines',
  run: (ctx) =>
    ctx.scan.code.flatMap((f) => {
      const found = [];
      let run = 0;
      const lines = f.text.split('\n');
      for (let i = 0; i <= lines.length; i++) {
        if (i < lines.length && isComment(lines[i]!)) run++;
        else {
          found.push(
            ...check(ctx, 'comment_block_lines', at(f.rel, `comment ending line ${i}`), run),
          );
          run = 0;
        }
      }
      return found.map((x) => ({ ...x, file: f.rel }));
    }),
};

const ratio: Check = {
  id: 'comment_ratio',
  run: (ctx) =>
    ctx.scan.code.flatMap((f) => {
      const code = codeLines(f.text);
      return code < 20
        ? []
        : check(
            ctx,
            'comment_ratio',
            at(f.rel),
            Math.round((commentLines(f.text) / code) * 100) / 100,
          );
    }),
};

function markers(text: string): { line: number; tracked: boolean }[] {
  return text.split('\n').flatMap((l, i) => {
    const c = COMMENT_PART.exec(l)?.[0];
    return c && MARKER.test(c) ? [{ line: i + 1, tracked: TRACKED.test(c) }] : [];
  });
}

const todos: Check = {
  id: 'todo',
  run: (ctx) => {
    const found = ctx.scan.code
      .filter((f) => !isTest(f.rel))
      .map((f) => ({ f, m: markers(f.text) }));
    const untracked = found.flatMap(({ f, m }) =>
      m
        .filter((x) => !x.tracked)
        .flatMap((x) =>
          check(ctx, 'todo_untracked', at(f.rel, `line ${x.line}`), 1).map((r) => ({
            ...r,
            file: f.rel,
          })),
        ),
    );
    const total = found.reduce((n, { m }) => n + m.length, 0);
    return [...untracked, ...check(ctx, 'todo_total', at('.', 'markers'), total)];
  },
};

export const commentChecks: Check[] = [lineChars, blockLines, ratio, todos];
