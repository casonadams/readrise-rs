import { describe, expect, open, test } from "nsh/test";
import { activitiesOf, type AnyExperimentId } from "../support/installed";
import { openLessonActivity } from "../support/open";
import type { App } from "nsh/test";
import type { PredictActivity } from "../../src/core/course";
import { type Confidence, confidences, predictResult, predictResultText } from "../../src/core/sessions/predict";
import { predictionTitle } from "../../src/ui/activities/predict";
import { rightOf } from "../support/choices";
import { viewports } from "../support/viewports";

type Predict = PredictActivity<AnyExperimentId>;

/** What a learner sees of each experiment before its result, and once it has reported. */
const experimentViews: Record<
  AnyExperimentId,
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
  evaporation: {
    before: ["label:Time", "text:In the glass: 30", "text:In the air: 0"],
    after: ["text:In the glass: 20", "text:In the air: 10"],
    drive: (app, reach, done) => dragUntil(app, "label:Time", reach, done),
  },
  dissolving: {
    before: ["label:Stir", "text:Sugar: 12", "text:In the cube: 12"],
    after: ["text:In the cube: 0", "text:Hidden, not gone"],
    drive: (app, reach, done) => dragUntil(app, "label:Stir", reach, done),
  },
  meltOrDissolve: {
    before: ["label:Time", "text:Ice in a warm room", "text:Sugar in water", "text:Only water", "text:Water + sugar"],
    after: ["text:Only water", "text:Water + sugar"],
    drive: (app, reach, done) => dragUntil(app, "label:Time", reach, done),
  },
  mass: {
    before: ["label:Stir", "label:Scale reads 110 grams"],
    after: ["label:Scale reads 110 grams", "text:No particle left the glass"],
    drive: (app, reach, done) => dragUntil(app, "label:Stir", reach, done),
  },
  spoons: {
    before: ["label:Add a spoon", "text:Spoons: 0", "text:Dissolved: 0"],
    after: ["text:Spoons: 6", "text:Dissolved: 3", "text:Full: the rest stays at the bottom"],
    drive: async (app) => {
      for (let i = 0; i < 6; i++) await app.press("label:Add a spoon");
    },
  },
};

/** Slider drags move the value relative to where it is, so keep stepping until the experiment has reported. */
async function dragUntil(app: App, slider: string, reach: number, done: () => boolean): Promise<void> {
  for (let i = 0; i < 12 && !done(); i++) {
    await app.drag(slider, { x: reach });
    await app.wait(250);
  }
}

const predicts = activitiesOf<Predict>("predict");

/** One whole prediction: pick, commit to a confidence, run the experiment, read the result, continue. */
async function walkPredict(app: App, p: Predict, pick: number, confidence: Confidence, dragReach: number): Promise<void> {
  const view = experimentViews[p.experiment];
  const texts = p.choices.map((c) => c.text);
  const chosen = texts[pick];
  const right = p.choices[pick].right;

  expect(app.shows(`text:${p.question}`)).toBe(true);
  for (const option of texts) expect(app.shows(`label:${option}`)).toBe(true);
  for (const selector of view.before) expect(app.shows(selector)).toBe(true);
  expect(app.count("text:How sure are you?")).toBe(0);

  await app.press(`label:${chosen}`);
  expect(app.shows(`label:${chosen}, your pick`)).toBe(true);
  for (const option of texts) {
    if (option !== chosen) expect(app.shows(`label:${option}`)).toBe(true);
  }
  expect(app.shows("text:How sure are you?")).toBe(true);
  for (const c of confidences) expect(app.shows(`label:${c}`)).toBe(true);

  await app.press(`label:${confidence}`);
  expect(app.shows(`text:${p.tryIt}`)).toBe(true);
  expect(app.shows(`text:You predicted: ${chosen}`)).toBe(true);
  for (const option of texts) expect(app.count(`label:${option}`)).toBe(0);
  for (const selector of view.before) expect(app.shows(selector)).toBe(true);

  await view.drive(app, dragReach, () => app.count("label:Continue") > 0);
  await app.waitFor("label:Continue", { timeout: 15000 });

  expect(app.shows(`text:${predictionTitle(right, confidence)}`)).toBe(true);
  expect(app.shows(`text:${predictResultText(p, { prediction: pick, confidence, observed: true })}`)).toBe(true);
  expect(app.shows("label:Alex")).toBe(true);
  if (!right) expect(app.shows(`text:${rightOf(p.choices).text}`)).toBe(true);
  for (const selector of view.after) expect(app.shows(selector)).toBe(true);
  expect(app.shows("label:Continue")).toBe(true);

  await app.press("label:Continue");
  await app.waitFor(`text:done: ${predictResult(p).xp} xp, 0 mistakes`);
}

test("a prediction is tested, revealed and worth its XP without a mistake", async () => {
  const app = await open("../support/harness.tsx", {
    clock: {},
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
    for (const { at, title, activity: predict } of predicts) {
      const wrong = predict.choices.findIndex((c) => !c.right);
      const dragReach = viewport.width / 2 - 10;

      test(
        `${title}: a missed prediction shows the pick, the confidence row, the try-it panel and the result`,
        async () => {
          const app = await openLessonActivity(viewport, at);
          await walkPredict(app, predict, wrong, "Pretty sure", dragReach);
        },
        90000,
      );

      test(
        `${title}: a called prediction shows the result without the right-answer line`,
        async () => {
          const app = await openLessonActivity(viewport, at);
          await walkPredict(app, predict, predict.choices.findIndex((c) => c.right), "Totally sure", dragReach);
        },
        90000,
      );
    }
  });
}
