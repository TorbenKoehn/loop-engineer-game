import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { content } from '../content/index.ts';
import type { Action } from './actions.ts';
import { apply, legalActions } from './apply.ts';
import { newRun, promptOffer } from './new-run.ts';
import { replay } from './replay.ts';
import type { MetaView, RunSetup, RunState } from './state.ts';

const META: MetaView = { unlocked: [], lessons: [], lintCap: 0 };
const setup = (seed = 'K7Q2-M9XA', harness = 'terminal_purist'): RunSetup => ({
  seed,
  harness,
  lint: [],
  tutorial: false,
});

function step(state: RunState, action: Action): RunState {
  const r = apply(state, action);
  if (!r.ok) throw new Error(`rejected ${JSON.stringify(action)}: ${r.error}`);
  return r.state;
}

/** Walks a random legal path; `picks` choose among legal actions; `visit` sees each state. */
function walk(seed: string, picks: readonly number[], visit = (_: RunState) => {}) {
  let state = newRun(setup(seed), META);
  const actions: Action[] = [];
  for (const p of picks) {
    visit(state);
    const legal = legalActions(state);
    if (legal.length === 0) break;
    const action = legal[p % legal.length] as Action;
    actions.push(action);
    state = step(state, action);
  }
  return { state, actions };
}

describe('newRun', () => {
  it('new run picks a prompt and reaches map', () => {
    const start = newRun(setup(), META);
    expect(start.mode).toBe('promptPick');
    expect(start.pending).toEqual({ kind: 'promptOffer', prompts: promptOffer([]) });
    const state = step(start, { t: 'pickPrompt', prompt: 'concise' });
    const purist = content.harnesses.find((h) => h.id === 'terminal_purist');
    expect(state.mode).toBe('map');
    expect(state.setup.prompt).toBe('concise');
    expect(state.pending).toBeNull();
    expect(state.agent.credits).toBe(10);
    expect(state.agent.tools.map((t) => t.id)).toEqual(purist?.tools);
    expect(state.agent.tools.every((t) => t.version === 1 && t.weightMod === 0)).toBe(true);
    expect(state.agent.skills).toEqual(purist?.skills);
    expect(state.agent.trust).toBe(purist?.model.trust);
    expect(state.agent.slots).toEqual(purist?.slots);
  });

  it('offers the three starter prompts', () => {
    expect(promptOffer([])).toEqual(['senior', 'concise', 'step_by_step']);
  });

  it('copies meta into the setup snapshot', () => {
    const meta: MetaView = { unlocked: ['power_tools'], lessons: ['l1'], lintCap: 2 };
    const s = newRun({ ...setup(), lint: ['no_any'] }, meta);
    expect(s.setup).toMatchObject({ unlocked: ['power_tools'], lessons: ['l1'], lint: ['no_any'] });
    meta.unlocked.push('loop_theory');
    expect(s.setup.unlocked).toEqual(['power_tools']);
  });

  it('rejects unknown harnesses and lint over the cap', () => {
    expect(() => newRun(setup('s', 'nope'), META)).toThrow(RangeError);
    expect(() => newRun({ ...setup(), lint: ['a'] }, META)).toThrow(RangeError);
  });
});

describe('apply', () => {
  const start = newRun(setup(), META);
  const onMap = step(start, { t: 'pickPrompt', prompt: 'senior' });
  const cases: [string, RunState, Action, string][] = [
    ['prompt not offered', start, { t: 'pickPrompt', prompt: 'tenx' }, 'notOffered'],
    ['travel before the prompt', start, { t: 'travel', node: 'p1-boss' }, 'wrongMode'],
    ['second prompt pick', onMap, { t: 'pickPrompt', prompt: 'senior' }, 'wrongMode'],
    ['travel to the boss from the start', onMap, { t: 'travel', node: 'p1-boss' }, 'notReachable'],
    ['unknown action', onMap, { t: 'dance' } as unknown as Action, 'unknownAction'],
  ];

  it.each(cases)('%s: ok false, typed error, state unchanged', (_, state, action, error) => {
    const before = structuredClone(state);
    expect(apply(state, action)).toEqual({ ok: false, error });
    expect(state).toEqual(before);
  });

  it('travel moves along edges and counts visits', () => {
    const first = legalActions(onMap)[0] as Action;
    const s = step(onMap, first);
    expect(s.map.current).toBe(s.map.visited[0]);
    expect(s.stats.nodesVisited).toBe(1);
    expect(onMap.map.current).toBeNull();
  });

  it('has no legal actions outside promptPick and map', () => {
    expect(legalActions({ ...onMap, mode: 'shop' })).toEqual([]);
    expect(legalActions({ ...start, pending: null })).toEqual([]);
    expect(apply({ ...start, pending: null }, { t: 'pickPrompt', prompt: 'senior' })).toEqual({
      ok: false,
      error: 'wrongMode',
    });
  });
});

describe('run properties', () => {
  const seeds = fc.string({ minLength: 1, maxLength: 16 });
  const picks = fc.array(fc.nat(), { minLength: 1, maxLength: 12 });

  it('every action from legalActions is accepted by apply (100 seeds)', () => {
    fc.assert(
      fc.property(seeds, picks, (seed, ps) => {
        const acceptsAll = (s: RunState) => {
          for (const action of legalActions(s)) expect(apply(s, action).ok).toBe(true);
        };
        acceptsAll(walk(seed, ps, acceptsAll).state);
      }),
      { numRuns: 100 },
    );
  });

  it('replay(seed, actions) deep-equals the incrementally built state', () => {
    fc.assert(
      fc.property(seeds, picks, (seed, ps) => {
        const { state, actions } = walk(seed, ps);
        expect(replay(state.setup, actions)).toEqual({ ok: true, state });
      }),
      { numRuns: 100 },
    );
  });

  it('replay stops at the first rejected action', () => {
    const s = newRun(setup(), META).setup;
    expect(replay(s, [{ t: 'travel', node: 'p1-boss' }])).toEqual({
      ok: false,
      error: 'wrongMode',
    });
  });

  it('RunState survives a JSON round trip unchanged', () => {
    fc.assert(
      fc.property(seeds, picks, (seed, ps) => {
        const { state } = walk(seed, ps);
        expect(JSON.parse(JSON.stringify(state))).toStrictEqual(state);
      }),
      { numRuns: 100 },
    );
  });

  it('the map depends only on the seed', () => {
    expect(newRun(setup('a'), META).map).toEqual(newRun(setup('a', 'ide_companion'), META).map);
  });
});
