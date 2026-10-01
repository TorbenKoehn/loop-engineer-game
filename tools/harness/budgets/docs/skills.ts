import type { Doc } from '../../core/types.ts';
import type { Check, Ctx } from '../util.ts';
import { at, check, inDoc, tokens } from '../util.ts';

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const ofKind = (ctx: Ctx, kind: Doc['kind']): Doc[] => ctx.scan.docs.filter((d) => d.kind === kind);
const description = (d: Doc): string => str(d.data?.description);

const skills: Check = {
  id: 'skills',
  run: (ctx) => {
    const list = ofKind(ctx, 'skill');
    const per = list.flatMap((d) => [
      ...check(ctx, 'skill_name_chars', inDoc(d), str(d.data?.name).length),
      ...check(ctx, 'skill_description_chars', inDoc(d), description(d).length),
    ]);
    return [...per, ...check(ctx, 'skill_count', at('.claude/skills', 'skills'), list.length)];
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
      return check(ctx, id, inDoc(d, 'maxTurns'), max);
    });
    return [
      ...check(ctx, 'agent_def_count', at('.claude/agents', 'agents'), list.length),
      ...check(ctx, 'agent_descriptions_tokens', at('.claude/agents', 'agent descriptions'), total),
      ...turns,
    ];
  },
};

const alwaysLoaded: Check = {
  id: 'always_loaded_tokens',
  run: (ctx) => {
    const sum = (docs: Doc[], f: (d: Doc) => string): number =>
      docs.reduce((n, d) => n + tokens(f(d)), 0);
    const total =
      sum(ofKind(ctx, 'claude'), (d) => d.raw) +
      sum(ofKind(ctx, 'skill'), description) +
      sum(ofKind(ctx, 'agent'), description);
    return check(
      ctx,
      'always_loaded_tokens',
      at('.', 'CLAUDE.md + skill/agent descriptions'),
      total,
    );
  },
};

export const skillChecks: Check[] = [skills, agents, alwaysLoaded];
