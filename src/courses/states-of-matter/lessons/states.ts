import { right, wrong } from "../../../core/course";
import { ava, sam } from "../../../science/classmates";
import { scienceLesson } from "../../../science/lesson";
import type { ScienceLesson } from "../types";

// Solid, liquid, gas as particle arrangements. Targets "air fills the gaps between particles" and
// "particles are hard or cold like the whole".
export const statesLesson: ScienceLesson = scienceLesson({
  id: "states",
  title: "States",
  warmUp: [
    {
      prompt: "Which of these is matter?",
      choices: [
        wrong("Sound", "Sound is energy moving through matter."),
        right("Air"),
        wrong("Light", "Light is energy. It has no mass."),
      ],
      hint: "Which one tipped the scale?",
      explanation: "Air has mass and takes up space, so it is matter.",
    },
    {
      prompt: "What is all matter made of?",
      choices: [
        right("Tiny particles called atoms"),
        wrong("Energy", "Energy is not matter, so matter cannot be made of it."),
        wrong("Water", "Water is one kind of matter, made of atoms like everything."),
      ],
      hint: "Think of the H and O balls.",
      explanation: "All matter is made of tiny particles called atoms.",
    },
  ],
  predict: {
    question: "Imagine zooming into a jar of air until you see its particles. What is between the particles?",
    choices: [
      wrong("More air", "Most people guess this, even grown-ups!"),
      right("Nothing at all, just empty space"),
      wrong("Water", "Any water in air is particles too, not what fills the gaps."),
    ],
    tryIt: "Drag the slider all the way to zoom in.",
    experiment: "zoom",
    outcome: "The particles are the air. Between them is nothing at all, just empty space.",
  },
  explain: [
    {
      title: "Solid, liquid, gas",
      steps: [
        "The matter around you is usually a solid, a liquid, or a gas.",
        "In a solid, particles are packed tight and vibrate in place. A solid keeps its own shape and volume.",
        "In a liquid, particles touch but slide past each other. It keeps its volume but takes the shape of its " +
          "container.",
        "In a gas, particles fly far apart with empty space between them. A gas spreads out to fill its whole " +
          "container.",
        "The particles are the same kind in all three. Only how they are arranged and how they move changes.",
      ],
      scene: { id: "states" },
    },
  ],
  practise: {
    kind: "sort",
    prompt: "Which state is it at room temperature?",
    hint: "Does it keep its own shape (solid), pour (liquid), or spread out to fill a space (gas)?",
    bins: ["Solid", "Liquid", "Gas"],
    items: [
      { label: "Ice cube", bin: 0, why: "Ice keeps its own shape." },
      { label: "Orange juice", bin: 1, why: "Juice takes the shape of its glass." },
      { label: "Helium", bin: 2, why: "Helium spreads out to fill a balloon." },
      { label: "Wooden block", bin: 0, why: "A block keeps its shape on its own." },
      { label: "Milk", bin: 1, why: "Milk pours and takes the shape of its jug." },
      { label: "Oxygen", bin: 2, why: "Oxygen is a gas in the air around you." },
      { label: "Gold ring", bin: 0, why: "Gold is a solid metal at room temperature." },
    ],
  },
  check: [
    {
      prompt: "Which state of matter is this?",
      choices: [
        wrong("Solid", "Solid particles sit packed in rows. These fly around."),
        wrong("Liquid", "Liquid particles touch each other. These are far apart."),
        right("Gas"),
      ],
      hint: "Are the particles packed, touching, or far apart?",
      reason: {
        choices: [
          right("The particles are far apart and fly around"),
          wrong(
            "The particles are hot",
            "Gases can be cold, like the air in winter. Look at how the particles are spread out.",
          ),
          wrong("The particles are tiny", "Particles are tiny in every state."),
        ],
      },
      explanation: "The particles are far apart and moving fast in every direction. That is a gas.",
      visual: { particles: "gas", energy: 0.7 },
    },
    {
      prompt: "Which state of matter is this?",
      choices: [
        right("Solid"),
        wrong("Liquid", "Liquid particles slide past each other. These stay in rows."),
        wrong("Gas", "Gas particles fly apart. These are packed together."),
      ],
      hint: "Do the particles move around, or stay in their spots?",
      reason: {
        choices: [
          right("The particles are packed and vibrate in place"),
          wrong(
            "The particles do not move at all",
            "Look closely: solid particles still wiggle. They vibrate in place.",
          ),
          wrong(
            "The particles are hard",
            "One particle is not hard or soft. A solid is hard because its particles are held tightly together.",
          ),
        ],
      },
      explanation: "The particles are packed in fixed positions and only vibrate. That is a solid.",
      visual: { particles: "solid", energy: 0.3 },
    },
    {
      prompt: "Why can you pour juice but not a wooden block?",
      choices: [
        right("Juice particles slide past each other"),
        wrong("Juice particles are smaller", "Size is not the reason. It is how the particles move."),
        wrong("Wood particles are glued with air", "There is no air between particles, only empty space."),
      ],
      hint: "Think about how liquid particles move.",
      explanation: "In a liquid, particles slide past each other, so it flows. In a solid, they are held in place.",
    },
  ],
  debate: {
    situation: "Ava and Sam are talking about an ice cube.",
    claims: [
      {
        kid: ava,
        says: wrong(
          "Ice is hard because each ice particle is cold and hard.",
          "A single particle is not hard or cold. Ice is hard because of how its particles are arranged.",
        ),
      },
      {
        kid: sam,
        says: right("Ice particles are the same as water particles. They are just packed tight and held in place."),
      },
    ],
    explanation:
      "Ice, water, and steam are made of the same particles. Ice is hard because its particles are packed and held " +
      "in place.",
  },
});
