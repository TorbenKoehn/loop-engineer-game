// AGENTS.md lessons at run end: the 3-lesson offer and the pickLesson / skipLesson actions.
// See docs/game/systems/meta-progression.md#agentsmd-lessons and run-state.md#modes.
import { content } from '../../content/index.ts';
import type { Family } from '../../content/types/basics.ts';
import type { LessonId } from '../../content/types/ids.ts';
import { fork, pick, type Rng } from '../../sim/rng.ts';
import { type Action, type ApplyResult, fail, ok } from '../actions.ts';
import type { RunState } from '../state.ts';

/** AGENTS.md lines (M1 slice; 3 from E015). */
export const LESSON_CAP = 1;
const FAMILIES = Object.keys(content.families) as Family[];

/** Family of an enemy def id; the Deadline only counts as Process via `families`. */
const enemyFamily = (id: string): Family | null =>
  content.enemies.find((e) => e.id === id)?.family ?? null;

const memberFamily = (id: string | null): Family | null =>
  FAMILIES.find((f) => id !== null && content.families[f].includes(id)) ?? null;

/** The enemy that dealt the most damage this run (ties: lowest id). */
function topDamage(state: RunState): Family | null {
  const hits = Object.entries(state.stats.damageBySource).filter(([id]) => enemyFamily(id));
  hits.sort(([a, x], [b, y]) => y - x || (a < b ? -1 : 1));
  return hits[0] ? enemyFamily(hits[0][0]) : null;
}

/** Families of the enemies in visited fights and of every damage source. */
function seenFamilies(state: RunState): Family[] {
  const encounters = state.map.nodes
    .filter((n) => n.encounter !== null && state.map.visited.includes(n.id))
    .map((n) => content.encounters.find((e) => e.id === n.encounter)?.enemies ?? []);
  const ids = [...encounters.flat(), ...Object.keys(state.stats.damageBySource)];
  return FAMILIES.filter((f) => ids.some((id) => enemyFamily(id) === f));
}

/** Adds `f` unless missing or offered already; then a random new family from `pool`, or any. */
function addFamily(rng: Rng, offer: Family[], f: Family | null, pool: readonly Family[]): void {
  const fresh = (x: Family) => !offer.includes(x);
  if (f !== null && fresh(f)) {
    offer.push(f);
    return;
  }
  const from = pool.filter(fresh);
  offer.push(pick(rng, from.length > 0 ? from : FAMILIES.filter(fresh)));
}

/**
 * Most-damage family, the family that ended the run (its last hit, Deadline = Process),
 * a random other family seen; one lesson each, offensive or defensive by `lessons` fork.
 */
export function lessonOffer(state: RunState): LessonId[] {
  const rng = fork(state.setup.seed, 'lessons');
  const offer: Family[] = [];
  addFamily(rng, offer, topDamage(state), FAMILIES);
  addFamily(rng, offer, memberFamily(state.stats.cause), FAMILIES);
  addFamily(rng, offer, null, seenFamilies(state));
  return offer.map((f) => {
    const pair = content.lessons.filter((l) => l.family === f);
    return pick(rng, pair).id;
  });
}

/** AGENTS.md with `id` added (at capacity: `replace` must name a line), or null. */
function write(lines: readonly LessonId[], id: LessonId, replace?: number): LessonId[] | null {
  if (replace === undefined) return lines.length < LESSON_CAP ? [...lines, id] : null;
  if (!Number.isInteger(replace) || replace < 0 || replace >= lines.length) return null;
  return lines.map((line, i) => (i === replace ? id : line));
}

const offerOf = (state: RunState) =>
  state.mode === 'runEnd' && state.pending?.kind === 'lessonOffer' && state.result
    ? { lessons: state.pending.lessons, result: state.result }
    : null;

export function pickLesson(state: RunState, ix: number, replace?: number): ApplyResult {
  const offer = offerOf(state);
  if (!offer) return fail('wrongMode');
  const id = offer.lessons[ix];
  if (id === undefined) return fail('notOffered');
  const lessons = write(offer.result.lessons, id, replace);
  if (!lessons) return fail('noLessonSlot');
  return ok({ ...state, pending: null, result: { ...offer.result, lessons } });
}

/** Keeps AGENTS.md as it is. */
export function skipLesson(state: RunState): ApplyResult {
  return offerOf(state) ? ok({ ...state, pending: null }) : fail('wrongMode');
}

/** One pick per offered lesson (one per line to replace when full) and skip. */
export function lessonActions(state: RunState): Action[] {
  const offer = offerOf(state);
  if (!offer) return [];
  const lines = offer.result.lessons;
  const picks = offer.lessons.flatMap((_, ix): Action[] =>
    lines.length < LESSON_CAP
      ? [{ t: 'pickLesson', ix }]
      : lines.map((_line, replace) => ({ t: 'pickLesson', ix, replace })),
  );
  return [...picks, { t: 'skipLesson' }];
}
