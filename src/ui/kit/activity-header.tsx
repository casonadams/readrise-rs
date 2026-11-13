import type { JSX } from "nsh/jsx-runtime";
import { Text, View } from "nsh";
import { tint } from "./tint";
import { type ActivityKind, activityKinds } from "./theme";

/** The kind badge on the left, progress on the right. */
export function ActivityHeader(props: { kind: ActivityKind; trailing?: JSX.Element }) {
  const kind = () => activityKinds[props.kind];
  return (
    <View class="shrink-0 flex-row items-center">
      <View
        class="flex-row items-center gap-1.5 rounded-full py-1.5 pl-2 pr-3"
        style={{ backgroundColor: tint(kind().color, 0.14) }}
      >
        <Text class="text-lg">{kind().emoji}</Text>
        <Text class="text-sm font-extrabold" style={{ color: kind().color }}>
          {kind().label}
        </Text>
      </View>
      <View class="ml-3 flex-1 flex-row items-center justify-end">{props.trailing}</View>
    </View>
  );
}
