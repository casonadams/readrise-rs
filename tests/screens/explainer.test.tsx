import { describe, expect, open, test } from "nsh/test";
import { openLessonActivity } from "../support/open";
import { statesOfMatter } from "../../src/courses/states-of-matter/course";
import type { ScienceActivity } from "../../src/courses/states-of-matter/types";
import { expectScene } from "../support/scenes";
import { viewports } from "../support/viewports";

const explainers = statesOfMatter.lessons.flatMap((lesson, lessonIndex) =>
  lesson.activities.flatMap((activity: ScienceActivity, index) =>
    activity.kind === "explainer" ? [{ lesson: lessonIndex, activity: index, explainer: activity }] : [],
  ),
);

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
