// Greedy event scoring: a rough worth per Standup outcome; Trust counts double while low.
import type { EventChoice, FightModifier, Outcome } from '../../../src/content/types/event.ts';

type Scorer<K extends Outcome['do']> = (o: Extract<Outcome, { do: K }>, low: boolean) => number;

function modScore(m: FightModifier): number {
  if (m.mod === 'addEnemy') return -10 * m.count;
  return m.mod === 'startNoise' ? -m.tokens / 2 : 2;
}

const GAIN = 8;
const OUTCOME: { readonly [K in Outcome['do']]: Scorer<K> } = {
  credits: (o) => o.n / 2,
  trust: (o, low) => o.n * (low ? 2 : 1),
  maxTrust: (o) => o.n * 5,
  slot: (o) => o.n * 5,
  version: (o) => o.n * 10,
  gainTool: () => GAIN,
  gainSkill: () => GAIN,
  gainMemory: () => GAIN,
  deleteTool: () => -15,
  chance: (o, low) => (o.pct * outcomesScore(o.then, low)) / 100,
  nextFight: (o) => modScore(o.mod),
  custom: () => 0,
};

function outcomesScore(outcomes: readonly Outcome[], low: boolean): number {
  return outcomes.reduce((sum, o) => sum + (OUTCOME[o.do] as Scorer<Outcome['do']>)(o, low), 0);
}

/** Worth of an event choice: its outcomes minus half its credit cost. */
export const choiceScore = (choice: EventChoice, lowTrust: boolean): number =>
  outcomesScore(choice.outcomes, lowTrust) - (choice.cost ?? 0) / 2;
