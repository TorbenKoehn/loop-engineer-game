// Idle Cycle: heal 30% of max Trust (rounded up) or +1 version on one tool below v3.
// See docs/game/systems/run-map.md#node-types.
import { type Action, type ApplyResult, fail, ok } from '../actions.ts';
import type { OwnedTool, RunState } from '../state.ts';

const HEAL_PCT = 30;
const MAX_VERSION = 3;

const back = (state: RunState): RunState => ({ ...state, mode: 'map', pending: null });

export function restHeal(state: RunState): ApplyResult {
  if (state.mode !== 'rest') return fail('wrongMode');
  const { trust, maxTrust } = state.agent;
  const healed = Math.min(maxTrust, trust + Math.ceil((maxTrust * HEAL_PCT) / 100));
  return ok(back({ ...state, agent: { ...state.agent, trust: healed } }));
}

/** `slot` is the index into the equipped tools. */
export function restUpgrade(state: RunState, slot: number): ApplyResult {
  if (state.mode !== 'rest') return fail('wrongMode');
  const tool = state.agent.tools[slot];
  if (!tool || tool.version >= MAX_VERSION) return fail('notOffered');
  const up: OwnedTool = { ...tool, version: (tool.version + 1) as OwnedTool['version'] };
  const tools = state.agent.tools.map((t, i) => (i === slot ? up : t));
  return ok(back({ ...state, agent: { ...state.agent, tools } }));
}

export function restActions(state: RunState): Action[] {
  const upgrades = state.agent.tools.flatMap((t, slot): Action[] =>
    t.version < MAX_VERSION ? [{ t: 'restUpgrade', slot }] : [],
  );
  return [{ t: 'restHeal' }, ...upgrades];
}
