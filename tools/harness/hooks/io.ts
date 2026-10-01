export async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const c of process.stdin) chunks.push(c as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

export function parsePayload<T extends object>(raw: string): Partial<T> {
  try {
    return (JSON.parse(raw || '{}') as Partial<T>) ?? {};
  } catch {
    return {};
  }
}
