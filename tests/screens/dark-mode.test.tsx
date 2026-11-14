import { describe, expect, open, test } from "nsh/test";
import type { ColorScheme } from "nsh/test";
import { statesOfMatter } from "../../src/courses/states-of-matter/course";
import { viewports } from "../support/viewports";

const phone = viewports[1];

/** WCAG relative luminance of `#rrggbb` or `#rrggbbaa`: 0 is black, 1 is white. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const heatLab = statesOfMatter.lessons
  .flatMap((lesson, l) => lesson.activities.map((activity, a) => ({ lesson: l, activity: a, kind: activity.kind })))
  .filter((at) => at.kind === "heatLab")
  .map(({ lesson, activity }) => ({ lesson, activity }))[0];

/** Science text drawn by the kit and the course: scene labels, a fact pill, the heat lab's notes. */
const texts = [
  { what: "a scene label", params: { screen: "scene", scene: "matter" }, steps: 1, text: "Rock" },
  { what: "a fact pill", params: { screen: "scene", scene: "waterMolecule" }, steps: 2, text: "2 hydrogen" },
  {
    what: "the heat lab's note",
    params: { screen: "lesson-activity", ...heatLab },
    steps: 0,
    text: "Water freezes below 0\u00B0C and boils at 100\u00B0C.",
  },
];

const schemes: readonly { scheme: ColorScheme; readable: (l: number) => boolean }[] = [
  { scheme: "light", readable: (l) => l < 0.2 },
  { scheme: "dark", readable: (l) => l > 0.5 },
];

describe("science text follows the appearance", () => {
  for (const { scheme, readable } of schemes) {
    for (const { what, params, steps, text } of texts) {
      test(`${what} is readable in ${scheme} mode`, async () => {
        const app = await open("../support/harness.tsx", {
          clock: {},
          width: phone.width,
          height: phone.height,
          reducedMotion: true,
          colorScheme: scheme,
          host: { params },
        });
        for (let step = 0; step < steps; step++) await app.press("label:Next step");
        await app.waitFor(`text:${text}`);
        const color = app.spanStyle(`text:${text}`).color;
        expect({ color, readable: readable(luminance(color)) }).toEqual({ color, readable: true });
      });
    }
  }
});
