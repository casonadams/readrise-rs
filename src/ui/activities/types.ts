import type { JSX } from "nsh/jsx-runtime";
import type { ActivityResult } from "../../core/scoring";

/** Every activity screen: it shows `activity` and calls `complete` exactly once when the learner finishes. */
export interface ActivityProps<A> {
  readonly activity: A;
  readonly complete: (result: ActivityResult) => void;
}

/** A hands-on experiment: its controls do nothing until `active`; it calls `onObserved` once, after its result is visible. */
export interface ExperimentProps {
  readonly active: boolean;
  readonly onObserved: () => void;
}

export type RenderExperiment<E> = (experiment: E, props: ExperimentProps) => JSX.Element;

/** An explainer scene is a pure function of the step shown; it animates between steps. */
export type RenderScene<S> = (scene: S, step: () => number) => JSX.Element;

export type RenderVisual<V> = (visual: V) => JSX.Element;
