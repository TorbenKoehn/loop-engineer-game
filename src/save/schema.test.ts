import { describe, expect, it } from 'vitest';
import { CONTENT_VERSION } from '../content/index.ts';
import type { Action } from '../run/actions.ts';
import { apply } from '../run/apply.ts';
import { metaView, newMeta } from '../run/meta/meta.ts';
import { newRun } from '../run/new-run.ts';
import type { RunState } from '../run/state.ts';
import { canonicalJson, sha256Hex } from './checksum.ts';
import { metaSave, parseMetaSave, parseRunSave, runSave, serialise } from './schema.ts';

const SETUP = { seed: 'K7Q2-M9XA', harness: 'terminal_purist', lint: [], tutorial: false };
const PICK: Action = { t: 'pickPrompt', prompt: 'senior' };

function onMap(): RunState {
  const r = apply(newRun(SETUP, metaView(newMeta())), PICK);
  if (!r.ok) throw new Error(r.error);
  return r.state;
}

/** Re-serialises `text` after `edit`, keeping the stored checksum (a tampered save). */
function tamper(text: string, edit: (save: Record<string, unknown>) => void): string {
  const save = JSON.parse(text) as Record<string, unknown>;
  edit(save);
  return JSON.stringify(save);
}

describe('run save', () => {
  const save = runSave(onMap(), [PICK], 'test');
  const text = serialise(save);

  it('holds the RunSaveV1 fields', () => {
    expect(save).toMatchObject({ schema: 1, contentVersion: CONTENT_VERSION, gameVersion: 'test' });
    expect(save.seed).toBe(SETUP.seed);
    expect(save.setup).toEqual(save.snapshot.setup);
    expect(save.actions).toEqual([PICK]);
  });

  it('serialises to canonical JSON with a SHA-256 checksum of the other fields', () => {
    expect(text).toBe(canonicalJson(JSON.parse(text)));
    expect(text).not.toMatch(/\s"|":\s|,\s/);
    const { checksum, ...body } = save;
    expect(checksum).toMatch(/^[0-9a-f]{64}$/);
    expect(checksum).toBe(sha256Hex(canonicalJson(body)));
  });

  it('loads its own output', () => {
    expect(parseRunSave(text)).toEqual({ ok: true, save: JSON.parse(text) });
  });

  it('rejects a tampered checksum or tampered data', () => {
    const badSum = tamper(text, (s) => {
      s.checksum = `0${String(s.checksum).slice(1)}`;
    });
    const richer = tamper(text, (s) => {
      (s.snapshot as { agent: { credits: number } }).agent.credits += 100;
    });
    expect(save.checksum.startsWith('0')).toBe(false);
    expect(parseRunSave(badSum)).toEqual({ ok: false, error: 'checksum' });
    expect(parseRunSave(richer)).toEqual({ ok: false, error: 'checksum' });
  });

  it('rejects broken JSON, another schema and a wrong shape', () => {
    expect(parseRunSave(text.slice(0, -1))).toEqual({ ok: false, error: 'parse' });
    const schema2 = tamper(text, (s) => {
      s.schema = 2;
    });
    expect(parseRunSave(schema2)).toEqual({ ok: false, error: 'schema' });
    const noActions = tamper(text, (s) => {
      s.actions = null;
    });
    expect(parseRunSave(noActions)).toEqual({ ok: false, error: 'schema' });
    expect(parseRunSave('[1]')).toEqual({ ok: false, error: 'schema' });
    expect(parseRunSave(serialise(metaSave(newMeta())))).toEqual({ ok: false, error: 'schema' });
  });
});

describe('meta save', () => {
  it('round-trips and rejects a tampered checksum', () => {
    const text = serialise(metaSave({ ...newMeta(), td: 7 }));
    expect(parseMetaSave(text)).toEqual({ ok: true, save: JSON.parse(text) });
    const richer = tamper(text, (s) => {
      (s.meta as { td: number }).td = 9999;
    });
    expect(parseMetaSave(richer)).toEqual({ ok: false, error: 'checksum' });
    expect(parseMetaSave('{"schema":1}')).toEqual({ ok: false, error: 'schema' });
  });
});
