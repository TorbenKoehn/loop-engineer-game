import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { canonicalJson, sha256Hex } from '../checksum.ts';
import { dropActions, type MigrationTable, migrate } from './index.ts';

const DIR = 'tests/fixtures/saves';
const fixtures = (prefix: string) =>
  readdirSync(DIR)
    .filter((f) => f.startsWith(prefix) && f.endsWith('.txt'))
    .map((f) => [f, readFileSync(`${DIR}/${f}`, 'utf8')] as const);

const seal = (body: Record<string, unknown>) => ({
  ...body,
  checksum: sha256Hex(canonicalJson(body)),
});

describe('migrate', () => {
  const [, runText] = fixtures('run-v1-')[0] as readonly [string, string];

  it('passes a schema-1 save through unchanged', () => {
    const r = migrate(runText, 'run');
    expect(r.ok && r.save).toEqual(JSON.parse(runText));
    expect(r.ok && r.replayable).toBe(true);
    expect(migrate(JSON.parse(runText), 'run').ok).toBe(true);
  });

  it('rejects bad JSON, a newer schema and a wrong checksum', () => {
    expect(migrate('{nope', 'run')).toEqual({ ok: false, error: 'parse' });
    const newer = seal({ ...JSON.parse(runText), schema: 2 });
    expect(migrate(newer, 'run')).toEqual({ ok: false, error: 'schema' });
    const bad = { ...JSON.parse(runText), seed: 'tampered' };
    expect(migrate(bad, 'run')).toEqual({ ok: false, error: 'checksum' });
  });

  it('applies steps in order and re-seals', () => {
    const order: number[] = [];
    const table: MigrationTable = {
      1: (s) => {
        order.push(1);
        return { ...s, schema: 2, trail: ['a'] };
      },
      2: (s) => {
        order.push(2);
        return { ...s, schema: 3, trail: [...(s.trail as string[]), 'b'] };
      },
    };
    const r = migrate(runText, 'run', { table, latest: 3 });
    expect(order).toEqual([1, 2]);
    expect(r.ok && (r.save as unknown as { trail: string[] }).trail).toEqual(['a', 'b']);
    expect(r.ok && r.save.schema).toBe(3 as never);
  });

  it('fails when a step is missing or returns the wrong schema', () => {
    expect(migrate(runText, 'run', { table: {}, latest: 2 })).toEqual({
      ok: false,
      error: 'schema',
    });
    const wrong: MigrationTable = { 1: (s) => ({ ...s, schema: 5 }) };
    expect(migrate(runText, 'run', { table: wrong, latest: 2 }).ok).toBe(false);
  });

  it('marks an unmigratable action log replayable:false and keeps the snapshot', () => {
    const original = JSON.parse(runText);
    const table: MigrationTable = { 1: (s) => dropActions({ ...s, schema: 2 }) };
    const r = migrate(runText, 'run', { table, latest: 2 });
    expect(r.ok && r.replayable).toBe(false);
    expect(r.ok && r.save.actions).toEqual([]);
    expect(r.ok && r.save.snapshot).toEqual(original.snapshot);
  });
});

describe('frozen fixtures', () => {
  it('has at least one run and one meta fixture', () => {
    expect(fixtures('run-v1-').length).toBeGreaterThan(0);
    expect(fixtures('meta-v1-').length).toBeGreaterThan(0);
  });

  it.each(fixtures('run-v1-'))('%s loads as a run save', (_name, text) => {
    const r = migrate(text, 'run');
    expect(r.ok && r.replayable).toBe(true);
    expect(r.ok && r.save.schema).toBe(1);
  });

  it.each(fixtures('meta-v1-'))('%s loads as a meta save', (_name, text) => {
    const r = migrate(text, 'meta');
    expect(r.ok && r.save.schema).toBe(1);
  });
});
