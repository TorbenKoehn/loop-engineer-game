import { describe, expect, it } from 'vitest';
import { content } from '../content/index.ts';
import type { EnemyDef } from '../content/types/enemy.ts';
import type { FightModifier } from '../content/types/event.ts';
import type { CombatEvent, Ref } from '../sim/events.ts';
import { resolveCombat } from '../sim/index.ts';
import { forkSeed } from '../sim/rng.ts';
import type { Action } from './actions.ts';
import { apply, legalActions } from './apply.ts';
import { combatInput } from './combat.ts';
import { reachable } from './map/graph.ts';
import { newRun } from './new-run.ts';
import type { MapNode, MetaView, RunState } from './state.ts';
import { addFight, DEADLINE, emptyStats, fightStats } from './stats.ts';

const META: MetaView = { unlocked: [], lessons: ['bugs_off'], lintCap: 0 };

function step(state: RunState, action: Action): RunState {
  const r = apply(state, action);
  if (!r.ok) throw new Error(`rejected ${JSON.stringify(action)}: ${r.error}`);
  return r.state;
}

function onMap(seed = 'K7Q2-M9XA', harness = 'terminal_purist', prompt = 'senior'): RunState {
  const start = newRun({ seed, harness, lint: [], tutorial: false }, META);
  return step(start, { t: 'pickPrompt', prompt });
}

function node(state: RunState, id: string): MapNode {
  const n = state.map.nodes.find((m) => m.id === id);
  if (!n) throw new Error(`missing node ${id}`);
  return n;
}

const splitChildren = (e: EnemyDef | undefined): string[] =>
  (e?.traits ?? []).flatMap((t) => (t.trait === 'split' ? [t.child] : []));
const firstNode = (state: RunState) => reachable(state.map)[0] as string;
const def = <T extends { id: string }>(list: readonly T[], id: string | null) =>
  list.find((x) => x.id === id);

describe('travel to a fight node', () => {
  const mod: FightModifier = { mod: 'startNoise', tokens: 5 };
  const before = { ...onMap(), nextFight: [mod] };
  const target = node(before, firstNode(before));
  const after = step(before, { t: 'travel', node: target.id });

  it('builds the CombatInput from run state and content and enters combatReview', () => {
    const input = after.combat?.input;
    const enc = def(content.encounters, target.encounter);
    const harness = def(content.harnesses, 'terminal_purist');
    expect(after.mode).toBe('combatReview');
    expect(after.combat?.nodeId).toBe(target.id);
    expect(input?.seed).toBe(forkSeed('K7Q2-M9XA', `combat/${target.id}`));
    expect(input?.agent.tools.map((t) => [t.def.id, t.version])).toEqual(
      harness?.tools.map((id) => [id, 1]),
    );
    expect(input?.agent.model).toBe(harness?.model);
    expect(input?.skills.map((s) => s.id)).toEqual(harness?.skills);
    expect(input?.prompt.id).toBe('senior');
    expect(input?.lessons.map((l) => l.id)).toEqual(['bugs_off']);
    expect(input?.policy).toBe(before.agent.policy);
    expect(input?.encounter.enemies.map((e) => e.id)).toEqual(enc?.enemies);
    expect(input?.encounter).toMatchObject({ deadlineMs: enc?.deadlineMs, phase: 1, loop: 0 });
    expect(input?.modifiers).toEqual([mod]);
  });

  it('stores the summary without the event log', () => {
    const input = after.combat?.input;
    if (!input) throw new Error('no combat');
    const { outcome, reason, endT, stats } = resolveCombat(input, { log: true });
    expect(after.combat?.outcome).toEqual({ outcome, reason, endT, stats });
    expect(JSON.parse(JSON.stringify(after))).toStrictEqual(after);
  });

  it('lists spawnable enemies (spawn verbs, split children) as spawnDefs', () => {
    const splits = (id: string) => splitChildren(def(content.enemies, id)).length > 0;
    const enc = content.encounters.find((e) => e.enemies.some(splits));
    if (!enc) throw new Error('no encounter with a splitting enemy');
    const input = combatInput(before, { ...target, encounter: enc.id });
    const children = input.encounter.enemies.flatMap(splitChildren);
    expect(input.encounter.spawnDefs?.map((d) => d.id)).toEqual(expect.arrayContaining(children));
  });

  it('fails with notReachable for a node not adjacent to the current one', () => {
    const far = before.map.nodes.find((n) => n.row === 2) as MapNode;
    expect(apply(before, { t: 'travel', node: far.id })).toEqual({
      ok: false,
      error: 'notReachable',
    });
    expect(apply(after, { t: 'travel', node: firstNode(after) }).ok).toBe(false);
  });
});

