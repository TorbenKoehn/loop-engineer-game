import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '../..');
const biomeBin = path.join(root, 'node_modules', '@biomejs', 'biome', 'bin', 'biome');
let sandbox = '';
let counter = 0;

/** Copies the real config and plugin into an isolated temp dir; nothing is written under src/. */
beforeAll(() => {
  sandbox = mkdtempSync(path.join(tmpdir(), 'sim-ban-'));
  const config = readFileSync(path.join(root, 'biome.jsonc'), 'utf8')
    .replace(/"vcs":\s*\{[^}]*\},?/, '')
    .replace(/"\$schema":[^\n]*\n/, '');
  writeFileSync(path.join(sandbox, 'biome.jsonc'), config);
  cpSync(path.join(root, 'tools/biome'), path.join(sandbox, 'tools/biome'), { recursive: true });
});

afterAll(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

/** Lints `code` as a uniquely named file at `dir` in the sandbox. Returns Biome's exit status. */
function lint(dir: string, code: string): number | null {
  const rel = `${dir}/fixture-${counter++}.ts`;
  const abs = path.join(sandbox, rel);
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, code);
  try {
    return spawnSync(process.execPath, [biomeBin, 'lint', rel], { cwd: sandbox }).status;
  } finally {
    rmSync(abs, { force: true });
  }
}

describe.each(['src/sim', 'src/run'])('%s determinism ban', (dir) => {
  it.each([
    ['Math.random()', 'export const x = Math.random();\n'],
    ['aliased Math', 'const r = Math;\nexport const x = r.random();\n'],
    ['destructured Math', 'const { random } = Math;\nexport const x = random();\n'],
    ['globalThis.Math.random()', 'export const x = globalThis.Math.random();\n'],
    ["Math['random']()", "export const x = Math['random']();\n"],
    ['crypto.getRandomValues(a)', 'export const x = crypto.getRandomValues(new Uint8Array(1));\n'],
    ['self.setTimeout', 'export const x = self.setTimeout;\n'],
    ['Date.now()', 'export const x = Date.now();\n'],
    ['new Date()', 'export const x = new Date();\n'],
    ['performance.now()', 'export const x = performance.now();\n'],
    ['setTimeout', 'export const x = setTimeout;\n'],
    ['setImmediate', 'export const x = setImmediate;\n'],
    ['bare window', 'export const x = window;\n'],
    ['document', 'export const x = document;\n'],
    ['crypto', 'export const x = crypto;\n'],
  ])('fails lint: %s', (_name, code) => {
    expect(lint(dir, code)).not.toBe(0);
  });

  it.each([
    ['Math.floor(2.5)', 'export const x = Math.floor(2.5);\n'],
    ['Math.imul(3, 4)', 'export const x = Math.imul(3, 4);\n'],
    ['model.window', 'const model = { window: 1 };\nexport const x = model.window;\n'],
    ['{ window: 1 }', 'export const x = { window: 1 };\n'],
  ])('allows %s', (_name, code) => {
    expect(lint(dir, code)).toBe(0);
  });
});

describe('outside the determinism ban', () => {
  it('allows the same code in src/ui', () => {
    expect(lint('src/ui', 'export const x = Math.random();\n')).toBe(0);
  });
});
