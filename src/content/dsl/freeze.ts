// Deep freeze for content definitions. Production builds skip it (content is created once
// and never mutated); dev, tests and Node tools (no import.meta.env) freeze.

const FREEZE: boolean = import.meta.env?.PROD !== true;

/** Recursively freezes plain objects and arrays and returns the same reference. */
export function deepFreeze<T>(value: T): T {
  if (typeof value !== 'object' || value === null) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

/** deepFreeze in dev, identity in production builds. */
export function freezeInDev<T>(value: T): T {
  return FREEZE ? deepFreeze(value) : value;
}