describe('fight outcome', () => {
  it('carries Trust and once-per-run flags over from the CombatResult', () => {
    const base = onMap();
    const before = { ...base, agent: { ...base.agent, oncePerRun: ['flag-a'] } };
    const after = step(before, { t: 'travel', node: firstNode(before) });
    const input = after.combat?.input;
    if (!input) throw new Error('no combat');
    expect(input.agent.usedOncePerRun).toEqual(['flag-a']);
    const result = resolveCombat(input, { log: false });
    expect(after.agent.trust).toBe(result.agentAfter.trust);
    expect(after.agent.maxTrust).toBe(result.agentAfter.maxTrust);
    expect(after.agent.oncePerRun).toEqual(result.agentAfter.usedOncePerRun);
    expect(after.agent.trust).toBeLessThan(before.agent.trust);
  });

  it('Trust 0 clamps Trust and continue ends the run as ctrlc', () => {
    const base = onMap();
    const before = { ...base, agent: { ...base.agent, trust: 1 } };
    const after = step(before, { t: 'travel', node: firstNode(before) });
    expect(after.combat?.outcome).toMatchObject({ outcome: 'loss', reason: 'trust' });
    expect(after.agent.trust).toBe(0);
    const end = step(after, { t: 'continue' });
    expect(end).toMatchObject({
      mode: 'runEnd',
      pending: { kind: 'lessonOffer' },
      result: { outcome: 'ctrlc' },
    });
    expect(end.stats.cause).toBe(enemyOf(after, end.stats.cause));
    expect(legalActions(end)).toContainEqual({ t: 'skipLesson' });
    expect(legalActions(step(end, { t: 'skipLesson' }))).toEqual([]);
  });
});

/** `id` when it is an enemy of the last fight's encounter or spawns, else undefined. */
const enemyOf = (s: RunState, id: string | null) => {
  const enc = s.combat?.input.encounter;
  return [...(enc?.enemies ?? []), ...(enc?.spawnDefs ?? [])].find((e) => e.id === id)?.id;
};

describe('run end', () => {
  const won = step(onMap(), { t: 'travel', node: firstNode(onMap()) });

  it('winning the Phase-1 boss (p1-boss) ships the run in M1', () => {
    const combat = won.combat ? { ...won.combat, nodeId: 'p1-boss' } : null;
    expect(node(won, 'p1-boss').type).toBe('release');
    const end = step({ ...won, combat }, { t: 'continue' });
    expect(end).toMatchObject({
      mode: 'runEnd',
      pending: { kind: 'lessonOffer' },
      result: { outcome: 'shipped' },
    });
    expect(end.agent.credits).toBe(won.agent.credits);
    expect(legalActions(end)).toContainEqual({ t: 'skipLesson' });
    expect(legalActions(step(end, { t: 'skipLesson' }))).toEqual([]);
  });

  it('a real p1-boss win ships the run (fixed seeds, no abandon)', () => {
    const play = (seed: string) => {
      let s = onMap(seed);
      for (let n = 0; s.mode !== 'runEnd'; n++) {
        const legal = legalActions(s).filter((a) => a.t !== 'abandon');
        s = step(s, legal[(n * 13) % legal.length] as Action);
      }
      return s;
    };
    // Deterministic seed search: s0..s199 until one ships and one loses (win rate is E010 balance).
    const ends: RunState[] = [];
    const seen = (o: string) => ends.some((s) => s.result?.outcome === o);
    for (let i = 0; i < 200 && !(seen('shipped') && seen('ctrlc')); i++) {
      ends.push(play(`s${i}`));
    }
    const shipped = ends.find((s) => s.result?.outcome === 'shipped');
    expect(shipped?.combat?.nodeId).toBe('p1-boss');
    expect(shipped?.stats.nodesCleared).toBeGreaterThan(1);
    const lost = ends.find((s) => s.result?.outcome === 'ctrlc');
    expect(lost?.combat?.outcome.outcome).toBe('loss');
  });

  it('a won non-boss fight leaves result null', () => {
    expect(step(won, { t: 'continue' }).result).toBeNull();
  });

  it('abandon from the map ends the run as a loss without a lesson choice', () => {
    const s = onMap();
    expect(legalActions(s)).toContainEqual({ t: 'abandon' });
    const end = step(s, { t: 'abandon' });
    expect(end).toMatchObject({ mode: 'runEnd', pending: null, result: { outcome: 'abandoned' } });
    expect(legalActions(end)).toEqual([]);
    expect(apply(end, { t: 'abandon' })).toEqual({ ok: false, error: 'wrongMode' });
    expect(apply(won, { t: 'abandon' })).toEqual({ ok: false, error: 'wrongMode' });
  });
});

type Body = CombatEvent extends infer E
  ? E extends CombatEvent
    ? Omit<E, 'seq' | 't'>
    : never
  : never;
const ev = (seq: number, t: number, body: Body) => ({ seq, t, ...body }) as CombatEvent;
const dmg = (seq: number, t: number, [src, dst]: [Ref, Ref], v: number) =>
  ev(seq, t, { kind: 'damage', src, dst, v, d: { ...HIT, why: [] } });
