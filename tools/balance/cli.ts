// Balance CLI: batch bot runs and write the JSON and Markdown report.
// node tools/balance/cli.ts --runs 1000 --harness all --bot greedy --phase 1 --seed-from 1 \
//   --out reports/balance.json --md reports/balance.md
// Runtime goes to stderr only, so the report files stay byte-identical across runs.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { parseArgs } from 'node:util';
import { content } from '../../src/content/index.ts';
import type { HarnessId } from '../../src/content/types/ids.ts';
import { type BatchSpec, runBatch } from './batch.ts';
import { reportMarkdown } from './markdown.ts';
import { buildReport, type Report, reportJson } from './report.ts';
import { BOTS, type BotName } from './run.ts';

export type CliOptions = ReturnType<typeof parseCli>;

/** M1 runs end after the Phase-1 boss; later phases come with E018. */
const PHASES = [1];

function count(name: string, raw: string, min: number): number {
  const n = Number(raw);
  if (!Number.isSafeInteger(n) || n < min)
    throw new Error(`--${name} must be an integer >= ${min}`);
  return n;
}

function harnesses(raw: string): HarnessId[] {
  const all = content.harnesses.map((h) => h.id);
  if (raw === 'all') return all;
  if (!all.includes(raw as HarnessId))
    throw new Error(`--harness must be all or ${all.join(', ')}`);
  return [raw as HarnessId];
}

export function parseCli(argv: readonly string[]) {
  const { values: v } = parseArgs({
    args: [...argv],
    options: {
      runs: { type: 'string', default: '1000' },
      harness: { type: 'string', default: 'all' },
      bot: { type: 'string', default: 'greedy' },
      phase: { type: 'string', default: '1' },
      'seed-from': { type: 'string', default: '1' },
      out: { type: 'string' },
      md: { type: 'string' },
    },
  });
  if (!(v.bot in BOTS)) throw new Error(`--bot must be one of ${Object.keys(BOTS).join(', ')}`);
  const phase = count('phase', v.phase, 1);
  if (!PHASES.includes(phase)) throw new Error(`--phase must be one of ${PHASES.join(', ')}`);
  const spec: BatchSpec = {
    runs: count('runs', v.runs, 1),
    harnesses: harnesses(v.harness),
    bot: v.bot as BotName,
    seedFrom: count('seed-from', v['seed-from'], 0),
  };
  return { spec: { ...spec, phase }, out: v.out ?? null, md: v.md ?? null };
}

function write(path: string, text: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
}

/** Runs the batch, writes the requested files and returns the report. */
export function runCli(opts: CliOptions, log: (line: string) => void = () => {}): Report {
  const records = runBatch(opts.spec, (h, ms) =>
    log(`[balance] ${h}: ${opts.spec.runs} runs in ${(ms / 1000).toFixed(1)} s`),
  );
  const report = buildReport(records, opts.spec);
  if (opts.out) write(opts.out, reportJson(report));
  if (opts.md) write(opts.md, reportMarkdown(report));
  return report;
}

if (import.meta.main) {
  try {
    const opts = parseCli(process.argv.slice(2));
    const report = runCli(opts, (line) => console.error(line));
    if (!opts.out && !opts.md) console.log(reportMarkdown(report));
  } catch (err) {
    console.error(`[balance] ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}
