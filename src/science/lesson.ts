import type {
  Activity,
  ChoiceQuestion,
  ExplainerActivity,
  Lesson,
  LessonId,
  PredictActivity,
  SortActivity,
  WhoIsRightActivity,
} from "../core/course";

/**
 * A science lesson, one slot per step of the lesson arc (AGENTS.md), so it cannot be written out of order.
 * `E`, `S` and `V` are the course's experiments, scenes and quiz pictures; `X` its own practice activities.
 */
export interface ScienceLessonParts<E, S, V, X> {
  readonly id: LessonId;
  readonly title: string;
  /** Questions on earlier lessons; the first lesson of a course has none. */
  readonly warmUp?: readonly ChoiceQuestion<V>[];
  readonly predict: Omit<PredictActivity<E>, "kind">;
  readonly explain: readonly [Omit<ExplainerActivity<S>, "kind">, ...Omit<ExplainerActivity<S>, "kind">[]];
  readonly practise: SortActivity | X;
  /** Two-tier questions: give the key ones a `reason`. */
  readonly check: readonly ChoiceQuestion<V>[];
  readonly debate: Omit<WhoIsRightActivity, "kind">;
}

export function scienceLesson<E, S, V, X>(parts: ScienceLessonParts<E, S, V, X>): Lesson<Activity<E, S, V, X>> {
  const warmUp: Activity<E, S, V, X>[] =
    parts.warmUp === undefined ? [] : [{ kind: "quiz", role: "warmUp", questions: parts.warmUp }];
  return {
    id: parts.id,
    title: parts.title,
    activities: [
      ...warmUp,
      { kind: "predict", ...parts.predict },
      ...parts.explain.map((e): Activity<E, S, V, X> => ({ kind: "explainer", ...e })),
      parts.practise,
      { kind: "quiz", role: "check", questions: parts.check },
      { kind: "whoIsRight", ...parts.debate },
    ],
  };
}
