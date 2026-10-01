import { describe, expect, it } from 'vitest';
import { content } from '../content/index.ts';
import type { EnemyDef } from '../content/types/enemy.ts';
import type { FightModifier } from '../content/types/event.ts';
import { resolveCombat } from '../sim/index.ts';
import { forkSeed } from '../sim/rng.ts';
import type { Action } from './actions.ts';
import { apply, legalActions } from './apply.ts';
import { combatInput } from './combat.ts';
import { reachable } from './map/graph.ts';
import { newRun } from './new-run.ts';
import type { MapNode, MetaView, RunState } from './state.ts';

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

  it('resolves without a log and stores the summary', () => {
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

  it('a loss clamps Trust at 0 and continue ends the run', () => {
    const base = onMap();
    const before = { ...base, agent: { ...base.agent, trust: 1 } };
    const after = step(before, { t: 'travel', node: firstNode(before) });
    expect(after.combat?.outcome.outcome).toBe('loss');
    expect(after.agent.trust).toBe(0);
    expect(step(after, { t: 'continue' }).mode).toBe('runEnd');
  });
});

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
