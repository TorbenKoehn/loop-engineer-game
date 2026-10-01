// Display names for the sandbox, read from the English string table. Stand-in for the
// i18n `t()` helper that T055 adds; missing keys fall back to the id.
import { en } from '../../content/strings/en.ts';
import type { CombatEvent, Ref } from '../../sim/events.ts';

const table: Readonly<Record<string, string>> = en;

export const str = (key: string, fallback: string): string => table[key] ?? fallback;

export const toolName = (id: string): string => str(`tool.${id}.name`, id);
export const toolFlavour = (id: string): string => str(`tool.${id}.flavour`, '');
export const enemyName = (id: string): string => str(`enemy.${id}.name`, id);
export const intentName = (enemy: string, intent: string): string =>
  str(`enemy.${enemy}.intent.${intent}`, intent);
export const harnessName = (id: string): string => str(`harness.${id}.name`, id);
export const harnessLine = (id: string): string => str(`harness.${id}.line`, '');
export const harnessFlavour = (id: string): string => str(`harness.${id}.flavour`, '');
export const statusName = (id: string): string => str(`status.${id}`, id);

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
    const k = (seen.get(def) ?? 0) + 1;
    seen.set(def, k);
    labels.set(ref, (total.get(def) ?? 0) > 1 ? `${enemyName(def)} #${k}` : enemyName(def));
  }
  return labels;
}
