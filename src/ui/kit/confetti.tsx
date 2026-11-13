import { Canvas, cleanup, reduceMotion, signal } from "nsh";

const colors = ["#F44336", "#FF9800", "#FFC107", "#4CAF50", "#2196F3", "#9C27B0", "#E91E63"];
const durationMs = 2400;

interface Piece {
  readonly x: number;
  readonly drift: number;
  readonly delay: number;
  readonly speed: number;
  readonly spin: number;
  readonly size: number;
  readonly color: string;
}

/** Deterministic pieces, so every celebration falls the same way. */
function makePieces(count: number): Piece[] {
  let seed = 3;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return Array.from({ length: count }, () => ({
    x: random(),
    drift: (random() - 0.5) * 0.3,
    delay: random() * 0.35,
    speed: 0.6 + random() * 0.5,
    spin: random() * 6,
    size: 6 + random() * 8,
    color: colors[Math.floor(random() * colors.length)],
  }));
}

/** Paper pieces falling once over the screen; nothing under reduced motion. */
export function Confetti(props: { pieces?: number }) {
  const pieces = makePieces(props.pieces ?? 80);
  const progress = signal(0);
  let frame = 0;
  if (!reduceMotion()) {
    let start: number | null = null;
    const tick = (time: number) => {
      start ??= time;
      progress.set(Math.min(1, (time - start) / durationMs));
      if (progress() < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  }
  cleanup(() => cancelAnimationFrame(frame));
  return (
    <Canvas
      class="absolute inset-0 pointer-events-none"
      accessibilityElementsHidden
      draw={(cx, { width, height }) => {
        const value = progress();
        for (const p of pieces) {
          const t = Math.min(1, Math.max(0, (value - p.delay) / (1 - p.delay)));
          if (t === 0 || t === 1) continue;
          cx.save();
          cx.translate((p.x + p.drift * t) * width, (-0.1 + 1.2 * t * p.speed) * height);
          cx.rotate(p.spin * t * 2 * Math.PI);
          cx.globalAlpha = 1 - t * 0.4;
          cx.fillStyle = p.color;
          cx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          cx.restore();
        }
      }}
    />
  );
}
