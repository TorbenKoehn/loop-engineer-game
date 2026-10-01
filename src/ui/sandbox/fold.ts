// Pure view fold for the dev combat sandbox (T098): events up to a time -> what the screen
// shows. It never calls the sim; every number comes from the event log (docs/architecture/ui.md
// "View fold"). T059's combat screen replaces it with the real playback store.
import type { CombatEvent, EventKind, Ref } from '../../sim/events.ts';

export interface StatusChip {
  readonly status: string;
  /** Playback time at which the status runs out. */
  readonly until: number;
}

interface UnitView {
  readonly ref: Ref;
  readonly guard: number;
  readonly statuses: readonly StatusChip[];
  /** Last time this unit took damage (for the hit flash). */
  readonly hitAt?: number;
}

export interface AgentView extends UnitView {
  readonly trust: number;
  readonly maxTrust: number;
}

export interface IntentView {
  readonly id: string;
  readonly windupMs: number;
  readonly setAt: number;
}

export interface EnemyView extends UnitView {
  readonly def: string;
  readonly sev: number;
  readonly maxSev: number;
  readonly intent?: IntentView;
  readonly actedAt?: number;
  readonly resolvedAt?: number;
}

export interface ToolView extends UnitView {
  readonly slot: number;
  readonly def: string;
  readonly version: number;
  readonly fired: number;
  readonly firedAt?: number;
  readonly dealt: number;
}

export type PopKind = 'damage' | 'guard' | 'heal';

/** A floating number over a unit; `absorbed` is the part Guardrails took. */
export interface Pop {
  readonly seq: number;
  readonly t: number;
  readonly dst: Ref;
  readonly kind: PopKind;
  readonly amount: number;
  readonly absorbed: number;
}

export interface EndView {
  readonly outcome: 'win' | 'loss';
  readonly reason: 'resolved' | 'trust' | 'timeout';
  readonly trust: number;
  readonly t: number;
}

export interface SandboxView {
  /** Index of the next event to apply. */
  readonly cursor: number;
  /** Time of the last applied event. */
  readonly t: number;
  readonly deadlineMs: number;
  readonly agent: AgentView;
  /** Front to back, resolved enemies included (they stay greyed out). */
  readonly enemies: readonly EnemyView[];
  readonly tools: readonly ToolView[];
  /** The most recent pops, oldest first, at most MAX_POPS. */
  readonly pops: readonly Pop[];
  readonly end?: EndView;
}

export const MAX_POPS = 16;

export interface ToolSlot {
  readonly def: string;
  readonly version: number;
}

/** The view before the first event: tools come from the loadout, everything else from events. */
export function initialView(tools: readonly ToolSlot[]): SandboxView {
  return {
    cursor: 0,
    t: 0,
    deadlineMs: 0,
    agent: { ref: 'a', trust: 0, maxTrust: 0, guard: 0, statuses: [] },
    enemies: [],
    tools: tools.map((s, slot) => ({
      ref: `t${slot}`,
      slot,
      def: s.def,
      version: s.version,
      fired: 0,
      dealt: 0,
      guard: 0,
      statuses: [],
    })),
    pops: [],
  };
}

type Patch<U> = (unit: U) => Partial<U>;

/** Applies a patch to the agent, tool or enemy with `ref`; unknown refs leave the view as is. */
function patchUnit(view: SandboxView, ref: Ref | undefined, patch: Patch<UnitView>): SandboxView {
  if (ref === 'a') return { ...view, agent: { ...view.agent, ...patch(view.agent) } };
  return {
    ...view,
    enemies: view.enemies.map((u) => (u.ref === ref ? { ...u, ...patch(u) } : u)),
    tools: view.tools.map((u) => (u.ref === ref ? { ...u, ...patch(u) } : u)),
  };
}

function patchEnemy(view: SandboxView, ref: Ref | undefined, patch: Patch<EnemyView>) {
  return { ...view, enemies: view.enemies.map((u) => (u.ref === ref ? { ...u, ...patch(u) } : u)) };
}

function patchTool(view: SandboxView, ref: Ref | undefined, patch: Patch<ToolView>) {
  return { ...view, tools: view.tools.map((u) => (u.ref === ref ? { ...u, ...patch(u) } : u)) };
}

/** Sets Trust (agent) or Severity (enemy) of `ref`. */
function setHp(view: SandboxView, ref: Ref | undefined, hp: number): SandboxView {
  if (ref === 'a') return { ...view, agent: { ...view.agent, trust: hp } };
  return patchEnemy(view, ref, () => ({ sev: hp }));
}

