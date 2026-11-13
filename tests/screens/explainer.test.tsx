import { describe, expect, open, test } from "nsh/test";
import { openLessonActivity } from "../support/open";
import type { App } from "nsh/test";
import { changeName, waterStateAt } from "../../src/science/matter";
import { statesOfMatter } from "../../src/science/course";
import type { ScienceActivity, SceneSpec } from "../../src/science/types";
import { viewports } from "../support/viewports";

const explainers = statesOfMatter.lessons.flatMap((lesson, lessonIndex) =>
  lesson.activities.flatMap((activity: ScienceActivity, index) =>
    activity.kind === "explainer" ? [{ lesson: lessonIndex, activity: index, explainer: activity }] : [],
  ),
);

const states = ["solid", "liquid", "gas"] as const;

/** What the scene shows at `step`, by scene. Pop-in parts are checked once the step has settled. */
async function expectScene(app: App, scene: SceneSpec, step: number): Promise<void> {
  switch (scene.id) {
    case "matter":
      expect(app.shows("text:Matter")).toBe(true);
      expect(app.shows("text:Has mass")).toBe(true);
      expect(app.shows("text:Takes up space")).toBe(true);
      if (step >= 1) for (const thing of ["Rock", "Water", "Air"]) expect(app.shows(`text:${thing}`)).toBe(true);
      if (step >= 2) {
        expect(app.shows("text:Energy")).toBe(true);
        for (const thing of ["Light", "Heat", "Sound"]) expect(app.shows(`text:${thing}`)).toBe(true);
      }
      if (step >= 3) {
        expect(app.shows("text:No mass")).toBe(true);
        expect(app.shows("text:No space")).toBe(true);
      }
      return;
    case "waterMolecule":
      if (step >= 2) {
        expect(app.shows("text:2 hydrogen")).toBe(true);
        expect(app.shows("text:1 oxygen")).toBe(true);
      }
      return;
    case "states":
      if (step === 0 || step === states.length + 1) {
        for (const state of states) expect(app.shows(`label:Particles in a ${state}`)).toBe(true);
        for (const name of ["Solid", "Liquid", "Gas"]) expect(app.shows(`text:${name}`)).toBe(true);
      }
      if (step === states.length + 1) {
        for (const line of ["Packed tight", "Slide past each other", "Fly far apart"]) {
          expect(app.shows(`text:${line}`)).toBe(true);
        }
      }
      if (step >= 1 && step <= states.length) {
        expect(app.shows(`label:Particles in a ${states[step - 1]}`)).toBe(true);
        expect(app.shows("text:Own shape")).toBe(true);
        expect(app.shows("text:Own volume")).toBe(true);
      }
      return;
    case "heat": {
      for (const name of ["Solid", "Liquid", "Gas"]) expect(app.shows(`text:${name}`)).toBe(true);
      expect(app.shows("label:/^Particles in a (solid|liquid|gas)$/")).toBe(true);
      const stage = scene.stages[step];
      const change = changeName(waterStateAt(stage.from), waterStateAt(stage.to));
      if (change !== null) expect(app.shows(`text:${change}`)).toBe(true);
      return;
    }
  }
}

for (const viewport of viewports) {
  describe(viewport.name, () => {
    for (const { lesson, activity, explainer } of explainers) {
      const title = statesOfMatter.lessons[lesson].title;
      test(
        `${title}: "${explainer.title}" shows its caption, scene and buttons at every step`,
        async () => {
          const app = await openLessonActivity(viewport, lesson, activity);
          const last = explainer.steps.length - 1;
          for (let step = 0; step <= last; step++) {
            await app.waitFor(`text:${explainer.steps[step]}`);
            await app.wait(1200);
            expect(app.shows(`text:${explainer.title}`)).toBe(true);
            expect(app.shows(`text:${explainer.steps[step]}`)).toBe(true);
            await expectScene(app, explainer.scene, step);
            if (step === 0) expect(app.count("label:Previous step")).toBe(0);
            else expect(app.shows("label:Previous step")).toBe(true);
            if (step === last) {
              expect(app.shows("label:Continue")).toBe(true);
              await app.press("label:Continue");
              await app.waitFor("text:done: 0 xp, 0 mistakes");
            } else {
              expect(app.shows("label:Next \u2192")).toBe(true);
              await app.press("label:Next \u2192");
            }
          }
        },
        90000,
      );
    }
  });
}

test("an explainer steps forward and back, and Continue finishes with no result", async () => {
  const app = await open("../support/harness.tsx", {
    clock: {},
    host: { params: { screen: "fixture-activity", activity: "explainer" } },
  });
  expect(app.texts()).toContain("Melting");
  expect(app.texts()).toContain("Ice is solid.");
  expect(app.texts()).toContain("Scene melting 0");
  expect(app.count("label:Previous step")).toBe(0);
  await app.press("text:Next \u2192");
  await app.waitFor("text:Heat makes particles move.");
  expect(app.texts()).toContain("Scene melting 1");
  expect(app.count("label:Previous step")).toBe(1);
  await app.press("label:Previous step");
  await app.waitFor("text:Ice is solid.");
  await app.press("text:Next \u2192");
  await app.press("text:Next \u2192");
  await app.waitFor("text:Melting is when ice turns to water.");
  await app.press("text:Continue");
  await app.waitFor("text:done: 0 xp, 0 mistakes");
});
