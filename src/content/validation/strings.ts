// Rule 3: every tool has 1-2 distinct tags; every item has its name, line and flavour keys.
// Lines of tools, skills, memories and rules are generated (text.ts), so they count when
// they render; vocabulary keys (tag, zone, status, family, target, sel, stat) are complete.
import type { Content } from '../index.ts';
import type { Strings } from '../strings/en.ts';
import { kindKey } from '../text/fill.ts';
import { describeEnemy, describeRule, describeTool } from '../text.ts';
import type { Family, Status, Tag, TargetSel, Zone } from '../types/basics.ts';
import type { ModStat, Rule, Selector } from '../types/dsl.ts';
import { hasKey, intentsOf } from './walk.ts';

const err = (msg: string) => `[rule 3] ${msg}`;

// Exhaustive by construction: `satisfies Record<Union, 1>` rejects missing and extra keys.
const TAGS = { Search: 1, Edit: 1, Test: 1, Shell: 1, Web: 1, Agent: 1 } satisfies Record<Tag, 1>;
const ZONES = { cold: 1, focused: 1, rot: 1, overflow: 1 } satisfies Record<Zone, 1>;
const STATUSES = { haste: 1, slow: 1, throttle: 1, stun: 1 } satisfies Record<Status, 1>;
const FAMILIES = { Bugs: 1, Context: 1, Infra: 1, Process: 1, Sandbox: 1 } satisfies Record<
  Family,
  1
>;
const TARGETS = {
  front: 1,
  back: 1,
  lowest: 1,
  all: 1,
  self: 1,
  tool: 1,
  rightTool: 1,
  tools: 1,
} satisfies Record<TargetSel, 1>;
type ToolSel = Exclude<Selector, TargetSel | { readonly tag: Tag }>;
const SELS = { fastest: 1, leftmost: 1, rightmost: 1, longestCharge: 1 } satisfies Record<
  ToolSel,
  1
>;
const STATS = {
  rate: 1,
  dmgPct: 1,
  dmgFlat: 1,
  output: 1,
  window: 1,
  pipeMs: 1,
  focusPct: 1,
  noiseBlock: 1,
  throttleDurPct: 1,
  stunDurPct: 1,
  dmgTakenPct: 1,
  credits: 1,
  'slots.tool': 1,
  'slots.memory': 1,
  rerollCost: 1,
  healPct: 1,
} satisfies Record<ModStat, 1>;

const lower = (x: string) => x.toLowerCase();

/** Every vocabulary key the text templates may look up. */
export const vocabularyKeys = (): string[] => [
  ...Object.keys(TAGS).flatMap((t) => [`tag.${lower(t)}`, `tag.${lower(t)}.indef`]),
  ...Object.keys(ZONES).map((z) => `zone.${z}`),
  ...Object.keys(STATUSES).map((s) => `status.${s}`),
  ...Object.keys(FAMILIES).map((f) => `family.${lower(f)}`),
  ...Object.keys(TARGETS).map((t) => kindKey('target', t)),
  ...Object.keys(SELS).map((s) => kindKey('sel', s)),
  ...Object.keys(STATS).map((s) => kindKey('stat', s)),
];

function renders(owner: string, render: () => unknown): string[] {
  try {
    render();
    return [];
  } catch (e) {
    return [err(`${owner}: ${e instanceof Error ? e.message : String(e)}`)];
  }
}

const rulesRender = (owner: string, rules: readonly Rule[], strings: Strings) =>
  rules.flatMap((r) => renders(owner, () => describeRule(r, { strings })));

function toolStrings(c: Content, s: Strings): string[] {
  return c.tools.flatMap((t) => [
    ...(t.tags.length >= 1 && t.tags.length <= 2 && new Set(t.tags).size === t.tags.length
      ? []
      : [err(`tool ${t.id}: needs 1-2 distinct tags, has [${t.tags.join(', ')}]`)]),
    ...([1, 2, 3] as const).flatMap((v) => renders(`tool ${t.id}`, () => describeTool(t, v, s))),
  ]);
}

function itemKeys(c: Content): string[] {
  return [
    ...c.tools.flatMap((t) => [`tool.${t.id}.name`, `tool.${t.id}.flavour`]),
    ...c.skills.flatMap((x) => [`skill.${x.id}.name`, `skill.${x.id}.flavour`]),
    ...c.memories.flatMap((x) => [`memory.${x.id}.name`, `memory.${x.id}.flavour`]),
    ...c.harnesses.flatMap((x) => ['name', 'line', 'flavour'].map((p) => `harness.${x.id}.${p}`)),
    ...c.prompts.flatMap((x) => ['name', 'line', 'flavour'].map((p) => `prompt.${x.id}.${p}`)),
    ...c.lessons.map((x) => `lesson.${x.id}.line`),
    ...c.enemies.flatMap((e) => [
      `enemy.${e.id}.name`,
      ...intentsOf(e).map((i) => `enemy.${e.id}.intent.${i.id}`),
      ...(e.stages ?? []).map((st) => `enemy.${e.id}.stage.${st.id}`),
    ]),
    ...c.events.flatMap((ev) => [
      `event.${ev.id}.setup`,
      ...ev.choices.map((ch) => `event.${ev.id}.choice.${ch.id}`),
    ]),
  ];
}

function generatedLines(c: Content, s: Strings): string[] {
  return [
    ...toolStrings(c, s),
    ...c.skills.flatMap((x) => rulesRender(`skill ${x.id}`, x.rules, s)),
    ...c.memories.flatMap((x) => rulesRender(`memory ${x.id}`, x.rules, s)),
    ...c.lessons.flatMap((x) => rulesRender(`lesson ${x.id}`, x.rules, s)),
    ...c.prompts.flatMap((x) => rulesRender(`prompt ${x.id}`, x.rules, s)),
    ...c.harnesses.flatMap((x) => rulesRender(`harness ${x.id}`, x.trait.rules, s)),
    ...c.enemies.flatMap((e) => renders(`enemy ${e.id}`, () => describeEnemy(e, s))),
  ];
}

export function checkStrings(c: Content, strings: Strings): string[] {
  const missing = [...vocabularyKeys(), ...itemKeys(c)]
    .filter((key) => !hasKey(strings, key))
    .map((key) => err(`missing string '${key}'`));
  return [...missing, ...generatedLines(c, strings)];
}
