import { describe, expect, it } from 'vitest';
import { content } from '../../../content/index.ts';
import { en } from '../../../content/strings/en.ts';
import { blockText, outcomeLines } from './outcome-text.ts';

const choice = (event: string, id: string) => {
  const c = content.events.find((e) => e.id === event)?.choices.find((x) => x.id === id);
  if (!c) throw new Error(`${event}.${id}`);
  return c;
};

describe('Standup outcome text (events.md: exact outcomes before the click)', () => {
  it('states every M1 outcome in plain English', () => {
    expect(outcomeLines(choice('quick_tiny_change', 'sure').outcomes)).toEqual([
      '+25 Credits',
      'Your next 2 fights add 1 Scope Creep at the back',
    ]);
    expect(outcomeLines(choice('quick_tiny_change', 'ask_ticket').outcomes)).toEqual([
      'Nothing happens',
    ]);
    expect(outcomeLines(choice('pasted_log', 'read_all').outcomes)).toEqual([
      'Your leftmost Search tool +1 version (none: gain grep)',
      'Next fight starts with +20 noise',
    ]);
    expect(outcomeLines(choice('underflow_answer', 'copy_it').outcomes)).toEqual([
      'Gain a random uncommon tool',
      '50%: lose 8 Trust',
    ]);
    expect(outcomeLines(choice('green_locally', 'ship_it').outcomes)).toEqual(['Restore 20 Trust']);
    expect(outcomeLines(choice('green_locally', 'set_up_ci').outcomes)).toEqual(['+1 memory slot']);
  });

  it('covers modifiers, version filters and roll lists', () => {
    expect(
      outcomeLines([
        { do: 'nextFight', mod: { mod: 'addEnemy', enemy: 'scope_creep', count: 2, fights: 1 } },
        { do: 'nextFight', mod: { mod: 'startSignal', tokens: 12 } },
        { do: 'nextFight', mod: { mod: 'tagBonus', tag: 'Search', pct: 20 } },
        { do: 'version', tool: { pick: 'random', maxVersion: 2 }, n: 1 },
        { do: 'version', tool: { pick: 'random', minVersion: 2 }, n: -1 },
        { do: 'gainTool', rarity: ['uncommon', 'rare'] },
        { do: 'credits', n: -15 },
      ]),
    ).toEqual([
      'The next fight adds 2 Scope Creep at the back',
      'Next fight starts with +12 signal',
      'Your Search tools get +20% next fight',
      'A random tool below v3 +1 version',
      'A random tool above v1 -1 version',
      'Gain a random uncommon or rare tool',
      'Lose 15 Credits',
    ]);
  });

  it('states the reason of a disabled choice', () => {
    expect(blockText('insufficientCredits', choice('green_locally', 'set_up_ci'), 4)).toBe(
      'Need 11 more Credits',
    );
    expect(blockText('missingTag', choice('green_locally', 'one_more_test'), 4)).toBe(
      'Needs a Test tool equipped',
    );
  });

  it('every event has a speaker for the #standup thread', () => {
    const strings: Record<string, string> = en;
    for (const e of content.events) expect(strings[`event.${e.id}.speaker`], e.id).toBeTruthy();
  });
});
