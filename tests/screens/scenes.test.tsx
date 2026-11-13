import { describe, expect, open, test } from "nsh/test";
import type { App } from "nsh/test";
import { changeName, waterStateAt } from "../../src/science/matter";
import type { SceneSpec } from "../../src/science/types";
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
];

const states = ["solid", "liquid", "gas"] as const;

/** What the scene shows at `step`. Pop-in parts are checked once the step has settled. */
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
      expect(app.shows("label:A water molecule")).toBe(true);
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
