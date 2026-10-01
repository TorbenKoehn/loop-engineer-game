---
title: Game design references for Loop Engineer
summary: Lessons from auto-battlers and roguelites (SAP, Bazaar, Backpack Battles, TFT, StS, Hades, Balatro, DD, FTL, ItB) plus three context-mechanic variants.
keywords: [game-design, auto-battler, roguelite, context-mechanic, run-structure, meta-progression, juice]
type: research
status: active
updated: 2026-10-01
related: [game-design-proposal.md, tech-stack.md, ../../../CONCEPT.md, game-design-references-principles.md]
---

# Game design references

## Contents
- 1. Auto-battlers: where the decisions live
- 2. Roguelites: run structure and pacing
- 3-4. Cross-cutting principles and resource mechanics

Short, opinionated notes on what Loop Engineer should take from each reference.
"Steal" = adopt it; "Avoid" = known trap.

## 1. Auto-battlers: where the decisions live

In an auto-battler, combat is the result of decisions made earlier. Every reference
puts the decision density **between** fights and makes the fight a readable payoff.

| Game | Core structure | Steal | Avoid |
|---|---|---|---|
| **Super Auto Pets** | 5 units in a single line, only ATK/HP, front unit fights front unit | Single-line layout makes position meaningful and easy to read. Two stats only. One unique trigger per unit, explained by a one-line tooltip | Asynchronous PvP (we are solo) |
| **The Bazaar** | Items on a "rug" with a slot limit (4, then +2 per level up to 10). Items are size 1/2/3. Each item fires on its own cooldown. Haste/Slow/Freeze/Charge change cooldowns | **Tools = items on cooldowns.** Slot or size limits as the build constraint. A small, clear set of cooldown statuses. "Sandstorm" overtime that stops stalled fights | Item pool so big that new players can't parse the rug |
| **Backpack Battles** | Arrange items in a grid. Star markers show adjacency bonuses. Recipes merge adjacent items. Stamina has to sit in the middle of its bar; mana buffs feed magic items | **Adjacency as synergy** (our version: Unix pipes `a \| b`). A **middle-of-the-bar resource**: too high wastes potential, too low misses attacks | Free-form grids (a lot of UI to build, hard for AI agents to test) |
| **TFT** | Traits activate at breakpoints (2/4/6). Gold earns interest (+1 per 10, max at 50). Augments | Tag breakpoints give long-term build goals. Interest makes saving vs spending a real decision | Augments that skip straight to a top breakpoint (Riot's own lesson) |

Sources: [SAP mechanics (a327ex)](https://a327ex.com/posts/super_auto_pets_mechanics),
[SAP Wikipedia](https://en.wikipedia.org/wiki/Super_Auto_Pets),
[Bazaar gameplay (Game8)](https://game8.co/articles/latest/the-bazaar-gameplay-and-story-info),
[Bazaar keywords (Mobalytics)](https://mobalytics.gg/the-bazaar/guides/keywords-and-terms),
[Bazaar 2025 state (PC Gamer)](https://www.pcgamer.com/games/card-games/after-its-disastrous-launch-last-year-im-here-to-tell-you-that-2025s-most-promising-auto-battler-finally-lives-up-to-its-potential/),
[Backpack Battles mechanics (dood.gg)](https://dood.gg/en/backpack-battles/guides/mechanic-guide/),
[Backpack Battles tips (TheGamer)](https://www.thegamer.com/backpack-battles-beginner-tips-tricks/),
[TFT /dev learnings](https://teamfighttactics.leagueoflegends.com/en-us/news/dev/dev-teamfight-tactics-monsters-attack-learnings/),
[TFT design analysis](https://medium.com/@ZiberBugs/game-design-analysis-teamfight-tactics-bc6eb5aafeff).

**Takeaway:** the Bazaar model (items on cooldowns, no unit movement, solo vs one
enemy group) fits Loop Engineer best. The player *is* one agent, and tools firing on
timers is how agents actually work. Movement-based chess boards (TFT) add simulation
and UI cost without fitting the theme.

## 2. Roguelites: run structure and pacing

### Slay the Spire: the map is the strategy layer
- Branching DAG of 15 floors plus a boss. Room mix: monster 53%, elite 8%, rest 12%,
  merchant 5%, unknown 22%. Rules: no elite or rest before floor 6, no two
  elite/rest/shop rooms in a row, guaranteed treasure mid-act, rest before the boss.
  ([wiki](https://slaythespire.wiki.gg/wiki/Map_Generation),
  [Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2830078257),
  [arXiv analysis](https://arxiv.org/html/2504.03918v1))
- Path choice is risk vs reward you can see ahead: more elites mean more relics and
  more danger. **Steal:** a visible map with fixed placement rules, so every route is
  viable.
- Enemy **intents** are shown above enemies. **Steal:** telegraph every enemy action.
- **Ascension 1–20** adds one rule per level. That is cheap content with a long tail.
- Balance came from play metrics: card pick rates and win rates
  ([GDC 2019, Giovannetti](https://www.gdcvault.com/play/1025731/-Slay-the-Spire-Metrics),
  [slides PDF](https://media.gdcvault.com/gdc2019/presentations/Giovannetti_Anthony_SlayTheSpire.pdf)).
  We go one step further and get the metrics from **headless bot runs** before any human
  plays (see tech-stack.md).

### Hades: meta-progression that respects skill
- Mirror of Night gives modest permanent upgrades. Keys unlock options (sidegrades),
  not raw power.
  ([TheGamer](https://www.thegamer.com/hades-mirror-of-night-roguelite-progression/))
- Pact of Punishment: an à-la-carte list of difficulty modifiers ("Heat"). Higher
  Heat gives better rewards
  ([RPG Site](https://www.rpgsite.net/feature/10287-hades-pact-of-punishment-heat-modifiers-and-how-to-maximize-your-rewards)).
  **Steal:** our ascension is a list of *lint rules* the player switches on
  (`max-context: 64k`, `no-internet`, `rate-limit: strict`).
- Narrative carries over between deaths. **Steal (lightly):** a persistent
  `AGENTS.md` memory between runs (see proposal).

### Vampire Survivors: time to first choice
- One verb. The first level-up comes within 1–2 minutes. Pick 1 of 3–4 upgrades.
  Evolutions are hidden pairs (max-level weapon + matching passive).
  ([analysis](https://www.kokutech.com/blog/gamedev/design-patterns/power-fantasy/vampire-survivors),
  [Wikipedia](https://en.wikipedia.org/wiki/Vampire_Survivors))
- **Steal:** the first real build decision within 60 s of starting a run.
  **Steal:** "evolutions": two specific items combine into a named upgrade
  (`grep` + `Regex Mastery` -> `ripgrep`).

### Balatro: arithmetic that feels like fireworks
- The score is a simple formula (chips x mult), so every Joker's effect is easy to
  read. Scoring is staged one step at a time with sound and screen shake. Hand size
  and discards are resources you can upgrade
  ([juice breakdown](https://blakecrosley.com/guides/design/balatro),
  [Wikipedia](https://en.wikipedia.org/wiki/Balatro),
  [Rolling Stone interview](https://www.rollingstone.com/culture/rs-gaming/balatro-localthunk-interview-1235214060/)).
- **Steal:** one visible formula for damage
  (`base x multipliers`, shown on hover). Resolve events **one at a time** with a
  rising pitch. Make limits (hand size, here context window) into upgradable stats.

### Darkest Dungeon: a meter that creates stories
- Stress is a second health bar. At 100 there is a resolve check: about 25% virtue,
  75% affliction, shown as a big dramatic moment. At 200 the hero dies. Recovery
  costs money and time between runs.
  ([Game Developer deep dive](https://www.gamedeveloper.com/design/game-design-deep-dive-i-darkest-dungeon-s-i-affliction-system))
- **Steal:** a threshold event that is a *moment*: when context overflows, the
  "auto-compaction" plays out on screen. **Avoid:** permanent hero loss. It's too
  punishing for a 30-minute run.

### FTL: power you allocate
- A reactor's power bars are shared between systems. Scarcity forces trade-offs
  (shields vs weapons) and enemies target your systems
  ([FTL wiki: Systems](https://ftl.fandom.com/wiki/Systems),
  [subsystems analysis](https://www.vigaroe.com/2022/08/ftl-analysis-subsystems.html?m=1)).
- **Steal:** loadout items cost a share of a fixed budget (tool definitions take up
  context tokens). Enemies can attack your systems (disable a tool for a while).

### Into the Breach: perfect information
- Every enemy attack is shown a turn ahead, which turns combat into a puzzle. RNG was
  deliberately kept small
  ([GDC postmortem](https://www.gdcvault.com/play/1025772/-Into-the-Breach-Design),
  [80.lv summary](https://80.lv/articles/gdc-2019-an-inside-look-at-into-the-breach)).
- **Steal:** each enemy shows its next action and a countdown. Combat is fully
  deterministic once the seed is known. No hidden dice rolls on damage.

## 3-4. Cross-cutting principles and resource mechanics

Moved to [game-design-references-principles.md](game-design-references-principles.md).

