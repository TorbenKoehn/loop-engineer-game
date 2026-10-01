import type { Doc } from '../../core/types.ts';
import { check, tokens } from '../util.ts';
import type { Check, Ctx } from '../util.ts';

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const ofKind = (ctx: Ctx, kind: Doc['kind']): Doc[] => ctx.scan.docs.filter((d) => d.kind === kind);
const description = (d: Doc): string => str(d.data?.description);

const skills: Check = {
  id: 'skills',
  run: (ctx) => {
    const list = ofKind(ctx, 'skill');
    const per = list.flatMap((d) => [
      ...check(ctx, 'skill_name_chars', d.rel, str(d.data?.name).length, d),
      ...check(ctx, 'skill_description_chars', d.rel, description(d).length, d),
    ]);
    return [...per, ...check(ctx, 'skill_count', '.claude/skills', list.length, undefined, 'skills')];
  },
};

const agents: Check = {
  id: 'agents',
  run: (ctx) => {
    const list = ofKind(ctx, 'agent');
    const total = list.reduce((n, d) => n + tokens(description(d)), 0);
    const writers = new Set(ctx.scan.config.writerAgents);
    const turns = list.flatMap((d) => {
      const max = d.data?.maxTurns;
      if (typeof max !== 'number') return [];
      const id = writers.has(str(d.data?.name)) ? 'subagent_turns_impl' : 'subagent_turns_research';
      return check(ctx, id, d.rel, max, d, 'maxTurns');
    });
    return [
      ...check(ctx, 'agent_def_count', '.claude/agents', list.length, undefined, 'agents'),
      ...check(ctx, 'agent_descriptions_tokens', '.claude/agents', total, undefined, 'agent descriptions'),
      ...turns,
    ];
  },
};

const alwaysLoaded: Check = {
  id: 'always_loaded_tokens',
  run: (ctx) => {
    const sum = (docs: Doc[], f: (d: Doc) => string): number => docs.reduce((n, d) => n + tokens(f(d)), 0);
    const total = sum(ofKind(ctx, 'claude'), (d) => d.raw) + sum(ofKind(ctx, 'skill'), description) + sum(ofKind(ctx, 'agent'), description);
    return check(ctx, 'always_loaded_tokens', '.', total, undefined, 'CLAUDE.md + skill/agent descriptions');
  },
};

export const skillChecks: Check[] = [skills, agents, alwaysLoaded];
