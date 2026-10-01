// The Crimson CSS tokens match docs/game/ux/art-direction.md and pass WCAG AA for text.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '..', '..', '..');
const css = readFileSync(join(root, 'src/ui/theme/crimson.css'), 'utf8');
const doc = readFileSync(join(root, 'docs/game/ux/art-direction.md'), 'utf8');

function cssTokens(): Map<string, string> {
  const block = /:root\[data-theme="crimson"\]\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
  const out = new Map<string, string>();
  for (const m of block.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})/g))
    out.set(m[1] as string, (m[2] as string).toUpperCase());
  return out;
}

function docTokens(): Map<string, string> {
  const section = doc.split('## Colour tokens')[1]?.split('\n## ')[0] ?? '';
  const out = new Map<string, string>();
  for (const m of section.matchAll(/^\| `(--[\w-]+)` \| `(#[0-9A-Fa-f]{6})` \|/gm))
    out.set(m[1] as string, (m[2] as string).toUpperCase());
  return out;
}

function luminance(hex: string): number {
  const channel = (i: number): number => {
    const c = Number.parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Tokens the sandbox uses as text colour. */
const TEXT = ['--fg', '--fg-muted', '--brand-text', '--good', '--warn', '--danger', '--enemy'];
const SURFACES = ['--bg', '--bg-panel', '--bg-raised'];
const onSurfaces = (fg: string): string[][] => SURFACES.map((bg) => [fg, bg]);

describe('Crimson theme tokens', () => {
  it('match the art-direction table exactly', () => {
    const expected = docTokens();
    expect(expected.size).toBe(17);
    expect(Object.fromEntries(cssTokens())).toEqual(Object.fromEntries(expected));
  });

  it('text tokens reach WCAG AA (4.5) on every surface', () => {
    const t = cssTokens();
    const ratio = (fg: string, bg: string): number => contrast(t.get(fg) ?? '', t.get(bg) ?? '');
    const pairs = [...TEXT, '--cold', '--credits'].flatMap(onSurfaces);
    pairs.push(['--on-brand', '--brand'], ['--on-brand', '--brand-deep']);
    for (const [fg = '', bg = ''] of pairs) {
      expect(ratio(fg, bg), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});
