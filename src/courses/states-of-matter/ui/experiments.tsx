import { type CanvasRenderingContext2D, Canvas, effect, signal, Text, View } from "nsh";
import type { JSX } from "nsh/jsx-runtime";
import type { ExperimentProps, RenderExperiment } from "../../../ui/activities/types";
import { SubjectColor } from "../../../ui/kit/theme";
import { energyAt, waterStateAt } from "../../../science/matter";
import type { ExperimentId } from "../types";
import { fillCircle, fitStage } from "../../../science/ui/draw";
import { controlledExperiment, sliderControl, tapControl } from "../../../science/ui/experiment";
import { ParticleView } from "../../../science/ui/particle-view";
import { dartRound, ink, mixHex, palette } from "../../../science/ui/palette";
import { FactPill, Pop } from "../../../science/ui/parts";
import { createTween, easeIn, easeOutBack, elasticOut } from "../../../science/ui/tween";

const pumpsToFill = 4;

/** Two identical empty balloons balance. Each pump of air fills the right one: it grows, and the scale tips. */
function Balloon(props: { value: number }) {
  const air = createTween(0);
  const tilt = createTween(0);
  effect(() => {
    const target = props.value / pumpsToFill;
    air.animateTo(target, 600, easeOutBack);
    tilt.animateTo(target * balanceMaxTilt, 1200, elasticOut);
  });
  return (
    <View style={{ flex: 1, gap: 8 }}>
      <View style={{ flex: 1 }}>
        <Canvas
          style={{ flex: 1 }}
          accessibilityLabel="Two balloons on a balance scale"
          draw={(cx, { width, height }) => drawBalance(cx, width, height, air.value(), tilt.value())}
        />
      </View>
      <If when={props.value === pumpsToFill}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
          <Pop visible={true}>
            <FactPill label="Takes up space" icon={"\u{1F4E6}"} />
          </Pop>
          <Pop visible={true} delay={300}>
            <FactPill label="Has mass" icon={"\u2696\uFE0F"} />
          </Pop>
        </View>
      </If>
    </View>
  );
}

const balanceMaxTilt = 0.16;

interface Point {
  readonly x: number;
  readonly y: number;
}

/** Draws the balance in its 320 x 300 design space, fitted to the canvas with room at the sides for a full balloon. */
function drawBalance(cx: CanvasRenderingContext2D, width: number, height: number, air: number, tilt: number): void {
  const margin = 14;
  fitStage(cx, width, height, 320 + margin * 2, 300);
  cx.translate(margin, 0);
  const pivot: Point = { x: 160, y: 84 };
  const arm = { x: Math.cos(tilt) * 116, y: Math.sin(tilt) * 116 };
  const metal = ink.muted();

  cx.fillStyle = metal;
  cx.beginPath();
  cx.roundRect(100, 281, 120, 14, 7);
  cx.fill();
  cx.beginPath();
  cx.roundRect(155, pivot.y, 10, 200, 5);
  cx.fill();

  cx.strokeStyle = metal;
  cx.lineWidth = 8;
  cx.lineCap = "round";
  cx.beginPath();
  cx.moveTo(pivot.x - arm.x, pivot.y - arm.y);
  cx.lineTo(pivot.x + arm.x, pivot.y + arm.y);
  cx.stroke();
  cx.fillStyle = SubjectColor();
  fillCircle(cx, pivot.x, pivot.y, 11);
  cx.fillStyle = palette.onPrimary;
  fillCircle(cx, pivot.x, pivot.y, 4);

  drawBalloon(cx, drawPan(cx, { x: pivot.x - arm.x, y: pivot.y - arm.y }), 0);
  drawBalloon(cx, drawPan(cx, { x: pivot.x + arm.x, y: pivot.y + arm.y }), air);
}

