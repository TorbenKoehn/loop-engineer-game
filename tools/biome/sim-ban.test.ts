import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '../..');

/** Lints `code` as a temporary file at `rel`, then removes it. Returns Biome's exit status. */
function lint(rel: string, code: string): number | null {
  const abs = path.join(root, rel);
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, code);
  try {
    return spawnSync('npx', ['biome', 'lint', rel], { cwd: root, shell: true }).status;
  } finally {
    rmSync(abs, { force: true });
  }
}

describe('src/sim determinism ban', () => {
  it.each([
    ['Math.random()', 'export const x = Math.random();\n'],
    ['Date.now()', 'export const x = Date.now();\n'],
    ['new Date()', 'export const x = new Date();\n'],
    ['performance.now()', 'export const x = performance.now();\n'],
    ['setTimeout', 'export const x = setTimeout;\n'],
  ])('fails lint in src/sim: %s', (name, code) => {
    expect(lint(`src/sim/zz-ban-${name.length}.ts`, code)).not.toBe(0);
  });

  it('allows the same code outside src/sim and deterministic code inside', () => {
    expect(lint('src/ui/zz-ban.ts', 'export const x = Math.random();\n')).toBe(0);
    expect(lint('src/sim/zz-ok.ts', 'export const x = Math.floor(2.5);\n')).toBe(0);
  });
});
