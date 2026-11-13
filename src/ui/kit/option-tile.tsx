import { Text, View } from "nsh";
import { tint } from "./tint";
import { feedbackColors, SubjectColor } from "./theme";

/** How a choice looks: still open, picked (no verdict yet), crossed out, marked right, or faded once another choice won. */
export type OptionState = "open" | "picked" | "correct" | "wrong" | "dimmed";

/** A lettered answer choice. Only an open choice hears presses. */
export function OptionTile(props: { letter: string; label: string; state: OptionState; onPress: () => void }) {
  const accent = () => {
    if (props.state === "correct") return feedbackColors.correct;
    if (props.state === "wrong") return feedbackColors.wrong;
    return SubjectColor();
  };
  const marked = () => props.state === "picked" || props.state === "correct" || props.state === "wrong";
  const faded = () => props.state === "dimmed" || props.state === "wrong";
  return (
    <View
      role="button"
      accessibilityLabel={`${props.label}${suffix(props.state)}`}
      onPress={() => {
        if (props.state === "open") props.onPress();
      }}
      class={`min-h-[60px] flex-row items-center gap-3 rounded-[18px] border-2 bg-white px-3 py-2.5 dark:bg-zinc-900 ${marked() ? "" : "border-zinc-300 dark:border-zinc-700"}`}
      style={{
        backgroundColor: marked() ? tint(accent(), 0.12) : undefined,
        borderColor: marked() ? accent() : undefined,
        opacity: faded() ? 0.55 : 1,
        transitionProperty: "all",
        transitionDuration: 250,
      }}
    >
      <View
        class={`h-[34px] w-[34px] items-center justify-center rounded-[10px] border-2 ${marked() ? "" : "border-zinc-300 dark:border-zinc-700"}`}
        style={{
          backgroundColor: marked() ? accent() : undefined,
          borderColor: marked() ? accent() : undefined,
          transitionProperty: "all",
          transitionDuration: 250,
        }}
      >
        <Text class={`text-base font-extrabold ${marked() ? "text-white" : "text-zinc-500"}`}>
          {glyph(props.state, props.letter)}
        </Text>
      </View>
      <Text
        class={`flex-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100 ${props.state === "wrong" ? "line-through" : ""}`}
      >
        {props.label}
      </Text>
    </View>
  );
}

function glyph(state: OptionState, letter: string): string {
  if (state === "correct") return "\u2713";
  if (state === "wrong") return "\u2715";
  return letter;
}

function suffix(state: OptionState): string {
  if (state === "correct") return ", correct";
  if (state === "picked") return ", your pick";
  if (state === "wrong") return ", wrong";
  return "";
}
