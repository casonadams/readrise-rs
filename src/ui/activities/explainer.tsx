import { signal, Text, View } from "nsh";
import type { ExplainerActivity } from "../../core/course";
import { noResult } from "../../core/scoring";
import { PrimaryButton } from "../kit/button";
import { FadeIn } from "../kit/fade-in";
import { StepDots } from "../kit/step-dots";
import type { ActivityProps, RenderScene } from "./types";

/** A short animated explanation told one captioned step at a time: Next moves on, Back returns, the last step is Continue. */
export function ExplainerView<S>(props: ActivityProps<ExplainerActivity<S>> & { renderScene: RenderScene<S> }) {
  const activity = props.activity;
  const last = activity.steps.length - 1;
  const step = signal(0);
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    props.complete(noResult);
  };

  return (
    <View class="flex-1 gap-3 px-5 pb-5 pt-2">
      <Text class="text-center text-3xl font-extrabold leading-tight">{activity.title}</Text>
      <View class="items-center">
        <StepDots count={activity.steps.length} current={step()} />
      </View>
      <View class="flex-1">{props.renderScene(activity.scene, step)}</View>
      <View class="min-h-[88px] justify-center rounded-[20px] border-2 border-zinc-300 bg-white px-5 py-3.5 dark:border-zinc-700 dark:bg-zinc-900">
        <Each of={[step()]}>
          {(current) => (
            <FadeIn>
              <Text class="text-lg leading-snug">{activity.steps[current()]}</Text>
            </FadeIn>
          )}
        </Each>
      </View>
      <View class="flex-row items-center gap-3">
        <If when={step() > 0}>
          <View
            role="button"
            accessibilityLabel="Previous step"
            onPress={() => step.update((n) => n - 1)}
            class="h-14 w-14 items-center justify-center rounded-[18px] border-2 border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
          >
            <Text class="text-2xl font-bold">{"\u2190"}</Text>
          </View>
        </If>
        <View class="flex-1">
          <PrimaryButton
            label={step() === last ? "Continue" : "Next \u2192"}
            onPress={() => (step() === last ? finish() : step.update((n) => n + 1))}
          />
        </View>
      </View>
    </View>
  );
}
