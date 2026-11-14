import type { RenderScene } from "../../../ui/activities/types";
import { Eased } from "../../../science/ui/eased";
import type { SceneSpec } from "../types";
import { DissolvingView, MassView, MeltOrDissolveView, SpoonsView } from "./experiments";

const spoonsAt = [1, 3, 5, 6, 6];

/** The scenes that show their experiment's view eased to each step's value. */
const eased = {
  dissolving: { frames: [0, 0.4, 1, 1], View: DissolvingView },
  meltOrDissolve: { frames: [0, 0.5, 1, 1], View: MeltOrDissolveView },
  mass: { frames: [0, 0.5, 1, 1], View: MassView },
} as const;

/** Each scene shows its experiment's view a little further on at each step; the spoons scene adds spoons. */
export const renderScene: RenderScene<SceneSpec> = (scene, step) =>
  scene.id === "spoons" ? (
    <SpoonsView value={spoonsAt[step()]} />
  ) : (
    <Eased frames={eased[scene.id].frames} step={step} View={eased[scene.id].View} />
  );
