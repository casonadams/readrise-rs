export type Grade =
  | "preK"
  | "kindergarten"
  | "grade1"
  | "grade2"
  | "grade3"
  | "grade4"
  | "grade5"
  | "grade6"
  | "grade7"
  | "grade8"
  | "grade9"
  | "grade10"
  | "grade11"
  | "grade12";

declare const idKind: unique symbol;

/**
 * A name stored in learners' saved progress: never rename or remove one, add a new one instead.
 * `ids.lock` and `items.lock` list every one that has shipped; `scripts/locks.ts` checks them.
 */
type Id<Kind extends string> = string & { readonly [idKind]: Kind };

export type CourseId = Id<"course">;
export type LessonId = Id<"lesson">;
/** A question, unique within its course: per-question progress is kept under it. */
export type ItemId = Id<"item">;

export function courseId(id: string): CourseId {
  return id as CourseId;
}

export function lessonId(id: string): LessonId {
  return id as LessonId;
}

export function itemId(id: string): ItemId {
  return id as ItemId;
}

/** A school subject. Courses with the same subject share its card and colour. */
export interface Subject {
  readonly id: string;
  readonly title: string;
  readonly emoji: string;
  readonly color: string;
}

export interface Right {
  readonly right: true;
  readonly text: string;
}

/** A wrong choice always says why it is wrong. */
export interface Wrong {
  readonly right: false;
  readonly text: string;
  readonly feedback: string;
}

/** Something the learner can pick: an option, a reason, a prediction or a classmate's claim. */
export type Choice = Right | Wrong;

export function right(text: string): Right {
  return { right: true, text };
}

export function wrong(text: string, feedback: string): Wrong {
  return { right: false, text, feedback };
}

/** Why `choice` is wrong; nothing for the right one. */
export function feedbackOf(choice: Choice): string | undefined {
  return choice.right ? undefined : choice.feedback;
}

export interface Reason {
  readonly prompt?: string;
  readonly choices: readonly Choice[];
}

export interface ChoiceQuestion<Visual = never> {
  readonly id: ItemId;
  readonly prompt: string;
  readonly choices: readonly Choice[];
  /** A nudge offered on request and after `hintAfterMisses` wrong picks. */
  readonly hint?: string;
  /** Asked once the answer is right, before the explanation. */
  readonly reason?: Reason;
  /** Shown once the question is settled; says why it is right. */
  readonly explanation: string;
  readonly visual?: Visual;
  /**
   * The choices are in an order that means something (numbers, a scale, yes then no), so they never move.
   * Other choices come in a new order on every attempt.
   */
  readonly ordered?: true;
}

/** What a warm-up reviews: the earlier lessons it recalls and the questions it may ask from them. */
export interface Review<Visual = never> {
  readonly recalls: readonly LessonId[];
  readonly pool: readonly ChoiceQuestion<Visual>[];
}

export interface QuizActivity<Visual = never> {
  readonly kind: "quiz";
  readonly role: "warmUp" | "check";
  readonly questions: readonly ChoiceQuestion<Visual>[];
  /**
   * A warm-up asks its own `questions` until the learner has answered as many of `review.pool`; from then on it
   * asks the pool questions the learner finds hardest.
   */
  readonly review?: Review<Visual>;
  readonly maxXp?: number;
}

export interface PredictActivity<Experiment> {
  readonly kind: "predict";
  readonly question: string;
  /** What might happen; the right one is what really happens. A wrong one's feedback is a word to the learner who predicted it. */
  readonly choices: readonly Choice[];
  /** What to do in the experiment, e.g. "Pump air into the balloon". */
  readonly tryIt: string;
  readonly experiment: Experiment;
  /** What happened and why, shown after the experiment. */
  readonly outcome: string;
  readonly xp?: number;
}

export interface ExplainerActivity<Scene> {
  readonly kind: "explainer";
  readonly title: string;
  readonly steps: readonly string[];
  readonly scene: Scene;
}

export interface SortItem {
  readonly label: string;
  /** Index of the bin this item belongs in. */
  readonly bin: number;
  /** Why it belongs there; shown once it is placed. */
  readonly why?: string;
}

export interface SortActivity {
  readonly kind: "sort";
  readonly prompt: string;
  readonly bins: readonly string[];
  readonly items: readonly SortItem[];
  /** The rule that decides the bins, offered on request and after a miss. */
  readonly hint?: string;
  readonly maxXp?: number;
}

export interface Kid {
  readonly name: string;
  readonly skin: string;
  readonly hair: string;
}

/** What a classmate says; a wrong claim's feedback refutes it. */
export interface Claim {
  readonly kid: Kid;
  readonly says: Choice;
}

export interface WhoIsRightActivity {
  readonly kind: "whoIsRight";
  readonly situation: string;
  readonly claims: readonly Claim[];
  readonly explanation: string;
  readonly maxXp?: number;
}

/** The activities every course can use; a course adds its own kinds through `Extra`. */
export type Activity<Experiment, Scene, Visual = never, Extra = never> =
  | QuizActivity<Visual>
  | PredictActivity<Experiment>
  | ExplainerActivity<Scene>
  | SortActivity
  | WhoIsRightActivity
  | Extra;

/** One node on the path: activities the runner plays in order. */
export interface Lesson<A> {
  readonly id: LessonId;
  readonly title: string;
  readonly activities: readonly A[];
}

/** An ordered set of lessons shown as one learning path. */
export interface Course<A = unknown> {
  /** Unique across courses. */
  readonly id: CourseId;
  readonly title: string;
  readonly grade: Grade;
  readonly subject: Subject;
  /** Courses that must be complete before this one opens. */
  readonly requires: readonly CourseId[];
  readonly lessons: readonly Lesson<A>[];
}

/** Any activity, a course's own kinds included: all the runner and the rules need is its kind. */
export type AnyActivity = { readonly kind: string };

const coreKinds: Readonly<Record<string, true>> = { quiz: true, predict: true, explainer: true, sort: true, whoIsRight: true };

/** True for the activities every course can use, false for a course's own kinds. */
export function isCoreActivity(activity: AnyActivity): activity is Activity<unknown, unknown, unknown> {
  return coreKinds[activity.kind] === true;
}

/** Every quiz question of `course`, warm-ups included, in lesson order. */
export function courseQuestions(course: Course<AnyActivity>): ChoiceQuestion<unknown>[] {
  return course.lessons.flatMap((lesson) =>
    lesson.activities.flatMap((a) => (a.kind === "quiz" ? (a as QuizActivity<unknown>).questions : [])),
  );
}

export const defaultMaxXp = 20;
export const defaultPredictXp = 5;
export const defaultWhoIsRightXp = 10;
