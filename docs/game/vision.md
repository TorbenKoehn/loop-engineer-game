---
title: Vision and pillars
summary: Elevator pitch, design pillars, anti-pillars, tone and naming rules, and the glossary that maps game terms to plain meaning for Loop Engineer.
keywords: [vision, pillars, glossary, tone, satire, naming]
type: gdd
status: active
updated: 2026-10-01
related: [core-loop.md, milestones.md, systems/context.md, ../research/game/game-design-proposal.md]
---

# Vision and pillars

## Elevator pitch

You are an AI agent stuck in the engineering loop. Pick a **Harness**, fill your context
window with tools, and watch your build fight through a release cycle of bugs, rate limits
and stakeholders. The hard part is not the bugs, it is your own **context**: too little and
you guess, too much and you rot.

Genre: single-player roguelite auto-battler (The Bazaar-style cooldown combat on a
Slay the Spire-style map). Platform: desktop browser, mouse or keyboard. Run length:
30–40 minutes for a full run (3 phases), 10–15 minutes per phase.

## Pillars

1. **Plan, then watch it run.** Every decision happens between fights: route, shop, tool
   order, policies. Combat is a deterministic, readable replay of those decisions. If you
   lose, the log tells you why.
2. **Context is the tension.** One bar with a sweet spot. Every bit of power has a token
   cost. Enemies attack your attention as well as your Trust.
3. **Satire you don't need a CS degree for.** Jokes are flavour. Mechanics are plain verbs
   (damage, shield, slow, freeze). Every joke has a plain-English tooltip line.
4. **Seeded, telegraphed, fair.** Same seed and same choices give the same run. Enemies
   show their next move. Combat has no hidden dice. This also makes the game testable by
   AI agents.

Every feature proposal must name the pillar it serves. A feature that serves none is cut.

## Anti-pillars

- No real-time micro control inside combat (only pause, speed and the log).
- No PvP, no accounts, no online requirement.
- No art-heavy content: the look is text, glyphs, colour and motion.
- No lore dumps: one line of flavour per item, at most three lines per event.
- No permanent stat grinding: meta unlocks are sidegrades (see
  [meta-progression](systems/meta-progression.md)).

## Tone and naming rules

- Parody names only. Never use a real company, product, service or brand name, logo or
  trademark. Generic tools and concepts are fine (`grep`, `sed`, `.gitignore`, "CI",
  "rate limit"). When in doubt, invent a parody ("Stack Underflow", "IDE Companion").
- The human is never the enemy. The player agent wants to help; the bugs and the process
  are the antagonists.
- Jokes punch at situations (flaky tests, scope creep), never at people or groups.
- English everywhere. All player-facing text lives in string tables
  ([localisation](ux/localisation.md)).

## Glossary

| Concept | In-game name | Plain meaning |
|---|---|---|
| Player HP | **Trust** | The human's trust in you. At 0 they press Ctrl+C and the run ends |
| Enemy HP | **Severity** | How much work is left. Reduce it to 0 to resolve the enemy |
| Context resource | **Context** (tokens, shown as `k`) | Fill level of your window, see [context](systems/context.md) |
| Gold | **Credits** | API credits, earned per fight, spent in the Package Registry |
| Shield | **Guardrails** | Absorbs damage before Trust |
| Act | **Phase** | Implement, Test, Deploy |
| Character class | **Harness** | Model stats + starting tools + skill + trait |
| Active item | **Tool** | Fires automatically on a cooldown |
| Passive item | **Skill** | A rule that changes how tools behave |
| Relic | **Memory** | A run-long passive with a token cost |
| Ascension | **Lint rules** | Opt-in difficulty modifiers |
| Meta currency | **Training Data** | Earned every run, spent on unlocks |
| Win screen | **Shipped!** | You beat the Deploy boss |
| Loss screen | **^C** | Trust hit 0 |

## Success criteria for the full game

- Players can explain the context bar after the tutorial fight.
- Both starter harnesses win a full run at 35–65% with the greedy balance bot.
- A losing player can name the reason from the end-of-run summary.
- Accessible: colour-blind safe, fully keyboard playable, reduced-motion mode
  ([accessibility](ux/accessibility.md)).

Milestones and exit criteria: [milestones](milestones.md).
