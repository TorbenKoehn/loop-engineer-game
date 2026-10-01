// Fight nodes: build the CombatInput from run state and content, resolve it, apply the
// outcome. See docs/architecture/run-state.md#actions and sim-core.md#api.
import { content } from '../../content/index.ts';
import type { EncounterDef, EnemyDef } from '../../content/types/enemy.ts';
import { type CombatInput, resolveCombat } from '../../sim/index.ts';
import { forkSeed } from '../../sim/rng.ts';
import { byId, loadoutInput } from '../build/selectors.ts';
import { addedEnemies, afterFight } from '../events/modifiers.ts';
import { eliteMemory } from '../nodes/memory.ts';
import { enterReward } from '../nodes/rewards.ts';
import type { MapNode, RunState } from '../state.ts';
import { addFight, endRun } from '../stats.ts';

/** Fallback when an encounter sets no deadline (docs/game/systems/combat.md). */
const DEADLINE_MS: Readonly<Record<EncounterDef['pool'], number>> = {
  easy: 45_000,
  hard: 45_000,
  elite: 50_000,
  boss: 75_000,
};

const enemy = (id: string): EnemyDef => byId(content.enemies, id);

/** Enemy ids `e` can bring into the fight: spawn verbs and split children. */
function spawnedIds(e: EnemyDef): string[] {
  const stages = e.stages ?? [];
  const intents = [...(e.opening ?? []), ...e.cycle, ...stages.flatMap((s) => s.cycle)];
  const traits = [...e.traits, ...stages.flatMap((s) => s.traits ?? [])];
  return [
    ...intents.flatMap((i) => i.verbs.flatMap((v) => (v.verb === 'spawn' ? [v.enemy] : []))),
    ...traits.flatMap((t) => (t.trait === 'split' ? [t.child] : [])),
  ];
}

/** Defs the line can spawn transitively that are not in it, in discovery order. */
function spawnDefsOf(line: readonly EnemyDef[]): EnemyDef[] {
  const all = [...line];
  for (let i = 0; i < all.length; i++) {
    for (const id of spawnedIds(all[i] as EnemyDef)) {
      if (!all.some((d) => d.id === id)) all.push(enemy(id));
    }
  }
  return all.slice(line.length);
}

/**
 * The sim input for the fight on `node`; the seed depends only on run seed and node id.
 * Event addEnemy modifiers append their enemies at the back of the line.
 */
export function combatInput(state: RunState, node: MapNode): CombatInput {
  const encounter = byId(content.encounters, node.encounter);
  const enemies = [...encounter.enemies, ...addedEnemies(state.nextFight)].map(enemy);
  return {
    ...loadoutInput(state),
    seed: forkSeed(state.setup.seed, `combat/${node.id}`),
    encounter: {
      enemies,
      spawnDefs: spawnDefsOf(enemies),
      deadlineMs: encounter.deadlineMs ?? DEADLINE_MS[encounter.pool],
      phase: state.phase,
      loop: state.loop,
    },
  };
}

/** Resolves the fight, applies Trust, flags, stats and spent modifiers, enters combatReview. */
export function fight(state: RunState, node: MapNode): RunState {
  const input = combatInput(state, node);
  const { outcome, reason, endT, stats, agentAfter, events } = resolveCombat(input);
  return {
    ...state,
    mode: 'combatReview',
    agent: {
      ...state.agent,
      trust: Math.max(0, agentAfter.trust),
      maxTrust: agentAfter.maxTrust,
      oncePerRun: [...agentAfter.usedOncePerRun],
    },
    nextFight: afterFight(state.nextFight),
    combat: { nodeId: node.id, input, outcome: { outcome, reason, endT, stats } },
    stats: addFight(state.stats, events, outcome === 'win'),
  };
}

/**
 * A loss ends the run as ctrlc. M1 slice: a won Release (the Phase-1 boss) ships the run
 * (vertical-slice.md#slice-specific-deviations); other wins pay out and offer rewards.
 */
export function afterCombat(state: RunState): RunState {
  if (state.combat?.outcome.outcome !== 'win') return endRun(state, 'ctrlc');
  const node = state.map.nodes.find((n) => n.id === state.combat?.nodeId);
  if (node?.type === 'release') return endRun(state, 'shipped');
  const rewarded = enterReward(state);
  return node?.type === 'criticalBug' ? eliteMemory(rewarded) : rewarded;
}
