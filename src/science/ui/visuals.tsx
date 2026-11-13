import { View } from "nsh";
import type { RenderVisual } from "../../ui/activities/types";
import type { ParticleVisual } from "../types";
import { ParticleView } from "./particle-view";

/** A quiz's picture of particles, filling the space the quiz gives it. */
export const renderVisual: RenderVisual<ParticleVisual> = (visual) => (
  <View style={{ flex: 1 }}>
    <ParticleView state={visual.particles} energy={visual.energy} />
  </View>
);
