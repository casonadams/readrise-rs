import { describe, expect, open, test } from "nsh/test";
import { openLessonActivity } from "../support/open";
import type { App } from "nsh/test";
import { statesOfMatter } from "../../src/science/course";
import type { ScienceActivity } from "../../src/science/types";
import { viewports } from "../support/viewports";

type Sort = Extract<ScienceActivity, { kind: "sort" }>;

const sorts = statesOfMatter.lessons.flatMap((lesson, lessonIndex) =>
  lesson.activities.flatMap((activity, activityIndex) =>
    activity.kind === "sort"
      ? [
          {
            title: `${lesson.title}, sort into ${activity.bins.length} bins`,
            lesson: lessonIndex,
            activity: activityIndex,
            sort: activity,
          },
        ]
      : [],
  ),
);

function expectShown(app: App, selectors: readonly string[]): void {
  expect(selectors.filter((s) => !app.shows(s))).toEqual([]);
}


/** A learner asks for the hint, drops the first item in the wrong box, then places every item in its right box. */
async function walkSort(app: App, sort: Sort): Promise<void> {
  const total = sort.items.length;
  await app.waitFor(`text:${sort.prompt}`);
  expectShown(app, [
    "text:Sort it",
    `text:0 of ${total}`,
    `text:${sort.prompt}`,
    `text:${sort.items[0].label}`,
    "text:Drag it to a box, or tap a box",
    ...sort.bins.map((bin) => `label:${bin}`),
    "text:Need a hint?",
  ]);

  await app.press("text:Need a hint?");
  await app.waitFor(`text:${sort.hint}`);
  expectShown(app, ["text:Hint", `text:${sort.hint}`, `text:${sort.items[0].label}`]);

  const wrongBin = (sort.items[0].bin + 1) % sort.bins.length;
  await app.press(`label:${sort.bins[wrongBin]}`);
  await app.waitFor("text:Not quite!");
  expectShown(app, ["text:Not quite!", `text:${sort.hint}`, `text:${sort.items[0].label}`]);

  for (const [n, item] of sort.items.entries()) {
    await app.press(`label:${sort.bins[item.bin]}`);
    await app.waitFor(`text:${item.label}: ${sort.bins[item.bin]}`);
    const next = sort.items[n + 1];
    expectShown(app, [
      `text:${item.label}: ${sort.bins[item.bin]}`,
      `text:${item.why}`,
      ...sort.items.slice(0, n + 1).map((placed) => `text:${placed.label}`),
      ...(next === undefined ? ["text:All sorted!", "label:Continue"] : [`text:${next.label}`]),
    ]);
  }

  await app.press("label:Continue");
  expect(app.texts().some((t) => t.startsWith("done: "))).toBe(true);
}

test("a wrong sort box shows the rule, and finishing reports the result", async () => {
  const app = await open("../support/harness.tsx", {
    clock: {},
    host: { params: { screen: "fixture-activity", activity: "sort" } },
  });
  expect(app.texts()).toContain("Where does each one go?");
  await app.press("text:Liquid");
  expect(app.texts()).toContain("Not quite!");
  expect(app.texts()).toContain("Does it hold its shape?");
  await app.press("text:Solid");
  expect(app.texts()).toContain("Ice: Solid");
  expect(app.texts()).toContain("Ice holds its shape.");
  await app.press("text:Liquid");
  expect(app.texts()).toContain("Juice: Liquid");
  await app.press("text:Continue");
  await app.waitFor("text:done: 15 xp, 1 mistakes");
});

for (const viewport of viewports) {
  describe(viewport.name, () => {
    for (const c of sorts) {
      test(`${c.title}: hint, wrong box and every placed chip stay on screen`, async () => {
        const app = await openLessonActivity(viewport, c.lesson, c.activity);
        await walkSort(app, c.sort);
      }, 60000);
    }
  });
}
