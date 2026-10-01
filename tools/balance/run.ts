// Run driver: plays one full run headless through the run reducer with a bot.
import type { HarnessId } from '../../src/content/types/ids.ts';
import type { Action } from '../../src/run/actions.ts';
import { apply, legalActions } from '../../src/run/apply.ts';
import { newRun } from '../../src/run/new-run.ts';
import type { MetaView, RunState } from '../../src/run/state.ts';
import type { Bot } from './bots/bot.ts';
import { greedyBot } from './bots/greedy.ts';
import { randomBot } from './bots/random.ts';

export const BOTS = { random: randomBot, greedy: greedyBot } as const satisfies Record<string, Bot>;
export type BotName = keyof typeof BOTS;

/** Guard against a bot that never ends a run (property 6 in testing.md). */
export const MAX_ACTIONS = 2000;

/** A fresh-profile meta: nothing unlocked, no lessons, no lint. */
export const FRESH_META: MetaView = { unlocked: [], lessons: [], lintCap: 0 };

export interface RunSpec {
  seed: string;
  harness: HarnessId;
  meta?: MetaView;
}

export interface PlayedRun {
  /** The state in mode runEnd, before any lesson pick. */
  state: RunState;
  /** Accepted actions in order; `replay(state.setup, actions)` rebuilds `state`. */
  actions: Action[];
}

/** Plays `spec` with `bot` until runEnd. Throws on an illegal action, a dead end or a loop. */
export function playRun(spec: RunSpec, bot: Bot): PlayedRun {
  const setup = { seed: spec.seed, harness: spec.harness, lint: [], tutorial: false };
  let state = newRun(setup, spec.meta ?? FRESH_META);
  const actions: Action[] = [];
  while (state.mode !== 'runEnd') {
    if (actions.length >= MAX_ACTIONS)
      throw new Error(`${spec.seed}: no runEnd after ${MAX_ACTIONS} actions`);
    const legal = legalActions(state);
    if (legal.length === 0) throw new Error(`${spec.seed}: no legal action in mode ${state.mode}`);
    const action = bot(state, legal);
    const r = apply(state, action);
    if (!r.ok) throw new Error(`${spec.seed}: ${JSON.stringify(action)} rejected (${r.error})`);
    state = r.state;
    actions.push(action);
  }
  return { state, actions };
}

/** Whether the run fought the Phase-1 boss (the `release` node). */
export const reachedBoss = (state: RunState): boolean =>
  state.map.visited.some((id) => state.map.nodes.find((n) => n.id === id)?.type === 'release');
