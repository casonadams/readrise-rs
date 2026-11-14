import { itemId, lessonId, right, wrong } from "../../../core/course";
import { leo, mia } from "../../../science/classmates";
import { scienceLesson } from "../../../science/lesson";
import type { MixturesLesson } from "../types";
import { massLesson } from "./mass";
import { meltOrDissolveLesson } from "./melt-or-dissolve";

// Water can only dissolve so much. Targets "stir long enough and any amount dissolves" (Blanco & Prieto 1997, pupils' views on how stirring
// and temperature affect dissolving, International Journal of Science Education 19(3)).
export const howMuchLesson: MixturesLesson = scienceLesson({
  id: lessonId("how-much"),
  title: "How much?",
  warmUp: {
    recalls: [meltOrDissolveLesson, massLesson],
    questions: [
      {
        id: itemId("how-much-warm-mass"),
        prompt: "You dissolve 5\u00A0g of salt in 100\u00A0g of water. What is the mass of the salt water?",
        ordered: true,
        choices: [
          wrong("100\u00A0g", "Dissolved salt still has mass."),
          right("105\u00A0g"),
          wrong("110\u00A0g", "Only 5\u00A0g of salt was added."),
        ],
        hint: "Add the water and the salt together.",
        explanation: "100\u00A0g + 5\u00A0g = 105\u00A0g, because every particle stays.",
      },
      {
        id: itemId("how-much-warm-heat"),
        prompt: "Which change always needs heat?",
        choices: [
          wrong("Dissolving", "Sugar dissolves in cold lemonade."),
          right("Melting"),
          wrong("Both", "Only melting needs heat; dissolving needs a liquid."),
        ],
        hint: "Think about sugar in cold lemonade.",
        explanation: "Melting needs heat. Dissolving only needs a liquid.",
      },
    ],
  },
  predict: {
    question: "You keep stirring spoon after spoon of sugar into one glass of water. What happens?",
    choices: [
      wrong("It all dissolves, however much you add", "A common idea, and it holds for the first few spoons!"),
      wrong("The water turns solid", "The water stays liquid the whole time."),
      right("After a few spoons, extra sugar stays at the bottom"),
    ],
    tryIt: "Tap to add one spoon of sugar at a time.",
    experiment: "spoons",
    outcome:
      "The water can only hold so much sugar. After that, extra sugar stays solid at the bottom.",
  },
  explain: [
    {
      title: "How much can dissolve?",
      steps: [
        "One spoon of sugar dissolves easily.",
        "A few more spoons dissolve too.",
        "Then the water is full. A solution that cannot dissolve any more is called saturated.",
        "Extra sugar stays solid at the bottom, however long you stir.",
        "Warm water can dissolve more sugar than cold water.",
      ],
      scene: { id: "spoons" },
    },
  ],
  practise: {
    kind: "sort",
    prompt: "Will it all dissolve?",
    hint: "A little in a lot of water dissolves; a lot in a little does not.",
    bins: ["All dissolves", "Some stays at the bottom"],
    items: [
      { label: "One spoon of sugar in a big glass", bin: 0, why: "There is plenty of room for a little sugar." },
      { label: "Twenty spoons of sugar in a small glass", bin: 1, why: "The water is full long before twenty spoons." },
      { label: "A pinch of salt in a pot of soup", bin: 0, why: "A pinch is tiny next to a whole pot." },
      { label: "A cup of salt in a cup of water", bin: 1, why: "That is far more salt than the water can hold." },
      { label: "A spoon of drink powder in a jug", bin: 0, why: "A jug of water has room for one spoon." },
      { label: "Ten spoons of sugar in cold tea", bin: 1, why: "Cold tea is full after a few spoons." },
    ],
  },
  check: [
    {
      id: itemId("how-much-stir"),
      prompt: "Sugar sits at the bottom of a saturated glass. You stir for ten more minutes. What happens?",
      choices: [
        wrong("It all dissolves in the end", "Stirring speeds up dissolving but cannot make more room."),
        right("The extra sugar stays at the bottom"),
        wrong("The dissolved sugar comes back out", "Stirring does not undo dissolving."),
      ],
      hint: "What does saturated mean?",
      reason: {
        choices: [
          right("The water cannot hold any more sugar"),
          wrong("Stirring makes sugar heavier", "Stirring never changes the mass of a particle."),
          wrong(
            "Stirring only works on salt",
            "Stirring helps sugar and salt dissolve faster, up to the limit.",
          ),
        ],
      },
      explanation: "A saturated solution is full. Stirring cannot make room for more sugar.",
    },
    {
      id: itemId("how-much-warm-water"),
      prompt: "How can you get more sugar to dissolve in a saturated glass?",
      choices: [
        right("Warm the water"),
        wrong("Stir it longer", "Stirring makes it faster, not more."),
        wrong("Put it in the fridge", "Cold water holds even less sugar."),
      ],
      hint: "Which water had room for more sugar: warm or cold?",
      explanation: "Warm water can dissolve more sugar than cold water, so warming it makes room for more.",
    },
    {
      id: itemId("how-much-saturated"),
      prompt: "What does saturated mean?",
      choices: [
        wrong("Very wet", "In science, saturated means a solution is full."),
        wrong("It has no sugar in it", "A saturated solution holds all the sugar it can."),
        right("It cannot dissolve any more"),
      ],
      hint: "Think of the glass with sugar left at the bottom.",
      explanation: "A saturated solution has dissolved as much as it can hold.",
    },
  ],
  debate: {
    situation: "Mia and Leo keep adding sugar to a glass of lemonade. Sugar starts piling up at the bottom.",
    claims: [
      {
        kid: leo,
        says: wrong(
          "If we stir harder, all of it will dissolve.",
          "Stirring speeds dissolving up, but a full solution takes no more.",
        ),
      },
      {
        kid: mia,
        says: right("The lemonade is full. It cannot dissolve any more."),
      },
    ],
    explanation:
      "The lemonade is saturated. The extra sugar will stay at the bottom unless the lemonade is warmed.",
  },
});
