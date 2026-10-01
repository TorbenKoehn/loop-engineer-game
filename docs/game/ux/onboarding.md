---
title: Tutorial and onboarding
summary: First-run flow, the scripted tutorial fight with event-keyed pauses, first-time tips, progressive disclosure, the codex and the why-did-I-lose summary.
keywords: [onboarding, tutorial, tips, codex, progressive-disclosure, ux]
type: gdd
status: active
updated: 2026-10-01
related: [screens.md, accessibility.md, ../core-loop.md, ../systems/context.md, ../vertical-slice.md]
---

# Tutorial and onboarding

Goal: a new player understands tools, the context bar and compaction after one fight,
and makes the first real build decision within 60 s of "New run".

## First-run flow

1. Title -> "New run" shows one intro card (3 lines): "You are an AI agent. Your human
   trusts you. Ship the release before they press Ctrl+C."
2. Harness select shows only **IDE Companion** and **Terminal Purist**; IDE Companion is
   pre-selected and tagged "Recommended for your first run".
3. System prompt pick with one tip line: "Prompts cost context. Smaller is leaner."
4. The map's row 1 is a single **Tutorial** Task (encounter `p1e1`: three Typos).
5. After the tutorial, the normal map appears with a tip on node types.

The tutorial is offered again via Settings -> Tutorial tips -> reset.

## Tutorial fight (scripted pauses, same sim)

The sim is the normal sim; the UI pauses playback when specific events appear in the log.
No extra randomness and no special rules, so the tutorial stays deterministic.

| # | Pause trigger | Highlight | Text (≤ 2 lines) |
|---|---|---|---|
| 1 | `t = 0` | Tool row | "Your tools fire on their own when their bar fills. Left to right." |
| 2 | first `toolFired` | Context bar | "Every tool call adds tokens to your context. Watch the bar." |
| 3 | first `enemyActed` | Intent chip | "Enemies show what they will do next and when." |
| 4 | first `zoneChanged` or `t = 8000` | Zone ticks | "Cyan is Focused: +20%. Too empty is Cold, too full is Rot." |
| 5 | first `compaction` or fight end | Policy marker | "When context overflows you compact and lose time. Set the policy in the build panel." |
| 6 | fight end | Log | "Everything that happened is in the log. Hover a line to see why." |

Each pause shows "Continue" (`Enter`) and "Skip tutorial". Pauses 4 and 5 have
fallbacks because a short fight may not change zone or compact.

## First-time tips

One tip the first time each thing appears; tips never block input and dismiss on any
action. Stored in the meta save.

| Trigger | Tip |
|---|---|
| First reward screen | "Pick one. Duplicates upgrade a tool to v2 and v3." |
| First shop | "Holding 10+ Credits earns interest after fights." |
| First Standup | "Every choice shows its exact outcome." |
| First Idle Cycle | "Heal, or upgrade a tool. Both are good." |
| First elite on the map | "Critical Bugs are hard but drop a Memory." |
| First Rot zone | "Rot: tools charge 30% slower and noise doubles." |
| First Throttle | "Throttled tools stop charging. Mix fast and slow tools." |
| First boss on the map | "Bosses have stages. Read their card before the fight." |
| Build panel opened | "Order matters: pipes flow right; the leftmost tool wins ties." |

## Progressive disclosure

| Feature | Hidden until |
|---|---|
| Swarm Orchestrator, YOLO Mode cards | Shown locked after the first run |
| Unlock tree | First run ends |
| Lint rules, Endless | First Shipped |
| Daily seed | 3 runs completed |
| Damage formula in tooltips | Always, but collapsed to "Details" on the first run |

## Codex

Glossary of every term in [vision](../vision.md), plus every item and enemy seen so far
(unseen ones show `???`). Each entry: plain-English line, stats, first-seen run. Opens with
`F1` or from the top bar.

## Why did I lose? (run-end summary)

Computed from the run's event logs (no extra tracking):

- **Cause**: the enemy, effect or Deadline that dealt the final damage.
- **Top 3 damage sources** this run, as text bars.
- **Time per zone** in the last fight (Cold, Focused, Rot) and compaction count.
- **One hint**, picked by rules: e.g. > 40% of time in Rot -> "Try a lower compaction
  policy or `summarize`"; > 3 Throttles -> "Mix cooldowns or take Lockfile"; died to
  Deadline -> "Your build lacked damage: prioritise upgrades".
- The AGENTS.md lesson offer follows, tied to the same data.