/** A hanging pan; returns the middle of the surface it holds. */
function drawPan(cx: CanvasRenderingContext2D, end: Point): Point {
  const rim = { x: end.x, y: end.y + 118 };
  cx.strokeStyle = ink.outline();
  cx.lineWidth = 2;
  cx.beginPath();
  cx.moveTo(end.x, end.y);
  cx.lineTo(rim.x - 44, rim.y);
  cx.moveTo(end.x, end.y);
  cx.lineTo(rim.x + 44, rim.y);
  cx.stroke();
  cx.fillStyle = ink.muted();
  fillCircle(cx, end.x, end.y, 4);
  cx.beginPath();
  cx.moveTo(rim.x - 44, rim.y);
  cx.quadraticCurveTo(rim.x, rim.y + 22, rim.x + 44, rim.y);
  cx.closePath();
  cx.fill();
  return { x: rim.x, y: rim.y + 4 };
}

function drawBalloon(cx: CanvasRenderingContext2D, base: Point, air: number): void {
  const width = 26 + 70 * air;
  const height = 30 + 70 * air;
  const centre = { x: base.x, y: base.y - (height / 2 + 6) };
  const left = centre.x - width / 2;
  const top = centre.y - height / 2;

  const glow = cx.createRadialGradient(
    left + width * 0.3,
    top + height * 0.25,
    0,
    left + width * 0.3,
    top + height * 0.25,
    0.9 * Math.min(width, height),
  );
  glow.addColorStop(0, mixHex(palette.hot, "#FFFFFF", 0.35));
  glow.addColorStop(0.55, palette.hot);
  glow.addColorStop(1, mixHex(palette.hot, "#000000", 0.25));
  cx.fillStyle = glow;
  cx.beginPath();
  cx.ellipse(centre.x, centre.y, width / 2, height / 2, 0, 0, Math.PI * 2);
  cx.fill();

  cx.fillStyle = "rgba(255, 255, 255, 0.5)";
  cx.beginPath();
  cx.ellipse(left + width * 0.28, top + height * 0.24, width * 0.08, height * 0.1, 0, 0, Math.PI * 2);
  cx.fill();

  const knot = { x: centre.x, y: top + height - 1 };
  cx.fillStyle = mixHex(palette.hot, "#000000", 0.25);
  cx.beginPath();
  cx.moveTo(knot.x, knot.y);
  cx.lineTo(knot.x - 5, knot.y + 7);
  cx.lineTo(knot.x + 5, knot.y + 7);
  cx.closePath();
  cx.fill();
}

/** A jar of air seen through a magnifier. Zooming in grows the lens until it shows the gas particles. */
function Zoom(props: { value: number }) {
  const size = signal({ width: 0, height: 0 });
  const jarOpacity = createTween(1);
  effect(() => jarOpacity.animateTo(1 - props.value * 0.8, 200));
  const lens = () => {
    const room = Math.max(0, Math.min(size().width, size().height) - 12);
    const start = Math.min(64, room);
    return start + (room - start) * easeIn(props.value);
  };
  return (
    <View
      style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
      onLayout={({ bounds }) => size.set({ width: bounds.size.width, height: bounds.size.height })}
    >
      <Canvas
        style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }}
        accessibilityLabel="A jar of air"
        draw={(cx, { width, height }) => drawJar(cx, width, height, jarOpacity.value(), props.value < 0.05)}
      />
      <View
        style={{
          width: lens(),
          height: lens(),
          borderRadius: lens() / 2,
          borderWidth: 5,
          borderColor: SubjectColor(),
          overflow: "hidden",
        }}
      >
        <ParticleView state="gas" energy={0.4} />
      </View>
      <View style={{ position: "absolute", bottom: 8, left: 0, right: 0, alignItems: "center" }}>
        <Pop visible={zoomedIn(props.value)}>
          <FactPill label="Between particles: nothing at all" icon={"\u25A2"} color={palette.purple} />
        </Pop>
      </View>
    </View>
  );
}

const zoomedIn = (zoom: number) => zoom >= 0.98;

