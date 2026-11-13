import type { JSX } from "nsh/jsx-runtime";
import { createMotion, Text, View } from "nsh";
import { PrimaryButton } from "./button";
import { tint } from "./tint";
import { feedbackColors } from "./theme";

/** Slides up once an answer is settled: what it means, then on. */
export function AnswerPanel(props: {
  title: string;
  explanation: string;
  onContinue: () => void;
  color?: string;
  icon?: string;
  lead?: JSX.Element;
}) {
  const motion = createMotion({ enter: "fadeInUp" });
  const color = () => props.color ?? feedbackColors.correct;
  return (
    <View
      class="mt-3 shrink-0 gap-2 rounded-3xl border-2 px-4 pb-4 pt-3.5"
      style={{ ...motion.style, backgroundColor: tint(color(), 0.1), borderColor: tint(color(), 0.4) }}
    >
      <View class="flex-row items-center gap-2">
        <Text class="text-2xl font-bold" style={{ color: color() }}>
          {props.icon ?? "\u2713"}
        </Text>
        <Text class="flex-1 text-xl font-bold" style={{ color: color() }}>
          {props.title}
        </Text>
      </View>
      {props.lead}
      <Text class="text-lg leading-snug">{props.explanation}</Text>
      <View class="mt-2">
        <PrimaryButton label="Continue" color={color()} onPress={props.onContinue} />
      </View>
    </View>
  );
}
