import { Text, View } from "nsh";
import { feedbackColors } from "./theme";
import { tint } from "./tint";

export type FeedbackKind = "correct" | "wrong";

const looks = {
  correct: { color: feedbackColors.correct, glyph: "\u2713" },
  wrong: { color: feedbackColors.wrong, glyph: "\u24D8" },
} as const;

/** A short coloured note to the learner: what went right or what went wrong. Hints come from Alex (`AlexSays`). */
export function FeedbackBanner(props: { kind: FeedbackKind; message: string; title?: string }) {
  const look = () => looks[props.kind];
  return (
    <View
      class="w-full flex-row gap-2.5 rounded-[18px] border-2 p-3.5"
      style={{ backgroundColor: tint(look().color, 0.1), borderColor: tint(look().color, 0.4) }}
    >
      <Text class="text-xl font-bold" style={{ color: look().color }}>
        {look().glyph}
      </Text>
      <View class="flex-1 gap-1">
        <If when={props.title}>
          {(title) => (
            <Text class="text-lg font-bold" style={{ color: look().color }}>
              {title()}
            </Text>
          )}
        </If>
        <Text class="text-lg leading-snug">{props.message}</Text>
      </View>
    </View>
  );
}
