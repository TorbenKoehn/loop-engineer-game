// Phase-1 boss Legacy Monolith and its add Undocumented Behavior
// (docs/game/content/phase-1-implement.md "Boss: Legacy Monolith (Release)").
import { defineEnemy } from '../dsl/define.ts';
import type { Intent } from '../types/enemy.ts';
import { hit, intent, noise } from './intent.ts';

const legacyCode = intent('legacy_code', 4000, hit(8));
// The GDD states "max 2 alive" in stage A; stage B keeps the same cap.
const undocumented: Intent = intent('undocumented_behavior', 7000, {
  verb: 'spawn',
  enemy: 'undocumented_behavior',
  max: 2,
  at: 'front',
});
const stageA = [legacyCode, undocumented] as const;

const legacyMonolith = defineEnemy({
  id: 'legacy_monolith',
  family: 'Process',
  homePhase: 1,
  sev: 360,
  traits: [{ trait: 'armor', layers: 3, hp: 50 }],
  // Stage A is the opening stage; the stage switch on layer break is the handler's (E007).
  cycle: stageA,
  stages: [
    { id: 'a', layers: [3, 3], cycle: stageA },
    {
      id: 'b',
      layers: [1, 2],
      cycle: [legacyCode, intent('big_ball_of_mud', 4000, hit(5), noise(8)), undocumented],
    },
    { id: 'c', layers: [0, 0], cycle: [intent('spaghetti', 2000, hit(5))] },
  ],
  handler: 'monolith_stage',
  art: ['[#MONOLITH#]'],
});

const undocumentedBehavior = defineEnemy({
  id: 'undocumented_behavior',
  family: 'Process',
  homePhase: 1,
  sev: 30,
  traits: [],
  cycle: [intent('side_effect', 3000, hit(3), noise(3))],
  art: ['(?!)'],
});

/** The boss and its add. */
export const monolithEnemies = [legacyMonolith, undocumentedBehavior] as const;
