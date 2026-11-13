import { type CanvasRenderingContext2D, Canvas, effect, signal, Text, View } from "nsh";
import type { RenderScene } from "../../ui/activities/types";
import { SubjectColor } from "../../ui/kit/theme";
import { changeName, energyAt, type MatterState, speedWord, waterStateAt } from "../matter";
import type { HeatStage, SceneSpec } from "../types";
import { ParticleView } from "./particle-view";
import { dartRound, mixHex, palette, particleColor, stateName, temperatureColor, withAlpha } from "./palette";
import { FactPill, Pop } from "./parts";
import { createTween, easeInOut } from "./tween";
import { WaterMolecule } from "./water-molecule";

/** The explainer scene for `scene`: a pure function of `step`, which animates between steps. */
export const renderScene: RenderScene<SceneSpec> = (scene, step) => {
  switch (scene.id) {
    case "matter":
      return <MatterExplainer step={step} />;
    case "waterMolecule":
      return <WaterMolecule step={step} />;
    case "states":
      return <StatesScene step={step} />;
    case "heat":
      return <HeatScene stages={scene.stages} step={step} />;
  }
};

const matterStageWidth = 350;
const matterStageHeight = 365;
const panelWidth = (matterStageWidth - 12) / 2;

interface Thing {
  readonly glyph: string;
  readonly label: string;
  readonly color: string;
}

const matterThings: readonly Thing[] = [
  { glyph: "\u26F0\uFE0F", label: "Rock", color: palette.rock },
  { glyph: "\u{1F4A7}", label: "Water", color: palette.water },
  { glyph: "\u{1F4A8}", label: "Air", color: palette.air },
];

const energyThings: readonly Thing[] = [
  { glyph: "\u{1F4A1}", label: "Light", color: palette.light },
  { glyph: "\u{1F525}", label: "Heat", color: palette.flame },
  { glyph: "\u{1F50A}", label: "Sound", color: palette.sound },
];

const stagger = 180;

/**
 * "Everything is matter": a Matter panel that ticks off mass and space, then slides aside for an Energy panel
 * that crosses them out.
 */
function MatterExplainer(props: { step: () => number }) {
  const box = signal({ width: 0, height: 0 });
  return (
    <View
      style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
      onLayout={({ bounds }) => box.set({ width: bounds.size.width, height: bounds.size.height })}
    >
      <View
        style={{
          width: matterStageWidth,
          height: matterStageHeight,
          transform: [{ scale: Math.min(1, box().width / matterStageWidth, box().height / matterStageHeight) }],
        }}
      >
        <View
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: panelWidth,
            transform: [{ translateX: props.step() >= 2 ? 0 : (matterStageWidth - panelWidth) / 2 }],
            transitionProperty: "transform",
            transitionDuration: 500,
            transitionTimingFunction: "ease-out",
          }}
        >
          <Pop visible={true}>
            <Panel
              title="Matter"
              color={SubjectColor()}
              hasProperties={true}
              showProperties={true}
              showThings={props.step() >= 1}
              things={matterThings}
            />
          </Pop>
        </View>
        <View style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: panelWidth }}>
          <Pop visible={props.step() >= 2}>
            <Panel
              title="Energy"
              color={palette.flame}
              hasProperties={false}
              showProperties={props.step() >= 3}
              showThings={props.step() >= 2}
              things={energyThings}
            />
          </Pop>
        </View>
      </View>
    </View>
  );
}

function Panel(props: {
  title: string;
  color: string;
  hasProperties: boolean;
  showProperties: boolean;
  showThings: boolean;
  things: readonly Thing[];
}) {
  return (
    <View
      style={{
        flex: 1,
        paddingLeft: 14,
        paddingRight: 14,
        paddingTop: 16,
        paddingBottom: 8,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: withAlpha(props.color, 0.3),
        backgroundColor: mixHex(palette.surfaceLowest, props.color, 0.08),
        alignItems: "flex-start",
      }}
    >
      <Text style={{ fontSize: 22, fontWeight: "600", color: props.color }}>{props.title}</Text>
      <View style={{ height: 10 }} />
      <Pop visible={props.showProperties} delay={200}>
        <Property label={props.hasProperties ? "Has mass" : "No mass"} yes={props.hasProperties} />
      </Pop>
      <View style={{ height: 6 }} />
      <Pop visible={props.showProperties} delay={400}>
        <Property label={props.hasProperties ? "Takes up space" : "No space"} yes={props.hasProperties} />
      </Pop>
      <View style={{ height: 14 }} />
      {props.things.map((thing, i) => (
        <View style={{ marginBottom: 10 }}>
          <Pop visible={props.showThings} delay={stagger * (i + 1)}>
            <ThingTile thing={thing} />
          </Pop>
        </View>
      ))}
    </View>
  );
}

