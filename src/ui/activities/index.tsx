import type { JSX } from "nsh/jsx-runtime";
import type { Activity } from "../../core/course";
import type { ActivityResult } from "../../core/scoring";
import { ExplainerView } from "./explainer";
import { PredictView } from "./predict";
import { QuizView } from "./quiz";
import { SortView } from "./sort";
import type { RenderExperiment, RenderScene, RenderVisual } from "./types";
import { WhoIsRightView } from "./who-is-right";

/** What a course draws inside the shared activities: its experiments, explainer scenes and quiz pictures. */
export interface CourseRenderers<E, S, V> {
  readonly renderExperiment: RenderExperiment<E>;
  readonly renderScene: RenderScene<S>;
  readonly renderVisual?: RenderVisual<V>;
}

/** The screen for one of the activities every course can use. */
export function renderCoreActivity<E, S, V>(
  activity: Activity<E, S, V>,
  complete: (result: ActivityResult) => void,
  renderers: CourseRenderers<E, S, V>,
): JSX.Element {
  switch (activity.kind) {
    case "quiz":
      return <QuizView activity={activity} complete={complete} renderVisual={renderers.renderVisual} />;
    case "predict":
      return <PredictView activity={activity} complete={complete} renderExperiment={renderers.renderExperiment} />;
    case "explainer":
      return <ExplainerView activity={activity} complete={complete} renderScene={renderers.renderScene} />;
    case "sort":
      return <SortView activity={activity} complete={complete} />;
    case "whoIsRight":
      return <WhoIsRightView activity={activity} complete={complete} />;
  }
}
