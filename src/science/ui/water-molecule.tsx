import { type CanvasRenderingContext2D, Canvas, cleanup, effect, reduceMotion, signal, Text, View } from "nsh";
import { fillCircle, fitStage } from "./draw";
import { mixHex, palette, withAlpha } from "./palette";
import { FactPill, Pop } from "./parts";
import { createTween, easeInOutBack, easeOut } from "./tween";

interface Point {
  readonly x: number;
  readonly y: number;
}

const stageWidth = 320;
const stageHeight = 250;
const bondLength = 92;
const halfAngle = (52.25 * Math.PI) / 180;
const oxygenRadius = 42;
const hydrogenRadius = 27;
const bob = 6;
const driftSeconds = 3;

const joinedO: Point = { x: 160, y: 92 };
const joinedH1: Point = {
  x: joinedO.x - Math.sin(halfAngle) * bondLength,
  y: joinedO.y + Math.cos(halfAngle) * bondLength,
};
const joinedH2: Point = {
  x: joinedO.x + Math.sin(halfAngle) * bondLength,
  y: joinedO.y + Math.cos(halfAngle) * bondLength,
};
const looseO: Point = { x: 168, y: 190 };
const looseH1: Point = { x: 48, y: 52 };
const looseH2: Point = { x: 278, y: 70 };

/**
 * Step 0: loose atoms drift. Step 1: they join into a molecule. Step 2: the atoms are counted. Step 3: the
 * formula appears. Step 4: the charges appear.
 */
export function WaterMolecule(props: { step: () => number }) {
  const join = createTween(0);
  const halo = createTween(0);
  const charge = createTween(0);
  const drift = signal(0);
  let chargeTimer = 0;
  cleanup(() => clearTimeout(chargeTimer));

  effect(() => join.animateTo(props.step() >= 1 ? 1 : 0, 1100, easeInOutBack));
  effect(() => halo.animateTo(props.step() >= 4 ? 1 : 0, 600));
  effect(() => {
    clearTimeout(chargeTimer);
    if (props.step() < 4) {
      charge.jump(0);
      return;
    }
    chargeTimer = setTimeout(() => charge.animateTo(1, 400, easeOut), 300);
  });

  effect(() => {
    if (reduceMotion()) return;
    let start: number | undefined;
    let raf = 0;
    const tick = (now: number) => {
      start ??= now;
      drift.set(((now - start) / 1000 / driftSeconds) % 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    cleanup(() => cancelAnimationFrame(raf));
  });

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }}>
      <View style={{ flex: 1, width: "100%" }}>
        <Canvas
          style={{ flex: 1 }}
          accessibilityLabel="A water molecule"
          draw={(cx, { width, height }) => {
            fitStage(cx, width, height, stageWidth, stageHeight);
            drawMolecule(cx, join.value(), halo.value(), charge.value(), drift());
          }}
        />
      </View>
      <Pop visible={props.step() >= 2}>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <FactPill label="2 hydrogen" color={palette.grey} />
          <FactPill label="1 oxygen" color={palette.oxygen} />
        </View>
      </Pop>
      <Pop visible={props.step() >= 3}>
        <Text style={{ fontSize: 36, fontWeight: "800", color: palette.onSurface }}>
          {"H\u2082"}
          <Text style={{ color: palette.oxygen }}>O</Text>
        </Text>
      </Pop>
    </View>
  );
}

