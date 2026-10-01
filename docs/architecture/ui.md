---
title: UI architecture
summary: Preact screens driven by a signals store over RunState, the combat replay player (clock, cursor, speeds, seeking), the fx and audio bus, input, i18n and test hooks.
keywords: [ui, preact, signals, replay-player, screens, fx, test-hooks]
type: doc
status: active
updated: 2026-10-01
related_code: [src/ui/i18n.ts, src/ui/store/**]
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
Screens are lazy-loaded except Title, Shell and Combat.

## Combat replay player

```ts
export interface Playback {
  events: readonly CombatEvent[];
  cursor: Signal<number>;      // index of next event to apply
  simT: Signal<number>;        // current playback time in ms
  speed: Signal<1 | 2 | 4 | 'skip'>;
  paused: Signal<boolean>;
  view: Signal<CombatView>;    // derived by folding events[0..cursor)
}
```

- **Clock**: injectable `Clock` interface (`now()`, `onFrame(cb)`); production uses
  `requestAnimationFrame`, tests use a manual clock. Each frame advances
  `simT += frameMs × speed` and applies all events with `t ≤ simT`.
- **View fold**: `foldEvent(view, event) -> view` is a pure function that builds what
  the screen shows (bars, numbers, chips, intents). It never calls the sim.
- **Seeking**: checkpoints of `view` every 100 events; seeking to an index restores the
  nearest checkpoint and folds forward. Clicking a log line seeks and pauses.
- **Skip**: folds to the end without emitting fx or audio.
- **Hit-stop**: the fx layer may request a playback hold (60 ms) on big hits; it is
  disabled in reduced motion and at `skip`.
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

`?sandbox` opens the dev combat sandbox (`src/ui/sandbox/`, linked from Title), a plain
terminal-style combat view outside the normal screen flow.

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
