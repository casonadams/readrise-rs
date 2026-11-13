import { expect, open, test } from "nsh/test";

const savedAfterMatter = {
  xp: 30,
  streak: 2,
  lastPractice: "2999-01-01",
  lastLesson: "states-of-matter/matter",
  stars: { "states-of-matter/matter": 2 },
};

test("a new learner can start the first lesson and the rest are locked", async () => {
  const app = await open("../../App.tsx");
  expect(app.texts()).toContain("States of Matter");
  expect(app.texts()).toContain("GRADE 6");
  expect(app.count("label:Matter, start here")).toBe(1);
  expect(app.count("label:States, locked")).toBe(1);
  expect(app.count("label:Changes, locked")).toBe(1);
  expect(app.count("label:0 XP")).toBe(1);
});

test("saved progress shows stars, XP and the streak, and opens the following lesson", async () => {
  const app = await open("../../App.tsx", { storage: { "progress.v1": JSON.stringify(savedAfterMatter) } });
  await app.waitFor("label:30 XP");
  expect(app.count("label:Matter, 2 of 3 stars")).toBe(1);
  expect(app.count("label:States, start here")).toBe(1);
  expect(app.count("label:Heat, locked")).toBe(1);
});

test("a locked lesson says what to finish first", async () => {
  const app = await open("../../App.tsx");
  await app.press("label:Heat, locked");
  await app.waitFor("text:Finish States first.");
});

test("opening a lesson starts at its first step, and leaving before any answer goes straight back", async () => {
  const app = await open("../../App.tsx");
  await app.press("label:Matter, start here");
  await app.waitFor("label:Step 1 of 6");
  await app.press("label:Leave lesson");
  await app.waitFor("label:Matter, start here");
});
