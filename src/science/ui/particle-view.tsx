import { Canvas, cleanup, effect, reduceMotion, signal, untracked, View } from "nsh";
import type { MatterState } from "../matter";
import { ParticleSim } from "../particle-sim";
import { fillCircle } from "./draw";
import { hexChannels, palette, particleColor } from "./palette";

/** How fast the colour eases toward a new state's colour (per second): it settles in about half a second. */
const colourRate = 8;
/** Still frames under reduced motion: the sim is run this long so the particles settle before they are drawn. */
const settleSteps = 180;

type Rgb = [number, number, number];

/**
 * Animated particles for `state`; `energy` (0..1) sets how fast they move. The simulation steps on every display
 * frame and a canvas redraws from the frame signal. Under reduced motion it shows one settled frame instead.
 */
export function ParticleView(props: { state: MatterState; energy: number }) {
  const sim = new ParticleSim();
  const frame = signal(0);
  let colour = hexChannels(particleColor(props.state));
  let last = 0;
  let raf = 0;

  const tick = (now: number) => {
    const dt = last === 0 ? 0 : Math.min(0.05, (now - last) / 1000);
    last = now;
    sim.step(dt, props.state, props.energy);
    const k = 1 - Math.exp(-colourRate * dt);
    const target = hexChannels(particleColor(props.state));
    colour = [0, 1, 2].map((i) => colour[i] + (target[i] - colour[i]) * k) as Rgb;
    frame.update((n) => n + 1);
    raf = requestAnimationFrame(tick);
  };

  effect(() => {
    if (reduceMotion()) {
      for (let i = 0; i < settleSteps; i++) sim.step(1 / 60, props.state, props.energy);
      colour = hexChannels(particleColor(props.state));
      untracked(() => frame.update((n) => n + 1));
      return;
    }
    last = 0;
    raf = requestAnimationFrame(tick);
    cleanup(() => cancelAnimationFrame(raf));
  });

  const cssRgb = (c: Rgb, mix = 1, over = 0) => `rgb(${c.map((v) => Math.round(over + (v - over) * mix)).join(", ")})`;

  return (
    <View
      style={{
        flex: 1,
        overflow: "hidden",
        padding: 4,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: palette.outlineVariant,
        backgroundColor: cssRgb(colour, 0.06, 255),
      }}
    >
      <Canvas
        style={{ flex: 1 }}
        accessibilityLabel={`Particles in a ${props.state}`}
        draw={(cx, { width, height }) => {
          frame();
          if (width <= 0 || height <= 0) return;
          sim.fit(width, height);
          const scale = Math.min(width / sim.width, height / sim.height);
          const originX = (width - sim.width * scale) / 2;
          const originY = height - sim.height * scale;
          const r = ParticleSim.radius * scale;
          for (const p of sim.particles) {
            const x = originX + p.x * scale;
            const y = originY + p.y * scale;
            cx.fillStyle = cssRgb(colour);
            fillCircle(cx, x, y, r);
            cx.fillStyle = "rgba(255, 255, 255, 0.45)";
            fillCircle(cx, x - r * 0.35, y - r * 0.35, r * 0.32);
          }
        }}
      />
    </View>
  );
}
