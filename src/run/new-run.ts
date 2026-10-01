// Run start: copy meta into the setup snapshot and equip the harness starters.
// See docs/architecture/run-state.md#reducer.
import { content } from '../content/index.ts';
import type { HarnessDef } from '../content/types/harness.ts';
import type { PromptId } from '../content/types/ids.ts';
import type { UnlockId, UnlockRef } from '../content/types/refs.ts';
import { generateMap } from './map/generate.ts';
import type { MetaView, RunSetup, RunState, SetupSnapshot } from './state.ts';

/** Credits at run start (docs/game/systems/economy.md). */
export const START_CREDITS = 10;
const PROMPT_OFFER = 3;

function isUnlocked(ref: UnlockRef, unlocked: readonly UnlockId[]): boolean {
  return ref === 'base' || unlocked.includes(ref.node);
}

function harnessDef(snap: SetupSnapshot): HarnessDef {
  const def = content.harnesses.find((h) => h.id === snap.harness);
  if (!def || !isUnlocked(def.unlock, snap.unlocked)) {
    throw new RangeError(`newRun: harness '${snap.harness}' is unknown or locked`);
  }
  return def;
}

/** The system prompts offered at run start: the first 3 unlocked, in content order. */
export function promptOffer(unlocked: readonly UnlockId[]): PromptId[] {
  return content.prompts
    .filter((p) => isUnlocked(p.unlock, unlocked))
    .slice(0, PROMPT_OFFER)
    .map((p) => p.id);
}

/** The state before the first action. Depends only on the snapshot (used by replay). */
export function initialState(setup: SetupSnapshot): RunState {
  const snap: SetupSnapshot = { ...setup, prompt: null };
  const h = harnessDef(snap);
  return {
    v: 1,
    setup: snap,
    mode: 'promptPick',
    phase: 1,
    loop: 0,
    map: generateMap(snap.seed, 1, snap.tutorial),
    agent: {
      trust: h.model.trust,
      maxTrust: h.model.trust,
      credits: START_CREDITS,
      tools: h.tools.map((id) => ({ id, version: 1, weightMod: 0 })),
      skills: [...h.skills],
      memories: [],
      stash: [],
      slots: { ...h.slots },
      policy: 80,
      oncePerRun: [],
    },
    pending: { kind: 'promptOffer', prompts: promptOffer(snap.unlocked) },
    stats: { nodesVisited: 0 },
  };
}

export function newRun(setup: RunSetup, meta: MetaView): RunState {
  if (setup.lint.length > meta.lintCap) {
    throw new RangeError(`newRun: ${setup.lint.length} lint rules exceed the cap ${meta.lintCap}`);
  }
  return initialState({
    seed: setup.seed,
    harness: setup.harness,
    prompt: null,
    lint: [...setup.lint],
    unlocked: [...meta.unlocked],
    lessons: [...meta.lessons],
    tutorial: setup.tutorial,
  });
}
