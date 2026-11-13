import { cleanup, effect, type JSX, signal, Text, View } from "nsh";
import { Slider } from "nsh/base";
import { SubjectColor } from "../../ui/kit/theme";
import { mixHex, palette, withAlpha } from "./palette";

/** Scales and fades its children in after `delay` ms once `visible` turns true, and out when it turns false. */
export function Pop(props: { visible: boolean; delay?: number; children?: JSX.Element }) {
  const shown = signal(false);
  let timer = 0;
  effect(() => {
    const visible = props.visible;
    clearTimeout(timer);
    if (!visible) {
      shown.set(false);
      return;
    }
    timer = setTimeout(() => shown.set(true), props.delay ?? 0);
  });
  cleanup(() => clearTimeout(timer));
  return (
    <View
      style={{
        transform: [{ translateY: shown() ? 0 : 12 }, { scale: shown() ? 1 : 0.7 }],
        transitionProperty: "transform",
        transitionDuration: 400,
        transitionTimingFunction: "ease-out",
      }}
    >
      <View style={{ opacity: shown() ? 1 : 0, transitionProperty: "opacity", transitionDuration: 250 }}>
        {props.children}
      </View>
    </View>
  );
}

/** A short fact the scene has just shown, with an optional leading glyph. */
export function FactPill(props: { label: string; icon?: string; color?: string }) {
  const tint = () => props.color ?? SubjectColor();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor: withAlpha(tint(), 0.35),
        backgroundColor: mixHex(palette.surfaceLowest, tint(), 0.12),
      }}
    >
      {props.icon ? <Text style={{ fontSize: 16, color: tint() }}>{props.icon}</Text> : null}
      <Text style={{ fontSize: 14, fontWeight: "600", color: palette.onSurface }}>{props.label}</Text>
    </View>
  );
}

/** The one control of an experiment: a big slider between two glyphs. It takes no changes while `onChange` is unset. */
export function ExperimentSlider(props: {
  value: number;
  onChange?: (value: number) => void;
  label: string;
  low: string;
  high: string;
  color?: string;
}) {
  const tint = () => (props.onChange ? (props.color ?? SubjectColor()) : palette.outline);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <Text style={{ fontSize: 22, opacity: 0.6 }}>{props.low}</Text>
      <Slider
        style={{ flex: 1 }}
        value={props.value}
        min={0}
        max={1}
        step={0}
        disabled={!props.onChange}
        accessibilityLabel={props.label}
        onChange={({ value }) => props.onChange?.(value as number)}
        trackStyle={{ height: 32, justifyContent: "center" }}
        indicatorStyle={{ height: 8, borderRadius: 4, backgroundColor: palette.outlineVariant }}
        rangeStyle={{ height: 8, borderRadius: 4, backgroundColor: tint() }}
        thumbStyle={{ width: 26, height: 26, borderRadius: 13, backgroundColor: tint() }}
      />
      <Text style={{ fontSize: 28, color: tint() }}>{props.high}</Text>
    </View>
  );
}
