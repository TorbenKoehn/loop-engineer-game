// The serialisable run state (docs/architecture/run-state.md#runstate-shape).
// Plain JSON data only: no Map, Set, Date, class instances or undefined values.
// Fights, rewards, events and run end add their fields with their tasks (E004, E008).
import type {
  HarnessId,
  LessonId,
  MemoryId,
  PromptId,
  SkillId,
  ToolId,
} from '../content/types/ids.ts';
import type { UnlockId } from '../content/types/refs.ts';

export type LintId = string;
/** `p<phase>-r<row>-c<col>`, or `p<phase>-boss`. */
export type NodeId = string;
/** Planned compaction threshold in percent; 0 = never. */
export type Policy = 70 | 80 | 90 | 0;

export type Mode =
  | 'setup'
  | 'promptPick'
  | 'map'
  | 'fight'
  | 'combatReview'
  | 'reward'
  | 'shop'
  | 'event'
  | 'rest'
  | 'treasure'
  | 'discard'
  | 'phaseEnd'
  | 'shipped'
  | 'runEnd';

/** What the player picks before the run starts. */
export interface RunSetup {
  seed: string;
  harness: HarnessId;
  lint: LintId[];
  tutorial: boolean;
}

/** Read-only meta progress a run needs. Only newRun reads it (stub until E008). */
export interface MetaView {
  unlocked: UnlockId[];
  lessons: LessonId[];
  lintCap: number;
}

/** RunSetup plus the MetaView copy: apply and replay never read meta again. */
export interface SetupSnapshot {
  seed: string;
  harness: HarnessId;
  prompt: PromptId | null;
  lint: LintId[];
  unlocked: UnlockId[];
  lessons: LessonId[];
  tutorial: boolean;
}

export interface MapNode {
  id: NodeId;
  row: number;
  col: number;
}

export interface MapState {
  nodes: MapNode[];
  /** Directed `[from, to]`; row-1 nodes are reachable while `current` is null. */
  edges: [NodeId, NodeId][];
  visited: NodeId[];
  current: NodeId | null;
}

export interface OwnedTool {
  id: ToolId;
  version: 1 | 2 | 3;
  weightMod: number;
}

export type OwnedItem =
  | { kind: 'tool'; tool: OwnedTool }
  | { kind: 'skill'; id: SkillId }
  | { kind: 'memory'; id: MemoryId };

export interface AgentState {
  trust: number;
  maxTrust: number;
  credits: number;
  tools: OwnedTool[];
  skills: SkillId[];
  memories: MemoryId[];
  stash: OwnedItem[];
  slots: { tools: number; skills: number; memory: number; stash: number };
  policy: Policy;
  oncePerRun: string[];
}

export type Pending = { kind: 'promptOffer'; prompts: PromptId[] };

export interface RunStats {
  nodesVisited: number;
}

export interface RunState {
  /** State schema version. */
  v: 1;
  setup: SetupSnapshot;
  mode: Mode;
  phase: 1 | 2 | 3;
  loop: number;
  map: MapState;
  agent: AgentState;
  pending: Pending | null;
  stats: RunStats;
}
