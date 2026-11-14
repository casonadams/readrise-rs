import { Text, View } from "nsh";
import type { JSX } from "nsh/jsx-runtime";
import type { ExperimentProps, RenderExperiment } from "../../../ui/activities/types";
import { energyAt, waterStateAt } from "../../../science/matter";
import { controlledExperiment, sliderControl, tapControl } from "../../../science/ui/experiment";
import { ParticleView } from "../../../science/ui/particle-view";
import { palette } from "../../../science/ui/palette";
import { FactPill } from "../../../science/ui/parts";
import type { ExperimentId } from "../types";
import { dissolvedAt, GlassView, sugarCube } from "./glass-view";

const insight = palette.purple;

/** A sugar cube `value` (0..1) of the way to dissolved. */
export function DissolvingView(props: { value: number }) {
  const dissolved = () => dissolvedAt(props.value);
  return (
    <GlassView
      dissolved={dissolved()}
      undissolved={sugarCube - dissolved()}
      facts={[
        <FactPill label={`Sugar: ${sugarCube}`} icon={"\u{1F36C}"} color={palette.sugar} />,
        <FactPill label={`In the cube: ${sugarCube - dissolved()}`} icon={"\u{1F9CA}"} />,
      ]}
      banner={<FactPill label="Hidden, not gone" icon={"\u{1F648}"} color={insight} />}
      bannerShown={dissolved() === sugarCube}
    />
  );
}

/** The scale under the glass. It always reads 110 g: the evidence. */
function ScaleReading() {
  return (
    <View
      accessible
      accessibilityLabel="Scale reads 110 grams"
      class="flex-row items-center gap-2.5 rounded-xl bg-zinc-800 px-4 py-1.5 dark:bg-zinc-200"
    >
      <Text class="text-xl">{"\u2696\uFE0F"}</Text>
      <Text class="text-2xl font-semibold text-white dark:text-zinc-900">110 g</Text>
    </View>
  );
}

/** 100 g of water and a 10 g sugar cube on a scale, `value` (0..1) of the way to dissolved. */
export function MassView(props: { value: number }) {
  const dissolved = () => dissolvedAt(props.value);
  return (
    <GlassView
      dissolved={dissolved()}
      undissolved={sugarCube - dissolved()}
      facts={[<ScaleReading />]}
      banner={<FactPill label="No particle left the glass" icon={"\u2705"} color={insight} />}
      bannerShown={dissolved() === sugarCube}
    />
  );
}

function Side(props: { title: string; fact: JSX.Element; children: JSX.Element }) {
  return (
    <View style={{ flex: 1, gap: 6, alignItems: "stretch" }}>
      <Text class="text-center text-sm font-semibold">{props.title}</Text>
      <View style={{ flex: 1 }}>{props.children}</View>
      <View style={{ alignItems: "center" }}>{props.fact}</View>
    </View>
  );
}

/** An ice cube in a warm room beside a sugar cube in water, `value` (0..1) of the way through. */
export function MeltOrDissolveView(props: { value: number }) {
  const celsius = () => -10 + 30 * props.value;
  const dissolved = () => dissolvedAt(props.value);
  return (
    <View style={{ flex: 1, flexDirection: "row", gap: 10 }}>
      <Side title="Ice in a warm room" fact={<FactPill label="Only water" icon={"\u{1F4A7}"} />}>
        <ParticleView state={waterStateAt(celsius())} energy={energyAt(celsius())} />
      </Side>
      <Side title="Sugar in water" fact={<FactPill label="Water + sugar" icon={"\u{1F36C}"} color={palette.sugar} />}>
        <ParticleView state="liquid" energy={0.5} dissolved={dissolved()} undissolved={sugarCube - dissolved()} />
      </Side>
    </View>
  );
}

/** Sugar particles in one spoonful. */
const perSpoon = 4;
/** Spoonfuls the glass of water can dissolve. */
const fits = 3;
const spoons = 6;

/** The glass after `value` spoonfuls of sugar: the first ones dissolve, the rest stays solid at the bottom. */
export function SpoonsView(props: { value: number }) {
  const dissolvedSpoons = () => Math.min(props.value, fits);
  return (
    <GlassView
      dissolved={dissolvedSpoons() * perSpoon}
      undissolved={(props.value - dissolvedSpoons()) * perSpoon}
      facts={[
        <FactPill label={`Spoons: ${props.value}`} icon={"\u{1F944}"} color={palette.sugar} />,
        <FactPill label={`Dissolved: ${dissolvedSpoons()}`} icon={"\u{1F4A7}"} />,
      ]}
      banner={<FactPill label="Full: the rest stays at the bottom" icon={"\u26D4"} color={insight} />}
      bannerShown={props.value > fits}
    />
  );
}

const stir = sliderControl({ label: "Stir", low: "\u23F8\uFE0F", high: "\u{1F504}", color: palette.sugar });
const allDissolved = (value: number) => dissolvedAt(value) === sugarCube;

/** The course's experiments; each one's control does nothing until `active`, and it reports `onObserved` once. */
const experiments: Record<ExperimentId, (props: ExperimentProps) => JSX.Element> = {
  dissolving: controlledExperiment({ control: stir, observed: allDissolved, View: DissolvingView }),
  mass: controlledExperiment({ control: stir, observed: allDissolved, View: MassView }),
  meltOrDissolve: controlledExperiment({
    control: sliderControl({ label: "Time", low: "\u23F1\uFE0F", high: "\u231B" }),
    observed: (time) => time >= 0.98,
    View: MeltOrDissolveView,
  }),
  spoons: controlledExperiment({
    control: tapControl({ label: "Add a spoon", presses: spoons }),
    observed: (added) => added >= spoons,
    View: SpoonsView,
    settle: 1200,
  }),
};

export const renderExperiment: RenderExperiment<ExperimentId> = (experiment, props) => experiments[experiment](props);
