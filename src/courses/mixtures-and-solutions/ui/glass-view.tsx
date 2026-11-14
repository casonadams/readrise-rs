import { View } from "nsh";
import type { JSX } from "nsh/jsx-runtime";
import { ParticleView } from "../../../science/ui/particle-view";
import { Pop } from "../../../science/ui/parts";

/** Sugar particles in one sugar cube. */
export const sugarCube = 12;

/** Sugar cube particles dissolved after stirring `stir` (0..1) of the way. */
export function dissolvedAt(stir: number): number {
  return Math.round(stir * sugarCube);
}

/**
 * A glass of water seen at particle size: `dissolved` sugar particles spread through it, `undissolved` ones still
 * solid on the floor, and one row of `facts` underneath. `banner` pops up inside the glass when `bannerShown`, so it
 * never takes height from the particles.
 */
export function GlassView(props: {
  dissolved: number;
  undissolved: number;
  facts: JSX.Element[];
  banner: JSX.Element;
  bannerShown: boolean;
}) {
  return (
    <View style={{ flex: 1, gap: 10 }}>
      <View style={{ flex: 1 }}>
        <ParticleView state="liquid" energy={0.5} dissolved={props.dissolved} undissolved={props.undissolved} />
        <View style={{ position: "absolute", left: 0, right: 0, top: 10, alignItems: "center" }}>
          <Pop visible={props.bannerShown}>{props.banner}</Pop>
        </View>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 8 }}>{props.facts}</View>
    </View>
  );
}
