import { describe, expect, test } from "nsh/test";
import { emptyProgress, parseProgress, recordLesson, starsOf, streakOn } from "./progress";
import { starsFor } from "./scoring";
import { course } from "./test-courses";

const letters = course("letters", ["a", "b"]);
const numbers = course("numbers", ["a"]);
const [a, b] = letters.lessons;

describe("stars", () => {
  for (const [mistakes, stars] of [
    [0, 3],
    [1, 2],
    [2, 2],
    [3, 1],
    [10, 1],
  ]) {
    test(`${mistakes} mistakes -> ${stars} stars`, () => {
      expect(starsFor(mistakes)).toBe(stars);
    });
  }
});

test("progress is tracked per course, not by lesson id alone", () => {
  const p = recordLesson(emptyProgress, letters, a, { xp: 10, mistakes: 0 }, "2026-11-01");
  expect(starsOf(p, letters, a)).toBe(3);
  expect(starsOf(p, numbers, numbers.lessons[0])).toBe(0);
});

test("stars keep the best result; XP accumulates", () => {
  const first = recordLesson(emptyProgress, letters, a, { xp: 10, mistakes: 0 }, "2026-11-01");
  const second = recordLesson(first, letters, a, { xp: 4, mistakes: 5 }, "2026-11-01");
  expect(starsOf(second, letters, a)).toBe(3);
  expect(second.xp).toBe(14);
});

test("streak: same day holds, next day grows, gap resets", () => {
  const ok = { xp: 1, mistakes: 0 };
  const day1 = recordLesson(emptyProgress, letters, a, ok, "2026-11-01");
  const sameDay = recordLesson(day1, letters, b, ok, "2026-11-01");
  const nextDay = recordLesson(sameDay, letters, a, ok, "2026-11-02");
  const afterGap = recordLesson(nextDay, letters, a, ok, "2026-11-05");
  expect([day1.streak, sameDay.streak, nextDay.streak, afterGap.streak]).toEqual([1, 1, 2, 1]);
});

test("streak counts calendar days across a month end", () => {
  const p = recordLesson(emptyProgress, letters, a, { xp: 1, mistakes: 0 }, "2026-10-31");
  expect(recordLesson(p, letters, a, { xp: 1, mistakes: 0 }, "2026-11-01").streak).toBe(2);
});

test("displayed streak lapses after a missed day", () => {
  const p = recordLesson(emptyProgress, letters, a, { xp: 1, mistakes: 0 }, "2026-11-01");
  expect(streakOn(p, "2026-11-02")).toBe(1);
  expect(streakOn(p, "2026-11-03")).toBe(0);
  expect(streakOn(emptyProgress, "2026-11-03")).toBe(0);
});

test("records the last finished lesson", () => {
  const p = recordLesson(emptyProgress, letters, b, { xp: 1, mistakes: 0 }, "2026-11-01");
  expect(p.lastLesson).toBe("letters/b");
});

test("survives a JSON round trip", () => {
  const p = recordLesson(emptyProgress, letters, a, { xp: 7, mistakes: 1 }, "2026-11-01");
  expect(parseProgress(JSON.stringify(p))).toEqual(p);
});

test("missing saved fields take their defaults", () => {
  expect(parseProgress(null)).toEqual(emptyProgress);
  expect(parseProgress("{}")).toEqual(emptyProgress);
});

test("mistyped saved progress is rejected, not silently reset", () => {
  expect(() => parseProgress('{"xp":"12"}')).toThrow("xp is not a number");
  expect(() => parseProgress('{"stars":{"letters/a":"3"}}')).toThrow("letters/a");
  expect(() => parseProgress("[]")).toThrow();
});
