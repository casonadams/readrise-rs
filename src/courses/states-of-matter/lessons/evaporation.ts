import { itemId, lessonId, right, wrong } from "../../../core/course";
import { noah, zoe } from "../../../science/classmates";
import { scienceLesson } from "../../../science/lesson";
import type { ScienceLesson } from "../types";
import { changesLesson } from "./changes";
import { heatLesson } from "./heat";

// Evaporation below the boiling point. Targets "water only turns into a gas when it boils or the sun heats it"
// (Bar & Galili 1994, https://doi.org/10.1080/0950069940160205).
export const evaporationLesson: ScienceLesson = scienceLesson({
  id: lessonId("evaporation"),
  title: "Evaporation",
  warmUp: {
    recalls: [heatLesson, changesLesson],
    questions: [
      {
        id: itemId("evaporation-warm-bubbles"),
        prompt: "What are the big bubbles in boiling water made of?",
        choices: [
          right("Water vapor"),
          wrong("Air", "The big bubbles are water itself, as a gas."),
          wrong("Heat", "Heat is energy. It cannot fill a bubble."),
        ],
        hint: "Remember the pot on the stove.",
        explanation: "The bubbles are water vapor: water as a gas.",
      },
      {
        id: itemId("evaporation-warm-heating"),
        prompt: "What does heating do to particles?",
        choices: [
          wrong("Makes them bigger", "Particles stay the same size."),
          right("Makes them move faster"),
          wrong("Makes them disappear", "Heat never makes matter disappear."),
        ],
        hint: "Remember the jar over the flame.",
        explanation: "Heat speeds particles up. Their size stays the same.",
      },
    ],
  },
  predict: {
    question: "A glass of water sits in a cool room for a week. It never boils. What happens to the water?",
    choices: [
      wrong("Nothing. Water must boil to turn into a gas.", "A very common idea, even for grown-ups!"),
      wrong("It soaks into the glass", "Glass cannot soak up water."),
      right("Some of it goes into the air"),
    ],
    tryIt: "Drag the slider to let a week go by.",
    experiment: "evaporation",
    outcome: "Some particles left the surface as water vapor, without boiling. Every particle is still there.",
  },
  explain: [
    {
      title: "Evaporation",
      steps: [
        "Water particles move at many different speeds, even in a cool room.",
        "Now and then, a fast particle at the surface breaks free into the air.",
        "This is evaporation: a liquid slowly turning into a gas, without boiling.",
        "Warmth, wind and a wide surface make it faster.",
      ],
      scene: { id: "evaporation" },
    },
  ],
  practise: {
    kind: "sort",
    prompt: "Which dries faster?",
    hint: "Warmth, wind and a wide surface help fast particles escape.",
    bins: ["Dries faster", "Dries slower"],
    items: [
      { label: "A puddle in the sun", bin: 0, why: "Sunshine warms it, so more particles are fast enough." },
      { label: "A puddle in the shade", bin: 1, why: "It still dries, but cooler particles escape less often." },
      { label: "Wet hair under a hair dryer", bin: 0, why: "Warm, moving air helps particles escape and carries them off." },
      { label: "A towel folded in a pile", bin: 1, why: "Folded, few water particles are at the surface." },
      { label: "A towel spread on a line", bin: 0, why: "Spread out, many particles are at the surface." },
      { label: "A glass of water with a lid", bin: 1, why: "The lid keeps the vapor in, so little water leaves." },
    ],
  },
  check: [
    {
      id: itemId("evaporation-boil"),
      prompt: "Does water have to boil to evaporate?",
      choices: [
        wrong("Yes, it must reach 100\u00B0C", "Puddles dry on days far colder than 100\u00B0C."),
        right("No, it evaporates at any temperature"),
        wrong("Only when the sun shines on it", "Puddles dry in the shade and at night too, just more slowly."),
      ],
      hint: "Think about the glass in the cool room.",
      reason: {
        choices: [
          wrong("Cold water particles are lighter", "Cold and warm water particles have the same mass."),
          wrong("The air pulls the water up", "Air does not pull. Fast particles break free on their own."),
          right("Some particles are always fast enough to escape"),
        ],
      },
      explanation:
        "At any temperature, some particles move fast enough to break free. Boiling is just very fast evaporation.",
    },
    {
      id: itemId("evaporation-which-leave"),
      prompt: "Which particles leave the water first?",
      choices: [
        right("Fast ones at the surface"),
        wrong(
          "Slow ones at the bottom",
          "Slow particles cannot break free, and the rest hold in the bottom ones.",
        ),
        wrong("All of them at once", "Only the fastest at the top escape, so water dries a little at a time."),
      ],
      hint: "Which particles touch the air and have the most energy?",
      explanation: "Only particles at the surface that move fast enough break free into the air.",
    },
    {
      id: itemId("evaporation-towel"),
      prompt: "Which wet towel dries fastest?",
      choices: [
        wrong("Folded in a pile", "Folded, few particles are at the surface."),
        wrong("Spread out in a cold room", "It dries, but cold particles are slower, so fewer escape."),
        right("Spread out in a warm wind"),
      ],
      hint: "Warmth, wind and a wide surface all help.",
      explanation:
        "Warmth makes more particles fast, spreading puts more at the surface, and wind carries the vapor away.",
    },
  ],
  debate: {
    situation: "Zoe and Noah hang wet laundry outside on a cold, cloudy day.",
    claims: [
      { kid: zoe, says: right("It will dry, just more slowly than on a sunny day.") },
      {
        kid: noah,
        says: wrong(
          "It cannot dry. Water needs the sun to evaporate.",
          "Water evaporates at any temperature. The sun only makes it faster.",
        ),
      },
    ],
    explanation:
      "Even on a cold day, some water particles are fast enough to escape. Fewer escape than on a warm day, so it " +
      "takes longer.",
  },
});
