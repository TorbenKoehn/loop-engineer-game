// Content validation rules 1-6 (docs/architecture/content-model.md "Validation"): the real
// content passes, and one failing fixture per rule proves the check bites (T016).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { passive } from './dsl/rule.ts';
import { unlockedBy } from './dsl/unlock.ts';
import { type Content, content } from './index.ts';
import { en, type Strings } from './strings/en.ts';
import { sliceOf } from './testing/slice-doc.ts';
import type { EncounterDef, Intent } from './types/enemy.ts';
import type { ToolDef } from './types/items.ts';
import { compareSummary, summarize, type ValidateOptions, validateContent } from './validate.ts';

const doc = readFileSync(new URL('../../docs/game/vertical-slice.md', import.meta.url), 'utf8');
const slice = sliceOf(doc);
const M1: ValidateOptions = { milestone: 1, slice };

const errorsOf = (patch: Partial<Content>, options: Partial<ValidateOptions> = {}) =>
  validateContent({ ...content, ...patch }, { ...M1, ...options });

/** `xs` with the item `id` patched (content is frozen, so this copies). */
const patched = <T extends { readonly id: string }>(xs: readonly T[], id: string, p: Partial<T>) =>
  xs.map((x) => (x.id === id ? { ...x, ...p } : x));

const withoutKey = (key: string): Strings =>
  Object.fromEntries(Object.entries(en).filter(([k]) => k !== key)) as unknown as Strings;

const [grep] = content.tools;
if (!grep) throw new Error('no tools');
const encounter = (id: string, pool: EncounterDef['pool'], enemies: readonly string[]) => ({
  id,
  phase: 1 as const,
  pool,
  enemies,
});

describe('validateContent', () => {
  it('passes the M1 content', () => {
    expect(validateContent(content, M1)).toEqual([]);
  });

  it('rule 1: ids are unique and every referenced id exists', () => {
    expect(errorsOf({ tools: [...content.tools, grep] })).toEqual([
      "[rule 1] duplicate tools id 'grep'",
    ]);
    const tpyo = [encounter('p1e1', 'easy', ['tpyo']), ...content.encounters.slice(1)];
    expect(errorsOf({ encounters: tpyo })).toContain(
      "[rule 1] encounter p1e1 references unknown enemy 'tpyo'",
    );
    const starters = patched(content.harnesses, 'terminal_purist', { tools: ['grpe'] });
    expect(errorsOf({ harnesses: starters })).toContain(
      "[rule 1] harness terminal_purist references unknown tool 'grpe'",
    );
    const locked = patched(content.tools, 'grep', { unlock: unlockedBy('power_tool') });
    expect(errorsOf({ tools: locked })).toContain(
      "[rule 1] tool grep references unknown unlock node 'power_tool'",
    );
    const family = patched(content.enemies, 'typo', { family: 'Infra' });
    expect(errorsOf({ enemies: family })).toContain('[rule 1] enemy typo is not in families.Infra');
  });

  it('rule 1: handler ids need a handler.<id> string and, when given, a registration', () => {
    const rules = [passive({ do: 'custom', handler: 'no_such_handler' })];
    const memories = patched(content.memories, 'cache', { rules });
    expect(errorsOf({ memories })).toContain(
      "[rule 1] memory cache: no string 'handler.no_such_handler'",
    );
    expect(errorsOf({}, { handlers: new Set(['monolith_stage']) })).toContain(
      "[rule 1] skill feedback_loop: unregistered handler 'feedback_loop'",
    );
  });

  it('rule 2: number budgets', () => {
    const tools = patched(content.tools, 'grep', {
      weight: 7,
      cooldownMs: 1025,
      output: 11,
      effects: [{ do: 'dmg', v: [9, 6, 13] }],
    });
    expect(errorsOf({ tools })).toEqual([
      '[rule 2] tool grep: weight 7 outside 0-6',
      '[rule 2] tool grep: cooldownMs 1025',
      '[rule 2] tool grep: output 11 outside -20..10',
      '[rule 2] tool grep: dmg.v [9, 6, 13] decreases',
    ]);
    const fast: Intent = { id: 'nitpick', windupMs: 900, verbs: [{ verb: 'hit', n: 2 }] };
    const enemies = patched(content.enemies, 'typo', { sev: 0, cycle: [fast] });
    expect(errorsOf({ enemies })).toEqual([
      '[rule 2] enemy typo.nitpick: windupMs 900',
      '[rule 2] enemy typo: Severity 0 must be > 0',
    ]);
  });

  it('rule 3: 1-2 tags per tool and name, line and flavour keys for every item', () => {
    const tools = patched(content.tools, 'grep', {
      tags: ['Search', 'Shell', 'Edit'] as unknown as ToolDef['tags'],
    });
    expect(errorsOf({ tools })).toEqual([
      '[rule 3] tool grep: needs 1-2 distinct tags, has [Search, Shell, Edit]',
    ]);
    expect(errorsOf({}, { strings: withoutKey('tool.grep.flavour') })).toEqual([
      "[rule 3] missing string 'tool.grep.flavour'",
    ]);
    expect(errorsOf({}, { strings: withoutKey('prompt.concise.line') })).toEqual([
      "[rule 3] missing string 'prompt.concise.line'",
    ]);
    const noStat = errorsOf({}, { strings: withoutKey('stat.rate') });
    expect(noStat).toContain("[rule 3] missing string 'stat.rate'");
    expect(noStat).toContain('[rule 3] memory keyboard_shortcuts: Missing string key: stat.rate');
  });

  it('rule 4: encounter size and pools per phase', () => {
    const crowd = encounter('p1e1', 'easy', Array(6).fill('typo'));
    expect(errorsOf({ encounters: [crowd, ...content.encounters.slice(1)] })).toEqual([
      '[rule 4] encounter p1e1: 6 enemies (1-5)',
    ]);
    const twoBosses = [...content.encounters, encounter('p1b2', 'boss', ['legacy_monolith'])];
    expect(errorsOf({ encounters: twoBosses })).toEqual([
      '[rule 4] phase 1 has 2 boss encounters, needs exactly 1',
    ]);
    const m2 = errorsOf({}, { milestone: 2 });
    expect(m2).toContain('[rule 4] phase 1 has 1 elite encounters, needs >= 2');
    expect(m2).toContain('[rule 4] phase 2 has 0 easy encounters, needs >= 5');
  });

  it('rule 5: milestone flags match the slice lists', () => {
    const tools = patched(content.tools, 'grep', { milestone: 2 });
    expect(errorsOf({ tools })).toEqual([
      '[rule 5] tools grep has milestone 2 but is listed in the M1 slice',
    ]);
    const shorter = { ...slice, prompts: ['senior', 'concise'] };
    expect(errorsOf({}, { slice: shorter })).toEqual([
      '[rule 5] prompts step_by_step has milestone 1 but is missing from the M1 slice',
    ]);
    const extra = { ...slice, skills: [...slice.skills, 'batching'] };
    expect(errorsOf({}, { slice: extra })).toEqual([
      "[rule 5] slice skills 'batching' is not defined",
    ]);
  });

  it('rule 6: the summary shows an accidental deletion', () => {
    const before = summarize(content);
    const after = summarize({ ...content, tools: content.tools.filter((t) => t.id !== 'grep') });
    expect(compareSummary(before, before)).toEqual([]);
    expect(compareSummary(before, after)).toEqual([
      '[rule 6] tools: 12 -> 11',
      '[rule 6] tools.common: 7 -> 6',
    ]);
  });
});
