import { type Course, courseId } from "../../core/course";
import { science } from "../../science/subject";
import { changesLesson } from "./lessons/changes";
import { evaporationLesson } from "./lessons/evaporation";
import { heatLesson } from "./lessons/heat";
import { matterLesson } from "./lessons/matter";
import { statesLesson } from "./lessons/states";
import type { ScienceActivity } from "./types";

// Matter, particles, states, heat and changes of state (NGSS MS-PS1-1, -4, -5).
export const statesOfMatter: Course<ScienceActivity> = {
  id: courseId("states-of-matter"),
  title: "States of Matter",
  grade: "grade6",
  subject: science,
  requires: [],
  lessons: [matterLesson, statesLesson, heatLesson, changesLesson, evaporationLesson],
};
