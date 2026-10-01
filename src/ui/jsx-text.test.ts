// Localisation rule 1 (docs/game/ux/localisation.md): no JSX text node with letters outside
// t(). Symbols and numbers are allowed. The dev combat sandbox (T098, `?sandbox`) is not a
// player screen and is exempt until T059 replaces it.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parseAst } from 'vite';
import { describe, expect, it } from 'vitest';

const UI = import.meta.dirname;
const EXEMPT = /^sandbox\//;
const LETTER = /\p{L}/u;

/** Letters-bearing JSX text nodes in `source`, as trimmed strings. */
function jsxTextWithLetters(source: string): string[] {
  const found: string[] = [];
  const visit = (node: unknown): void => {
    if (!node || typeof node !== 'object') return;
    const n = node as { type?: string; value?: unknown };
    if (n.type === 'JSXText' && typeof n.value === 'string' && LETTER.test(n.value)) {
      found.push(n.value.trim());
    }
    for (const child of Object.values(node)) visit(child);
  };
  visit(parseAst(source, { lang: 'tsx' }));
  return found;
}

function tsxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name);
    if (e.isDirectory()) return tsxFiles(path);
    return e.name.endsWith('.tsx') ? [path] : [];
  });
}

describe('JSX text lint (localisation rule 1)', () => {
  it('flags letters in JSX text, allows t(), symbols and numbers', () => {
    expect(jsxTextWithLetters('const a = <p>Reroll {cost}</p>;')).toEqual(['Reroll']);
    expect(jsxTextWithLetters('const a = <b>Überlauf</b>;')).toEqual(['Überlauf']);
    expect(jsxTextWithLetters("const a = <p>{t('ui.x')} ♥ 64/80 · $ 23</p>;")).toEqual([]);
    expect(jsxTextWithLetters('const a = <p title="Words">{n}x</p>;')).toEqual(['x']);
  });

  it('src/ui has no JSX text with letters outside t()', () => {
    const offenders: string[] = [];
    for (const file of tsxFiles(UI)) {
      const rel = relative(UI, file).replaceAll('\\', '/');
      if (EXEMPT.test(rel)) continue;
      for (const text of jsxTextWithLetters(readFileSync(file, 'utf8'))) {
        offenders.push(`${rel}: ${text}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
