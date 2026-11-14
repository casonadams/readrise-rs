import { itemId, lessonId, right, wrong } from "../../../core/course";
import { noah, zoe } from "../../../science/classmates";
import { scienceLesson } from "../../../science/lesson";
import type { ScienceLesson } from "../types";

// Temperature as particle speed. Targets "particles expand when heated".
export const heatLesson: ScienceLesson = scienceLesson({
  id: lessonId("heat"),
  title: "Heat",
  warmUp: [
    {
      id: itemId("heat-warm-slide"),
      ordered: true,
      prompt: "In which state do particles slide past each other?",
      choices: [
        wrong("Solid", "Solid particles are held in place. They only vibrate."),
        right("Liquid"),
        wrong("Gas", "Gas particles fly far apart instead of sliding."),
      ],
      hint: "Which one can you pour?",
      explanation: "Liquid particles touch but slide past each other.",
    },
    {
      id: itemId("heat-warm-between"),
      prompt: "What is between the particles of a gas?",
      choices: [
        wrong("Air", "The particles are the air, so there is no air between them."),
        right("Empty space"),
        wrong("Water", "Water would be particles too. Between them is nothing."),
      ],
      hint: "Remember the magnifier on the jar of air.",
      explanation: "Between gas particles there is only empty space.",
    },
  ],
  predict: {
    question: "You heat a sealed jar of gas. What happens to its particles?",
    choices: [
      wrong("They get bigger", "A very common idea, even for grown-ups!"),
      right("They move faster"),
      wrong("They get bigger and faster", "You were right about faster!"),
    ],
    tryIt: "Drag the heat slider all the way up.",
    experiment: "heatGas",
    outcome: "Heat is energy. It makes particles move faster, but each one stays the same size.",
  },
  explain: [
    {
      title: "Heat and motion",
      steps: [
        "Temperature tells you how fast the particles in something are moving, on average.",
        "Add thermal energy and the particles move faster.",
        "Take it away and they slow down.",
        "Next, use the slider to melt, boil, and freeze water.",
      ],
      scene: {
        id: "heat",
        stages: [
          { from: 20, to: 20 },
          { from: 20, to: 90 },
          { from: 90, to: -10 },
          { from: -10, to: 40 },
        ],
      },
    },
  ],
  practise: {
    kind: "heatLab",
    goals: [
      { prompt: "Heat the ice until it melts into a liquid.", target: "liquid" },
      { prompt: "Keep heating until the water boils into a gas.", target: "gas" },
      { prompt: "Now cool it all the way down until it freezes.", target: "solid" },
    ],
  },
  check: [
    {
      id: itemId("heat-steam-ice"),
      prompt: "Steam is much hotter than ice. How do their particles compare?",
      choices: [
        right("Steam particles move faster"),
        wrong("Ice particles move faster", "Ice is colder, so its particles move slower."),
        wrong("They move at the same speed", "Temperature tells you speed, so they cannot match."),
      ],
      hint: "Higher temperature means what for particles?",
      reason: {
        choices: [
          right("Temperature measures how fast particles move"),
          wrong(
            "Steam particles are bigger",
            "Particles never grow when heated. The same particles just move faster.",
          ),
          wrong("Steam particles are lighter", "Steam and ice are the same particles with the same mass."),
        ],
      },
      explanation: "Higher temperature means faster particles, so the steam particles move faster.",
    },
    {
      id: itemId("heat-balloon-sun"),
      prompt: "A balloon left in the hot sun gets bigger. Why?",
      choices: [
        right("The air particles move faster and push harder"),
        wrong("Each air particle gets bigger", "Particles stay the same size when heated."),
        wrong("The sun adds more air", "Sunlight is energy. It cannot add air particles."),
      ],
      hint: "What did heating do to the gas particles in the jar?",
      explanation:
        "Heat speeds up the air particles. They hit the balloon walls harder and more often, pushing it outward.",
    },
    {
      id: itemId("heat-freezing-point"),
      ordered: true,
      prompt: "At what temperature does water freeze?",
      choices: [
        wrong("-10\u00B0C", "Water is already ice at -10\u00B0C. It froze before that."),
        right("0\u00B0C"),
        wrong("32\u00B0C", "32 is the freezing point in Fahrenheit, not Celsius."),
        wrong("100\u00B0C", "100\u00B0C is where water boils."),
      ],
      hint: "Look for the 0\u00B0 mark on the thermometer.",
      explanation: "Water freezes at 0\u00B0C. (32 is the freezing point in Fahrenheit, a different scale.)",
    },
  ],
  debate: {
    situation: "Noah and Zoe watch a balloon grow bigger in the sun.",
    claims: [
      {
        kid: noah,
        says: wrong(
          "The air particles got bigger in the heat.",
          "Particles never grow. Heating only makes them move faster.",
        ),
      },
      { kid: zoe, says: right("The air particles move faster and push the walls harder.") },
    ],
    explanation: "Heat makes the same particles move faster. They push on the balloon harder, so it stretches bigger.",
  },
});
