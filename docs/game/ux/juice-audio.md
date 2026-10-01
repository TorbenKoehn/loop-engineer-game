---
title: Juice and audio design
summary: Exact juice catalogue (pops, shake, hit-stop, flashes, compaction moment) with timings, plus the procedural SFX list, music plan, mixing and audio accessibility.
keywords: [juice, animation, audio, sfx, music, zzfx, feedback]
type: gdd
status: active
updated: 2026-10-01
related: [art-direction.md, screens.md, accessibility.md, ../../architecture/ui.md]
---

# Juice and audio design

Rule: juice is presentation only. It is driven by combat events during playback, never
changes the sim, and every effect can be turned off. Durations are at 1x and scale with
playback speed (2x halves them; skip shows none).

## Juice catalogue

| Effect | Trigger event | Spec | Reduced motion |
|---|---|---|---|
| Number pop | `damage`, `guard`, `heal` | Rises 24 px over 600 ms, ease-out, fades last 200 ms. Size 18 px, +4 px if ≥ 20% of target max | Static number for 600 ms |
| Crit-size pop | single hit ≥ 30 | 28 px, red outline, 800 ms | Static |
| Screen shake | damage to agent | Amplitude `min(8, 1 + floor(dmg / 5))` px, 150 ms, decaying | Off |
| Hit-stop | hit ≥ 15% of target max | Playback pauses 60 ms | Off |
| Card flash | `toolFired` | Tool card border flashes `--brand-text` 120 ms | Kept (no motion) |
| Pipe spark | pipe transfer | Spark travels along `|` in 150 ms, pitch rises per chain step | Static highlight |
| Zone flash | `zoneChanged` | Bar glows in the new zone colour 200 ms; label types out | Colour change only |
| Compaction moment | `compaction` | Dim screen 70%, centred "Compacting conversation…" typed at 60 chars/s, bar drains over 600 ms; auto 1000 ms, planned 500 ms | Text only, no drain animation |
| Intent windup | last 500 ms of an intent | Intent chip pulses 2 Hz, tick sound | Ring only |
| Enemy resolved | `enemyResolved` | Card "strikes through" (text line-through) then collapses 300 ms | Instant removal + log line |
| Deadline | each Deadline second | Clock pulses red, red vignette 8% | Clock colour only |
| Typed text | event text, log | 120 chars/s, any key completes | Instant |
| Victory | `fightEnd win` | Status bar sweeps cyan 400 ms, "✓ resolved" | Static |
| Defeat | `fightEnd loss` | Screen cuts to black, red `^C` typed | Static |
| CRT overlay | always (setting) | Scanlines 3 px at 6% opacity, vignette, 0.5 px chromatic offset | Off by default |

Particles (Canvas2D overlay): at most 200 alive, 2–4 px squares in token colours, used
for number pops' sparkle, compaction "token dust" and boss layer breaks.

## Readability guards

- Never more than 6 simultaneous number pops; extra values merge into a "+N" counter.
- Shake never exceeds 8 px and never runs during the compaction moment.
- No full-screen flash brighter than 10% white; flashes respect "Reduce flashing".

## Audio

All SFX are procedural (zzfx parameter presets in content data, about 1 kB library).
Every sound has a role, a pitch rule and a max rate.

| Sound | Event | Character | Pitch rule | Max per second |
|---|---|---|---|---|
| `tool_fire` | `toolFired` | Short keyboard-like click | By tag: Search high, Edit mid, Test bell, Shell low, Web chirp, Agent pad | 8 |
| `hit` | `damage` to enemy | Soft thud | Lower for bigger hits | 8 |
| `hurt` | `damage` to agent | Crunchy buzz | Fixed | 4 |
| `guard` | `guard` | Glassy ping | Fixed | 4 |
| `pipe` | pipe transfer | Rising blip | +1 semitone per chain step, reset after 1 s | 6 |
| `zone_up` / `zone_down` | `zoneChanged` | Two-note arpeggio up/down | Fixed | 2 |
| `compaction` | `compaction` | Tape-rewind swoosh | Auto lower than planned | 1 |
| `intent_tick` | windup last 500 ms | Quiet tick | Fixed | 4 |
| `deadline` | each Deadline second | Low alarm | Rises each second | 1 |
| `resolve` | `enemyResolved` | Bright chord | Fixed | 3 |
| `win` / `lose` | fight end | Jingle 1 s / falling tone | Fixed | — |
| `ui_click`, `ui_buy`, `ui_error` | UI | Clicks and a cash blip | Fixed | 10 |

Balatro rule: chained events (pipes, multi-hits) raise pitch step by step so a long
chain "climbs".

## Music (M3)

- Format: zzfxm-compatible song data (tiny tracker format), generated at load.
- Tracks: menu (lo-fi terminal), Phase 1 Implement (steady 100 BPM), Phase 2 Test
  (syncopated 110 BPM), Phase 3 Deploy (tense 124 BPM), boss variants (+1 layer, +8 BPM),
  `Shipped!` sting, `^C` sting. Each track loops 60–90 s.
- Adaptive layer: a hi-hat layer enters in Rot; a filtered drone enters after the Deadline.

## Mixing

- Buses: master, music, SFX, UI. Defaults 80 / 60 / 80 / 70%.
- Ducking: music −6 dB during the compaction moment and on `^C`.
- Audio starts only after the first user input (browser autoplay rules).
- Mute when the tab is hidden (setting, default on).

## Audio accessibility

Every sound has a visual equivalent already listed in the juice table, so the game is fully
playable muted. A "Visualise sounds" setting adds a small caption chip (`[deadline alarm]`)
at the bottom of the combat view.
