import { defaultMaxXp } from "../core/course";
import type { Step } from "../core/scoring";
import { minCelsius, waterStateAt } from "./matter";
import type { HeatLabActivity } from "./types";

export interface HeatLabState {
  readonly celsius: number;
  readonly goal: number;
}

export const heatLabStart: HeatLabState = { celsius: minCelsius, goal: 0 };

export function goalReached(lab: HeatLabActivity, s: HeatLabState): boolean {
  return waterStateAt(s.celsius) === lab.goals[s.goal].target;
}

/** The next goal once the current one is reached; full XP after the last. */
export function advance(lab: HeatLabActivity, s: HeatLabState): Step<HeatLabState> {
  if (!goalReached(lab, s)) return { state: s };
  if (s.goal + 1 === lab.goals.length) return { result: { xp: lab.maxXp ?? defaultMaxXp, mistakes: 0 } };
  return { state: { ...s, goal: s.goal + 1 } };
}
