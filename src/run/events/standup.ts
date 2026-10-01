// Standup nodes: draw one unseen event for the phase, validate and resolve a choice.
// See docs/game/content/events.md#rules; RNG fork `event/<nodeId>` (draw, then rolls).
import { content } from '../../content/index.ts';
import type { EventChoice, EventDef } from '../../content/types/event.ts';
import { fork, pick, restore, serialize } from '../../sim/rng.ts';
import { type Action, type ActionError, type ApplyResult, fail, ok } from '../actions.ts';
import { isUnlocked } from '../new-run.ts';
import type { NodeId, RunState } from '../state.ts';
import { endRun } from '../stats.ts';
import { applyOutcomes } from './outcomes.ts';

/** Why a choice is disabled; shown by the UI next to it. */
export type ChoiceBlock = Extract<ActionError, 'insufficientCredits' | 'missingTag'>;

/** Events a Standup can draw now: current phase, unlocked, not seen this run. */
export const eventPool = (state: RunState): EventDef[] =>
  content.events.filter(
    (e) =>
      e.phases.includes(state.phase) &&
      isUnlocked(e.unlock, state.setup.unlocked) &&
      !state.seenEvents.includes(e.id),
  );

/** Opens the Standup on `node`; with no event left it stays on the map. */
export function enterEvent(state: RunState, node: NodeId): RunState {
  const pool = eventPool(state);
  if (pool.length === 0) return state;
  const rng = fork(state.setup.seed, `event/${node}`);
  const event = pick(rng, pool).id;
  return {
    ...state,
    mode: 'event',
    pending: { kind: 'event', node, event, rng: serialize(rng) },
    seenEvents: [...state.seenEvents, event],
  };
}

const openEvent = (state: RunState): EventDef | undefined => {
  const p = state.pending;
  if (state.mode !== 'event' || p?.kind !== 'event') return undefined;
  return content.events.find((e) => e.id === p.event);
};

const equippedTags = (state: RunState): string[] =>
  state.agent.tools.flatMap((t) => content.tools.find((d) => d.id === t.id)?.tags ?? []);

/** The unmet requirement of `choice`, or null when it can be taken. */
export function choiceBlock(state: RunState, choice: EventChoice): ChoiceBlock | null {
  if ((choice.cost ?? 0) > state.agent.credits) return 'insufficientCredits';
  if (choice.needsTag && !equippedTags(state).includes(choice.needsTag)) return 'missingTag';
  return null;
}

/** The open event's choices with their block reason (UI selector); empty outside events. */
export function eventChoices(state: RunState) {
  return (openEvent(state)?.choices ?? []).map((choice) => ({
    choice,
    blocked: choiceBlock(state, choice),
  }));
}

export function chooseEvent(state: RunState, ix: number): ApplyResult {
  const event = openEvent(state);
  if (!event || state.pending?.kind !== 'event') return fail('wrongMode');
  const choice = event.choices[ix];
  if (!choice) return fail('notOffered');
  const blocked = choiceBlock(state, choice);
  if (blocked) return fail(blocked);
  const rng = restore(state.pending.rng);
  const paid: RunState = {
    ...state,
    mode: 'map',
    pending: null,
    agent: { ...state.agent, credits: state.agent.credits - (choice.cost ?? 0) },
  };
  const after = applyOutcomes(paid, choice.outcomes, rng);
  return ok(after.agent.trust === 0 ? endRun(after, 'ctrlc') : after);
}

export const eventActions = (state: RunState): Action[] =>
  eventChoices(state).flatMap(({ blocked }, ix): Action[] =>
    blocked ? [] : [{ t: 'chooseEvent', ix }],
  );
