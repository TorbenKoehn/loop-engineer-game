import { describe, expect, it } from 'vitest';
import { content } from '../../content/index.ts';
import type { Family } from '../../content/types/basics.ts';
import type { EnemyDef } from '../../content/types/enemy.ts';
import type { FightModifier } from '../../content/types/event.ts';
import type { EncounterId } from '../../content/types/ids.ts';
import { createSim } from '../../sim/combat/state.ts';
import type { CombatEvent, Ref } from '../../sim/events.ts';
import { type CombatInput, resolveCombat } from '../../sim/index.ts';
import { forkSeed } from '../../sim/rng.ts';
import { hitIntent, intent, makeEnemy } from '../../sim/testing/builders.ts';
import type { Action } from '../actions.ts';
import { apply, legalActions } from '../apply.ts';
import { selectBreakpoints } from '../build/selectors.ts';
import { reachable } from '../map/graph.ts';
import { newRun } from '../new-run.ts';
import type { MapNode, MetaView, RunState } from '../state.ts';
import { addFight, DEADLINE, emptyStats, fightStats } from '../stats.ts';
import { combatInput } from './combat.ts';

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

describe('breakpoints', () => {
  it('the build-panel selector counts the equipped tools as the fight does', () => {
    const state = onMap(); // terminal_purist: grep, cat (Search, Shell), sed (Edit, Shell)
    const chips = selectBreakpoints(state).map((b) => [b.def.tag, b.count, b.def.need]);
    expect(chips).toEqual([
      ['Shell', 3, 3],
      ['Edit', 1, 3],
      ['Search', 2, 3],
      ['Test', 0, 2],
    ]);
    const input = combatInput(state, node(state, firstNode(state)));
    expect(createSim(input, false).mods.filter((m) => m.id.startsWith('bp:'))).toMatchObject([
      { id: 'bp:posix', stat: 'pipeMs', v: 500 },
    ]);
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

// T034: harness traits, system prompts and AGENTS.md lessons from real content, wired by the run.
describe('traits, prompts and lessons in combat', () => {
  const FOE = makeEnemy({ id: 'foe', sev: 5000, cycle: [hitIntent(1, 60_000)] });
  /** The first fight's input for this loadout, against `enemies` (a passive dummy by default). */
  function loadout(harness: string, prompt: string, lessons: string[] = [], enemies = [FOE]) {
    const s = onMap('K7Q2-M9XA', harness, prompt);
    const run = { ...s, setup: { ...s.setup, lessons } };
    const input = combatInput(run, node(run, firstNode(run)));
    return { ...input, encounter: { ...input.encounter, enemies, spawnDefs: [] } };
  }
  const noTools = (input: CombatInput): CombatInput => ({
    ...input,
    agent: { ...input.agent, tools: [] },
  });
  const log = (input: CombatInput) => resolveCombat(input).events;
  const of = (events: readonly CombatEvent[], kind: CombatEvent['kind'], src?: string) =>
    events.filter((e) => e.kind === kind && (!src || e.src === src));
  /** d.pct and why of the first damage by `src`. */
  const firstHit = (input: CombatInput, src = 't0') => {
    const hit = of(log(input), 'damage', src)[0];
    return hit?.kind === 'damage' ? { v: hit.v, pct: hit.d.pct, why: hit.d.why } : undefined;
  };
  const rates = (input: CombatInput) => createSim(input, false).agent.tools.map((t) => t.rate);

  it('Muscle Memory: grep (weight 3) charges at rate +10, sed (weight 4) does not', () => {
    const input = loadout('terminal_purist', 'senior');
    expect(input.trait?.id).toBe('muscle_memory');
    expect(input.agent.tools.map((t) => t.def.id)).toEqual(['grep', 'cat', 'sed']);
    expect(rates(input)).toEqual([120, 120, 110]); // speed 110
    expect(rates(loadout('ide_companion', 'senior'))).toEqual([100, 100, 100]);
  });

  it('Undo Stack: once per fight, 15 Guardrails when a hit leaves Trust below 30% of max', () => {
    const hitter = makeEnemy({ id: 'hitter', sev: 5000, cycle: [hitIntent(14, 1000)] });
    const base = noTools(loadout('ide_companion', 'concise', [], [hitter]));
    const input = { ...base, agent: { ...base.agent, trust: 100, maxTrust: 100 } };
    expect(input.trait?.id).toBe('undo_stack');
    const events = log(input);
    const guards = of(events, 'guard', 'a');
    expect(guards.map((g) => g.v)).toEqual([15]);
    const hits = of(events, 'damage', 'e1');
    const trigger = hits.find((h) => h.t === guards[0]?.t);
    expect(trigger?.kind === 'damage' && trigger.d.sev).toBe(16); // 100 - 6 x 14; 30 did not
    expect(hits.length).toBeGreaterThan(7); // the fight went on without a second grant
  });

  it('senior: tool damage +10% and window -10', () => {
    const senior = loadout('terminal_purist', 'senior');
    const concise = loadout('terminal_purist', 'concise');
    expect(createSim(senior, false).agent.ctx.W).toBe(50);
    expect(firstHit(senior)).toMatchObject({ pct: 30, why: ['zone:focused', 'prompt:senior'] });
    expect(firstHit(concise)).toMatchObject({ pct: 20, why: ['zone:focused'] });
  });

  it('concise: every tool output -1, min 0', () => {
    const events = log(loadout('terminal_purist', 'concise'));
    const outputs = (src: string) => of(events, 'tokens', src).map((e) => e.v);
    expect(of(events, 'toolFired', 't0').length).toBeGreaterThan(0);
    expect(outputs('t0')).toEqual([]); // grep 1 -> 0
    expect(new Set([...outputs('t1'), ...outputs('t2')])).toEqual(new Set([1])); // cat, sed 2
  });

  it('step_by_step: rate -5; the first activation resolves twice with its output', () => {
    const input = loadout('terminal_purist', 'step_by_step');
    expect(rates(input)).toEqual([115, 115, 105]);
    const events = log(input);
    const [first, ...rest] = of(events, 'toolFired');
    expect(first).toMatchObject({ src: 't1', d: { def: 'cat', echo: 1 } }); // cat charges first
    const at = (kind: CombatEvent['kind']) =>
      of(events, kind, first?.src).filter((e) => e.t === first?.t);
    expect(at('damage').map((e) => e.v)).toEqual([5, 5]); // cat 4, Focused +20%
    expect(at('tokens').map((e) => e.v)).toEqual([2, 2]);
    expect(rest.every((e) => e.kind === 'toolFired' && e.d.echo === undefined)).toBe(true);
  });

  const FAMILIES = ['Bugs', 'Context', 'Infra', 'Process', 'Sandbox'] as const;
  const foe = (family: Family, cycle = [hitIntent(10, 1000)]) =>
    makeEnemy({ id: 'foe', family, sev: 5000, cycle });

  it.each(FAMILIES)('%s offense lesson: +15% tool damage vs that family only', (family) => {
    const id = `${family.toLowerCase()}_off`;
    const other = family === 'Bugs' ? 'Infra' : 'Bugs';
    const pct = (lessons: string[], f: Family) =>
      firstHit(loadout('terminal_purist', 'concise', lessons, [foe(f)]))?.pct;
    expect(pct([id], family)).toBe((pct([], family) ?? 0) + 15);
    expect(pct([id], other)).toBe(pct([], other));
  });

  it.each(['bugs', 'process', 'sandbox'])('%s_def: -20% damage taken from it, min 1', (key) => {
    const family = FAMILIES.find((f) => f.toLowerCase() === key) as Family;
    const taken = (lessons: string[], f: Family, n: number) => {
      const input = loadout('ide_companion', 'concise', lessons, [foe(f, [hitIntent(n, 1000)])]);
      return of(log(noTools(input)), 'damage', 'e1')[0]?.v;
    };
    expect(taken([`${key}_def`], family, 10)).toBe(8);
    expect(taken([`${key}_def`], family, 1)).toBe(1);
    expect(taken([`${key}_def`], 'Infra', 10)).toBe(10);
  });

  it('context_def: noise from Context enemies -25% (floor), other families unchanged', () => {
    const noisy = [intent('spam', 1000, { verb: 'noise', n: 7 })];
    const noise = (f: Family) => {
      const input = loadout('ide_companion', 'concise', ['context_def'], [foe(f, noisy)]);
      return of(log(input), 'tokens', 'e1')[0]?.v;
    };
    expect(noise('Context')).toBe(5);
    expect(noise('Bugs')).toBe(7);
  });

  it('infra_def: enemy Throttles on you last 1000 ms less (min 50)', () => {
    const applied = (ms: number) => {
      const rl = [intent('rl', 1000, { verb: 'throttle', sel: 'leftmost', ms })];
      const input = loadout('ide_companion', 'concise', ['infra_def'], [foe('Infra', rl)]);
      return of(log(input), 'statusOn', 'e1')[0]?.v;
    };
    expect(applied(3000)).toBe(2000);
    expect(applied(800)).toBe(50);
  });

  it('Deadline damage is unaffected by Process lessons', () => {
    const deadline = (lessons: string[]) => {
      const idle = foe('Process', [hitIntent(1, 60_000)]);
      const input = noTools(loadout('ide_companion', 'concise', lessons, [idle]));
      const events = log({ ...input, encounter: { ...input.encounter, deadlineMs: 1000 } });
      return of(events, 'damage', 'sys').map((e) => [e.dst, e.v]);
    };
    const plain = deadline([]);
    expect(plain.slice(0, 4)).toEqual([
      ['e1', 1],
      ['a', 1],
      ['e1', 2],
      ['a', 2],
    ]);
    expect(deadline(['process_off', 'process_def'])).toEqual(plain);
  });
});

// T036: enemy traits Split, Grow, Outage and Blocked on their real enemies, wired by the run.
describe('enemy traits over real content', () => {
  const base = onMap();
  /** The first fight's input against encounter `id`, with Trust to spare. */
  function at(id: EncounterId, tools?: string[]): CombatInput {
    const input = combatInput(base, { ...node(base, firstNode(base)), encounter: id });
    const pick = (t: string) => content.tools.filter((d) => d.id === t);
    const own = tools?.flatMap(pick).map((d) => ({ def: d, version: 1 as const }));
    const agent = { ...input.agent, trust: 500, maxTrust: 500, tools: own ?? input.agent.tools };
    return { ...input, agent };
  }
  type Of<K> = Extract<CombatEvent, { kind: K }>;
  const of = <K extends CombatEvent['kind']>(events: readonly CombatEvent[], kind: K) =>
    events.filter((e): e is Of<K> => e.kind === kind);

  it('Split(2, 50): Dependency Hell resolves into 2 Transitive Deps at its index', () => {
    const { events } = resolveCombat(at('p1h1'));
    const dead = of(events, 'resolved').find((e) => e.src === 'e2');
    const front = of(events, 'resolved').some((e) => e.src === 'e1' && e.seq < (dead?.seq ?? 0));
    const ix = front ? 0 : 1; // Context Drift stands in front of it unless already resolved
    const splits = of(events, 'spawn').filter((e) => e.d.reason === 'split');
    expect(splits.map((e) => [e.t, e.src, e.dst, e.v, e.d.def, e.d.index])).toEqual([
      [dead?.t, 'e2', 'e3', 60, 'transitive_dep', ix],
      [dead?.t, 'e2', 'e4', 60, 'transitive_dep', ix + 1],
    ]);
    expect(of(events, 'resolved').map((e) => e.src)).toEqual(expect.arrayContaining(['e3', 'e4']));
  });

  it('Grow(4000, 6, 1): Scope Creep gains +6 Severity and +1 attack every 4000 ms', () => {
    const { events } = resolveCombat(at('p1e4', ['cat']));
    const grown = of(events, 'trait').filter((e) => e.t <= 8000);
    expect(grown.map((e) => [e.t, e.src, e.v, e.d.what])).toEqual([
      [4000, 'e3', 6, 'sev'],
      [4000, 'e3', 1, 'dmg'],
      [8000, 'e3', 6, 'sev'],
      [8000, 'e3', 1, 'dmg'],
    ]);
    const hits = of(events, 'damage').filter((e) => e.src === 'e3' && e.t <= 9000);
    expect(hits.map((e) => [e.t, e.d.base])).toEqual([
      [3000, 2],
      [6000, 3],
      [9000, 4],
    ]);
  });

  it('Outage(Web): web_search fires and adds output but does nothing; Cache exempts it', () => {
    const input = at('p1e5', ['web_search']);
    const { events } = resolveCombat(input);
    const fired = of(events, 'toolFired').map((e) => e.t);
    const outage = of(events, 'trait').filter((e) => e.src === 'e2' && e.dst === 't0');
    expect(outage.map((e) => [e.t, e.d.trait, e.d.what])).toEqual(
      fired.map((t) => [t, 'outage', 'timedOut']),
    );
    expect(of(events, 'tokens').filter((e) => e.src === 't0')[0]).toMatchObject({ t: fired[0] });
    expect(of(events, 'damage').filter((e) => e.src === 't0')).toEqual([]);
    const cache = def(content.memories, 'cache');
    const cached = resolveCombat({ ...input, memories: cache ? [cache] : [] }).events;
    expect(of(cached, 'damage').find((e) => e.src === 't0')?.t).toBe(fired[0]);
  });

  it('Blocked: Yak Shave takes 0 while its tasks live; Deadline still hits it', () => {
    const { events } = resolveCombat(at('p1x1'));
    const sed = of(events, 'damage').filter((e) => e.src === 't2');
    const first = sed.filter((e) => e.t === sed[0]?.t);
    expect(first.map((e) => [e.dst, (e.v ?? 0) > 0])).toEqual([
      ['e1', true],
      ['e2', true],
      ['e3', true],
      ['e4', false],
    ]);
    const idle = { ...at('p1x1', []), encounter: { ...at('p1x1').encounter, deadlineMs: 1000 } };
    const deadline = of(resolveCombat(idle).events, 'damage').filter((e) => e.src === 'sys');
    expect(deadline.slice(0, 4).map((e) => [e.t, e.dst, e.v])).toEqual([
      [2000, 'e1', 1],
      [2000, 'e2', 1],
      [2000, 'e3', 1],
      [2000, 'e4', 1],
    ]);
  });
});
