import { itemId, lessonId, right, wrong } from "../../../core/course";
import { lily, noah } from "../../../science/classmates";
import { scienceLesson } from "../../../science/lesson";
import type { MixturesLesson } from "../types";
import { dissolvingLesson } from "./dissolving";

// Melting and dissolving side by side. Targets "dissolving is melting" (Ebenezer & Erickson 1996).
export const meltOrDissolveLesson: MixturesLesson = scienceLesson({
  id: lessonId("melting-or-dissolving"),
  title: "Melt or dissolve?",
  warmUp: {
    recalls: [dissolvingLesson],
    questions: [
      {
        id: itemId("melting-warm-where"),
        prompt: "Where does sugar go when it dissolves?",
        choices: [
          right("Between the water particles"),
          wrong("It disappears", "The water tastes sweet, so it is there."),
          wrong("Into the air", "Dissolved sugar stays in the water."),
        ],
        hint: "Remember the sweet tea.",
        explanation: "Dissolved sugar spreads out between water particles.",
      },
      {
        id: itemId("melting-warm-solution"),
        prompt: "Salt dissolved in water makes...",
        choices: [
          wrong("A new kind of water", "The water stays water and the salt stays salt."),
          right("A solution"),
          wrong("A solid", "Salt water is a liquid you can pour."),
        ],
        hint: "What is a mixture with something dissolved in it called?",
        explanation: "Salt dissolved in water is a solution.",
      },
    ],
  },
  predict: {
    question:
      "An ice cube melts in a warm room. A sugar cube dissolves in water. Are these the same kind of change?",
    choices: [
      wrong("Yes, both are melting", "A very common idea, even for grown-ups!"),
      wrong("Yes, both just disappear", "A common idea, but neither one is really gone."),
      right("No, they are different changes"),
    ],
    tryIt: "Drag the slider to let time pass.",
    experiment: "meltOrDissolve",
    outcome:
      "The ice became liquid but stayed only water. The sugar spread out between water particles, so two substances mixed.",
  },
  explain: [
    {
      title: "Melting or dissolving",
      steps: [
        "Both start solid: an ice cube and a sugar cube.",
        "Melting: heat lets the particles of one substance slide past each other.",
        "Dissolving: the particles of one substance spread out between the particles of a liquid.",
        "Melting needs heat. Dissolving needs a liquid.",
      ],
      scene: { id: "meltOrDissolve" },
    },
  ],
  practise: {
    kind: "sort",
    prompt: "Melting or dissolving?",
    hint: "Melting needs heat; dissolving needs a liquid to mix into.",
    bins: ["Melting", "Dissolving"],
    items: [
      { label: "Ice cream on a hot day", bin: 0, why: "Heat turns the ice cream itself into a liquid." },
      { label: "Salt stirred into soup", bin: 1, why: "The salt particles spread out in the soup." },
      { label: "Butter in a hot pan", bin: 0, why: "Heat turns the butter liquid, and nothing mixes in." },
      { label: "Drink powder in water", bin: 1, why: "Its particles spread out between the water particles." },
      { label: "Chocolate in a warm hand", bin: 0, why: "The warmth of your hand turns the chocolate liquid." },
      { label: "Sugar in cold lemonade", bin: 1, why: "No heat is needed: the sugar spreads into the lemonade." },
    ],
  },
  check: [
    {
      id: itemId("melting-sugar-tea"),
      prompt: "Sugar vanishes in hot tea. Is it melting?",
      choices: [
        wrong("Yes, the tea is hot", "Tea is far too cool to melt sugar."),
        wrong("Yes, it disappears", "Melted things do not disappear."),
        right("No, it is dissolving"),
      ],
      hint: "Did the sugar become liquid sugar, or mix into the water?",
      reason: {
        choices: [
          right("Its particles spread out between the water particles"),
          wrong(
            "Tea is hotter than the melting point of sugar",
            "Sugar melts at about 186\u00B0C, much hotter than any tea.",
          ),
          wrong("Hot drinks melt whatever is put in them", "A spoon in hot tea does not melt."),
        ],
      },
      explanation:
        "The sugar dissolves: its particles spread out between the water particles. It would melt only at about 186\u00B0C.",
    },
    {
      id: itemId("melting-needs"),
      prompt: "What does melting always need?",
      choices: [
        wrong("Water", "Butter melts in a pan with no water at all."),
        right("Heat"),
        wrong("Stirring", "Stirring helps things dissolve, not melt."),
      ],
      hint: "Think about ice cream on a hot day.",
      explanation: "Melting needs heat, which lets a substance's particles slide past each other.",
    },
    {
      id: itemId("melting-ice-substances"),
      prompt: "An ice cube melts. What is in the puddle?",
      choices: [
        right("Only water"),
        wrong("Water and ice, two substances", "Ice is just water with its particles held in place."),
        wrong("Water and air", "Melting does not add any air."),
      ],
      hint: "What is ice made of?",
      explanation:
        "Ice and liquid water are the same substance. Melting only changes how the particles are arranged.",
    },
  ],
  debate: {
    situation: "Lily and Noah watch a sugar cube vanish in cold water.",
    claims: [
      {
        kid: noah,
        says: wrong(
          "It melted, just like an ice cube does.",
          "Cold water cannot melt sugar; the sugar dissolved instead.",
        ),
      },
      {
        kid: lily,
        says: right("It dissolved. Its particles spread out in the water."),
      },
    ],
    explanation:
      "Melting needs heat and only one substance. The sugar mixed into the water without any heat, so it dissolved.",
  },
});
