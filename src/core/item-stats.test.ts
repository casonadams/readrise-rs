import { describe, expect, test } from "nsh/test";
import { type ItemId, itemId } from "./course";
import { answered, type ItemStats, pickForReview, topBox } from "./item-stats";
import { seededRandom } from "./random";

describe("a question's stats", () => {
  test("a first-try answer moves it up a box, up to the top one", () => {
    let stats = answered(undefined, true, 1);
    expect(stats).toEqual({ seen: 1, firstTries: 1, box: 1, lastSeen: 1 });
    for (let i = 0; i < 10; i++) stats = answered(stats, true, 2);
    expect(stats.box).toBe(topBox);
  });

  test("any other answer sends it back to the first box", () => {
    const stats = answered(answered(answered(undefined, true, 1), true, 2), false, 3);
    expect(stats).toEqual({ seen: 3, firstTries: 2, box: 0, lastSeen: 3 });
  });
});

describe("picking questions to review", () => {
  const at = (box: number, lastSeen: number): ItemStats => ({ seen: 1, firstTries: 0, box, lastSeen });
  const pool = ["a", "b", "c"].map(itemId);

  test("waits until as many questions as it needs are answered", () => {
    const stats = new Map<ItemId, ItemStats>([[itemId("a"), at(0, 1)]]);
    expect(pickForReview(pool, 2, stats, seededRandom(1))).toBe(null);
  });

  test("breaks ties at random", () => {
    const stats = new Map<ItemId, ItemStats>(pool.map((id) => [id, at(0, 1)]));
    const firsts = new Set(Array.from({ length: 20 }, (_, seed) => pickForReview(pool, 1, stats, seededRandom(seed))?.[0]));
    expect(firsts.size).toBeGreaterThan(1);
  });
});
