// Save migrations: n -> n+1 steps in order, then validated (architecture/save.md#migrations).
import { canonicalJson, sha256Hex } from '../checksum.ts';
import {
  type MetaSaveV1,
  parseMetaSave,
  parseRunSave,
  type RunSaveV1,
  SAVE_SCHEMA,
} from '../schema.ts';

export type MigrationStep = (save: Record<string, unknown>) => Record<string, unknown>;
/** One table per save kind, keyed by the schema a step migrates from. */
export type MigrationTable = Record<number, MigrationStep>;

// Real steps arrive with schema 2 (E015); schema 1 is the current schema.
export const runMigrations: MigrationTable = {};
export const metaMigrations: MigrationTable = {};

export type MigrateError = 'parse' | 'schema' | 'checksum';
export type Migrated<T> =
  | { ok: true; save: T; replayable: boolean }
  | { ok: false; error: MigrateError };

export type SaveKind = 'run' | 'meta';

/** For a step whose action log cannot be migrated: drop it, keep the snapshot. */
export const dropActions = (save: Record<string, unknown>): Record<string, unknown> => ({
  ...save,
  actions: [],
  replayable: false,
});

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const seal = (body: Record<string, unknown>) => ({
  ...body,
  checksum: sha256Hex(canonicalJson(body)),
});

export interface MigrateOptions {
  table?: MigrationTable;
  latest?: number;
}

type Body = { ok: true; body: Record<string, unknown> } | { ok: false; error: MigrateError };

/** Parses text, bounds the schema and verifies the input checksum. */
function open(raw: unknown, latest: number): Body {
  let value = raw;
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw);
    } catch {
      return { ok: false, error: 'parse' };
    }
  }
  if (!isObject(value) || typeof value.schema !== 'number') return { ok: false, error: 'schema' };
  if (value.schema > latest || value.schema < 1) return { ok: false, error: 'schema' };
  const { checksum, ...body } = value;
  if (checksum !== sha256Hex(canonicalJson(body))) return { ok: false, error: 'checksum' };
  return { ok: true, body };
}

function runSteps(body: Record<string, unknown>, latest: number, table: MigrationTable): Body {
  let current = body;
  for (let n = body.schema as number; n < latest; n++) {
    const next = table[n]?.(current);
    if (!isObject(next) || next.schema !== n + 1) return { ok: false, error: 'schema' };
    current = next;
  }
  return { ok: true, body: current };
}

/**
 * Migrates a stored save (text or parsed JSON) to the latest schema. The input checksum
 * must match; the result is re-sealed and validated. An unmigratable action log gives
 * `replayable: false` with the snapshot intact.
 */
export function migrate(raw: unknown, kind: 'run', opts?: MigrateOptions): Migrated<RunSaveV1>;
export function migrate(raw: unknown, kind: 'meta', opts?: MigrateOptions): Migrated<MetaSaveV1>;
export function migrate(
  raw: unknown,
  kind: SaveKind,
  opts: MigrateOptions = {},
): Migrated<RunSaveV1 | MetaSaveV1> {
  const latest = opts.latest ?? SAVE_SCHEMA;
  const table = opts.table ?? (kind === 'run' ? runMigrations : metaMigrations);
  const input = open(raw, latest);
  if (!input.ok) return input;
  const done = runSteps(input.body, latest, table);
  if (!done.ok) return done;
  const text = JSON.stringify(seal(done.body));
  const loaded = (kind === 'run' ? parseRunSave : parseMetaSave)(text, latest);
  if (!loaded.ok) return { ok: false, error: loaded.error };
  return { ok: true, save: loaded.save, replayable: done.body.replayable !== false };
}
