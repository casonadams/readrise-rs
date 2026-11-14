import {
  type Activity,
  type AnyActivity,
  type Choice,
  type ChoiceQuestion,
  type Course,
  courseQuestions,
  isCoreActivity,
  type SortActivity,
} from "./course";

function arcIssues(id: string, first: boolean, activities: readonly AnyActivity[]): string[] {
  const issues: string[] = [];
  const opener = activities[0];
  const warmUp = opener !== undefined && isCoreActivity(opener) && opener.kind === "quiz" && opener.role === "warmUp";
  if (!first && !warmUp) issues.push(`${id}: does not open with a warm-up`);
  if (first && warmUp) issues.push(`${id}: first lesson has a warm-up`);
  const predicts = activities.flatMap((a, i) => (a.kind === "predict" ? [i] : []));
  if (predicts.length !== 1) issues.push(`${id}: has ${predicts.length} predictions, not 1`);
  const explainer = activities.findIndex((a) => a.kind === "explainer");
  if (predicts.length > 0 && explainer !== -1 && predicts[0] > explainer) {
    issues.push(`${id}: explains before it predicts`);
  }
  if (activities.at(-1)?.kind !== "whoIsRight") issues.push(`${id}: does not end with "Who's right?"`);
  return issues;
}

const positional = /\b(all|both|none|neither) of (the|these)\b/i;

/** One right choice, no choice twice, every wrong one says why, and none that `move` points at the others. */
function choiceIssues(where: string, choices: readonly Choice[], move = true): string[] {
  const issues: string[] = [];
  for (const c of choices.filter((c) => move && positional.test(c.text))) {
    issues.push(`${where}: "${c.text}" points at other choices, which move; reword it or mark the question ordered`);
  }
  const rights = choices.filter((c) => c.right).length;
  if (rights !== 1) issues.push(`${where}: has ${rights} right choices, not 1`);
  if (new Set(choices.map((c) => c.text)).size !== choices.length) issues.push(`${where}: repeats a choice`);
  for (const c of choices) {
    if (!c.right && c.feedback.trim() === "") issues.push(`${where}: "${c.text}" does not say why it is wrong`);
  }
  return issues;
}

function questionIssues(q: ChoiceQuestion<unknown>): string[] {
  const issues = choiceIssues(`"${q.prompt}"`, q.choices, q.ordered !== true);
  if (q.explanation === "") issues.push(`"${q.prompt}": no explanation`);
  if (q.hint === undefined) issues.push(`"${q.prompt}": no hint`);
  if (q.reason !== undefined) issues.push(...choiceIssues(`"${q.prompt}" (why)`, q.reason.choices));
  return issues;
}

function sortIssues(s: SortActivity): string[] {
  const issues: string[] = [];
  if (s.hint === undefined) issues.push(`"${s.prompt}": no hint`);
  for (const item of s.items) {
    if (item.bin < 0 || item.bin >= s.bins.length) issues.push(`"${item.label}": not in a real bin`);
    if (item.why === undefined) issues.push(`"${item.label}": does not say why`);
  }
  if (new Set(s.items.map((i) => i.bin)).size !== s.bins.length) issues.push(`"${s.prompt}": a bin is never used`);
  return issues;
}

/** Ids that appear more than once. */
function repeats<T>(ids: readonly T[]): T[] {
  return [...new Set(ids)].filter((id) => ids.indexOf(id) !== ids.lastIndexOf(id));
}

/** Every activity's own rules: its choices, questions and sort items. */
function activityIssues(a: Activity<unknown, unknown, unknown>): string[] {
  switch (a.kind) {
    case "quiz":
      return a.questions.flatMap(questionIssues);
    case "predict":
      return choiceIssues(`"${a.question}"`, a.choices);
    case "sort":
      return sortIssues(a);
    case "whoIsRight":
      return choiceIssues(`"${a.situation}"`, a.claims.map((c) => c.says));
    case "explainer":
      return [];
  }
}

/** A warm-up may recall only lessons that come before its own. */
function recallIssues(course: Course<AnyActivity>, index: number): string[] {
  const lesson = course.lessons[index];
  const earlier = new Set(course.lessons.slice(0, index).map((l) => l.id));
  const recalls = lesson.activities
    .filter(isCoreActivity)
    .flatMap((a) => (a.kind === "quiz" ? (a.review?.recalls ?? []) : []));
  return recalls
    .filter((id) => !earlier.has(id))
    .map((id) => `${lesson.id}: its warm-up recalls ${id}, which is not an earlier lesson`);
}

/**
 * The lesson design rules of AGENTS.md, for any course: the arc (warm-up, one prediction before the first
 * explainer, "Who's right?" last), warm-ups recalling only earlier lessons, one right choice wherever the learner
 * picks and a reason for every wrong one, and unique lesson and question ids. Empty when the course follows them.
 */
export function courseIssues(course: Course<AnyActivity>): string[] {
  return [
    ...(repeats(course.lessons.map((l) => l.id)).length > 0 ? [`${course.id}: lesson ids repeat`] : []),
    ...repeats(courseQuestions(course).map((q) => q.id)).map((id) => `${course.id}: question id ${id} repeats`),
    ...course.lessons.flatMap((lesson, i) => [
      ...arcIssues(lesson.id, i === 0, lesson.activities),
      ...recallIssues(course, i),
      ...lesson.activities.filter(isCoreActivity).flatMap(activityIssues),
    ]),
  ];
}
