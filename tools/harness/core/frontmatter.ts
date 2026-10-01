import { parse } from 'yaml';
import type { Config, Data, Doc, FieldSpec, Finding, SpecialDef } from './types.ts';

export interface Parsed {
  data: Data | null;
  body: string;
  error?: string;
}

const FENCE = /^---\n([\s\S]*?)\n---[ \t]*(?:\n|$)/;

export function parseFrontmatter(raw: string): Parsed {
  const m = FENCE.exec(raw);
  if (!m) return { data: null, body: raw };
  try {
    const data: unknown = parse(m[1]!);
    if (data === null || typeof data !== 'object' || Array.isArray(data)) {
      return { data: null, body: raw.slice(m[0].length), error: 'frontmatter is not a mapping' };
    }
    return { data: data as Data, body: raw.slice(m[0].length) };
  } catch (e) {
    return {
      data: null,
      body: raw.slice(m[0].length),
      error: `invalid YAML: ${(e as Error).message}`,
    };
  }
}

export function isValidDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

type FieldCheck = (name: string, value: unknown, spec: FieldSpec) => string | null;

const isMapping = (v: unknown): boolean => !!v && typeof v === 'object' && !Array.isArray(v);

const fieldChecks: Record<FieldSpec['kind'], FieldCheck> = {
  string: (name, value, spec) => {
    if (typeof value !== 'string' || value.trim() === '')
      return `${name} must be a non-empty string`;
    if (spec.pattern && !new RegExp(spec.pattern).test(value))
      return `${name} "${value}" does not match ${spec.pattern}`;
    return null;
  },
  array: (name, value) =>
    Array.isArray(value) && value.every((v) => typeof v === 'string')
      ? null
      : `${name} must be an array of strings`,
  enum: (name, value, spec) =>
    typeof value === 'string' && spec.values?.includes(value)
      ? null
      : `${name} must be one of: ${spec.values?.join(', ')} (got ${JSON.stringify(value)})`,
  date: (name, value) =>
    typeof value === 'string' && isValidDate(value) ? null : `${name} must be a YYYY-MM-DD date`,
  object: (name, value) => (isMapping(value) ? null : `${name} must be a mapping`),
  boolean: (name, value) => (typeof value === 'boolean' ? null : `${name} must be a boolean`),
};

export function checkField(name: string, value: unknown, spec: FieldSpec): string | null {
  return fieldChecks[spec.kind](name, value, spec);
}

function checkFields(file: string, data: Data, fields: Record<string, FieldSpec>): Finding[] {
  const out: Finding[] = [];
  for (const [name, spec] of Object.entries(fields)) {
    if (data[name] === undefined || data[name] === null) {
      if (spec.required) out.push(f(file, `missing required field "${name}"`));
      continue;
    }
    const err = checkField(name, data[name], spec);
    if (err) out.push(f(file, err));
  }
  return out;
}

function f(file: string, message: string): Finding {
  return { file, severity: 'error', rule: 'frontmatter', message };
}

export function specialFor(
  rel: string,
  config: Config,
  match: (r: string, g: string) => boolean,
): SpecialDef | undefined {
  return config.frontmatter.special.find((s) => match(rel, s.glob));
}

function validateSpecial(doc: Doc, def: SpecialDef): Finding[] {
  const out: Finding[] = [];
  for (const name of def.required ?? []) {
    const v = doc.data?.[name];
    if (typeof v !== 'string' || v.trim() === '')
      out.push(f(doc.rel, `missing required field "${name}"`));
  }
  return out;
}

/** Schema validation of a doc's frontmatter. Skips kinds without a schema. */
export function validateDoc(doc: Doc, config: Config, def?: SpecialDef): Finding[] {
  if (doc.kind === 'claude' || doc.kind === 'exempt' || doc.kind === 'index') return [];
  if (doc.parseError) return [f(doc.rel, doc.parseError)];
  if (!doc.data) return [f(doc.rel, 'missing frontmatter block')];
  if (def && (doc.kind === 'skill' || doc.kind === 'agent')) return validateSpecial(doc, def);
  return validateSchema(doc, doc.data, config);
}

function validateSchema(doc: Doc, data: Data, config: Config): Finding[] {
  const fm = config.frontmatter;
  const type = data.type;
  const typeDef = typeof type === 'string' ? fm.types[type] : undefined;
  const base = { ...fm.base };
  base.type = { kind: 'enum', required: true, values: Object.keys(fm.types) };
  const out = checkFields(doc.rel, data, { ...base, status: { kind: 'string', required: true } });
  const typeErr = out.filter((x) => !x.message.startsWith('status'));
  if (!typeDef) return typeErr;
  const statuses = fm.statusSets[typeDef.statuses] ?? [];
  const statusSpec: FieldSpec = { kind: 'enum', required: true, values: statuses };
  const statusErr =
    data.status === undefined ? null : checkField('status', data.status, statusSpec);
  const res = [...typeErr, ...checkFields(doc.rel, data, typeDef.fields ?? {})];
  if (statusErr) res.push(f(doc.rel, statusErr));
  return res;
}
