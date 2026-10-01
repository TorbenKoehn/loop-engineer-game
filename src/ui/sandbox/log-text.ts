// Plain-English combat log lines for the sandbox (T098), one per shown event, built once per
// fight. Tool and intent sentences come from the generated text in src/content/text.ts; the
// real log with `t()` templates and "why" tooltips is T059's.
import { describeEnemy, describeTool, type Version } from '../../content/text.ts';
import type { CombatEvent, EventKind, Ref } from '../../sim/events.ts';
import type { ToolSetup } from '../../sim/index.ts';
import { enemyById } from './adapter.ts';
import { foldEvent, initialView, type Of, type SandboxView } from './fold.ts';
import { enemyLabels, enemyName, intentName, statusName, toolName } from './names.ts';
import { formatSeconds } from './timeline.ts';

export type Tone = 'agent' | 'enemy' | 'good' | 'muted' | 'win' | 'loss';

export interface LogLine {
  readonly seq: number;
  readonly t: number;
  /** Who acted, e.g. `grep`, `Typo`, `you`. */
  readonly actor: string;
  readonly text: string;
  readonly tone: Tone;
}

type Line = Omit<LogLine, 'seq' | 't'>;
interface Ctx {
  /** View before the event. */
  readonly view: SandboxView;
  readonly tools: readonly ToolSetup[];
  readonly labels: ReadonlyMap<Ref, string>;
}
type Describe<K extends EventKind> = (e: Of<K>, ctx: Ctx) => Line | undefined;

const intentLines = new Map<string, string>();

/** Generated sentence of an enemy intent, e.g. "Hit for 2." */
function intentLine(enemy: string, intent: string): string {
  const key = `${enemy}/${intent}`;
  if (!intentLines.has(key)) {
    const def = enemyById(enemy);
    const intents = [
      ...(def.opening ?? []),
      ...def.cycle,
      ...(def.stages ?? []).flatMap((s) => s.cycle),
    ];
    const lines = describeEnemy(def).intents;
    intents.forEach((it, i) => {
      intentLines.set(`${enemy}/${it.id}`, lines[i] ?? '');
    });
  }
  return intentLines.get(key) ?? '';
}

const enemyDef = (ctx: Ctx, ref: Ref | undefined): string =>
  ctx.view.enemies.find((e) => e.ref === ref)?.def ?? '?';

function refName(ctx: Ctx, ref: Ref | undefined): string {
  if (ref === 'a') return 'you';
  if (ref?.startsWith('t')) return toolName(ctx.view.tools.find((t) => t.ref === ref)?.def ?? ref);
  if (ref?.startsWith('e')) return ctx.labels.get(ref) ?? enemyName(enemyDef(ctx, ref));
  return 'system';
}

function onDamage(e: Of<'damage'>, ctx: Ctx): Line {
  const blocked = e.d.guard > 0 ? ` (${e.d.guard} blocked by Guardrails)` : '';
  if (e.dst === 'a') {
    const max = ctx.view.agent.maxTrust;
    const text = `take ${e.v} from ${refName(ctx, e.src)}${blocked} → Trust ${e.d.sev}/${max}`;
    return { actor: 'you', text, tone: 'agent' };
  }
  const target = ctx.view.enemies.find((u) => u.ref === e.dst);
  const sev = `Severity ${e.d.sev}/${target?.maxSev ?? '?'}`;
  const text = `hits ${refName(ctx, e.dst)} for ${e.v}${blocked} → ${sev}`;
  return { actor: refName(ctx, e.src), text, tone: 'agent' };
}

const END_TEXT = {
  resolved: (s: string) => `Every issue resolved in ${s}. Ship it.`,
  trust: (s: string) => `Trust ran out after ${s}. The human takes the keyboard back.`,
  timeout: (s: string) => `Timed out after ${s}: the Deadline has passed.`,
} as const;

const describers: { [K in EventKind]?: Describe<K> } = {
  fightStart: (e) => ({
    actor: 'system',
    text: `Fight starts. Trust ${e.d.trust}/${e.d.maxTrust}, Deadline ${formatSeconds(e.v ?? 0)}.`,
    tone: 'muted',
  }),
  spawn: (e, ctx) => ({
    actor: refName(ctx, e.dst),
    text: `joins the fight (Severity ${e.v}).`,
    tone: 'enemy',
  }),
  intentSet: (e, ctx) => {
    const def = enemyDef(ctx, e.src);
    const text = `readies ${intentName(def, e.d.intent)} (${formatSeconds(e.v ?? 0)}).`;
    return { actor: refName(ctx, e.src), text, tone: 'muted' };
  },
  enemyActed: (e, ctx) => {
    const def = enemyDef(ctx, e.src);
    const text = `uses ${intentName(def, e.d.intent)}: ${intentLine(def, e.d.intent)}`;
    return { actor: refName(ctx, e.src), text, tone: 'enemy' };
  },
  toolFired: (e, ctx) => {
    const def = ctx.tools[Number(e.src?.slice(1))]?.def;
    const line = def ? describeTool(def, e.d.version as Version) : '';
    return { actor: toolName(e.d.def), text: `fires (v${e.d.version}): ${line}`, tone: 'agent' };
  },
  damage: onDamage,
  guard: (e, ctx) => ({
    actor: refName(ctx, e.dst),
    text: `gain${e.dst === 'a' ? '' : 's'} ${e.v} Guardrails (${e.d.total} total).`,
    tone: 'good',
  }),
  heal: (e, ctx) => ({
    actor: refName(ctx, e.dst),
    text: `restore${e.dst === 'a' ? '' : 's'} ${e.v} → ${e.d.total}.`,
    tone: 'good',
  }),
  statusOn: (e, ctx) => ({
    actor: refName(ctx, e.dst),
    text: `${statusName(e.d.status)} for ${formatSeconds(e.d.remaining)}.`,
    tone: 'muted',
  }),
  statusOff: (e, ctx) => ({
    actor: refName(ctx, e.dst),
    text: `${statusName(e.d.status)} ends.`,
    tone: 'muted',
  }),
  resolved: (e, ctx) => ({
    actor: refName(ctx, e.src),
    text: `resolved by ${refName(ctx, e.d.by)}.`,
    tone: 'good',
  }),
  fightEnd: (e) => ({
    actor: 'system',
    text: END_TEXT[e.d.reason](formatSeconds(e.t)),
    tone: e.d.outcome === 'win' ? 'win' : 'loss',
  }),
};

function describe(e: CombatEvent, ctx: Ctx): Line {
  const fn = describers[e.kind] as Describe<EventKind> | undefined;
  return fn?.(e, ctx) ?? { actor: 'system', text: `${e.kind} ${e.v ?? ''}`.trim(), tone: 'muted' };
}

/** One line per event, in log order, with the event's seq and time. */
export function buildLog(events: readonly CombatEvent[], tools: readonly ToolSetup[]): LogLine[] {
  let view = initialView(tools.map((s) => ({ def: s.def.id, version: s.version })));
  const labels = enemyLabels(events);
  const out: LogLine[] = [];
  for (const e of events) {
    out.push({ seq: e.seq, t: e.t, ...describe(e, { view, tools, labels }) });
    view = foldEvent(view, e);
  }
  return out;
}
