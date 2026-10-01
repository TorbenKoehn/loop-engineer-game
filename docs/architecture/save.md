---
title: Save system and migrations
summary: Versioned run and meta saves (seed + action log + snapshot), storage keys, autosave timing, the export string codec, migrations, desync detection and corruption handling.
keywords: [save, migrations, persistence, export, desync, localstorage]
type: doc
status: active
updated: 2026-10-01
related: [run-state.md, testing.md, overview.md, adr/adr-005-save-action-log.md]
related_code: [src/save/schema.ts, src/save/storage.ts, src/save/checksum.ts, src/save/codec.ts]
---

# Save system and migrations

## Contents
- Formats
- Storage
- Export / import string
- Migrations
- Content changes and replays
- Desync detection
- Corruption handling

Decision record: [ADR-005](adr/adr-005-save-action-log.md).

## Formats

```ts
export interface RunSaveV1 {
  schema: 1;
  contentVersion: number;     // CONTENT_VERSION at save time
  gameVersion: string;        // build version, informational
  seed: string;
  setup: SetupSnapshot;       // includes the unlock and lesson snapshot
  actions: readonly Action[]; // every accepted action since newRun
  snapshot: RunState;         // state after the last action
  checksum: string;           // SHA-256 hex of the canonical JSON of the fields above
}
export interface MetaSaveV1 {
  schema: 1;
  meta: MetaState;            // td, unlocked, lessons, history (≤ 100), achievements, settings, tips
  checksum: string;
}
```

Canonical JSON: keys sorted, no whitespace, undefined fields dropped. The snapshot is
authoritative for loading; the action log is for replay, desync detection and bug reports.
SHA-256 is a small synchronous implementation (`src/save/checksum.ts`), not
`crypto.subtle`, so a `pagehide` autosave completes before the page goes. `runSave` and
`metaSave` seal a save; `parseRunSave` and `parseMetaSave` reject bad JSON (`parse`),
another schema or shape (`schema`) and a wrong checksum (`checksum`).

## Storage

| Key | Content |
|---|---|
| `le:run:current` | `RunSaveV1` of the active run |
| `le:run:backup` | the previous autosave (one node earlier) |
| `le:meta` | `MetaSaveV1` |
| `le:meta:backup` | previous meta save |

- Adapter interface `SaveStorage { get(k), set(k, v), remove(k), memoryOnly }`.
  `browserStorage()` probes `localStorage` (writes and removes `le:probe`) and wraps it in
  try/catch; when it throws (private mode, quota) the adapter switches to memory for good,
  copying the readable save keys, and `memoryOnly` becomes true. A banner warns when
  saves are memory-only. `memoryStorage()` is the test and fallback implementation.
- `writeRunSave` / `writeMetaSave` rotate the current value to the backup key, then write.
- **Autosave** after every completed node (mode returns to `map`, `phaseEnd` or
  `runEnd`) and on `pagehide`. Never during combat playback: a reload mid-fight restarts
  playback of the already-resolved fight.
- Run end (`saveRunEnd`): meta is written first, then the run save and its backup are
  removed (so a crash cannot lose TD or duplicate it: `endRun` is idempotent by run id).
- Expected size: a full run is about 400 actions; save ≤ 60 kB.

## Export / import string

- Format: `LE1.` + base64url( deflate-raw( UTF-8 canonical JSON of `RunSaveV1` ) ).
- Compression uses the native `CompressionStream('deflate-raw')` (no dependency).
- `encodeSave` / `decodeSave` (`src/save/codec.ts`, async) implement it. Import validates
  prefix, compression, schema and checksum, then migrates. `decodeSave` never throws; it
  returns `{ ok: false, error, message }` with a plain-English message ("This save is from
  a newer version." when the schema is above the current one).
- Bug reports: players paste the string; agents run `node tools/balance/replay.ts
  <string>` to reproduce, which prints the run summary and can dump any fight's log.

## Migrations

```ts
export const migrations: Record<number, (s: unknown) => unknown> = {
  // 1: (s: RunSaveV1) => RunSaveV2, added when schema 2 exists
};
export function migrate(raw: unknown): RunSaveLatest; // applies n -> n+1 in order, validates
```

- One migration per schema step, each with a unit test using a frozen fixture save
  (`tests/fixtures/saves/run-v1-*.txt`). Fixtures are never edited after creation.
- Migrations transform the snapshot and, where needed, actions. If an action cannot be
  migrated, the action log is dropped and the save is marked `replayable: false`; the
  snapshot still loads.
- Meta saves migrate the same way with their own table.

## Content changes and replays

- Loading uses the snapshot, so content tuning never breaks a saved run in progress
  (numbers apply from the next fight).
- Replay is exact only when `contentVersion` matches. Dev tools refuse exact-replay
  comparison across versions and report "content changed since save".

## Desync detection

- In dev and CI builds, after each autosave the store replays `seed + actions` in a
  `queueMicrotask` and deep-compares with the snapshot. A mismatch logs a desync report
  (first differing path, last 5 actions, export string) and fails e2e tests.
- CI: 200 bot runs save at every node, reload, continue, and must end identically to an
  uninterrupted run ([testing](testing.md)).

## Corruption handling

On checksum or parse failure: try the backup key; if that fails, keep the corrupt string
under `le:corrupt:<timestamp>` (max 3), start fresh, and show the export string of the
corrupt data so a player can report it.
