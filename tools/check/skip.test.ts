import { describe, expect, it } from 'vitest';
import { e2eSkipReason, parsePorcelain } from './skip.ts';

describe('check build/e2e skip', () => {
  it('skips build and e2e without src or e2e changes', () => {
    expect(e2eSkipReason(['docs/a.md', 'tools/check/run.ts'])).toMatch(/no changes/);
  });
  it('runs on a clean tree', () => {
    expect(e2eSkipReason([])).toBeUndefined();
  });
  it('runs when src or tests/e2e changed', () => {
    expect(e2eSkipReason(['src/a.ts'])).toBeUndefined();
    expect(e2eSkipReason(['docs/a.md', 'tests/e2e/x.spec.ts'])).toBeUndefined();
  });
  it('parses porcelain output', () => {
    const out = ' M src/a.ts\nA  b.md\n?? tests/e2e/n.spec.ts\nR  old.ts -> src/new.ts\n';
    expect(parsePorcelain(out)).toEqual(['src/a.ts', 'b.md', 'tests/e2e/n.spec.ts', 'src/new.ts']);
  });
});
