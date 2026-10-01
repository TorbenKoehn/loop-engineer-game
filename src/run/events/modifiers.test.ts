import { describe, expect, it } from 'vitest';
import { content } from '../../content/index.ts';
import type { FightModifier } from '../../content/types/event.ts';
import type { Action } from '../actions.ts';
import { apply } from '../apply.ts';
import { combatInput, fight } from '../combat/combat.ts';
import { reachable } from '../map/graph.ts';
import { newRun } from '../new-run.ts';
import type { MapNode, RunState } from '../state.ts';
import { addedEnemies, afterFight, simModifiers } from './modifiers.ts';

const META = { unlocked: [], lessons: [], lintCap: 0 };

function step(state: RunState, action: Action): RunState {
  const r = apply(state, action);
  if (!r.ok) throw new Error(`rejected ${JSON.stringify(action)}: ${r.error}`);
  return r.state;
}

const onMap = (): RunState =>
  step(newRun({ seed: 'K7Q2-M9XA', harness: 'terminal_purist', lint: [], tutorial: false }, META), {
    t: 'pickPrompt',
    prompt: 'senior',
  });

const ADD: FightModifier = { mod: 'addEnemy', enemy: 'scope_creep', count: 1, fights: 2 };
const NOISE: FightModifier = { mod: 'startNoise', tokens: 20 };
const SIGNAL: FightModifier = { mod: 'startSignal', tokens: 12 };

const base = onMap();
const node = base.map.nodes.find((n) => reachable(base.map).includes(n.id)) as MapNode;
const line = content.encounters.find((e) => e.id === node.encounter)?.enemies ?? [];
const enemyIds = (s: RunState) => combatInput(s, node).encounter.enemies.map((e) => e.id);

describe('next-fight modifiers', () => {
  it('pure helpers split addEnemy from the sim modifiers and count its fights down', () => {
    const two = { ...ADD, count: 2 };
    expect(addedEnemies([two, NOISE])).toEqual(['scope_creep', 'scope_creep']);
    expect(simModifiers([ADD, NOISE, SIGNAL])).toEqual([NOISE, SIGNAL]);
    expect(afterFight([ADD, NOISE, SIGNAL])).toEqual([{ ...ADD, fights: 1 }]);
    expect(afterFight([{ ...ADD, fights: 1 }])).toEqual([]);
  });

  it('addEnemy appends at the back for its remaining fights, then expires', () => {
    const first = { ...base, nextFight: [ADD] };
    expect(enemyIds(first)).toEqual([...line, 'scope_creep']);
    const second = { ...fight(first, node), mode: 'map' as const };
    expect(second.nextFight).toEqual([{ ...ADD, fights: 1 }]);
    expect(enemyIds(second)).toEqual([...line, 'scope_creep']);
    const third = fight(second, node);
    expect(third.nextFight).toEqual([]);
    expect(enemyIds(third)).toEqual(line);
  });

  it('startNoise and startSignal reach the next CombatInput and are spent by it', () => {
    const s = step({ ...base, nextFight: [ADD, NOISE, SIGNAL] }, { t: 'travel', node: node.id });
    expect(s.combat?.input.modifiers).toEqual([NOISE, SIGNAL]);
    expect(s.combat?.input.encounter.enemies.at(-1)?.id).toBe('scope_creep');
    expect(s.nextFight).toEqual([{ ...ADD, fights: 1 }]);
  });

  it('an event choice reaches the next fight through the reducer', () => {
    const others = content.events.map((e) => e.id).filter((id) => id !== 'pasted_log');
    const id = reachable(base.map)[1] as string;
    const nodes = base.map.nodes.map((n) =>
      n.id === id ? { ...n, type: 'standup' as const, encounter: null } : n,
    );
    const standup = step(
      { ...base, seenEvents: others, map: { ...base.map, nodes } },
      { t: 'travel', node: id },
    );
    const chosen = step(standup, { t: 'chooseEvent', ix: 0 });
    const next = chosen.map.nodes.find((n) => reachable(chosen.map).includes(n.id) && n.encounter);
    if (!next) throw new Error('no fight reachable');
    const fought = step(chosen, { t: 'travel', node: next.id });
    expect(fought.combat?.input.modifiers).toEqual([NOISE]);
    expect(fought.nextFight).toEqual([]);
  });
});
