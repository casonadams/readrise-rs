import type { Activity, Lesson } from "../core/course";
import type { MatterState } from "./matter";

export type ExperimentId = "balloon" | "zoom" | "heatGas" | "stove";

/** Water heated or cooled from `from` to `to` degrees Celsius. */
export interface HeatStage {
  readonly from: number;
  readonly to: number;
}

export type SceneSpec =
  | { readonly id: "matter" }
  | { readonly id: "waterMolecule" }
  | { readonly id: "states" }
  | { readonly id: "heat"; readonly stages: readonly HeatStage[] };

/** Particles of one state, moving at `energy` on a 0..1 scale. */
export interface ParticleVisual {
  readonly particles: MatterState;
  readonly energy: number;
}

export interface HeatGoal {
  readonly prompt: string;
  readonly target: MatterState;
}

/** Drag a thermometer for a sample of water; each goal asks for a state of matter. */
export interface HeatLabActivity {
  readonly kind: "heatLab";
  readonly goals: readonly HeatGoal[];
  readonly maxXp?: number;
}

export type ScienceActivity = Activity<ExperimentId, SceneSpec, ParticleVisual, HeatLabActivity>;
export type ScienceLesson = Lesson<ScienceActivity>;
