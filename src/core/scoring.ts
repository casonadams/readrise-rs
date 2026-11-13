/** What an activity reports when the learner finishes it. */
export interface ActivityResult {
  readonly xp: number;
  readonly mistakes: number;
}

/** An activity either goes on with a new state or finishes with its result. */
export type Step<S> = { readonly state: S } | { readonly result: ActivityResult };

export const noResult: ActivityResult = { xp: 0, mistakes: 0 };

/** XP for an activity worth `max`: a first-try answer counts fully, one recovered after a miss counts half. */
export function scoreXp(firstTry: number, recovered: number, total: number, max: number): number {
  return Math.round((max * (firstTry + recovered * 0.5)) / total);
}

/** Stars are the engine's: activities report mistakes, never stars. */
export function starsFor(mistakes: number): 1 | 2 | 3 {
  if (mistakes === 0) return 3;
  return mistakes <= 2 ? 2 : 1;
}

export function lessonOutcome(results: readonly ActivityResult[]): ActivityResult {
  return results.reduce((sum, r) => ({ xp: sum.xp + r.xp, mistakes: sum.mistakes + r.mistakes }), noResult);
}
