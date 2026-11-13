import { Canvas } from "nsh";
import type { Kid } from "../../core/course";

const ink = "#3E2723";
const cheek = "#FF8A8080";

/** A round cartoon face for a classmate, drawn in the kid's skin and hair colours. */
export function KidAvatar(props: { kid: Kid; size?: number }) {
  const size = props.size ?? 56;
  return (
    <Canvas
      style={{ width: size, height: size }}
      draw={(cx, { width, height }) => {
        const r = Math.min(width, height) / 2;
        const pi = Math.PI;
        cx.fillStyle = props.kid.hair;
        cx.beginPath();
        cx.arc(r, r, r, 0, pi * 2);
        cx.fill();
        cx.fillStyle = props.kid.skin;
        cx.beginPath();
        cx.arc(r, r + r * 0.12, r * 0.82, 0, pi * 2);
        cx.fill();
        cx.fillStyle = props.kid.hair;
        cx.beginPath();
        cx.moveTo(r, r);
        cx.arc(r, r, r * 0.95, pi * 1.05, pi * 1.95);
        cx.closePath();
        cx.fill();
        cx.fillStyle = ink;
        cx.beginPath();
        cx.arc(r - r * 0.3, r + r * 0.12, r * 0.09, 0, pi * 2);
        cx.arc(r + r * 0.3, r + r * 0.12, r * 0.09, 0, pi * 2);
        cx.fill();
        cx.strokeStyle = ink;
        cx.lineWidth = r * 0.08;
        cx.lineCap = "round";
        cx.beginPath();
        cx.ellipse(r, r + r * 0.35, r * 0.3, r * 0.2, 0, pi * 0.15, pi * 0.85);
        cx.stroke();
        cx.fillStyle = cheek;
        cx.beginPath();
        cx.arc(r - r * 0.52, r + r * 0.36, r * 0.11, 0, pi * 2);
        cx.arc(r + r * 0.52, r + r * 0.36, r * 0.11, 0, pi * 2);
        cx.fill();
      }}
    />
  );
}
