import { describe, expect, it } from 'vitest';
import { content } from '../../content/index.ts';
import { fork, nextInt, pick } from '../../sim/rng.ts';
import type { Action } from '../actions.ts';
import { apply, legalActions } from '../apply.ts';
import { reachable } from '../map/graph.ts';
import { newRun } from '../new-run.ts';
import type { NodeType, RunState } from '../state.ts';
import { applyOutcomes } from './outcomes.ts';
import { eventChoices, eventPool } from './standup.ts';

const META = { unlocked: [], lessons: [], lintCap: 0 };
const SEED = 'K7Q2-M9XA';
const IDS = content.events.map((e) => e.id);

function step(state: RunState, action: Action): RunState {
  const r = apply(state, action);
  if (!r.ok) throw new Error(`rejected ${JSON.stringify(action)}: ${r.error}`);
  return r.state;
}

function onMap(seed = SEED, harness = 'terminal_purist'): RunState {
  const start = newRun({ seed, harness, lint: [], tutorial: false }, META);
  return step(start, { t: 'pickPrompt', prompt: 'senior' });
}

/** Retypes the first reachable node to `type` (no encounter) and travels there. */
function arriveAt(base: RunState, type: NodeType): RunState {
  const id = reachable(base.map)[0] as string;
  const nodes = base.map.nodes.map((n) => (n.id === id ? { ...n, type, encounter: null } : n));
  return step({ ...base, map: { ...base.map, nodes } }, { t: 'travel', node: id });
}

/** A Standup whose pool holds only `id` (the others count as seen). */
const atEvent = (id: string, base = onMap()): RunState =>
  arriveAt({ ...base, seenEvents: IDS.filter((e) => e !== id) }, 'standup');

const choose = (s: RunState, ix: number) => step(s, { t: 'chooseEvent', ix });
const withAgent = (s: RunState, agent: Partial<RunState['agent']>): RunState => ({
  ...s,
  agent: { ...s.agent, ...agent },
});

describe('Standup draw', () => {
  it('draws one unseen phase-1 event via event/<nodeId> and marks it seen', () => {
    const base = onMap();
    const s = arriveAt(base, 'standup');
    const node = s.map.current as string;
    const expected = pick(fork(SEED, `event/${node}`), eventPool(base)).id;
    expect(eventPool(base).map((e) => e.id)).toEqual(IDS);
    expect(s.mode).toBe('event');
    expect(s.pending).toMatchObject({ kind: 'event', node, event: expected });
    expect(s.seenEvents).toEqual([expected]);
  });

  it('never draws a seen event or one outside the phase; an empty pool stays on the map', () => {
    expect(atEvent('green_locally').pending).toMatchObject({ event: 'green_locally' });
    expect(eventPool({ ...onMap(), phase: 3 }).map((e) => e.id)).not.toContain('underflow_answer');
    const none = arriveAt({ ...onMap(), seenEvents: [...IDS] }, 'standup');
    expect(none.mode).toBe('map');
    expect(none.pending).toBeNull();
  });
});

describe('quick_tiny_change', () => {
  const s = atEvent('quick_tiny_change');
  it('Sure!: +25 Credits and Scope Creep at the back of the next 2 fights', () => {
    const after = choose(s, 0);
    expect(after.mode).toBe('map');
    expect(after.pending).toBeNull();
    expect(after.agent.credits).toBe(s.agent.credits + 25);
    expect(after.nextFight).toEqual([
      { mod: 'addEnemy', enemy: 'scope_creep', count: 1, fights: 2 },
    ]);
  });
  it('Ask for a ticket: nothing', () => {
    expect(choose(s, 1)).toEqual({ ...s, mode: 'map', pending: null });
  });
});

describe('pasted_log', () => {
  it('Read all of it: leftmost [Search] tool +1 version; next fight +20 noise', () => {
    const after = choose(atEvent('pasted_log'), 0);
    expect(after.agent.tools.map((t) => [t.id, t.version])).toEqual([
      ['grep', 2],
      ['cat', 1],
      ['sed', 1],
    ]);
    expect(after.nextFight).toEqual([{ mod: 'startNoise', tokens: 20 }]);
  });
  it('Read all of it without a [Search] tool gains grep', () => {
    const after = choose(atEvent('pasted_log', onMap(SEED, 'ide_companion')), 0);
    expect(after.agent.tools.map((t) => t.id)).toEqual([
      'autocomplete',
      'edit_file',
      'lint',
      'grep',
    ]);
  });
  it('Ask for the relevant part: +8 Credits', () => {
    const s = atEvent('pasted_log');
    expect(choose(s, 1).agent.credits).toBe(s.agent.credits + 8);
  });
});

