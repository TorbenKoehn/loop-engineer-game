// Enemy families and the 10 AGENTS.md lessons (docs/game/content/memories-lessons.md
// "AGENTS.md lessons"). Each lesson's line is the string `lesson.<id>.line`. Combat effects
// of the rules live in E007; offer logic in E008.
import { defineLesson } from './dsl/define.ts';
import { passive } from './dsl/rule.ts';
import type { Family } from './types/basics.ts';
import type { Effect } from './types/dsl.ts';

/** Family members by enemy id, M1 and M2. Spawned adds belong to their parent's family. */
export const FAMILY_MEMBERS: Readonly<Record<Family, readonly string[]>> = {
  Bugs: [
    'typo',
    'copy_paste_clone',
    'flaky_test',
    'off_by_one',
    'heisenbug',
    'the_flaky_ci_pipeline',
  ],
  Context: ['context_drift', 'hallucination', 'prompt_injection', 'stack_trace', 'memory_leak'],
  Infra: [
    'rate_limit',
    'unreachable_service',
    'cold_start',
    'thundering_herd',
    'its_always_dns',
    'cascading_failure',
    'production_incident',
  ],
  Process: [
    'dependency_hell',
    'transitive_dep',
    'scope_creep',
    'yak_shave',
    'install_dependency',
    'update_toolchain',
    'fix_unrelated_bug',
    'side_quest',
    'merge_conflict',
    'code_review_gatekeeper',
    'friday_deploy',
    'legacy_monolith',
    'undocumented_behavior',
    'deadline',
  ],
  Sandbox: ['infinite_loop', 'permission_denied'],
};

const offense = (family: Family): Effect => ({
  do: 'mod',
  stat: 'dmgPct',
  v: 15,
  filter: { family },
});
const defense = (family: Family): Effect => ({
  do: 'mod',
  stat: 'dmgTakenPct',
  v: -20,
  filter: { family },
});

export const bugsOff = defineLesson({
  id: 'bugs_off',
  family: 'Bugs',
  rules: [passive(offense('Bugs'))],
});
export const bugsDef = defineLesson({
  id: 'bugs_def',
  family: 'Bugs',
  rules: [passive(defense('Bugs'))],
});
export const contextOff = defineLesson({
  id: 'context_off',
  family: 'Context',
  rules: [passive(offense('Context'))],
});
export const contextDef = defineLesson({
  id: 'context_def',
  family: 'Context',
  rules: [passive({ do: 'custom', handler: 'context_noise_cut', args: { pct: 25 } })],
});
export const infraOff = defineLesson({
  id: 'infra_off',
  family: 'Infra',
  rules: [passive(offense('Infra'))],
});
export const infraDef = defineLesson({
  id: 'infra_def',
  family: 'Infra',
  rules: [passive({ do: 'custom', handler: 'throttle_shorter', args: { ms: 1000, min: 50 } })],
});
export const processOff = defineLesson({
  id: 'process_off',
  family: 'Process',
  rules: [passive(offense('Process'))],
});
export const processDef = defineLesson({
  id: 'process_def',
  family: 'Process',
  rules: [passive(defense('Process'))],
});
export const sandboxOff = defineLesson({
  id: 'sandbox_off',
  family: 'Sandbox',
  rules: [passive(offense('Sandbox'))],
});
export const sandboxDef = defineLesson({
  id: 'sandbox_def',
  family: 'Sandbox',
  rules: [passive(defense('Sandbox'))],
});

export const lessons = [
  bugsOff,
  bugsDef,
  contextOff,
  contextDef,
  infraOff,
  infraDef,
  processOff,
  processDef,
  sandboxOff,
  sandboxDef,
] as const;

/** Literal union of every lesson id. */
export type LessonKey = (typeof lessons)[number]['id'];
