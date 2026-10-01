// Small shared pieces of the combat screen: bars, status chips and damage pops.
import type { Ref } from '../../../sim/events.ts';
import { fmtSeconds } from '../../i18n.ts';
import type { Pop, StatusChip } from '../fold.ts';
import { statusName } from '../names.ts';
import type { Speed } from '../playback.ts';

/** Sim-time ms a pop or flash stays visible at 1x; scaled by speed so it lasts the same real time. */
export const POP_MS = 900;
export const FLASH_MS = 220;

/** True while `at` lies within `ms` real time (scaled by speed) before `time`; never at skip. */
export const isRecent = (at: number | undefined, time: number, ms: number, speed: Speed) =>
  speed !== 'skip' && at !== undefined && time >= at && time - at < ms * speed;

export type BarTone = 'trust' | 'guard' | 'sev' | 'charge' | 'intent' | 'clock';

/** A horizontal bar; the fill scales with transform only (ui.md "Performance budgets"). */
export function Bar(props: { value: number; max: number; tone: BarTone }) {
  const f = props.max > 0 ? Math.max(0, Math.min(1, props.value / props.max)) : 0;
  return (
    <div class={`bar bar--${props.tone}`} aria-hidden="true">
      <div class="bar__fill" style={{ transform: `scaleX(${f})` }} />
    </div>
  );
}

export function Chips(props: { statuses: readonly StatusChip[]; time: number }) {
  if (props.statuses.length === 0) return null;
  return (
    <ul class="chips">
      {props.statuses.map((s) => (
        <li key={s.status} class={`chip chip--${s.status}`}>
          {statusName(s.status)} {fmtSeconds(s.until - props.time)}
        </li>
      ))}
    </ul>
  );
}

function popText(p: Pop): string {
  if (p.kind === 'guard') return `+${p.amount} ⛨`;
  if (p.kind === 'heal') return `+${p.amount} ♥`;
  return p.absorbed > 0 ? `-${p.amount} (⛨${p.absorbed})` : `-${p.amount}`;
}

/** Floating numbers over one unit; each pop animates once on mount (keyed by seq). */
export function Pops(props: { pops: readonly Pop[]; unit: Ref; time: number; speed: Speed }) {
  const mine = props.pops.filter(
    (p) => p.dst === props.unit && isRecent(p.t, props.time, POP_MS, props.speed),
  );
  return (
    <div class="pops" aria-hidden="true">
      {mine.map((p, i) => (
        <span key={p.seq} class={`pop pop--${p.kind}`} style={{ '--i': i % 4 }}>
          {popText(p)}
        </span>
      ))}
    </div>
  );
}