function addPop(view: SandboxView, pop: Pop): SandboxView {
  return { ...view, pops: [...view.pops, pop].slice(-MAX_POPS) };
}

/** Events that can have kind K (some union members share one shape, e.g. guard and heal). */
type EventOf<E, K> = E extends { kind: infer EK } ? (K extends EK ? E : never) : never;
export type Of<K extends EventKind> = EventOf<CombatEvent, K>;
type Handler<K extends EventKind> = (view: SandboxView, e: Of<K>) => SandboxView;

function onDamage(view: SandboxView, e: Of<'damage'>): SandboxView {
  const absorbed = e.d.guard;
  const t = e.t;
  let next = setHp(view, e.dst, e.d.sev);
  next = patchUnit(next, e.dst, (u) => ({ guard: Math.max(0, u.guard - absorbed), hitAt: t }));
  next = patchTool(next, e.src, (u) => ({ dealt: u.dealt + (e.v ?? 0) }));
  const pop = { seq: e.seq, t, dst: e.dst ?? 'sys', amount: e.v ?? 0, absorbed };
  return addPop(next, { ...pop, kind: 'damage' });
}

function onGain(view: SandboxView, e: Of<'guard'> | Of<'heal'>): SandboxView {
  const next =
    e.kind === 'guard'
      ? patchUnit(view, e.dst, () => ({ guard: e.d.total }))
      : setHp(view, e.dst, e.d.total);
  const pop = { seq: e.seq, t: e.t, dst: e.dst ?? 'sys', amount: e.v ?? 0, absorbed: 0 };
  return addPop(next, { ...pop, kind: e.kind });
}

function onSpawn(view: SandboxView, e: Of<'spawn'>): SandboxView {
  const sev = e.v ?? 0;
  const ref = e.dst ?? `e${e.seq}`;
  const enemy: EnemyView = { ref, def: e.d.def, sev, maxSev: sev, guard: 0, statuses: [] };
  const enemies = [...view.enemies];
  enemies.splice(e.d.index, 0, enemy);
  return { ...view, enemies };
}

const handlers: { [K in EventKind]?: Handler<K> } = {
  fightStart: (view, e) => ({
    ...view,
    deadlineMs: e.v ?? 0,
    agent: { ...view.agent, trust: e.d.trust, maxTrust: e.d.maxTrust },
  }),
  spawn: onSpawn,
  intentSet: (view, e) =>
    patchEnemy(view, e.src, () => ({
      intent: { id: e.d.intent, windupMs: e.v ?? 0, setAt: e.t },
    })),
  enemyActed: (view, e) => patchEnemy(view, e.src, () => ({ actedAt: e.t })),
  toolFired: (view, e) => patchTool(view, e.src, (u) => ({ fired: u.fired + 1, firedAt: e.t })),
  damage: onDamage,
  guard: onGain,
  heal: onGain,
  statusOn: (view, e) =>
    patchUnit(view, e.dst, (u) => ({
      statuses: [
        ...u.statuses.filter((s) => s.status !== e.d.status),
        { status: e.d.status, until: e.t + e.d.remaining },
      ],
    })),
  statusOff: (view, e) =>
    patchUnit(view, e.dst, (u) => ({
      statuses: u.statuses.filter((s) => s.status !== e.d.status),
    })),
  resolved: (view, e) => patchEnemy(view, e.src, () => ({ sev: 0, resolvedAt: e.t })),
  fightEnd: (view, e) => ({ ...view, end: { ...e.d, t: e.t } }),
};

/** Applies one event. Kinds the sandbox does not show only move the cursor. */
export function foldEvent(view: SandboxView, e: CombatEvent): SandboxView {
  const handler = handlers[e.kind] as Handler<EventKind> | undefined;
  const next = handler ? handler(view, e) : view;
  return { ...next, cursor: view.cursor + 1, t: e.t };
}

/** Folds forward from `view.cursor` through every event with `t <= time`. */
export function advanceTo(
  view: SandboxView,
  events: readonly CombatEvent[],
  time: number,
): SandboxView {
  let next = view;
  for (let e = events[next.cursor]; e && e.t <= time; e = events[next.cursor]) {
    next = foldEvent(next, e);
  }
  return next;
}

/** Folds the whole log: the state the screen shows after the fight. */
export function foldAll(start: SandboxView, events: readonly CombatEvent[]): SandboxView {
  return advanceTo(start, events, Number.POSITIVE_INFINITY);
}
