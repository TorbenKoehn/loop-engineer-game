---
title: UI architecture
summary: Preact screens driven by a signals store over RunState, the combat replay player (clock, cursor, speeds, seeking), the fx and audio bus, input, i18n and test hooks.
keywords: [ui, preact, signals, replay-player, screens, fx, test-hooks]
type: doc
status: active
updated: 2026-10-01
related_code: [src/ui/i18n.ts, src/ui/store/**, src/ui/combat/**, src/ui/app.tsx, src/ui/screens/**, src/ui/sandbox/**, src/main.tsx]
related: [overview.md, run-state.md, event-log.md, ../game/ux/screens.md, ../game/ux/juice-audio.md, adr/adr-003-dom-ui.md]
---

# UI architecture

## Contents
- Store (signals)
- Screens
- Combat replay player
- Fx and audio bus
- Input
- i18n
- Dev sandbox route
- Test hooks (`window.__game`, dev and e2e builds only)
- Performance budgets

The UI is a thin, replaceable view: it renders `RunState`, plays back event logs and
dispatches actions. It never computes game rules ([ADR-003](adr/adr-003-dom-ui.md)).

## Store (signals)

```ts
// src/ui/store/
export const run = signal<RunState | null>(null);
export const meta = signal<MetaState>(loadMeta());
export const lastError = signal<ActionError | null>(null);
export const mode = computed(() => run.value?.mode ?? 'title');
export const baseline = computed(() => run.value && selectBaseline(run.value)); // selectors from src/run

export function dispatch(action: Action): void {
  const res = apply(run.value!, action);
  if (!res.ok) { lastError.value = res.error; return; }
  run.value = res.state;
  actionLog.push(action);            // for saving
  autosave.schedule(res.state);      // after node completion only
}
```

- Components read signals and call `dispatch`; they never mutate state.
- Derived values come from selectors exported by `src/run` (baseline, breakpoints,
  previews), so the UI shows exactly what the sim will use.
- One store module per concern: `run`, `meta`, `settings`, `playback`, `ui` (open panels,
  focus, tooltips).

## Screens

`App` switches on `mode` to one screen component: `Title`, `HarnessSelect`,
`PromptPick`, `MapScreen`, `CombatScreen`, `RewardScreen`, `ShopScreen`, `EventScreen`,
`RestScreen`, `TreasureScreen`, `PhaseEnd`, `RunEnd`, `AgentsMd`, plus overlays
(`Settings`, `Codex`, `History`, `Help`). The IDE shell (`Shell`: top bar, explorer,
editor, terminal, status bar) wraps every screen. No router library; `mode` is the route.
Screens are lazy-loaded except Title, HarnessSelect, PromptPick, Shell and Combat. Until
a screen's task lands, `Placeholder` lists the mode's legal actions as buttons.

Before a run exists, `mode` is `title` or `harnessSelect` (the `choosingHarness` signal in
`store/ui.ts`, set by New run, cleared by `startRun` or Esc); the terminal is hidden until
a run starts. HarnessSelect is a native radio group (arrow keys choose, Enter starts) and
preselects and tags IDE Companion on the first run (`harnessChoice`). PromptPick renders
`pending.prompts` as buttons that dispatch `pickPrompt`. Screens take initial focus with
`useInitialFocus` and move between cards with `arrowFocus` (`screens/focus.ts`); their
styles live in `theme/screens.css`, imported by `shell.css`.

`MapScreen` (`src/ui/screens/map/`, lazy via `lazyScreen` in `app.tsx`, a signal loader
without `preact/compat`) draws the DAG bottom to top on a character grid: pure geometry in
`layout.ts` (node states, box-drawing link rows, arrow-key moves), nodes and preview in
`node.tsx`, styles in `theme/map.css`. One roving tab stop; arrows move, click or Enter on a
reachable node dispatches `travel`; hover or focus previews the encounter (elites hidden). The
top bar breadcrumb reads `phase-1/implement › row 3` from the current node.

`CombatScreen` (`src/ui/screens/combat.tsx`, mode `combatReview`) rebuilds the fight from
`run.combat.input` with `loadFight`, plays it with `createPlayback` on `rafClock` and the
store `speed` (so speed persists between fights), and disposes the playback when the fight
changes or the screen unmounts. Its view components live in `src/ui/combat/view/`; the
result strip's Continue dispatches `continue`. The status bar shows the current speed
(`2x`, `⏭ Skip`).

`RewardScreen` and `DiscardScreen` (`src/ui/screens/reward.tsx`, `discard.tsx`, lazy) render
`pending` of modes `reward` and `discard`; styles in `theme/reward.css`. Reward cards are
diff hunks (`+` added lines, `-` the owned version's line for a duplicate tool, whose header
reads `v1 → v2`, via `nextVersion` in `screens/item-text.ts`); lines come from
`describeTool`/`describeRule`. The receipt lists Reward, Interest and Total from the pending
payout (already paid by `enterReward`). Discard lists every ref from `discardRefs` as a
button dispatching `discardItem`.

`StandupScreen`, `RestScreen` and `FreeTierScreen` (`screens/nodes/standup.tsx`, `rest.tsx`,
`free-tier.tsx`, lazy; styles in `theme/nodes.css`) render modes `event`, `rest` and
`treasure`. The Standup is a `#standup` message (speaker `event.<id>.speaker`, setup split on
newlines, at most 3) with one reply button per `eventChoices` entry: outcome lines from
`screens/nodes/outcome-text.ts`, cost tag, and a disabled reply's reason (`blockText`). Exact
amounts the UI cannot read from data (heal amount, upgradable tools, the Free Tier memory and
whether it equips, stashes or needs room) come from `preview(action)` in `store/run.ts`, which
runs `apply` without dispatching, so no rule is copied into the UI.

## Combat replay player

```ts
// src/ui/combat/playback.ts: createPlayback({ events, start, clock, speed? })
export interface Playback {
  events: readonly CombatEvent[];
  cursor: ReadonlySignal<number>;    // index of next event to apply
  simT: ReadonlySignal<number>;      // current playback time in ms
  speed: Signal<1 | 2 | 4 | 'skip'>; // pass the store's `speed` so it persists
  paused: Signal<boolean>;
  view: ReadonlySignal<CombatView>;  // fold of events[0..cursor)
  ended: ReadonlySignal<boolean>;
  seek(index: number): void;         // restores a checkpoint, folds forward, pauses
  finish(): void;                    // folds to the end silently
  hold(ms?: number): void;           // hit-stop, default 60 ms
  subscribe(fn: (e: CombatEvent) => void): () => void; // fx and audio bus
  dispose(): void;
}
```

- **Clock**: injectable `Clock` interface (`now()`, `onFrame(cb)`, `cb` gets the current
  time); production uses `rafClock`, tests the manual clock in `src/ui/combat/testing/`.
  Each frame advances `simT += frameMs × speed` (frameMs capped at 100 ms, so a
  background tab does not jump) and applies all events with `t ≤ simT`.
- **View fold**: `foldEvent(view, event) -> view` (`src/ui/combat/fold.ts`) is a pure
  function that builds what the screen shows (bars, numbers, chips, intents). It never
  calls the sim.
- **Seeking**: checkpoints of `view` every 100 events (`checkpoints.ts`); seeking to an
  index restores the nearest checkpoint and folds forward. Clicking a log line seeks and
  pauses.
- **Skip**: folds to the end without emitting fx or audio; seeking emits nothing either.
- **Hit-stop**: the fx layer may request a playback hold (60 ms of real time) on big
  hits; it is disabled in reduced motion (fx side) and ignored at `skip`.
- The log text, tooltips' "why" lines and the run-end summary are rendered from the same
  events via `t()` templates.

## Fx and audio bus

`playback` emits each applied event on a tiny typed bus. `render-fx` and `audio`
subscribe and map event kinds to effects (table in
[juice and audio](../game/ux/juice-audio.md)). They receive settings
(`reducedMotion`, `reduceFlashing`, volumes) and never touch the store.

```ts
export interface Fx { onEvent(e: CombatEvent, ctx: FxContext): void; setEnabled(o: FxFlags): void; dispose(): void }
```

The overlay is one full-screen `<canvas>` with `pointer-events: none`; shake is a CSS
transform on the shell root. A Pixi-based `Fx` can replace it behind the same interface.

## Input

- Keyboard map from settings; one `useHotkeys` hook per screen with scoped bindings.
- Drag and drop for loadout ordering uses pointer events with keyboard equivalents
  (`Alt+Arrow`), both dispatching the same `moveTool` action.
- Focus management: each screen sets initial focus; overlays trap focus.

## i18n

`t(key, params)` from `src/ui/i18n.ts` reads `src/content/strings/<locale>.ts`.
Number and clock formatting helpers live next to it. See
[localisation](../game/ux/localisation.md). A missing key renders the key itself; in dev
builds only it also logs `console.error` (never throws).

## Dev sandbox route

Dev builds only: `?sandbox` opens the combat sandbox (`src/ui/sandbox/`, linked from
Title). `src/main.tsx` imports it lazily behind `import.meta.env.DEV`, so production builds
drop it and ignore the flag. Pick a harness, a Phase-1 encounter and a seed; the sandbox
starts a run, picks the first prompt, resolves the fight with `fight()` from
`src/run/combat.ts` into the store and renders the normal `Shell` and `CombatScreen`. It
follows the JSX-text rule like every screen.

## Test hooks (`window.__game`, dev and e2e builds only)

| Hook | Purpose |
|---|---|
| `state()` | current `RunState` (deep-frozen copy) |
| `dispatch(action)` | drive the game without clicks |
| `legal()` | `legalActions` for scripted runs |
| `seed(s)` / `newRun(setup)` | deterministic starts |
| `playback()` | cursor, speed, `finish()` |
| `exportSave()` / `importSave(str)` | save round trips |

URL flags: `?seed=…&harness=…&fx=off&speed=skip&locale=pseudo&tutorial=off`.
Interactive elements carry `data-testid`; tests prefer roles and text.

## Performance budgets

Combat at 4x must hold 60 fps: no layout thrash (bars use `transform: scaleX`), ≤ 1
signal write per unit per frame, number pops pooled, the log virtualised (≤ 200 DOM
rows). Initial JS ≤ 120 kB gzip.