function drawMolecule(
  cx: CanvasRenderingContext2D,
  join: number,
  halo: number,
  charge: number,
  drift: number,
): void {
  const t = drift * 2 * Math.PI;
  const loose = Math.max(0, Math.min(1, 1 - join));
  const place = (from: Point, to: Point, phase: number): Point => ({
    x: from.x + (to.x - from.x) * join + Math.cos(t + phase) * bob * loose,
    y: from.y + (to.y - from.y) * join + Math.sin(t + phase) * bob * loose,
  });
  const o = place(looseO, joinedO, 0);
  const h1 = place(looseH1, joinedH1, 2);
  const h2 = place(looseH2, joinedH2, 4);

  const bond = Math.max(0, Math.min(1, (join - 0.75) / 0.25));
  if (bond > 0) {
    cx.strokeStyle = withAlpha(palette.bondGrey, bond);
    cx.lineWidth = 10;
    cx.lineCap = "round";
    cx.beginPath();
    cx.moveTo(o.x, o.y);
    cx.lineTo(h1.x, h1.y);
    cx.moveTo(o.x, o.y);
    cx.lineTo(h2.x, h2.y);
    cx.stroke();
  }

  drawHalo(cx, o, oxygenRadius, palette.negative, halo);
  drawHalo(cx, h1, hydrogenRadius, palette.positive, halo);
  drawHalo(cx, h2, hydrogenRadius, palette.positive, halo);
  drawAtom(cx, o, "O", oxygenRadius, palette.oxygen, "#FFFFFF");
  drawAtom(cx, h1, "H", hydrogenRadius, palette.hydrogen, palette.hydrogenInk);
  drawAtom(cx, h2, "H", hydrogenRadius, palette.hydrogen, palette.hydrogenInk);
  drawCharge(cx, o, oxygenRadius, "\u2212", palette.negative, false, charge);
  drawCharge(cx, h1, hydrogenRadius, "+", palette.positive, true, charge);
  drawCharge(cx, h2, hydrogenRadius, "+", palette.positive, false, charge);
}

/** A soft glow around an atom, showing where its charge sits. */
function drawHalo(cx: CanvasRenderingContext2D, at: Point, radius: number, color: string, alpha: number): void {
  if (alpha <= 0) return;
  const reach = radius + 14;
  const glow = cx.createRadialGradient(at.x, at.y, 0, at.x, at.y, reach);
  glow.addColorStop(0, withAlpha(color, 0.35));
  glow.addColorStop(1, withAlpha(color, 0));
  cx.save();
  cx.globalAlpha = alpha;
  cx.fillStyle = glow;
  fillCircle(cx, at.x, at.y, reach);
  cx.restore();
}

function drawAtom(
  cx: CanvasRenderingContext2D,
  at: Point,
  symbol: string,
  radius: number,
  color: string,
  ink: string,
): void {
  const light = { x: at.x - 0.35 * radius, y: at.y - 0.4 * radius };
  const shade = cx.createRadialGradient(light.x, light.y, 0, light.x, light.y, radius * 1.9);
  shade.addColorStop(0, mixHex(color, "#FFFFFF", 0.45));
  shade.addColorStop(0.6, color);
  shade.addColorStop(1, mixHex(color, "#000000", 0.22));
  cx.save();
  cx.shadowColor = "rgba(0, 0, 0, 0.18)";
  cx.shadowBlur = 10;
  cx.shadowOffsetY = 4;
  cx.fillStyle = shade;
  fillCircle(cx, at.x, at.y, radius);
  cx.restore();
  cx.fillStyle = ink;
  cx.font = `800 ${radius * 0.75}px system-ui`;
  cx.textAlign = "center";
  cx.textBaseline = "middle";
  cx.fillText(symbol, at.x, at.y);
}

/** A charge badge (28 points) beside its atom, growing in after its delay. */
function drawCharge(
  cx: CanvasRenderingContext2D,
  at: Point,
  radius: number,
  sign: string,
  color: string,
  onLeft: boolean,
  shown: number,
): void {
  if (shown <= 0) return;
  const offset = radius * 0.72;
  const centre = {
    x: at.x + (onLeft ? -(offset + 8) : offset + 8),
    y: at.y - offset - 8,
  };
  cx.save();
  cx.globalAlpha = Math.min(1, shown);
  cx.translate(centre.x, centre.y);
  const scale = 0.7 + 0.3 * shown;
  cx.scale(scale, scale);
  cx.fillStyle = color;
  fillCircle(cx, 0, 0, 14);
  cx.strokeStyle = "#FFFFFF";
  cx.lineWidth = 2;
  cx.beginPath();
  cx.arc(0, 0, 13, 0, Math.PI * 2);
  cx.stroke();
  cx.fillStyle = "#FFFFFF";
  cx.font = "900 18px system-ui";
  cx.textAlign = "center";
  cx.textBaseline = "middle";
  cx.fillText(sign, 0, 0);
  cx.restore();
}
