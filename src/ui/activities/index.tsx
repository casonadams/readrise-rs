import type { JSX } from "nsh/jsx-runtime";
import type { ActivityResult } from "../../core/scoring";
import { renderExperiment } from "../../science/ui/experiments";
import { HeatLabView } from "../../science/ui/heat-lab-view";
import { renderScene } from "../../science/ui/scenes";
import { renderVisual } from "../../science/ui/visuals";
import type { ScienceActivity } from "../../science/types";
import { ExplainerView } from "./explainer";
import { PredictView } from "./predict";
import { QuizView } from "./quiz";
import { SortView } from "./sort";
import { WhoIsRightView } from "./who-is-right";

export function renderScienceActivity(activity: ScienceActivity, complete: (result: ActivityResult) => void): JSX.Element {
  switch (activity.kind) {
    case "quiz":
      return <QuizView activity={activity} complete={complete} renderVisual={renderVisual} />;
    case "predict":
      return <PredictView activity={activity} complete={complete} renderExperiment={renderExperiment} />;
    case "explainer":
      return <ExplainerView activity={activity} complete={complete} renderScene={renderScene} />;
    case "sort":
      return <SortView activity={activity} complete={complete} />;
    case "whoIsRight":
      return <WhoIsRightView activity={activity} complete={complete} />;
    case "heatLab":
      return <HeatLabView activity={activity} complete={complete} />;
  }
}
