import { type AnyActivity, type ChoiceQuestion, isCoreActivity, type Lesson } from "./course";
import { type Random, seededRandom, shuffled } from "./random";

function arrangeQuestion<V>(q: ChoiceQuestion<V>, random: Random): ChoiceQuestion<V> {
  const reason = q.reason === undefined ? undefined : { ...q.reason, choices: shuffled(q.reason.choices, random) };
  return { ...q, choices: q.ordered ? q.choices : shuffled(q.choices, random), reason };
}

function arrange<A extends AnyActivity>(activity: A, random: Random): A {
  if (!isCoreActivity(activity)) return activity;
  const a = activity;
  switch (a.kind) {
    case "quiz":
      return { ...a, questions: shuffled(a.questions, random).map((q) => arrangeQuestion(q, random)) } as A;
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
 * come in a new order for each `seed`. Each activity gets its own random, so one activity's choices never move
 * another's.
 */
export function attemptActivities<A extends AnyActivity>(lesson: Lesson<A>, seed: number): A[] {
  const seeds = seededRandom(seed);
  return lesson.activities.map((activity) => arrange(activity, seededRandom(Math.floor(seeds() * 2 ** 32))));
}
