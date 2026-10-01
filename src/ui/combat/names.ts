// Display names for the combat screen, from the string table via t().
import type { StringKey } from '../../content/strings/en.ts';
import type { CombatEvent, Ref } from '../../sim/events.ts';
import { t } from '../i18n.ts';

const name = (key: string): string => t(key as StringKey);

export const toolName = (id: string): string => name(`tool.${id}.name`);
export const toolFlavour = (id: string): string => name(`tool.${id}.flavour`);
export const enemyName = (id: string): string => name(`enemy.${id}.name`);
export const intentName = (enemy: string, intent: string): string =>
  name(`enemy.${enemy}.intent.${intent}`);
export const harnessName = (id: string): string => name(`harness.${id}.name`);
export const statusName = (id: string): string => name(`status.${id}`);

/** Enemy display labels by ref for a whole fight; repeated enemies get `#1`, `#2`, ... */
export function enemyLabels(events: readonly CombatEvent[]): ReadonlyMap<Ref, string> {
  const spawns = events.flatMap((e): [Ref, string][] =>
    e.kind === 'spawn' && e.dst ? [[e.dst, e.d.def]] : [],
  );
  const total = new Map<string, number>();
  for (const [, def] of spawns) total.set(def, (total.get(def) ?? 0) + 1);
  const seen = new Map<string, number>();
  const labels = new Map<Ref, string>();
  for (const [ref, def] of spawns) {
    const n = (seen.get(def) ?? 0) + 1;
    seen.set(def, n);
    const single = (total.get(def) ?? 0) <= 1;
    labels.set(
      ref,
      single ? enemyName(def) : t('ui.combat.enemy_nth', { name: enemyName(def), n }),
    );
  }
  return labels;
}
