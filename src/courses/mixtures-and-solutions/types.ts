import type { Activity, Lesson } from "../../core/course";

export type ExperimentId = "dissolving" | "meltOrDissolve" | "mass" | "spoons";

export type SceneSpec =
  | { readonly id: "dissolving" }
  | { readonly id: "meltOrDissolve" }
  | { readonly id: "mass" }
  | { readonly id: "spoons" };

export type MixturesActivity = Activity<ExperimentId, SceneSpec>;
export type MixturesLesson = Lesson<MixturesActivity>;
