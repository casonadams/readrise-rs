import { describe, expect, open, test } from "nsh/test";
import { openLessonActivity } from "../support/open";
import type { App } from "nsh/test";
import { statesOfMatter } from "../../src/science/course";
import type { ScienceActivity } from "../../src/science/types";
import { viewports } from "../support/viewports";

type WhoIsRight = Extract<ScienceActivity, { kind: "whoIsRight" }>;

const whoCases = statesOfMatter.lessons.flatMap((lesson, lessonIndex) =>
  lesson.activities.flatMap((activity, activityIndex) =>
    activity.kind === "whoIsRight"
      ? [{ title: `${lesson.title}, who is right`, lesson: lessonIndex, activity: activityIndex, who: activity }]
      : [],
  ),
);

const wrongFallback = "Think about what the particles are doing.";

function expectShown(app: App, selectors: readonly string[]): void {
  expect(selectors.filter((s) => !app.shows(s))).toEqual([]);
}


/** One claim tile: its label carries the verdict once a claim is marked. */
function claimLabel(who: WhoIsRight, i: number, verdict: "open" | "wrong" | "right" | "dimmed"): string {
  const claim = who.claims[i];
  const suffix = verdict === "wrong" ? ", wrong" : verdict === "right" ? ", right" : "";
  return `label:${claim.kid.name}: ${claim.says}${suffix}`;
}

/** A learner tries every wrong classmate first, then picks the one who is right. */
async function walkWhoIsRight(app: App, who: WhoIsRight): Promise<void> {
  await app.waitFor(`text:${who.situation}`);
  const names = who.claims.map((claim) => `text:${claim.kid.name}`);
  expectShown(app, [
    `text:${who.situation}`,
    "text:Tap the one who is right.",
    ...names,
    ...who.claims.map((_, i) => claimLabel(who, i, "open")),
  ]);

  const wrong: number[] = [];
  for (const i of who.claims.map((_, n) => n).filter((n) => n !== who.answer)) {
    await app.press(claimLabel(who, i, "open"));
    wrong.push(i);
    await app.waitFor(claimLabel(who, i, "wrong"));
    const name = who.claims[i].kid.name;
    expectShown(app, [
      ...names,
      ...who.claims.map((_, n) => claimLabel(who, n, wrong.includes(n) ? "wrong" : "open")),
      `text:Not ${name}`,
      `text:${who.feedback[i] ?? wrongFallback}`,
    ]);
  }

  await app.press(claimLabel(who, who.answer, "open"));
  await app.waitFor(claimLabel(who, who.answer, "right"));
  const right = who.claims[who.answer].kid.name;
  expectShown(app, [
    ...names,
    ...who.claims.map((_, n) => {
      if (n === who.answer) return claimLabel(who, n, "right");
      return claimLabel(who, n, wrong.includes(n) ? "wrong" : "dimmed");
    }),
    `text:Yes! ${right} is right.`,
    `text:${who.explanation}`,
    "label:Continue",
  ]);
  await app.press("label:Continue");
  expect(app.texts().some((t) => t.startsWith("done: "))).toBe(true);
}

test("a wrong claim names its speaker and explains the flaw", async () => {
  const app = await open("../support/harness.tsx", {
    clock: {},
    host: { params: { screen: "fixture-activity", activity: "whoIsRight" } },
  });
  await app.press("label:Maya: No, it has no particles.");
  expect(app.texts()).toContain("Not Maya");
  expect(app.texts()).toContain("Ice still has particles.");
  await app.press("label:Leo: Yes, they are still there but slow.");
  await app.waitFor("text:Yes! Leo is right.");
  expect(app.texts()).toContain("Particles keep moving, just slowly.");
  await app.press("text:Continue");
  await app.waitFor("text:done: 5 xp, 1 mistakes");
});

for (const viewport of viewports) {
  describe(viewport.name, () => {
    for (const c of whoCases) {
      test(`${c.title}: every claim, every wrong reply and the right answer stay on screen`, async () => {
        const app = await openLessonActivity(viewport, c.lesson, c.activity);
        await walkWhoIsRight(app, c.who);
      }, 60000);
    }
  });
}
