// The M1 harnesses (docs/game/content/harnesses.md "Harness stats", "Traits").
// Swarm Orchestrator and YOLO Mode join with E013.
import { defineHarness } from './dsl/define.ts';
import { passive, rule } from './dsl/rule.ts';
import { base } from './dsl/unlock.ts';

/** Tools with weight 3 or less charge 10 faster. */
export const terminalPurist = defineHarness({
  id: 'terminal_purist',
  model: { window: 60, speed: 110, accuracy: 'high', trust: 80, baseWeight: 4 },
  slots: { tools: 6, skills: 3, memory: 2, stash: 4 },
  tools: ['grep', 'cat', 'sed'],
  skills: ['unix_philosophy'],
  trait: {
    id: 'muscle_memory',
    rules: [passive({ do: 'mod', stat: 'rate', v: 10, filter: { maxWeight: 3 } })],
  },
  unlock: base,
  milestone: 1,
});

/** Once per fight, a hit that leaves Trust below 30% of max grants 15 Guardrails. */
export const ideCompanion = defineHarness({
  id: 'ide_companion',
  model: { window: 100, speed: 100, accuracy: 'normal', trust: 100, baseWeight: 12 },
  slots: { tools: 5, skills: 3, memory: 2, stash: 4 },
  tools: ['autocomplete', 'edit_file', 'lint'],
  skills: ['inline_suggestions'],
  trait: {
    id: 'undo_stack',
    rules: [
      rule({ on: 'trustBelow', pct: 30 }, [{ do: 'guard', v: 15 }], [{ if: 'oncePerFight' }]),
    ],
  },
  unlock: base,
  milestone: 1,
});

export const harnesses = [terminalPurist, ideCompanion] as const;

/** Literal union of every harness id. */
export type HarnessKey = (typeof harnesses)[number]['id'];
