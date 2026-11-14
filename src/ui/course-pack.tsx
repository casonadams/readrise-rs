import type { JSX } from "nsh/jsx-runtime";
import { type Activity, type AnyActivity, type Course, isCoreActivity } from "../core/course";
import type { ActivityResult } from "../core/scoring";
import { type CourseRenderers, renderCoreActivity } from "./activities";
import type { ActivityProps, RenderExperiment, RenderScene } from "./activities/types";

export type RenderActivity<A> = (activity: A, complete: (result: ActivityResult) => void) => JSX.Element;

/**
 * A course and everything that draws it: the one thing the app needs to install a course, and what tests mount
 * its activities, experiments and scenes through.
 */
export interface CoursePack {
  readonly course: Course<AnyActivity>;
  readonly renderActivity: RenderActivity<AnyActivity>;
  readonly renderExperiment: RenderExperiment<unknown>;
  readonly renderScene: RenderScene<unknown>;
}

/**
 * `X`, the course's own activity kinds, comes from `ExtraView` alone (the screen for them), so a course whose
 * lessons use a kind no screen draws does not compile.
 */
export function coursePack<E, S, V = never, X extends AnyActivity = never>(
  course: Course<Activity<E, S, V, NoInfer<X>>>,
  renderers: CourseRenderers<E, S, V> & { readonly ExtraView?: (props: ActivityProps<X>) => JSX.Element },
): CoursePack {
  // Only this course's own activities, experiments and scenes are ever passed back to its renderers.
  const renderActivity: RenderActivity<AnyActivity> = (activity, complete) => {
    if (isCoreActivity(activity)) return renderCoreActivity(activity as Activity<E, S, V>, complete, renderers);
    const Extra = renderers.ExtraView;
    if (Extra === undefined) throw new Error(`${course.id} has no screen for ${activity.kind}`);
    return <Extra activity={activity as X} complete={complete} />;
  };
  return {
    course,
    renderActivity,
    renderExperiment: (experiment, props) => renderers.renderExperiment(experiment as E, props),
    renderScene: (scene, step) => renderers.renderScene(scene as S, step),
  };
}
