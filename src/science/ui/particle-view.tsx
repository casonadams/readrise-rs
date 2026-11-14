import { Canvas, type CanvasRenderingContext2D, cleanup, effect, reduceMotion, signal, untracked, View } from "nsh";
import { seededRandom } from "../../core/random";
import type { MatterState } from "../matter";
import { type Particle, ParticleSim } from "../particle-sim";
import { fillCircle } from "./draw";
import { hexChannels, ink, palette, particleColor, withAlpha } from "./palette";

/** How fast the colour eases toward a new state's colour (per second): it settles in about half a second. */
const colourRate = 8;
/** Still frames under reduced motion: the sim is run this long so the particles settle before they are drawn. */
const settleSteps = 180;
/** While a slider keeps changing it, a still frame settles again at most this often, and once after the last change. */
const resettleMs = 150;

type Rgb = [number, number, number];

/**
 * A still frame's scheduler: the first call settles at once, later ones at most every `resettleMs`, and the last
 * change always gets a settle of its own.
 */
function stillFrames(settle: () => void): () => void {
  let settled = false;
  let lastSettle = 0;
  let pending: ReturnType<typeof setTimeout> | undefined;
  cleanup(() => clearTimeout(pending));
  const run = () => {
    pending = undefined;
    lastSettle = Date.now();
    settle();
  };
  return () => {
    if (!settled) {
      settled = true;
      return run();
    }
    if (pending === undefined) pending = setTimeout(run, Math.max(0, lastSettle + resettleMs - Date.now()));
  };
}

/**
 * Animated particles for `state`; `energy` (0..1) sets how fast they move, `seed` where they start and how
 * they jostle, and `count` keeps fewer than the full set (liquid or gas only). Sugar: `dissolved` particles move
 * with the water and `undissolved` ones stay in a crystal, drawn as one block. The simulation steps on every
 * display frame and a canvas redraws from the frame signal. Under reduced motion it shows a settled still frame.
 */
export function ParticleView(props: {
  state: MatterState;
  energy: number;
  seed?: number;
  count?: number;
  dissolved?: number;
  undissolved?: number;
}) {
  const sim = new ParticleSim({ random: seededRandom(props.seed ?? 1) });
  const frame = signal(0);
  let colour = hexChannels(particleColor(props.state));
  let last = 0;
  let raf = 0;

  const keepCount = () => {
    if (props.count !== undefined) sim.resize(props.count);
    sim.setSugar(props.dissolved ?? 0, props.undissolved ?? 0);
  };

  const tick = (now: number) => {
    const dt = last === 0 ? 0 : Math.min(0.05, (now - last) / 1000);
    last = now;
    keepCount();
    sim.step(dt, props.state, props.energy);
    const k = 1 - Math.exp(-colourRate * dt);
    const target = hexChannels(particleColor(props.state));
    colour = [0, 1, 2].map((i) => colour[i] + (target[i] - colour[i]) * k) as Rgb;
    frame.update((n) => n + 1);
    raf = requestAnimationFrame(tick);
  };

  /** What the still frame shows: reading them in an effect makes a change of any one a reason to settle again. */
  const inputs = () => [props.state, props.energy, props.count, props.dissolved, props.undissolved];
  const settle = () => {
    keepCount();
    for (let i = 0; i < settleSteps; i++) sim.step(1 / 60, props.state, props.energy);
    colour = hexChannels(particleColor(props.state));
    frame.update((n) => n + 1);
  };
  const changed = stillFrames(settle);

  effect(() => {
    if (reduceMotion()) {
      inputs();
      untracked(changed);
      return;
    }
    last = 0;
    raf = requestAnimationFrame(tick);
    cleanup(() => cancelAnimationFrame(raf));
  });

  const cssRgb = (c: Rgb, mix = 1, over: Rgb = c) =>
    `rgb(${c.map((v, i) => Math.round(over[i] + (v - over[i]) * mix)).join(", ")})`;

  return (
    <View
      style={{
        flex: 1,
        overflow: "hidden",
        padding: 4,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: ink.faint(),
        backgroundColor: cssRgb(colour, 0.06, hexChannels(ink.surface())),
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
          drawCrystal(cx, sim.particles.filter((p) => p.held), scale, originX, originY, r);
          for (const p of sim.particles) {
            const x = originX + p.x * scale;
            const y = originY + p.y * scale;
            cx.fillStyle = p.sugar ? palette.sugar : cssRgb(colour);
            fillCircle(cx, x, y, r);
            cx.fillStyle = "rgba(255, 255, 255, 0.45)";
            fillCircle(cx, x - r * 0.35, y - r * 0.35, r * 0.32);
          }
        }}
      />
    </View>
  );
}

/** A translucent block behind the sugar still in its crystal, so the cube reads as one solid piece. */
function drawCrystal(
  cx: CanvasRenderingContext2D,
  held: readonly Particle[],
  scale: number,
  originX: number,
  originY: number,
  r: number,
): void {
  if (held.length === 0) return;
  const xs = held.map((p) => originX + p.x * scale);
  const ys = held.map((p) => originY + p.y * scale);
  const pad = r * 1.3;
  const left = Math.min(...xs) - pad;
  const top = Math.min(...ys) - pad;
  cx.beginPath();
  cx.roundRect(left, top, Math.max(...xs) + pad - left, Math.max(...ys) + pad - top, r * 0.8);
  cx.fillStyle = withAlpha(palette.sugar, 0.18);
  cx.fill();
  cx.strokeStyle = withAlpha(palette.sugar, 0.6);
  cx.lineWidth = 2;
  cx.stroke();
}
