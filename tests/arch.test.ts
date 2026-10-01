// Architecture gate: module dependency table, ADR-006 import style and banned globals.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ALLOWED, checkGlobals, checkImports } from './architecture/checker.ts';

const root = join(import.meta.dirname, '..');

function walk(dir: string): string[] {
  if (!existsSync(join(root, dir))) return [];
  return readdirSync(join(root, dir), { withFileTypes: true }).flatMap((e) => {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) return walk(rel);
    return /\.tsx?$/.test(e.name) ? [rel] : [];
  });
}

const files = [...walk('src'), ...walk('tools/balance')];
const read = (f: string): string => readFileSync(join(root, f), 'utf8');

describe('architecture', () => {
  it('current tree has no import violations', () => {
    expect(files.flatMap((f) => checkImports(f, read(f)))).toEqual([]);
  });

  it('current tree has no banned globals in sim and run', () => {
    expect(files.flatMap((f) => checkGlobals(f, read(f)))).toEqual([]);
  });

  it('rejects forbidden import direction', () => {
    const v = checkImports('src/sim/x.ts', "import { App } from '../ui/app.tsx';\n");
    expect(v).toHaveLength(1);
    expect(v[0]).toContain('sim');
    expect(v[0]).toContain('ui');
  });

  it('rejects more forbidden directions, dynamic imports and sim -> content data', () => {
    const bad = (path: string, src: string): number => checkImports(path, src).length;
    expect(bad('src/content/a.ts', "export * from '../sim/rng.ts';")).toBe(1);
    expect(bad('src/run/a.ts', "const m = await import('../ui/app.tsx');")).toBe(1);
    expect(bad('tools/balance/a.ts', "import '../../src/audio/sfx.ts';")).toBe(1);
    expect(bad('src/render-fx/a.ts', "import x from '../audio/sfx.ts';")).toBe(1);
    expect(bad('src/sim/a.ts', "import x from '../content/tools/t.ts';")).toBe(1);
    expect(bad('src/sim/a.ts', "import type { T } from '../content/types/ids.ts';")).toBe(0);
    expect(bad('src/ui/a.ts', "import { h } from 'preact';")).toBe(0);
  });

  it('rejects extensionless, aliased and package imports (ADR-006)', () => {
    expect(checkImports('src/run/a.ts', "import x from './state';")).toHaveLength(1);
    expect(checkImports('src/run/a.ts', "import x from '@/sim/rng.ts';")).toHaveLength(1);
    expect(checkImports('src/sim/a.ts', "import x from 'node:fs';")).toHaveLength(1);
  });

  it.each([
    'Math.random()',
    'Date.now()',
    'new Date()',
    'performance.now()',
    'setTimeout(f, 1)',
    'setInterval(f, 1)',
    'window.innerWidth',
    'document.body',
    'crypto.randomUUID()',
  ])('bans nondeterministic globals in sim and run: %s', (code) => {
    for (const path of ['src/sim/a.ts', 'src/run/a.ts'])
      expect(checkGlobals(path, `export const x = ${code};\n`)).toHaveLength(1);
    expect(checkGlobals('src/ui/a.ts', `export const x = ${code};\n`)).toEqual([]);
  });

  it('ignores banned words in comments', () => {
    const src = '// no Date here\n/* Math.random */\nexport const x = 1;\n';
    expect(checkGlobals('src/sim/a.ts', src)).toEqual([]);
  });

  it('allowed-direction table has one row per overview module', () => {
    expect(Object.keys(ALLOWED).sort()).toEqual(
      [
        'audio',
        'content',
        'debug',
        'tools/balance',
        'render-fx',
        'run',
        'save',
        'sim',
        'ui',
      ].sort(),
    );
    expect(ALLOWED.sim).toEqual(['content']);
    expect(ALLOWED.ui).not.toContain('debug');
    for (const row of Object.values(ALLOWED)) expect(row).not.toContain('ui');
    expect(ALLOWED['tools/balance']).not.toContain('audio');
    expect(ALLOWED['tools/balance']).not.toContain('render-fx');
  });
});
