import { renderCoreActivity } from "../../ui/activities";
import { coursePack } from "../../ui/course-pack";
import { statesOfMatter } from "./course";
import { renderExperiment } from "./ui/experiments";
import { HeatLabView } from "./ui/heat-lab-view";
import { renderScene } from "./ui/scenes";
import { renderVisual } from "./ui/visuals";

export const statesOfMatterPack = coursePack(statesOfMatter, (activity, complete) =>
  activity.kind === "heatLab" ? (
    <HeatLabView activity={activity} complete={complete} />
  ) : (
    renderCoreActivity(activity, complete, { renderExperiment, renderScene, renderVisual })
  ),
);
