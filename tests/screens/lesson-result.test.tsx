import { describe, expect, open, test } from "nsh/test";

describe("lesson result", () => {
  const result = (outcome: { xp: number; mistakes: number }, next: string | null, streak = 0) =>
    open("../support/harness.tsx", { reducedMotion: true, host: { params: { screen: "result", ...outcome, next, streak } } });

  test("a perfect lesson shows three stars and offers the next lesson", async () => {
    const app = await result({ xp: 45, mistakes: 0 }, "States", 3);
    expect(app.texts()).toContain("Perfect!");
    expect(app.count("label:3 of 3 stars")).toBe(1);
    expect(app.count("label:45 XP earned")).toBe(1);
    expect(app.texts()).toContain("3 day streak");
    await app.press("label:Next: States");
    await app.waitFor("text:next pressed");
    await app.press("text:Back to the path");
    await app.waitFor("text:back pressed");
  });

  test("mistakes lower the stars and the headline", async () => {
    const app = await result({ xp: 20, mistakes: 3 }, null);
    expect(app.texts()).toContain("Nice work!");
    expect(app.count("label:1 of 3 stars")).toBe(1);
    expect(app.count("text:/^Next/")).toBe(0);
    await app.press("label:Back to the path");
    await app.waitFor("text:back pressed");
  });
});
