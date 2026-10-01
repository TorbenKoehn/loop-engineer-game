// T032: every condition kind has a passing and a failing case.
import { describe, expect, it } from 'vitest';
import type { Cond, Trigger } from '../../../content/types/index.ts';
import { fight, makeRule, makeSkill, makeTool, withSkills } from '../../testing/builders.ts';
import { resolveCombat } from '../resolve.ts';
import type { CombatInput } from '../types.ts';

const ANY_FIRE: Trigger = { on: 'toolFired' };
const grep = makeTool();
const sed = makeTool({ id: 'sed', tags: ['Edit', 'Shell'] });
const editFile = makeTool({ id: 'edit_file', tags: ['Edit'] });

/** t of each firing of a rule (guard 1, src `a`) with `cond` on `when`. */
function firings(input: CombatInput, cond: Cond, when: Trigger = ANY_FIRE): number[] {
  const rule = makeRule(when, [{ do: 'guard', v: 1 }], [cond]);
  const { events } = resolveCombat(withSkills(input, makeSkill('s', rule)));
  return events.filter((e) => e.kind === 'guard' && e.src === 'a').map((e) => e.t);
}

// grep alone fires at 3000, 6000, 9000, 12 000 and 15 000 (Typo resolved).
describe('zone', () => {
  const start: Trigger = { on: 'fightStart' };
  it('passes in that zone', () => {
    expect(firings(fight(), { if: 'zone', is: 'focused' }, start)).toEqual([0]); // W 60, B 23
  });
  it('fails in another zone', () => {
    expect(firings(fight({ window: 200 }), { if: 'zone', is: 'focused' }, start)).toEqual([]);
  });
});

describe('piped', () => {
  const pipeInto = (pipeMs?: number) =>
    fight({ tools: [makeTool({ pipeMs }), makeTool({ id: 'sed', cooldownMs: 5000 })] });
  const sedFired: Trigger = { on: 'toolFired', tool: 'sed' };
  it('passes when the tool was piped since its last activation', () => {
    // grep pipes 1000 ms into sed at 3000; sed fires at 4000.
    expect(firings(pipeInto(1000), { if: 'piped' }, sedFired)[0]).toBe(4000);
  });
  it('fails when it was not', () => {
    expect(firings(pipeInto(), { if: 'piped' }, sedFired)).toEqual([]);
  });
});

describe('nth', () => {
  it('passes on every n-th trigger', () => {
    expect(firings(fight(), { if: 'nth', n: 2 })).toEqual([6000, 12_000]);
  });
  it('fails before the n-th trigger', () => {
    expect(firings(fight(), { if: 'nth', n: 6 })).toEqual([]);
  });
});

describe('adjacentSharesTag', () => {
  const grepFired: Trigger = { on: 'toolFired', tool: 'grep' };
  it('passes next to a tool sharing a tag', () => {
    const input = fight({ tools: [grep, sed] }); // Shell
    expect(firings(input, { if: 'adjacentSharesTag' }, grepFired)[0]).toBe(3000);
  });
  it('fails next to tools without a shared tag', () => {
    const input = fight({ tools: [grep, editFile] });
    expect(firings(input, { if: 'adjacentSharesTag' }, grepFired)).toEqual([]);
  });
});

describe('cooldownAtMost', () => {
  it('passes at or below ms', () => {
    expect(firings(fight(), { if: 'cooldownAtMost', ms: 3000 })).toHaveLength(5);
  });
  it('fails above ms', () => {
    expect(firings(fight(), { if: 'cooldownAtMost', ms: 2950 })).toEqual([]);
  });
});

describe('oncePerFight', () => {
  it('passes the first time', () => {
    expect(firings(fight(), { if: 'oncePerFight' })[0]).toBe(3000);
  });
  it('fails after it fired this fight', () => {
    expect(firings(fight(), { if: 'oncePerFight' })).toHaveLength(1);
  });
});

describe('oncePerRun', () => {
  it('passes while the rule id is unused this run', () => {
    expect(firings(fight(), { if: 'oncePerRun' })).toEqual([3000]);
  });
  it('fails when the run already used it', () => {
    const input = fight();
    const used = { ...input, agent: { ...input.agent, usedOncePerRun: ['skill:s#0'] } };
    expect(firings(used, { if: 'oncePerRun' })).toEqual([]);
  });
});

describe('cooldown', () => {
  it('passes once ms have passed since it last fired', () => {
    expect(firings(fight(), { if: 'cooldown', ms: 5000 })).toEqual([3000, 9000, 15_000]);
  });
  it('fails within ms of its last firing', () => {
    expect(firings(fight(), { if: 'cooldown', ms: 6050 })).toEqual([3000, 12_000]);
  });
});
