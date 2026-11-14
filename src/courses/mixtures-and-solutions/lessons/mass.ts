import { itemId, lessonId, right, wrong } from "../../../core/course";
import { sam, zoe } from "../../../science/classmates";
import { scienceLesson } from "../../../science/lesson";
import type { MixturesLesson } from "../types";
import { dissolvingLesson } from "./dissolving";
import { meltOrDissolveLesson } from "./melt-or-dissolve";

// Mass is conserved when dissolving (NGSS 5-PS1-2). Targets "dissolved sugar weighs less or nothing" (RSC, Chemical misconceptions II: Mass and
// dissolving, https://edu.rsc.org/solutions/mass-and-dissolving-chemical-misconceptions-ii-11-14-years/1084.article).
export const massLesson: MixturesLesson = scienceLesson({
  id: lessonId("mass"),
  title: "Mass",
  warmUp: {
    recalls: [dissolvingLesson, meltOrDissolveLesson],
    questions: [
      {
        id: itemId("mass-warm-ice-cream"),
        prompt: "Ice cream turns runny on a hot day. What is happening?",
        choices: [
          right("Melting"),
          wrong("Dissolving", "Nothing mixes into the ice cream."),
          wrong("Neither", "A solid turning liquid in the heat is melting."),
        ],
        hint: "Did heat do it, or did something mix in?",
        explanation: "Heat turns the ice cream liquid, so it is melting.",
      },
      {
        id: itemId("mass-warm-see"),
        prompt: "Why can you not see salt dissolved in water?",
        choices: [
          wrong("It turned into water", "Salt particles always stay salt."),
          wrong("It left the glass", "The water tastes salty, so it is there."),
          right("Its particles are too small to see"),
        ],
        hint: "Think about how small particles are.",
        explanation: "The salt particles are spread out and far too small to see.",
      },
    ],
  },
  predict: {
    question:
      "Water and a sugar cube weigh 110\u00A0g. You stir until the sugar dissolves. What will the scale read?",
    choices: [
      wrong("Less, because the sugar disappeared", "Many people think so, even grown-ups!"),
      right("Still 110\u00A0g"),
      wrong("More, because sugar water is heavier", "Sugar water does feel thicker, so that makes sense to guess."),
    ],
    tryIt: "Drag the slider to stir.",
    experiment: "mass",
    outcome:
      "The scale still reads 110\u00A0g. Every sugar particle is still in the glass, so the mass stays the same.",
  },
  explain: [
    {
      title: "Mass stays the same",
      steps: [
        "The scale weighs every particle in the glass: water and sugar.",
        "As the sugar dissolves, its particles move but stay in the glass.",
        "No particle leaves or arrives, so it still weighs 110\u00A0g.",
        "Mass only changes when particles are added or leave.",
      ],
      scene: { id: "mass" },
    },
  ],
  practise: {
    kind: "sort",
    prompt: "Does the mass in the container change?",
    hint: "Mass changes only when particles are added or leave.",
    bins: ["Stays the same", "Changes"],
    items: [
      { label: "Salt dissolves in a closed jar", bin: 0, why: "Every salt particle stays in the jar." },
      { label: "Water boils away from an open pot", bin: 1, why: "Water particles leave the pot as a gas." },
      { label: "Ice melts in a sealed bag", bin: 0, why: "The same water particles are still in the bag." },
      { label: "You stir in another spoon of sugar", bin: 1, why: "You added more particles." },
      { label: "Juice freezes in a closed cup", bin: 0, why: "Freezing only rearranges the particles." },
      { label: "A wet towel dries on a line", bin: 1, why: "Water particles evaporate into the air." },
    ],
  },
  check: [
    {
      id: itemId("mass-salt"),
      prompt:
        "You dissolve 20\u00A0g of salt in 200\u00A0g of water. What is the mass of the salt water?",
      ordered: true,
      choices: [
        wrong("200\u00A0g", "Dissolved salt still has mass."),
        wrong("210\u00A0g", "No salt left the water, so none of its mass is lost."),
        right("220\u00A0g"),
        wrong("240\u00A0g", "Nothing else was added, so it cannot weigh more."),
      ],
      hint: "Add the water and the salt together.",
      reason: {
        choices: [
          wrong(
            "Salt water is heavier than salt plus water",
            "The mass is exactly the water plus the salt.",
          ),
          right("Every salt particle is still in the water"),
          wrong("Dissolved salt weighs half as much", "A particle keeps its mass when it dissolves."),
        ],
      },
      explanation:
        "200\u00A0g + 20\u00A0g = 220\u00A0g. Dissolving moves the salt particles but keeps every one of them.",
    },
    {
      id: itemId("mass-why-same"),
      prompt: "Why does dissolving not change the mass?",
      choices: [
        right("No particles leave or arrive"),
        wrong("Sugar has no mass", "The sugar cube added 10\u00A0g to the scale."),
        wrong("Water gets lighter to make room", "Water particles keep their mass too."),
      ],
      hint: "What would have to happen for the mass to change?",
      explanation: "Mass only changes when particles are added or leave. Dissolving just moves them around.",
    },
    {
      id: itemId("mass-evaporates"),
      prompt: "A glass of salt water sits on a sunny windowsill for a week. What happens to its mass?",
      choices: [
        wrong("It stays the same", "Water particles leave as a gas."),
        right("It goes down as the water evaporates"),
        wrong("It goes up", "Nothing is added to the glass."),
      ],
      hint: "Remember evaporation: do any particles leave?",
      explanation:
        "Water particles evaporate into the air and leave the glass. The salt stays, but the total mass goes down.",
    },
  ],
  debate: {
    situation: "Sam and Zoe weigh a glass of water, add a sugar cube, and stir until it dissolves.",
    claims: [
      {
        kid: zoe,
        says: right("It weighs the same as the water plus the sugar cube."),
      },
      {
        kid: sam,
        says: wrong(
          "It weighs less now, because the sugar is gone.",
          "The sugar is still in the water, so its mass still counts.",
        ),
      },
    ],
    explanation:
      "Dissolving keeps every sugar particle in the glass. The mass is the water plus the sugar, before and after stirring.",
  },
});
