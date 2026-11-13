import { describe, expect, test } from "nsh/test";
import { Catalog, summarizeSubjects } from "./catalog";
import type { Course } from "./course";
import { emptyProgress, type Progress } from "./progress";
import { course, maths, type Plain, reading } from "./test-courses";

const letters = course("letters", ["a", "b"]);
const words = course("words", ["cat"], { requires: ["letters"] });
const counting = course("counting", ["one", "two"], { subject: maths });
const catalog = new Catalog([letters, words, counting]);

function done(...keys: string[]): Progress {
  return { ...emptyProgress, stars: Object.fromEntries(keys.map((k) => [k, 2])) };
}

describe("rejects an inconsistent catalog", () => {
  const cases: [string, Course<Plain>[], string][] = [
    ["a duplicate course", [letters, letters], "duplicate course letters"],
    ["a requirement installed after", [words, letters], "requires letters"],
    ["a course that requires itself", [course("x", ["a"], { requires: ["x"] })], "requires x"],
    ["a course without lessons", [course("empty", [])], "has no lessons"],
    ["a duplicate lesson", [course("dup", ["a", "a"])], "duplicate lesson dup/a"],
    ["one subject id with two titles", [letters, course("y", ["a"], { subject: { ...reading, title: "Read" } })], "Read"],
    ["a lesson without activities", [{ ...letters, lessons: [{ id: "a", title: "A", activities: [] }] }], "no activities"],
  ];
  for (const [name, courses, message] of cases) {
    test(name, () => {
      expect(() => new Catalog(courses)).toThrow(message);
    });
  }
});

test("the same lesson id may appear in different courses", () => {
  expect(new Catalog([course("p", ["a"]), course("q", ["a"])]).courses).toHaveLength(2);
});

test("unknown ids are rejected", () => {
  expect(() => catalog.course("nope")).toThrow("unknown course nope");
  expect(() => catalog.lesson("letters", "z")).toThrow("unknown lesson letters/z");
});

test("lessons unlock in order within a course", () => {
  const [a, b] = letters.lessons;
  expect(catalog.isLessonUnlocked(emptyProgress, letters, a)).toBe(true);
  expect(catalog.isLessonUnlocked(emptyProgress, letters, b)).toBe(false);
  expect(catalog.isLessonUnlocked(done("letters/a"), letters, b)).toBe(true);
});

test("a course stays locked until every required course is complete", () => {
  const cat = words.lessons[0];
  expect(catalog.isLessonUnlocked(done("letters/a"), words, cat)).toBe(false);
  expect(catalog.isLessonUnlocked(done("letters/a", "letters/b"), words, cat)).toBe(true);
});

describe("continue", () => {
  const next = (p: Progress, closed?: ReadonlySet<string>) => {
    const ref = catalog.continueTarget(p, closed);
    return ref === null ? null : `${ref.course.id}/${ref.lesson.id}`;
  };

  test("starts at the first open lesson when nothing is done", () => {
    expect(next(emptyProgress)).toBe("letters/a");
  });

  test("skips finished lessons and locked courses", () => {
    expect(next(done("letters/a", "letters/b"))).toBe("words/cat");
  });

  test("stays in the subject that was practised last", () => {
    expect(next({ ...done("counting/one"), lastLesson: "counting/one" })).toBe("counting/two");
  });

  test("falls back to another subject when the last one is finished", () => {
    expect(next({ ...done("counting/one", "counting/two"), lastLesson: "counting/two" })).toBe("letters/a");
  });

  test("never leads into a closed subject", () => {
    expect(next({ ...done("letters/a"), lastLesson: "letters/a" }, new Set(["reading"]))).toBe("counting/one");
  });

  test("is null when everything is finished", () => {
    expect(next(done("letters/a", "letters/b", "words/cat", "counting/one", "counting/two"))).toBe(null);
  });
});

test("summaries group courses by subject in first-seen order with counts", () => {
  const summaries = summarizeSubjects(catalog, done("letters/a"), new Set(["maths"]));
  expect(summaries.map((s) => [s.subject.id, s.lessonsDone, s.lessonsTotal, s.next?.lesson.id, s.open])).toEqual([
    ["reading", 1, 3, "b", true],
    ["maths", 0, 2, "one", false],
  ]);
});
