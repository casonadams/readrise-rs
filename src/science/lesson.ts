import {
  type Activity,
  type AnyActivity,
  type ChoiceQuestion,
  type ExplainerActivity,
  isCoreActivity,
  type Lesson,
  type LessonId,
  type PredictActivity,
  type Review,
  type SortActivity,
  type WhoIsRightActivity,
} from "../core/course";

/**
 * A science lesson, one slot per step of the lesson arc (AGENTS.md), so it cannot be written out of order.
 * `E`, `S` and `V` are the course's experiments, scenes and quiz pictures; `X` its own practice activities.
 */
export interface ScienceLessonParts<E, S, V, X extends AnyActivity> {
  readonly id: LessonId;
  readonly title: string;
  /**
   * Questions on the earlier lessons it `recalls`; the first lesson of a course has none. Once the learner has
   * answered enough of those lessons' check questions, it reviews the ones they find hardest instead.
   */
  readonly warmUp?: {
    readonly questions: readonly ChoiceQuestion<V>[];
    readonly recalls: readonly Lesson<Activity<E, S, V, X>>[];
  };
  readonly predict: Omit<PredictActivity<E>, "kind">;
  readonly explain: readonly [Omit<ExplainerActivity<S>, "kind">, ...Omit<ExplainerActivity<S>, "kind">[]];
  readonly practise: SortActivity | X;
  /** Two-tier questions: give the key ones a `reason`. */
  readonly check: readonly ChoiceQuestion<V>[];
  readonly debate: Omit<WhoIsRightActivity, "kind">;
}

function review<E, S, V, X extends AnyActivity>(recalls: readonly Lesson<Activity<E, S, V, X>>[]): Review<V> {
  return {
    recalls: recalls.map((l) => l.id),
    pool: recalls.flatMap((l) =>
      l.activities.flatMap((a) => (isCoreActivity(a) && a.kind === "quiz" && a.role === "check" ? a.questions : [])),
    ),
  };
}

export function scienceLesson<E, S, V, X extends AnyActivity>(parts: ScienceLessonParts<E, S, V, X>): Lesson<Activity<E, S, V, X>> {
  const warmUp: Activity<E, S, V, X>[] =
    parts.warmUp === undefined
      ? []
      : [{ kind: "quiz", role: "warmUp", questions: parts.warmUp.questions, review: review(parts.warmUp.recalls) }];
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
