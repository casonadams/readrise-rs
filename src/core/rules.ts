import type { Activity, Choice, ChoiceQuestion, Course, SortActivity } from "./course";

type Kinded = { readonly kind: string };
type CoreActivity = Activity<unknown, unknown, unknown>;

const coreKinds: Readonly<Record<string, true>> = { quiz: true, predict: true, explainer: true, sort: true, whoIsRight: true };

function isCore(activity: Kinded): activity is CoreActivity {
  return coreKinds[activity.kind] === true;
}

function arcIssues(id: string, first: boolean, activities: readonly Kinded[]): string[] {
  const issues: string[] = [];
  const opener = activities[0];
  const warmUp = opener !== undefined && isCore(opener) && opener.kind === "quiz" && opener.role === "warmUp";
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

/** One right choice, no choice twice, and every wrong one says why. */
function choiceIssues(where: string, choices: readonly Choice[]): string[] {
  const issues: string[] = [];
  const rights = choices.filter((c) => c.right).length;
  if (rights !== 1) issues.push(`${where}: has ${rights} right choices, not 1`);
  if (new Set(choices.map((c) => c.text)).size !== choices.length) issues.push(`${where}: repeats a choice`);
  for (const c of choices) {
    if (!c.right && c.feedback.trim() === "") issues.push(`${where}: "${c.text}" does not say why it is wrong`);
  }
  return issues;
}

function questionIssues(q: ChoiceQuestion<unknown>): string[] {
  const issues = choiceIssues(`"${q.prompt}"`, q.choices);
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

/**
 * The lesson design rules of AGENTS.md, for any course: the arc
 * (warm-up, one prediction before the first explainer, "Who's right?" last),
 * one right choice wherever the learner picks, and a reason for every wrong
 * one. Empty when the course follows them.
 */
export function courseIssues(course: Course<Kinded>): string[] {
  const issues: string[] = [];
  const ids = course.lessons.map((l) => l.id);
  if (new Set(ids).size !== ids.length) issues.push(`${course.id}: lesson ids repeat`);
  course.lessons.forEach((lesson, i) => {
    issues.push(...arcIssues(lesson.id, i === 0, lesson.activities));
    for (const a of lesson.activities.filter(isCore)) {
      if (a.kind === "quiz") issues.push(...a.questions.flatMap(questionIssues));
      else if (a.kind === "predict") issues.push(...choiceIssues(`"${a.question}"`, a.choices));
      else if (a.kind === "sort") issues.push(...sortIssues(a));
      else if (a.kind === "whoIsRight") issues.push(...choiceIssues(`"${a.situation}"`, a.claims.map((c) => c.says)));
    }
  });
  return issues;
}
