// Phase-1 elite Yak Shave with its three tasks and the Side Quest it spawns
// (docs/game/content/phase-1-implement.md "Yak Shave (M1)"). The task and Side Quest intent
// names are not in the GDD; they are named here.
import { defineEnemy } from '../dsl/define.ts';
import { hit, intent, noise, throttle } from './intent.ts';

const yakShave = defineEnemy({
  id: 'yak_shave',
  family: 'Process',
  homePhase: 1,
  sev: 220,
  traits: [{ trait: 'blocked' }],
  cycle: [
    intent('shave', 4500, hit(9)),
    // No handler needed: the spawn verb carries the front, per-fight and others caps.
    intent('another_thing_first', 9000, {
      verb: 'spawn',
      enemy: 'side_quest',
      max: 2,
      at: 'front',
      perFight: 2,
      maxOthers: 3,
    }),
  ],
  art: ['(yak)'],
});

const installDependency = defineEnemy({
  id: 'install_dependency',
  family: 'Process',
  homePhase: 1,
  sev: 40,
  traits: [],
  cycle: [intent('install', 2500, hit(3))],
  art: ['[install]'],
});

const updateToolchain = defineEnemy({
  id: 'update_toolchain',
  family: 'Process',
  homePhase: 1,
  sev: 40,
  traits: [],
  cycle: [intent('upgrade', 5000, throttle('leftmost', 1500))],
  art: ['[update]'],
});

const fixUnrelatedBug = defineEnemy({
  id: 'fix_unrelated_bug',
  family: 'Process',
  homePhase: 1,
  sev: 40,
  traits: [],
  cycle: [intent('detour', 3000, noise(5))],
  art: ['[fix]'],
});

const sideQuest = defineEnemy({
  id: 'side_quest',
  family: 'Process',
  homePhase: 1,
  sev: 30,
  traits: [],
  cycle: [intent('distraction', 2500, hit(3))],
  art: ['[quest]'],
});

/** Yak Shave, its three tasks (front to back) and the spawned Side Quest. */
export const yakShaveEnemies = [
  yakShave,
  installDependency,
  updateToolchain,
  fixUnrelatedBug,
  sideQuest,
] as const;
