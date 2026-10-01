// The 5 reference fights pinned by golden.test.ts. Each is built the way a run builds it:
// a new run from content, a picked system prompt, then combatInput() on a map node. Chosen to
// cover both harnesses, win and loss, pipes, zones and compaction, statuses, Guardrails,
// spawns and Deadline overtime while staying short enough to read as a diff.
import type { FightModifier } from '../../src/content/types/event.ts';
import type { LessonId, PromptId } from '../../src/content/types/ids.ts';
import { apply } from '../../src/run/apply.ts';
import { combatInput } from '../../src/run/combat.ts';
import { reachable } from '../../src/run/map/graph.ts';
import { newRun } from '../../src/run/new-run.ts';
import type { Policy, RunState } from '../../src/run/state.ts';
import type { CombatInput } from '../../src/sim/index.ts';

export interface Reference {
  /** Fixture file name without `.jsonl`. */
  readonly name: string;
  readonly seed: string;
  readonly harness: 'terminal_purist' | 'ide_companion';
  readonly prompt: PromptId;
  readonly lessons: readonly LessonId[];
  /** Phase-1 encounter placed on the run's first reachable node. */
  readonly encounter: string;
  /** Trust left from earlier fights; absent = the harness start Trust. */
  readonly trust?: number;
  /** Next-fight modifiers from standup events. */
  readonly nextFight?: readonly FightModifier[];
  /** Compaction policy set on the map; absent = the run default (80). */
  readonly policy?: Policy;
}

export const REFERENCES: readonly Reference[] = [
  // Three Typos: pipes, a planned compaction, a quick win.
  {
    name: 'purist-typos',
    seed: 'golden-1',
    harness: 'terminal_purist',
    prompt: 'senior',
    lessons: ['bugs_off'],
    encounter: 'p1e1',
  },
  // Rate Limit throttles tools; Guardrails from the IDE starters.
  {
    name: 'companion-rate-limit',
    seed: 'golden-2',
    harness: 'ide_companion',
    prompt: 'concise',
    lessons: [],
    encounter: 'p1e3',
  },
  // Context Drift plus start noise with policy never: zone changes and auto compaction.
  {
    name: 'purist-noise',
    seed: 'golden-3',
    harness: 'terminal_purist',
    prompt: 'step_by_step',
    lessons: ['context_def'],
    encounter: 'p1e2',
    nextFight: [{ mod: 'startNoise', tokens: 12 }],
    policy: 0,
  },
  // A worn-down agent loses a hard fight on Trust.
  {
    name: 'purist-low-trust',
    seed: 'golden-4',
    harness: 'terminal_purist',
    prompt: 'senior',
    lessons: ['infra_def'],
    encounter: 'p1h4',
    trust: 8,
  },
  // The elite: Yak Shave spawns Side Quests, the fight runs into Deadline overtime.
  {
    name: 'companion-yak-shave',
    seed: 'golden-5',
    harness: 'ide_companion',
    prompt: 'concise',
    lessons: ['process_off'],
    encounter: 'p1x1',
  },
];

/** The run state right after the prompt pick, with the reference's Trust and modifiers. */
function runState(ref: Reference): RunState {
  const meta = { unlocked: [], lessons: [...ref.lessons], lintCap: 0 };
  const start = newRun({ seed: ref.seed, harness: ref.harness, lint: [], tutorial: false }, meta);
  const picked = apply(start, { t: 'pickPrompt', prompt: ref.prompt });
  if (!picked.ok) throw new Error(`${ref.name}: pickPrompt rejected: ${picked.error}`);
  const { state } = picked;
  const { trust = state.agent.trust, policy = state.agent.policy, nextFight = [] } = ref;
  return { ...state, agent: { ...state.agent, trust, policy }, nextFight: [...nextFight] };
}

/** The CombatInput a run builds for this reference fight. */
export function referenceInput(ref: Reference): CombatInput {
  const state = runState(ref);
  const id = reachable(state.map)[0];
  const node = state.map.nodes.find((n) => n.id === id);
  if (!node) throw new Error(`${ref.name}: no reachable node`);
  return combatInput(state, { ...node, encounter: ref.encounter });
}
