import { expect } from "nsh/test";
import type { App } from "nsh/test";
import type { SceneSpec as MixturesScene } from "../../src/courses/mixtures-and-solutions/types";
import type { AnySceneSpec } from "./installed";
import { changeName, waterStateAt } from "../../src/science/matter";

const states = ["solid", "liquid", "gas"] as const;

/** What `scene` shows at `step`. Pop-in parts are checked once the step has settled. */
export async function expectScene(app: App, scene: AnySceneSpec, step: number): Promise<void> {
  if (scene.id === "dissolving" || scene.id === "meltOrDissolve" || scene.id === "mass" || scene.id === "spoons") {
    return expectMixturesScene(app, scene);
  }
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
    case "evaporation":
      for (const part of ["label:Particles in a gas", "label:Particles in a liquid"]) expect(app.shows(part)).toBe(true);
      expect(app.shows("text:/^In the glass: \\d+$/")).toBe(true);
      expect(app.shows("text:/^In the air: \\d+$/")).toBe(true);
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

function expectMixturesScene(app: App, scene: MixturesScene): void {
  switch (scene.id) {
    case "dissolving":
      expect(app.shows("text:Sugar: 12")).toBe(true);
      expect(app.shows("text:/^In the cube: \\d+$/")).toBe(true);
      return;
    case "meltOrDissolve":
      for (const text of ["Ice in a warm room", "Sugar in water", "Only water", "Water + sugar"]) {
        expect(app.shows(`text:${text}`)).toBe(true);
      }
      return;
    case "mass":
      expect(app.shows("label:Scale reads 110 grams")).toBe(true);
      return;
    case "spoons":
      expect(app.shows("text:/^Spoons: \\d+$/")).toBe(true);
      expect(app.shows("text:/^Dissolved: \\d+$/")).toBe(true);
      return;
  }
}