describe('underflow_answer', () => {
  /** The draw, the tool pick, then the 50% roll, all from event/<nodeId>. */
  function expected(s: RunState) {
    const rng = fork(s.setup.seed, `event/${s.map.current}`);
    pick(rng, ['underflow_answer']);
    const uncommon = content.tools.filter((d) => d.rarity === 'uncommon' && d.unlock === 'base');
    return { tool: pick(rng, uncommon).id, hit: nextInt(rng, 100) < 50 };
  }
  const seeds = Array.from({ length: 12 }, (_, i) => `S${i}`);
  const runs = seeds.map((seed) => atEvent('underflow_answer', onMap(seed)));

  it('Copy it: a random uncommon tool; 50%: also lose 8 Trust', () => {
    for (const s of runs) {
      const { tool, hit } = expected(s);
      const after = choose(s, 0);
      expect(after.agent.tools.at(-1)).toEqual({ id: tool, version: 1, weightMod: 0 });
      expect(after.agent.trust).toBe(s.agent.trust - (hit ? 8 : 0));
    }
    expect(new Set(runs.map((s) => expected(s).hit))).toEqual(new Set([true, false]));
  });
  it('a roll that drops Trust to 0 ends the run as ctrlc', () => {
    const s = runs.find((r) => expected(r).hit) as RunState;
    const after = choose(withAgent(s, { trust: 8 }), 0);
    expect(after.mode).toBe('runEnd');
    expect(after.result?.outcome).toBe('ctrlc');
  });
  it('Read the comments: +5 Credits', () => {
    const s = runs[0] as RunState;
    expect(choose(s, 1).agent.credits).toBe(s.agent.credits + 5);
  });
});

describe('green_locally', () => {
  const s = withAgent(atEvent('green_locally'), { trust: 10, credits: 15 });
  it('Ship it: restore 20 Trust, capped at max', () => {
    expect(choose(s, 0).agent.trust).toBe(30);
    expect(choose(withAgent(s, { trust: s.agent.maxTrust - 5 }), 0).agent.trust).toBe(
      s.agent.maxTrust,
    );
  });
  it('Set up CI properly: pays 15 Credits for +1 memory slot', () => {
    const after = choose(s, 1);
    expect(after.agent.credits).toBe(0);
    expect(after.agent.slots.memory).toBe(s.agent.slots.memory + 1);
  });
  it('Write one more test: leftmost [Test] tool +1 version', () => {
    const ide = choose(atEvent('green_locally', onMap(SEED, 'ide_companion')), 2);
    expect(ide.agent.tools.map((t) => t.version)).toEqual([1, 1, 2]);
  });
});

describe('choice requirements', () => {
  const s = withAgent(atEvent('green_locally'), { credits: 14 });

  it('unmet choices are illegal and expose the reason', () => {
    expect(eventChoices(s).map((c) => [c.choice.id, c.blocked])).toEqual([
      ['ship_it', null],
      ['set_up_ci', 'insufficientCredits'],
      ['one_more_test', 'missingTag'],
    ]);
    expect(legalActions(s)).toEqual([{ t: 'chooseEvent', ix: 0 }]);
    expect(apply(s, { t: 'chooseEvent', ix: 1 })).toEqual({
      ok: false,
      error: 'insufficientCredits',
    });
    expect(apply(s, { t: 'chooseEvent', ix: 2 })).toEqual({ ok: false, error: 'missingTag' });
  });
  it('rejects unknown choices and chooseEvent outside an event', () => {
    expect(apply(s, { t: 'chooseEvent', ix: 3 })).toEqual({ ok: false, error: 'notOffered' });
    expect(apply(onMap(), { t: 'chooseEvent', ix: 0 })).toEqual({ ok: false, error: 'wrongMode' });
    expect(eventChoices(onMap())).toEqual([]);
  });
});

describe('outcome verbs beyond the M1 rows', () => {
  const s = onMap(); // grep, cat, sed
  const rng = () => fork(SEED, 'test');
  const versions = (r: RunState) => r.agent.tools.map((t) => t.version);

  it('rightmost, random and version filters pick among matching tools', () => {
    const right = applyOutcomes(
      s,
      [{ do: 'version', tool: { pick: 'rightmost', tag: 'Search' }, n: 1 }],
      rng(),
    );
    expect(versions(right)).toEqual([1, 2, 1]);
    const random = applyOutcomes(
      s,
      [{ do: 'version', tool: { pick: 'random', minVersion: 2 }, n: 1 }],
      rng(),
    );
    expect(random).toEqual(s);
    const down = applyOutcomes(
      s,
      [{ do: 'version', tool: { pick: 'random', maxVersion: 1 }, n: -1 }],
      rng(),
    );
    expect(versions(down)).toEqual([1, 1, 1]);
  });
  it('credits never go below 0; unsupported verbs throw', () => {
    expect(applyOutcomes(s, [{ do: 'credits', n: -999 }], rng()).agent.credits).toBe(0);
    expect(applyOutcomes(s, [{ do: 'slot', kind: 'tool', n: 1 }], rng()).agent.slots.tools).toBe(7);
    expect(() => applyOutcomes(s, [{ do: 'maxTrust', n: 6 }], rng())).toThrow(RangeError);
  });
});
