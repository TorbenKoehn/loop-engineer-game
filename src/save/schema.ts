// Versioned run and meta saves with checksums (docs/architecture/save.md#formats, ADR-005).
// Older schemas migrate in src/save/migrations (T052); here only the current schema loads.
import { CONTENT_VERSION } from '../content/index.ts';
import type { Action } from '../run/actions.ts';
import type { MetaState } from '../run/meta/meta.ts';
import type { RunState, SetupSnapshot } from '../run/state.ts';
import { canonicalJson, sha256Hex } from './checksum.ts';

export const SAVE_SCHEMA = 1;

export interface RunSaveV1 {
  schema: 1;
  contentVersion: number; // CONTENT_VERSION at save time; exact replay needs the same
  gameVersion: string; // build version, informational
  seed: string;
  setup: SetupSnapshot; // includes the unlock and lesson snapshot
  actions: readonly Action[]; // every accepted action since newRun
  snapshot: RunState; // state after the last action; authoritative for loading
  checksum: string; // SHA-256 hex of the canonical JSON of all other fields
}

export interface MetaSaveV1 {
  schema: 1;
  meta: MetaState;
  checksum: string;
}

export type LoadError = 'parse' | 'schema' | 'checksum';
export type Loaded<T> = { ok: true; save: T } | { ok: false; error: LoadError };

const checksumOf = (body: object): string => sha256Hex(canonicalJson(body));

/** Seals the run after its last accepted action. */
export function runSave(state: RunState, actions: readonly Action[], version: string): RunSaveV1 {
  const body = {
    schema: 1 as const,
    contentVersion: CONTENT_VERSION,
    gameVersion: version,
    seed: state.setup.seed,
    setup: state.setup,
    actions,
    snapshot: state,
  };
  return { ...body, checksum: checksumOf(body) };
}

export function metaSave(meta: MetaState): MetaSaveV1 {
  const body = { schema: 1 as const, meta };
  return { ...body, checksum: checksumOf(body) };
}

/** The stored form: canonical JSON (sorted keys, no whitespace). */
export const serialise = (save: RunSaveV1 | MetaSaveV1): string => canonicalJson(save);

/** Required fields and their JSON type, besides `schema` and `checksum`. */
const RUN_FIELDS: Record<string, string> = {
  contentVersion: 'number',
  gameVersion: 'string',
  seed: 'string',
  setup: 'object',
  actions: 'array',
  snapshot: 'object',
};
const META_FIELDS: Record<string, string> = { meta: 'object' };

function jsonType(v: unknown): string {
  if (Array.isArray(v)) return 'array';
  return v === null ? 'null' : typeof v;
}

function load<T>(text: string, fields: Record<string, string>): Loaded<T> {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'parse' };
  }
  const rec = (jsonType(raw) === 'object' ? raw : {}) as Record<string, unknown>;
  const shaped = Object.entries(fields).every(([k, type]) => jsonType(rec[k]) === type);
  if (rec.schema !== SAVE_SCHEMA || !shaped) return { ok: false, error: 'schema' };
  const { checksum, ...body } = rec;
  if (checksum !== checksumOf(body)) return { ok: false, error: 'checksum' };
  return { ok: true, save: rec as T };
}

/** Parses a stored run save; rejects bad JSON, another schema or a wrong checksum. */
export const parseRunSave = (text: string): Loaded<RunSaveV1> => load(text, RUN_FIELDS);
export const parseMetaSave = (text: string): Loaded<MetaSaveV1> => load(text, META_FIELDS);
