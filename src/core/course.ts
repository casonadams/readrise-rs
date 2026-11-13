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

/** A school subject. Courses with the same subject share its card and colour. */
export interface Subject {
  readonly id: string;
  readonly title: string;
  readonly emoji: string;
  readonly color: string;
}

export const science: Subject = { id: "science", title: "Science", emoji: "\u{1F52C}", color: "#1976D2" };

/** Why an option is wrong, keyed by its index in the options. */
export type WrongFeedback = Readonly<Record<number, string>>;

export interface Reason {
  readonly prompt?: string;
  readonly options: readonly string[];
  readonly answer: number;
  readonly feedback?: WrongFeedback;
}

export interface ChoiceQuestion<Visual = never> {
  readonly prompt: string;
  readonly options: readonly string[];
  readonly answer: number;
  /** Shown once the question is settled; says why it is right. */
  readonly explanation: string;
  /** A nudge offered on request and after `hintAfterMisses` wrong picks. */
  readonly hint?: string;
  readonly feedback?: WrongFeedback;
  /** Asked once the answer is right, before the explanation. */
  readonly reason?: Reason;
  readonly visual?: Visual;
}

export interface QuizActivity<Visual = never> {
  readonly kind: "quiz";
  readonly role: "warmUp" | "check";
  readonly questions: readonly ChoiceQuestion<Visual>[];
  readonly maxXp?: number;
}

export interface PredictActivity<Experiment> {
  readonly kind: "predict";
  readonly question: string;
  readonly options: readonly string[];
  /** Index of what really happens. */
  readonly answer: number;
  /** What to do in the experiment, e.g. "Pump air into the balloon". */
  readonly tryIt: string;
  readonly experiment: Experiment;
  /** What happened and why, shown after the experiment. */
  readonly outcome: string;
  /** A word to the learner who predicted a wrong option. */
  readonly reactions: WrongFeedback;
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

export interface Claim {
  readonly kid: Kid;
  readonly says: string;
}

export interface WhoIsRightActivity {
  readonly kind: "whoIsRight";
  readonly situation: string;
  readonly claims: readonly Claim[];
  readonly answer: number;
  readonly explanation: string;
  readonly feedback: WrongFeedback;
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
  /** Stored in saved progress: never rename, add a new lesson instead. */
  readonly id: string;
  readonly title: string;
  readonly activities: readonly A[];
}

/** An ordered set of lessons shown as one learning path. */
export interface Course<A = unknown> {
  /** Stable and unique across courses; progress is keyed by it. */
  readonly id: string;
  readonly title: string;
  readonly grade: Grade;
  readonly subject: Subject;
  /** Ids of courses that must be complete before this one opens. */
  readonly requires: readonly string[];
  readonly lessons: readonly Lesson<A>[];
}

export const defaultMaxXp = 20;
export const defaultPredictXp = 5;
export const defaultWhoIsRightXp = 10;