function Property(props: { label: string; yes: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <Text style={{ fontSize: 18, color: props.yes ? palette.green : palette.error }}>
        {props.yes ? "\u2714" : "\u2716"}
      </Text>
      <Text style={{ fontSize: 14, fontWeight: "600", color: palette.onSurface }}>{props.label}</Text>
    </View>
  );
}

function ThingTile(props: { thing: Thing }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: withAlpha(props.thing.color, 0.15),
        }}
      >
        <Text style={{ fontSize: 26 }}>{props.thing.glyph}</Text>
      </View>
      <Text style={{ fontSize: 16, fontWeight: "500", color: palette.onSurface }}>{props.thing.label}</Text>
    </View>
  );
}

const trioEnergy: Record<MatterState, number> = { solid: 0.3, liquid: 0.5, gas: 0.7 };
const arrangement: Record<MatterState, string> = {
  solid: "Packed tight",
  liquid: "Slide past each other",
  gas: "Fly far apart",
};
const keeps: Record<MatterState, { shape: boolean; volume: boolean }> = {
  solid: { shape: true, volume: true },
  liquid: { shape: false, volume: true },
  gas: { shape: false, volume: false },
};
const matterStates: readonly MatterState[] = ["solid", "liquid", "gas"];

/** Step 0 and the last step show all three states; steps 1 to 3 show one state each. */
function StatesScene(props: { step: () => number }) {
  return (
    <Each of={[props.step()]} key={(s) => s}>
      {(s) => {
        const n = s();
        if (n === 0) return <StatesTrio arrangement={false} />;
        if (n === matterStates.length + 1) return <StatesTrio arrangement={true} />;
        return <StateAlone state={matterStates[n - 1]} />;
      }}
    </Each>
  );
}

function StatesTrio(props: { arrangement: boolean }) {
  return (
    <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
      {matterStates.map((state, i) => (
        <View style={{ flex: 1, paddingHorizontal: 4, alignItems: "center" }}>
          <View style={{ alignSelf: "stretch" }}>
            <Pop visible={true} delay={150 * i}>
              <View style={{ width: "100%", aspectRatio: 0.6 }}>
                <ParticleView state={state} energy={trioEnergy[state]} />
              </View>
            </Pop>
          </View>
          <View style={{ height: 10 }} />
          <Text style={{ fontSize: 16, fontWeight: "500", color: particleColor(state) }}>{stateName(state)}</Text>
          <View style={{ height: 4 }} />
          <View style={{ height: 44, width: "100%" }}>
            <Pop visible={props.arrangement} delay={150 * i}>
              <Text style={{ fontSize: 14, textAlign: "center", color: palette.onSurface }}>
                {arrangement[state]}
              </Text>
            </Pop>
          </View>
        </View>
      ))}
    </View>
  );
}

function StateAlone(props: { state: MatterState }) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 16 }}>
      <View style={{ flex: 1, alignSelf: "stretch" }}>
        <ParticleView state={props.state} energy={trioEnergy[props.state]} />
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
        <Pop visible={true}>
          <KeepsPill label="Own shape" keeps={keeps[props.state].shape} />
        </Pop>
        <Pop visible={true} delay={200}>
          <KeepsPill label="Own volume" keeps={keeps[props.state].volume} />
        </Pop>
      </View>
    </View>
  );
}

function KeepsPill(props: { label: string; keeps: boolean }) {
  return (
    <FactPill
      label={props.label}
      icon={props.keeps ? "\u2714" : "\u2716"}
      color={props.keeps ? palette.green : palette.wrong}
    />
  );
}

const coldest = -20;
const hottest = 120;
const order: readonly MatterState[] = ["solid", "liquid", "gas"];

/** Water heating or cooling through the stage for each step: a thermometer, the particles, and where it sits. */
function HeatScene(props: { stages: readonly HeatStage[]; step: () => number }) {
  const celsius = createTween(props.stages[0].from);
  effect(() => {
    const stage = props.stages[props.step()];
    celsius.jump(stage.from);
    celsius.animateTo(stage.to, 2500, easeInOut);
  });
  const stage = () => props.stages[props.step()];
  const from = () => waterStateAt(stage().from);
  const to = () => waterStateAt(stage().to);
  const between = () => (order.indexOf(from()) < order.indexOf(to()) ? from() : to());
  return (
    <View style={{ flex: 1, justifyContent: "center", gap: 14 }}>
      <View style={{ flex: 1, flexDirection: "row" }}>
        <Canvas
          style={{ width: 56 }}
          draw={(cx, { width, height }) => drawThermometer(cx, width, height, celsius.value())}
        />
        <View style={{ width: 12 }} />
        <View style={{ flex: 1 }}>
          <ParticleView state={waterStateAt(celsius.value())} energy={energyAt(celsius.value())} />
        </View>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 12 }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "600",
            color: temperatureColor(celsius.value()),
            fontVariant: ["tabular-nums"],
          }}
        >
          {`${dartRound(celsius.value())}\u00B0C`}
        </Text>
        <FactPill
          label={`Particles: ${speedWord(celsius.value())}`}
          icon={"\u26A1"}
          color={temperatureColor(celsius.value())}
        />
      </View>
      <StateTrack
        current={waterStateAt(celsius.value())}
        change={changeName(from(), to())}
        between={between()}
        heating={stage().to > stage().from}
      />
    </View>
  );
}

