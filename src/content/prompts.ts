// The M1 starter system prompts (docs/game/content/harnesses.md "System prompts").
// tenx, clarify and json_only join with E013.
import { definePrompt } from './dsl/define.ts';
import { passive } from './dsl/rule.ts';
import { base } from './dsl/unlock.ts';

export const senior = definePrompt({
  id: 'senior',
  weight: 8,
  rules: [
    passive({ do: 'mod', stat: 'dmgPct', v: 10 }),
    passive({ do: 'mod', stat: 'window', v: -10 }),
  ],
  unlock: base,
  milestone: 1,
});

export const concise = definePrompt({
  id: 'concise',
  weight: 4,
  rules: [passive({ do: 'mod', stat: 'output', v: -1 })],
  unlock: base,
  milestone: 1,
});

/** The double resolve is the registered handler `double_first_resolve`. */
export const stepByStep = definePrompt({
  id: 'step_by_step',
  weight: 10,
  rules: [
    passive({ do: 'custom', handler: 'double_first_resolve' }),
    passive({ do: 'mod', stat: 'rate', v: -5 }),
  ],
  unlock: base,
  milestone: 1,
});

export const prompts = [senior, concise, stepByStep] as const;

/** Literal union of every prompt id. */
export type PromptKey = (typeof prompts)[number]['id'];
