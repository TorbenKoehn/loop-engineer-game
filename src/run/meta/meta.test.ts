import { describe, expect, it } from 'vitest';
import { content } from '../../content/index.ts';
import { baseline } from '../../sim/combat/context/ctx.ts';
import type { Action } from '../actions.ts';
import { apply, legalActions } from '../apply.ts';
import { combatInput } from '../combat.ts';
import { reachable } from '../map/graph.ts';
import { isUnlocked, newRun } from '../new-run.ts';
import type { MetaView, RunState } from '../state.ts';
import { endRun as endOfRun } from '../stats.ts';
import { BUG_WIN_UNLOCK, endRun, HISTORY_CAP, type MetaState, metaView, newMeta } from './meta.ts';

function step(state: RunState, action: Action): RunState {
  const r = apply(state, action);
  if (!r.ok) throw new Error(`rejected ${JSON.stringify(action)}: ${r.error}`);
  return r.state;
}

const SETUP = { seed: 'K7Q2-M9XA', harness: 'terminal_purist', lint: [], tutorial: false };

function onMap(view: MetaView = metaView(newMeta()), seed = SETUP.seed): RunState {
  return step(newRun({ ...SETUP, seed }, view), { t: 'pickPrompt', prompt: 'senior' });
}

/** A finished run: abandoned from the map, or `ended` with its lesson choice made. */
const abandoned = (s: RunState = onMap()) => step(s, { t: 'abandon' });
const numbered = (s: RunState, run: number): RunState => ({ ...s, setup: { ...s.setup, run } });

