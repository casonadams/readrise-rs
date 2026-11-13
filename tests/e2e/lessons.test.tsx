import { describe, expect, open, test } from "nsh/test";
import type { App } from "nsh/test";
import type { Course } from "../../src/core/course";
import { statesOfMatter } from "../../src/science/course";
import type { ExperimentId, ScienceActivity, ScienceLesson } from "../../src/science/types";
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

/** Plays one activity the way a learner who makes a mistake would, so feedback, hints and reasons all show. */
async function play(app: App, activity: ScienceActivity, reach: number): Promise<void> {
  switch (activity.kind) {
    case "quiz":
      for (const q of activity.questions) {
        await app.press(`label:${q.options[(q.answer + 1) % q.options.length]}`);
        if (app.count("label:Need a hint?") > 0) await app.press("label:Need a hint?");
        await app.press(`label:${q.options[q.answer]}`);
        if (q.reason !== undefined) {
          await app.press(`label:${q.reason.options[(q.reason.answer + 1) % q.reason.options.length]}`);
          await app.press(`label:${q.reason.options[q.reason.answer]}`);
        }
        await app.press("label:Continue");
      }
      return;
    case "predict":
      await app.press(`label:${activity.options[(activity.answer + 1) % activity.options.length]}`);
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
      await app.press(`label:${activity.bins[(activity.items[0].bin + 1) % activity.bins.length]}`);
      for (const item of activity.items) await app.press(`label:${activity.bins[item.bin]}`);
      await app.press("label:Continue");
      return;
    case "whoIsRight": {
      const claimLabel = (i: number) => `label:${activity.claims[i].kid.name}: ${activity.claims[i].says}`;
      await app.press(claimLabel((activity.answer + 1) % activity.claims.length));
      await app.press(claimLabel(activity.answer));
      await app.press("label:Continue");
      return;
    }
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
  return app;
}

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
