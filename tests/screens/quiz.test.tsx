import { describe, expect, open, test } from "nsh/test";
import { openLessonActivity } from "../support/open";
import type { App } from "nsh/test";
import { statesOfMatter } from "../../src/science/course";
import type { ScienceActivity } from "../../src/science/types";
import { activityKinds } from "../../src/ui/kit/theme";
import { viewports } from "../support/viewports";

type Quiz = Extract<ScienceActivity, { kind: "quiz" }>;
type Question = Quiz["questions"][number];

const wrongFallback = "Not quite. Try another answer.";
const reasonFallback = "Not quite. Think about the particles.";

const quizzes = statesOfMatter.lessons.flatMap((lesson, lessonIndex) =>
  lesson.activities.flatMap((activity, activityIndex) =>
    activity.kind === "quiz"
      ? [
          {
            title: `${lesson.title}, ${activity.role === "warmUp" ? "warm-up" : "check"}`,
            lesson: lessonIndex,
            activity: activityIndex,
            quiz: activity,
          },
        ]
      : [],
  ),
);

function expectShown(app: App, selectors: readonly string[]): void {
  expect(selectors.filter((s) => !app.shows(s))).toEqual([]);
}


type Status = "open" | "wrong" | "correct" | "dimmed";

/** The accessibility label an answer tile carries in each state. */
function tile(label: string, status: Status): string {
  if (status === "wrong") return `label:${label}, wrong`;
  if (status === "correct") return `label:${label}, correct`;
  return `label:${label}`;
}

/** Every choice of a multiple-choice set, given the wrong picks so far and whether the right one is chosen. */
function choiceTiles(options: readonly string[], answer: number, wrong: readonly number[], solved: boolean): string[] {
  return options.map((label, i) => {
    if (solved && i === answer) return tile(label, "correct");
    if (wrong.includes(i)) return tile(label, "wrong");
    return tile(label, solved ? "dimmed" : "open");
  });
}

async function enterQuestion(app: App, quiz: Quiz, index: number, q: Question): Promise<void> {
  await app.waitFor(`text:${q.prompt}`);
  expectShown(app, [
    `text:${activityKinds[quiz.role].label}`,
    `text:${index + 1} of ${quiz.questions.length}`,
    `text:${q.prompt}`,
    ...(q.visual === undefined ? [] : [`label:Particles in a ${q.visual.particles}`]),
    ...choiceTiles(q.options, q.answer, [], false),
    ...(q.hint === undefined ? [] : ["text:Need a hint?"]),
  ]);
}

/** A learner who picks wrong answers first, asks for the hint, then settles on the right answer and reason. */
async function walkWithMistakes(app: App, quiz: Quiz): Promise<void> {
  for (const [index, q] of quiz.questions.entries()) {
    await enterQuestion(app, quiz, index, q);

    const wrong: number[] = [];
    let hintOpen = false;
    for (const i of q.options.map((_, n) => n).filter((n) => n !== q.answer)) {
      await app.press(`label:${q.options[i]}`);
      wrong.push(i);
      await app.waitFor(tile(q.options[i], "wrong"));
      if (q.hint !== undefined && !hintOpen && wrong.length === 1) {
        await app.press("text:Need a hint?");
        hintOpen = true;
      }
      const hintVisible = q.hint !== undefined && (hintOpen || wrong.length >= 2);
      expectShown(app, [
        ...choiceTiles(q.options, q.answer, wrong, false),
        `text:${q.feedback?.[i] ?? wrongFallback}`,
        ...(hintVisible && q.hint !== undefined ? [`text:${q.hint}`] : []),
      ]);
    }

    await app.press(`label:${q.options[q.answer]}`);
    await app.waitFor(tile(q.options[q.answer], "correct"));
    const reason = q.reason;
    if (reason === undefined) {
      expectShown(app, [
        ...choiceTiles(q.options, q.answer, wrong, true),
        "text:You got it!",
        `text:${q.explanation}`,
        "label:Continue",
      ]);
    } else {
      expectShown(app, [
        ...choiceTiles(q.options, q.answer, wrong, true),
        `text:${reason.prompt ?? "Why is that?"}`,
        "text:Right!",
        ...choiceTiles(reason.options, reason.answer, [], false),
      ]);

      const wrongReasons: number[] = [];
      for (const r of reason.options.map((_, n) => n).filter((n) => n !== reason.answer)) {
        await app.press(`label:${reason.options[r]}`);
        wrongReasons.push(r);
        await app.waitFor(tile(reason.options[r], "wrong"));
        expectShown(app, [
          ...choiceTiles(q.options, q.answer, wrong, true),
          ...choiceTiles(reason.options, reason.answer, wrongReasons, false),
          `text:${reason.feedback?.[r] ?? reasonFallback}`,
        ]);
      }

      await app.press(`label:${reason.options[reason.answer]}`);
      await app.waitFor(tile(reason.options[reason.answer], "correct"));
      expectShown(app, [
        ...choiceTiles(q.options, q.answer, wrong, true),
        ...choiceTiles(reason.options, reason.answer, wrongReasons, true),
        "text:You got it!",
        `text:${q.explanation}`,
        "label:Continue",
      ]);
    }
    await app.press("label:Continue");
  }
}

