// Test builders for sim tests (docs/architecture/testing.md "Rules for agents writing tests").
// Defaults mirror slice content: makeTool() is grep, makeEnemy() is Typo.
import type { EnemyDef, Intent, ModelStats, ToolDef, Verb } from '../../content/types/index.ts';
import type { CombatInput, Version } from '../combat/types.ts';

/** A tool def; defaults to grep (3000 ms, dmg 6/9/13 on the front enemy). */
export function makeTool(over: Partial<ToolDef> = {}): ToolDef {
  return {
    id: 'grep',
    tags: ['Search', 'Shell'],
    rarity: 'common',
    weight: 3,
    cooldownMs: 3000,
    output: 1,
    target: 'front',
    effects: [{ do: 'dmg', v: [6, 9, 13] }],
    unlock: 'base',
    milestone: 1,
    ...over,
  };
}

/** A single-verb `hit` intent. */
export function hitIntent(n: number, windupMs = 3000, id = 'hit'): Intent {
  return { id, windupMs, verbs: [{ verb: 'hit', n }] };
}

/** An intent with one or two verbs. */
export function intent(id: string, windupMs: number, ...verbs: [Verb] | [Verb, Verb]): Intent {
  return { id, windupMs, verbs };
}

/** An enemy def; defaults to Typo (Severity 30, Nitpick: hit 2 every 3000 ms). */
export function makeEnemy(over: Partial<EnemyDef> = {}): EnemyDef {
  return {
    id: 'typo',
    family: 'Bugs',
    homePhase: 1,
    sev: 30,
    traits: [],
    cycle: [hitIntent(2, 3000, 'nitpick')],
    art: [],
    ...over,
  };
}

export interface FightSpec {
  readonly tools?: readonly ToolDef[];
  readonly version?: Version;
  readonly enemies?: readonly EnemyDef[];
  readonly spawnDefs?: readonly EnemyDef[];
  readonly phase?: 1 | 2 | 3;
  readonly trust?: number;
  /** Harness charge rate in percent. */
  readonly speed?: number;
  readonly deadlineMs?: number;
  readonly seed?: string;
}

const MODEL: ModelStats = {
  window: 200,
  speed: 100,
  accuracy: 'normal',
  trust: 40,
  baseWeight: 20,
};

/** A complete CombatInput: one grep vs one Typo at 40 Trust unless overridden. */
export function fight(spec: FightSpec = {}): CombatInput {
  const trust = spec.trust ?? MODEL.trust;
  const version = spec.version ?? 1;
  const tools = (spec.tools ?? [makeTool()]).map((def) => ({ def, version }));
  return {
    seed: spec.seed ?? 'test-seed',
    agent: {
      model: { ...MODEL, speed: spec.speed ?? MODEL.speed },
      trust,
      maxTrust: trust,
      tools,
      usedOncePerRun: [],
    },
    skills: [],
    memories: [],
    lessons: [],
    prompt: { id: 'none', weight: 0, rules: [], unlock: 'base', milestone: 1 },
    policy: 0,
    encounter: {
      enemies: spec.enemies ?? [makeEnemy()],
      spawnDefs: spec.spawnDefs ?? [],
      deadlineMs: spec.deadlineMs ?? 45_000,
      phase: spec.phase ?? 1,
      loop: 0,
    },
    modifiers: [],
  };
}
