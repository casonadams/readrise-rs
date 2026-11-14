import { describe, expect, test } from "nsh/test";
import {
  type Activity,
  type ChoiceQuestion,
  type Course,
  type ExplainerActivity,
  type Lesson,
  type PredictActivity,
  type QuizActivity,
  right,
  type SortActivity,
  type WhoIsRightActivity,
  wrong,
} from "./course";
import { courseIssues } from "./rules";

type A = Activity<string, string>;

const question: ChoiceQuestion = { prompt: "W", choices: [right("a"), wrong("b", "f")], hint: "h", explanation: "e" };
const warmUp: QuizActivity = { kind: "quiz", role: "warmUp", questions: [question] };
const predictA: PredictActivity<string> = {
  kind: "predict",
  question: "P",
  choices: [right("x"), wrong("y", "r")],
  tryIt: "t",
  experiment: "e",
  outcome: "o",
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
    { kid: { name: "Mia", skin: "#000", hair: "#000" }, says: right("x") },
    { kid: { name: "Leo", skin: "#000", hair: "#000" }, says: wrong("y", "f") },
  ],
  explanation: "e",
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
    ["a prediction with two right choices", courseOf([{ ...predictA, choices: [right("x"), right("y")] }, explain, debate]), `"P": has 2 right choices, not 1`],
    ["a debate where nobody is right", courseOf([predictA, explain, { ...debate, claims: debate.claims.map((c) => ({ ...c, says: wrong(c.says.text, "f") })) }]), `"D": has 0 right choices, not 1`],
    ["a question without a hint", courseOf([predictA, explain, debate], [withQuestion({ hint: undefined }), predictA, explain, debate]), `"W": no hint`],
    ["a question with no right choice", courseOf([predictA, explain, debate], [withQuestion({ choices: [wrong("a", "f"), wrong("b", "f")] }), predictA, explain, debate]), `"W": has 0 right choices, not 1`],
    ["a repeated choice", courseOf([predictA, explain, debate], [withQuestion({ choices: [right("a"), wrong("a", "f")] }), predictA, explain, debate]), `"W": repeats a choice`],
    ["a wrong choice whose feedback is empty", courseOf([predictA, explain, debate], [withQuestion({ choices: [right("a"), wrong("b", " ")] }), predictA, explain, debate]), `"W": "b" does not say why it is wrong`],
    ["a reason with two right choices", courseOf([predictA, explain, debate], [withQuestion({ reason: { choices: [right("r"), right("s")] } }), predictA, explain, debate]), `"W" (why): has 2 right choices, not 1`],
    ["an unused bin", courseOf([predictA, explain, { ...sortA, bins: ["b0", "b1", "b2"] }, debate]), `"S": a bin is never used`],
    ["a sort item that does not say why", courseOf([predictA, explain, { ...sortA, items: [{ label: "i0", bin: 0 }, { label: "i1", bin: 1, why: "w" }] }, debate]), `"i0": does not say why`],
  ];
  for (const [name, course, issue] of cases) {
    test(name, () => {
      expect(courseIssues(course)).toContain(issue);
    });
  }
});
