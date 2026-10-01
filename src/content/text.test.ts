import { describe, expect, it } from 'vitest';
import { defineEnemy, defineTool } from './dsl/define.ts';
import { passive, rule } from './dsl/rule.ts';
import { base } from './dsl/unlock.ts';
import { en } from './strings/en.ts';
import { render } from './text/fill.ts';
import { describeEffect, describeEnemy, describeRule, describeTool } from './text.ts';
import type { Effect } from './types/dsl.ts';

const grep = defineTool({
  id: 'grep',
  tags: ['Search', 'Shell'],
  rarity: 'common',
  weight: 3,
  cooldownMs: 3000,
  output: 1,
  pipeMs: 1000,
  target: 'front',
  effects: [{ do: 'dmg', v: [6, 9, 13] }],
  unlock: base,
  milestone: 1,
});

const runTests = defineTool({
  id: 'run_tests',
  tags: ['Test'],
  rarity: 'uncommon',
  weight: 6,
  cooldownMs: 6000,
  output: 4,
  target: 'all',
  effects: [
    { do: 'dmg', v: [8, 12, 17] },
    { do: 'guard', v: [4, 6, 9] },
  ],
  unlock: base,
  milestone: 1,
});

describe('generated text', () => {
  it('describes Grep First', () => {
    const grepFirst = rule({ on: 'toolFired', tag: 'Search' }, [
      { do: 'prime', filter: { tag: 'Edit' }, pct: 50 },
    ]);
    expect(describeRule(grepFirst)).toBe(
      'After a Search tool fires, your next Edit tool hits 50% harder.',
    );
  });

  it('describes a tool at each version', () => {
    expect(describeTool(grep, 1)).toBe('Deal 6 damage to the front enemy.');
    expect(describeTool(grep, 2)).toBe('Deal 9 damage to the front enemy.');
    expect(describeTool(grep, 3)).toBe('Deal 13 damage to the front enemy.');
    expect(describeTool(runTests, 3)).toBe('Deal 17 damage to all enemies and gain 9 Guardrails.');
  });

  it('describes passive, conditioned and multi-effect rules', () => {
    expect(describeRule(passive({ do: 'mod', stat: 'rate', v: 5 }))).toBe('Charge rate +5.');
    const muscle = passive({ do: 'mod', stat: 'rate', v: 10, filter: { maxWeight: 3 } });
    expect(describeRule(muscle)).toBe('Charge rate +10 for tools with weight 3 or less.');
    const summarizer = rule({ on: 'compaction' }, [
      { do: 'guard', v: 8 },
      { do: 'status', status: 'haste', ms: 2000, sel: 'leftmost' },
    ]);
    expect(describeRule(summarizer)).toBe(
      'On any compaction, gain 8 Guardrails and Haste your leftmost tool for 2000 ms.',
    );
    const breaker = rule(
      { on: 'damaged', min: 10 },
      [{ do: 'guard', v: 8 }],
      [{ if: 'cooldown', ms: 3000 }],
    );
    const three = rule({ on: 'fightStart' }, [
      { do: 'guard', v: 2 },
      { do: 'heal', v: 3 },
      { do: 'compact' },
    ]);
    expect(describeRule(three)).toBe(
      'At the start of each fight, gain 2 Guardrails, restore 3 Trust and compact the context now.',
    );
    expect(describeRule(breaker)).toBe(
      'When an enemy hit deals at least 10 damage, gain 8 Guardrails (at most once per 3000 ms).',
    );
  });

  it('renders every effect kind without leftover placeholders', () => {
    const effects: Effect[] = [
      { do: 'dmg', v: [6, 9, 13], perSignalTenth: [1, 2, 3] },
      { do: 'heal', v: 10 },
      { do: 'prime', filter: {}, pct: [40, 60, 80], count: 2 },
      { do: 'status', status: 'stun', ms: 1500, sel: { tag: 'Shell' } },
      { do: 'charge', ms: 1500, sel: 'rightTool' },
      { do: 'removeCtx', v: [10, 14, 18] },
      { do: 'compact' },
      { do: 'summon', v: [5, 7, 10], lifeMs: 6000, everyMs: 1500, report: 4 },
      { do: 'mod', stat: 'slots.tool', v: -1, filter: { tag: 'Web', family: 'Bugs' } },
    ];
    const lines = effects.map((e) => describeEffect(e, { version: 2 }));
    expect(lines.join(' ')).not.toMatch(/[{}]/);
    expect(lines[0]).toBe('Deal 9 (+2 per 10% of the window in Signal) damage to the front enemy.');
    expect(lines[2]).toBe('Your next tool hits 60% harder (2 times).');
  });

  it('describes enemy traits and intents', () => {
    const hell = defineEnemy({
      id: 'dependency_hell',
      family: 'Process',
      homePhase: 1,
      sev: 120,
      traits: [{ trait: 'split', n: 2, pct: 50, child: 'transitive_dep' }],
      cycle: [
        {
          id: 'conflict',
          windupMs: 4000,
          verbs: [
            { verb: 'hit', n: 3 },
            { verb: 'throttle', sel: 'all', ms: 2000 },
          ],
        },
      ],
      art: ['(dep)'],
    });
    expect(describeEnemy(hell)).toEqual({
      traits: ['When resolved, splits into 2 transitive_dep at 50% Severity.'],
      intents: ['Hit for 3 and Throttle all your tools for 2000 ms.'],
    });
  });

  it('render throws on a missing key or param', () => {
    expect(() => render(en, 'effect.nope')).toThrow(/Missing string key/);
    expect(() => render(en, 'effect.dmg', { n: 1 })).toThrow(/\{target\}/);
  });
});
