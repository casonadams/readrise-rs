import { kai, lily } from "../classmates";
import type { ScienceLesson } from "../types";

// Changes of state and conservation of mass. Targets "boiling bubbles are air" and "evaporated water is gone".
export const changesLesson: ScienceLesson = {
  id: "changes",
  title: "Changes",
  activities: [
    {
      kind: "quiz",
      role: "warmUp",
      questions: [
        {
          prompt: "When you heat a gas, its particles...",
          options: ["Get bigger", "Move faster", "Disappear"],
          answer: 1,
          hint: "Remember the jar over the flame.",
          feedback: {
            0: "Particles stay the same size when heated.",
            2: "Matter does not disappear when heated.",
          },
          explanation: "Heat speeds particles up. Their size stays the same.",
        },
        {
          prompt: "Which of these is NOT matter?",
          options: ["Steam", "Heat", "Ice"],
          answer: 1,
          hint: "Which one has no mass?",
          feedback: {
            0: "Steam is water as a gas, so it is matter.",
            2: "Ice is water as a solid, so it is matter.",
          },
          explanation: "Heat is energy. Steam and ice are both water.",
        },
      ],
    },
    {
      kind: "predict",
      question: "Water boils in a pot. What are the bubbles made of?",
      options: ["Air", "Heat", "Water that turned into a gas"],
      answer: 2,
      tryIt: "Turn the stove up until the water boils.",
      experiment: "stove",
      outcome:
        "The bubbles are water itself, as a gas called water vapor. " +
        "Its particles got enough energy to fly apart.",
      reactions: {
        0: "A common guess! Tiny air bubbles come first, but not the big ones.",
        1: "Heat is energy, not matter, so it cannot fill a bubble.",
      },
    },
    {
      kind: "explainer",
      title: "Changing state",
      steps: [
        "When thermal energy is added or removed, matter can change state.",
        "Melting: solid to liquid.",
        "Freezing: liquid to solid.",
        "Boiling or evaporating: liquid to gas.",
        "Condensing: gas to liquid.",
        "It is still the same substance. Only the arrangement and motion of " + "its particles changed.",
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
    {
      kind: "sort",
      prompt: "Is thermal energy added or removed?",
      hint:
        "Changes toward faster particles (solid to liquid to gas) need " +
        "energy added. Going the other way removes it.",
      bins: ["Energy added", "Energy removed"],
      items: [
        { label: "Melting", bin: 0, why: "Ice needs warmth to melt." },
        { label: "Freezing", bin: 1, why: "Water must cool down to freeze." },
        { label: "Boiling", bin: 0, why: "A stove adds energy to boil water." },
        { label: "Condensing", bin: 1, why: "Vapor cools on a cold surface and turns to drops." },
        { label: "Evaporating", bin: 0, why: "Sunshine adds energy to dry up a puddle." },
      ],
    },
    {
      kind: "quiz",
      role: "check",
      questions: [
        {
          prompt: "A 20 g ice cube melts completely. What is the mass of the water?",
          options: ["Less than 20 g", "20 g", "More than 20 g"],
          answer: 1,
          hint: "Are any particles added or lost when ice melts?",
          feedback: {
            0: "No particles escape, so no mass is lost.",
            2: "Nothing is added, so the mass cannot grow.",
          },
          reason: {
            options: [
              "The same particles are still there",
              "Water is heavier than ice",
              "Melting adds heat, and heat has mass",
            ],
            answer: 0,
            feedback: {
              1: "Ice and water are the same particles, so the same mass.",
              2: "Heat is energy. It has no mass.",
            },
          },
          explanation:
            "Matter is not created or destroyed when it changes state. The " +
            "same particles are still there, so the mass stays 20 g.",
        },
        {
          prompt: "Drops of water form on a cold glass on a hot day. Where do they " + "come from?",
          options: ["Water vapor in the air", "Water leaking through the glass", "The cold makes new water"],
          answer: 0,
          hint: "Air has water in it as a gas. What does cold do to a gas?",
          feedback: {
            1: "Glass does not let water through. It forms on the outside.",
            2: "Cold cannot make new matter. The water was already there.",
          },
          reason: {
            options: [
              "The vapor cools down and condenses into liquid",
              "The cold glass sucks water in",
              "Ice inside melts through the glass",
            ],
            answer: 0,
            feedback: {
              1: "Glass cannot pull water in. The drops come from the air.",
              2: "The drops form even without ice, just from cold.",
            },
          },
          explanation:
            "Water vapor in the air touches the cold glass, loses energy, " + "and condenses into liquid drops.",
        },
        {
          prompt: "Which change needs thermal energy to be added?",
          options: ["Condensing", "Freezing", "Melting"],
          answer: 2,
          hint: "Which change makes particles move faster?",
          feedback: {
            0: "Condensing removes energy: gas slows into liquid.",
            1: "Freezing removes energy: liquid slows into solid.",
          },
          explanation:
            "Particles must speed up to break out of a solid's fixed " + "positions, so melting needs energy added.",
        },
      ],
    },
    {
      kind: "whoIsRight",
      situation: "Kai and Lily notice a puddle is gone on a sunny afternoon.",
      claims: [
        { kid: kai, says: "The sun destroyed the water. It is gone forever." },
        {
          kid: lily,
          says: "The water evaporated. Its particles are in the air now, as a gas.",
        },
      ],
      answer: 1,
      feedback: {
        0: "Matter is never destroyed when it changes state. The particles " + "just moved into the air.",
      },
      explanation:
        "Sunshine gave the water particles energy to escape as water vapor. " +
        "They are still there, spread out in the air.",
    },
  ],
};
