import { Text, View } from "nsh";
import { SubjectColor } from "./theme";

/** A small text button in the subject's colour, for optional help such as "Need a hint?". */
export function TextAction(props: { label: string; onPress: () => void }) {
  return (
    <View role="button" onPress={props.onPress} class="flex-row items-center gap-1.5 self-start py-2 pr-2">
      <Text class="text-lg">{"\u{1F4A1}"}</Text>
      <Text class="text-lg font-bold" style={{ color: SubjectColor() }}>
        {props.label}
      </Text>
    </View>
  );
}
