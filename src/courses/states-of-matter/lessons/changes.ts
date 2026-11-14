import { right, wrong } from "../../../core/course";
import { kai, lily } from "../../../science/classmates";
import { scienceLesson } from "../../../science/lesson";
import type { ScienceLesson } from "../types";

// Changes of state and conservation of mass. Targets "boiling bubbles are air" and "evaporated water is gone".
export const changesLesson: ScienceLesson = scienceLesson({
  id: "changes",
  title: "Changes",
  warmUp: [
    {
      prompt: "When you heat a gas, its particles...",
      choices: [
        wrong("Get bigger", "Particles stay the same size when heated."),
        right("Move faster"),
        wrong("Disappear", "Matter does not disappear when heated."),
      ],
      hint: "Remember the jar over the flame.",
      explanation: "Heat speeds particles up. Their size stays the same.",
    },
    {
      prompt: "Which of these is NOT matter?",
      choices: [
        wrong("Steam", "Steam is water as a gas, so it is matter."),
        right("Heat"),
        wrong("Ice", "Ice is water as a solid, so it is matter."),
      ],
      hint: "Which one has no mass?",
      explanation: "Heat is energy. Steam and ice are both water.",
    },
  ],
  predict: {
    question: "Water boils in a pot. What are the bubbles made of?",
    choices: [
      wrong("Air", "A common guess! Tiny air bubbles come first, but not the big ones."),
      wrong("Heat", "Heat is energy, not matter, so it cannot fill a bubble."),
      right("Water that turned into a gas"),
    ],
    tryIt: "Turn the stove up until the water boils.",
    experiment: "stove",
    outcome:
      "The bubbles are water itself, as a gas called water vapor. Its particles got enough energy to fly apart.",
  },
  explain: [
    {
      title: "Changing state",
      steps: [
        "When thermal energy is added or removed, matter can change state.",
        "Melting: solid to liquid.",
        "Freezing: liquid to solid.",
        "Boiling or evaporating: liquid to gas.",
        "Condensing: gas to liquid.",
        "It is still the same substance. Only the arrangement and motion of its particles changed.",
      ],
      scene: {
        id: "heat",
        stages: [
          { from: 20, to: 20 },
          { from: -20, to: 20 },
          { from: 20, to: -20 },
          { from: 20, to: 110 },
          { from: 110, to: 20 },
          { from: 20, to: 20 },
        ],
      },
    },
  ],
  practise: {
    kind: "sort",
    prompt: "Is thermal energy added or removed?",
    hint:
      "Changes toward faster particles (solid to liquid to gas) need energy added. Going the other way removes it.",
    bins: ["Energy added", "Energy removed"],
    items: [
      { label: "Melting", bin: 0, why: "Ice needs warmth to melt." },
      { label: "Freezing", bin: 1, why: "Water must cool down to freeze." },
      { label: "Boiling", bin: 0, why: "A stove adds energy to boil water." },
      { label: "Condensing", bin: 1, why: "Vapor cools on a cold surface and turns to drops." },
      { label: "Evaporating", bin: 0, why: "Sunshine adds energy to dry up a puddle." },
    ],
  },
  check: [
    {
      prompt: "A 20 g ice cube melts completely. What is the mass of the water?",
      choices: [
        wrong("Less than 20 g", "No particles escape, so no mass is lost."),
        right("20 g"),
        wrong("More than 20 g", "Nothing is added, so the mass cannot grow."),
      ],
      hint: "Are any particles added or lost when ice melts?",
      reason: {
        choices: [
          right("The same particles are still there"),
          wrong("Water is heavier than ice", "Ice and water are the same particles, so the same mass."),
          wrong("Melting adds heat, and heat has mass", "Heat is energy. It has no mass."),
        ],
      },
      explanation:
        "Matter is not created or destroyed when it changes state. The same particles are still there, so the mass " +
        "stays 20 g.",
    },
    {
      prompt: "Drops of water form on a cold glass on a hot day. Where do they come from?",
      choices: [
        right("Water vapor in the air"),
        wrong("Water leaking through the glass", "Glass does not let water through. It forms on the outside."),
        wrong("The cold makes new water", "Cold cannot make new matter. The water was already there."),
      ],
      hint: "Air has water in it as a gas. What does cold do to a gas?",
      reason: {
        choices: [
          right("The vapor cools down and condenses into liquid"),
          wrong("The cold glass sucks water in", "Glass cannot pull water in. The drops come from the air."),
          wrong("Ice inside melts through the glass", "The drops form even without ice, just from cold."),
        ],
      },
      explanation: "Water vapor in the air touches the cold glass, loses energy, and condenses into liquid drops.",
    },
    {
      prompt: "Which change needs thermal energy to be added?",
      choices: [
        wrong("Condensing", "Condensing removes energy: gas slows into liquid."),
        wrong("Freezing", "Freezing removes energy: liquid slows into solid."),
        right("Melting"),
      ],
      hint: "Which change makes particles move faster?",
      explanation: "Particles must speed up to break out of a solid's fixed positions, so melting needs energy added.",
    },
  ],
  debate: {
    situation: "Kai and Lily notice a puddle is gone on a sunny afternoon.",
    claims: [
      {
        kid: kai,
        says: wrong(
          "The sun destroyed the water. It is gone forever.",
          "Matter is never destroyed when it changes state. The particles just moved into the air.",
        ),
      },
      { kid: lily, says: right("The water evaporated. Its particles are in the air now, as a gas.") },
    ],
    explanation:
      "Sunshine gave the water particles energy to escape as water vapor. They are still there, spread out in the " +
      "air.",
  },
});
