import { describe, expect, test } from "nsh/test";
import type {
  Activity,
  ChoiceQuestion,
  Course,
  ExplainerActivity,
  Lesson,
  PredictActivity,
  QuizActivity,
  SortActivity,
  WhoIsRightActivity,
} from "./course";
import { courseIssues } from "./rules";

type A = Activity<string, string>;

const question: ChoiceQuestion = { prompt: "W", options: ["a", "b"], answer: 0, explanation: "e", hint: "h", feedback: { 1: "f" } };
const warmUp: QuizActivity = { kind: "quiz", role: "warmUp", questions: [question] };
const predictA: PredictActivity<string> = {
  kind: "predict",
  question: "P",
  options: ["x", "y"],
  answer: 0,
  tryIt: "t",
  experiment: "e",
  outcome: "o",
  reactions: { 1: "r" },
};
const explain: ExplainerActivity<string> = { kind: "explainer", title: "T", steps: ["s"], scene: "scene" };
const sortA: SortActivity = {
  kind: "sort",
  prompt: "S",
  bins: ["b0", "b1"],
  items: [
    { label: "i0", bin: 0, why: "w" },
    { label: "i1", bin: 1, why: "w" },
  ],
  hint: "h",
};
const debate: WhoIsRightActivity = {
  kind: "whoIsRight",
  situation: "D",
  claims: [
    { kid: { name: "Mia", skin: "#000", hair: "#000" }, says: "x" },
    { kid: { name: "Leo", skin: "#000", hair: "#000" }, says: "y" },
  ],
  answer: 0,
  explanation: "e",
  feedback: { 1: "f" },
};

function courseOf(...lessons: A[][]): Course<A> {
  const ls: Lesson<A>[] = lessons.map((activities, i) => ({ id: `l${i}`, title: `L${i}`, activities }));
  return { id: "c", title: "C", grade: "grade6", subject: { id: "s", title: "S", emoji: "", color: "" }, requires: [], lessons: ls };
}

const good = courseOf([predictA, explain, sortA, debate], [warmUp, predictA, explain, sortA, debate]);

test("a course that follows the rules has no issues", () => {
  expect(courseIssues(good)).toEqual([]);
});

describe("finds", () => {
  const withQuestion = (change: Partial<ChoiceQuestion>): QuizActivity => ({ ...warmUp, questions: [{ ...question, ...change }] });
  const cases: [string, Course<A>, string][] = [
    ["a later lesson without a warm-up", courseOf([predictA, explain, debate], [predictA, explain, debate]), "l1: does not open with a warm-up"],
    ["a warm-up in the first lesson", courseOf([warmUp, predictA, explain, debate]), "l0: first lesson has a warm-up"],
    ["two predictions", courseOf([predictA, predictA, explain, debate]), "l0: has 2 predictions, not 1"],
    ["no prediction", courseOf([explain, debate]), "l0: has 0 predictions, not 1"],
    ["explaining before predicting", courseOf([explain, predictA, debate]), "l0: explains before it predicts"],
    ["a lesson not ending in a debate", courseOf([predictA, explain]), `l0: does not end with "Who's right?"`],
    ["a wrong prediction without a reaction", courseOf([{ ...predictA, reactions: {} }, explain, debate]), `"P": no reaction to option 1`],
    ["a reaction to the right prediction", courseOf([{ ...predictA, reactions: { 0: "r", 1: "r" } }, explain, debate]), `"P": reacts to the right prediction`],
    ["a claim left unrefuted", courseOf([predictA, explain, { ...debate, feedback: {} }]), `"D": claim 1 is not refuted`],
    ["a question without a hint", courseOf([predictA, explain, debate], [withQuestion({ hint: undefined }), predictA, explain, debate]), `"W": no hint`],
    ["feedback on the right option", courseOf([predictA, explain, debate], [withQuestion({ feedback: { 0: "f" } }), predictA, explain, debate]), `"W": feedback for option 0`],
    ["a repeated option", courseOf([predictA, explain, debate], [withQuestion({ options: ["a", "a"] }), predictA, explain, debate]), `"W": repeats an option`],
    ["an unexplained wrong reason", courseOf([predictA, explain, debate], [withQuestion({ reason: { options: ["r", "s"], answer: 0 } }), predictA, explain, debate]), `"W": wrong reason 1 is not explained`],
    ["an unused bin", courseOf([predictA, explain, { ...sortA, bins: ["b0", "b1", "b2"] }, debate]), `"S": a bin is never used`],
    ["a sort item that does not say why", courseOf([predictA, explain, { ...sortA, items: [{ label: "i0", bin: 0 }, { label: "i1", bin: 1, why: "w" }] }, debate]), `"i0": does not say why`],
  ];
  for (const [name, course, issue] of cases) {
    test(name, () => {
      expect(courseIssues(course)).toContain(issue);
    });
  }
});
