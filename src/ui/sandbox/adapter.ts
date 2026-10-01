// Minimal content -> CombatInput adapter for the dev combat sandbox (T098).
// Throwaway: the real run setup (loadout, prompt pick, per-node seeds) is T042's
// "Fight nodes: build CombatInput and resolve"; delete this file when that lands.
import { phase1Encounters } from '../../content/encounters/phase1.ts';
import { enemies } from '../../content/enemies/index.ts';
import { harnesses } from '../../content/harnesses.ts';
import { skills } from '../../content/skills/index.ts';
import { tools } from '../../content/tools/index.ts';
import type {
  EncounterDef,
  EnemyDef,
  HarnessDef,
  SkillDef,
  SystemPromptDef,
  ToolDef,
} from '../../content/types/index.ts';
import type { CombatInput } from '../../sim/index.ts';

export const sandboxHarnesses: readonly HarnessDef[] = harnesses;
export const sandboxEncounters: readonly EncounterDef[] = phase1Encounters;

/** No system prompt: the sandbox shows the bare harness. */
const NO_PROMPT: SystemPromptDef = {
  id: 'none',
  weight: 0,
  rules: [],
  unlock: 'base',
  milestone: 1,
};

function byId<T extends { readonly id: string }>(list: readonly T[], id: string, what: string): T {
  const found = list.find((x) => x.id === id);
  if (!found) throw new Error(`sandbox: unknown ${what} '${id}'`);
  return found;
}

export const harnessById = (id: string): HarnessDef => byId(sandboxHarnesses, id, 'harness');
export const encounterById = (id: string): EncounterDef => byId(sandboxEncounters, id, 'encounter');
export const enemyById = (id: string): EnemyDef => byId<EnemyDef>(enemies, id, 'enemy');
export const toolById = (id: string): ToolDef => byId<ToolDef>(tools, id, 'tool');
const skillById = (id: string): SkillDef => byId<SkillDef>(skills, id, 'skill');

/** Enemies the given ones can spawn (spawn verbs, split children), transitively. */
function spawnedIds(e: EnemyDef): string[] {
  const stages = e.stages ?? [];
  const intents = [...(e.opening ?? []), ...e.cycle, ...stages.flatMap((s) => s.cycle)];
  const traits = [...e.traits, ...stages.flatMap((s) => s.traits ?? [])];
  return [
    ...intents.flatMap((i) => i.verbs.flatMap((v) => (v.verb === 'spawn' ? [v.enemy] : []))),
    ...traits.flatMap((t) => (t.trait === 'split' ? [t.child] : [])),
  ];
}

function spawnDefsFor(roots: readonly EnemyDef[]): EnemyDef[] {
  const rootIds = new Set<string>(roots.map((e) => e.id));
  const found = new Map<string, EnemyDef>();
  const queue = [...roots];
  for (let e = queue.pop(); e; e = queue.pop()) {
    for (const id of spawnedIds(e)) {
      if (found.has(id)) continue;
      const def = enemyById(id);
      found.set(id, def);
      queue.push(def);
    }
  }
  return [...found.values()].filter((d) => !rootIds.has(d.id));
}

export interface SandboxSetup {
  readonly harness: string;
  readonly encounter: string;
  readonly seed: string;
}

/** Starter loadout at v1, full Trust, no memories, lessons or modifiers, loop 0. */
export function buildInput(setup: SandboxSetup): CombatInput {
  const harness = harnessById(setup.harness);
  const encounter = encounterById(setup.encounter);
  const { model } = harness;
  const enemies = encounter.enemies.map(enemyById);
  return {
    seed: `sandbox/${setup.seed}`,
    agent: {
      model,
      trust: model.trust,
      maxTrust: model.trust,
      tools: harness.tools.map((id) => ({ def: toolById(id), version: 1 as const })),
      usedOncePerRun: [],
    },
    skills: harness.skills.map(skillById),
    memories: [],
    lessons: [],
    prompt: NO_PROMPT,
    policy: 80,
    encounter: {
      enemies,
      spawnDefs: spawnDefsFor(enemies),
      deadlineMs: encounter.deadlineMs ?? 45_000,
      phase: encounter.phase,
      loop: 0,
    },
    modifiers: [],
  };
}
