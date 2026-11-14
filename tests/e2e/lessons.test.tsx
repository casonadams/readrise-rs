import { describe, expect, open, test } from "nsh/test";
import type { App } from "nsh/test";
import type { Choice, Course } from "../../src/core/course";
import { statesOfMatter } from "../../src/courses/states-of-matter/course";
import type { ExperimentId, ScienceActivity, ScienceLesson } from "../../src/courses/states-of-matter/types";
import { rightOf, wrongOf } from "../support/choices";
import { type Viewport, viewports } from "../support/viewports";

function progressBefore(course: Course<ScienceActivity>, lessonIndex: number): string {
  const stars = Object.fromEntries(course.lessons.slice(0, lessonIndex).map((l) => [`${course.id}/${l.id}`, 3]));
  return JSON.stringify({ xp: 0, streak: 0, lastPractice: null, lastLesson: null, stars });
}

const experimentSteps: Record<ExperimentId, (app: App) => Promise<void>> = {
  balloon: async (app) => {
    for (let i = 0; i < 4; i++) await app.press("label:Pump");
  },
  zoom: (app) => app.drag("label:Zoom", { x: 400 }),
  heatGas: (app) => app.drag("label:Heat", { x: 400 }),
  stove: (app) => app.drag("label:Stove", { x: 400 }),
};

const goalButton = () => "label:/^(Goal reached! Next goal|Finish)$/";

const targetCelsius: Record<string, number> = { solid: -15, liquid: 40, gas: 110 };

function celsiusShown(app: App): number {
  const reading = app.texts().find((t) => /^-?\d+\u00B0C/.test(t));
  if (reading === undefined) throw new Error("no temperature on screen");
  return parseInt(reading, 10);
}

/** Slider drags move the value relative to where it is; the slider settles a moment after the finger lifts. */
async function reachState(app: App, target: string, reach: number): Promise<void> {
  for (let i = 0; i < 20 && app.count(goalButton()) === 0; i++) {
    const gap = targetCelsius[target] - celsiusShown(app);
    await app.drag("label:Water temperature", { x: Math.max(-reach, Math.min(reach, gap * 2)) });
    await app.wait(250);
  }
}

type Quiz = Extract<ScienceActivity, { kind: "quiz" }>;
type Sort = Extract<ScienceActivity, { kind: "sort" }>;
type WhoIsRight = Extract<ScienceActivity, { kind: "whoIsRight" }>;

/** Questions come in a new order on every attempt: answers each one on screen, a wrong pick and the hint first. */
async function playQuiz(app: App, quiz: Quiz): Promise<void> {
  const shown = (q: Quiz["questions"][number]) =>
    app.shows(`text:${q.prompt}`) && (q.visual === undefined || app.shows(`label:Particles in a ${q.visual.particles}`));
  for (const _ of quiz.questions) {
    const q = quiz.questions.find(shown);
    if (q === undefined) throw new Error(`none of the quiz's questions is on screen: ${app.texts().join(" | ")}`);
    await app.press(`label:${wrongOf(q.choices).text}`);
    if (app.count("label:Need a hint?") > 0) await app.press("label:Need a hint?");
    await app.press(`label:${rightOf(q.choices).text}`);
    if (q.reason !== undefined) {
      await app.press(`label:${wrongOf(q.reason.choices).text}`);
      await app.press(`label:${rightOf(q.reason.choices).text}`);
    }
    await app.press("label:Continue");
  }
}

/** Items come in a new order on every attempt: sorts the one on the card, the one not yet in a box. */
async function playSort(app: App, sort: Sort): Promise<void> {
  const sorted = new Set<string>();
  const current = () => {
    const item = sort.items.find((i) => !sorted.has(i.label) && app.texts().includes(i.label));
    if (item === undefined) throw new Error(`no unsorted item on screen: ${app.texts().join(" | ")}`);
    return item;
  };
  await app.press(`label:${sort.bins[(current().bin + 1) % sort.bins.length]}`);
  for (const _ of sort.items) {
    const item = current();
    await app.press(`label:${sort.bins[item.bin]}`);
    sorted.add(item.label);
  }
  await app.press("label:Continue");
}

