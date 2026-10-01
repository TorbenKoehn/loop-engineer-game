---
title: Game design references - principles and resource mechanics
summary: Cross-cutting lessons from the reference games and three resource-mechanic variants that could model the context window.
keywords: [game-design, principles, context-mechanic, resources, roguelite]
type: research
status: active
updated: 2026-10-01
related: [game-design-references.md, game-design-proposal.md]
---

# Game design references - principles and resource mechanics

## Contents
- 3. Cross-cutting principles
- 4. Resource mechanics that could model the context window

Part of [game-design-references.md](game-design-references.md).

## 3. Cross-cutting principles

### Readability of auto-combat
1. **Few units on screen.** One agent against 1–4 enemies. Never a crowd.
2. **One stat line per unit.** Like SAP's ATK/HP: `Trust` (HP), plus at most one
   shield number.
3. **Cooldown bars on every tool.** Players should be able to predict the next 3 s.
4. **Speed control and pause.** 1x / 2x / 4x / skip, plus a scrollable **combat
   log**. In a terminal-styled game the log can *be* the show
   ([auto-battler logs discussion](https://bugnet.io/blog/bug-tracking-for-auto-battler-games)).
5. **Overtime.** The fight has to end. After N seconds a "Deadline" deals damage to
   both sides that grows each second (like the Bazaar's sandstorm).
6. **Status budget:** at most about 6 statuses in the whole game for the slice.

### Decision density targets (derived)
- First meaningful choice: 60 s or less into a run (VS).
- A decision every 20–40 s on average: choose a node, choose 1 of 3 rewards, buy,
  reorder, set policies.
- A fight is 15–40 s at 1x. Hard cap via Deadline at 45 s.

### Difficulty ramps
- **Within a run:** acts with a boss each. Elites appear only after the first few
  nodes, as in StS. Enemy stats scale by act, not by node.
- **Across runs:** ascension with one rule per level (StS) or à-la-carte modifiers
  (Hades). We pick à la carte as "lint rules", which also gives daily-seed variety.

### Juice (cheap, procedural, no artist needed)
- Number pops, screen shake scaled to damage, hit-stop of 2–4 frames on big hits,
  rising-pitch sound for chained triggers (Balatro), text typed out character by
  character, a CRT/scanline overlay, and a flash on the context bar when it changes zone.
- Every juice effect must be switchable off (reduced motion, and determinism in screenshots).

## 4. Resource mechanics that could model the context window

| Model | Reference | Feels like | Fit for "context" |
|---|---|---|---|
| Mana pool (spend, regenerate) | Most RPGs, Backpack Battles mana | Spend to act | Weak. Real context *fills up*, it isn't spent |
| Heat / overheat | MechWarrior, Bazaar Burn | Acting raises a meter; overflow is punished | Strong. Tool output fills context |
| Stress with threshold drama | Darkest Dungeon | Slowly building dread, then a big moment | Strong for the overflow moment |
| Load / weight budget | FTL reactor, Bazaar slot sizes | A loadout decision before combat | Strong. Tool definitions and memory take up tokens |
| Middle-of-the-bar sweet spot | Backpack Battles stamina | Keep it in the middle | Strong. Too little context: guessing. Too much: context rot |
| Hand size | Balatro | Capacity is an upgradable stat | Good for upgrades (bigger window) |
| Junk cards in deck | StS Wound/Dazed/Slimed | Enemies clog your engine | Strong for "context drift" and "noise" |

### Variant A — "Sweet-Spot Window" (heat + load + junk) — RECOMMENDED
- One bar, 0..`window` tokens (the harness sets the window, for example 100 = "100k").
- **Baseline fill** = the token weight of the loadout (system prompt + tools + skills +
  memory). It is set at the start of combat, so a bigger loadout leaves less headroom (FTL/Bazaar).
- **Tool output** adds tokens each time a tool fires (`grep` +2, `read_file` +8).
- **Noise** is added by enemies (Context Drift, Prompt Injection). It shows as grey
  segments in the bar, like StS junk cards.
- **Zones:** `Cold` <25% (tools have a miss chance: "guessing"), `Focused` 25–70%
  (+20% effect), `Rot` 70–100% (cooldowns 30% slower, noise doubles), `Overflow` at 100%:
  **auto-compaction** plays out on screen. The agent is stunned for 2 s, the bar drops
  to baseline + 10%, all noise is removed, and you lose the most recent temporary buff (DD moment).
- Player control (no in-combat input): the order of tools, which tools you take
  (lean `grep` vs heavy `read_file`), and a **policy**: "compact manually at X%"
  (a cheaper, shorter stun than overflow).
- Pros: very thematic (it's how real agents fail). One bar with colour zones. Creates
  distinct builds (lean/fast vs big-window/heavy). Gives enemies a second axis to
  attack besides HP. Deterministic.
- Cons: a two-sided meter is harder to explain than mana and needs a good tutorial
  fight. Tuning the zone thresholds needs the balance sim. The risk is "always
  optimal" zone camping. Counter: some tools *want* Rot (for example `brute_force`
  scales with fill).

### Variant B — "Token Budget" (classic mana)
- Tools cost tokens to cast from a pool. The pool regenerates per second. Compaction
  is a skill that refunds tokens.
- Pros: understood instantly by anyone who has played a game. Trivial to implement
  and balance. Works with any item pool.
- Cons: backwards from reality (context fills, it isn't spent). It loses the satire
  and the "context rot" drama. Feels generic, like every RPG mana bar.

### Variant C — "Context Slots" (inventory / Balatro hand)
- The window is N slots. Tools, skills and memory files occupy slots. Enemies insert
  junk cards ("4000-line stack trace") that occupy slots and disable a neighbouring
  tool until cleared. Upgrades raise N (like Balatro hand size).
- Pros: very readable spatially. Strong build-phase puzzle. Junk cards are a clear,
  visible enemy effect. Easy to test (discrete).
- Cons: little in-combat drama (mostly static). Slot UI is expensive to make fun.
  Overlaps with the normal loadout limit, so there is no second dimension.

**Recommendation:** Variant A as the core, using integer token weights. Take the
"junk card" visual from C (noise segments are named chunks in the bar on hover) and
the Balatro "upgradable capacity" idea (window upgrades are rare shop items). If the
first playtests show players can't read the bar, fall back to C-style discrete chunks
(10 chunks of 10 tokens). The sim stays the same; only the UI changes.
