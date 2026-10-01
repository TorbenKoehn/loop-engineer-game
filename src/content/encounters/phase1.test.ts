import { describe, expect, it } from 'vitest';
import { enemies } from '../enemies/index.ts';
import { phase1Encounters } from './phase1.ts';

// docs/game/content/phase-1-implement.md "Encounter pools", front to back.
const POOLS = [
  ['p1e1', 'easy', ['typo', 'typo', 'typo']],
  ['p1e2', 'easy', ['typo', 'context_drift']],
  ['p1e3', 'easy', ['typo', 'rate_limit']],
  ['p1e4', 'easy', ['typo', 'typo', 'scope_creep']],
  ['p1e5', 'easy', ['typo', 'unreachable_service']],
  ['p1h1', 'hard', ['context_drift', 'dependency_hell']],
  ['p1h2', 'hard', ['scope_creep', 'rate_limit']],
  ['p1h3', 'hard', ['typo', 'context_drift', 'unreachable_service']],
  ['p1h4', 'hard', ['rate_limit', 'dependency_hell']],
  ['p1h5', 'hard', ['typo', 'scope_creep', 'context_drift']],
  ['p1x1', 'elite', ['install_dependency', 'update_toolchain', 'fix_unrelated_bug', 'yak_shave']],
  ['p1b', 'boss', ['legacy_monolith']],
] as const;

// docs/game/systems/combat.md "Deadline and fight end".
const DEADLINE = { easy: 45000, hard: 45000, elite: 50000, boss: 75000 } as const;

describe('phase-1 encounters match the pools table', () => {
  it('lists p1e1-p1e5, p1h1-p1h5, p1x1 and p1b with enemies front to back', () => {
    const got = phase1Encounters.map((e) => [e.id, e.pool, e.enemies]);
    expect(got).toEqual(POOLS);
  });

  it('sets deadlineMs 45000 / 50000 / 75000 by pool', () => {
    for (const e of phase1Encounters) {
      expect([e.id, e.phase, e.deadlineMs]).toEqual([e.id, 1, DEADLINE[e.pool]]);
    }
  });

  it('references only defined enemies, at most 5 per encounter', () => {
    const ids = new Set<string>(enemies.map((e) => e.id));
    for (const e of phase1Encounters) {
      expect(e.enemies.length).toBeLessThanOrEqual(5);
      for (const id of e.enemies) expect(ids.has(id), `${e.id}: ${id}`).toBe(true);
    }
  });

  it('Copy-Paste Clone and p1x2 are absent', () => {
    expect(phase1Encounters.map((e) => e.id)).not.toContain('p1x2');
    const used = phase1Encounters.flatMap((e) => e.enemies);
    expect(used).not.toContain('copy_paste_clone');
    expect(enemies.map((e) => e.id)).not.toContain('copy_paste_clone');
  });
});
