// The M1 skill and memory data against docs/game/content (T013).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { rule } from '../dsl/rule.ts';
import { memories } from '../memories/index.ts';
import { en } from '../strings/en.ts';
import { describeRule } from '../text.ts';
import {
  EFFECT_KINDS,
  type Effect,
  type Filter,
  type MemoryDef,
  type ModStat,
  type Rarity,
  type Rule,
  type SkillDef,
} from '../types/index.ts';
import { skills } from './index.ts';

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8');
const skillDoc = read('../../../docs/game/content/skills.md');
const memoryDoc = read('../../../docs/game/content/memories-lessons.md');
const strings = en as Readonly<Record<string, string | undefined>>;

const RARITY: Readonly<Record<string, Rarity>> = { C: 'common', U: 'uncommon', R: 'rare' };

const cells = (line: string) =>
  line
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim());
// Starter skills (TP/IDE starter) are in the M1 pool from the first run; only a real
// unlock node (Loop theory) gates an M1 item.
const unlockOf = (cell: string | undefined) =>
  cell === 'base' || /starter$/.test(cell ?? '')
    ? 'base'
    : { node: (cell ?? '').split(' (')[0]?.toLowerCase().replace(/\W+/g, '_') };

/** Catalogue rows in ItemDef terms. Columns: id, name, rar, wt, effect, unlock, ... */
const rowsOf = (section: string) =>
  section
    .split('\n')
    .filter((l) => l.startsWith('| `'))
    .map(cells);
const asRow = ([id, , rar, wt, , unlock]: readonly string[]) => ({
  id: id?.replaceAll('`', ''),
  rarity: RARITY[rar ?? ''],
  weight: Number(wt),
  unlock: unlockOf(unlock),
});

const m1SkillSection = skillDoc.slice(
  skillDoc.indexOf('## Vertical slice skills (M1)'),
  skillDoc.indexOf('## Full-game skills (M2)'),
);
const skillRows = rowsOf(m1SkillSection).map(asRow);
const memoryRows = rowsOf(memoryDoc)
  .filter((c) => c[6] === 'yes')
  .map(asRow);

const head = (d: SkillDef | MemoryDef) => ({
  id: d.id,
  rarity: d.rarity,
  weight: d.weight,
  unlock: d.unlock,
});

const PASSIVE = { on: 'passive' } as const;
const mod = (stat: ModStat, v: number, filter?: Filter): Effect =>
  filter ? { do: 'mod', stat, v, filter } : { do: 'mod', stat, v };

// Expected rules, written with the same builders as the data (never `then` literals).
const SKILL_RULES: Readonly<Record<string, readonly Rule[]>> = {
  unix_philosophy: [rule(PASSIVE, [mod('dmgPct', 30)], [{ if: 'piped' }])],
  inline_suggestions: [rule(PASSIVE, [mod('dmgFlat', 2, { tag: 'Edit' })])],
  grep_first: [
    rule({ on: 'toolFired', tag: 'Search' }, [{ do: 'prime', filter: { tag: 'Edit' }, pct: 50 }]),
  ],
  lockfile: [rule(PASSIVE, [mod('throttleDurPct', -50)])],
  summarizer: [
    rule({ on: 'compaction' }, [
      { do: 'guard', v: 8 },
      { do: 'status', status: 'haste', ms: 2000, sel: 'leftmost' },
    ]),
  ],
  long_context_training: [rule(PASSIVE, [{ do: 'custom', handler: 'rot_no_slow' }])],
  feedback_loop: [rule(PASSIVE, [{ do: 'custom', handler: 'feedback_loop', args: { ms: 1000 } }])],
  rubber_duck: [rule({ on: 'fightStart' }, [{ do: 'guard', v: 10 }])],
};

const MEMORY_RULES: Readonly<Record<string, readonly Rule[]>> = {
  gitignore: [rule(PASSIVE, [mod('noiseBlock', 12)])],
  cache: [
    rule(PASSIVE, [{ do: 'custom', handler: 'web_ignores_outage' }]),
    rule(PASSIVE, [mod('dmgPct', 100, { tag: 'Web' })], [{ if: 'oncePerFight' }]),
  ],
  long_context: [rule(PASSIVE, [mod('window', 40), mod('rate', -10)])],
  keyboard_shortcuts: [rule(PASSIVE, [mod('rate', 5)])],
};

const items: readonly (SkillDef | MemoryDef)[] = [...skills, ...memories];
const effectsOf = (item: SkillDef | MemoryDef) => item.rules.flatMap((r) => r.then);
const linesOf = (item: SkillDef | MemoryDef) => item.rules.map((r) => describeRule(r));
const oneLine = (s: string | undefined) => s?.replace(/\s+/g, ' ');

describe('M1 skill and memory data', () => {
  it('M1 skills match the catalogue', () => {
    expect(skillRows).toHaveLength(8);
    expect(skills.map(head)).toEqual(skillRows);
    for (const s of skills) expect(s.rules, s.id).toEqual(SKILL_RULES[s.id]);
  });

  it('M1 memories match the catalogue', () => {
    expect(memoryRows).toHaveLength(4);
    expect(memories.map(head)).toEqual(memoryRows);
    for (const m of memories) expect(m.rules, m.id).toEqual(MEMORY_RULES[m.id]);
  });

  it('rules only use known effect kinds', () => {
    for (const item of items) {
      for (const e of effectsOf(item)) expect(EFFECT_KINDS, item.id).toContain(e.do);
    }
  });

  it('generates non-empty lines for all 12 items; Grep First matches skills.md', () => {
    expect(items).toHaveLength(12);
    for (const item of items) {
      for (const line of linesOf(item)) {
        expect(line.length, item.id).toBeGreaterThan(10);
        expect(line, item.id).not.toMatch(/[{}]|undefined/);
      }
    }
    const example = oneLine(/Grep First: "([^"]+)"/.exec(skillDoc)?.[1]);
    expect(example).toBeDefined();
    const grepFirst = skills.find((s) => s.id === 'grep_first');
    expect(grepFirst && linesOf(grepFirst)).toEqual([example]);
  });

  it('every skill and memory has name and flavour keys in en', () => {
    for (const s of skills) {
      expect(strings[`skill.${s.id}.name`], s.id).toBeTruthy();
      expect(strings[`skill.${s.id}.flavour`], s.id).toBeTruthy();
    }
    for (const m of memories) {
      expect(strings[`memory.${m.id}.name`], m.id).toBeTruthy();
      expect(strings[`memory.${m.id}.flavour`], m.id).toBeTruthy();
    }
  });

  it('custom handlers have a text', () => {
    const handlers = items
      .flatMap(effectsOf)
      .flatMap((e) => (e.do === 'custom' ? [e.handler] : []));
    expect(handlers).toHaveLength(3);
    for (const h of handlers) expect(strings[`handler.${h}`], h).toBeTruthy();
  });
});
