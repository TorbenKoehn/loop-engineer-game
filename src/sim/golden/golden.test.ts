// Golden logs: fixed inputs -> stub fight logs, pinned as hashes (fixtures/summary.jsonl) plus
// full JSONL for reference seeds. `npm test` only compares, never writes; a mismatch fails
// with a line diff. Intended change: `npm run golden:update` (GOLDEN_UPDATE=1), review the
// fixtures diff, state why in the change. Format change: bump LOG_VERSION in events.ts.
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { serializeLog, stableStringify } from '../events.ts';
import { checkGolden, isUpdateMode, lineDiff, sha256 } from './golden.ts';
import { type StubInput, stubFight } from './stub-fight.ts';

const FIXTURES = fileURLToPath(new URL('./fixtures/', import.meta.url));
const INPUTS: readonly StubInput[] = [
  { seed: 'golden-1', shots: 12 },
  { seed: 'golden-2', shots: 12 },
  { seed: 'golden-3', shots: 3 },
  { seed: 'K7Q2-M9XA', shots: 12 },
  { seed: 'daily-2026-10-01', shots: 12 },
];
const REFERENCE = { seed: 'golden-1', shots: 12 };

function summaryLine(input: StubInput): string {
  const events = stubFight(input);
  const [inputHash, logHash] = [sha256(stableStringify(input)), sha256(serializeLog(events))];
  return stableStringify({ seed: input.seed, inputHash, logHash, events: events.length });
}

describe('golden logs', () => {
  it('full log of the reference seed matches its golden JSONL', () => {
    checkGolden(join(FIXTURES, `${REFERENCE.seed}.jsonl`), serializeLog(stubFight(REFERENCE)));
  });

  it('input and log hashes of every fixed seed match the golden summary', () => {
    checkGolden(join(FIXTURES, 'summary.jsonl'), `${INPUTS.map(summaryLine).join('\n')}\n`);
  });

  it('the same input produces the same bytes twice', () => {
    for (const input of INPUTS)
      expect(serializeLog(stubFight(input))).toBe(serializeLog(stubFight(input)));
  });

  it('stub logs have strictly increasing seq and non-decreasing t on the 50 ms grid', () => {
    for (const input of INPUTS) {
      const log = stubFight(input);
      expect(log.map((e) => e.seq)).toEqual(log.map((_, i) => i));
      expect(log.every((e, i) => e.t % 50 === 0 && e.t >= (log[i - 1]?.t ?? 0))).toBe(true);
    }
  });
});

describe('golden harness', () => {
  const dir = mkdtempSync(join(tmpdir(), 'golden-'));
  const tmpFile = (name: string): string => join(dir, name);
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('lineDiff shows line numbers with expected and actual lines, capped at 10', () => {
    expect(lineDiff('a\nb\n', 'a\nB\n')).toBe('@@ line 2\n- b\n+ B');
    expect(lineDiff('a\n', 'a\nc\n')).toBe('@@ line 2\n- \n+ c\n@@ line 3\n- (missing)\n+ ');
    expect(lineDiff('same', 'same')).toBeUndefined();
    const many = (c: string): string => Array.from({ length: 15 }, () => c).join('\n');
    const diff = lineDiff(many('x'), many('y')) ?? '';
    expect(diff.split('@@').length - 1).toBe(10);
    expect(diff).toContain('... and 5 more lines');
  });

  it('checkGolden fails with a readable diff and the update hint on change', () => {
    const path = tmpFile('log.jsonl');
    checkGolden(path, '{"seq":0}\n{"seq":1,"v":3}\n', true);
    expect(() => checkGolden(path, '{"seq":0}\n{"seq":1,"v":4}\n', false)).toThrow(
      /Golden mismatch: .*\n@@ line 2\n- \{"seq":1,"v":3\}\n\+ \{"seq":1,"v":4\}\n.*golden:update/,
    );
  });

  it('checkGolden never creates a missing golden outside update mode', () => {
    const path = tmpFile('missing.jsonl');
    expect(() => checkGolden(path, 'x\n', false)).toThrow(/Golden file missing: .*golden:update/s);
    expect(() => readFileSync(path)).toThrow();
  });

  it('checkGolden writes in update mode and accepts CRLF checkouts afterwards', () => {
    const path = tmpFile('crlf.jsonl');
    checkGolden(path, 'a\r\nb\r\n', true);
    expect(() => checkGolden(path, 'a\nb\n', false)).not.toThrow();
  });

  it('update mode is on only when GOLDEN_UPDATE is exactly 1', () => {
    const modes = ['1', 'true', undefined].map((v) => isUpdateMode({ GOLDEN_UPDATE: v }));
    expect(modes).toEqual([true, false, false]);
  });
});
