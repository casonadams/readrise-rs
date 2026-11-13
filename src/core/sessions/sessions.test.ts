import { describe, expect, test } from "nsh/test";
import type { PredictActivity, QuizActivity, SortActivity, WhoIsRightActivity } from "../course";
import { scoreXp, type Step } from "../scoring";
import { commit, isTesting, observe, predict, predictResult, predictResultText, predictStart } from "./predict";
import { isSettled, nextQuestion, pickAnswer, pickReason, type QuizState, quizStart, showHint } from "./quiz";
import { drop, finishSort, showSortHint, sortStart } from "./sort";
import { pickClaim, whoIsRightResult, whoIsRightStart } from "./who-is-right";

function resultOf<S>(step: Step<S>) {
  if (!("result" in step)) throw new Error("expected the activity to finish");
  return step.result;
}

function stateOf<S>(step: Step<S>): S {
  if (!("state" in step)) throw new Error("expected the activity to go on");
  return step.state;
}

test("XP: first try counts fully, recovered half", () => {
  expect(scoreXp(2, 0, 2, 20)).toBe(20);
  expect(scoreXp(1, 1, 2, 20)).toBe(15);
  expect(scoreXp(0, 2, 2, 20)).toBe(10);
  expect(scoreXp(1, 0, 3, 10)).toBe(3);
});

describe("quiz", () => {
  const quiz: QuizActivity = {
    kind: "quiz",
    role: "check",
    questions: [
      { prompt: "Q1", options: ["a", "b", "c", "d"], answer: 3, explanation: "e", hint: "h" },
      {
        prompt: "Q2",
        options: ["a", "b"],
        answer: 0,
        explanation: "e",
        reason: { options: ["r0", "r1"], answer: 1 },
      },
    ],
  };
  const answer = (s: QuizState, ...picks: number[]) => picks.reduce((st, p) => pickAnswer(quiz, st, p), s);

  test("the hint shows on its own after two misses", () => {
    const once = answer(quizStart, 0);
    expect(once.hintShown).toBe(false);
    expect(answer(once, 1).hintShown).toBe(true);
  });

  test("picking a crossed-out option again is not another mistake", () => {
    expect(answer(quizStart, 0, 0).mistakes).toBe(1);
  });

  test("a reason must be found before the question settles", () => {
    const toQ2 = stateOf(nextQuestion(quiz, answer(quizStart, 3)));
    const answered = pickAnswer(quiz, toQ2, 0);
    expect(isSettled(quiz, answered)).toBe(false);
    expect(() => nextQuestion(quiz, answered)).toThrow("not settled");
    const wrongReason = pickReason(quiz, answered, 0);
    expect(wrongReason.mistakes).toBe(1);
    expect(isSettled(quiz, pickReason(quiz, wrongReason, 1))).toBe(true);
  });

  test("clean answers earn full XP; a hint or a wrong reason earns half", () => {
    const clean = stateOf(nextQuestion(quiz, answer(quizStart, 3)));
    const cleanDone = pickReason(quiz, pickAnswer(quiz, clean, 0), 1);
    expect(resultOf(nextQuestion(quiz, cleanDone))).toEqual({ xp: 20, mistakes: 0 });

    const hinted = stateOf(nextQuestion(quiz, answer(showHint(quizStart), 3)));
    const missedReason = pickReason(quiz, pickReason(quiz, pickAnswer(quiz, hinted, 0), 0), 1);
    expect(resultOf(nextQuestion(quiz, missedReason))).toEqual({ xp: 10, mistakes: 1 });
  });
});

describe("sort", () => {
  const sort: SortActivity = {
    kind: "sort",
    prompt: "P",
    bins: ["Solid", "Gas"],
    items: [
      { label: "Ice", bin: 0, why: "It keeps its shape." },
      { label: "Steam", bin: 1 },
    ],
    hint: "Can you pour it?",
  };

  test("a wrong bin is a mistake with the hint as feedback", () => {
    const s = drop(sort, sortStart(sort), 1);
    expect([s.next, s.mistakes, s.hintShown]).toEqual([0, 1, true]);
    expect(s.feedback).toEqual({ kind: "wrong", title: "Not quite!", message: "Can you pour it?" });
  });

  test("a right bin places the item and says why", () => {
    const s = drop(sort, sortStart(sort), 0);
    expect(s.placed).toEqual([[0], []]);
    expect(s.feedback).toEqual({ kind: "correct", title: "Ice: Solid", message: "It keeps its shape." });
    expect(drop(sort, s, 1).feedback?.message).toBe("Nice sorting!");
  });

  test("finishes only once every item is placed, with half credit after a miss", () => {
    const first = drop(sort, sortStart(sort), 0);
    expect(stateOf(finishSort(sort, first))).toBe(first);
    const done = drop(sort, drop(sort, first, 0), 1);
    expect(resultOf(finishSort(sort, done))).toEqual({ xp: 15, mistakes: 1 });
  });

  test("asking for the hint makes the current item worth half", () => {
    const done = drop(sort, drop(sort, showSortHint(sort, sortStart(sort)), 0), 1);
    expect(resultOf(finishSort(sort, done))).toEqual({ xp: 15, mistakes: 0 });
  });
});

describe("who's right", () => {
  const w: WhoIsRightActivity = {
    kind: "whoIsRight",
    situation: "S",
    claims: ["x", "y", "z"].map((says) => ({ kid: { name: says, skin: "#000", hair: "#000" }, says })),
    answer: 2,
    explanation: "E",
    feedback: { 0: "no", 1: "no" },
  };

  test("first pick right earns full XP", () => {
    expect(whoIsRightResult(w, pickClaim(w, whoIsRightStart, 2))).toEqual({ xp: 10, mistakes: 0 });
  });

  test("each wrong claim is a mistake and halves the XP", () => {
    const s = pickClaim(w, pickClaim(w, pickClaim(w, whoIsRightStart, 0), 1), 2);
    expect(whoIsRightResult(w, s)).toEqual({ xp: 5, mistakes: 2 });
  });

  test("cannot finish before the right claim is found", () => {
    expect(() => whoIsRightResult(w, pickClaim(w, whoIsRightStart, 0))).toThrow();
  });
});

describe("predict", () => {
  const p: PredictActivity<string> = {
    kind: "predict",
    question: "Q",
    options: ["bigger", "faster"],
    answer: 1,
    tryIt: "Heat it",
    experiment: "heatGas",
    outcome: "They move faster.",
    reactions: { 0: "A common idea!" },
  };

  test("the experiment runs only between committing and observing", () => {
    const picked = predict(predictStart, 0);
    expect(isTesting(picked)).toBe(false);
    expect(observe(picked).observed).toBe(false);
    const committed = commit(picked, "Pretty sure");
    expect(isTesting(committed)).toBe(true);
    expect(predict(committed, 1).prediction).toBe(0);
    expect(isTesting(observe(committed))).toBe(false);
  });

  test("the result reacts to a wrong prediction, then says what happens", () => {
    expect(predictResultText(p, commit(predict(predictStart, 0), "Just guessing"))).toBe(
      "A common idea! They move faster.",
    );
    expect(predictResultText(p, predict(predictStart, 1))).toBe("They move faster.");
  });

  test("a prediction is never a mistake", () => {
    expect(predictResult(p)).toEqual({ xp: 5, mistakes: 0 });
  });
});
