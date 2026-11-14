import { describe, expect, open, test } from "nsh/test";
import type { App } from "nsh/test";
import type { ExperimentId as MixturesExperiment } from "../../src/courses/mixtures-and-solutions/types";
import type { ExperimentId as StatesExperiment } from "../../src/courses/states-of-matter/types";
import type { AnyExperimentId } from "../support/installed";
import { viewports } from "../support/viewports";

const states = "states-of-matter";
const mixtures = "mixtures-and-solutions";

/** An experiment's course, its control (a button pressed `taps` times, or a slider), and what a learner sees of it
 * at rest and once it has reported its result. */
interface ExperimentView {
  readonly course: string;
  readonly control: string;
  readonly taps?: number;
  readonly before: readonly string[];
  readonly after: readonly string[];
}

const statesViews: Record<StatesExperiment, ExperimentView> = {
  balloon: {
    course: states,
    control: "label:Pump",
    taps: 4,
    before: ["label:Pump", "label:Two balloons on a balance scale"],
    after: ["label:Two balloons on a balance scale", "text:Takes up space", "text:Has mass"],
  },
  zoom: {
    course: states,
    control: "label:Zoom",
    before: ["label:Zoom", "label:A jar of air", "label:Particles in a gas"],
    after: ["text:Between particles: nothing at all"],
  },
  heatGas: {
    course: states,
    control: "label:Heat",
    before: ["label:Heat", "label:Particles in a gas", "text:Speed: Slow", "text:Particle size: same"],
    after: ["text:Speed: Fast", "label:Particles in a gas"],
  },
  stove: {
    course: states,
    control: "label:Stove",
    before: ["label:Stove", "label:Particles in a liquid", "text:20\u00B0C"],
    after: ["label:Particles in a gas", "text:The water itself is now a gas"],
  },
  evaporation: {
    course: states,
    control: "label:Time",
    before: ["label:Time", "label:Particles in a gas", "label:Particles in a liquid", "text:In the glass: 30"],
    after: ["text:In the glass: 20", "text:In the air: 10"],
  },
};

const mixturesViews: Record<MixturesExperiment, ExperimentView> = {
  dissolving: {
    course: mixtures,
    control: "label:Stir",
    before: ["label:Stir", "label:Particles in a liquid", "text:Sugar: 12", "text:In the cube: 12"],
    after: ["text:In the cube: 0", "text:Hidden, not gone"],
  },
  meltOrDissolve: {
    course: mixtures,
    control: "label:Time",
    before: ["label:Time", "text:Ice in a warm room", "text:Sugar in water", "text:Only water", "text:Water + sugar"],
    after: ["label:Particles in a liquid", "text:Only water", "text:Water + sugar"],
  },
  mass: {
    course: mixtures,
    control: "label:Stir",
    before: ["label:Stir", "label:Scale reads 110 grams", "label:Particles in a liquid"],
    after: ["label:Scale reads 110 grams", "text:No particle left the glass"],
  },
  spoons: {
    course: mixtures,
    control: "label:Add a spoon",
    taps: 6,
    before: ["label:Add a spoon", "text:Spoons: 0", "text:Dissolved: 0"],
    after: ["text:Spoons: 6", "text:Dissolved: 3", "text:Full: the rest stays at the bottom"],
  },
};

const views: Record<AnyExperimentId, ExperimentView> = { ...statesViews, ...mixturesViews };

const experiments = Object.keys(views) as AnyExperimentId[];
const sliders = experiments.filter((e) => views[e].taps === undefined);

const harness = (experiment: AnyExperimentId, active: boolean) => ({
  host: { params: { screen: "experiment", course: views[experiment].course, experiment, active } },
});

/** Taps the button, or keeps dragging the slider (drags move it relative to where it is) until it has reported. */
async function driveUntilObserved(app: App, experiment: AnyExperimentId, reach: number): Promise<void> {
  const { control, taps } = views[experiment];
  if (taps !== undefined) {
    for (let i = 0; i < taps; i++) await app.press(control);
    return;
  }
  for (let i = 0; i < 12 && app.count("text:Observed 1") === 0; i++) {
    await app.drag(control, { x: reach });
    await app.wait(250);
  }
}

