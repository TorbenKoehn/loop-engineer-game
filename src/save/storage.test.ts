import { describe, expect, it } from 'vitest';
import { apply } from '../run/apply.ts';
import { type MetaState, metaView, newMeta } from '../run/meta/meta.ts';
import { newRun } from '../run/new-run.ts';
import { type MetaSaveV1, metaSave, type RunSaveV1, runSave, serialise } from './schema.ts';
import {
  browserStorage,
  memoryStorage,
  readMetaSave,
  readRunSave,
  SAVE_KEYS,
  type SaveStorage,
  saveRunEnd,
  type WebStorage,
  writeMetaSave,
  writeRunSave,
} from './storage.ts';

/** A localStorage stand-in that records calls and can be told to throw. */
class FakeWeb implements WebStorage {
  readonly data = new Map<string, string>();
  readonly calls: string[] = [];
  failWrites = false;
  failAll = false;

  getItem(key: string): string | null {
    this.check(`get ${key}`, false);
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.check(`set ${key}`, true);
    this.data.set(key, value);
  }
  removeItem(key: string): void {
    this.check(`remove ${key}`, true);
    this.data.delete(key);
  }
  private check(call: string, write: boolean): void {
    this.calls.push(call);
    if (this.failAll || (write && this.failWrites)) throw new DOMException('nope', 'QuotaError');
  }
}

function run(seed: string): RunSaveV1 {
  const setup = { seed, harness: 'terminal_purist', lint: [], tutorial: false };
  const r = apply(newRun(setup, metaView(newMeta())), { t: 'pickPrompt', prompt: 'senior' });
  if (!r.ok) throw new Error(r.error);
  return runSave(r.state, [{ t: 'pickPrompt', prompt: 'senior' }], 'test');
}

const meta = (td: number): MetaSaveV1 => metaSave({ ...newMeta(), td } satisfies MetaState);

describe('browserStorage', () => {
  it('uses localStorage when it works', () => {
    const web = new FakeWeb();
    const store = browserStorage(() => web);
    store.set('k', 'v');
    expect(store.memoryOnly).toBe(false);
    expect(web.data.get('k')).toBe('v');
    expect(store.get('k')).toBe('v');
    store.remove('k');
    expect(web.data.size).toBe(0);
  });

  it('falls back to memory and reports memoryOnly when localStorage throws', () => {
    const throwing = browserStorage(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    const fake = new FakeWeb();
    fake.failAll = true;
    for (const store of [throwing, browserStorage(() => fake), memoryStorage()]) {
      expect(store.memoryOnly).toBe(true);
      store.set('k', 'v');
      expect(store.get('k')).toBe('v');
      store.remove('k');
      expect(store.get('k')).toBeNull();
    }
    expect(fake.data.size).toBe(0);
  });

  it('switches to memory when a later write throws, keeping readable saves', () => {
    const web = new FakeWeb();
    const store = browserStorage(() => web);
    writeMetaSave(store, meta(1));
    web.failWrites = true;
    writeRunSave(store, run('A'));
    expect(store.memoryOnly).toBe(true);
    expect(readMetaSave(store)).toEqual({ ok: true, save: meta(1) });
    expect(readRunSave(store)).toEqual({ ok: true, save: run('A') });
    expect(web.data.has(SAVE_KEYS.run)).toBe(false);
  });
});

describe('save keys', () => {
  it('uses the documented keys', () => {
    expect(SAVE_KEYS).toEqual({
      run: 'le:run:current',
      runBackup: 'le:run:backup',
      meta: 'le:meta',
      metaBackup: 'le:meta:backup',
    });
  });

  it('rotates the current run and meta save to the backup key on save', () => {
    const store = memoryStorage();
    writeRunSave(store, run('A'));
    expect(store.get(SAVE_KEYS.runBackup)).toBeNull();
    writeRunSave(store, run('B'));
    expect(readRunSave(store)).toEqual({ ok: true, save: run('B') });
    expect(readRunSave(store, SAVE_KEYS.runBackup)).toEqual({ ok: true, save: run('A') });
    writeMetaSave(store, meta(1));
    writeMetaSave(store, meta(2));
    expect(store.get(SAVE_KEYS.meta)).toBe(serialise(meta(2)));
    expect(readMetaSave(store, SAVE_KEYS.metaBackup)).toEqual({ ok: true, save: meta(1) });
  });

  it('reads null for a missing save and an error for a corrupt one', () => {
    const store = memoryStorage();
    expect(readRunSave(store)).toBeNull();
    expect(readMetaSave(store)).toBeNull();
    store.set(SAVE_KEYS.run, '{"schema":1');
    expect(readRunSave(store)).toEqual({ ok: false, error: 'parse' });
  });
});

describe('saveRunEnd', () => {
  it('writes meta first, then removes the run saves', () => {
    const web = new FakeWeb();
    const store: SaveStorage = browserStorage(() => web);
    writeRunSave(store, run('A'));
    writeRunSave(store, run('B'));
    writeMetaSave(store, meta(0));
    web.calls.length = 0;
    saveRunEnd(store, meta(5));
    expect(web.calls).toEqual([
      `get ${SAVE_KEYS.meta}`,
      `set ${SAVE_KEYS.metaBackup}`,
      `set ${SAVE_KEYS.meta}`,
      `remove ${SAVE_KEYS.run}`,
      `remove ${SAVE_KEYS.runBackup}`,
    ]);
    expect(readMetaSave(store)).toEqual({ ok: true, save: meta(5) });
    expect(readRunSave(store)).toBeNull();
    expect(readRunSave(store, SAVE_KEYS.runBackup)).toBeNull();
  });

  it('keeps the run save when the meta write crashes', () => {
    const web = new FakeWeb();
    const store = browserStorage(() => web);
    writeRunSave(store, run('A'));
    const crashing: SaveStorage = {
      memoryOnly: false,
      get: (k) => store.get(k),
      remove: (k) => store.remove(k),
      set: () => {
        throw new Error('crash');
      },
    };
    expect(() => saveRunEnd(crashing, meta(5))).toThrow('crash');
    expect(readRunSave(store)).toEqual({ ok: true, save: run('A') });
  });
});
