import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { budget } from '../core/config.ts';
import { scanRepo } from '../core/scan.ts';
import { generateBoard } from '../gen/board.ts';
import { generateIndexes } from '../gen/index.ts';
import { doc, makeRepo } from './testutil.ts';

const root = path.resolve(import.meta.dirname, '..');

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === 'test' ? [] : sourceFiles(p);
    return e.name.endsWith('.ts') ? [p] : [];
  });
}

const PATTERNS = [
  /check\(ctx, '(\w+)'/g,
  /budget\([\w.]+, '(\w+)'/g,
  /\['(\w+)', '[\w-]+'(?:, '(?:task|epic)')?\]/g,
  /\['((?:\w+_)+\w+)', '((?:\w+_)+\w+)'\]/g,
];

const looksLikeBudgetId = (id: string): boolean =>
  /_/.test(id) && /^(?:[a-z]+_)+[a-z0-9]+$/.test(id) && !/^(?:in_progress|done)/.test(id);

function referencedIds(text: string): string[] {
  return PATTERNS.flatMap((re) => [...text.matchAll(re)].flatMap((m) => m.slice(1)));
}

describe('budget lookups', () => {
  it('every budget id referenced in source exists in the config', () => {
    const config = scanRepo(makeRepo({})).config;
    const missing: string[] = [];
    for (const file of sourceFiles(root)) {
      const ids = referencedIds(fs.readFileSync(file, 'utf8'));
      for (const id of ids.filter((x) => looksLikeBudgetId(x) && !config.budgets[x]))
        missing.push(`${path.basename(file)}: ${id}`);
    }
    expect(missing).toEqual([]);
  });

  it('throws on unknown ids and renders no undefined limits', () => {
    const scan = scanRepo(makeRepo({ 'docs/a.md': doc() }));
    expect(() => budget(scan.config, 'active_epics')).toThrow(/unknown budget/);
    expect(generateBoard(scan)).not.toContain('undefined');
    expect(generateBoard(scan)).toContain('Epic Progress (active 0/2)');
    expect(generateIndexes(scan).size).toBeGreaterThan(0);
  });

  it('gives every budget the required metadata', () => {
    const config = scanRepo(makeRepo({})).config;
    for (const [id, b] of Object.entries(config.budgets)) {
      expect(['harness', 'biome', 'vitest', 'process'], id).toContain(b.enforced_by);
      expect(['error', 'warn', 'process'], id).toContain(b.severity);
      expect(b.description.length, id).toBeGreaterThan(5);
      expect(typeof b.value, id).toBe('number');
    }
  });
});
