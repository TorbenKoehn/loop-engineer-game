import { describe, expect, it } from 'vitest';
import type { Action } from '../run/actions.ts';
import { apply } from '../run/apply.ts';
import { metaView, newMeta } from '../run/meta/meta.ts';
import { newRun } from '../run/new-run.ts';
import { canonicalJson, sha256Hex } from './checksum.ts';
import { decodeSave, EXPORT_PREFIX, encodeSave, IMPORT_ERRORS } from './codec.ts';
import { runSave, serialise } from './schema.ts';

const SETUP = { seed: 'K7Q2-M9XA', harness: 'terminal_purist', lint: [], tutorial: false };
const PICK: Action = { t: 'pickPrompt', prompt: 'senior' };

function sample() {
  const r = apply(newRun(SETUP, metaView(newMeta())), PICK);
  if (!r.ok) throw new Error(r.error);
  return runSave(r.state, [PICK], 'test');
}

/** Packs a tampered save the way encodeSave does, keeping the stale checksum. */
const encodeRaw = (obj: object) => encodeSave(obj as ReturnType<typeof sample>);

describe('save string codec', () => {
  it('round-trips a save through the native CompressionStream', async () => {
    const save = sample();
    const text = await encodeSave(save);
    expect(text.startsWith(EXPORT_PREFIX)).toBe(true);
    expect(text).toMatch(/^LE1\.[A-Za-z0-9_-]+$/);
    expect(await decodeSave(text)).toEqual({ ok: true, save });
  });

  it('rejects a wrong prefix', async () => {
    const text = await encodeSave(sample());
    const res = await decodeSave(text.replace('LE1.', 'XX9.'));
    expect(res).toEqual({ ok: false, error: 'prefix', message: IMPORT_ERRORS.prefix });
  });

  it('rejects a bad checksum', async () => {
    const res = await decodeSave(await encodeRaw({ ...sample(), seed: 'TAMPERED' }));
    expect(res).toEqual({ ok: false, error: 'checksum', message: IMPORT_ERRORS.checksum });
  });

  it('rejects a newer schema with its own message', async () => {
    const res = await decodeSave(await encodeRaw({ ...sample(), schema: 2 }));
    expect(res).toEqual({
      ok: false,
      error: 'newer',
      message: 'This save is from a newer version.',
    });
  });

  it('reports damaged data instead of throwing', async () => {
    const res = await decodeSave('LE1.!!!notbase64');
    expect(res).toMatchObject({ ok: false, error: 'data' });
    expect(await decodeSave('LE1.aGVsbG8')).toMatchObject({ ok: false, error: 'data' });
  });

  it('keeps a ~400-action run save within 60 kB as canonical JSON', () => {
    const state = sample().snapshot;
    const actions = Array.from({ length: 400 }, (): Action => PICK);
    const save = runSave(state, actions, 'test');
    const text = serialise(save);
    expect(text).toBe(canonicalJson(JSON.parse(text)));
    expect(sha256Hex(text)).toHaveLength(64);
    expect(new TextEncoder().encode(text).length).toBeLessThanOrEqual(60 * 1024);
  });
});
