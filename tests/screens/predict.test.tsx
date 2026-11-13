import { describe, expect, open, test } from "nsh/test";
import type { App } from "nsh/test";
import type { PredictActivity } from "../../src/core/course";
import { type Confidence, confidences, predictResult, predictResultText } from "../../src/core/sessions/predict";
import { statesOfMatter } from "../../src/science/course";
import type { ExperimentId, ScienceActivity } from "../../src/science/types";
import { predictionTitle } from "../../src/ui/activities/predict";
import { viewports } from "../support/viewports";

type Predict = PredictActivity<ExperimentId>;

/** What a learner sees of each experiment before its result, and once it has reported. */
const experimentViews: Record<
  ExperimentId,
  {
    readonly before: readonly string[];
    readonly after: readonly string[];
    readonly drive: (app: App, reach: number, done: () => boolean) => Promise<void>;
  }
> = {
  balloon: {
    before: ["label:Pump"],
    after: ["text:Takes up space", "text:Has mass"],
    drive: async (app) => {
      for (let i = 0; i < 4; i++) await app.press("label:Pump");
    },
  },
  zoom: {
    before: ["label:Zoom", "label:Particles in a gas"],
    after: ["text:Between particles: nothing at all"],
    drive: (app, reach, done) => dragUntil(app, "label:Zoom", reach, done),
  },
  heatGas: {
    before: ["label:Heat", "label:Particles in a gas", "text:Speed: Slow", "text:Particle size: same"],
    after: ["text:Speed: Fast", "label:Particles in a gas"],
    drive: (app, reach, done) => dragUntil(app, "label:Heat", reach, done),
  },
  stove: {
    before: ["label:Stove", "label:Particles in a liquid", "text:20\u00B0C"],
    after: ["label:Particles in a gas", "text:The water itself is now a gas"],
    drive: (app, reach, done) => dragUntil(app, "label:Stove", reach, done),
  },
};

/** Slider drags move the value relative to where it is, so keep stepping until the experiment has reported. */
async function dragUntil(app: App, slider: string, reach: number, done: () => boolean): Promise<void> {
  for (let i = 0; i < 12 && !done(); i++) {
    await app.drag(slider, { x: reach });
    await app.wait(250);
  }
}

const predicts = statesOfMatter.lessons.flatMap((lesson, lessonIndex) =>
  lesson.activities.flatMap((activity: ScienceActivity, index) =>
    activity.kind === "predict" ? [{ lesson: lessonIndex, activity: index, predict: activity }] : [],
  ),
);

/** One whole prediction: pick, commit to a confidence, run the experiment, read the result, continue. */
async function walkPredict(app: App, p: Predict, pick: number, confidence: Confidence, dragReach: number): Promise<void> {
  const view = experimentViews[p.experiment];
  const chosen = p.options[pick];
  const right = pick === p.answer;

  expect(app.shows(`text:${p.question}`)).toBe(true);
  for (const option of p.options) expect(app.shows(`label:${option}`)).toBe(true);
  for (const selector of view.before) expect(app.shows(selector)).toBe(true);
  expect(app.count("text:How sure are you?")).toBe(0);

  await app.press(`label:${chosen}`);
  expect(app.shows(`label:${chosen}, your pick`)).toBe(true);
  for (const option of p.options) {
    if (option !== chosen) expect(app.shows(`label:${option}`)).toBe(true);
  }
  expect(app.shows("text:How sure are you?")).toBe(true);
  for (const c of confidences) expect(app.shows(`label:${c}`)).toBe(true);

  await app.press(`label:${confidence}`);
  expect(app.shows(`text:${p.tryIt}`)).toBe(true);
  expect(app.shows(`text:You predicted: ${chosen}`)).toBe(true);
  for (const option of p.options) expect(app.count(`label:${option}`)).toBe(0);
  for (const selector of view.before) expect(app.shows(selector)).toBe(true);

  await view.drive(app, dragReach, () => app.count("label:Continue") > 0);
  await app.waitFor("label:Continue", { timeout: 15000 });

  expect(app.shows(`text:${predictionTitle(right, confidence)}`)).toBe(true);
  expect(app.shows(`text:${predictResultText(p, { prediction: pick, confidence, observed: true })}`)).toBe(true);
  if (!right) expect(app.shows(`text:${p.options[p.answer]}`)).toBe(true);
  for (const selector of view.after) expect(app.shows(selector)).toBe(true);
  expect(app.shows("label:Continue")).toBe(true);

  await app.press("label:Continue");
  await app.waitFor(`text:done: ${predictResult(p).xp} xp, 0 mistakes`);
}

test("a prediction is tested, revealed and worth its XP without a mistake", async () => {
  const app = await open("../support/harness.tsx", {
    host: { params: { screen: "fixture-activity", activity: "predict" } },
  });
  await app.press("text:Run it (cold)");
  expect(app.count("text:Put the balloon in cold water")).toBe(0);
  await app.press("text:It shrinks");
  await app.waitFor("text:How sure are you?");
  await app.press("label:Pretty sure");
  await app.waitFor("text:Put the balloon in cold water");
  expect(app.texts()).toContain("You predicted: It shrinks");
  await app.press("text:Run it (cold)");
  await app.waitFor("text:You called it!");
  expect(app.texts()).toContain("Cold air takes up less room.");
  await app.press("text:Continue");
  await app.waitFor("text:done: 5 xp, 0 mistakes");
});

for (const viewport of viewports) {
  describe(viewport.name, () => {
    for (const { lesson, activity, predict } of predicts) {
      const title = statesOfMatter.lessons[lesson].title;
      const wrong = (predict.answer + 1) % predict.options.length;
      const dragReach = viewport.width / 2 - 10;

      test(
        `${title}: a missed prediction shows the pick, the confidence row, the try-it panel and the result`,
        async () => {
          const app = await open("../support/harness.tsx", {
            width: viewport.width,
            height: viewport.height,
            reducedMotion: true,
            host: { params: { screen: "lesson-activity", lesson, activity } },
          });
          await walkPredict(app, predict, wrong, "Pretty sure", dragReach);
        },
        90000,
      );

      test(
        `${title}: a called prediction shows the result without the right-answer line`,
        async () => {
          const app = await open("../support/harness.tsx", {
            width: viewport.width,
            height: viewport.height,
            reducedMotion: true,
            host: { params: { screen: "lesson-activity", lesson, activity } },
          });
          await walkPredict(app, predict, predict.answer, "Totally sure", dragReach);
        },
        90000,
      );
    }
  });
}
