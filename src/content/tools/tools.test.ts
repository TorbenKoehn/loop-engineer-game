// The M1 tool data against the catalogue tables in docs/game/content/tools.md (T012).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { en } from '../strings/en.ts';
import { describeTool } from '../text.ts';
import type { Effect, TargetSel, ToolDef } from '../types/index.ts';
import { EFFECT_KINDS } from '../types/index.ts';
import { tools } from './index.ts';

const doc = readFileSync(new URL('../../../docs/game/content/tools.md', import.meta.url), 'utf8');
const strings = en as Readonly<Record<string, string | undefined>>;

const RARITY: Readonly<Record<string, ToolDef['rarity']>> = {
  C: 'common',
  U: 'uncommon',
  R: 'rare',
};
const TARGET: Readonly<Record<string, TargetSel>> = {
  front: 'front',
  back: 'back',
  lowest: 'lowest',
  all: 'all',
  self: 'self',
  tool: 'tool',
  'right tool': 'rightTool',
  'all tools': 'tools',
};
const TRIPLE = /\d+\/\d+\/\d+/g;

/** A catalogue row in ToolDef terms; `triples` are the v1/v2/v3 values in column order. */
function parseRow(line: string) {
  const [id, tags, rar, wt, cd, out, pipe, target, effect, unlock, m1] = line
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim());
  return {
    id: id?.replaceAll('`', ''),
    tags: tags?.split(', '),
    rarity: RARITY[rar ?? ''],
    weight: Number(wt),
    cooldownMs: Number(cd),
    output: Number(out),
    pipeMs: pipe === '–' ? undefined : Number(pipe),
    target: TARGET[target ?? ''],
    triples: [...(effect ?? '').matchAll(TRIPLE)].map((m) => m[0].split('/').map(Number)),
    unlock: unlock === 'base' ? 'base' : { node: unlock?.toLowerCase().replace(/\W+/g, '_') },
    m1: m1 === 'yes',
  };
}

const rows = doc
  .split('\n')
  .filter((l) => l.startsWith('| `'))
  .map(parseRow);
const m1Rows = rows.filter((r) => r.m1);

const isV3 = (x: unknown): x is readonly number[] => Array.isArray(x) && x.length === 3;
const triplesOf = (effects: readonly Effect[]) =>
  effects.flatMap((e) =>
    Object.values(e)
      .filter(isV3)
      .map((v) => [...v]),
  );

function asRow(t: ToolDef) {
  const { id, tags, rarity, weight, cooldownMs, output, pipeMs, target, unlock } = t;
  const fields = { id, tags: [...tags], rarity, weight, cooldownMs, output, pipeMs, target };
  return { ...fields, triples: triplesOf(t.effects), unlock, m1: t.milestone === 1 };
}

function hasFunction(value: unknown): boolean {
  if (typeof value === 'function') return true;
  if (typeof value !== 'object' || value === null) return false;
  return Object.values(value).some(hasFunction);
}

const byId = (id: string): ToolDef => {
  const tool = tools.find((t) => t.id === id);
  if (!tool) throw new Error(`no tool ${id}`);
  return tool;
};

describe('tool catalogue data', () => {
  it('M1 tools match the catalogue', () => {
    expect(rows).toHaveLength(36);
    expect(m1Rows).toHaveLength(12);
    expect(tools.map((t) => t.id)).toEqual(m1Rows.map((r) => r.id));
    for (const tool of tools) {
      const row = m1Rows.find((r) => r.id === tool.id);
      expect(asRow(tool), tool.id).toEqual(row);
    }
  });

  it('brute_force needs an unlock node, the other 11 tools are base', () => {
    expect(byId('brute_force').unlock).toEqual({ node: 'power_tools' });
    const others = tools.filter((t) => t.id !== 'brute_force');
    expect(others).toHaveLength(11);
    for (const t of others) expect(t.unlock, t.id).toBe('base');
  });

  it('special rules are DSL effects, never code in data', () => {
    expect(byId('read_file').effects).toContainEqual({
      do: 'prime',
      filter: { tag: 'Edit' },
      pct: [30, 45, 60],
    });
    expect(byId('retry_with_backoff').effects).toEqual([
      { do: 'clearStatus', status: 'throttle', sel: 'longestCharge' },
      { do: 'status', status: 'haste', ms: [2000, 3000, 4000], sel: 'longestCharge' },
    ]);
    expect(byId('brute_force').effects).toEqual([
      { do: 'dmg', v: [6, 9, 13], perSignalTenth: [1, 2, 3] },
    ]);
    expect(byId('summarize').effects[0]).toEqual({ do: 'removeCtx', v: [10, 14, 18] });
    for (const t of tools) {
      expect(hasFunction(t), t.id).toBe(false);
      for (const e of t.effects) expect(EFFECT_KINDS, t.id).toContain(e.do);
    }
  });

  it('flavour strings equal tools.md "Flavour lines (M1 tools)"', () => {
    const section = doc.slice(doc.indexOf('## Flavour lines (M1 tools)'));
    const lines = [...section.matchAll(/`([a-z_]+)` "([^"]+)"/g)];
    expect(lines.map((m) => m[1]).sort()).toEqual(tools.map((t) => t.id).sort());
    for (const [, id, text] of lines) {
      expect(strings[`tool.${id}.flavour`], id).toBe(text);
      expect(strings[`tool.${id}.name`], id).toBe(id);
    }
  });

  it('every tool renders its plain-English line at v1, v2 and v3', () => {
    for (const t of tools) {
      for (const v of [1, 2, 3] as const) expect(describeTool(t, v)).not.toMatch(/[{}]/);
    }
    expect(describeTool(byId('read_file'), 2)).toBe(
      'Deal 12 damage to the front enemy and your next Edit tool hits 45% harder.',
    );
    expect(describeTool(byId('retry_with_backoff'), 3)).toBe(
      'Clear Throttle from your tool with the longest charge left and ' +
        'Haste your tool with the longest charge left for 4000 ms.',
    );
    expect(describeTool(byId('summarize'), 1)).toBe(
      'Remove 10 context (noise first) and gain 3 Guardrails.',
    );
  });
});
