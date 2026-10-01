---
id: T101
epic: E006
title: Combat screen route, dev-only sandbox and e2e
summary: "Second half of the split T059: the combat screen route in the real app, dev-only sandbox, result strip with Continue, and e2e through a real run fight."
keywords: ["task", "combat", "screen", "route", "only", "sandbox"]
type: task
status: done
priority: p1
model: opus
size: M
updated: 2026-10-01
related: ["EPIC.md"]
depends_on: [T100]
---

# T101: Combat screen route, dev-only sandbox and e2e

## Goal

Wire the combat view into the app: a CombatScreen for mode combatReview (loadFight from run.combat.input, createPlayback with the store speed, dispose), the sandbox rewritten on top of it and reachable only in dev builds, and e2e that plays a real fight from the title screen.

## Context

- Epic: [E006](EPIC.md)
- Split of T059 (cancelled): its Notes hold the full plan and orchestrator items
- docs/game/ux/screens.md, docs/architecture/ui.md, src/ui/combat/**, src/run/combat.ts

## Acceptance Criteria

- [x] Playwright: a replayed fight shows the agent card (Trust, Guardrails, status chips), tool cards in slot order (version, cooldown bar, next value, output) and enemy cards with intent chip and countdown
- [x] Pause, 1x, 2x, 4x and skip work, the speed persists between fights, and the status bar labels skip correctly
- [x] After fightEnd a result strip shows time, Trust delta and compactions, and Continue dispatches continue
- [x] `?sandbox` works only in dev builds; e2e drives New run -> pick -> travel -> fight -> Continue on the production build; bars use transform: scaleX
- [x] The JSX-text lint exemption for src/ui/sandbox is removed and docs/architecture/ui.md is updated

## Subtasks

- [x] CombatScreen + App mode
- [x] Sandbox rewrite, dev-only guard
- [x] e2e rewrite
- [x] Lint exemption removal, CSS trim, ui.md

## Notes

- Orchestrator 2026-10-01 (R052 F1): budget decision - the 266 deleted lines are dead sandbox CSS removed by this task's own scope (CSS trim); per RT003 intent dead-code deletions are free, also inside kept files. Counted production diff ~160 lines. budgets.md wording to be aligned by the next harness task.

- CombatScreen is `src/ui/screens/combat.tsx`; `App` routes `combatReview` to it through a new `Screen` switch in app.tsx, which the sandbox reuses. placeholder.tsx is untouched.
- The sandbox sets `run.value = fight(state, node)` (src/run/combat.ts) directly so it can choose the encounter. This dev-only shortcut skips dispatch and is commented in sandbox.tsx.
- Status bar speed shows `⏭ Skip` at skip (reuses `ui.combat.skip`) and `{n}x` otherwise. No new string keys; en-combat.ts is unchanged. R048 F2: `ui.combat.region` and `ui.sandbox.*` are now used.
- `npm run e2e` only serves the production preview, and playwright.config.ts is out of scope, so the dev-build half of AC4 was checked once with a throwaway config against `vite` dev (see Log). The config was then deleted.
- Production diff (`git diff --numstat -M`, new files included, without tests and Markdown): 98 added, 327 deleted. 266 of the deleted lines are dead sandbox CSS in combat.css (log, status bar, harness picker, stage, header).

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: AC1 verified: tests/e2e/combat.spec.ts (npm run e2e, 3 passed). Agent card: Terminal Purist, trust n/80, Guardrails, Stun chip. Tools tool-0..2: grep/cat/sed with version, charge bar, next value, output. Enemy cards: Typo/Context Drift with intent chip and `n.n s` countdown
- 2026-10-01: AC2 verified: same spec. 4x/1x/2x set aria-pressed and the status bar label. Pause freezes the clock for 300 ms; 4x resumes. Skip shows `⏭ Skip` and ends the fight. The next fight (p1-r2-c0) opens with Skip pressed and the result shown at once
- 2026-10-01: AC3 verified: same spec. Result strip shows `Resolved in n.n s`, `-18 Trust`, `2 compactions`; Continue is focused and moves the run to phase-1/reward
- 2026-10-01: AC4 verified: smoke.spec.ts on the production build: `/?sandbox` shows the title with no sandbox link and no setup form. dist JS has no sandbox code (grep setup__label and ?sandbox: 0). combat.spec.ts drives New run -> pick -> travel -> fight -> Continue and asserts every .bar__fill has `transform: scaleX(`. Dev build: throwaway Playwright config on `vite --port 5287` (title link -> ?sandbox -> Fight region, encounter p1e2, skip -> result) 1 passed, then deleted. combat.spec.ts --repeat-each 5: 5 passed
- 2026-10-01: AC5 verified: src/ui/jsx-text.test.ts has no exemption (sandbox labels use t()); npx vitest run src/ui: 47 passed. docs/architecture/ui.md: Screens (CombatScreen) and Dev sandbox route rewritten, related_code extended
- 2026-10-01: checks: npm run check exit 0 (harness 0 errors), npm run build exit 0, npm run e2e exit 0 (3 passed)
- 2026-10-01: review requested
- 2026-10-01: R052 changes-requested (1 major: diff counting); orchestrator budget decision recorded in Notes; round 2
- 2026-10-01: done (R053)
