// Export / import string: LE1. + base64url(deflate-raw(canonical JSON)); see save.md.
import { parseRunSave, type RunSaveV1, SAVE_SCHEMA, serialise } from './schema.ts';

export const EXPORT_PREFIX = 'LE1.';

export const IMPORT_ERRORS = {
  prefix: 'This is not a Loop Engineer save string.',
  data: 'This save string is damaged or incomplete.',
  newer: 'This save is from a newer version.',
  schema: 'This save has an unknown format.',
  checksum: 'This save was changed or damaged (checksum mismatch).',
} as const;

export type ImportError = keyof typeof IMPORT_ERRORS;
export type Imported =
  | { ok: true; save: RunSaveV1 }
  | { ok: false; error: ImportError; message: string };

const fail = (error: ImportError): Imported => ({
  ok: false,
  error,
  message: IMPORT_ERRORS[error],
});

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const writer = stream.writable.getWriter();
  writer.write(bytes as Uint8Array<ArrayBuffer>).catch(() => undefined);
  writer.close().catch(() => undefined);
  return new Uint8Array(await new Response(stream.readable).arrayBuffer());
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
  const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

/** The shareable string for a run save. */
export async function encodeSave(save: RunSaveV1): Promise<string> {
  const bytes = new TextEncoder().encode(serialise(save));
  return EXPORT_PREFIX + toBase64Url(await pipe(bytes, new CompressionStream('deflate-raw')));
}

/** Validates prefix, compression, schema and checksum; never throws. */
export async function decodeSave(text: string): Promise<Imported> {
  const trimmed = text.trim();
  if (!trimmed.startsWith(EXPORT_PREFIX)) return fail('prefix');
  let json: string;
  try {
    const packed = fromBase64Url(trimmed.slice(EXPORT_PREFIX.length));
    json = new TextDecoder('utf-8', { fatal: true }).decode(
      await pipe(packed, new DecompressionStream('deflate-raw')),
    );
  } catch {
    return fail('data');
  }
  try {
    const schema = (JSON.parse(json) as { schema?: unknown } | null)?.schema;
    if (typeof schema === 'number' && schema > SAVE_SCHEMA) return fail('newer');
  } catch {
    return fail('data');
  }
  const loaded = parseRunSave(json);
  if (loaded.ok) return { ok: true, save: loaded.save };
  return fail(loaded.error === 'parse' ? 'data' : loaded.error);
}
