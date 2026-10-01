// The M1 Standup events (docs/game/content/events.md catalogue, M1 rows). The 12 M2 events
// join with E015. Resolution lives in the run reducer (E004). Strings: `event.<id>.setup`
// and `event.<id>.choice.<choiceId>` in en-events.ts.
import { defineEvent } from '../dsl/define.ts';
import { base } from '../dsl/unlock.ts';
import { chance } from './outcome.ts';

export const quickTinyChange = defineEvent({
  id: 'quick_tiny_change',
  phases: [1, 2, 3],
  unlock: base,
  milestone: 1,
  choices: [
    {
      id: 'sure',
      outcomes: [
        { do: 'credits', n: 25 },
        { do: 'nextFight', mod: { mod: 'addEnemy', enemy: 'scope_creep', count: 1, fights: 2 } },
      ],
    },
    { id: 'ask_ticket', outcomes: [] },
  ],
});

export const pastedLog = defineEvent({
  id: 'pasted_log',
  phases: [1, 2, 3],
  unlock: base,
  milestone: 1,
  choices: [
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
  ],
});

export const underflowAnswer = defineEvent({
  id: 'underflow_answer',
  phases: [1, 2],
  unlock: base,
  milestone: 1,
  choices: [
    {
      id: 'copy_it',
      outcomes: [{ do: 'gainTool', rarity: ['uncommon'] }, chance(50, [{ do: 'trust', n: -8 }])],
    },
    { id: 'read_comments', outcomes: [{ do: 'credits', n: 5 }] },
  ],
});

export const greenLocally = defineEvent({
  id: 'green_locally',
  phases: [1, 2, 3],
  unlock: base,
  milestone: 1,
  choices: [
    { id: 'ship_it', outcomes: [{ do: 'trust', n: 20 }] },
    { id: 'set_up_ci', cost: 15, outcomes: [{ do: 'slot', kind: 'memory', n: 1 }] },
    {
      id: 'one_more_test',
      needsTag: 'Test',
      outcomes: [{ do: 'version', tool: { pick: 'leftmost', tag: 'Test' }, n: 1 }],
    },
  ],
});

export const events = [quickTinyChange, pastedLog, underflowAnswer, greenLocally] as const;

/** Literal union of every event id in the catalogue. */
export type EventKey = (typeof events)[number]['id'];
