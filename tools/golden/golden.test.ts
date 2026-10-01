// Golden logs: 5 reference fights built from content via run state (reference.ts) -> full
// canonical JSONL per fight (fixtures/<name>.jsonl) plus input and log SHA-256 hashes
// (fixtures/summary.jsonl). `npm test` only compares, never writes; a mismatch fails with a
// line diff. Intended change: `npm run golden:update` (GOLDEN_UPDATE=1), review the fixtures
// diff, state why in the change. Format change: bump LOG_VERSION in events.ts.
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { type CombatEvent, serializeLog, stableStringify } from '../../src/sim/events.ts';
import { type CombatResult, resolveCombat } from '../../src/sim/index.ts';
import { checkGolden, isUpdateMode, lineDiff, sha256 } from './golden.ts';
import { REFERENCES, type Reference, referenceInput } from './reference.ts';

const FIXTURES = fileURLToPath(new URL('./fixtures/', import.meta.url));
const SUMMARY = 'summary.jsonl';
const fixture = (ref: Reference): string => `${ref.name}.jsonl`;

const fights = new Map<string, CombatResult>(
  REFERENCES.map((ref) => [ref.name, resolveCombat(referenceInput(ref))]),
);
const resultOf = (ref: Reference): CombatResult => fights.get(ref.name) as CombatResult;

/** `{ fight, seed, inputHash, logHash, events }` (event-log.md "Canonical serialisation"). */
function summaryLine(ref: Reference): string {
  const input = referenceInput(ref);
  const { events } = resultOf(ref);
  const [inputHash, logHash] = [sha256(stableStringify(input)), sha256(serializeLog(events))];
  const line = { fight: ref.name, seed: input.seed, inputHash, logHash, events: events.length };
  return stableStringify(line);
}

const all = (): CombatEvent[] => [...fights.values()].flatMap((r) => r.events);
const has = (pred: (e: CombatEvent) => boolean): boolean => all().some(pred);

describe('golden logs: reference fights', () => {
  it.each(REFERENCES)('$name: full log matches its golden JSONL', (ref) => {
    checkGolden(join(FIXTURES, fixture(ref)), serializeLog(resultOf(ref).events));
  });

  it('input and log hashes of every reference fight match the golden summary', () => {
    checkGolden(join(FIXTURES, SUMMARY), `${REFERENCES.map(summaryLine).join('\n')}\n`);
  });

  it('fixtures hold exactly the summary and one JSONL per reference fight', () => {
    const expected = [SUMMARY, ...REFERENCES.map(fixture)].sort();
    expect(readdirSync(FIXTURES).sort()).toEqual(expected);
  });

  it('the same reference input produces the same bytes twice', () => {
    for (const ref of REFERENCES) {
      const again = resolveCombat(referenceInput(ref));
      expect(serializeLog(again.events)).toBe(serializeLog(resultOf(ref).events));
    }
  });

  it('a changed reference log fails with a readable line diff', () => {
    if (isUpdateMode()) return; // fixtures are being rewritten in this run
    const ref = REFERENCES[0] as Reference;
    const lines = serializeLog(resultOf(ref).events).split('\n');
    const ix = lines.findIndex((l) => l.includes('"kind":"damage"'));
    const changed = lines.map((l, i) => (i === ix ? l.replace(/"v":(\d+)/, '"v":999') : l));
    const path = join(FIXTURES, fixture(ref));
    const want = new RegExp(`@@ line ${ix + 1}\\n- .*"kind":"damage".*\\n\\+ .*"v":999`);
    expect(() => checkGolden(path, changed.join('\n'), false)).toThrow(want);
  });
});

describe('golden logs: reference coverage', () => {
  const kinds = new Set(all().map((e) => e.kind));
  const outcomes = REFERENCES.map((ref) => resultOf(ref).reason);

  it('covers both harnesses, a win and a Trust loss', () => {
    expect(new Set(REFERENCES.map((r) => r.harness)).size).toBe(2);
    expect(outcomes).toEqual(expect.arrayContaining(['resolved', 'trust']));
  });

  it('covers pipes, statuses, Guardrails, noise, zones, both compaction kinds and overtime', () => {
    const want = ['pipe', 'statusOn', 'statusOff', 'guard', 'zoneChanged', 'deadline'] as const;
    expect([...kinds]).toEqual(expect.arrayContaining([...want]));
    expect(has((e) => e.kind === 'tokens' && e.d.kind === 'noise')).toBe(true);
    expect(has((e) => e.kind === 'compaction' && e.d.kind === 'auto')).toBe(true);
    expect(has((e) => e.kind === 'compaction' && e.d.kind === 'planned')).toBe(true);
    expect(has((e) => e.kind === 'spawn' && e.d.reason === 'intent')).toBe(true);
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