/** A learner who gets every question right first time: the answer is praised, then the reason is asked. */
async function walkFirstTry(app: App, quiz: Quiz): Promise<void> {
  for (const [index, q] of quiz.questions.entries()) {
    await enterQuestion(app, quiz, index, q);

    await app.press(`label:${q.options[q.answer]}`);
    await app.waitFor(tile(q.options[q.answer], "correct"));
    const reason = q.reason;
    if (reason === undefined) {
      expectShown(app, [
        ...choiceTiles(q.options, q.answer, [], true),
        "text:Correct!",
        `text:${q.explanation}`,
        "label:Continue",
      ]);
    } else {
      expectShown(app, [
        ...choiceTiles(q.options, q.answer, [], true),
        `text:${reason.prompt ?? "Why is that?"}`,
        "text:Right!",
        ...choiceTiles(reason.options, reason.answer, [], false),
      ]);
      await app.press(`label:${reason.options[reason.answer]}`);
      await app.waitFor(tile(reason.options[reason.answer], "correct"));
      expectShown(app, [
        ...choiceTiles(q.options, q.answer, [], true),
        ...choiceTiles(reason.options, reason.answer, [], true),
        "text:Correct!",
        `text:${q.explanation}`,
        "label:Continue",
      ]);
    }
    await app.press("label:Continue");
  }
}

test("a wrong quiz pick is explained, and finishing reports half XP", async () => {
  const app = await open("../support/harness.tsx", {
    clock: {},
    host: { params: { screen: "fixture-activity", activity: "quiz" } },
  });
  expect(app.texts()).toContain("1 of 2");
  await app.press("text:Steam");
  expect(app.texts()).toContain("Steam is a gas, not a solid.");
  expect(app.count("text:Need a hint?")).toBe(1);
  await app.press("text:Ice");
  expect(app.texts()).toContain("You got it!");
  expect(app.texts()).toContain("Ice keeps its shape.");
  await app.press("text:Continue");
  await app.waitFor("text:2 of 2");
  await app.press("text:Water");
  await app.press("text:Continue");
  await app.waitFor("text:done: 15 xp, 1 mistakes");
});

test("a quiz reason is asked once the answer is right", async () => {
  const app = await open("../support/harness.tsx", {
    clock: {},
    host: { params: { screen: "fixture-activity", activity: "quizReason" } },
  });
  await app.press("text:Yes");
  expect(app.texts()).toContain("Why is that?");
  await app.press("text:It is cold.");
  expect(app.texts()).toContain("Cold alone does not make a solid.");
  await app.press("text:Its particles are packed close and stay put.");
  expect(app.texts()).toContain("You got it!");
  expect(app.texts()).toContain("Ice is a solid.");
  await app.press("text:Continue");
  await app.waitFor("text:done: 10 xp, 1 mistakes");
});

for (const viewport of viewports) {
  describe(viewport.name, () => {
    for (const c of quizzes) {
      test(`${c.title}: every wrong answer, hint and reason is explained and stays on screen`, async () => {
        const app = await openLessonActivity(viewport, c.lesson, c.activity);
        await walkWithMistakes(app, c.quiz);
        expect(app.texts().some((t) => t.startsWith("done: "))).toBe(true);
      }, 60000);

      test(`${c.title}: a first-try right answer is praised and every choice stays on screen`, async () => {
        const app = await openLessonActivity(viewport, c.lesson, c.activity);
        await walkFirstTry(app, c.quiz);
        expect(app.texts().some((t) => t.startsWith("done: "))).toBe(true);
      }, 60000);
    }
  });
}
