import type { ActivityResult } from "./scoring";

/**
 * A lesson in progress: its attempt (`seed` arranges its activities), the next activity, and what it has earned
 * so far. Saved after every activity, so a learner who leaves can carry on at the same step.
 */
export interface LessonSession {
  /** `lessonKey` of the lesson. */
  readonly lesson: string;
  readonly seed: number;
  readonly index: number;
  readonly xp: number;
  readonly mistakes: number;
}

export function startSession(lesson: string, seed: number): LessonSession {
  return { lesson, seed, index: 0, xp: 0, mistakes: 0 };
}

/** The saved session if it is for `lesson` and still fits its `count` activities, else a new attempt from `seed`. */
export function resumeOrStart(saved: LessonSession | null, lesson: string, count: number, seed: number): LessonSession {
  return saved !== null && saved.lesson === lesson && saved.index < count ? saved : startSession(lesson, seed);
}

/** Where the lesson goes once the current activity reports `result`: on to the next of `count` activities, or done. */
export function advanceSession(
  session: LessonSession,
  result: ActivityResult,
  count: number,
): { readonly session: LessonSession } | { readonly outcome: ActivityResult } {
  const xp = session.xp + result.xp;
  const mistakes = session.mistakes + result.mistakes;
  if (session.index + 1 >= count) return { outcome: { xp, mistakes } };
  return { session: { ...session, index: session.index + 1, xp, mistakes } };
}

/** Kept apart from progress, so its shape can change without touching a learner's stars. */
export const sessionStorageKey = "session.v1";

/** Reads a saved session; mistyped fields throw. */
export function parseSession(json: string | null): LessonSession | null {
  if (json === null) return null;
  const raw: unknown = JSON.parse(json);
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) throw new Error("saved session is not an object");
  const value = raw as Record<string, unknown>;
  if (typeof value.lesson !== "string") throw new Error("saved session: lesson is not a string");
  for (const key of ["seed", "index", "xp", "mistakes"]) {
    if (typeof value[key] !== "number") throw new Error(`saved session: ${key} is not a number`);
  }
  return value as unknown as LessonSession;
}