function drawJar(cx: CanvasRenderingContext2D, width: number, height: number, opacity: number, label: boolean): void {
  const jarWidth = width * 0.62;
  const jarHeight = height * 0.92;
  const x = (width - jarWidth) / 2;
  const y = (height - jarHeight) / 2;
  cx.globalAlpha = opacity;
  cx.fillStyle = ink.muted();
  cx.beginPath();
  cx.roundRect(x + jarWidth * 0.15, y, jarWidth * 0.7, 16, 6);
  cx.fill();
  cx.beginPath();
  cx.roundRect(x, y + 16, jarWidth, jarHeight - 16, [18, 18, 36, 36]);
  cx.fillStyle = "rgba(3, 169, 244, 0.08)";
  cx.fill();
  cx.strokeStyle = ink.outline();
  cx.lineWidth = 3;
  cx.stroke();
  cx.globalAlpha = 1;
  if (label) {
    cx.fillStyle = ink.muted();
    cx.font = "500 16px system-ui";
    cx.textAlign = "center";
    cx.textBaseline = "middle";
    cx.fillText("A jar of air", width / 2, height * 0.88);
  }
}

/** A sealed jar of gas over a flame. Turning up the heat speeds the particles up while their size stays the same. */
function HeatGas(props: { value: number }) {
  const energy = () => 0.05 + 0.95 * props.value;
  return (
    <View style={{ flex: 1, gap: 10 }}>
      <View style={{ flex: 1 }}>
        <ParticleView state="gas" energy={energy()} />
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
        <FactPill
          label={`Speed: ${energy() < 0.35 ? "Slow" : energy() < 0.7 ? "Medium" : "Fast"}`}
          icon={"\u26A1"}
          color={mixHex(palette.cold, palette.hot, props.value)}
        />
        <FactPill label="Particle size: same" icon={"\u25CF"} />
      </View>
    </View>
  );
}

const stoveStart = 20;
const stoveEnd = 110;
const stoveCelsius = (heat: number) => stoveStart + (stoveEnd - stoveStart) * heat;

/** A pot of water on a stove. Turning it up past 100 C boils the water: the particles themselves fly off as a gas. */
function Stove(props: { value: number }) {
  const celsius = () => stoveCelsius(props.value);
  return (
    <View style={{ flex: 1 }}>
      <View style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }}>
        <ParticleView state={waterStateAt(celsius())} energy={energyAt(celsius())} />
      </View>
      <View style={{ position: "absolute", left: 12, top: 8 }}>
        <Text style={{ fontSize: 24, fontWeight: "600", color: mixHex(palette.cold, palette.hot, props.value) }}>
          {`${dartRound(celsius())}\u00B0C`}
        </Text>
      </View>
      <View style={{ position: "absolute", bottom: 8, left: 0, right: 0, alignItems: "center" }}>
        <Pop visible={waterStateAt(celsius()) === "gas"}>
          <FactPill label="The water itself is now a gas" icon={"\u{1F4A7}"} color={palette.purple} />
        </Pop>
      </View>
    </View>
  );
}

const heatSlider = (label: string) =>
  sliderControl({ label, low: "\u2744\uFE0F", high: "\u{1F525}", color: palette.flame });

/** The course's experiments; each one's control does nothing until `active`, and it reports `onObserved` once. */
const experiments: Record<ExperimentId, (props: ExperimentProps) => JSX.Element> = {
  balloon: controlledExperiment({
    control: tapControl({ label: "Pump", presses: pumpsToFill }),
    observed: (pumps) => pumps === pumpsToFill,
    View: Balloon,
    settle: 1400,
  }),
  zoom: controlledExperiment({
    control: sliderControl({ label: "Zoom", low: "\u{1F50D}", high: "\u{1F50E}" }),
    observed: zoomedIn,
    View: Zoom,
  }),
  heatGas: controlledExperiment({ control: heatSlider("Heat"), observed: (heat) => heat >= 0.98, View: HeatGas }),
  stove: controlledExperiment({
    control: heatSlider("Stove"),
    observed: (heat) => waterStateAt(stoveCelsius(heat)) === "gas",
    View: Stove,
  }),
};

export const renderExperiment: RenderExperiment<ExperimentId> = (experiment, props) => experiments[experiment](props);
