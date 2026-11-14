import { itemId, lessonId, right, wrong } from "../../../core/course";
import { ava, kai } from "../../../science/classmates";
import { scienceLesson } from "../../../science/lesson";
import type { MixturesLesson } from "../types";

// Dissolving at particle size. Targets "sugar disappears" and "sugar melts in water" (Longden, Black & Solomon 1991,
// https://doi.org/10.1080/0950069910130106; Ebenezer & Erickson 1996) and, in the debate, "dissolved sugar sinks to the bottom" (Prieto, Blanco & Rodriguez 1989).
export const dissolvingLesson: MixturesLesson = scienceLesson({
  id: lessonId("dissolving"),
  title: "Dissolving",
  predict: {
    question: "You stir a sugar cube into a glass of water until you cannot see it. Where is the sugar now?",
    choices: [
      wrong("It is gone", "Many people think so, even grown-ups!"),
      wrong("It melted into the water", "A common idea, but nothing here got hot."),
      right("Spread out between the water particles"),
    ],
    tryIt: "Drag the slider to stir.",
    experiment: "dissolving",
    outcome:
      "The sugar particles spread out between the water particles. You cannot see them, but all of them are still there.",
  },
  explain: [
    {
      title: "Dissolving",
      steps: [
        "A sugar cube is made of tiny sugar particles packed together.",
        "Water particles bump into the cube and knock sugar particles loose.",
        "The loose sugar particles spread out between the water particles. This is called dissolving.",
        "Water with something dissolved in it is called a solution.",
      ],
      scene: { id: "dissolving" },
    },
  ],
  practise: {
    kind: "sort",
    prompt: "Does it dissolve in water?",
    hint: "If it spreads out until you cannot see any bits, it dissolved.",
    bins: ["Dissolves", "Does not dissolve"],
    items: [
      { label: "Sugar", bin: 0, why: "Its particles spread out between the water particles." },
      { label: "Sand", bin: 1, why: "Sand sinks and stays sand at the bottom." },
      { label: "Salt", bin: 0, why: "You cannot see it, but the water tastes salty." },
      { label: "Cooking oil", bin: 1, why: "Oil floats on top in its own layer." },
      { label: "Drink powder", bin: 0, why: "It flavours all of the water evenly." },
      { label: "Pepper", bin: 1, why: "You can still see the pepper bits in the water." },
    ],
  },
  check: [
    {
      id: itemId("dissolving-where"),
      prompt: "You cannot see dissolved sugar. Where is it?",
      choices: [
        wrong("Gone", "The water tastes sweet, so the sugar is still there."),
        right("Spread out between the water particles"),
        wrong("Melted", "Melting needs heat, and the water was not heated."),
      ],
      hint: "How could the water taste sweet?",
      reason: {
        choices: [
          wrong(
            "Sugar particles break into nothing",
            "Particles never break into nothing; they only move apart.",
          ),
          right("Every sugar particle is still in the water"),
          wrong(
            "The water hides the sugar at the bottom",
            "Dissolved sugar spreads through all of the water.",
          ),
        ],
      },
      explanation:
        "The sugar particles spread out between the water particles. The sweet taste shows they are still there.",
    },
    {
      id: itemId("dissolving-solution"),
      prompt: "What is water with sugar dissolved in it called?",
      choices: [
        right("A solution"),
        wrong("A solid", "Sugar water is a liquid you can pour."),
        wrong("Pure water", "Pure water has only water particles in it."),
      ],
      hint: "It is a mixture where you cannot see the parts.",
      explanation: "A solution is a mixture where one substance has dissolved in another.",
    },
    {
      id: itemId("dissolving-see"),
      prompt: "Why can you not see dissolved sugar?",
      choices: [
        wrong("It turned into water", "Sugar particles always stay sugar."),
        right("Its particles are far too small to see"),
        wrong("It floated up into the air", "Dissolved sugar stays in the water."),
      ],
      hint: "Think about how small particles are.",
      explanation:
        "Each sugar particle is far too small to see. Only the cube, with millions packed together, was big enough.",
    },
  ],
  debate: {
    situation: "Ava and Kai sip sweet tea. They cannot see any sugar in it.",
    claims: [
      {
        kid: kai,
        says: wrong(
          "The sugar sank to the bottom where we cannot see it.",
          "Dissolved sugar spreads through all of the tea, so every sip is sweet.",
        ),
      },
      {
        kid: ava,
        says: right("The sugar spread out between the water particles in the tea."),
      },
    ],
    explanation:
      "Dissolved sugar spreads evenly through the whole drink. That is why the first sip and the last sip taste just as sweet.",
  },
});
