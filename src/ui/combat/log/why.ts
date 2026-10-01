// The "why" of a damage line (event-log.md "why"): each modifier id named, with its value read
// from data the log or the fight input already holds (primeUsed events, zone constants, item
// mod effects). Nothing is re-derived: an item whose share is ambiguous is named without a value.
import { en, type StringKey } from '../../../content/strings/en.ts';
import type { Rule } from '../../../content/types/index.ts';
import { COLD_PENALTY_PCT, FOCUS_BONUS_PCT } from '../../../sim/combat/context/ctx.ts';
import type { CombatEvent, Ref } from '../../../sim/events.ts';
import type { CombatInput } from '../../../sim/index.ts';
import { fmtNumber, t } from '../../i18n.ts';
import type { Fight } from '../fight.ts';
import type { Of } from '../fold.ts';
import { harnessName } from '../names.ts';

interface Value {
  readonly flat: number;
  readonly pct: number;
}
type Owner = { readonly id: string; readonly rules: readonly Rule[] };

const NAME_AREAS = ['tool', 'skill', 'memory', 'prompt'] as const;

/** Display name of a def id from any item area; the raw id when no area has it. */
export function defName(id: string): string {
  const key = NAME_AREAS.map((a) => `${a}.${id}.name`).find((k) => k in en);
  return key ? t(key as StringKey) : id;
}

/** `+20`, `-25`, `0`. */
export const signed = (n: number): string => `${n > 0 ? '+' : ''}${fmtNumber(n)}`;

/** `Focused +20%`, `Keyboard Shortcuts +2`, or the bare name when the value is unknown. */
function part(name: string, v?: Value): string {
  if (!v) return name;
  const bits = [v.flat ? signed(v.flat) : '', v.pct ? `${signed(v.pct)}%` : ''];
  return [name, ...bits.filter(Boolean)].join(' ');
}

const ownersOf = (input: CombatInput): Readonly<Record<string, readonly Owner[]>> => ({
  trait: input.trait ? [input.trait] : [],
  prompt: [input.prompt],
  skill: input.skills,
  memory: input.memories,
  lesson: input.lessons,
});

/** Sum of the owner's passive mods on `stats`; unknown unless the hit used all `uses` of them. */
function itemValue(owner: Owner | undefined, stats: readonly string[], uses: number) {
  const mods = (owner?.rules ?? [])
    .filter((r) => r.when.on === 'passive')
    .flatMap((r) => r.then)
    .flatMap((e) => (e.do === 'mod' && stats.includes(e.stat) ? [e] : []));
  if (mods.length !== uses) return undefined;
  const flat = mods.filter((m) => m.stat === 'dmgFlat').reduce((sum, m) => sum + m.v, 0);
  return { flat, pct: mods.reduce((sum, m) => sum + m.v, 0) - flat };
}

/** `v` of every prime the activation behind the hit at `index` consumed, oldest first. */
function primeValues(events: readonly CombatEvent[], index: number, tool: Ref): number[] {
  const out: number[] = [];
  for (let i = index - 1; i >= 0; i--) {
    const e = events[i];
    if (!e || (e.kind === 'toolFired' && e.src === tool)) break;
    if (e.kind === 'primeUsed' && e.dst === tool) out.unshift(e.v ?? 0);
  }
  return out;
}

function itemName(fight: Fight, kind: string, id: string): string {
  if (kind === 'trait') return harnessName(fight.harness);
  if (kind === 'lesson') return t('log.why.lesson');
  return defName(id);
}

interface WhyCtx {
  readonly fight: Fight;
  /** Item mod stats that apply to this hit. */
  readonly stats: readonly string[];
  /** Values of the consumed primes still to name, oldest first. */
  readonly primes: number[];
}

/** The zone's own mod: the Focused bonus or the model's Cold penalty. */
function zonePct(input: CombatInput, zone: string): number {
  if (zone === 'focused') return FOCUS_BONUS_PCT;
  return zone === 'cold' ? -COLD_PENALTY_PCT[input.agent.model.accuracy] : 0;
}

/** One modifier id that occurs `uses` times in the why list. */
function modPart(c: WhyCtx, id: string, uses: number): string {
  const [kind = '', def = ''] = id.split(':');
  if (kind === 'zone') {
    const pct = uses * zonePct(c.fight.input, def);
    return part(t(`zone.${def}` as StringKey), { flat: 0, pct });
  }
  if (kind === 'prime') {
    const used = c.primes.splice(0, uses);
    const pct = used.reduce((a, b) => a + b, 0);
    const name = t('log.why.prime', { name: defName(def) });
    return part(name, used.length === uses ? { flat: 0, pct } : undefined);
  }
  const owner = ownersOf(c.fight.input)[kind]?.find((o) => o.id === def);
  return part(itemName(c.fight, kind, def), itemValue(owner, c.stats, uses));
}

/** The why list of the damage event at `index`, in log order, then armor and Guardrails. */
export function whyParts(fight: Fight, index: number): string[] {
  const e = fight.events[index] as Of<'damage'>;
  const { why, guard, armor } = e.d;
  const tool = e.src?.startsWith('t') ? e.src : undefined;
  const focused = why.includes('zone:focused') ? ['focusPct'] : [];
  const stats = e.src?.startsWith('e') ? ['dmgTakenPct'] : ['dmgFlat', 'dmgPct', ...focused];
  const c = { fight, stats, primes: tool ? primeValues(fight.events, index, tool) : [] };
  const parts = [...new Set(why)].map((id) => modPart(c, id, why.filter((w) => w === id).length));
  if (armor > 0) parts.push(t('log.why.armor', { n: armor }));
  if (guard > 0) parts.push(t('log.why.guard', { n: guard }));
  return parts;
}
