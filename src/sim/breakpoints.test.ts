// T035: tag breakpoints count equipped tool tags (dual tags count for both); POSIX, Refactor,
// Indexed and TDD change the fight from their threshold on; their mods carry `bp:<id>`.
import { describe, expect, it } from 'vitest';
import type { Tag, ToolDef } from '../content/types/index.ts';
import { breakpoints } from './breakpoints.ts';
import { resolveCombat } from './combat/resolve.ts';
import { createSim } from './combat/state.ts';
import type { CombatInput } from './combat/types.ts';
import type { CombatEvent } from './events.ts';
import { fight, makeTool } from './testing/builders.ts';

const tagged = (id: string, ...tags: [Tag] | [Tag, Tag]): ToolDef => makeTool({ id, tags });
const web = tagged('curl', 'Web');
const ofKind = (input: CombatInput, kind: CombatEvent['kind'], src?: string) =>
  resolveCombat(input).events.filter((e) => e.kind === kind && (!src || e.src === src));
const progress = (tools: ToolDef[]) =>
  breakpoints(tools).map((b) => [b.def.id, b.count, b.def.need, b.active]);

describe('breakpoints(tools)', () => {
  it('counts every tag of a tool and returns progress per breakpoint', () => {
    const tools = [tagged('grep', 'Search', 'Shell'), tagged('sed', 'Edit', 'Shell'), web];
    expect(progress(tools)).toEqual([
      ['posix', 2, 3, false],
      ['refactor', 1, 3, false],
      ['indexed', 1, 3, false],
      ['tdd', 0, 2, false],
    ]);
    const more = [...tools, tagged('cat', 'Search', 'Shell'), tagged('lint', 'Test')];
    expect(progress([...more, tagged('bisect', 'Test', 'Shell')])).toEqual([
      ['posix', 4, 3, true],
      ['refactor', 1, 3, false],
      ['indexed', 2, 3, false],
      ['tdd', 2, 2, true],
    ]);
  });

  it('collects the mods of active breakpoints only, with why ids bp:<id>', () => {
    const ids = (tools: ToolDef[]) => createSim(fight({ tools }), false).mods.map((m) => m.id);
    const search = [1, 2, 3].map((n) => tagged(`s${n}`, 'Search', 'Shell'));
    expect(ids(search)).toEqual(['bp:posix', 'bp:indexed']);
    expect(ids([...search.slice(0, 2), web])).toEqual([]);
  });
});

describe('breakpoint effects', () => {
  it('POSIX (3 Shell): every pipe +500 ms', () => {
    const shell = (n: number) => tagged(`sh${n}`, 'Shell');
    const pipeFrom = (third: ToolDef) => {
      const tools = [makeTool({ id: 'sh0', tags: ['Shell'], pipeMs: 1000 }), shell(1), third];
      return ofKind(fight({ tools }), 'pipe')[0];
    };
    expect(pipeFrom(shell(2))).toMatchObject({ src: 't0', dst: 't1', v: 1500 });
    expect(pipeFrom(web)).toMatchObject({ src: 't0', dst: 't1', v: 1000 });
  });

  it('Refactor (3 Edit): Edit tools +15% damage, named bp:refactor in the why list', () => {
    const edit = (n: number) => tagged(`e${n}`, 'Edit');
    const first = (third: ToolDef) =>
      ofKind(fight({ tools: [edit(0), edit(1), third] }), 'damage', 't0')[0];
    expect(first(edit(2))).toMatchObject({ d: { pct: 35, why: ['zone:focused', 'bp:refactor'] } });
    expect(first(web)).toMatchObject({ d: { pct: 20, why: ['zone:focused'] } });
  });

  it('Indexed (3 Search): Search tools output -1', () => {
    const search = (n: number) => makeTool({ id: `s${n}`, tags: ['Search'], output: 2 });
    const tokens = (third: ToolDef) =>
      ofKind(fight({ tools: [search(0), search(1), third] }), 'tokens', 't0')[0];
    expect(tokens(search(2))).toMatchObject({ v: 1, d: { kind: 'output' } });
    expect(tokens(web)).toMatchObject({ v: 2, d: { kind: 'output' } });
  });

  it('TDD (2 Test): each Test tool activation restores 2 Trust', () => {
    const lint = makeTool({ id: 'lint', tags: ['Test'], target: 'self', effects: [] });
    const hurt = (tools: ToolDef[]): CombatInput => {
      const input = fight({ tools, trust: 40 });
      return { ...input, agent: { ...input.agent, trust: 20 } };
    };
    const input = hurt([lint, lint, web]);
    const fired = ofKind(input, 'toolFired').filter((e) => e.src !== 't2');
    const heals = ofKind(input, 'heal', 'a');
    expect(heals.slice(0, 2).map((e) => [e.t, e.v])).toEqual([
      [3000, 2],
      [3000, 2],
    ]);
    expect(heals.map((e) => e.t)).toEqual(fired.map((e) => e.t));
    expect(ofKind(hurt([lint, web]), 'heal', 'a')).toEqual([]);
  });
});
