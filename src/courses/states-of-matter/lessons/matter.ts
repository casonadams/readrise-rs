import { right, wrong } from "../../../core/course";
import { leo, mia } from "../../../science/classmates";
import type { ScienceLesson } from "../types";

// Is air matter? Targets "air weighs nothing" and "light is matter".
export const matterLesson: ScienceLesson = {
  id: "matter",
  title: "Matter",
  activities: [
    {
      kind: "predict",
      question: "Two empty balloons balance on a scale. What happens if you pump air into one?",
      choices: [
        right("It tips toward the full balloon"),
        wrong("It tips toward the empty balloon", "Some balloons float, but plain air still has mass."),
        wrong("It stays level", "Air is easy to forget because you cannot see it."),
      ],
      tryIt: "Tap Pump to fill the right balloon with air.",
      experiment: "balloon",
      outcome: "Air has mass, so the full balloon is heavier. Air also takes up space. That makes air matter.",
    },
    {
      kind: "explainer",
      title: "Everything is matter",
      steps: [
        "Matter is anything that has mass and takes up space.",
        "Rocks, water, and even the air you breathe are matter.",
        "Light, heat, and sound are forms of energy.",
        "Energy is not matter. It has no mass and takes up no space.",
      ],
      scene: { id: "matter" },
    },
    {
      kind: "explainer",
      title: "Tiny particles",
      steps: [
        "All matter is made of tiny particles called atoms.",
        "Atoms join together in groups called molecules.",
        "One water molecule has 3 atoms: 2 hydrogen atoms and 1 oxygen atom.",
        "That is why water is written H2O.",
        "Oxygen pulls electrons closer, so it is slightly negative (\u2212). The hydrogen atoms are slightly " +
          "positive (+).",
      ],
      scene: { id: "waterMolecule" },
    },
    {
      kind: "sort",
      prompt: "Is it matter?",
      hint: "Ask: does it have mass and take up space? If yes, it is matter. If it is a kind of energy, it is not.",
      bins: ["Matter", "Not matter"],
      items: [
        { label: "Rock", bin: 0, why: "A rock has mass and takes up space." },
        { label: "Light", bin: 1, why: "Light is energy. It has no mass." },
        { label: "Water", bin: 0, why: "Water fills a cup, so it takes up space." },
        { label: "Sound", bin: 1, why: "Sound is energy moving through matter." },
        { label: "Air", bin: 0, why: "Air fills a balloon and has mass." },
        { label: "Heat", bin: 1, why: "Heat is energy. It takes up no space." },
        { label: "Wood", bin: 0, why: "Wood has mass and takes up space." },
      ],
    },
    {
      kind: "quiz",
      role: "check",
      questions: [
        {
          prompt: "Is air matter?",
          choices: [right("Yes"), wrong("No", "The full balloon tipped the scale, so air has mass.")],
          hint: "Remember what the balloon did to the scale.",
          reason: {
            choices: [
              right("It has mass and takes up space"),
              wrong("You can feel the wind", "Wind is a clue, but matter means having mass and taking up space."),
              wrong("Everything you cannot see is matter", "Light is invisible too, and light is not matter."),
            ],
          },
          explanation:
            "Air has mass (it tipped the scale) and takes up space (it filled the balloon). That makes it matter.",
        },
        {
          prompt: "What are atoms?",
          choices: [
            right("The tiny particles all matter is made of"),
            wrong("A kind of energy", "Energy is not matter, but atoms are the pieces of matter."),
            wrong("Only found in solids", "Liquids and gases are made of atoms too."),
          ],
          hint: "Think about what everything is made of.",
          explanation: "Every kind of matter, solid, liquid, or gas, is made of atoms.",
        },
        {
          prompt: "How many atoms are in one water molecule (H2O)?",
          choices: [
            wrong("1", "H2O names more than one atom: H, H, and O."),
            wrong("2", "The 2 counts only the hydrogen. Add the oxygen too."),
            right("3"),
            wrong("4", "Water has 2 hydrogen and 1 oxygen. Count again."),
          ],
          hint: "Count the H atoms (the 2 in H2O) and add the O.",
          explanation: "Two hydrogen atoms plus one oxygen atom makes 3 atoms.",
        },
      ],
    },
    {
      kind: "whoIsRight",
      situation: "Mia and Leo see a sunbeam shining through a dusty room.",
      claims: [
        {
          kid: mia,
          says: wrong(
            "The sunbeam is matter, because I can see it.",
            "Seeing something does not make it matter. Light has no mass and takes up no space.",
          ),
        },
        { kid: leo, says: right("The light is energy. The dust floating in it is matter.") },
      ],
      explanation:
        "Light is energy: it has no mass and takes up no space. The dust specks are tiny bits of matter that the " +
        "light lets you see.",
    },
  ],
};
