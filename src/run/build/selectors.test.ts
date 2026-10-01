import { describe, expect, it } from 'vitest';
import type { FightModifier } from '../../content/types/event.ts';
import { ZONES } from '../../sim/combat/context/ctx.ts';
import { breakpoints, resolveCombat } from '../../sim/index.ts';
import type { Action } from '../actions.ts';
import { apply } from '../apply.ts';
import { combatInput } from '../combat.ts';
import { reachable } from '../map/graph.ts';
import { newRun } from '../new-run.ts';
import type { AgentState, MetaView, RunState } from '../state.ts';
import {
  overLimit,
  selectBaseline,
  selectBreakpoints,
  selectPipes,
  selectStartZone,
  selectWindow,
} from './selectors.ts';

const META: MetaView = { unlocked: [], lessons: ['bugs_off'], lintCap: 0 };

function step(state: RunState, action: Action): RunState {
  const r = apply(state, action);
  if (!r.ok) throw new Error(`rejected ${JSON.stringify(action)}: ${r.error}`);
  return r.state;
}

function onMap(harness: string, prompt: string, seed = 'K7Q2-M9XA'): RunState {
  return step(newRun({ seed, harness, lint: [], tutorial: false }, META), {
    t: 'pickPrompt',
    prompt,
  });
}

const withAgent = (s: RunState, agent: Partial<AgentState>): RunState => ({
  ...s,
  agent: { ...s.agent, ...agent },
});

/** The fightStart event and input of the fight on the first reachable node. */
function fightStart(state: RunState) {
  const node = state.map.nodes.find((n) => n.id === reachable(state.map)[0]);
  if (!node?.encounter) throw new Error('first node is no fight');
  const input = combatInput(state, node);
  const ev = resolveCombat(input).events.find((e) => e.kind === 'fightStart');
  if (ev?.kind !== 'fightStart') throw new Error('no fightStart');
  return { d: ev.d, input };
}

describe('loadout selectors', () => {
  const noise: FightModifier = { mod: 'startNoise', tokens: 30 };
  const signal: FightModifier = { mod: 'startSignal', tokens: 12 };
  const cases: [string, RunState][] = [];
  for (const harness of ['terminal_purist', 'ide_companion']) {
    for (const prompt of ['senior', 'concise', 'step_by_step']) {
      const s = onMap(harness, prompt);
      cases.push([`${harness}/${prompt}`, s]);
      cases.push([`${harness}/${prompt} +noise`, { ...s, nextFight: [noise] }]);
      cases.push([`${harness}/${prompt} +signal`, { ...s, nextFight: [signal, noise] }]);
      const mem = withAgent(s, { memories: ['long_context', 'cache'] });
      cases.push([`${harness}/${prompt} +long_context`, mem]);
    }
  }

  it.each(cases)('equal the fightStart event of the resolved fight (%s)', (_, state) => {
    const { d, input } = fightStart(state);
    expect(selectBaseline(state)).toBe(d.B);
    expect(selectWindow(state)).toBe(d.W);
    expect(selectStartZone(state)).toBe(ZONES[d.zone]);
    expect(selectBreakpoints(state)).toEqual(breakpoints(input.agent.tools.map((t) => t.def)));
  });

  it('the cases cover window mods and every start zone', () => {
    const zones = new Set(cases.map(([, s]) => selectStartZone(s)));
    expect([...zones].sort()).toEqual(['cold', 'focused', 'overflow', 'rot']);
    const purist = onMap('terminal_purist', 'senior');
    expect(selectWindow(purist)).toBe(50); // 60 - 10 (senior)
    expect(selectWindow(withAgent(purist, { memories: ['long_context'] }))).toBe(90);
  });

  it('pipes: each tool into its right neighbour, POSIX adds 500 ms, the last never pipes', () => {
    const purist = onMap('terminal_purist', 'concise'); // grep, cat, sed: 3 Shell = POSIX
    expect(selectPipes(purist)).toEqual([1500, 1500, 0]);
    const two = withAgent(purist, { tools: purist.agent.tools.slice(0, 2) });
    expect(selectPipes(two)).toEqual([1000, 0]);
    const ide = onMap('ide_companion', 'concise');
    expect(selectPipes(ide)).toEqual([0, 0, 0]);
  });

  it('overLimit compares B x 100 with W x 80', () => {
    const purist = onMap('terminal_purist', 'senior'); // W 50: limit B 40
    // 4 base + 8 senior + 3 + 2 + 4 tools + 3 skill + 1 lesson
    expect(selectBaseline(purist)).toBe(25);
    const tools = ['run_tests', 'brute_force', 'read_file'].map((id) => ({
      id,
      version: 1 as const,
      weightMod: 0,
    }));
    const full = withAgent(purist, { tools: [...purist.agent.tools, ...tools] });
    expect(selectBaseline(full)).toBe(40);
    expect(overLimit(full)).toBe(false);
    expect(overLimit(full, { ...full.agent, skills: [...full.agent.skills, 'lockfile'] })).toBe(
      true,
    );
  });
});
