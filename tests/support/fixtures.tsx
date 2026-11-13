import { Text, View } from "nsh";
import type {
  ExplainerActivity,
  Lesson,
  PredictActivity,
  QuizActivity,
  SortActivity,
  WhoIsRightActivity,
} from "../../src/core/course";
import type { ActivityResult } from "../../src/core/scoring";
import type { ExperimentId, HeatLabActivity, HeatStage, SceneSpec } from "../../src/science/types";
import type { RenderExperiment, RenderScene } from "../../src/ui/activities/types";

export const quiz: QuizActivity = {
  kind: "quiz",
  role: "check",
  questions: [
    {
      prompt: "Which one keeps its shape?",
      options: ["Steam", "Ice", "Water"],
      answer: 1,
      explanation: "Ice keeps its shape.",
      hint: "Think about a cube in your freezer.",
      feedback: { 0: "Steam is a gas, not a solid." },
    },
    { prompt: "Which one flows?", options: ["Rock", "Water"], answer: 1, explanation: "Water flows." },
  ],
};

export const quizReason: QuizActivity = {
  kind: "quiz",
  role: "check",
  questions: [
    {
      prompt: "Is ice a solid?",
      options: ["Yes", "No"],
      answer: 0,
      explanation: "Ice is a solid.",
      reason: {
        options: ["It is cold.", "Its particles are packed close and stay put."],
        answer: 1,
        feedback: { 0: "Cold alone does not make a solid." },
      },
    },
  ],
};

export const sort: SortActivity = {
  kind: "sort",
  prompt: "Where does each one go?",
  bins: ["Solid", "Liquid"],
  items: [
    { label: "Ice", bin: 0, why: "Ice holds its shape." },
    { label: "Juice", bin: 1, why: "Juice flows." },
  ],
  hint: "Does it hold its shape?",
};

export const whoIsRight: WhoIsRightActivity = {
  kind: "whoIsRight",
  situation: "Ice is in a freezer. Does it still have particles?",
  claims: [
    { kid: { name: "Maya", skin: "#F1C27D", hair: "#3E2723" }, says: "No, it has no particles." },
    { kid: { name: "Leo", skin: "#8D5524", hair: "#111111" }, says: "Yes, they are still there but slow." },
  ],
  answer: 1,
  explanation: "Particles keep moving, just slowly.",
  feedback: { 0: "Ice still has particles." },
};

export const predict: PredictActivity<string> = {
  kind: "predict",
  question: "What happens to a balloon in cold water?",
  options: ["It shrinks", "It grows", "Nothing"],
  answer: 0,
  tryIt: "Put the balloon in cold water",
  experiment: "cold",
  outcome: "Cold air takes up less room.",
  reactions: { 1: "Good thinking about air." },
};

export const explainer: ExplainerActivity<string> = {
  kind: "explainer",
  title: "Melting",
  steps: ["Ice is solid.", "Heat makes particles move.", "Melting is when ice turns to water."],
  scene: "melting",
};

/** A stand-in experiment: one button that reports an observation once the experiment is active. */
export const renderFakeExperiment: RenderExperiment<string> = (experiment, props) => (
  <View class="flex-1 items-center justify-center">
    <Text
      role="button"
      onPress={() => {
        if (props.active) props.onObserved();
      }}
    >
      {`Run it (${experiment})`}
    </Text>
  </View>
);

export const renderFakeScene: RenderScene<string> = (scene, step) => (
  <View class="flex-1 items-center justify-center">
    <Text>{`Scene ${scene} ${step()}`}</Text>
  </View>
);

export const heatLab: HeatLabActivity = {
  kind: "heatLab",
  goals: [
    { prompt: "Melt the ice.", target: "liquid" },
    { prompt: "Boil the water.", target: "gas" },
  ],
};

const heatStages: readonly HeatStage[] = [
  { from: -20, to: 0 },
  { from: 0, to: 100 },
  { from: 100, to: 120 },
];

export function scene(name: string): SceneSpec {
  if (name === "heat") return { id: "heat", stages: heatStages };
  if (name === "matter" || name === "waterMolecule" || name === "states") return { id: name };
  throw new Error(`unknown scene: ${name}`);
}

const experimentIds: readonly ExperimentId[] = ["balloon", "zoom", "heatGas", "stove"];

export function experimentId(name: string): ExperimentId {
  const id = experimentIds.find((e) => e === name);
  if (id === undefined) throw new Error(`unknown experiment: ${name}`);
  return id;
}

type Step = { readonly kind: "step"; readonly name: string; readonly result: ActivityResult };

export const steps: Lesson<Step> = {
  id: "fixture",
  title: "Fixture",
  activities: [
    { kind: "step", name: "One", result: { xp: 10, mistakes: 0 } },
    { kind: "step", name: "Two", result: { xp: 5, mistakes: 1 } },
    { kind: "step", name: "Three", result: { xp: 20, mistakes: 0 } },
  ],
};
