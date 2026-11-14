import { installedPacks } from "../../src/app/installed";
import type { AnyActivity, ExplainerActivity, PredictActivity } from "../../src/core/course";
import type { ExperimentId as MixturesExperiment, SceneSpec as MixturesScene } from "../../src/courses/mixtures-and-solutions/types";
import type { ExperimentId as StatesExperiment, SceneSpec as StatesScene } from "../../src/courses/states-of-matter/types";
import type { CoursePack } from "../../src/ui/course-pack";
import type { ActivityAt } from "./open";

/** The experiments and scenes the expectation tables know; a test fails for an installed one they lack. */
export type AnyExperimentId = StatesExperiment | MixturesExperiment;
export type AnySceneSpec = StatesScene | MixturesScene;

/** The installed pack for `course`; the first one when none is named. */
export function packOf(course: string | undefined): CoursePack {
  const pack = course === undefined ? installedPacks[0] : installedPacks.find((p) => p.course.id === course);
  if (pack === undefined) throw new Error(`course ${course} is not installed`);
  return pack;
}

/** Every activity of `kind` in the installed courses: where it is, a title naming its course and lesson, and itself. */
export function activitiesOf<A extends AnyActivity>(
  kind: A["kind"],
): { readonly at: ActivityAt; readonly title: string; readonly activity: A }[] {
  return installedPacks.flatMap(({ course }) =>
    course.lessons.flatMap((lesson, l) =>
      lesson.activities.flatMap((activity, a) =>
        activity.kind === kind
          ? [{ at: { course: course.id, lesson: l, activity: a }, title: `${course.title}, ${lesson.title}`, activity: activity as A }]
          : [],
      ),
    ),
  );
}

/** Every experiment the installed courses' predictions use, once each, with its course. */
export function installedExperiments(): { readonly course: string; readonly experiment: AnyExperimentId }[] {
  const seen = new Map<string, { course: string; experiment: AnyExperimentId }>();
  for (const { at, activity } of activitiesOf<PredictActivity<AnyExperimentId>>("predict")) {
    seen.set(`${at.course}/${activity.experiment}`, { course: at.course, experiment: activity.experiment });
  }
  return [...seen.values()];
}

/** Every scene the installed courses' explainers show, once per scene and step count, with its course. */
export function installedScenes(): { readonly course: string; readonly scene: AnySceneSpec; readonly steps: number }[] {
  const seen = new Map<string, { course: string; scene: AnySceneSpec; steps: number }>();
  for (const { at, activity } of activitiesOf<ExplainerActivity<AnySceneSpec>>("explainer")) {
    const entry = { course: at.course, scene: activity.scene, steps: activity.steps.length };
    seen.set(`${at.course}/${JSON.stringify(entry.scene)}/${entry.steps}`, entry);
  }
  return [...seen.values()];
}
