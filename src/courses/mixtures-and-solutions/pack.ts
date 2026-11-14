import { renderCoreActivity } from "../../ui/activities";
import { coursePack } from "../../ui/course-pack";
import { mixturesAndSolutions } from "./course";
import { renderExperiment } from "./ui/experiments";
import { renderScene } from "./ui/scenes";

export const mixturesPack = coursePack(mixturesAndSolutions, (activity, complete) =>
  renderCoreActivity(activity, complete, { renderExperiment, renderScene }),
);
