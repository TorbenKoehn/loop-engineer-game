import { describe, expect, it } from 'vitest';
import { content } from '../../content/index.ts';
import type { Action } from '../actions.ts';
import { apply, legalActions } from '../apply.ts';
import { newRun } from '../new-run.ts';
import type { RunState, RunStats } from '../state.ts';
import { DEADLINE, endRun } from '../stats.ts';
import { LESSON_CAP, lessonOffer } from './lessons.ts';

function step(state: RunState, action: Action): RunState {
  const r = apply(state, action);
  if (!r.ok) throw new Error(`rejected ${JSON.stringify(action)}: ${r.error}`);
  return r.state;
}

function onMap(seed = 'K7Q2-M9XA', lessons: string[] = []): RunState {
  const start = newRun(
    { seed, harness: 'terminal_purist', lint: [], tutorial: false },
    {
      unlocked: [],
      lessons,
      lintCap: 0,
    },
  );
  return step(start, { t: 'pickPrompt', prompt: 'senior' });
}

/** A run that ended as ctrlc with `stats` and no visited fights. */
function lost(stats: Partial<RunStats>, seed?: string, lessons?: string[]): RunState {
  const s = onMap(seed, lessons);
  return endRun({ ...s, stats: { ...s.stats, ...stats } }, 'ctrlc');
}

const familyOf = (id: string) => content.lessons.find((l) => l.id === id)?.family;
const offered = (s: RunState) => (s.pending?.kind === 'lessonOffer' ? s.pending.lessons : []);

describe('lesson offer', () => {
  it('most damage, what ended the run, another seen family (Deadline only as the end)', () => {
    const s = lost({
      damageBySource: { typo: 30, rate_limit: 10, [DEADLINE]: 50 },
      cause: DEADLINE,
    });
    expect(offered(s).map(familyOf)).toEqual(['Bugs', 'Process', 'Infra']);
    expect(offered(s)).toEqual(lessonOffer(s));
  });

  it('a seen family comes from visited fights too', () => {
    const base = onMap();
    const fight = base.map.nodes.find((n) => n.encounter !== null && n.row === 1);
    const enc = content.encounters.find((e) => e.id === fight?.encounter);
    const familyOfEnemy = (id: string) => content.enemies.find((e) => e.id === id)?.family;
    const seen = new Set(enc?.enemies.map(familyOfEnemy));
    // Sources 1 and 2 name two families the fight does not have, so 3 must come from it.
    const top = content.enemies.find((e) => !seen.has(e.family));
    const end = content.enemies.find((e) => !seen.has(e.family) && e.family !== top?.family);
    const stats = { ...base.stats, damageBySource: { [top?.id ?? '']: 5 }, cause: end?.id ?? null };
    const s = endRun({ ...base, stats, map: { ...base.map, visited: [fight?.id ?? ''] } }, 'ctrlc');
    const fams = offered(s).map(familyOf);
    expect(fams.slice(0, 2)).toEqual([top?.family, end?.family]);
    expect(seen.has(fams[2])).toBe(true);
  });

  it('duplicates and unknown sources fall back to distinct random families', () => {
    for (const seed of ['a', 'b', 'c', 'd', 'e', 'f']) {
      const dup = offered(lost({ damageBySource: { typo: 9 }, cause: 'typo' }, seed));
      const none = offered(lost({}, seed));
      expect(new Set(dup.map(familyOf)).size).toBe(3);
      expect(new Set(none.map(familyOf)).size).toBe(3);
      expect(familyOf(dup[0] ?? '')).toBe('Bugs');
    }
  });

  it('is deterministic per seed and picks offensive or defensive by the lessons fork', () => {
    const stats = { damageBySource: { typo: 30 }, cause: 'rate_limit' };
    expect(offered(lost(stats, 'S1'))).toEqual(offered(lost(stats, 'S1')));
    const firsts = ['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7'].map(
      (seed) => offered(lost(stats, seed))[0],
    );
    expect(new Set(firsts)).toEqual(new Set(['bugs_off', 'bugs_def']));
  });

  it('abandoned runs get no offer', () => {
    const s = step(onMap(), { t: 'abandon' });
    expect(s.pending).toBeNull();
    expect(legalActions(s)).toEqual([]);
  });
});

describe('pickLesson and skipLesson', () => {
  it('capacity is 1 in M1', () => {
    expect(LESSON_CAP).toBe(1);
  });

  it('an empty AGENTS.md takes the picked line', () => {
    const s = lost({ cause: 'typo' });
    expect(legalActions(s)).toEqual([
      { t: 'pickLesson', ix: 0 },
      { t: 'pickLesson', ix: 1 },
      { t: 'pickLesson', ix: 2 },
      { t: 'skipLesson' },
    ]);
    const done = step(s, { t: 'pickLesson', ix: 1 });
    expect(done.result?.lessons).toEqual([offered(s)[1]]);
    expect(done.pending).toBeNull();
    expect(legalActions(done)).toEqual([]);
  });

  it('at capacity pickLesson replaces the line, skipLesson keeps the old line', () => {
    const s = lost({ cause: 'typo' }, 'K7Q2-M9XA', ['sandbox_def']);
    expect(s.result?.lessons).toEqual(['sandbox_def']);
    expect(legalActions(s)).toContainEqual({ t: 'pickLesson', ix: 2, replace: 0 });
    expect(apply(s, { t: 'pickLesson', ix: 0 })).toEqual({ ok: false, error: 'noLessonSlot' });
    expect(apply(s, { t: 'pickLesson', ix: 0, replace: 1 })).toEqual({
      ok: false,
      error: 'noLessonSlot',
    });
    expect(step(s, { t: 'pickLesson', ix: 2, replace: 0 }).result?.lessons).toEqual([
      offered(s)[2],
    ]);
    expect(step(s, { t: 'skipLesson' }).result?.lessons).toEqual(['sandbox_def']);
  });

  it('rejects picks outside the offer or the runEnd choice', () => {
    const s = lost({});
    expect(apply(s, { t: 'pickLesson', ix: 3 })).toEqual({ ok: false, error: 'notOffered' });
    const done = step(s, { t: 'skipLesson' });
    expect(apply(done, { t: 'skipLesson' })).toEqual({ ok: false, error: 'wrongMode' });
    expect(apply(onMap(), { t: 'pickLesson', ix: 0 })).toEqual({ ok: false, error: 'wrongMode' });
  });
});
