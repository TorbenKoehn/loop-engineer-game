// Gaining items: duplicate tools merge +1 version, new items take a free slot, then the
// stash; with neither the run enters discard mode. See docs/game/systems/harness-loadout.md.
import { type ApplyResult, fail, ok } from './actions.ts';
import type { AgentState, ItemKind, ItemRef, OwnedItem, OwnedTool, RunState } from './state.ts';

const MAX_VERSION = 3;
const EQUIPPED = { tool: 'tools', skill: 'skills', memory: 'memories' } as const;
const SLOTS = { tool: 'tools', skill: 'skills', memory: 'memory' } as const;

/** The owned copy of tool `id`, equipped or stashed. */
export function ownedTool(agent: AgentState, id: string): OwnedTool | undefined {
  const stashed = agent.stash.flatMap((i) => (i.kind === 'tool' ? [i.tool] : []));
  return [...agent.tools, ...stashed].find((t) => t.id === id);
}

/** Whether the unique skill or memory `id` is owned, equipped or stashed. */
export const ownsUnique = (agent: AgentState, kind: 'skill' | 'memory', id: string): boolean =>
  agent[EQUIPPED[kind]].includes(id) || agent.stash.some((i) => i.kind === kind && i.id === id);

/** A fresh item of `kind`; tools start at v1. */
export const newItem = (kind: ItemKind, id: string): OwnedItem =>
  kind === 'tool' ? { kind, tool: { id, version: 1, weightMod: 0 } } : { kind, id };

function merge(agent: AgentState, id: string): AgentState {
  const bump = (t: OwnedTool): OwnedTool =>
    t.id === id
      ? { ...t, version: Math.min(MAX_VERSION, t.version + 1) as OwnedTool['version'] }
      : t;
  return {
    ...agent,
    tools: agent.tools.map(bump),
    stash: agent.stash.map((i) => (i.kind === 'tool' ? { ...i, tool: bump(i.tool) } : i)),
  };
}

/** `agent` with `item` in a free slot of its kind, else in the stash; null when both are full. */
function place(agent: AgentState, item: OwnedItem): AgentState | null {
  const free = agent[EQUIPPED[item.kind]].length < agent.slots[SLOTS[item.kind]];
  if (free && item.kind === 'tool') return { ...agent, tools: [...agent.tools, item.tool] };
  if (free && item.kind === 'skill') return { ...agent, skills: [...agent.skills, item.id] };
  if (free && item.kind === 'memory') return { ...agent, memories: [...agent.memories, item.id] };
  if (agent.stash.length < agent.slots.stash) return { ...agent, stash: [...agent.stash, item] };
  return null;
}

/** Gives `item` and moves on to `next`, or enters discard mode when there is no space. */
export function gain(state: RunState, item: OwnedItem, next: RunState['mode']): RunState {
  const agent =
    item.kind === 'tool' && ownedTool(state.agent, item.tool.id)
      ? merge(state.agent, item.tool.id)
      : place(state.agent, item);
  if (agent) return { ...state, agent, mode: next, pending: null };
  return { ...state, mode: 'discard', pending: { kind: 'discard', item, next } };
}

/** Refs that make room for a gained `kind`: the gained item, the kind's slots, the stash. */
export function discardRefs(agent: AgentState, kind: ItemKind): ItemRef[] {
  const slots = agent[EQUIPPED[kind]].map((_, ix): ItemRef => ({ at: kind, ix }));
  const stash = agent.stash.map((_, ix): ItemRef => ({ at: 'stash', ix }));
  return [{ at: 'gained' }, ...slots, ...stash];
}

const sameRef = (a: ItemRef, b: ItemRef): boolean =>
  a.at === b.at && (a.at === 'gained' || (b.at !== 'gained' && a.ix === b.ix));
const drop = <T>(list: readonly T[], ix: number): T[] => list.filter((_, i) => i !== ix);

/** `agent` without the item at `ref`. */
export function remove(agent: AgentState, ref: { at: ItemKind | 'stash'; ix: number }): AgentState {
  if (ref.at === 'stash') return { ...agent, stash: drop(agent.stash, ref.ix) };
  if (ref.at === 'tool') return { ...agent, tools: drop(agent.tools, ref.ix) };
  if (ref.at === 'skill') return { ...agent, skills: drop(agent.skills, ref.ix) };
  return { ...agent, memories: drop(agent.memories, ref.ix) };
}

/** Resolves discard mode: drop `ref`, then place the gained item. */
export function discardItem(state: RunState, ref: ItemRef): ApplyResult {
  const p = state.pending;
  if (state.mode !== 'discard' || p?.kind !== 'discard') return fail('wrongMode');
  const legal = discardRefs(state.agent, p.item.kind);
  if (!legal.some((r) => sameRef(r, ref))) return fail('notOffered');
  if (ref.at === 'gained') return ok({ ...state, mode: p.next, pending: p.resume ?? null });
  const s = gain({ ...state, agent: remove(state.agent, ref) }, p.item, p.next);
  return ok({ ...s, pending: s.pending ?? p.resume ?? null });
}
