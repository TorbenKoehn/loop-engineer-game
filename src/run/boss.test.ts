// T037: the handler registry against real content and the Legacy Monolith boss fight (p1b),
// built the way a run builds it (phase-1-implement.md "Boss: Legacy Monolith (Release)").
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { passive } from '../content/dsl/rule.ts';
import { content } from '../content/index.ts';
import { sliceOf } from '../content/testing/slice-doc.ts';
import { validateContent } from '../content/validate.ts';
import type { CombatEvent } from '../sim/events.ts';
import { serializeLog } from '../sim/events.ts';
import { HANDLER_IDS } from '../sim/handlers/index.ts';
import { type CombatInput, resolveCombat } from '../sim/index.ts';
import { apply } from './apply.ts';
import { combatInput } from './combat.ts';
import { reachable } from './map/graph.ts';
import { newRun } from './new-run.ts';

const doc = readFileSync(new URL('../../docs/game/vertical-slice.md', import.meta.url), 'utf8');
const M1 = { milestone: 1, slice: sliceOf(doc), handlers: HANDLER_IDS } as const;

describe('handler registry over real content', () => {
  it('every custom handler id in the M1 content is registered', () => {
    expect(validateContent(content, M1)).toEqual([]);
  });

  it('validation fails for an unknown handler id', () => {
    const rules = [passive({ do: 'custom', handler: 'no_such_handler' })];
    const memories = content.memories.map((m) => (m.id === 'cache' ? { ...m, rules } : m));
    expect(validateContent({ ...content, memories }, M1)).toContain(
      "[rule 1] memory cache: unregistered handler 'no_such_handler'",
    );
  });
});

type Of<K> = Extract<CombatEvent, { kind: K }>;
const of = <K extends CombatEvent['kind']>(events: readonly CombatEvent[], kind: K) =>
  events.filter((e): e is Of<K> => e.kind === kind);

/** p1b on the first node of a fixed run, with `tools` at `version` (all ids from content). */
function boss(tools: readonly string[], version: 1 | 2 | 3 = 1): CombatInput {
  const meta = { unlocked: [], lessons: [], lintCap: 0 };
  const start = newRun(
    { seed: 'BOSS-0001', harness: 'terminal_purist', lint: [], tutorial: false },
    meta,
  );
  const picked = apply(start, { t: 'pickPrompt', prompt: 'senior' });
  if (!picked.ok) throw new Error(picked.error);
  const run = picked.state;
  const node = run.map.nodes.find((n) => n.id === reachable(run.map)[0]);
  if (!node) throw new Error('no reachable node');
  const input = combatInput(run, { ...node, encounter: 'p1b' });
  const defs = tools.map((id) => content.tools.find((t) => t.id === id));
  const own = defs.flatMap((def) => (def ? [{ def, version }] : []));
  return { ...input, agent: { ...input.agent, tools: own } };
}

describe('Legacy Monolith (p1b)', () => {
  it('Undocumented Behavior spawns in front of the Monolith, at most 2 alive', () => {
    const idle = boss([]);
    const input = { ...idle, agent: { ...idle.agent, trust: 500, maxTrust: 500 } };
    const spawns = of(resolveCombat(input).events, 'spawn').filter((e) => e.d.reason === 'intent');
    expect(spawns.slice(0, 3).map((e) => [e.t, e.src, e.dst, e.d.def, e.d.index])).toEqual([
      [11_000, 'e1', 'e2', 'undocumented_behavior', 0],
      [22_000, 'e1', 'e3', 'undocumented_behavior', 0],
      [33_000, 'e1', undefined, 'undocumented_behavior', -1],
    ]);
  });

  // A fixed v3 Edit-heavy loadout (Refactor and POSIX breakpoints); all 3 layers break and the
  // Monolith resolves in time.
  it('boss fight resolves', () => {
    const result = resolveCombat(boss(['edit_file', 'sed', 'autocomplete', 'grep', 'cat'], 3));
    const log = serializeLog(result.events);
    const hash = createHash('sha256').update(log, 'utf8').digest('hex');
    expect([result.outcome, result.reason, result.endT, result.events.length]).toEqual([
      'win',
      'resolved',
      36_250,
      226,
    ]);
    expect(of(result.events, 'armorBroken').map((e) => e.d.remaining)).toEqual([2, 1, 0]);
    expect(hash).toBe('d76d206ffdf857310da776c592da8d4691abc292456f02b322536683d5e48fd1');
  });
});
