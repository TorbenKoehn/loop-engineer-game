// Content ids. Plain string aliases on purpose: src/sim imports only src/content/types*,
// never data modules, so literal id unions are derived next to the data
// (`(typeof tools)[number]['id']`) and cross-references are checked by validate.ts.

export type ToolId = string;
export type SkillId = string;
export type MemoryId = string;
export type LessonId = string;
export type EnemyId = string;
export type IntentId = string;
export type EncounterId = string;
export type HarnessId = string;
export type PromptId = string;
export type EventId = string;
