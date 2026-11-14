import { describe, expect, test } from "nsh/test";
import { attemptActivities } from "./attempt";
import type { ItemStats } from "./item-stats";
import {
  type Activity,
  type ChoiceQuestion,
  type ItemId,
  itemId,
  type Lesson,
  lessonId,
  right,
  wrong,
} from "./course";

type A = Activity<string, string> | { readonly kind: "lab"; readonly goals: readonly string[] };

const question = (id: string, ordered?: true): ChoiceQuestion => ({
  id: itemId(id),
  prompt: id,
  choices: [right(`${id}1`), wrong(`${id}2`, "f"), wrong(`${id}3`, "f"), wrong(`${id}4`, "f"), wrong(`${id}5`, "f")],
  explanation: "e",
  ...(ordered ? { ordered } : {}),
});

const none: ReadonlyMap<ItemId, ItemStats> = new Map();

const lesson: Lesson<A> = {
  id: lessonId("l"),
  title: "L",
  activities: [
    {
      kind: "quiz",
      role: "check",
      questions: [
        { ...question("a"), reason: { choices: [right("r1"), wrong("r2", "f"), wrong("r3", "f")] } },
        question("b"),
        question("c", true),
      ],
    },
    { kind: "explainer", title: "E", steps: ["s1", "s2", "s3"], scene: "scene" },
    {
      kind: "predict",
      question: "P",
      choices: [right("p1"), wrong("p2", "f"), wrong("p3", "f"), wrong("p4", "f")],
      tryIt: "t",
      experiment: "x",
      outcome: "o",
    },
    { kind: "lab", goals: ["g1", "g2", "g3"] },
  ],
};

/** What a learner sees in order: every text of every activity. */
const arrangement = (activities: readonly A[]) => JSON.stringify(activities);
/** `value` with every list sorted and unset fields dropped: equal when only the order of things differs. */
function unordered(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((v) => JSON.stringify(unordered(v))).sort();
  if (typeof value !== "object" || value === null) return value;
  const fields = Object.entries(value).filter(([, v]) => v !== undefined);
  return Object.fromEntries(fields.sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, unordered(v)]));
}

describe("an attempt", () => {
  test("keeps the lesson's activities and every part of them, only reordered", () => {
    for (let seed = 0; seed < 20; seed++) {
      const activities = attemptActivities(lesson, seed, none);
      expect(activities.map((a) => a.kind)).toEqual(lesson.activities.map((a) => a.kind));
      expect(unordered(activities)).toEqual(unordered(lesson.activities));
    }
  });

  test("the same seed gives the same order, and other seeds give other orders", () => {
    expect(arrangement(attemptActivities(lesson, 3, none))).toEqual(arrangement(attemptActivities(lesson, 3, none)));
    const orders = new Set(Array.from({ length: 10 }, (_, seed) => arrangement(attemptActivities(lesson, seed, none))));
    expect(orders.size).toBeGreaterThan(5);
  });

  test("an ordered question, an explainer and a course's own activity never move", () => {
    for (let seed = 0; seed < 20; seed++) {
      const [quiz, explainer, , lab] = attemptActivities(lesson, seed, none);
      const c = quiz.kind === "quiz" ? quiz.questions.find((q) => q.id === "c") : undefined;
      expect(c?.choices).toEqual(question("c").choices);
      expect(explainer).toEqual(lesson.activities[1]);
      expect(lab).toEqual(lesson.activities[3]);
    }
  });

  test("one activity's order does not depend on another's", () => {
    const withoutQuiz: Lesson<A> = { ...lesson, activities: [{ kind: "quiz", role: "check", questions: [question("z")] }, ...lesson.activities.slice(1)] };
    for (let seed = 0; seed < 10; seed++) {
      expect(attemptActivities(withoutQuiz, seed, none)[2]).toEqual(attemptActivities(lesson, seed, none)[2]);
    }
  });
});

describe("a warm-up with a review pool", () => {
  const pool = ["p1", "p2", "p3", "p4"].map((id) => question(id));
  const warmUpLesson: Lesson<A> = {
    id: lessonId("w"),
    title: "W",
    activities: [
      { kind: "quiz", role: "warmUp", questions: [question("own1"), question("own2")], review: { recalls: [], pool } },
    ],
  };
  const asked = (stats: ReadonlyMap<ItemId, ItemStats>, seed = 1) => {
    const [quiz] = attemptActivities(warmUpLesson, seed, stats);
    return quiz.kind === "quiz" ? quiz.questions.map((q) => q.id).sort() : [];
  };
  const stats = (box: number, lastSeen: number): ItemStats => ({ seen: 1, firstTries: box, box, lastSeen });

  test("asks its own questions until enough of the pool is answered", () => {
    expect(asked(none)).toEqual(["own1", "own2"]);
    expect(asked(new Map([[itemId("p1"), stats(0, 1)]]))).toEqual(["own1", "own2"]);
  });

  test("then asks the pool questions in the lowest boxes, the ones seen longest ago first", () => {
    const answered = new Map([
      [itemId("p1"), stats(3, 1)],
      [itemId("p2"), stats(0, 5)],
      [itemId("p3"), stats(1, 9)],
      [itemId("p4"), stats(1, 2)],
    ]);
    for (let seed = 0; seed < 10; seed++) expect(asked(answered, seed)).toEqual(["p2", "p4"]);
  });
});
