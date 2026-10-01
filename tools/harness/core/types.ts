export type Severity = 'error' | 'warn' | 'info';

export interface Finding {
  file: string;
  severity: Severity;
  rule: string;
  message: string;
}

export interface FieldSpec {
  kind: 'string' | 'array' | 'enum' | 'date' | 'object' | 'boolean';
  required?: boolean;
  pattern?: string;
  values?: string[];
}

export type EnforcedBy = 'harness' | 'biome' | 'vitest' | 'process';

export interface BudgetDef {
  value: number;
  severity: 'error' | 'warn' | 'process';
  unit: string;
  description: string;
  area: string;
  enforced_by: EnforcedBy;
  warn_at?: number;
  cmp?: 'min' | 'max';
  fixed?: boolean;
}

export interface SpecialDef {
  kind: 'skill' | 'agent' | 'claude' | 'exempt' | 'index';
  glob: string;
  required?: string[];
  titleField?: string;
  summaryField?: string;
}

export interface Config {
  exclude: string[];
  codeGlobs: string[];
  boardPath: string;
  writerAgents: string[];
  index: {
    skipDirs: string[];
    claudeMdSummary: { root: string; other: string };
    fallbackDate: string;
  };
  frontmatter: {
    base: Record<string, FieldSpec>;
    statusSets: Record<string, string[]>;
    types: Record<string, { statuses: string; fields?: Record<string, FieldSpec> }>;
    special: SpecialDef[];
  };
  budgets: Record<string, BudgetDef>;
}

export type DocKind = 'doc' | 'skill' | 'agent' | 'claude' | 'exempt' | 'index';

export type Data = Record<string, unknown>;

export interface Doc {
  rel: string;
  dir: string;
  kind: DocKind;
  raw: string;
  lines: number;
  data: Data | null;
  body: string;
  parseError?: string;
}

export interface DirInfo {
  files: string[];
  subdirs: string[];
}

export interface Scan {
  root: string;
  config: Config;
  docs: Doc[];
  code: { rel: string; text: string }[];
  dirs: Map<string, DirInfo>;
}
