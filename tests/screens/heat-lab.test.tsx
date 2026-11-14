import { describe, expect, open, test } from "nsh/test";
import { activitiesOf } from "../support/installed";
import { openLessonActivity } from "../support/open";
import type { App } from "nsh/test";
import type { HeatLabActivity } from "../../src/courses/states-of-matter/types";
import { viewports } from "../support/viewports";
import { goalButton, reachState } from "../support/heat-lab";

const heatLabs = activitiesOf<HeatLabActivity>("heatLab");

/** The readout line: "<n>°C  •  <state>". */
function readout(app: App): string {
  const line = app.texts().find((t) => t.includes("\u2022"));
  if (line === undefined) throw new Error("no readout on screen");
  return line;
}

test("a drag to liquid water shows the goal button; finishing every goal reports full XP", async () => {
  const app = await open("../support/harness.tsx", { host: { params: { screen: "heat-lab" } }, clock: {} });
  expect(app.texts()).toContain("Goal 1 of 2");
  expect(app.texts()).toContain("-20\u00B0C  \u2022  Solid");
  expect(app.count("label:Goal reached! Next goal")).toBe(0);

  await app.drag("label:Water temperature", { x: 60 });
  expect(readout(app)).toMatch(/^-?\d+\u00B0C  \u2022  Liquid$/);
  await app.press("label:Goal reached! Next goal");
  expect(app.texts()).toContain("Goal 2 of 2");
  expect(app.count("label:Goal reached! Next goal")).toBe(0);

  await app.drag("label:Water temperature", { x: 300 });
  expect(app.texts()).toContain("120\u00B0C  \u2022  Gas");
  await app.press("label:Finish");
  expect(app.texts()).toContain("Result 20");
});

for (const viewport of viewports) {
  describe(viewport.name, () => {
    for (const { at, title, activity: lab } of heatLabs) {
      test(
        `${title}: every goal shows its prompt, readout, slider, particles and goal button`,
        async () => {
          const app = await openLessonActivity(viewport, at);
          const reach = viewport.width / 2 - 10;
          const total = lab.goals.length;
          for (const [i, goal] of lab.goals.entries()) {
            await app.waitFor(`text:Goal ${i + 1} of ${total}`);
            expect(app.shows(`text:Goal ${i + 1} of ${total}`)).toBe(true);
            expect(app.shows(`text:${goal.prompt}`)).toBe(true);
            expect(app.shows(`text:${readout(app)}`)).toBe(true);
            expect(app.shows("label:Water temperature")).toBe(true);
            expect(app.shows("label:/^Particles in a (solid|liquid|gas)$/")).toBe(true);
            expect(app.shows("text:Water freezes below 0\u00B0C and boils at 100\u00B0C.")).toBe(true);
            expect(app.count(goalButton)).toBe(0);

            await reachState(app, goal.target, reach);
            const next = i + 1 === total ? "Finish" : "Goal reached! Next goal";
            expect(app.shows(`label:${next}`)).toBe(true);
            await app.press(`label:${next}`);
          }
          expect(app.count("label:Water temperature")).toBe(0);
        },
        90000,
      );
    }
  });
}
