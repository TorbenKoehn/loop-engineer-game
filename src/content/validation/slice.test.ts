// The M1 content against the GDD lists: vertical-slice ids, starting baselines, summary (T016).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CONTENT_VERSION, content } from '../index.ts';
import { en } from '../strings/en.ts';
import { parseSliceDoc, sliceOf } from '../testing/slice-doc.ts';
import type { HarnessDef, SystemPromptDef } from '../types/harness.ts';
import { validateContent } from '../validate.ts';
import type { SliceIds } from './slice.ts';
import { summarize } from './summary.ts';

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8');
const strings = en as Readonly<Record<string, string | undefined>>;
const slice = sliceOf(read('../../../docs/game/vertical-slice.md'));

const SLICE_COUNTS = {
  tools: 12,
  skills: 8,
  memories: 4,
  events: 4,
  encounters: 12,
  harnesses: 2,
  prompts: 3,
} as const satisfies Record<keyof SliceIds, number>;

/** Ids of a kind that belong to M1: items with a milestone flag must have milestone 1. */
const m1Ids = (items: readonly { readonly id: string; readonly milestone?: number }[]) =>
  items.filter((x) => x.milestone === undefined || x.milestone === 1).map((x) => x.id);

describe('vertical slice', () => {
  it('M1 ids match the vertical slice', () => {
    for (const [kind, n] of Object.entries(SLICE_COUNTS)) {
      const listed = slice[kind as keyof SliceIds];
      expect(listed, kind).toHaveLength(n);
      expect(m1Ids(content[kind as keyof SliceIds]).sort(), kind).toEqual([...listed].sort());
    }
    expect(slice.encounters).toContain('p1e5');
    expect(slice.encounters).toContain('p1b');
    expect(slice.harnesses).toEqual(['terminal_purist', 'ide_companion']);
  });

  it('id ranges in the slice table need one prefix', () => {
    const table = (cell: string) =>
      ['Tools', 'Skills', 'Memories', 'Events', 'Encounters', 'Harnesses', 'System prompts']
        .map((area) => `| ${area} | ${cell} |`)
        .join('\n');
    const md = (cell: string) => `## In scope\n\n${table(cell)}\n\n## Next\n`;
    const same = (n: string) => n;
    expect(parseSliceDoc(md('`p1e1`–`p1e3`'), same).tools).toEqual(['p1e1', 'p1e2', 'p1e3']);
    expect(() => parseSliceDoc(md('`p1e1`–`p2e3`'), same)).toThrow('bad id range');
  });

  it('the M1 content passes validation rules 1-5', () => {
    expect(validateContent(content, { milestone: 1, slice })).toEqual([]);
  });
});

/** Baseline B and window W at run start (docs/game/systems/context.md "Baseline"). */
function startingBaseline(h: HarnessDef, p: SystemPromptDef) {
  const weightOf =
    (list: readonly { readonly id: string; readonly weight: number }[]) => (id: string) =>
      list.find((x) => x.id === id)?.weight ?? Number.NaN;
  const tools = h.tools.map(weightOf(content.tools));
  const skills = h.skills.map(weightOf(content.skills));
  const B = [h.model.baseWeight, p.weight, ...tools, ...skills].reduce((a, b) => a + b, 0);
  const windowMods = p.rules
    .flatMap((r) => (r.when.on === 'passive' && !r.if ? r.then : []))
    .flatMap((e) => (e.do === 'mod' && e.stat === 'window' ? [e.v] : []));
  const W = windowMods.reduce((a, b) => a + b, h.model.window);
  return { B, W };
}

describe('harness start', () => {
  const doc = read('../../../docs/game/content/harnesses.md');
  const section = doc.slice(doc.indexOf('## Starting baselines'));
  const rows = section.split('\n').filter((l) => l.startsWith('| '));
  const cells = (l: string) =>
    l
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());
  const promptIds = cells(rows[0] ?? '').slice(1);

  it('starting baselines', () => {
    let checked = 0;
    for (const h of content.harnesses) {
      const row = rows.map(cells).find((r) => r[0] === strings[`harness.${h.id}.name`]);
      expect(row, h.id).toBeDefined();
      for (const [i, id] of promptIds.entries()) {
        const prompt = content.prompts.find((p) => p.id === id);
        if (!prompt) throw new Error(`no prompt ${id}`);
        const { B, W } = startingBaseline(h, prompt);
        const cell = `${B} / ${W} (${Math.round((B * 100) / W)}%)`;
        expect(cell, `${h.id} + ${id}`).toBe(row?.[i + 1]);
        // Every M1 starter combination starts Focused (harnesses.md).
        expect(B * 100 >= W * 25 && B * 100 < W * 70, `${h.id} + ${id} Focused`).toBe(true);
        checked++;
      }
    }
    expect(checked).toBe(6);
  });
});

describe('content summary', () => {
  it('counts per kind, rarity and pool match the snapshot', () => {
    expect(summarize(content)).toMatchInlineSnapshot(`
      {
        "encounters": 12,
        "encounters.p1.boss": 1,
        "encounters.p1.easy": 5,
        "encounters.p1.elite": 1,
        "encounters.p1.hard": 5,
        "enemies": 14,
        "events": 4,
        "harnesses": 2,
        "lessons": 10,
        "memories": 4,
        "memories.common": 2,
        "memories.rare": 1,
        "memories.uncommon": 1,
        "prompts": 3,
        "skills": 8,
        "skills.common": 4,
        "skills.rare": 2,
        "skills.uncommon": 2,
        "tools": 12,
        "tools.common": 7,
        "tools.rare": 1,
        "tools.uncommon": 4,
      }
    `);
  });

  it('CONTENT_VERSION is an exported integer', () => {
    expect(Number.isInteger(CONTENT_VERSION)).toBe(true);
    expect(CONTENT_VERSION).toBeGreaterThanOrEqual(1);
  });
});
