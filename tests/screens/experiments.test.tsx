import { describe, expect, open, test } from "nsh/test";
import type { App } from "nsh/test";
import type { ExperimentId } from "../../src/science/types";
import { viewports } from "../support/viewports";

const experiments: readonly ExperimentId[] = ["balloon", "zoom", "heatGas", "stove"];

/** What a learner sees of each experiment at rest, and once it has reported its result. */
const views: Record<ExperimentId, { readonly before: readonly string[]; readonly after: readonly string[] }> = {
  balloon: {
    before: ["label:Pump", "label:Two balloons on a balance scale"],
    after: ["label:Two balloons on a balance scale", "text:Takes up space", "text:Has mass"],
  },
  zoom: {
    before: ["label:Zoom", "label:A jar of air", "label:Particles in a gas"],
    after: ["text:Between particles: nothing at all"],
  },
  heatGas: {
    before: ["label:Heat", "label:Particles in a gas", "text:Speed: Slow", "text:Particle size: same"],
    after: ["text:Speed: Fast", "label:Particles in a gas"],
  },
  stove: {
    before: ["label:Stove", "label:Particles in a liquid", "text:20\u00B0C"],
    after: ["label:Particles in a gas", "text:The water itself is now a gas"],
  },
};

/** Slider drags move the value relative to where it is, so keep stepping until the experiment has reported. */
async function driveUntilObserved(app: App, experiment: ExperimentId, reach: number): Promise<void> {
  const observed = () => app.count("text:Observed 1") > 0;
  if (experiment === "balloon") {
    for (let i = 0; i < 4; i++) await app.press("label:Pump");
    return;
  }
  const slider = { zoom: "label:Zoom", heatGas: "label:Heat", stove: "label:Stove" }[experiment];
  for (let i = 0; i < 12 && !observed(); i++) {
    await app.drag(slider, { x: reach });
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

  const sliders: [string, string][] = [
    ["zoom", "label:Zoom"],
    ["heatGas", "label:Heat"],
    ["stove", "label:Stove"],
  ];
  for (const [experiment, slider] of sliders) {
    test(`${experiment} ignores drags until active, then reports once when its result is reached`, async () => {
      const idle = await open("../support/harness.tsx", {
        host: { params: { screen: "experiment", experiment, active: false } },
        clock: {},
      });
      await idle.drag(slider, { x: 400 });
      expect(idle.texts()).toContain("Observed 0");

      const app = await open("../support/harness.tsx", {
        host: { params: { screen: "experiment", experiment, active: true } },
        clock: {},
      });
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
          width: viewport.width,
          height: viewport.height,
          reducedMotion: true,
          host: { params: { screen: "experiment", experiment, active: false } },
        });
        for (const selector of views[experiment].before) expect(idle.shows(selector)).toBe(true);
        expect(idle.shows("text:Observed 0")).toBe(true);

        const app = await open("../support/harness.tsx", {
          width: viewport.width,
          height: viewport.height,
          reducedMotion: true,
          host: { params: { screen: "experiment", experiment, active: true } },
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
