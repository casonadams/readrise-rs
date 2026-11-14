import { type AnyActivity, type ChoiceQuestion, isCoreActivity, type ItemId, type Lesson, type QuizActivity } from "./course";
import { type ItemStats, pickForReview } from "./item-stats";
import { type Random, seededRandom, shuffled } from "./random";

function arrangeQuestion<V>(q: ChoiceQuestion<V>, random: Random): ChoiceQuestion<V> {
  const reason = q.reason === undefined ? undefined : { ...q.reason, choices: shuffled(q.reason.choices, random) };
  return { ...q, choices: q.ordered ? q.choices : shuffled(q.choices, random), reason };
}

/** A warm-up's questions: the pool questions the learner finds hardest once enough are answered, else its own. */
function questionsToAsk<V>(quiz: QuizActivity<V>, stats: ReadonlyMap<ItemId, ItemStats>, random: Random) {
  const pool = quiz.review?.pool ?? [];
  const picked = pickForReview(
    pool.map((q) => q.id),
    quiz.questions.length,
    stats,
    random,
  );
  return picked === null ? quiz.questions : picked.map((id) => pool.find((q) => q.id === id) as ChoiceQuestion<V>);
}

function arrange<A extends AnyActivity>(activity: A, random: Random, stats: ReadonlyMap<ItemId, ItemStats>): A {
  if (!isCoreActivity(activity)) return activity;
  const a = activity;
  switch (a.kind) {
    case "quiz": {
      const questions = questionsToAsk(a, stats, random);
      return { ...a, questions: shuffled(questions, random).map((q) => arrangeQuestion(q, random)) } as A;
    }
    case "predict":
      return { ...a, choices: shuffled(a.choices, random) } as A;
    case "sort":
      return { ...a, items: shuffled(a.items, random) } as A;
    case "whoIsRight":
      return { ...a, claims: shuffled(a.claims, random) } as A;
    case "explainer":
      return activity;
  }
}

/**
 * The activities of one attempt at `lesson`, in the lesson's order: questions, choices, sort items and claims
 * come in a new order for each `seed`, and a warm-up reviews what `stats` show the learner finds hardest. Each
 * activity gets its own random, so one activity's choices never move another's.
 */
export function attemptActivities<A extends AnyActivity>(
  lesson: Lesson<A>,
  seed: number,
  stats: ReadonlyMap<ItemId, ItemStats>,
): A[] {
  const seeds = seededRandom(seed);
  return lesson.activities.map((activity) => arrange(activity, seededRandom(Math.floor(seeds() * 2 ** 32)), stats));
}