describe('endRun (meta)', () => {
  it('appends a history entry with the run-history fields', () => {
    const base = onMap();
    // Win the first fight (this seed), take the first reward choice, then give up on the map.
    let run = step(base, { t: 'travel', node: reachable(base.map)[0] as string });
    while (run.mode !== 'map') run = step(run, legalActions(run)[0] as Action);
    const end = abandoned(run);
    const meta = endRun(newMeta(), end, { wallMs: 61_000, save: 'LE1.abc' });
    const { setup, agent, stats } = end;
    expect(meta.history).toEqual([
      {
        run: 1,
        seed: SETUP.seed,
        harness: 'terminal_purist',
        prompt: 'senior',
        lint: [],
        outcome: 'abandoned',
        phase: 1,
        cause: null,
        wallMs: 61_000,
        loadout: { tools: agent.tools, skills: agent.skills, memories: agent.memories },
        damageBySource: stats.damageBySource,
        zoneMs: stats.zoneMs,
        compactions: stats.compactions,
        td: 0,
        save: 'LE1.abc',
      },
    ]);
    expect(setup.run).toBe(1);
    expect(meta.lastRun).toBe(1);
    expect(stats.zoneMs.reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
  });

  it('records the cause of a lost run only', () => {
    const s = onMap();
    const lost = endOfRun({ ...s, stats: { ...s.stats, cause: 'typo' } }, 'ctrlc');
    const meta = endRun(newMeta(), step(lost, { t: 'skipLesson' }));
    expect(meta.history[0]).toMatchObject({ outcome: 'ctrlc', cause: 'typo', wallMs: null });
    expect(meta.history[0]?.save).toBeNull();
  });

  it('keeps the last 100 runs', () => {
    const end = abandoned();
    let meta = newMeta();
    for (let n = 1; n <= HISTORY_CAP + 5; n++) meta = endRun(meta, numbered(end, n));
    expect(meta.history).toHaveLength(HISTORY_CAP);
    expect(meta.history[0]?.run).toBe(6);
    expect(meta.history.at(-1)?.run).toBe(HISTORY_CAP + 5);
    expect(meta.lastRun).toBe(HISTORY_CAP + 5);
  });

  it('is idempotent by run id', () => {
    const end = abandoned();
    const once = endRun(newMeta(), end);
    expect(endRun(once, end)).toBe(once);
    const later = endRun(once, numbered(end, 2));
    expect(endRun(later, end)).toBe(later);
    expect(later.history.map((h) => h.run)).toEqual([1, 2]);
    // Unnumbered runs (no metaView) are always recorded.
    const loose = numbered(end, 0);
    expect(endRun(endRun(newMeta(), loose), loose).history).toHaveLength(2);
  });

  it('refuses a run that has not ended or still offers lessons', () => {
    expect(() => endRun(newMeta(), onMap())).toThrow(RangeError);
    expect(() => endRun(newMeta(), endOfRun(onMap(), 'ctrlc'))).toThrow(RangeError);
  });
});

describe('AGENTS.md in meta', () => {
  const withLine: MetaState = { ...newMeta(), lessons: ['sandbox_def'] };
  const lost = endOfRun(onMap(metaView(withLine)), 'ctrlc');
  const offer = lost.pending?.kind === 'lessonOffer' ? lost.pending.lessons : [];

  it('pickLesson replaces the line at capacity 1', () => {
    const picked = step(lost, { t: 'pickLesson', ix: 1, replace: 0 });
    expect(endRun(withLine, picked).lessons).toEqual([offer[1]]);
  });

  it('skipLesson keeps the old line; an abandoned run keeps it too', () => {
    expect(endRun(withLine, step(lost, { t: 'skipLesson' })).lessons).toEqual(['sandbox_def']);
    expect(endRun(withLine, abandoned(onMap(metaView(withLine)))).lessons).toEqual(['sandbox_def']);
  });
});

describe('brute_force unlock (M1)', () => {
  const brute = content.tools.find((t) => t.id === 'brute_force');
  const s = onMap();
  const bug = s.map.nodes.find((n) => n.type === 'criticalBug');
  const visitedBug = { ...s.map, visited: [bug?.id ?? ''] };

  it('winning any Critical Bug once unlocks brute_force for later runs', () => {
    expect(bug).toBeDefined();
    expect(endRun(newMeta(), abandoned()).unlocked).toEqual([]);
    const meta = endRun(newMeta(), abandoned({ ...s, map: visitedBug }));
    expect(meta.unlocked).toEqual([BUG_WIN_UNLOCK]);
    expect(brute && isUnlocked(brute.unlock, meta.unlocked)).toBe(true);
    const next = newRun(SETUP, metaView(meta));
    expect(brute && isUnlocked(brute.unlock, next.setup.unlocked)).toBe(true);
    const again = endRun(meta, numbered(abandoned({ ...s, map: visitedBug }), 2));
    expect(again.unlocked).toEqual([BUG_WIN_UNLOCK]);
  });

  it('losing the Critical Bug fight unlocks nothing', () => {
    const combat = s.combat ?? step(s, { t: 'travel', node: reachable(s.map)[0] as string }).combat;
    const lostAt = combat && {
      ...combat,
      nodeId: bug?.id ?? '',
      outcome: { ...combat.outcome, outcome: 'loss' as const },
    };
    const end = endOfRun({ ...s, map: visitedBug, combat: lostAt }, 'ctrlc');
    expect(endRun(newMeta(), step(end, { t: 'skipLesson' })).unlocked).toEqual([]);
  });
});

describe('MetaView into newRun', () => {
  const meta: MetaState = {
    ...newMeta(),
    lastRun: 7,
    unlocked: ['power_tools'],
    lessons: ['bugs_off'],
  };

  it('newRun copies unlocked ids, lessons and the run number', () => {
    const run = newRun(SETUP, metaView(meta));
    expect(run.setup).toMatchObject({ run: 8, unlocked: ['power_tools'], lessons: ['bugs_off'] });
    expect(run.setup.lessons).not.toBe(meta.lessons);
    expect(newRun(SETUP, { unlocked: [], lessons: [], lintCap: 0 }).setup.run).toBe(0);
  });

  it('a lesson adds 1 to the baseline', () => {
    const plain = onMap();
    const taught = onMap(metaView(meta));
    const node = plain.map.nodes.find((n) => n.id === reachable(plain.map)[0]);
    if (!node) throw new Error('no reachable node');
    expect(baseline(combatInput(taught, node)) - baseline(combatInput(plain, node))).toBe(1);
  });
});
