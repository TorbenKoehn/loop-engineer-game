---
title: Tech stack - proposed architecture
summary: Proposed module layout for the browser game - deterministic sim core, UI and render layers, state, save system and boundaries.
keywords: [architecture, typescript, determinism, modules, save-system]
type: research
status: active
updated: 2026-10-01
related: [tech-stack.md]
---

# Tech stack - proposed architecture

Part of [tech-stack.md](tech-stack.md).

## 4. Architecture

```
src/
  sim/            pure TS. No DOM, no Date, no Math.random, no timers, no imports outside sim/ + content/
    rng.ts        sfc32 PRNG, state is 4x uint32, serializable, forkable per subsystem
    combat/       resolveCombat(input) -> CombatResult { events[], outcome, finalState }
    run/          run reducer: (RunState, Action) -> RunState  (map, shop, rewards, events)
    map/          seeded StS-style map generation with placement rules
    context.ts    context bar maths (baseline, outputs, noise, zones, compaction)
  content/        data: tools, skills, memories, enemies, events, harnesses (typed TS objects)
  ui/             Preact components + signals store, reads sim state, dispatches Actions
    combat/       CombatView plays back CombatEvent[] on a clock (speed 1x/2x/4x/skip)
    fx/           canvas overlay, shake, number pops, zzfx (all respect reducedMotion)
  save/           versioned save schema, migrations, localStorage adapter, export/import string
  debug/          window.__game test hooks (enabled in dev and e2e builds only)
scripts/          sim.ts (balance runs), replay.ts (seed -> log), content-report.ts
tests/            e2e/ (Playwright), golden/ (seed -> log hash snapshots)
```

### Sim core (the heart, ~100% unit tested)
- **Integer maths only.** Time in ticks (1 tick = 50 ms, 20 TPS). Damage, tokens and
  percentages are integers (percent as basis points). There are no floats, so results
  are identical on every JS engine.
- **Combat is resolved instantly** into an event log: `{t, kind:'toolFired'|'damage'|
  'noise'|'zone'|'compaction'|..., src, dst, value}`. The UI replays events at any
  speed. "Skip" simply jumps to the end. The same log feeds the text combat log and the
  tooltips that explain why something happened.
- **RNG discipline:** one root seed per run. Each node forks a child RNG
  (`fork(seed, nodeId)`), so changing the shop doesn't change the next fight
  (avoids butterfly effects; balance diffs stay readable).
- **Run state is a reducer** over serializable `Action`s. UI, bots, tests and replays
  all use the same `dispatch`.
- **Enforcement:** a Biome/`tsconfig` path rule plus a Vitest test that greps `src/sim`
  for `Math.random|Date|performance|window|document` and fails if any match.

### Content (data-driven)
- **TypeScript data, not JSON:** `export const grep = defineTool({ id:'grep',
  tags:['Search'], weight:3, cooldown:40, output:2, effects:[dmg(3)], text:'...' })`.
  `satisfies`/generics catch typos at compile time. Comments are allowed. Agents get
  autocompletion from the types.
- Effects use a **small declarative DSL** (trigger -> condition -> effect, for example
  `on('toolFired',{tag:'Search'}) -> buffNext({tag:'Edit'}, pct(50))`). Tooltips and
  plain-English lines are **generated from the data**, so text can't drift from
  behaviour. A registry of named custom handlers is the escape hatch for bosses.
- `content.test.ts` checks invariants: unique ids, every referenced id exists, numbers
  stay in their budget ranges, and every item has a plain-English line.

### UI layer
- Preact components render terminal panels (CSS grid, CSS variables for themes,
  monospace font). The combat view is DOM: agent card, enemy cards, cooldown bars as
  CSS `transform: scaleX()`. Animations use the Web Animations API.
- **The store** is signals derived from `RunState` plus a playback cursor for
  combat. Components never mutate state. They only dispatch `Action`s.
- `data-testid` on interactive elements, and ARIA roles for menus and buttons.

### Render/FX layer
- One full-screen `<canvas>` (pointer-events: none) for particles, flashes and an
  optional CRT scanline effect. Screen shake is a CSS transform on the root.
- `prefers-reduced-motion` and a setting both disable it. E2E runs force it off.
- If perf ever matters, swap the overlay for PixiJS v8 behind the same `Fx` interface.

### Save system
- `SaveV1 = { schema: 1, contentVersion, seed, actions: Action[], snapshot: RunState }`.
  On load, snapshot is used directly. In dev/CI, `replay(seed, actions)` must equal
  `snapshot` (a desync detector).
- Auto-save after every completed node, into `localStorage` (one key per slot, wrapped
  in try/catch with an in-memory fallback). Meta progress (unlocks, AGENTS.md, history)
  is a separate key.
- **Export/import as a compressed base64 string.** Players can share runs, and **bug
  reports become reproducible** for AI agents (`node scripts/replay.ts <save>`).
- Migrations: `migrations[n]: (SaveN) => SaveN+1`, each with a unit test.
