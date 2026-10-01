// Persistent meta progress across runs: history, AGENTS.md and unlocks. Pure, like the run.
// See docs/architecture/run-state.md#meta-state and docs/game/systems/meta-progression.md.
import type { HarnessId, LessonId, MemoryId, PromptId, SkillId } from '../../content/types/ids.ts';
import type { UnlockId } from '../../content/types/refs.ts';
import type { LintId, MetaView, OwnedTool, RunResult, RunState } from '../state.ts';

/** Runs kept in history (meta-progression.md#run-history). */
export const HISTORY_CAP = 100;
/** M1: winning any Critical Bug once unlocks brute_force (vertical-slice.md). */
export const BUG_WIN_UNLOCK: UnlockId = 'power_tools';

/** One finished run (meta-progression.md#run-history). */
export interface RunRecord {
  /** SetupSnapshot.run; 0 = unnumbered. */
  run: number;
  seed: string;
  harness: HarnessId;
  prompt: PromptId | null;
  lint: LintId[];
  outcome: RunResult['outcome'];
  phase: number;
  /** Enemy def id or `deadline` that ended a lost run; null for wins and abandons. */
  cause: string | null;
  /** Wall clock from the caller; sim time is the sum of `zoneMs`. */
  wallMs: number | null;
  loadout: { tools: OwnedTool[]; skills: SkillId[]; memories: MemoryId[] };
  damageBySource: Record<string, number>;
  /** ms per zone index over the run: cold, focused, rot, overflow. */
  zoneMs: number[];
  compactions: number;
  td: number;
  /** Export string for replay (src/save); null until the caller provides it. */
  save: string | null;
}

/** What the pure core cannot know: the clock and the save codec. */
export interface RunExtras {
  wallMs: number | null;
  save: string | null;
}

/** Achievements, settings, tips and daily join with their epics (E015, E017). */
export interface MetaState {
  v: 1;
  /** Highest recorded run number; endRun ignores runs at or below it. */
  lastRun: number;
  td: number;
  unlocked: UnlockId[];
  lessons: LessonId[];
  /** Oldest first, at most HISTORY_CAP. */
  history: RunRecord[];
}

export const newMeta = (): MetaState => ({
  v: 1,
  lastRun: 0,
  td: 0,
  unlocked: [],
  lessons: [],
  history: [],
});

/** The part newRun copies; lint rules stay locked in M1. */
export const metaView = (meta: MetaState): MetaView => ({
  unlocked: [...meta.unlocked],
  lessons: [...meta.lessons],
  lintCap: 0,
  run: meta.lastRun + 1,
});

/** A Critical Bug node was visited and not lost (a lost fight ends the run on its node). */
function wonCriticalBug(run: RunState): boolean {
  const lost = run.combat?.outcome.outcome === 'win' ? null : run.combat?.nodeId;
  return run.map.nodes.some(
    (n) => n.type === 'criticalBug' && n.id !== lost && run.map.visited.includes(n.id),
  );
}

function record(run: RunState, result: RunResult, extras: RunExtras): RunRecord {
  const { setup, agent, stats } = run;
  return {
    run: setup.run,
    seed: setup.seed,
    harness: setup.harness,
    prompt: setup.prompt,
    lint: [...setup.lint],
    outcome: result.outcome,
    phase: run.phase,
    cause: result.outcome === 'ctrlc' ? stats.cause : null,
    wallMs: extras.wallMs,
    loadout: { tools: [...agent.tools], skills: [...agent.skills], memories: [...agent.memories] },
    damageBySource: { ...stats.damageBySource },
    zoneMs: [...stats.zoneMs],
    compactions: stats.compactions,
    td: result.td,
    save: extras.save,
  };
}

/**
 * Records a finished run (lesson choice made): history, AGENTS.md, the M1 unlock.
 * Idempotent by run id, so a retry after a crash cannot record a run twice.
 */
export function endRun(
  meta: MetaState,
  run: RunState,
  extras: RunExtras = { wallMs: null, save: null },
): MetaState {
  const { result } = run;
  if (!result || run.pending !== null) throw new RangeError('endRun: the run is not finished');
  if (run.setup.run > 0 && run.setup.run <= meta.lastRun) return meta;
  const unlock = wonCriticalBug(run) && !meta.unlocked.includes(BUG_WIN_UNLOCK);
  return {
    ...meta,
    lastRun: Math.max(meta.lastRun, run.setup.run),
    td: meta.td + result.td,
    unlocked: unlock ? [...meta.unlocked, BUG_WIN_UNLOCK] : meta.unlocked,
    lessons: [...result.lessons],
    history: [...meta.history, record(run, result, extras)].slice(-HISTORY_CAP),
  };
}
