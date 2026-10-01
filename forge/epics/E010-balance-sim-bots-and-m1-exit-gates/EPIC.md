---
id: E010
title: Balance sim, bots and M1 exit gates
summary: "Headless tools/balance: random and greedy bots, batch CLI and report, targets gate, seed replay CLI, run-level goldens, sim fast-forward, M1 tuning pass and the full-run Playwright smoke."
keywords: ["balance", "bots", "cli", "golden-logs", "playwright", "exit-criteria", "m1"]
type: epic
status: backlog
priority: p1
updated: 2026-10-01
related: ["../../../docs/architecture/testing.md", "../../../docs/game/vertical-slice.md", "../../../docs/game/milestones.md", "../../../docs/game/content/phase-1-implement.md", "../../../docs/architecture/sim-core.md"]
---

# E010: Balance sim, bots and M1 exit gates

## Goal

M1 vertical slice. After this epic the measurable M1 exit criteria are checked by tools: bot win rates, loadout diversity and fight lengths from the balance CLI, byte-identical golden logs on 20 seeds, and a scripted Playwright run that finishes Phase 1 in under 60 s.

## Scope

- Bots random and greedy; balance CLI with JSON and Markdown reports ([testing](../../../docs/architecture/testing.md))
- targets.json from the GDD and a failing CI gate; seed replay CLI
- Run-level golden logs on 20 seeds; sim fast-forward with stepping equivalence
- Tuning pass to hit [vertical-slice](../../../docs/game/vertical-slice.md) exit criteria 1, 2 and 5
- Playwright full-run smoke at skip speed and save round trip

## Out of Scope

- Expert bot and lint-level balance (E022)
- M2 full-game balance targets (E018)
- Moderated human playtest for exit criterion 3 (orchestrator/user activity, not a task)

## Definition of Done

- [ ] All E010 tasks done with approved reviews
- [ ] `npm run balance:check` passes for exit criteria 1, 2 and 5
- [ ] Golden logs on 20 seeds are byte-identical in CI (exit criterion 4)
- [ ] Playwright smoke finishes a Phase-1 run in < 60 s (exit criterion 8)
