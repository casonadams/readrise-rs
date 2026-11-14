import { type Course, courseId } from "../../core/course";
import { science } from "../../science/subject";
import { dissolvingLesson } from "./lessons/dissolving";
import { howMuchLesson } from "./lessons/how-much";
import { massLesson } from "./lessons/mass";
import { meltOrDissolveLesson } from "./lessons/melt-or-dissolve";
import type { MixturesActivity } from "./types";

// Dissolving, solutions and conservation of mass when mixing (NGSS 5-PS1-2, 5-PS1-4, MS-PS1-2).
export const mixturesAndSolutions: Course<MixturesActivity> = {
  id: courseId("mixtures-and-solutions"),
  title: "Mixtures and Solutions",
  grade: "grade6",
  subject: science,
  requires: [courseId("states-of-matter")],
  lessons: [dissolvingLesson, meltOrDissolveLesson, massLesson, howMuchLesson],
};