/** Solid, liquid and gas in a row. The current state is filled in; a change underway is named between them. */
function StateTrack(props: {
  current: MatterState;
  change: string | null;
  between: MatterState;
  heating: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <TrackNode state="solid" on={props.current === "solid"} />
      <TrackLink
        label={props.between === "solid" ? props.change : null}
        heating={props.heating}
      />
      <TrackNode state="liquid" on={props.current === "liquid"} />
      <TrackLink
        label={props.between === "liquid" ? props.change : null}
        heating={props.heating}
      />
      <TrackNode state="gas" on={props.current === "gas"} />
    </View>
  );
}

function TrackNode(props: { state: MatterState; on: boolean }) {
  const color = particleColor(props.state);
  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 2,
        borderColor: props.on ? color : palette.outlineVariant,
        backgroundColor: props.on ? color : palette.surfaceLowest,
        transitionProperty: "all",
        transitionDuration: 300,
      }}
    >
      <Text
        style={{ fontSize: 14, fontWeight: "600", color: props.on ? "#FFFFFF" : palette.onSurfaceVariant }}
      >
        {stateName(props.state)}
      </Text>
    </View>
  );
}

function TrackLink(props: { label: string | null; heating: boolean }) {
  const active = () => props.label !== null;
  const colour = () => (active() ? (props.heating ? palette.hot : palette.cold) : palette.outlineVariant);
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <View style={{ height: 18 }}>
        <Pop visible={active()}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: colour() }}>{props.label ?? ""}</Text>
        </Pop>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", width: "100%" }}>
        {active() && !props.heating ? <Text style={{ fontSize: 16, color: colour() }}>{"\u2190"}</Text> : null}
        <View
          style={{
            flex: 1,
            height: 3,
            backgroundColor: colour(),
            transitionProperty: "backgroundColor",
            transitionDuration: 300,
          }}
        />
        {active() && props.heating ? <Text style={{ fontSize: 16, color: colour() }}>{"\u2192"}</Text> : null}
      </View>
      <View style={{ height: 18 }}>
        <Pop visible={active()}>
          <Text style={{ fontSize: 11, color: colour() }}>
            {props.heating ? "+ energy" : "\u2212 energy"}
          </Text>
        </Pop>
      </View>
    </View>
  );
}

const thermometerTubeX = 20;
const thermometerTubeWidth = 14;
const thermometerBulbRadius = 15;

/** The thermometer: a tube and bulb filled to the temperature, with marks at 0 and 100 degrees. */
function drawThermometer(cx: CanvasRenderingContext2D, width: number, height: number, celsius: number): void {
  const top = 6;
  const bulbY = height - thermometerBulbRadius - 2;
  const bottom = bulbY - thermometerBulbRadius * 0.6;
  const yAt = (c: number) => bottom - (bottom - top - 8) * ((c - coldest) / (hottest - coldest));
  const half = thermometerTubeWidth / 2;
  const x = thermometerTubeX;
  const bulb = { x, y: bulbY };

  cx.fillStyle = palette.outlineVariant;
  cx.beginPath();
  cx.roundRect(x - half, top, thermometerTubeWidth, bulbY - top, half);
  cx.fill();
  cx.beginPath();
  cx.arc(bulb.x, bulb.y, thermometerBulbRadius, 0, Math.PI * 2);
  cx.fill();

  const level = yAt(Math.min(hottest, Math.max(coldest, celsius)));
  cx.fillStyle = temperatureColor(celsius);
  cx.beginPath();
  cx.roundRect(x - half + 3, level, thermometerTubeWidth - 6, bulbY - level, 4);
  cx.fill();
  cx.beginPath();
  cx.arc(bulb.x, bulb.y, thermometerBulbRadius - 3, 0, Math.PI * 2);
  cx.fill();

  for (const [mark, label] of [
    [0, "0\u00B0"],
    [100, "100\u00B0"],
  ] as const) {
    const y = yAt(mark);
    cx.strokeStyle = palette.onSurfaceVariant;
    cx.lineWidth = 2;
    cx.beginPath();
    cx.moveTo(x + half + 2, y);
    cx.lineTo(x + half + 8, y);
    cx.stroke();
    cx.fillStyle = palette.onSurfaceVariant;
    cx.font = "700 11px system-ui";
    cx.textAlign = "left";
    cx.textBaseline = "middle";
    cx.fillText(label, x + half + 10, y);
  }
}
