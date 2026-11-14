import { describe, expect, open, test } from "nsh/test";
import { activitiesOf } from "../support/installed";
import { openLessonActivity } from "../support/open";
import type { App } from "nsh/test";
import type { Choice } from "../../src/core/course";
import type { ScienceActivity } from "../../src/courses/states-of-matter/types";
import { activityKinds } from "../../src/ui/kit/theme";
import { rightOf } from "../support/choices";
import { viewports } from "../support/viewports";

type Quiz = Extract<ScienceActivity, { kind: "quiz" }>;
type Question = Quiz["questions"][number];

const quizzes = activitiesOf<Quiz>("quiz").map(({ at, title, activity }) => ({
  title: `${title}, ${activity.role === "warmUp" ? "warm-up" : "check"}`,
  at,
  quiz: activity,
}));

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
function choiceTiles(choices: readonly Choice[], wrong: readonly Choice[], solved: boolean): string[] {
  return choices.map((c) => {
    if (solved && c.right) return tile(c.text, "correct");
    if (wrong.includes(c)) return tile(c.text, "wrong");
    return tile(c.text, solved ? "dimmed" : "open");
  });
}

async function enterQuestion(app: App, quiz: Quiz, index: number, q: Question): Promise<void> {
  await app.waitFor(`text:${q.prompt}`);
  expectShown(app, [
    `text:${activityKinds[quiz.role].label}`,
    `text:${index + 1} of ${quiz.questions.length}`,
    `text:${q.prompt}`,
    ...(q.visual === undefined ? [] : [`label:Particles in a ${q.visual.particles}`]),
    ...choiceTiles(q.choices, [], false),
    ...(q.hint === undefined ? [] : ["text:Need a hint?"]),
  ]);
}

/** A learner who picks wrong answers first, asks for the hint, then settles on the right answer and reason. */
async function walkWithMistakes(app: App, quiz: Quiz): Promise<void> {
  for (const [index, q] of quiz.questions.entries()) {
    await enterQuestion(app, quiz, index, q);

    const wrong: Choice[] = [];
    let hintOpen = false;
    for (const c of q.choices) {
      if (c.right) continue;
      await app.press(`label:${c.text}`);
      wrong.push(c);
      await app.waitFor(tile(c.text, "wrong"));
      if (q.hint !== undefined && !hintOpen && wrong.length === 1) {
        await app.press("text:Need a hint?");
        hintOpen = true;
      }
      const hintVisible = q.hint !== undefined && (hintOpen || wrong.length >= 2);
      expectShown(app, [
        ...choiceTiles(q.choices, wrong, false),
        `text:${c.feedback}`,
        ...(hintVisible && q.hint !== undefined ? [`text:${q.hint}`] : []),
      ]);
    }

    const answer = rightOf(q.choices);
    await app.press(`label:${answer.text}`);
    await app.waitFor(tile(answer.text, "correct"));
    const reason = q.reason;
    if (reason === undefined) {
      expectShown(app, [
        ...choiceTiles(q.choices, wrong, true),
        "text:You got it!",
        `text:${q.explanation}`,
        "label:Continue",
      ]);
    } else {
      expectShown(app, [
        ...choiceTiles(q.choices, wrong, true),
        `text:${reason.prompt ?? "Why is that?"}`,
        "text:Right!",
        ...choiceTiles(reason.choices, [], false),
      ]);

      const wrongReasons: Choice[] = [];
      for (const r of reason.choices) {
        if (r.right) continue;
        await app.press(`label:${r.text}`);
        wrongReasons.push(r);
        await app.waitFor(tile(r.text, "wrong"));
        expectShown(app, [
          ...choiceTiles(q.choices, wrong, true),
          ...choiceTiles(reason.choices, wrongReasons, false),
          `text:${r.feedback}`,
        ]);
      }

      const why = rightOf(reason.choices);
      await app.press(`label:${why.text}`);
      await app.waitFor(tile(why.text, "correct"));
      expectShown(app, [
        ...choiceTiles(q.choices, wrong, true),
        ...choiceTiles(reason.choices, wrongReasons, true),
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

    const answer = rightOf(q.choices);
    await app.press(`label:${answer.text}`);
    await app.waitFor(tile(answer.text, "correct"));
    const reason = q.reason;
    if (reason === undefined) {
      expectShown(app, [...choiceTiles(q.choices, [], true), "text:Correct!", `text:${q.explanation}`, "label:Continue"]);
    } else {
      expectShown(app, [
        ...choiceTiles(q.choices, [], true),
        `text:${reason.prompt ?? "Why is that?"}`,
        "text:Right!",
        ...choiceTiles(reason.choices, [], false),
      ]);
      const why = rightOf(reason.choices);
      await app.press(`label:${why.text}`);
      await app.waitFor(tile(why.text, "correct"));
      expectShown(app, [
        ...choiceTiles(q.choices, [], true),
        ...choiceTiles(reason.choices, [], true),
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
        const app = await openLessonActivity(viewport, c.at);
        await walkWithMistakes(app, c.quiz);
        expect(app.texts().some((t) => t.startsWith("done: "))).toBe(true);
      }, 60000);

      test(`${c.title}: a first-try right answer is praised and every choice stays on screen`, async () => {
        const app = await openLessonActivity(viewport, c.at);
        await walkFirstTry(app, c.quiz);
        expect(app.texts().some((t) => t.startsWith("done: "))).toBe(true);
      }, 60000);
    }
  });
}
