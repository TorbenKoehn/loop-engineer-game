// The serialisable run state (docs/architecture/run-state.md#runstate-shape).
// Plain JSON data only: no Map, Set, Date, class instances or undefined values.
// Later modes (events, rest, phases) add their fields with their tasks.

import type { Rarity } from '../content/types/basics.ts';
import type { FightModifier } from '../content/types/event.ts';
import type {
  EncounterId,
  HarnessId,
  LessonId,
  MemoryId,
  PromptId,
  SkillId,
  ToolId,
} from '../content/types/ids.ts';
import type { UnlockId } from '../content/types/refs.ts';
import type { CombatInput, CombatResult } from '../sim/index.ts';

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

/** Read-only meta progress a run needs; metaView (src/run/meta) builds it. Only newRun reads it. */
export interface MetaView {
  unlocked: UnlockId[];
  lessons: LessonId[];
  lintCap: number;
  /** Number of the new run (meta lastRun + 1); absent = 0, an unnumbered run. */
  run?: number;
}

/** RunSetup plus the MetaView copy: apply and replay never read meta again. */
export interface SetupSnapshot {
  /** Run id for meta history; 0 = unnumbered (recorded, never deduplicated). */
  run: number;
  seed: string;
  harness: HarnessId;
  prompt: PromptId | null;
  lint: LintId[];
  unlocked: UnlockId[];
  lessons: LessonId[];
  tutorial: boolean;
}

/** docs/game/systems/run-map.md#node-types; `release` is the boss. */
export type NodeType =
  | 'task'
  | 'criticalBug'
  | 'registry'
  | 'standup'
  | 'idleCycle'
  | 'freeTier'
  | 'release';

export interface MapNode {
  id: NodeId;
  /** 1-7; the boss is row 8. */
  row: number;
  col: number;
  type: NodeType;
  /** Chosen at generation so the map can preview it; null on non-fight nodes. */
  encounter: EncounterId | null;
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

export type ItemKind = OwnedItem['kind'];

/** An owned item: an equipped slot of a kind, a stash index, or the item awaiting space. */
export type ItemRef = { at: ItemKind | 'stash'; ix: number } | { at: 'gained' };

/** One 1-of-3 reward card (docs/game/systems/economy.md#reward-picks-1-of-3). */
export type RewardCard = { kind: 'tool' | 'skill'; id: ToolId | SkillId; rarity: Rarity };

/** One Package Registry offer; `price` already includes the sale. */
export type ShopOffer = {
  kind: ItemKind;
  id: ToolId | SkillId | MemoryId;
  rarity: Rarity;
  price: number;
  sale: boolean;
  sold: boolean;
};

/** The open shop on `node`; `rerolls` counts the rerolls this visit. */
export type ShopPending = { kind: 'shop'; node: NodeId; rerolls: number; offers: ShopOffer[] };

/** Credits and interest are already paid; shown as separate lines. */
export type RewardPending = {
  kind: 'reward';
  credits: number;
  interest: number;
  cards: RewardCard[];
};

export type Pending =
  | { kind: 'promptOffer'; prompts: PromptId[] }
  | RewardPending
  | ShopPending
  /** `item` was gained without space; `next` follows discardItem, `resume` is its shop/reward. */
  | { kind: 'discard'; item: OwnedItem; next: Mode; resume?: ShopPending | RewardPending }
  /** The 3 AGENTS.md lessons offered at run end (meta-progression.md#agentsmd-lessons). */
  | { kind: 'lessonOffer'; lessons: LessonId[] };

/** Zone time and compactions of one fight. */
export interface FightStats {
  /** ms per event zone index: cold, focused, rot, overflow. */
  zoneMs: number[];
  compactions: number;
}

/** Counters for the run-end summary and history (meta-progression.md#run-history). */
export interface RunStats {
  nodesVisited: number;
  /** Task picks in a row offered without a rare card (pity, economy.md). */
  taskPicksNoRare: number;
  /** Fight nodes won. */
  nodesCleared: number;
  /** Enemy def id or `deadline` that dealt the agent's final damage; null before any hit. */
  cause: string | null;
  /** Damage the agent took this run, by enemy def id or `deadline`. */
  damageBySource: Record<string, number>;
  /** Compactions this run. */
  compactions: number;
  /** ms per zone index over all fights of the run. */
  zoneMs: number[];
  lastFight: FightStats;
}

/** How the run ended; `td` (Training Data) stays 0 until E015. */
export interface RunResult {
  outcome: 'shipped' | 'ctrlc' | 'abandoned';
  td: number;
  /** AGENTS.md after the run: the setup's lessons until pickLesson writes a line. */
  lessons: LessonId[];
}

/** The resolved fight without its log; the UI recomputes the log from `input`. */
export type CombatSummary = Pick<CombatResult, 'outcome' | 'reason' | 'endT' | 'stats'>;

export interface CombatRecord {
  nodeId: NodeId;
  input: CombatInput;
  outcome: CombatSummary;
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
  /** Next-fight modifiers from events (T047). */
  nextFight: FightModifier[];
  /** The last fight; set by travel to a fight node. */
  combat: CombatRecord | null;
  stats: RunStats;
  /** Set when mode becomes runEnd. */
  result: RunResult | null;
}
