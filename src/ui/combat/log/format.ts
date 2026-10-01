// One plain-English line per event (screens.md "Tooltips and the combat log"):
// `[mm:ss.mmm] source -> target: verb value (why)`. Every word comes from t(); numbers and
// names come from the event, the fight's labels and its input.
import { en, type StringKey } from '../../../content/strings/en.ts';
import type { CombatEvent, EventKind, Ref } from '../../../sim/events.ts';
import { fmtSeconds, formatClock, t } from '../../i18n.ts';
import { ZONES } from '../context.ts';
import type { Fight } from '../fight.ts';
import type { Of } from '../fold.ts';
import { harnessName, intentName, statusName, toolName } from '../names.ts';
import { signed, whyParts } from './why.ts';

/** Who caused a line: colours the source name. */
export type Tone = 'agent' | 'tool' | 'enemy' | 'ctx' | 'sys';

export interface LogLine {
  /** Index of the event in the fight's log. */
  readonly index: number;
  readonly event: CombatEvent;
  readonly time: string;
  readonly src: string;
  /** Absent when the event has no target or targets its own source. */
  readonly dst?: string;
  readonly verb: string;
  /** Modifiers of a damage line, joined. */
  readonly why?: string;
  readonly tone: Tone;
  /** A hit on the agent. */
  readonly hurt: boolean;
}

interface Names {
  readonly fight: Fight;
  /** Enemy def by ref, from the spawn events. */
  readonly defs: ReadonlyMap<Ref | undefined, string>;
}

type Verb<K extends EventKind> = (e: Of<K>, c: Names) => string;

const ms = (n: number | undefined): string => fmtSeconds(n ?? 0);
const zoneName = (ix: number): string => t(`zone.${ZONES[ix] ?? 'cold'}`);
const snake = (s: string): string => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const intent = (c: Names, e: Of<'intentSet'> | Of<'enemyActed'>): string =>
  intentName(c.defs.get(e.src) ?? '', e.d.intent);

function traitVerb(e: Of<'trait'>): string {
  const key = `log.trait.${e.d.trait}.${snake(e.d.what)}`;
  const params = { n: e.v ?? 0, trait: e.d.trait, what: e.d.what };
  return t(key in en ? (key as StringKey) : 'log.trait', params);
}

const VERBS: { readonly [K in EventKind]: Verb<K> } = {
  fightStart: (e) => t('log.fight_start', { time: ms(e.v) }),
  spawn: (e) => (e.dst ? t('log.spawn', { n: e.v ?? 0 }) : t('log.spawn.blocked')),
  intentSet: (e, c) => t('log.intent_set', { intent: intent(c, e), time: ms(e.v) }),
  toolFired: (e) => (e.d.echo ? t('log.tool_fired.echo', { n: e.d.echo }) : t('log.tool_fired')),
  pipe: (e) => t('log.pipe', { time: ms(e.v), chain: e.d.chain }),
  charge: (e) => t('log.charge', { time: ms(e.v) }),
  damage: (e) => t('log.damage', { n: e.v ?? 0 }),
  guard: (e) => t('log.guard', { n: e.v ?? 0, total: e.d.total }),
  heal: (e) => t('log.heal', { n: e.v ?? 0, total: e.d.total }),
  tokens: (e) => t(`log.tokens.${e.d.kind}`, { n: signed(e.v ?? 0) }),
  zoneChanged: (e) => t('log.zone_changed', { from: zoneName(e.d.from), to: zoneName(e.d.to) }),
  compaction: (e) => t(`log.compaction.${e.d.kind}`, { time: ms(e.v) }),
  statusOn: (e) => t('log.status_on', { status: statusName(e.d.status), time: ms(e.d.remaining) }),
  statusOff: (e) => t('log.status_off', { status: statusName(e.d.status) }),
  prime: (e) => t('log.prime', { n: e.v ?? 0 }),
  primeUsed: (e) => t('log.prime_used', { n: e.v ?? 0 }),
  trait: traitVerb,
  armorBroken: (e) => t('log.armor_broken', { n: e.d.remaining }),
  enemyActed: (e, c) => t('log.enemy_acted', { intent: intent(c, e) }),
  redirect: () => t('log.redirect'),
  summon: (e) => t('log.summon', { time: ms(e.d.lifeMs) }),
  summonEnd: (e) => t('log.summon_end', { n: e.v ?? 0 }),
  resolved: (e, c) => t('log.resolved', { by: refName(c, e.d.by) }),
  roll: (e) => t('log.roll', { n: e.v ?? 0, lo: e.d.lo, hi: e.d.hi }),
  deadline: (e) => t('log.deadline', { n: e.v ?? 0 }),
  fightEnd: (e) => t(`ui.combat.result.${e.d.reason}`, { time: ms(e.v) }),
};

/** `grep v2`, `Typo #2`, the harness for the agent, `context`, `system`, `sub-agent`. */
function refName(c: Names, ref: Ref): string {
  if (ref === 'a') return harnessName(c.fight.harness);
  if (ref === 'ctx' || ref === 'sys') return t(`log.ref.${ref}`);
  if (ref.startsWith('s')) return t('log.ref.summon');
  if (ref.startsWith('e')) return c.fight.labels.get(ref) ?? ref;
  const slot = c.fight.input.agent.tools[Number(ref.slice(1))];
  return slot ? t('log.ref.tool', { name: toolName(slot.def.id), v: slot.version }) : ref;
}

const TONES: Readonly<Record<string, Tone>> = { a: 'agent', t: 'tool', s: 'tool', e: 'enemy' };

function toneOf(ref: Ref): Tone {
  if (ref === 'ctx' || ref === 'sys') return ref;
  return TONES[ref.charAt(0)] ?? 'sys';
}

function line(c: Names, e: CombatEvent, index: number): LogLine {
  const src = e.src ?? 'sys';
  const why = e.kind === 'damage' ? whyParts(c.fight, index).join(', ') : '';
  return {
    index,
    event: e,
    time: formatClock(e.t),
    src: refName(c, src),
    ...(e.dst && e.dst !== src && { dst: refName(c, e.dst) }),
    verb: (VERBS[e.kind] as Verb<EventKind>)(e, c),
    ...(why && { why }),
    tone: toneOf(src),
    hurt: e.kind === 'damage' && e.dst === 'a',
  };
}

/** Every line of the fight, one per event, in log order. */
export function logLines(fight: Fight): LogLine[] {
  const defs = new Map<Ref | undefined, string>();
  for (const e of fight.events) if (e.kind === 'spawn' && e.dst) defs.set(e.dst, e.d.def);
  const c = { fight, defs };
  return fight.events.map((e, index) => line(c, e, index));
}

/** The whole line as one string: the row's accessible name and tooltip. */
export function lineText(l: LogLine): string {
  const verb = l.why ? t('log.why', { verb: l.verb, why: l.why }) : l.verb;
  const params = { time: l.time, src: l.src, verb };
  return l.dst ? t('log.line', { ...params, dst: l.dst }) : t('log.line.self', params);
}
