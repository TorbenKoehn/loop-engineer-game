import { describe, expect, it } from 'vitest';
import type { Filter, ToolDef } from '../../../content/types/index.ts';
import { fight, makeTool } from '../../testing/builders.ts';
import { matchesTool } from '../mods/filter.ts';
import { createSim, PROGRESS_PER_MS, type Sim, type ToolRt } from '../state.ts';
import { applyStatus } from '../status/statuses.ts';
import { fireTools } from '../tick/fire.ts';
import { addPrimes, filterKey } from './primes.ts';

/** A [Search] tool that primes the next [Edit] activation. */
const primer = (id: string, pct: number, filter: Filter = { tag: 'Edit' }): ToolDef =>
  makeTool({
    id,
    effects: [
      { do: 'dmg', v: 1 },
      { do: 'prime', filter, pct },
    ],
  });
const edit = (id = 'edit_file'): ToolDef =>
  makeTool({ id, tags: ['Edit'], effects: [{ do: 'dmg', v: 10 }] });

function setup(...defs: ToolDef[]): Sim {
  return createSim(fight({ tools: defs }), true);
}

function slot(sim: Sim, i: number): ToolRt {
  const tool = sim.agent.tools[i];
  if (!tool) throw new Error(`no tool in slot ${i}`);
  return tool;
}

const fill = (tool: ToolRt) => {
  tool.progress = tool.def.cooldownMs * PROGRESS_PER_MS;
};
const ofKind = (sim: Sim, ...kinds: string[]) => sim.events.filter((e) => kinds.includes(e.kind));

describe('primes', () => {
  it('primes add and are consumed together', () => {
    const sim = setup(primer('read_file', 30), primer('grep', 20), edit());
    fill(slot(sim, 0));
    fill(slot(sim, 1));
    fireTools(sim);
    expect(slot(sim, 2).primes.map((p) => [p.id, p.pct])).toEqual([
      ['prime:read_file', 30],
      ['prime:grep', 20],
    ]);
    fill(slot(sim, 2));
    fireTools(sim);
    expect(slot(sim, 2).primes).toEqual([]);
    const edits = ofKind(sim, 'prime', 'primeUsed', 'damage').filter((e) => e.src !== 'e1');
    expect(edits.slice(-3)).toMatchObject([
      { kind: 'primeUsed', src: 't0', dst: 't2', v: 30, d: { filter: 'tag:Edit' } },
      { kind: 'primeUsed', src: 't1', dst: 't2', v: 20, d: { filter: 'tag:Edit' } },
      // Focused +20 first, then the primes: 10 x 170% = 17.
      {
        kind: 'damage',
        src: 't2',
        v: 17,
        d: { pct: 70, why: ['zone:focused', 'prime:read_file', 'prime:grep'] },
      },
    ]);
    expect(ofKind(sim, 'prime')).toMatchObject([
      { src: 't0', dst: 't2', v: 30, d: { filter: 'tag:Edit' } },
      { src: 't1', dst: 't2', v: 20, d: { filter: 'tag:Edit' } },
    ]);

    fill(slot(sim, 2));
    fireTools(sim); // consumed: the next activation is unprimed
    expect(ofKind(sim, 'damage').at(-1)).toMatchObject({
      src: 't2',
      v: 11, // 12 after Focused, overkill capped at the 11 Severity left
      d: { pct: 20, why: ['zone:focused'] },
    });
  });

  it('a prime goes on the matching tool that fires next; ties go to the leftmost', () => {
    const sim = setup(primer('read_file', 30), edit('a'), edit('b'), edit('c'));
    slot(sim, 2).progress = 2000 * PROGRESS_PER_MS;
    slot(sim, 3).progress = 2000 * PROGRESS_PER_MS;
    addPrimes(sim, 't0', 'read_file', { filter: { tag: 'Edit' }, pct: 30, count: 1 });
    expect(sim.agent.tools.map((t) => t.primes.length)).toEqual([0, 0, 1, 0]);

    applyStatus(sim, 'e1', slot(sim, 2), { status: 'stun', ms: 1000 }); // never fires now
    addPrimes(sim, 't0', 'read_file', { filter: { tag: 'Edit' }, pct: 30, count: 2 });
    expect(sim.agent.tools.map((t) => t.primes.length)).toEqual([0, 1, 1, 1]);
  });

  it('a prime with no matching tool is dropped silently', () => {
    const sim = setup(primer('read_file', 30), makeTool());
    fill(slot(sim, 0));
    fireTools(sim);
    expect(sim.agent.tools.map((t) => t.primes)).toEqual([[], []]);
    expect(ofKind(sim, 'prime')).toEqual([]);
  });

  it('a prime from an activation waits for the next one, even on its own tool', () => {
    const sim = setup(primer('read_docs', 40, {}));
    fill(slot(sim, 0));
    fireTools(sim);
    expect(ofKind(sim, 'damage')).toMatchObject([{ d: { pct: 20, why: ['zone:focused'] } }]);
    expect(slot(sim, 0).primes).toHaveLength(1);
    fill(slot(sim, 0));
    fireTools(sim);
    expect(ofKind(sim, 'damage').at(-1)).toMatchObject({
      d: { pct: 60, why: ['zone:focused', 'prime:read_docs'] },
    });
  });

  it('filters match tool fields; family does not restrict tools', () => {
    const grep = makeTool(); // Search, Shell, weight 3, 3000 ms
    const cases: [Filter, boolean][] = [
      [{}, true],
      [{ tag: 'Shell' }, true],
      [{ tag: 'Edit' }, false],
      [{ tool: 'grep' }, true],
      [{ tool: 'read_file' }, false],
      [{ maxWeight: 3, maxCooldownMs: 3000 }, true],
      [{ maxWeight: 2 }, false],
      [{ maxCooldownMs: 2999 }, false],
      [{ family: 'Bugs' }, true],
    ];
    for (const [filter, match] of cases) expect(matchesTool(grep, filter)).toBe(match);
    expect(filterKey({})).toBe('any');
    expect(filterKey({ maxWeight: 3, tag: 'Edit' })).toBe('tag:Edit,maxWeight:3');
  });
});
