import { Text, View } from "nsh";
import type { JSX } from "nsh/jsx-runtime";
import { ParticleView } from "../../../science/ui/particle-view";
import { ink, withAlpha } from "../../../science/ui/palette";

/** Water particles in the glass at the start. */
const waterParticles = 30;

/** Particles that evaporate over the whole week. */
export const evaporatedInAWeek = 10;

/** Particles that have left the glass after `time` (0..1) of the week. */
export function evaporatedAt(time: number): number {
  return Math.round(time * evaporatedInAWeek);
}

function Labelled(props: { label: string; children: JSX.Element }) {
  return (
    <View style={{ flex: 1 }}>
      {props.children}
      <View
        style={{
          position: "absolute",
          left: 10,
          top: 6,
          paddingHorizontal: 4,
          borderRadius: 6,
          backgroundColor: withAlpha(ink.surface(), 0.85),
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: "600", color: ink.muted() }}>{props.label}</Text>
      </View>
    </View>
  );
}

/**
 * A glass of water beside the air. As `value` (0..1 of a week) passes, particles leave the water's surface and fly
 * in the air as a gas; the counts in the labels show that every particle is still there. Side by side, each box
 * stays taller than wide when the experiment is small, so the particles keep their size.
 */
export function EvaporationView(props: { value: number }) {
  const inAir = () => evaporatedAt(props.value);
  const inGlass = () => waterParticles - inAir();
  return (
    <View style={{ flex: 1, flexDirection: "row", gap: 8 }}>
      <Labelled label={`In the glass: ${inGlass()}`}>
        <ParticleView state="liquid" energy={0.5} count={inGlass()} />
      </Labelled>
      <Labelled label={`In the air: ${inAir()}`}>
        <ParticleView state="gas" energy={0.55} count={inAir()} />
      </Labelled>
    </View>
  );
}
