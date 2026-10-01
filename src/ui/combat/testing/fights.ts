// Reference fights for combat UI tests. Test support only: the CombatInput comes from run
// state through combatInput (src/run/combat/combat.ts), exactly like a fight node in a real run.
import { content } from '../../../content/index.ts';
import type { Action } from '../../../run/actions.ts';
import { apply, legalActions } from '../../../run/apply.ts';
import { combatInput } from '../../../run/combat/combat.ts';
import { newRun } from '../../../run/new-run.ts';
import type { RunState } from '../../../run/state.ts';
import type { CombatInput } from '../../../sim/index.ts';

export interface FightSetup {
  readonly harness: string;
  readonly encounter: string;
  readonly seed: string;
}

export const harnessIds: readonly string[] = content.harnesses.map((h) => h.id);
export const phase1EncounterIds: readonly string[] = content.encounters
  .filter((e) => e.phase === 1)
  .map((e) => e.id);

/** A fresh run on the map after picking the first offered system prompt. */
function mapState(harness: string, seed: string): RunState {
  const run = newRun(
    { seed, harness, lint: [], tutorial: false },
    {
      unlocked: [],
      lessons: [],
      lintCap: 0,
    },
  );
  const res = apply(run, legalActions(run)[0] as Action);
  if (!res.ok) throw new Error(`fights: pickPrompt failed (${res.error})`);
  return res.state;
}

/** The sim input for `encounter` at a row-1 task node of a fresh run. */
export function fightInput(setup: FightSetup): CombatInput {
  const state = mapState(setup.harness, setup.seed);
  const node = {
    id: 'p1-r1-c0',
    row: 1,
    col: 0,
    type: 'task',
    encounter: setup.encounter,
  } as const;
  return combatInput(state, node);
}
