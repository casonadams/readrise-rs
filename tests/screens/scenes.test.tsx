import { describe, expect, open, test } from "nsh/test";
import type { SceneSpec } from "../../src/courses/states-of-matter/types";
import { expectScene } from "../support/scenes";
import { viewports } from "../support/viewports";

const heatStages = [
  { from: -20, to: 0 },
  { from: 0, to: 100 },
  { from: 100, to: 120 },
];

/** Each scene the harness mounts, with its last step (the harness clamps "Next step" there). */
const scenes: readonly { readonly name: string; readonly spec: SceneSpec; readonly last: number }[] = [
  { name: "matter", spec: { id: "matter" }, last: 3 },
  { name: "waterMolecule", spec: { id: "waterMolecule" }, last: 4 },
  { name: "states", spec: { id: "states" }, last: 4 },
  { name: "heat", spec: { id: "heat", stages: heatStages }, last: heatStages.length - 1 },
  { name: "evaporation", spec: { id: "evaporation" }, last: 3 },
];

describe("heat scene", () => {
  test("the heat scene names each change as the water moves through its stages", async () => {
    const app = await open("../support/harness.tsx", { host: { params: { screen: "scene", scene: "heat" } }, clock: {} });
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
  const ported: [string, number][] = [
    ["matter", 3],
    ["waterMolecule", 4],
    ["states", 4],
    ["heat", 2],
    ["evaporation", 3],
  ];
  for (const [scene, last] of ported) {
    test(`the ${scene} scene renders every step`, async () => {
      const app = await open("../support/harness.tsx", { host: { params: { screen: "scene", scene } }, clock: {} });
      expect(app.texts()).toContain("Step 0");
      for (let step = 1; step <= last; step++) {
        await app.press("label:Next step");
        await app.wait(3000);
        expect(app.texts()).toContain(`Step ${step}`);
      }
    });
  }
});

for (const viewport of viewports) {
  describe(viewport.name, () => {
    for (const { name, spec, last } of scenes) {
      test(`the ${name} scene shows its parts at every step`, async () => {
        const app = await open("../support/harness.tsx", {
          clock: {},
          width: viewport.width,
          height: viewport.height,
          reducedMotion: true,
          host: { params: { screen: "scene", scene: name } },
        });
        await app.waitFor("text:Step 0");
        await app.wait(1200);
        await expectScene(app, spec, 0);
        for (let step = 1; step <= last; step++) {
          await app.press("label:Next step");
          await app.waitFor(`text:Step ${step}`);
          await app.wait(1200);
          await expectScene(app, spec, step);
        }
      }, 90000);
    }
  });
}
