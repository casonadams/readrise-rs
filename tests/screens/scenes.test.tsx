import { describe, expect, open, test } from "nsh/test";
import { type AnySceneSpec, installedScenes } from "../support/installed";
import { expectScene } from "../support/scenes";
import { viewports } from "../support/viewports";

const heatStages = [
  { from: -20, to: 0 },
  { from: 0, to: 100 },
  { from: 100, to: 120 },
];

/** Every scene the installed courses' explainers show, with how many steps it has there. */
const scenes = installedScenes().map((s) => ({ ...s, name: `${s.course}: ${s.scene.id} (${s.steps} steps)` }));

const sceneParams = (course: string, scene: AnySceneSpec, steps: number) => ({ screen: "scene", course, scene, steps });

describe("heat scene", () => {
  test("the heat scene names each change as the water moves through its stages", async () => {
    const heat = { id: "heat" as const, stages: heatStages };
    const app = await open("../support/harness.tsx", {
      host: { params: sceneParams("states-of-matter", heat, heatStages.length) },
      clock: {},
    });
    await app.wait(3000);
    expect(app.texts()).toContain("Melting");
    expect(app.texts()).toContain("0\u00B0C");
    await app.press("label:Next step");
    await app.wait(3000);
    expect(app.texts()).toContain("Boiling");
    expect(app.texts()).toContain("100\u00B0C");
  });
});

describe("scenes", () => {
  for (const { course, name, scene, steps } of scenes) {
    test(`the ${name} scene renders every step`, async () => {
      const app = await open("../support/harness.tsx", { host: { params: sceneParams(course, scene, steps) }, clock: {} });
      expect(app.texts()).toContain("Step 0");
      for (let step = 1; step < steps; step++) {
        await app.press("label:Next step");
        await app.wait(3000);
        expect(app.texts()).toContain(`Step ${step}`);
      }
    });
  }
});

for (const viewport of viewports) {
  describe(viewport.name, () => {
    for (const { course, name, scene, steps } of scenes) {
      test(`the ${name} scene shows its parts at every step`, async () => {
        const app = await open("../support/harness.tsx", {
          clock: {},
          width: viewport.width,
          height: viewport.height,
          reducedMotion: true,
          host: { params: sceneParams(course, scene, steps) },
        });
        await app.waitFor("text:Step 0");
        await app.wait(1200);
        await expectScene(app, scene, 0);
        for (let step = 1; step < steps; step++) {
          await app.press("label:Next step");
          await app.waitFor(`text:Step ${step}`);
          await app.wait(1200);
          await expectScene(app, scene, step);
        }
      }, 90000);
    }
  });
}
