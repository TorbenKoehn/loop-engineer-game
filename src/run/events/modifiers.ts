// Next-fight modifiers from events (docs/game/content/events.md#next-fight-modifiers-data).
// addEnemy joins the encounter line in the run; the others reach the sim via CombatInput.
import type { FightModifier } from '../../content/types/event.ts';
import type { EnemyId } from '../../content/types/ids.ts';

type AddEnemy = Extract<FightModifier, { mod: 'addEnemy' }>;

const isAddEnemy = (m: FightModifier): m is AddEnemy => m.mod === 'addEnemy';

/** Enemy ids appended at the back of the next fight's line, in modifier order. */
export const addedEnemies = (mods: readonly FightModifier[]): EnemyId[] =>
  mods.filter(isAddEnemy).flatMap((m) => Array<EnemyId>(m.count).fill(m.enemy));

/** The modifiers the sim applies (start noise, start signal, tag bonus). */
export const simModifiers = (mods: readonly FightModifier[]): FightModifier[] =>
  mods.filter((m) => !isAddEnemy(m));

/** What is left after a fight: addEnemy with fights remaining, one fewer each. */
export const afterFight = (mods: readonly FightModifier[]): FightModifier[] =>
  mods
    .filter(isAddEnemy)
    .map((m) => ({ ...m, fights: m.fights - 1 }))
    .filter((m) => m.fights > 0);
