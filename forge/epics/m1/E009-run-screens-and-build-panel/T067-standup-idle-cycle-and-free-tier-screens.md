---
id: T067
epic: E009
title: Standup, Idle Cycle and Free Tier screens
summary: "Standup as a #standup chat thread with reply buttons showing exact outcomes, Idle Cycle heal-or-upgrade with a tool picker, and the Free Tier memory unboxing."
keywords: ["ui", "events", "standup", "rest", "free-tier", "screens"]
type: task
status: backlog
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

- [ ] Standup shows speaker and up to 3 lines, with reply buttons stating exact outcomes and disabled choices stating the reason
- [ ] Idle Cycle offers Heal or Upgrade with a tool picker
- [ ] Free Tier shows the memory card with equip or stash
- [ ] Playwright: each screen returns to the map after its action

## Subtasks

- [ ] Standup thread
- [ ] Idle Cycle
- [ ] Free Tier

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
