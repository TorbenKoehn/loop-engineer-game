// The M1 events, modifiers and lessons against docs/game/content (T015).
import { describe, expect, it } from 'vitest';
import { enemies } from '../enemies/index.ts';
import { FAMILY_MEMBERS, lessons } from '../lessons.ts';
import { en } from '../strings/en.ts';
import { describeRule } from '../text.ts';
import { tools } from '../tools/index.ts';
import type { EventDef } from '../types/event.ts';
import { events } from './index.ts';
import { chance } from './outcome.ts';

const strings = en as Readonly<Record<string, string | undefined>>;
const ev = (id: string): EventDef => {
  const found = events.find((e) => e.id === id);
  if (!found) throw new Error(`missing event ${id}`);
  return found;
};

describe('M1 events', () => {
  it('M1 events match the catalogue', () => {
    expect(events.map((e) => e.id)).toEqual([
      'quick_tiny_change',
      'pasted_log',
      'underflow_answer',
      'green_locally',
    ]);
    expect(events.map((e) => e.phases)).toEqual([
      [1, 2, 3],
      [1, 2, 3],
      [1, 2],
      [1, 2, 3],
    ]);
    for (const e of events) {
      expect(e.milestone).toBe(1);
      expect(e.unlock).toBe('base');
    }

    expect(ev('quick_tiny_change').choices).toEqual([
      {
        id: 'sure',
        outcomes: [
          { do: 'credits', n: 25 },
          { do: 'nextFight', mod: { mod: 'addEnemy', enemy: 'scope_creep', count: 1, fights: 2 } },
        ],
      },
      { id: 'ask_ticket', outcomes: [] },
    ]);
    expect(ev('pasted_log').choices).toEqual([
      {
        id: 'read_all',
        outcomes: [
          {
            do: 'version',
            tool: { pick: 'leftmost', tag: 'Search' },
            n: 1,
            otherwise: [{ do: 'gainTool', tool: 'grep' }],
          },
          { do: 'nextFight', mod: { mod: 'startNoise', tokens: 20 } },
        ],
      },
      { id: 'ask_relevant', outcomes: [{ do: 'credits', n: 8 }] },
    ]);
    expect(ev('underflow_answer').choices).toEqual([
      {
        id: 'copy_it',
        outcomes: [{ do: 'gainTool', rarity: ['uncommon'] }, chance(50, [{ do: 'trust', n: -8 }])],
      },
      { id: 'read_comments', outcomes: [{ do: 'credits', n: 5 }] },
    ]);
    expect(ev('green_locally').choices).toEqual([
      { id: 'ship_it', outcomes: [{ do: 'trust', n: 20 }] },
      { id: 'set_up_ci', cost: 15, outcomes: [{ do: 'slot', kind: 'memory', n: 1 }] },
      {
        id: 'one_more_test',
        needsTag: 'Test',
        outcomes: [{ do: 'version', tool: { pick: 'leftmost', tag: 'Test' }, n: 1 }],
      },
    ]);
  });

  it('references existing enemies and tools', () => {
    const enemyIds = new Set<string>(enemies.map((e) => e.id));
    const toolIds = new Set<string>(tools.map((t) => t.id));
    expect(enemyIds.has('scope_creep')).toBe(true);
    expect(toolIds.has('grep')).toBe(true);
  });

  it('every event setup line and choice has a string key', () => {
    for (const e of events) {
      expect(strings[`event.${e.id}.setup`], e.id).toBeTruthy();
      expect(strings[`event.${e.id}.setup`]?.split('\n').length).toBeLessThanOrEqual(3);
      for (const c of e.choices) {
        expect(strings[`event.${e.id}.choice.${c.id}`], `${e.id}.${c.id}`).toBeTruthy();
      }
    }
  });
});

describe('lessons', () => {
  const FAMILIES = ['Bugs', 'Context', 'Infra', 'Process', 'Sandbox'] as const;

  it('all 10 lessons exist with family, line key and rule', () => {
    expect(lessons.map((l) => l.id)).toEqual(
      FAMILIES.flatMap((f) => [`${f.toLowerCase()}_off`, `${f.toLowerCase()}_def`]),
    );
    for (const l of lessons) {
      expect(l.id.startsWith(l.family.toLowerCase()), l.id).toBe(true);
      expect(l.rules).toHaveLength(1);
      expect(strings[`lesson.${l.id}.line`], l.id).toBeTruthy();
      expect(describeRule(l.rules[0] as never).length, l.id).toBeGreaterThan(0);
    }
  });

  it('numeric lessons use the documented percentages', () => {
    const rule = (id: string) => lessons.find((l) => l.id === id)?.rules[0];
    expect(rule('bugs_off')?.then).toEqual([
      { do: 'mod', stat: 'dmgPct', v: 15, filter: { family: 'Bugs' } },
    ]);
    expect(rule('sandbox_def')?.then).toEqual([
      { do: 'mod', stat: 'dmgTakenPct', v: -20, filter: { family: 'Sandbox' } },
    ]);
  });

  it('the family table covers every defined enemy in its own family', () => {
    for (const e of enemies) {
      expect(FAMILY_MEMBERS[e.family], e.id).toContain(e.id);
    }
    const all = FAMILIES.flatMap((f) => FAMILY_MEMBERS[f]);
    expect(new Set(all).size).toBe(all.length);
  });
});
