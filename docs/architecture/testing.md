---
title: Testing strategy
summary: Test levels (unit, property, golden logs, architecture, balance sim, Playwright smoke and visual), coverage budgets, bots, balance CLI, CI order and what each milestone requires.
keywords: [testing, vitest, fast-check, golden-logs, balance-sim, playwright, coverage]
type: doc
status: active
updated: 2026-10-01
related: [sim-core.md, event-log.md, run-state.md, save.md, ../game/milestones.md, ../game/vertical-slice.md]
---

# Testing strategy

## Contents
- Levels
- Coverage budgets (Vitest v8 coverage, enforced in CI)
- Property tests (fast-check)
- Golden logs
- Balance sim (`tools/balance`)
- Playwright
- CI order (fail fast)
- Rules for agents writing tests

All tests are written to be run and read by AI agents: deterministic, fast, asserting on
data and text rather than pixels where possible.

## Levels

| Level | Tool | Scope | Location |
|---|---|---|---|
| Unit | Vitest (node env) | Every helper, effect kind, trait, status rule, zone threshold, map rule, shop rule, reducer action | `src/**/*.test.ts` |
| Property | fast-check | Sim and run invariants (below) | `src/**/*.prop.test.ts` |
| Golden logs | Vitest | Fixed seeds -> combat log hashes and run summaries | `src/sim/golden/` (helpers `tools/golden/`) |
| Architecture | Vitest | Import rules ([overview](overview.md)); the determinism ban on globals is a Biome override, tested in `tools/biome/sim-ban.test.ts` | `tests/arch.test.ts` |
| Content | Vitest | `validate.ts` rules ([content model](content-model.md)) | `src/content/*.test.ts` |
| UI unit | Vitest + happy-dom | View fold, formatters, i18n, components with logic | `src/ui/**/*.test.tsx` |
| Balance | `tools/balance` CLI | Win rates, pick rates, fight lengths | CI job + reports |
| E2E smoke | Playwright (Chromium) | Scripted runs via UI at `speed=skip` | `tests/e2e/` |
| Visual | Playwright `toHaveScreenshot` | Key screens, themes, text 150%, colour-vision filters | `tests/e2e/visual/` |
| Accessibility | Playwright + axe-core | 0 serious/critical violations per screen | `tests/e2e/a11y/` |

## Coverage budgets (Vitest v8 coverage, enforced in CI)

Numbers live in `harness.config.json` ([budgets table](../harness/budgets-table.md)): `coverage_sim_lines`, `coverage_sim_branches`, `coverage_total_lines`. Do not restate them here. `src/render-fx` and `src/audio` have no gate (covered by smoke).

## Property tests (fast-check)

1. `0 ≤ F ≤ W` after every tick; `S ≥ B`; `N ≥ 0`.
2. Every fight ends by `deadlineMs + 30 000`.
3. `resolveCombat(x)` twice -> identical logs; fast-forward equals stepping.
4. Trust and Severity never increase except via listed heal/grow/spawn events.
5. Event `seq` strictly increases; `t` never decreases; `t` is a multiple of 50.
6. Random legal action sequences never throw and end in `runEnd` (≤ 2000 actions).
7. `replay(seed, actions)` deep-equals the incremental state.
8. All stored numbers are safe integers.

Arbitraries generate random loadouts from real content, random encounters and random
policies; shrinking is kept on to get minimal failing loadouts.

## Golden logs

- M1: 20 seeds (both harnesses, every slice encounter at least once). M2: 30 seeds across
  phases 1–3 and Endless loop 2.
- Stored: `tools/golden/fixtures/` with per-fight `{ nodeId, inputHash, logHash,
  events }`, plus full JSONL for short reference fights.
- M1 stores 1 full reference log plus a hash summary of 5 seeds until the real combat sim
  exists; T024 adds the full 5 reference fights.
- Goldens are updated only via `npm run golden:update` (sets `GOLDEN_UPDATE=1`), never
  `vitest -u`. A missing golden fails the test. The change description says why.
- Node-only golden helpers (file IO, update mode) live in `tools/golden/`.

## Balance sim (`tools/balance`)

```
node tools/balance/cli.ts --runs 1000 --harness all --bot greedy --phase 1 \
     --seed-from 1 --out reports/balance.json --md reports/balance.md
node tools/balance/replay.ts <save-string> [--fight p1-r3-c2 --log]
```

Bots (pure functions `(state, legal) -> Action`, seeded by the run seed):

| Bot | Policy |
|---|---|
| `random` | Uniform over legal actions (fuzzing) |
| `greedy` | Scores options with a fixed heuristic (damage per weight, upgrades first, heal below 50%), interest-aware; the reference bot for win-rate targets |
| `expert` | Greedy + 1-fight lookahead: simulates the next encounter with each candidate loadout change (≤ 8 candidates) |

Report: win rate per harness and prompt (with 95% interval), phase reached histogram,
pick rate and win-when-picked per item, winning-loadout share per tool, archetype win
rates, fight-length median/p90 per encounter type, Trust lost per fight, credits
curve, compactions per fight. CI fails when a milestone target is violated; targets live
in `tools/balance/targets.json`, copied from the GDD.

Speed: ≥ 200 full runs per second per core (logs off). 1000 runs per harness in CI.

## Playwright

- Smoke (every PR): new run with a fixed seed, `fx=off`, `speed=skip`; a scripted policy
  picks via the UI (clicks and keys) through Phase 1 (M1) or all phases (M2+); asserts
  on text and roles; finishes in < 60 s (M1).
- Save round trip: export at a shop, reload, import, continue, compare the final summary.
- Keyboard-only run (M3): no mouse events allowed.
- Visual (nightly): map, shop, combat paused at tick N, run end; each theme; text 150%;
  pseudo-locale. Fonts self-hosted, animations disabled, `page.clock` fixed.

## CI order (fail fast)

1. Type-check (`tsc --noEmit`, TS 7), Biome lint/format, `harness:lint`.
2. Unit + property + content + architecture tests with coverage gates.
3. Golden logs.
4. Balance sim (M1: phase 1, 1000 runs per harness).
5. Playwright smoke and save round trip.
6. Nightly: visual, accessibility, pseudo-locale, 10 000-save replay soak (M3).

## Rules for agents writing tests

- One behaviour per test; names state the rule (`'Rot slows charge to 70%'`).
- Use builders (`makeTool`, `makeEnemy`, `fight()`) from `src/sim/testing/`; never
  hand-build full state.
- Assert on events (`expectEvents(log).toContain({ kind: 'compaction', v: 1000 })`)
  rather than internal fields.
- No sleeps or real timers; inject the clock.