const HIT = { base: 1, flat: 0, pct: 0, armor: 0, guard: 0, sev: 0, zone: 1 };

describe('run stats', () => {
  const start = { W: 100, B: 10, S: 10, N: 0, zone: 0, trust: 40, maxTrust: 40 };
  const log: CombatEvent[] = [
    ev(0, 0, { kind: 'fightStart', src: 'sys', v: 45_000, d: start }),
    ev(1, 0, { kind: 'spawn', src: 'sys', dst: 'e1', v: 10, d: SPAWN }),
    ev(2, 500, { kind: 'zoneChanged', src: 'ctx', v: 1, d: { from: 0, to: 1, F: 30, W: 100 } }),
    dmg(3, 600, ['e1', 'a'], 4),
    dmg(4, 700, ['t0', 'e1'], 9),
    dmg(5, 800, ['e1', 'a'], 0),
    ev(6, 900, { kind: 'compaction', src: 'ctx', v: 0, d: { kind: 'auto', S: 20 } }),
    ev(7, 1000, { kind: 'zoneChanged', src: 'ctx', v: 2, d: { from: 1, to: 2, F: 80, W: 100 } }),
    dmg(8, 1500, ['sys', 'a'], 2),
    ev(9, 2000, { kind: 'fightEnd', src: 'sys', v: 2000, d: END }),
  ];

  it('folds cause, damage by source, time per zone and compactions from a log', () => {
    expect(fightStats(log)).toEqual({
      lastFight: { zoneMs: [500, 500, 1000, 0], compactions: 1 },
      damage: { bug: 4, [DEADLINE]: 2 },
      cause: DEADLINE,
    });
  });

  it('adds fights up: damage and compactions sum, zone time per fight and per run', () => {
    const one = addFight(emptyStats(), log, true);
    const two = addFight(one, log.slice(0, 4).concat(log.slice(9)), false);
    expect(two).toMatchObject({ nodesCleared: 1, cause: 'bug', compactions: 1 });
    expect(two.damageBySource).toEqual({ bug: 8, [DEADLINE]: 2 });
    expect(two.lastFight).toEqual({ zoneMs: [500, 1500, 0, 0], compactions: 0 });
    expect(two.zoneMs).toEqual([1000, 2000, 1000, 0]);
  });

  it('a real fight records damage taken, zone time to endT and the cleared node', () => {
    const s = onMap();
    const after = step(s, { t: 'travel', node: firstNode(s) });
    const { endT, stats } = after.combat?.outcome ?? { endT: 0, stats: { damageTaken: 0 } };
    const taken = Object.values(after.stats.damageBySource).reduce((a, b) => a + b, 0);
    expect(taken).toBe(stats.damageTaken);
    expect(after.stats.lastFight.zoneMs.reduce((a, b) => a + b, 0)).toBe(endT);
    expect(after.stats.nodesCleared).toBe(1);
    expect(enemyOf(after, after.stats.cause)).toBe(after.stats.cause);
  });
});

const SPAWN = { def: 'bug', index: 0, reason: 'start' } as const;
const END = { outcome: 'win', reason: 'resolved', trust: 34 } as const;

describe('combat seed', () => {
  it('depends only on run seed and node id (fork independence)', () => {
    const a = onMap('S1', 'terminal_purist', 'senior');
    const b = { ...onMap('S1', 'ide_companion', 'concise'), nextFight: [] };
    const credits = { ...a, agent: { ...a.agent, credits: 99, trust: 3 } };
    for (const n of a.map.nodes.filter((m) => m.encounter !== null)) {
      const seed = forkSeed('S1', `combat/${n.id}`);
      expect([combatInput(a, n).seed, combatInput(b, n).seed]).toEqual([seed, seed]);
      expect(combatInput(credits, n).seed).toBe(seed);
    }
    const ids = a.map.nodes.filter((m) => m.encounter !== null).map((m) => combatInput(a, m).seed);
    expect(new Set(ids).size).toBe(ids.length);
    const n = node(a, firstNode(a));
    expect(combatInput(onMap('S2'), n).seed).not.toBe(combatInput(a, n).seed);
  });
});

describe('continue', () => {
  it('moves from combatReview to rewards after a win, then back to the map', () => {
    const s = onMap();
    const after = step(s, { t: 'travel', node: firstNode(s) });
    expect(after.combat?.outcome.outcome).toBe('win');
    expect(legalActions(after)).toEqual([{ t: 'continue' }]);
    const reward = step(after, { t: 'continue' });
    expect(reward.mode).toBe('reward');
    const next = step(reward, { t: 'skipReward' });
    expect(next.mode).toBe('map');
    expect(legalActions(next).length).toBeGreaterThan(0);
  });

  it('is rejected outside combatReview', () => {
    expect(apply(onMap(), { t: 'continue' })).toEqual({ ok: false, error: 'wrongMode' });
  });
});
