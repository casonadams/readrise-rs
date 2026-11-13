import { context } from "nsh";

/** The colour of the subject being learned: buttons, progress and highlights follow it. */
export const SubjectColor = context("#1976D2");

export type ActivityKind = "warmUp" | "predict" | "sort" | "check" | "whoIsRight";

/** What kind of moment an activity is, so the learner knows whether they are guessing, learning, practising or proving it. */
export const activityKinds: Record<ActivityKind, { label: string; emoji: string; color: string }> = {
  warmUp: { label: "Warm-up", emoji: "\u26A1", color: "#F57C00" },
  predict: { label: "Predict", emoji: "\u{1F914}", color: "#7B1FA2" },
  sort: { label: "Sort it", emoji: "\u{1F5C2}\uFE0F", color: "#00897B" },
  check: { label: "Check", emoji: "\u2705", color: "#1E88E5" },
  whoIsRight: { label: "Who's right?", emoji: "\u{1F4AC}", color: "#D81B60" },
};

export const feedbackColors = { correct: "#2E7D32", wrong: "#C62828", hint: "#F57C00" } as const;

/** `hex` (#RRGGBB) mixed toward black by `amount` (0..1). */
export function darken(hex: string, amount: number): string {
  const channel = (i: number) =>
    Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - amount))
      .toString(16)
      .padStart(2, "0");
  return `#${channel(1)}${channel(3)}${channel(5)}`;
}
