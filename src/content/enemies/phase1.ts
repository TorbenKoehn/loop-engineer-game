// Phase-1 enemies (docs/game/content/phase-1-implement.md "Enemies"). Values are final for
// home phase 1. Art is a one-line placeholder until the portraits land (E011).
import { defineEnemy } from '../dsl/define.ts';
import { hit, intent, noise, throttle } from './intent.ts';

const typo = defineEnemy({
  id: 'typo',
  family: 'Bugs',
  homePhase: 1,
  sev: 30,
  traits: [],
  cycle: [intent('nitpick', 3000, hit(2))],
  art: ['(typo)'],
});

const contextDrift = defineEnemy({
  id: 'context_drift',
  family: 'Context',
  homePhase: 1,
  sev: 140,
  traits: [],
  cycle: [intent('drift', 3500, noise(6)), intent('nudge', 3500, hit(4))],
  art: ['~drift~'],
});

const rateLimit = defineEnemy({
  id: 'rate_limit',
  family: 'Infra',
  homePhase: 1,
  sev: 120,
  traits: [],
  cycle: [intent('throttle', 6000, throttle('fastest', 3000)), intent('retry_after', 3000, hit(5))],
  art: ['[429]'],
});

const dependencyHell = defineEnemy({
  id: 'dependency_hell',
  family: 'Process',
  homePhase: 1,
  sev: 120,
  traits: [{ trait: 'split', n: 2, pct: 50, child: 'transitive_dep' }],
  cycle: [intent('version_conflict', 4000, hit(3))],
  art: ['{deps}'],
});

const transitiveDep = defineEnemy({
  id: 'transitive_dep',
  family: 'Process',
  homePhase: 1,
  sev: 60,
  traits: [],
  cycle: [intent('peer_conflict', 3500, hit(2))],
  art: ['{dep}'],
});

const scopeCreep = defineEnemy({
  id: 'scope_creep',
  family: 'Process',
  homePhase: 1,
  sev: 100,
  traits: [{ trait: 'grow', ms: 4000, sev: 6, dmg: 1 }],
  cycle: [intent('feature_request', 3000, hit(2))],
  art: ['<scope+>'],
});

const unreachableService = defineEnemy({
  id: 'unreachable_service',
  family: 'Infra',
  homePhase: 1,
  sev: 120,
  traits: [{ trait: 'outage', tag: 'Web' }],
  cycle: [intent('timeout', 4000, hit(4))],
  art: ['[503]'],
});

/** The seven phase-1 enemies, Transitive Dep (spawned by Dependency Hell) included. */
export const phase1Enemies = [
  typo,
  contextDrift,
  rateLimit,
  dependencyHell,
  transitiveDep,
  scopeCreep,
  unreachableService,
] as const;
