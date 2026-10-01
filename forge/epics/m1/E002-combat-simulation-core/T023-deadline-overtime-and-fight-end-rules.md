---
id: T023
epic: E002
title: Deadline overtime and fight-end rules
summary: "Deadline damage k per second after deadlineMs to enemies then agent, bypassing Guardrails; the timeout cap; death checks with ties to the player; agentAfter carry-over."
keywords: ["sim", "deadline", "overtime", "fight-end", "timeout"]
type: task
status: done
priority: p1
model: opus
size: S
depends_on: [T019]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T023: Deadline overtime and fight-end rules

## Goal

Every fight ends: overtime damage grows each second after the Deadline and a hard cap guarantees termination, while ties favour the player.

## Context

- Epic: [E002](EPIC.md)
- [Combat: Deadline and fight end, Tick order steps 7-8](../../../../docs/game/systems/combat.md#deadline-and-fight-end)
- [Simulation core: API (CombatResult)](../../../../docs/architecture/sim-core.md#api)
- Code: `src/sim/combat/deadline.ts`, `src/sim/combat/end.ts`
- Out of scope: Error Budget memory (E014), Deadline UI (E006), armor bypass (checked again in E007).

## Acceptance Criteria

- [x] Test `deadline damage` deals k to every enemy then k to the agent at each full second k after deadlineMs, bypassing Guardrails
- [x] A fight reaching deadlineMs + 30 000 ends with outcome loss, reason timeout
- [x] When all enemies and the agent drop to 0 in the same tick the outcome is win (test)
- [x] `CombatResult.agentAfter` carries Trust and maxTrust; Guardrails and statuses are not carried

## Subtasks

- [x] Deadline step
- [x] Timeout cap
- [x] Death-check order

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.
- 2026-10-01: R014 F2: the deadlineMs + 30 000 timeout cap already existed in `resolve.ts` (added by T018). This task moved it unchanged into `end.ts` (`checkEnd`) after the death checks, and did not add a second cap.
- 2026-10-01: Deadline damage goes through `dealDamage` with `Amount.bypass` (Guardrails skipped; armor in E007 must honour the flag). It hits only living units, emits `deadline` (v k) first, uses src `sys`, sets `killedBy: 'sys'` and counts toward `stats.damageTaken`. `k = (t - deadlineMs) / 1000` on full seconds after the Deadline, so the Deadline tick itself deals nothing.
- 2026-10-01: At the cap tick the order is Deadline damage (k = 30), then win, then Trust loss, then timeout. Ties go to the player.
- 2026-10-01: Test fixtures that used `deadlineMs: 1000` only to shorten fights were adjusted. In `effects.test.ts` the default Deadline is now used and `damageTaken` is 36: Deadline damage bypasses Guardrails. In `resolve.test.ts` the stalled fight now uses Severity/Trust 1000. `src/ui/sandbox/fold.test.ts` "timeout fight" now ends by Deadline damage (win), so its outcome, reason and resolved expectations come from `resolveCombat`, and the test was renamed to "overtime fight". Only expectation derivation changed, not the input.
- 2026-10-01: Doc follow-up (outside allowed paths): `docs/architecture/sim-core.md` related_code could list `src/sim/combat/deadline.ts` and `end.ts`. No described behaviour changed.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: AC1 verified: `npx vitest run src/sim/combat/deadline.test.ts`, describe `deadline damage` (3 passed). Event order at 2000/3000 ms: deadline k, e1, e2, a; `d.guard` 0 with Guardrails up; Severity/Trust 97 after k = 1 + 2.
- 2026-10-01: AC2 verified: `fight end > a fight reaching deadlineMs + 30 000 ends with loss by timeout` (endT 31 000, Trust 1000 - 465) plus `resolve.test.ts` stalled/timeout invariants
- 2026-10-01: AC3 verified: `fight end > all enemies and the agent at 0 in the same tick is a win` (win/resolved at 2000, agentAfter.trust 0)
- 2026-10-01: AC4 verified: `fight end > agentAfter carries Trust and maxTrust, not Guardrails or statuses` (toEqual exactly {trust, maxTrust, usedOncePerRun} after guard + Haste)
- 2026-10-01: gate: `npm run check` all steps passed (tsc, biome, vitest 357 passed, harness lint 0 errors). Production diff 96 lines.
- 2026-10-01: review requested
- 2026-10-01: done (R037)
