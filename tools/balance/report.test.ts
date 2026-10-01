import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { recordRun } from './batch.ts';
import { parseCli, runCli } from './cli.ts';
import { quantile, wilson } from './report.ts';
import { BOTS } from './run.ts';

const dir = mkdtempSync(join(tmpdir(), 'balance-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('statistics', () => {
  it('wilson gives the 95% score interval', () => {
    expect(wilson(50, 100)).toEqual({ n: 100, k: 50, rate: 0.5, ci95: [0.4038, 0.5962] });
    expect(wilson(0, 0).ci95).toEqual([0, 0]);
  });

  it('quantile uses the nearest rank', () => {
    expect(quantile([5, 1, 4, 2, 3], 0.5)).toBe(3);
    expect(quantile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.9)).toBe(9);
    expect(quantile([], 0.5)).toBe(0);
  });
});

describe('parseCli', () => {
  it('defaults to 1000 greedy phase-1 runs per harness from seed 1', () => {
    const { spec, out, md } = parseCli([]);
    expect(spec).toEqual({
      runs: 1000,
      harnesses: ['terminal_purist', 'ide_companion'],
      bot: 'greedy',
      seedFrom: 1,
      phase: 1,
    });
    expect([out, md]).toEqual([null, null]);
  });

  it.each([
    [['--bot', 'expert']],
    [['--harness', 'nope']],
    [['--runs', '0']],
    [['--phase', '2']],
    [['--seed-from', 'x']],
  ])('rejects %j', (argv) => {
    expect(() => parseCli(argv)).toThrow(/^--/);
  });
});

describe('recordRun', () => {
  it('records every fight, and a shipped run fought the boss', () => {
    const rec = recordRun('1', 'terminal_purist', BOTS.greedy);
    expect(rec.fights.length).toBeGreaterThan(0);
    for (const f of rec.fights) expect(f.ms).toBeGreaterThan(0);
    if (rec.won) expect(rec.fights.at(-1)?.cls).toBe('boss');
    expect(rec.credits[0]).toBeGreaterThanOrEqual(0);
    expect(rec.tools.length).toBeGreaterThan(0);
  });
});

describe('runCli', () => {
  const argv = (name: string) =>
    [
      '--runs',
      '6',
      '--harness',
      'all',
      '--bot',
      'greedy',
      '--phase',
      '1',
      '--seed-from',
      '1',
    ].concat(['--out', join(dir, `${name}.json`), '--md', join(dir, `${name}.md`)]);

  it('the same arguments write byte-identical JSON and Markdown', () => {
    runCli(parseCli(argv('a')));
    runCli(parseCli(argv('b')));
    for (const ext of ['json', 'md']) {
      const a = readFileSync(join(dir, `a.${ext}`));
      expect(a.length).toBeGreaterThan(0);
      expect(readFileSync(join(dir, `b.${ext}`)).equals(a)).toBe(true);
    }
  }, 30_000);

  it('the report holds every exit-criteria metric', () => {
    const r = JSON.parse(readFileSync(join(dir, 'a.json'), 'utf8'));
    expect(Object.keys(r.winRate.byHarness)).toEqual(['ide_companion', 'terminal_purist']);
    expect(r.winRate.byHarness.ide_companion).toMatchObject({ n: 6, ci95: expect.any(Array) });
    expect(Object.keys(r.winRate.byHarnessPrompt).length).toBeGreaterThan(0);
    expect(Object.keys(r.fights)).toEqual(['all', 'normal', 'elite', 'boss']);
    expect(r.fights.all).toMatchObject({ medianMs: expect.any(Number), p90Ms: expect.any(Number) });
    expect(r.fights.all.trustLostMean).toBeGreaterThanOrEqual(0);
    expect(r.fights.all.compactionsMean).toBeGreaterThanOrEqual(0);
    const item = Object.values(r.items)[0] as Record<string, unknown>;
    expect(item).toMatchObject({ pickRate: expect.any(Number), winWhenPicked: expect.anything() });
    expect(Object.keys(r.winningLoadoutShare).length).toBeGreaterThan(0);
    expect(r.creditsCurve[0]).toMatchObject({ step: 0, runs: 12 });
    expect(r.phaseReached).toEqual({ 1: 12 });
  });
});
