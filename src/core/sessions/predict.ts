import { defaultPredictXp, type PredictActivity } from "../course";
import type { ActivityResult } from "../scoring";

/** How sure the learner is, asked before the reveal: confident errors are corrected best by feedback. */
export const confidences = ["Just guessing", "Pretty sure", "Totally sure"] as const;
export type Confidence = (typeof confidences)[number];

export interface PredictState {
  readonly prediction: number | null;
  readonly confidence: Confidence | null;
  readonly observed: boolean;
}

export const predictStart: PredictState = { prediction: null, confidence: null, observed: false };

/** The experiment runs once a prediction is committed and until its result is observed. */
export function isTesting(s: PredictState): boolean {
  return s.confidence !== null && !s.observed;
}

export function predict(s: PredictState, option: number): PredictState {
  return s.confidence === null ? { ...s, prediction: option } : s;
}

export function commit(s: PredictState, confidence: Confidence): PredictState {
  return s.prediction !== null && s.confidence === null ? { ...s, confidence } : s;
}

export function observe(s: PredictState): PredictState {
  return isTesting(s) ? { ...s, observed: true } : s;
}

/** The reaction to the learner's prediction, then what really happens. */
export function predictResultText(activity: PredictActivity<unknown>, s: PredictState): string {
  const reaction = s.prediction === null ? undefined : activity.reactions[s.prediction];
  return reaction === undefined ? activity.outcome : `${reaction} ${activity.outcome}`;
}

/** Predictions are never marked as mistakes. */
export function predictResult(activity: PredictActivity<unknown>): ActivityResult {
  return { xp: activity.xp ?? defaultPredictXp, mistakes: 0 };
}
