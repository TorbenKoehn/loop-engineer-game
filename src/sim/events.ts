// Combat event log: event types and canonical JSONL serialisation.
// Format spec: docs/architecture/event-log.md. Data only, no text; every number is a safe integer.

/** Log format version. Bump on any kind or field change and update goldens in the same change. */
export const LOG_VERSION = 2;

/** `a` agent, `t<slot>` tool, `e<uid>` enemy, `s<uid>` summon, `ctx` context bar, `sys` system. */
export type Ref = 'a' | `t${number}` | `e${number}` | `s${number}` | 'ctx' | 'sys';

type Ids = readonly string[];
type Status = { status: string; remaining: number };

/** One event shape: `d` is the kind-specific flat payload (at most one level of nesting). */
interface Ev<K extends string, D> {
  seq: number;
  /** Integer ms since fight start. */
  t: number;
  kind: K;
  src?: Ref;
  dst?: Ref;
  v?: number;
  d: D;
}

/** Payload whose fields `K` are all integers. */
type Ints<K extends string> = { [P in K]: number };
type SpawnReason = 'start' | 'split' | 'clone' | 'intent' | 'stage' | 'event';
type TokenKind = 'output' | 'noise' | 'removal' | 'baseline' | 'report';
type End = { outcome: 'win' | 'loss'; reason: 'resolved' | 'trust' | 'timeout'; trust: number };

/** Discriminated union over `kind`; the table in event-log.md is the source of truth. */
export type CombatEvent =
  | Ev<
      'fightStart',
      Ints<'W' | 'B' | 'S' | 'N' | 'zone' | 'trust' | 'maxTrust'> & { policyOff?: 1 }
    >
  | Ev<'spawn', { def: string; index: number; reason: SpawnReason }>
  | Ev<'intentSet', { intent: string; ix: number }>
  | Ev<'toolFired', { def: string; version: number; echo?: number }>
  | Ev<'pipe', { chain: number }>
  | Ev<'charge', { cause: string }>
  | Ev<'damage', Ints<'base' | 'flat' | 'pct' | 'armor' | 'guard' | 'sev' | 'zone'> & { why: Ids }>
  | Ev<'guard' | 'heal', { total: number }>
  | Ev<'tokens', Ints<'S' | 'N' | 'F'> & { kind: TokenKind }>
  | Ev<'zoneChanged', Ints<'from' | 'to' | 'F' | 'W'>>
  | Ev<'compaction', { kind: 'auto' | 'planned' | 'tool'; S: number; lostBuff?: string }>
  | Ev<'statusOn' | 'statusOff', Status>
  | Ev<'prime' | 'primeUsed', { filter: string }>
  | Ev<'trait', { trait: string; what: string }>
  | Ev<'armorBroken', { remaining: number }>
  | Ev<'enemyActed', { intent: string; verbs: Ids }>
  | Ev<'redirect', { consumed: number }>
  | Ev<'summon' | 'summonEnd', { lifeMs: number }>
  | Ev<'resolved', { by: Ref }>
  | Ev<'roll', { lo: number; hi: number; purpose: string }>
  | Ev<'deadline', Record<string, never>>
  | Ev<'fightEnd', End>;

export type EventKind = CombatEvent['kind'];

/** Fixed top-level key order of a serialised event. */
const EVENT_KEYS = ['seq', 't', 'kind', 'src', 'dst', 'v', 'd'] as const;

function intToJson(n: number): string {
  if (!Number.isSafeInteger(n))
    throw new RangeError(`Event log numbers must be safe integers, got ${n}`);
  return String(n);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype
  );
}

function objectToJson(obj: Record<string, unknown>): string {
  const parts: string[] = [];
  // Default sort compares UTF-16 code units: total order, locale-independent.
  for (const key of Object.keys(obj).sort()) {
    const value = obj[key];
    if (value !== undefined) parts.push(`${JSON.stringify(key)}:${stableStringify(value)}`);
  }
  return `{${parts.join(',')}}`;
}

/** Canonical JSON: sorted object keys, no whitespace, safe integers and strings only. */
export function stableStringify(value: unknown): string {
  if (typeof value === 'number') return intToJson(value);
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (isPlainObject(value)) return objectToJson(value);
  throw new TypeError(`Not serialisable in the event log: ${String(value)}`);
}

/** One JSONL line: keys `seq,t,kind,src,dst,v,d` in that order, absent fields omitted. */
export function serializeEvent(e: CombatEvent): string {
  const parts: string[] = [];
  for (const key of EVENT_KEYS) {
    const value = e[key];
    if (value !== undefined) parts.push(`"${key}":${stableStringify(value)}`);
  }
  return `{${parts.join(',')}}`;
}

/** Canonical JSONL of a whole log; every line ends with `\n`. Input for the log hash. */
export function serializeLog(events: readonly CombatEvent[]): string {
  return events.map((e) => `${serializeEvent(e)}\n`).join('');
}
