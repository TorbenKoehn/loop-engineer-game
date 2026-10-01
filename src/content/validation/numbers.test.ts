// Rule 2 `every` intervals (R054 F3): a rule interval must be a whole number of 50 ms ticks,
// else `every` would only fire at the least common multiple with the tick.
import { describe, expect, it } from 'vitest';
import { rule } from '../dsl/rule.ts';
import { type Content, content } from '../index.ts';
import { checkNumbers } from './numbers.ts';

const withEvery = (ms: number): Content => {
  const [first, ...rest] = content.skills;
  if (!first) throw new Error('no skills');
  const rules = [rule({ on: 'every', ms }, [{ do: 'guard', v: 1 }])];
  return { ...content, skills: [{ ...first, rules }, ...rest] };
};

describe('rule 2: every intervals', () => {
  it('accepts multiples of 50 ms', () => {
    expect(checkNumbers(withEvery(1000))).toEqual([]);
    expect(checkNumbers(withEvery(50))).toEqual([]);
  });

  it('rejects intervals that are not a positive multiple of 50 ms', () => {
    const id = content.skills[0]?.id;
    expect(checkNumbers(withEvery(1025))).toEqual([
      `[rule 2] skill ${id}: every.ms 1025 is not a multiple of 50`,
    ]);
    expect(checkNumbers(withEvery(0))).toHaveLength(1);
  });
});
