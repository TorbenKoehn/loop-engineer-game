// The pure run reducer: validate, then return a new state; never mutate the input.
// See docs/architecture/run-state.md#reducer and #modes.
import { type Action, type ApplyResult, fail } from './actions.ts';
import { afterCombat, fight } from './combat.ts';
import { chooseEvent, enterEvent, eventActions } from './events/standup.ts';
import { discardItem, discardRefs } from './gain.ts';
import { reachable } from './map/graph.ts';
import { lessonActions, pickLesson, skipLesson } from './meta/lessons.ts';
import { takeTreasure } from './nodes/memory.ts';
import { restActions, restHeal, restUpgrade } from './nodes/rest.ts';
import { pickReward, rewardActions, skipReward } from './rewards.ts';
import { buy, enterShop, leaveShop, reroll, sell, shopActions } from './shop.ts';
import type { MapNode, NodeId, RunState } from './state.ts';
import { endRun } from './stats.ts';

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
  return { ok: true, state: arrive(moved, target) };
}

/** Fight nodes resolve the fight, registry nodes open the shop, Standups draw an event. */
function arrive(state: RunState, node: MapNode): RunState {
  if (node.encounter !== null) return fight(state, node);
  if (node.type === 'registry') return enterShop(state, node.id);
  if (node.type === 'idleCycle') return { ...state, mode: 'rest' };
  if (node.type === 'standup') return enterEvent(state, node.id);
  return node.type === 'freeTier' ? { ...state, mode: 'treasure' } : state;
}

/** Gives up from the map: a loss without a lesson offer. */
function abandon(state: RunState): ApplyResult {
  if (state.mode !== 'map') return fail('wrongMode');
  return { ok: true, state: endRun(state, 'abandoned') };
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
    case 'buy':
      return buy(state, action.ix);
    case 'sell':
      return sell(state, action.item);
    case 'reroll':
      return reroll(state);
    case 'leaveShop':
      return leaveShop(state);
    case 'abandon':
      return abandon(state);
    case 'restHeal':
      return restHeal(state);
    case 'restUpgrade':
      return restUpgrade(state, action.slot);
    case 'takeTreasure':
      return takeTreasure(state);
    case 'chooseEvent':
      return chooseEvent(state, action.ix);
    case 'pickLesson':
      return pickLesson(state, action.ix, action.replace);
    case 'skipLesson':
      return skipLesson(state);
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
      return [
        ...reachable(state.map).map((node): Action => ({ t: 'travel', node })),
        { t: 'abandon' },
      ];
    case 'combatReview':
      return [{ t: 'continue' }];
    case 'reward':
      return rewardActions(state);
    case 'shop':
      return shopActions(state);
    case 'rest':
      return restActions(state);
    case 'treasure':
      return [{ t: 'takeTreasure' }];
    case 'event':
      return eventActions(state);
    case 'runEnd':
      return lessonActions(state);
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