describe("experiments", () => {
  test("the balloon stays inert until active, then reports once after the fourth pump", async () => {
    const idle = await open("../support/harness.tsx", {
      host: { params: { screen: "experiment", experiment: "balloon", active: false } },
      clock: {},
    });
    for (let i = 0; i < 4; i++) await idle.press("label:Pump");
    await idle.wait(2000);
    expect(idle.texts()).toContain("Observed 0");
    expect(idle.count("label:Pump")).toBe(1);

    const app = await open("../support/harness.tsx", {
      host: { params: { screen: "experiment", experiment: "balloon", active: true } },
      clock: {},
    });
    for (let i = 0; i < 3; i++) await app.press("label:Pump");
    await app.wait(2000);
    expect(app.texts()).toContain("Observed 0");
    await app.press("label:Pump");
    await app.wait(1500);
    expect(app.texts()).toContain("Observed 1");
    expect(app.count("label:Pump")).toBe(0);
    await app.wait(2000);
    expect(app.texts()).toContain("Observed 1");
  });

  test("an experiment left while its result settles never reports", async () => {
    const app = await open("../support/harness.tsx", {
      host: { params: { screen: "experiment-leaving", experiment: "balloon" } },
      clock: {},
    });
    for (let i = 0; i < 4; i++) await app.press("label:Pump");
    await app.press("label:Leave");
    await app.wait(3000);
    expect(app.texts()).toContain("Observed 0");
  });

  test("the spoons stay inert until active, then report once after the sixth spoon", async () => {
    const idle = await open("../support/harness.tsx", { ...harness("spoons", false), clock: {} });
    for (let i = 0; i < 6; i++) await idle.press("label:Add a spoon");
    await idle.wait(2000);
    expect(idle.texts()).toContain("Observed 0");
    expect(idle.texts()).toContain("Spoons: 0");

    const app = await open("../support/harness.tsx", { ...harness("spoons", true), clock: {} });
    for (let i = 0; i < 6; i++) await app.press("label:Add a spoon");
    await app.wait(1500);
    expect(app.texts()).toContain("Observed 1");
    expect(app.count("label:Add a spoon")).toBe(0);
  });

  for (const experiment of sliders) {
    const slider = views[experiment].control;
    test(`${experiment} ignores drags until active, then reports once when its result is reached`, async () => {
      const idle = await open("../support/harness.tsx", { ...harness(experiment, false), clock: {} });
      await idle.drag(slider, { x: 400 });
      expect(idle.texts()).toContain("Observed 0");

      const app = await open("../support/harness.tsx", { ...harness(experiment, true), clock: {} });
      await app.drag(slider, { x: -400 });
      expect(app.texts()).toContain("Observed 0");
      await app.drag(slider, { x: 400 });
      expect(app.texts()).toContain("Observed 1");
      await app.drag(slider, { x: -400 });
      await app.drag(slider, { x: 400 });
      expect(app.texts()).toContain("Observed 1");
    });
  }

  test("the stove reports only once the water boils", async () => {
    const app = await open("../support/harness.tsx", {
      host: { params: { screen: "experiment", experiment: "stove", active: true } },
      clock: {},
    });
    expect(app.texts()).toContain("20\u00B0C");
    await app.drag("label:Stove", { x: 60 });
    expect(app.texts()).toContain("Observed 0");
    await app.drag("label:Stove", { x: 400 });
    expect(app.texts()).toContain("Observed 1");
  });
});

for (const viewport of viewports) {
  describe(viewport.name, () => {
    for (const experiment of experiments) {
      test(`${experiment} shows its controls and parts at rest, and its result once observed`, async () => {
        const idle = await open("../support/harness.tsx", {
          clock: {},
          width: viewport.width,
          height: viewport.height,
          reducedMotion: true,
          ...harness(experiment, false),
        });
        for (const selector of views[experiment].before) expect(idle.shows(selector)).toBe(true);
        expect(idle.shows("text:Observed 0")).toBe(true);

        const app = await open("../support/harness.tsx", {
          clock: {},
          width: viewport.width,
          height: viewport.height,
          reducedMotion: true,
          ...harness(experiment, true),
        });
        for (const selector of views[experiment].before) expect(app.shows(selector)).toBe(true);
        await driveUntilObserved(app, experiment, viewport.width / 2 - 10);
        await app.waitFor("text:Observed 1");
        expect(app.shows("text:Observed 1")).toBe(true);
        for (const selector of views[experiment].after) expect(app.shows(selector)).toBe(true);
      }, 60000);
    }
  });
}
