// The pure run reducer: validate, then return a new state; never mutate the input.
// See docs/architecture/run-state.md#reducer and #modes.
import { type Action, type ApplyResult, fail } from './actions.ts';
import { afterCombat, fight } from './combat.ts';
import { discardItem, discardRefs } from './gain.ts';
import { reachable } from './map/graph.ts';
import { pickReward, rewardActions, skipReward } from './rewards.ts';
import type { NodeId, RunState } from './state.ts';

function pickPrompt(state: RunState, prompt: string): ApplyResult {
  if (state.mode !== 'promptPick' || state.pending?.kind !== 'promptOffer') {
    return fail('wrongMode');
  }
  if (!state.pending.prompts.includes(prompt)) return fail('notOffered');
  return {
    ok: true,
    state: { ...state, setup: { ...state.setup, prompt }, mode: 'map', pending: null },
  };
}

function travel(state: RunState, node: NodeId): ApplyResult {
  if (state.mode !== 'map') return fail('wrongMode');
  const target = state.map.nodes.find((n) => n.id === node);
  if (!target || !reachable(state.map).includes(node)) return fail('notReachable');
  const moved: RunState = {
    ...state,
    map: { ...state.map, visited: [...state.map.visited, node], current: node },
    stats: { ...state.stats, nodesVisited: state.stats.nodesVisited + 1 },
  };
  return { ok: true, state: target.encounter === null ? moved : fight(moved, target) };
}

function continueRun(state: RunState): ApplyResult {
  if (state.mode !== 'combatReview') return fail('wrongMode');
  return { ok: true, state: afterCombat(state) };
}

export function apply(state: RunState, action: Action): ApplyResult {
  switch (action.t) {
    case 'pickPrompt':
      return pickPrompt(state, action.prompt);
    case 'travel':
      return travel(state, action.node);
    case 'continue':
      return continueRun(state);
    case 'pickReward':
      return pickReward(state, action.ix);
    case 'skipReward':
      return skipReward(state);
    case 'discardItem':
      return discardItem(state, action.item);
    default:
      // Unreachable for typed callers; guards actions decoded from saves.
      return fail('unknownAction');
  }
}

/** Every action apply accepts in this state (bots, tests). */
export function legalActions(state: RunState): readonly Action[] {
  switch (state.mode) {
    case 'promptPick':
      return state.pending?.kind === 'promptOffer'
        ? state.pending.prompts.map((prompt) => ({ t: 'pickPrompt', prompt }))
        : [];
    case 'map':
      return reachable(state.map).map((node) => ({ t: 'travel', node }));
    case 'combatReview':
      return [{ t: 'continue' }];
    case 'reward':
      return rewardActions(state);
    case 'discard':
      return state.pending?.kind === 'discard'
        ? discardRefs(state.agent, state.pending.item.kind).map((item) => ({
            t: 'discardItem',
            item,
          }))
        : [];
    default:
      return [];
  }
}
