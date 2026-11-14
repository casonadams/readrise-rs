import type { ItemId } from "./course";
import { type Random, shuffled } from "./random";

/** A question answered once: right on the first try, or only after a miss or a hint. */
export interface Answer {
  readonly item: ItemId;
  readonly firstTry: boolean;
}

/**
 * How a learner has done on one question. `box` is its Leitner box: a first-try answer moves it up one, any other
 * answer sends it back to 0, so the lowest boxes hold what the learner finds hard.
 */
export interface ItemStats {
  readonly seen: number;
  readonly firstTries: number;
  readonly box: number;
  /** When it was last answered, in milliseconds since 1970. */
  readonly lastSeen: number;
}

export const topBox = 4;

/** The stats of a question after it is answered at `now`; `before` is undefined for its first answer. */
export function answered(before: ItemStats | undefined, firstTry: boolean, now: number): ItemStats {
  return {
    seen: (before?.seen ?? 0) + 1,
    firstTries: (before?.firstTries ?? 0) + (firstTry ? 1 : 0),
    box: firstTry ? Math.min(topBox, (before?.box ?? 0) + 1) : 0,
    lastSeen: now,
  };
}

/**
 * `size` of the `pool` questions to review: the hardest for the learner first (lowest box), then those seen
 * longest ago, ties broken by `random`. Only answered questions count; null while fewer than `size` are answered.
 */
export function pickForReview(
  pool: readonly ItemId[],
  size: number,
  stats: ReadonlyMap<ItemId, ItemStats>,
  random: Random,
): ItemId[] | null {
  const answeredItems = shuffled(
    pool.filter((item) => stats.has(item)),
    random,
  );
  if (answeredItems.length < size) return null;
  const of = (item: ItemId) => stats.get(item) as ItemStats;
  answeredItems.sort((a, b) => of(a).box - of(b).box || of(a).lastSeen - of(b).lastSeen);
  return answeredItems.slice(0, size);
}
