// English names of phase-1 enemies, their intents, boss stages and boss handlers.
// Spread into `en` (en.ts); keys follow `enemy.<id>.name` and `enemy.<id>.intent.<intent>`.

export const enEnemies = {
  'enemy.typo.name': 'Typo',
  'enemy.typo.intent.nitpick': 'Nitpick',
  'enemy.context_drift.name': 'Context Drift',
  'enemy.context_drift.intent.drift': 'Drift',
  'enemy.context_drift.intent.nudge': 'Nudge',
  'enemy.rate_limit.name': 'Rate Limit (429)',
  'enemy.rate_limit.intent.throttle': 'Throttle',
  'enemy.rate_limit.intent.retry_after': 'Retry-After',
  'enemy.dependency_hell.name': 'Dependency Hell',
  'enemy.dependency_hell.intent.version_conflict': 'Version Conflict',
  'enemy.transitive_dep.name': 'Transitive Dep',
  'enemy.transitive_dep.intent.peer_conflict': 'Peer Conflict',
  'enemy.scope_creep.name': 'Scope Creep',
  'enemy.scope_creep.intent.feature_request': 'Feature Request',
  'enemy.unreachable_service.name': 'Unreachable Service (503)',
  'enemy.unreachable_service.intent.timeout': 'Timeout',

  'enemy.yak_shave.name': 'Yak Shave',
  'enemy.yak_shave.intent.shave': 'Shave',
  'enemy.yak_shave.intent.another_thing_first': 'Another Thing First',
  'enemy.install_dependency.name': 'Install Dependency',
  'enemy.install_dependency.intent.install': 'Install',
  'enemy.update_toolchain.name': 'Update Toolchain',
  'enemy.update_toolchain.intent.upgrade': 'Upgrade',
  'enemy.fix_unrelated_bug.name': 'Fix Unrelated Bug',
  'enemy.fix_unrelated_bug.intent.detour': 'Detour',
  'enemy.side_quest.name': 'Side Quest',
  'enemy.side_quest.intent.distraction': 'Distraction',

  'enemy.legacy_monolith.name': 'Legacy Monolith',
  'enemy.legacy_monolith.intent.legacy_code': 'Legacy Code',
  'enemy.legacy_monolith.intent.undocumented_behavior': 'Undocumented Behavior',
  'enemy.legacy_monolith.intent.big_ball_of_mud': 'Big Ball of Mud',
  'enemy.legacy_monolith.intent.spaghetti': 'Spaghetti',
  'enemy.legacy_monolith.stage.a': 'Stage A',
  'enemy.legacy_monolith.stage.b': 'Stage B',
  'enemy.legacy_monolith.stage.c': 'Rewrite',
  'enemy.undocumented_behavior.name': 'Undocumented Behavior',
  'enemy.undocumented_behavior.intent.side_effect': 'Side Effect',

  // Boss handlers, as lower-case clauses like the verb templates.
  'handler.monolith_stage': 'when an armor layer breaks, switch to the next stage',
} as const;
