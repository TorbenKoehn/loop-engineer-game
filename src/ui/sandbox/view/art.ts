// Sandbox-only glyphs and placeholder agent portraits (T098). Real portraits are content
// data (art-direction.md "ASCII art") and land with E011; `@` marks the blinking cursor eye.
import type { Intent, Verb } from '../../../content/types/index.ts';
import { enemyById } from '../adapter.ts';

const PORTRAITS: Readonly<Record<string, readonly string[]>> = {
  terminal_purist: ['  .--------.', ' | >_ @    |', ' |   __    |', " '--------'"],
  ide_companion: [' ┌─────────┐', ' │ {@}  ▤▤ │', ' │   ──    │', ' └─────────┘'],
};

export const portraitOf = (harness: string): readonly string[] =>
  PORTRAITS[harness] ?? PORTRAITS.terminal_purist ?? [];

/** Intent icons from docs/game/ux/screens.md "Enemy line". */
const VERB_ICON: Readonly<Record<Verb['verb'], string>> = {
  hit: '⚔',
  multiHit: '⚔',
  noise: '≋',
  throttle: '⏸',
  slow: '⏸',
  stun: '✱',
  guard: '⛨',
  heal: '+',
  spawn: '+',
  redirect: '↺',
  custom: '?',
};

function findIntent(enemy: string, intent: string): Intent | undefined {
  const def = enemyById(enemy);
  const all = [...(def.opening ?? []), ...def.cycle, ...(def.stages ?? []).flatMap((s) => s.cycle)];
  return all.find((i) => i.id === intent);
}

/** Icon and headline number of an intent, e.g. `⚔ 2`. */
export function intentBadge(enemy: string, intent: string): string {
  const verb = findIntent(enemy, intent)?.verbs[0];
  if (!verb) return '?';
  const icon = VERB_ICON[verb.verb];
  return 'n' in verb ? `${icon} ${verb.n}` : icon;
}

export const enemyArt = (enemy: string): string => enemyById(enemy).art.join('\n');
