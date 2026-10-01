// T061: one plain-English line per event, `[mm:ss.mmm] source -> target: verb value (why)`.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadFight } from '../fight.ts';
import { fightInput } from '../testing/fights.ts';
import { type EventSpec, fightOf, hit } from '../testing/log-fight.ts';
import { lineText, logLines } from './format.ts';

const FIRE: EventSpec = { t: 12350, kind: 'toolFired', src: 't0', d: { def: 'grep', version: 2 } };
const text = (events: readonly EventSpec[], accuracy?: string): string[] =>
  logLines(fightOf(events, accuracy)).map(lineText);

describe('combat log lines', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders a hit with its why list in the fixed format', () => {
    const lines = text([FIRE, hit(12350, 14, ['zone:focused', 'skill:unix_philosophy'])]);
    expect(lines[1]).toBe(
      '[00:12.350] grep v2 -> Context Drift: 14 dmg (Focused +20%, Unix Philosophy +30%)',
    );
  });

  it('names primes with the value of their primeUsed, then armor and Guardrails', () => {
    const used: EventSpec = {
      t: 12350,
      kind: 'primeUsed',
      src: 'a',
      dst: 't0',
      v: 50,
      d: { filter: 'tag:Edit' },
    };
    const why = ['prompt:senior', 'prime:grep_first'];
    const lines = text([FIRE, used, hit(12350, 9, why, { guard: 4, armor: 2 })]);
    expect(lines[1]).toBe('[00:12.350] Terminal Purist -> grep v2: spends a +50% prime');
    expect(lines[2]).toBe(
      '[00:12.350] grep v2 -> Context Drift: 9 dmg ' +
        '(Senior +10%, Grep First prime +50%, 2 into armor, 4 into Guardrails)',
    );
  });

  it('uses the model Cold penalty and names an item without a matching mod bare', () => {
    const lines = text([hit(1000, 4, ['zone:cold', 'skill:grep_first'])], 'low');
    expect(lines[0]).toBe('[00:01.000] grep v2 -> Context Drift: 4 dmg (Cold -35%, Grep First)');
  });

  it('marks hits on the agent and omits the target when there is none', () => {
    const lines = logLines(
      fightOf([
        { t: 3000, kind: 'damage', src: 'e1', dst: 'a', v: 2, d: { ...hit(0, 0, []).d } },
        { t: 3000, kind: 'resolved', src: 'e1', d: { by: 't1' } },
      ] as EventSpec[]),
    );
    expect(lines.map(lineText)).toEqual([
      '[00:03.000] Context Drift -> Terminal Purist: 2 dmg',
      '[00:03.000] Context Drift: resolved by cat v1',
    ]);
    expect(lines.map((l) => [l.tone, l.hurt])).toEqual([
      ['enemy', true],
      ['enemy', false],
    ]);
  });

  it('every event of real fights renders in the format with known strings only', () => {
    const error = vi.spyOn(console, 'error');
    for (const encounter of ['p1x1', 'p1b']) {
      const harness = 'terminal_purist';
      const fight = loadFight(fightInput({ harness, encounter, seed: 'K7Q2-M9XA' }), harness);
      const lines = logLines(fight).map(lineText);
      expect(lines).toHaveLength(fight.events.length);
      for (const line of lines) {
        expect(line).toMatch(/^\[\d\d:\d\d\.\d{3}\] [^:]+( -> [^:]+)?: \S/);
        expect(line).not.toMatch(/\b(log|ui|zone|status)\.\w/);
      }
    }
    expect(error).not.toHaveBeenCalled();
  });
});
