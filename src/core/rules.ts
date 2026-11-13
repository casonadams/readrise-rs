import type {
  Activity,
  ChoiceQuestion,
  Course,
  PredictActivity,
  SortActivity,
  WhoIsRightActivity,
  WrongFeedback,
} from "./course";

type Kinded = { readonly kind: string };
type CoreActivity = Activity<unknown, unknown, unknown>;

const coreKinds: Readonly<Record<string, true>> = { quiz: true, predict: true, explainer: true, sort: true, whoIsRight: true };

function isCore(activity: Kinded): activity is CoreActivity {
  return coreKinds[activity.kind] === true;
}

function missingWrong(feedback: WrongFeedback | undefined, count: number, answer: number): number[] {
  const missing: number[] = [];
  for (let i = 0; i < count; i++) if (i !== answer && feedback?.[i] === undefined) missing.push(i);
  return missing;
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

function questionIssues(q: ChoiceQuestion<unknown>): string[] {
  const issues: string[] = [];
  if (new Set(q.options).size !== q.options.length) issues.push(`"${q.prompt}": repeats an option`);
  if (q.answer < 0 || q.answer >= q.options.length) issues.push(`"${q.prompt}": answer is not an option`);
  if (q.explanation === "") issues.push(`"${q.prompt}": no explanation`);
  if (q.hint === undefined) issues.push(`"${q.prompt}": no hint`);
  const keys = Object.keys(q.feedback ?? {}).map(Number);
  if (keys.length === 0) issues.push(`"${q.prompt}": no feedback for wrong options`);
  for (const k of keys) {
    if (k === q.answer || k < 0 || k >= q.options.length) issues.push(`"${q.prompt}": feedback for option ${k}`);
  }
  if (q.reason !== undefined) {
    for (const i of missingWrong(q.reason.feedback, q.reason.options.length, q.reason.answer)) {
      issues.push(`"${q.prompt}": wrong reason ${i} is not explained`);
    }
  }
  return issues;
}

function predictIssues(p: PredictActivity<unknown>): string[] {
  const issues = missingWrong(p.reactions, p.options.length, p.answer).map(
    (i) => `"${p.question}": no reaction to option ${i}`,
  );
  if (p.reactions[p.answer] !== undefined) issues.push(`"${p.question}": reacts to the right prediction`);
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

function whoIsRightIssues(w: WhoIsRightActivity): string[] {
  return missingWrong(w.feedback, w.claims.length, w.answer).map((i) => `"${w.situation}": claim ${i} is not refuted`);
}

/**
 * The lesson design rules of AGENTS.md, for any course: the arc
 * (warm-up, one prediction before the first explainer, "Who's right?" last)
 * and feedback for every wrong choice. Empty when the course follows them.
 */
export function courseIssues(course: Course<Kinded>): string[] {
  const issues: string[] = [];
  const ids = course.lessons.map((l) => l.id);
  if (new Set(ids).size !== ids.length) issues.push(`${course.id}: lesson ids repeat`);
  course.lessons.forEach((lesson, i) => {
    issues.push(...arcIssues(lesson.id, i === 0, lesson.activities));
    for (const a of lesson.activities.filter(isCore)) {
      if (a.kind === "quiz") issues.push(...a.questions.flatMap(questionIssues));
      else if (a.kind === "predict") issues.push(...predictIssues(a));
      else if (a.kind === "sort") issues.push(...sortIssues(a));
      else if (a.kind === "whoIsRight") issues.push(...whoIsRightIssues(a));
    }
  });
  return issues;
}
