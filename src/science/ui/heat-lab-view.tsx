import { signal, Text, View } from "nsh";
import { Slider } from "nsh/base";
import type { ActivityProps } from "../../ui/activities/types";
import { PrimaryButton } from "../../ui/kit/button";
import { SubjectColor } from "../../ui/kit/theme";
import { advance, goalReached, heatLabStart, type HeatLabState } from "../heat-lab";
import { energyAt, maxCelsius, minCelsius, waterStateAt } from "../matter";
import type { HeatLabActivity } from "../types";
import { ParticleView } from "./particle-view";
import { dartRound, palette, stateName } from "./palette";

/** Drag a thermometer for a sample of water and watch its particles; each goal asks for a state of matter. */
export function HeatLabView(props: ActivityProps<HeatLabActivity>) {
  const lab = signal<HeatLabState>(heatLabStart);
  let finished = false;
  const next = () => {
    if (finished) return;
    const step = advance(props.activity, lab());
    if ("result" in step) {
      finished = true;
      props.complete(step.result);
      return;
    }
    lab.set(step.state);
  };
  return (
    <View style={{ flex: 1, padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 14, fontWeight: "600", color: palette.onSurfaceVariant }}>
        {`Goal ${lab().goal + 1} of ${props.activity.goals.length}`}
      </Text>
      <Text style={{ fontSize: 22, fontWeight: "600", color: palette.onSurface }}>
        {props.activity.goals[lab().goal].prompt}
      </Text>
      <View style={{ flex: 1 }}>
        <ParticleView state={waterStateAt(lab().celsius)} energy={energyAt(lab().celsius)} />
      </View>
      <Text style={{ fontSize: 24, fontWeight: "600", textAlign: "center", color: palette.onSurface }}>
        {`${dartRound(lab().celsius)}\u00B0C  \u2022  ${stateName(waterStateAt(lab().celsius))}`}
      </Text>
      <View style={{ paddingHorizontal: 13 }}>
        <Slider
          min={minCelsius}
          max={maxCelsius}
          step={1}
          value={lab().celsius}
          accessibilityLabel="Water temperature"
          onChange={({ value }) => lab.update((s) => ({ ...s, celsius: value as number }))}
          trackStyle={{ height: 32, justifyContent: "center" }}
          indicatorStyle={{ height: 8, borderRadius: 4, backgroundColor: palette.outlineVariant }}
          rangeStyle={{ height: 8, borderRadius: 4, backgroundColor: SubjectColor() }}
          thumbStyle={{ width: 26, height: 26, borderRadius: 13, backgroundColor: SubjectColor() }}
        />
      </View>
      <Text style={{ fontSize: 14, textAlign: "center", color: palette.onSurfaceVariant }}>
        {"Water freezes below 0\u00B0C and boils at 100\u00B0C."}
      </Text>
      {goalReached(props.activity, lab()) ? (
        <PrimaryButton
          label={lab().goal + 1 === props.activity.goals.length ? "Finish" : "Goal reached! Next goal"}
          color={palette.greenButton}
          onPress={next}
        />
      ) : (
        <View style={{ height: 56 }} />
      )}
    </View>
  );
}
