// Test support: a Fight from hand-written events on a small real loadout (grep v2, cat v1,
// Unix Philosophy, Grep First, Senior), with `e1` labelled Context Drift.
import { content } from '../../../content/index.ts';
import type { CombatEvent, Ref } from '../../../sim/events.ts';
import type { CombatInput } from '../../../sim/index.ts';
import type { Fight } from '../fight.ts';
import { initialView } from '../fold.ts';

function byId<T extends { readonly id: string }>(list: readonly T[], id: string): T {
  const hit = list.find((x) => x.id === id);
  if (!hit) throw new Error(`testing: no def ${id}`);
  return hit;
}

export type EventSpec = Omit<CombatEvent, 'seq'>;

export function fightOf(events: readonly EventSpec[], accuracy = 'normal'): Fight {
  const tools = [
    { def: byId(content.tools, 'grep'), version: 2 },
    { def: byId(content.tools, 'cat'), version: 1 },
  ];
  const input = {
    agent: { model: { accuracy }, tools, trust: 80, maxTrust: 80 },
    skills: [byId(content.skills, 'unix_philosophy'), byId(content.skills, 'grep_first')],
    memories: [],
    lessons: [],
    prompt: byId(content.prompts, 'senior'),
  } as unknown as CombatInput;
  return {
    harness: 'terminal_purist',
    input,
    events: events.map((e, seq) => ({ seq, ...e }) as CombatEvent),
    start: initialView(tools.map((s) => ({ def: s.def.id, version: s.version }))),
    fires: [],
    labels: new Map<Ref, string>([['e1', 'Context Drift']]),
    compactions: 0,
  };
}

/** A damage event of grep (t0) on Context Drift (e1). */
export function hit(t: number, v: number, why: readonly string[], extra = {}): EventSpec {
  const d = { base: 6, flat: 0, pct: 0, armor: 0, guard: 0, sev: 100, zone: 1, why, ...extra };
  return { t, kind: 'damage', src: 't0', dst: 'e1', v, d };
}
