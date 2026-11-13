import { noah, zoe } from "../classmates";
import type { ScienceLesson } from "../types";

// Temperature as particle speed. Targets "particles expand when heated".
export const heatLesson: ScienceLesson = {
  id: "heat",
  title: "Heat",
  activities: [
    {
      kind: "quiz",
      role: "warmUp",
      questions: [
        {
          prompt: "In which state do particles slide past each other?",
          options: ["Solid", "Liquid", "Gas"],
          answer: 1,
          hint: "Which one can you pour?",
          feedback: {
            0: "Solid particles are held in place. They only vibrate.",
            2: "Gas particles fly far apart instead of sliding.",
          },
          explanation: "Liquid particles touch but slide past each other.",
        },
        {
          prompt: "What is between the particles of a gas?",
          options: ["Air", "Empty space", "Water"],
          answer: 1,
          hint: "Remember the magnifier on the jar of air.",
          feedback: {
            0: "The particles are the air, so there is no air between them.",
            2: "Water would be particles too. Between them is nothing.",
          },
          explanation: "Between gas particles there is only empty space.",
        },
      ],
    },
    {
      kind: "predict",
      question: "You heat a sealed jar of gas. What happens to its particles?",
      options: ["They get bigger", "They move faster", "They get bigger and faster"],
      answer: 1,
      tryIt: "Drag the heat slider all the way up.",
      experiment: "heatGas",
      outcome: "Heat is energy. It makes particles move faster, but each one stays the same size.",
      reactions: {
        0: "A very common idea, even for grown-ups!",
        2: "You were right about faster!",
      },
    },
    {
      kind: "explainer",
      title: "Heat and motion",
      steps: [
        "Temperature tells you how fast the particles in something are " + "moving, on average.",
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
    {
      kind: "heatLab",
      goals: [
        { prompt: "Heat the ice until it melts into a liquid.", target: "liquid" },
        { prompt: "Keep heating until the water boils into a gas.", target: "gas" },
        { prompt: "Now cool it all the way down until it freezes.", target: "solid" },
      ],
    },
    {
      kind: "quiz",
      role: "check",
      questions: [
        {
          prompt: "Steam is much hotter than ice. How do their particles compare?",
          options: ["Steam particles move faster", "Ice particles move faster", "They move at the same speed"],
          answer: 0,
          hint: "Higher temperature means what for particles?",
          feedback: {
            1: "Ice is colder, so its particles move slower.",
            2: "Temperature tells you speed, so they cannot match.",
          },
          reason: {
            options: [
              "Temperature measures how fast particles move",
              "Steam particles are bigger",
              "Steam particles are lighter",
            ],
            answer: 0,
            feedback: {
              1: "Particles never grow when heated. The same particles just " + "move faster.",
              2: "Steam and ice are the same particles with the same mass.",
            },
          },
          explanation: "Higher temperature means faster particles, so the steam " + "particles move faster.",
        },
        {
          prompt: "A balloon left in the hot sun gets bigger. Why?",
          options: [
            "The air particles move faster and push harder",
            "Each air particle gets bigger",
            "The sun adds more air",
          ],
          answer: 0,
          hint: "What did heating do to the gas particles in the jar?",
          feedback: {
            1: "Particles stay the same size when heated.",
            2: "Sunlight is energy. It cannot add air particles.",
          },
          explanation:
            "Heat speeds up the air particles. They hit the balloon walls " +
            "harder and more often, pushing it outward.",
        },
        {
          prompt: "At what temperature does water freeze?",
          options: ["-10\u00B0C", "0\u00B0C", "32\u00B0C", "100\u00B0C"],
          answer: 1,
          hint: "Look for the 0\u00B0 mark on the thermometer.",
          feedback: {
            0: "Water is already ice at -10\u00B0C. It froze before that.",
            2: "32 is the freezing point in Fahrenheit, not Celsius.",
            3: "100\u00B0C is where water boils.",
          },
          explanation:
            "Water freezes at 0\u00B0C. (32 is the freezing point in " + "Fahrenheit, a different scale.)",
        },
      ],
    },
    {
      kind: "whoIsRight",
      situation: "Noah and Zoe watch a balloon grow bigger in the sun.",
      claims: [
        { kid: noah, says: "The air particles got bigger in the heat." },
        { kid: zoe, says: "The air particles move faster and push the walls harder." },
      ],
      answer: 1,
      feedback: {
        0: "Particles never grow. Heating only makes them move faster.",
      },
      explanation:
        "Heat makes the same particles move faster. They push on the " +
        "balloon harder, so it stretches bigger.",
    },
  ],
};
