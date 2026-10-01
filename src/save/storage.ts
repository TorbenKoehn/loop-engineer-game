// Storage adapter and save keys (docs/architecture/save.md#storage). The browser adapter falls
// back to memory when localStorage throws; `memoryOnly` drives the "not persisted" banner.
import {
  type Loaded,
  type MetaSaveV1,
  parseMetaSave,
  parseRunSave,
  type RunSaveV1,
  serialise,
} from './schema.ts';

export const SAVE_KEYS = {
  run: 'le:run:current',
  runBackup: 'le:run:backup',
  meta: 'le:meta',
  metaBackup: 'le:meta:backup',
} as const;

const PROBE_KEY = 'le:probe'; // written and removed once to test localStorage

export interface SaveStorage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
  /** True once nothing persists past a reload. */
  readonly memoryOnly: boolean;
}

export type WebStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function mapStorage(): WebStorage {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  };
}

class FallbackStorage implements SaveStorage {
  private web: WebStorage | null;
  private readonly memory = mapStorage();

  constructor(web: WebStorage | null) {
    this.web = web;
  }

  get memoryOnly(): boolean {
    return this.web === null;
  }

  get(key: string): string | null {
    return this.use((s) => s.getItem(key));
  }

  set(key: string, value: string): void {
    this.use((s) => s.setItem(key, value));
  }

  remove(key: string): void {
    this.use((s) => s.removeItem(key));
  }

  private use<T>(op: (s: WebStorage) => T): T {
    if (this.web) {
      try {
        return op(this.web);
      } catch {
        this.fallBack(this.web);
      }
    }
    return op(this.memory);
  }

  /** Switches to memory for good, keeping whatever saves are still readable. */
  private fallBack(web: WebStorage): void {
    this.web = null;
    for (const key of Object.values(SAVE_KEYS)) {
      try {
        const value = web.getItem(key);
        if (value !== null) this.memory.setItem(key, value);
      } catch {
        // Unreadable: the key starts empty in memory.
      }
    }
  }
}

export const memoryStorage = (): SaveStorage => new FallbackStorage(null);

/** localStorage (or `open()`) if a probe write succeeds, else memory only. */
export function browserStorage(open: () => WebStorage = () => localStorage): SaveStorage {
  try {
    const web = open();
    web.setItem(PROBE_KEY, '1');
    web.removeItem(PROBE_KEY);
    return new FallbackStorage(web);
  } catch {
    return memoryStorage();
  }
}

function rotate(store: SaveStorage, key: string, backup: string, value: string): void {
  const previous = store.get(key);
  if (previous !== null) store.set(backup, previous);
  store.set(key, value);
}

/** Writes the run save; the previous one becomes the backup. */
export function writeRunSave(store: SaveStorage, save: RunSaveV1): void {
  rotate(store, SAVE_KEYS.run, SAVE_KEYS.runBackup, serialise(save));
}

export function writeMetaSave(store: SaveStorage, save: MetaSaveV1): void {
  rotate(store, SAVE_KEYS.meta, SAVE_KEYS.metaBackup, serialise(save));
}

/** The run save under `key`, or null when there is none. */
export function readRunSave(
  store: SaveStorage,
  key: string = SAVE_KEYS.run,
): Loaded<RunSaveV1> | null {
  const text = store.get(key);
  return text === null ? null : parseRunSave(text);
}

export function readMetaSave(
  store: SaveStorage,
  key: string = SAVE_KEYS.meta,
): Loaded<MetaSaveV1> | null {
  const text = store.get(key);
  return text === null ? null : parseMetaSave(text);
}

/** Run end: meta first, then both run saves go; a retry after a crash is idempotent (endRun). */
export function saveRunEnd(store: SaveStorage, meta: MetaSaveV1): void {
  writeMetaSave(store, meta);
  store.remove(SAVE_KEYS.run);
  store.remove(SAVE_KEYS.runBackup);
}
