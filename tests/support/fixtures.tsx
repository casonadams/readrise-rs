import { Text, View } from "nsh";
import {
  type ExplainerActivity,
  itemId,
  type Lesson,
  lessonId,
  type PredictActivity,
  type QuizActivity,
  right,
  type SortActivity,
  type WhoIsRightActivity,
  wrong,
} from "../../src/core/course";
import type { ActivityResult } from "../../src/core/scoring";
import type { HeatLabActivity, HeatStage, SceneSpec } from "../../src/courses/states-of-matter/types";
import type { RenderExperiment, RenderScene } from "../../src/ui/activities/types";

export const quiz: QuizActivity = {
  kind: "quiz",
  role: "check",
  questions: [
    {
      id: itemId("keeps-shape"),
      prompt: "Which one keeps its shape?",
      choices: [
        wrong("Steam", "Steam is a gas, not a solid."),
        right("Ice"),
        wrong("Water", "Water takes the shape of its cup."),
      ],
      hint: "Think about a cube in your freezer.",
      explanation: "Ice keeps its shape.",
    },
    {
      id: itemId("flows"),
      prompt: "Which one flows?",
      choices: [wrong("Rock", "A rock keeps its shape."), right("Water")],
      explanation: "Water flows.",
    },
  ],
};

export const quizReason: QuizActivity = {
  kind: "quiz",
  role: "check",
  questions: [
    {
      id: itemId("ice-solid"),
      prompt: "Is ice a solid?",
      choices: [right("Yes"), wrong("No", "Ice keeps its shape, so it is a solid.")],
      reason: {
        choices: [wrong("It is cold.", "Cold alone does not make a solid."), right("Its particles are packed close and stay put.")],
      },
      explanation: "Ice is a solid.",
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
    { kid: { name: "Maya", skin: "#F1C27D", hair: "#3E2723" }, says: wrong("No, it has no particles.", "Ice still has particles.") },
    { kid: { name: "Leo", skin: "#8D5524", hair: "#111111" }, says: right("Yes, they are still there but slow.") },
  ],
  explanation: "Particles keep moving, just slowly.",
};

export const predict: PredictActivity<string> = {
  kind: "predict",
  question: "What happens to a balloon in cold water?",
  choices: [
    right("It shrinks"),
    wrong("It grows", "Good thinking about air."),
    wrong("Nothing", "The air inside changes even though you cannot see it."),
  ],
  tryIt: "Put the balloon in cold water",
  experiment: "cold",
  outcome: "Cold air takes up less room.",
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
  if (name === "matter" || name === "waterMolecule" || name === "states" || name === "evaporation") return { id: name };
  throw new Error(`unknown scene: ${name}`);
}

type Step = { readonly kind: "step"; readonly name: string; readonly result: ActivityResult };

export const steps: Lesson<Step> = {
  id: lessonId("fixture"),
  title: "Fixture",
  activities: [
    { kind: "step", name: "One", result: { xp: 10, mistakes: 0 } },
    { kind: "step", name: "Two", result: { xp: 5, mistakes: 1 } },
    { kind: "step", name: "Three", result: { xp: 20, mistakes: 0 } },
  ],
};
