import type { Course, ItemId, Lesson } from "./course";
import { type Answer, answered, type ItemStats } from "./item-stats";
import { type ActivityResult, starsFor } from "./scoring";

/** A calendar day, `YYYY-MM-DD`, in the learner's local time. */
export type Day = string;

export interface Progress {
  readonly xp: number;
  readonly streak: number;
  readonly lastPractice: Day | null;
  /** `lessonKey` of the most recently finished lesson. */
  readonly lastLesson: string | null;
  /** Best stars per `lessonKey`. */
  readonly stars: Readonly<Record<string, number>>;
  /** How each question has gone, per `course/item`. */
  readonly items: Readonly<Record<string, ItemStats>>;
}

export const emptyProgress: Progress = {
  xp: 0,
  streak: 0,
  lastPractice: null,
  lastLesson: null,
  stars: {},
  items: {},
};

export function lessonKey(course: Course, lesson: Lesson<unknown>): string {
  return `${course.id}/${lesson.id}`;
}

export function localDay(date: Date): Day {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function daysBetween(from: Day, to: Day): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

export function starsOf(progress: Progress, course: Course, lesson: Lesson<unknown>): number {
  return progress.stars[lessonKey(course, lesson)] ?? 0;
}

export function isCourseComplete(progress: Progress, course: Course): boolean {
  return course.lessons.every((lesson) => starsOf(progress, course, lesson) > 0);
}

/** `progress` with `answers` to `course`'s questions recorded at `now` (milliseconds since 1970). */
export function recordAnswers(progress: Progress, course: Course, answers: readonly Answer[], now: number): Progress {
  const items = { ...progress.items };
  for (const a of answers) {
    const key = `${course.id}/${a.item}`;
    items[key] = answered(items[key], a.firstTry, now);
  }
  return { ...progress, items };
}

/** How each of `course`'s questions the learner has answered has gone. */
export function itemStatsOf(progress: Progress, course: Course): Map<ItemId, ItemStats> {
  const prefix = `${course.id}/`;
  return new Map(
    Object.entries(progress.items)
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, stats]) => [key.slice(prefix.length) as ItemId, stats]),
  );
}

/** The streak as shown on `today`: it lapses to 0 after a missed day. */
export function streakOn(progress: Progress, today: Day): number {
  if (progress.lastPractice === null) return 0;
  return daysBetween(progress.lastPractice, today) <= 1 ? progress.streak : 0;
}

export function recordLesson(
  progress: Progress,
  course: Course,
  lesson: Lesson<unknown>,
  outcome: ActivityResult,
  today: Day,
): Progress {
  const gap = progress.lastPractice === null ? null : daysBetween(progress.lastPractice, today);
  const streak = gap === 0 ? progress.streak : gap === 1 ? progress.streak + 1 : 1;
  const key = lessonKey(course, lesson);
  return {
    ...progress,
    xp: progress.xp + outcome.xp,
    streak,
    lastPractice: today,
    lastLesson: key,
    stars: { ...progress.stars, [key]: Math.max(starsFor(outcome.mistakes), starsOf(progress, course, lesson)) },
  };
}

function field<T>(value: Record<string, unknown>, key: string, type: "number" | "string" | "object", fallback: T): T {
  const v = value[key];
  if (v === undefined || v === null) return fallback;
  if (typeof v !== type || Array.isArray(v)) throw new Error(`saved progress: ${key} is not a ${type}`);
  return v as T;
}

/** Reads saved progress: missing fields take their defaults, mistyped ones throw. */
export function parseProgress(json: string | null): Progress {
  if (json === null) return emptyProgress;
  const raw: unknown = JSON.parse(json);
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) throw new Error("saved progress is not an object");
  const value = raw as Record<string, unknown>;
  const stars = field<Record<string, unknown>>(value, "stars", "object", {});
  for (const [key, count] of Object.entries(stars)) {
    if (typeof count !== "number") throw new Error(`saved progress: stars for ${key} is not a number`);
  }
  const items = field<Record<string, unknown>>(value, "items", "object", {});
  for (const [key, stats] of Object.entries(items)) {
    const fields = typeof stats === "object" && stats !== null ? (stats as Record<string, unknown>) : {};
    for (const name of ["seen", "firstTries", "box", "lastSeen"]) {
      if (typeof fields[name] !== "number") throw new Error(`saved progress: ${name} of item ${key} is not a number`);
    }
  }
  return {
    xp: field(value, "xp", "number", 0),
    streak: field(value, "streak", "number", 0),
    lastPractice: field<Day | null>(value, "lastPractice", "string", null),
    lastLesson: field<string | null>(value, "lastLesson", "string", null),
    stars: stars as Record<string, number>,
    items: items as Record<string, ItemStats>,
  };
}

export const progressStorageKey = "progress.v1";
