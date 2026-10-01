// The M1 harness and prompt data against docs/game/content/harnesses.md (T011).
import { describe, expect, it } from 'vitest';
import { passive, rule } from './dsl/rule.ts';
import { harnesses } from './harnesses.ts';
import { prompts } from './prompts.ts';
import { en } from './strings/en.ts';
import { tools } from './tools/index.ts';

const strings = en as Readonly<Record<string, string | undefined>>;
const toolIds = new Set<string>(tools.map((t) => t.id));

describe('harnesses', () => {
  it('harness stats match the GDD', () => {
    const [purist, companion] = harnesses;
    expect(purist.model).toEqual({
      window: 60,
      speed: 110,
      accuracy: 'high',
      trust: 80,
      baseWeight: 4,
    });
    expect(purist.slots).toMatchObject({ tools: 6, skills: 3, memory: 2, stash: 4 });
    expect(purist.tools).toEqual(['grep', 'cat', 'sed']);
    expect(companion.model).toEqual({
      window: 100,
      speed: 100,
      accuracy: 'normal',
      trust: 100,
      baseWeight: 12,
    });
    expect(companion.slots).toMatchObject({ tools: 5, skills: 3, memory: 2, stash: 4 });
    expect(companion.tools).toEqual(['autocomplete', 'edit_file', 'lint']);
    for (const h of harnesses) {
      expect(h.unlock).toBe('base');
      expect(h.milestone).toBe(1);
      for (const t of h.tools) expect(toolIds.has(t), t).toBe(true);
    }
  });

  it('expresses Muscle Memory and Undo Stack as DSL rules', () => {
    expect(harnesses[0].trait.rules).toEqual([
      passive({ do: 'mod', stat: 'rate', v: 10, filter: { maxWeight: 3 } }),
    ]);
    expect(harnesses[1].trait.rules).toEqual([
      rule({ on: 'trustBelow', pct: 30 }, [{ do: 'guard', v: 15 }], [{ if: 'oncePerFight' }]),
    ]);
  });

  it('every harness and prompt has name, line and flavour keys in en.ts', () => {
    const items = [
      ...harnesses.map((h) => `harness.${h.id}`),
      ...prompts.map((p) => `prompt.${p.id}`),
    ];
    for (const key of items) {
      for (const part of ['name', 'line', 'flavour']) {
        expect(strings[`${key}.${part}`], `${key}.${part}`).toBeTruthy();
      }
    }
  });
});

describe('prompts', () => {
  it('prompts match the GDD', () => {
    const [senior, concise, stepByStep] = prompts;
    expect(prompts.map((p) => [p.id, p.weight])).toEqual([
      ['senior', 8],
      ['concise', 4],
      ['step_by_step', 10],
    ]);
    const effects = (p: (typeof prompts)[number]) => p.rules.flatMap((r) => r.then);
    expect(effects(senior)).toEqual([
      { do: 'mod', stat: 'dmgPct', v: 10 },
      { do: 'mod', stat: 'window', v: -10 },
    ]);
    expect(effects(concise)).toEqual([{ do: 'mod', stat: 'output', v: -1 }]);
    expect(effects(stepByStep)).toEqual([
      { do: 'custom', handler: 'double_first_resolve' },
      { do: 'mod', stat: 'rate', v: -5 },
    ]);
    for (const p of prompts) {
      expect(p.unlock).toBe('base');
      expect(p.milestone).toBe(1);
    }
  });

  it('describes the double-resolve handler in en.ts', () => {
    expect(strings['handler.double_first_resolve']).toBeTruthy();
  });
});
