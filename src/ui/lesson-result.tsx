import { cleanup, createMotion, reduceMotion, signal, Text, View } from "nsh";
import type { ActivityResult } from "../core/scoring";
import { starsFor } from "../core/scoring";
import { PrimaryButton } from "./kit/button";
import { Confetti } from "./kit/confetti";
import { SubjectColor } from "./kit/theme";

const headlines = { 3: "Perfect!", 2: "Great job!", 1: "Nice work!" } as const;
const countUpMs = 1600;

function PoppingStar(props: { earned: boolean; index: number }) {
  const pop = createMotion({ enter: "popIn", delay: 200 + props.index * 240 });
  return (
    <Text
      class={`text-[76px] leading-[84px] ${props.earned ? "text-amber-400" : "text-zinc-300 dark:text-zinc-600"}`}
      style={pop.style}
    >
      {props.earned ? "\u2605" : "\u2606"}
    </Text>
  );
}

/** XP counting up from 0 after the stars land; the full number at once under reduced motion. */
function countUp(target: number) {
  const shown = signal(reduceMotion() ? target : 0);
  let frame = 0;
  if (!reduceMotion()) {
    let start: number | null = null;
    const tick = (time: number) => {
      start ??= time;
      const t = Math.min(1, Math.max(0, ((time - start) / countUpMs - 0.3) / 0.7));
      shown.set(Math.round(target * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  }
  cleanup(() => cancelAnimationFrame(frame));
  return shown;
}

/** The celebration at the end of a lesson: stars pop in, XP counts up, and the way forward is one tap away. */
export function LessonResult(props: {
  outcome: ActivityResult;
  streak: number;
  nextTitle: string | null;
  onNext: () => void;
  onBack: () => void;
}) {
  const stars = starsFor(props.outcome.mistakes);
  const xp = countUp(props.outcome.xp);
  return (
    <View class="flex-1 bg-background text-foreground">
      <View class="flex-1 items-center p-6 pt-[calc(env(safe-area-inset-top)+24px)] pb-[calc(env(safe-area-inset-bottom)+24px)]">
        <View class="flex-1 items-center justify-center gap-6">
          <Text class="text-4xl font-extrabold text-foreground">{headlines[stars]}</Text>
          <View class="flex-row gap-2" accessible accessibilityLabel={`${stars} of 3 stars`}>
            <Each of={[0, 1, 2]}>{(i) => <PoppingStar earned={i() < stars} index={i()} />}</Each>
          </View>
          <Text
            class="text-3xl font-bold"
            style={{ color: SubjectColor() }}
            accessibilityLabel={`${props.outcome.xp} XP earned`}
          >
            {`+${xp()} XP`}
          </Text>
          <If when={props.streak > 0}>
            <View class="flex-row items-center gap-1 rounded-full bg-orange-100 px-3 py-1.5 dark:bg-orange-950">
              <Text>{"\u{1F525}"}</Text>
              <Text class="font-bold text-foreground">{`${props.streak} day streak`}</Text>
            </View>
          </If>
        </View>
        <View class="w-full gap-3">
          <If when={props.nextTitle !== null}>
            <PrimaryButton label={`Next: ${props.nextTitle}`} onPress={props.onNext} />
          </If>
          <If
            when={props.nextTitle === null}
            else={
              <View
                role="button"
                accessibilityLabel="Back to the path"
                onPress={props.onBack}
                class="h-12 items-center justify-center active:opacity-60"
              >
                <Text class="text-lg font-bold" style={{ color: SubjectColor() }}>
                  Back to the path
                </Text>
              </View>
            }
          >
            <PrimaryButton label="Back to the path" onPress={props.onBack} />
          </If>
        </View>
      </View>
      <If when={stars >= 2}>
        <Confetti />
      </If>
    </View>
  );
}
