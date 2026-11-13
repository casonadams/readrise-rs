import { Text, View } from "nsh";
import { darken, SubjectColor } from "./theme";

/** The main action of a screen: a chunky, full-width button with a 3D edge in the subject's colour (or `color`). */
export function PrimaryButton(props: { label: string; onPress: () => void; color?: string; disabled?: boolean }) {
  const color = () => props.color ?? SubjectColor();
  return (
    <View
      role="button"
      accessibilityLabel={props.label}
      onPress={() => {
        if (!props.disabled) props.onPress();
      }}
      class="shrink-0 rounded-2xl active:translate-y-0.5"
      style={{ backgroundColor: darken(props.disabled ? "#BDBDBD" : color(), 0.3), paddingBottom: 4 }}
    >
      <View
        class="min-h-[56px] items-center justify-center rounded-2xl px-6 py-2"
        style={{ backgroundColor: props.disabled ? "#BDBDBD" : color() }}
      >
        <Text class="text-center text-lg font-extrabold text-white">{props.label}</Text>
      </View>
    </View>
  );
}
