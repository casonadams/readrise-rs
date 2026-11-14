import type { JSX } from "nsh/jsx-runtime";
import type { AnyActivity, Course } from "../../src/core/course";
import { mixturesAndSolutions } from "../../src/courses/mixtures-and-solutions/course";
import { mixturesPack } from "../../src/courses/mixtures-and-solutions/pack";
import type { ExperimentId as MixturesExperiment, SceneSpec as MixturesScene } from "../../src/courses/mixtures-and-solutions/types";
import { renderExperiment as mixturesExperiment } from "../../src/courses/mixtures-and-solutions/ui/experiments";
import { renderScene as mixturesScene } from "../../src/courses/mixtures-and-solutions/ui/scenes";
import { statesOfMatter } from "../../src/courses/states-of-matter/course";
import { statesOfMatterPack } from "../../src/courses/states-of-matter/pack";
import type { ExperimentId as StatesExperiment, SceneSpec as StatesScene } from "../../src/courses/states-of-matter/types";
import { renderExperiment as statesExperiment } from "../../src/courses/states-of-matter/ui/experiments";
import { renderScene as statesScene } from "../../src/courses/states-of-matter/ui/scenes";
import type { CoursePack } from "../../src/ui/course-pack";
import type { ExperimentProps } from "../../src/ui/activities/types";
import { scene as statesSceneSpec } from "./fixtures";
import type { ActivityAt } from "./open";

/** Any test course's experiments and scenes. */
export type AnyExperimentId = StatesExperiment | MixturesExperiment;
export type AnySceneSpec = StatesScene | MixturesScene;

/** A course the harness can mount, by name: its activities, experiments and scenes (with their step counts). */
export interface TestCourse {
  readonly course: Course<AnyActivity>;
  readonly pack: CoursePack;
  experiment(name: string, props: ExperimentProps): JSX.Element;
  scene(name: string, step: () => number): JSX.Element;
  readonly sceneSteps: Readonly<Record<string, number>>;
}

// Test params are strings; each course's own renderer rejects a name it does not have.
export const testCourses: Readonly<Record<string, TestCourse>> = {
  [statesOfMatter.id]: {
    course: statesOfMatter,
    pack: statesOfMatterPack,
    experiment: (name, props) => statesExperiment(name as StatesExperiment, props),
    scene: (name, step) => statesScene(statesSceneSpec(name), step),
    sceneSteps: { matter: 4, waterMolecule: 5, states: 5, heat: 3, evaporation: 4 },
  },
  [mixturesAndSolutions.id]: {
    course: mixturesAndSolutions,
    pack: mixturesPack,
    experiment: (name, props) => mixturesExperiment(name as MixturesExperiment, props),
    scene: (name, step) => mixturesScene({ id: name } as MixturesScene, step),
    sceneSteps: { dissolving: 4, meltOrDissolve: 4, mass: 4, spoons: 5 },
  },
};

/** Every activity of `kind` in the test courses: where it is, a title naming its course and lesson, and itself. */
export function activitiesOf<A extends AnyActivity>(
  kind: A["kind"],
): { readonly at: ActivityAt; readonly title: string; readonly activity: A }[] {
  return Object.values(testCourses).flatMap(({ course }) =>
    course.lessons.flatMap((lesson, l) =>
      lesson.activities.flatMap((activity, a) =>
        activity.kind === kind
          ? [{ at: { course: course.id, lesson: l, activity: a }, title: `${course.title}, ${lesson.title}`, activity: activity as A }]
          : [],
      ),
    ),
  );
}
