// Build actions between fights: reorder tools, equip, unequip, swap, compaction policy.
// Free in map, reward, shop and event modes (docs/game/systems/harness-loadout.md#build-phase).
import { type Action, type ApplyResult, fail, ok } from '../actions.ts';
import { remove } from '../gain.ts';
import { itemAt } from '../shop.ts';
import type { AgentState, ItemKind, Mode, OwnedItem, Policy, RunState } from '../state.ts';
import { overLimit } from './selectors.ts';

export type BuildAction = Extract<
  Action,
  { t: 'moveTool' | 'equip' | 'unequip' | 'swap' | 'setPolicy' }
>;

const MODES: readonly Mode[] = ['map', 'reward', 'shop', 'event'];
const POLICIES: readonly Policy[] = [70, 80, 90, 0];
const KINDS: readonly ItemKind[] = ['tool', 'skill', 'memory'];
const SLOTS = { tool: 'tools', skill: 'skills', memory: 'memory' } as const;

const equipped = (agent: AgentState, kind: ItemKind): number =>
  kind === 'tool' ? agent.tools.length : (kind === 'skill' ? agent.skills : agent.memories).length;
const inRange = (ix: number, n: number): boolean => Number.isInteger(ix) && ix >= 0 && ix < n;

/** `agent` with `item` equipped at index `slot` of its kind. */
function insert(agent: AgentState, item: OwnedItem, slot: number): AgentState {
  const at = <T>(list: readonly T[], x: T): T[] => [...list.slice(0, slot), x, ...list.slice(slot)];
  if (item.kind === 'tool') return { ...agent, tools: at(agent.tools, item.tool) };
  if (item.kind === 'skill') return { ...agent, skills: at(agent.skills, item.id) };
  return { ...agent, memories: at(agent.memories, item.id) };
}

/** Accepts a loadout change unless it breaks the build-phase limit with the modified window. */
const commit = (state: RunState, agent: AgentState): ApplyResult =>
  overLimit(state, agent) ? fail('baselineOverLimit') : ok({ ...state, agent });

function moveTool(state: RunState, from: number, to: number): ApplyResult {
  const { tools } = state.agent;
  if (!inRange(from, tools.length) || !inRange(to, tools.length)) return fail('notOffered');
  const rest = tools.filter((_, i) => i !== from);
  const moved = [...rest.slice(0, to), tools[from] as (typeof tools)[number], ...rest.slice(to)];
  return ok({ ...state, agent: { ...state.agent, tools: moved } });
}

function equip(state: RunState, stashIx: number, slot: number): ApplyResult {
  const { agent } = state;
  const item = agent.stash[stashIx];
  if (!item) return fail('notOffered');
  const n = equipped(agent, item.kind);
  if (n >= agent.slots[SLOTS[item.kind]] || !inRange(slot, n + 1)) return fail('notOffered');
  return commit(state, insert(remove(agent, { at: 'stash', ix: stashIx }), item, slot));
}

function unequip(state: RunState, kind: ItemKind, slot: number): ApplyResult {
  const { agent } = state;
  const n = KINDS.includes(kind) ? equipped(agent, kind) : 0;
  const item = inRange(slot, n) && itemAt(agent, { at: kind, ix: slot });
  if (!item || agent.stash.length >= agent.slots.stash) return fail('notOffered');
  if (kind === 'tool' && n === 1) return fail('lastTool');
  const rest = remove(agent, { at: kind, ix: slot });
  return commit(state, { ...rest, stash: [...rest.stash, item] });
}

function swap(state: RunState, stashIx: number, slot: number): ApplyResult {
  const { agent } = state;
  const item = agent.stash[stashIx];
  const out =
    item && inRange(slot, equipped(agent, item.kind)) && itemAt(agent, { at: item.kind, ix: slot });
  if (!item || !out) return fail('notOffered');
  const rest = remove(agent, { at: item.kind, ix: slot });
  const stash = agent.stash.map((s, i) => (i === stashIx ? out : s));
  return commit(state, insert({ ...rest, stash }, item, slot));
}

function setPolicy(state: RunState, policy: Policy): ApplyResult {
  if (!POLICIES.includes(policy)) return fail('notOffered');
  return ok({ ...state, agent: { ...state.agent, policy } });
}

/** Applies a build action; the run's mode and pending choice stay as they are. */
export function applyBuild(state: RunState, a: BuildAction): ApplyResult {
  if (!MODES.includes(state.mode)) return fail('wrongMode');
  if (a.t === 'moveTool') return moveTool(state, a.from, a.to);
  if (a.t === 'equip') return equip(state, a.stashIx, a.slot);
  if (a.t === 'unequip') return unequip(state, a.kind, a.slot);
  if (a.t === 'swap') return swap(state, a.stashIx, a.slot);
  return setPolicy(state, a.policy);
}

/** Every build action apply accepts now (bots, tests); not part of legalActions. */
export function buildActions(state: RunState): BuildAction[] {
  const { tools, stash, slots } = state.agent;
  const range = (n: number): number[] => Array.from({ length: n }, (_, i) => i);
  const all: BuildAction[] = [
    ...range(tools.length).flatMap((from) =>
      range(tools.length).flatMap((to) =>
        to === from ? [] : [{ t: 'moveTool', from, to } as const],
      ),
    ),
    ...range(stash.length).flatMap((stashIx) =>
      range(Math.max(...Object.values(slots)) + 1).flatMap((slot): BuildAction[] => [
        { t: 'equip', stashIx, slot },
        { t: 'swap', stashIx, slot },
      ]),
    ),
    ...KINDS.flatMap((kind) =>
      range(equipped(state.agent, kind)).map((slot) => ({ t: 'unequip', kind, slot }) as const),
    ),
    ...POLICIES.map((policy) => ({ t: 'setPolicy', policy }) as const),
  ];
  return all.filter((a) => applyBuild(state, a).ok);
}
