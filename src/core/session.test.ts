import { describe, expect, test } from "nsh/test";
import { advanceSession, parseSession, resumeOrStart, startSession } from "./session";

describe("a lesson session", () => {
  test("sums each activity's result and finishes after the last one", () => {
    const first = advanceSession(startSession("c/l", 7), { xp: 10, mistakes: 1 }, 3);
    expect(first).toEqual({ session: { lesson: "c/l", seed: 7, index: 1, xp: 10, mistakes: 1 } });
    const second = "session" in first ? advanceSession(first.session, { xp: 5, mistakes: 0 }, 3) : first;
    const done = "session" in second ? advanceSession(second.session, { xp: 20, mistakes: 2 }, 3) : second;
    expect(done).toEqual({ outcome: { xp: 35, mistakes: 3 } });
  });

  const saved = { lesson: "c/l", seed: 7, index: 2, xp: 15, mistakes: 1 };
  const cases: [string, Parameters<typeof resumeOrStart>[0], string, number, unknown][] = [
    ["resumes the saved session of the same lesson", saved, "c/l", 5, saved],
    ["starts afresh when the saved session is another lesson's", saved, "c/other", 5, startSession("c/other", 99)],
    ["starts afresh when nothing is saved", null, "c/l", 5, startSession("c/l", 99)],
    ["starts afresh when the lesson now has fewer activities", saved, "c/l", 2, startSession("c/l", 99)],
  ];
  for (const [name, savedSession, lesson, count, expected] of cases) {
    test(name, () => {
      expect(resumeOrStart(savedSession, lesson, count, 99)).toEqual(expected);
    });
  }

  test("a saved session reads back as it was written", () => {
    expect(parseSession(JSON.stringify(saved))).toEqual(saved);
    expect(parseSession(null)).toBe(null);
  });

  test("a mistyped saved session throws", () => {
    expect(() => parseSession(JSON.stringify({ ...saved, index: "2" }))).toThrow("index is not a number");
    expect(() => parseSession("[]")).toThrow("not an object");
  });
});