async function playWhoIsRight(app: App, who: WhoIsRight): Promise<void> {
  const claimLabel = (says: Choice) => `label:${who.claims.find((c) => c.says === says)?.kid.name}: ${says.text}`;
  const says = who.claims.map((c) => c.says);
  await app.press(claimLabel(wrongOf(says)));
  await app.press(claimLabel(rightOf(says)));
  await app.press("label:Continue");
}

/** Plays one activity the way a learner who makes a mistake would, so feedback, hints and reasons all show. */
async function play(app: App, activity: ScienceActivity, reach: number): Promise<void> {
  switch (activity.kind) {
    case "quiz":
      return playQuiz(app, activity);
    case "predict":
      await app.press(`label:${wrongOf(activity.choices).text}`);
      await app.press("label:Pretty sure");
      await experimentSteps[activity.experiment](app);
      await app.waitFor("label:Continue", { timeout: 15000 });
      await app.press("label:Continue");
      return;
    case "explainer":
      for (let i = 1; i < activity.steps.length; i++) await app.press("label:Next \u2192");
      await app.press("label:Continue");
      return;
    case "sort":
      return playSort(app, activity);
    case "whoIsRight":
      return playWhoIsRight(app, activity);
    case "heatLab":
      for (const [i, goal] of activity.goals.entries()) {
        await app.waitFor(`text:Goal ${i + 1} of ${activity.goals.length}`);
        await reachState(app, goal.target, reach);
        await app.press(i + 1 === activity.goals.length ? "label:Finish" : "label:Goal reached! Next goal");
      }
      return;
  }
}

async function playLesson(viewport: Viewport, index: number): Promise<App> {
  const lesson: ScienceLesson = statesOfMatter.lessons[index];
  const app = await open("../../App.tsx", {
    width: viewport.width,
    height: viewport.height,
    reducedMotion: true,
    clock: {},
    storage: { "progress.v1": progressBefore(statesOfMatter, index) },
  });
  await app.press(`label:${lesson.title}, start here`);
  for (const [i, activity] of lesson.activities.entries()) {
    await app.waitFor(`label:Step ${i + 1} of ${lesson.activities.length}`);
    await play(app, activity, viewport.width / 2 - 10);
  }
  await app.waitFor("label:Back to the path");
  expect(app.storage()["session.v1"]).toBeUndefined();
  return app;
}

test("a lesson left halfway carries on at the same step", async () => {
  const index = 2;
  const lesson: ScienceLesson = statesOfMatter.lessons[index];
  const app = await open("../../App.tsx", {
    reducedMotion: true,
    clock: {},
    storage: { "progress.v1": progressBefore(statesOfMatter, index) },
  });
  await app.press(`label:${lesson.title}, start here`);
  for (const activity of lesson.activities.slice(0, 2)) await play(app, activity, 150);
  await app.waitFor(`label:Step 3 of ${lesson.activities.length}`);
  app.onDialog(() => "Leave");
  await app.press("label:Leave lesson");
  await app.waitFor(`label:${lesson.title}, start here`);
  await app.press(`label:${lesson.title}, start here`);
  await app.waitFor(`label:Step 3 of ${lesson.activities.length}`);
  for (const activity of lesson.activities.slice(2)) await play(app, activity, 150);
  await app.waitFor("label:Back to the path");
  expect(app.storage()["session.v1"]).toBeUndefined();
}, 60000);

for (const viewport of viewports) {
  describe(viewport.name, () => {
    statesOfMatter.lessons.forEach((lesson, index) => {
      test(`plays the ${lesson.title} lesson to the end and saves a star`, async () => {
        const app = await playLesson(viewport, index);
        await app.press("label:Back to the path");
        await app.waitFor(`label:/^${lesson.title}, [123] of 3 stars$/`);
        expect(app.count(`label:/^${lesson.title}, [123] of 3 stars$/`)).toBe(1);
      }, 60000);
    });
  });
}
