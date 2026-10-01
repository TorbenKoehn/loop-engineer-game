---
id: T062
epic: E006
title: Tooltip component and item tooltips with formula
summary: "Reusable tooltip (250 ms hover, keyboard focus, Esc) and tool, skill and memory tooltips with name, plain-English line, stats and the damage formula with current numbers."
keywords: ["tooltips", "ui", "formula", "plain-english", "accessibility", "items"]
type: task
status: backlog
priority: p2
model: opus
size: M
depends_on: [T101, T010, T045]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T062: Tooltip component and item tooltips with formula

## Goal

Every item explains itself in plain English with its damage formula and current numbers,
so players learn the rules from the game itself. This task builds the tooltip component
and the item describers; enemies, statuses, traits and zones follow in T109.

## Context

- Epic: [E006](EPIC.md); [Screens: Tooltips](../../../../docs/game/ux/screens.md#tooltips-and-the-combat-log)
- [Content model: Generated text](../../../../docs/architecture/content-model.md#generated-text), `src/content/text/`
- `src/sim/combat/damage.ts` (formula inputs "exactly as the tooltip shows them"; path after T105, see its Log)
- [Onboarding: Progressive disclosure (Details)](../../../../docs/game/ux/onboarding.md#progressive-disclosure)
- New files in `src/ui/tooltip/`; player text as string keys in `src/content/strings/`, then `npm run content:index`
- Out of scope: enemy, status, trait and zone tooltips (T109); attaching tooltips to reward, shop or build panel cards; Codex (E017); screen-reader verbose mode (E020).

## Acceptance Criteria

- [ ] UI test `tooltip opens on hover delay and focus` passes: a combat tool card opens its tooltip after 250 ms hover and on keyboard focus, and Esc closes it
- [ ] Unit test over a fixture loadout passes: tool, skill and memory tooltips show name, plain-English line, stats and the formula with current numbers in the shape `6 base +3 flat x(100+20+30)% = 14`, values taken from the sim's formula inputs
- [ ] Test passes: on the first run the formula is collapsed under Details, on later runs it is expanded
- [ ] Test passes: tooltip text comes only from generated templates and string keys (no literal player text in the tooltip modules)

## Subtasks

- [ ] Tooltip component (delay, focus, Esc, aria-describedby)
- [ ] Item describers on the generated text
- [ ] Formula renderer from the damage breakdown
- [ ] Attach to the combat tool row

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.
- 2026-10-01 (RT005 re-size): narrowed to the component and item tooltips (~250 production lines); enemies, statuses, traits, zones and the R078/R083 orchestrator notes moved to T109. Report CSS separately (≤ 300).

## Log

- 2026-10-01: created
