---
title: ADR-005 Save = seed + action log + snapshot
summary: Saves store the seed, every accepted action and a state snapshot, versioned with migrations; the snapshot loads, the log replays for desync checks and bug reports.
keywords: [adr, save, replay, migrations, action-log, persistence]
type: adr
status: active
updated: 2026-10-01
related: [../save.md, ../run-state.md, adr-002-deterministic-sim.md]
---

# ADR-005: Save = seed + action log + snapshot

Status: accepted, 2026-10-01.

## Context

The run is a pure reducer over serialisable actions, and combat is deterministic
([ADR-002](adr-002-deterministic-sim.md)). We want robust autosaves, shareable runs,
reproducible bug reports for AI agents, and freedom to tune content without breaking
runs in progress.

## Decision

- A run save is `{ schema, contentVersion, seed, setup, actions[], snapshot, checksum }`.
- Loading uses the **snapshot**; the **action log** is used for replay, desync detection
  in dev/CI and bug reproduction.
- Meta progress (TD, unlocks, lessons, history, achievements, settings) is a separate
  save with its own schema.
- Saves are versioned; `migrations[n]` converts schema n to n+1, each with frozen fixture
  tests. If actions cannot be migrated, the log is dropped and only the snapshot loads.
- Export/import uses `LE1.` + base64url(deflate-raw(canonical JSON)), no dependencies.
- Combat event logs are never saved; they are recomputed from the stored combat input.

## Consequences

- Content tuning does not break runs in progress (snapshot is authoritative).
- Exact replay works only for the same `contentVersion`; tools say so explicitly.
- Desyncs between incremental state and replay are caught automatically.
- Saves stay small (≤ 60 kB for a full run) and human-inspectable after decoding.
- Every run-state shape change needs a migration and a fixture, which is deliberate
  friction.

## Alternatives considered

- **Snapshot only**: simplest, but no reproduction from actions and no desync check.
- **Action log only**: smallest, but every content change would break or alter saved runs.
- **Saving combat logs**: large and redundant with deterministic recomputation.
- **IndexedDB**: more capacity than needed; localStorage behind an adapter suffices and
  can be swapped later.
