// Glyphs and placeholder agent portraits for the combat screen. Real portraits are content
// data (art-direction.md "ASCII art") and land with E011; `@` marks the blinking cursor eye.
import { content } from '../../../content/index.ts';
import type { EnemyDef, Intent, ToolDef, Verb } from '../../../content/types/index.ts';

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

const enemyDef = (id: string): EnemyDef | undefined => content.enemies.find((e) => e.id === id);

function findIntent(enemy: string, intent: string): Intent | undefined {
  const def = enemyDef(enemy);
  if (!def) return undefined;
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

export const enemyArt = (enemy: string): string => enemyDef(enemy)?.art.join('\n') ?? '';

const EFFECT_ICON: Readonly<Record<string, string>> = { dmg: '⚔', guard: '⛨', heal: '♥' };

/** Icon and value of the tool's main effect at `version` from content, e.g. `⚔ 9`. */
export function nextValue(def: ToolDef, version: number): string {
  for (const e of def.effects) {
    const icon = EFFECT_ICON[e.do];
    if (!icon || !('v' in e)) continue;
    const v = typeof e.v === 'number' ? e.v : e.v[version - 1];
    return `${icon} ${v}`;
  }
  return '·';
}
