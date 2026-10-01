---
id: T067
epic: E009
title: Standup, Idle Cycle and Free Tier screens
summary: "Standup as a #standup chat thread with reply buttons showing exact outcomes, Idle Cycle heal-or-upgrade with a tool picker, and the Free Tier memory unboxing."
keywords: ["ui", "events", "standup", "rest", "free-tier", "screens"]
type: task
status: done
priority: p2
model: opus
size: M
depends_on: [T064, T046, T047]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T067: Standup, Idle Cycle and Free Tier screens

## Goal

The non-combat nodes present their choices with exact outcomes, so no click is a surprise.

## Context

- Epic: [E009](EPIC.md)
- [Screens: Standup, Idle Cycle, Free Tier rows](../../../../docs/game/ux/screens.md#other-screens)
- [Events: Rules (exact outcomes, disabled reasons)](../../../../docs/game/content/events.md)
- Code: `src/ui/screens/standup.tsx`, `src/ui/screens/rest.tsx`, `src/ui/screens/free-tier.tsx`
- Out of scope: Typed-text juice (E011).

## Acceptance Criteria

- [x] Standup shows speaker and up to 3 lines, with reply buttons stating exact outcomes and disabled choices stating the reason
- [x] Idle Cycle offers Heal or Upgrade with a tool picker
- [x] Free Tier shows the memory card with equip or stash
- [x] Playwright: each screen returns to the map after its action

## Subtasks

- [x] Standup thread
- [x] Idle Cycle
- [x] Free Tier

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.
- 2026-10-01: Screens live in `src/ui/screens/nodes/` (dir_files budget). Amounts and the Free Tier memory come from `preview()` (apply without dispatch). Equip vs stash follows the reducer's placement; the action set has no player choice. Two setup lines were split for the speaker; events.md (outside allowed paths) keeps the old wording.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: AC1 verified: vitest outcome-text.test.ts (outcome lines, reasons, speakers); e2e nodes.spec.ts Standup tests ("Needs a Test tool equipped" on a disabled reply)
- 2026-10-01: AC2 verified: e2e nodes.spec.ts Idle Cycle tests (Restore 24 Trust, 42 → 66; picker grep v1 → v2)
- 2026-10-01: AC3 verified: e2e nodes.spec.ts toSecondStandup (Keyboard Shortcuts card, "Equip in memory slot 1")
- 2026-10-01: AC4 verified: npx playwright test, 20 passed (reply, take, heal, upgrade each end on the map); npm run check exit 0
- 2026-10-01: review requested
- 2026-10-01: done (R075)
