import { describe, expect, open, test } from "nsh/test";

describe("lesson runner", () => {
  test("plays the activities in order and finishes with their summed result", async () => {
    const app = await open("../support/harness.tsx", { clock: {}, host: { params: { screen: "runner" } } });
    await app.waitFor("label:Step 1 of 3");
    await app.press("text:Finish One");
    await app.waitFor("label:Step 2 of 3");
    await app.press("text:Finish Two");
    await app.press("text:Finish Three");
    await app.waitFor("text:finished: 35 xp, 1 mistakes");
  });

  test("leaves at once from the first activity", async () => {
    const app = await open("../support/harness.tsx", { clock: {}, host: { params: { screen: "runner" } } });
    await app.press("label:Leave lesson");
    await app.waitFor("text:left");
    expect(app.dialogs()).toEqual([]);
  });

  test("asks before leaving once an activity is done, and stays when told to keep going", async () => {
    const app = await open("../support/harness.tsx", { clock: {}, host: { params: { screen: "runner" } } });
    await app.press("text:Finish One");
    app.onDialog(() => "Keep going");
    await app.press("label:Leave lesson");
    expect(app.dialogs()).toHaveLength(1);
    expect(app.texts()).toContain("running");
    app.onDialog(() => "Leave");
    await app.press("label:Leave lesson");
    await app.waitFor("text:left");
  });
});
