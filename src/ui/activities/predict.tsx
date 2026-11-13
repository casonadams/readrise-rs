import { Scroll, signal, Text, View, windowSize } from "nsh";
import type { PredictActivity } from "../../core/course";
import {
  commit,
  type Confidence,
  confidences,
  isTesting,
  observe,
  predict,
  predictResult,
  predictResultText,
  type PredictState,
  predictStart,
} from "../../core/sessions/predict";
import { ActivityHeader } from "../kit/activity-header";
import { AnswerPanel } from "../kit/answer-panel";
import { OptionTile } from "../kit/option-tile";
import { tint } from "../kit/tint";
import { activityKinds, feedbackColors } from "../kit/theme";
import type { ActivityProps, ExperimentProps, RenderExperiment } from "./types";

const predictColor = activityKinds.predict.color;
const confidenceIcons: Record<Confidence, string> = {
  "Just guessing": "\u2753",
  "Pretty sure": "\u{1F44D}",
  "Totally sure": "\u2705",
};

/** The headline of the result, by whether the prediction held and how sure the learner was. */
export function predictionTitle(right: boolean, confidence: Confidence): string {
  if (right) return confidence === "Just guessing" ? "Good guess!" : "You called it!";
  if (confidence === "Totally sure") return "Whoa, a surprise!";
  if (confidence === "Pretty sure") return "Surprise!";
  return "Now you know!";
}

/** Predict, then find out: commit to an answer, say how sure you are, run the experiment, see what really happens. */
export function PredictView<E>(props: ActivityProps<PredictActivity<E>> & { renderExperiment: RenderExperiment<E> }) {
  const activity = props.activity;
  const state = signal<PredictState>(predictStart);
  let scheduled = false;
  let finished = false;

  const onObserved = () => {
    if (scheduled || !isTesting(state())) return;
    scheduled = true;
    setTimeout(() => state.update(observe), 700);
  };
  const experiment: ExperimentProps = {
    get active() {
      return isTesting(state());
    },
    onObserved,
  };
  const right = () => state().prediction === activity.answer;
  const finish = () => {
    if (finished) return;
    finished = true;
    props.complete(predictResult(activity));
  };

  // The evidence stays on screen after the reveal, smaller, so the result and Continue fit on short phones.
  const experimentHeight = () => {
    const tall = windowSize().height;
    return state().observed ? Math.max(190, Math.min(240, tall * 0.26)) : Math.max(220, Math.min(340, tall * 0.4));
  };

  return (
    <View class="flex-1 gap-3 px-5 pt-2">
      <ActivityHeader kind="predict" />
      <Scroll class="-mx-5 flex-1" contentClass="gap-3 px-5 pb-5">
        <Text class="text-2xl font-bold leading-snug">{activity.question}</Text>
        <View
          class="overflow-hidden rounded-3xl bg-white p-3 dark:bg-zinc-900"
          style={{
            height: experimentHeight(),
            borderWidth: isTesting(state()) ? 3 : 2,
            borderColor: isTesting(state()) ? predictColor : "#D4D4D8",
            transitionProperty: "all",
            transitionDuration: 300,
          }}
        >
          {props.renderExperiment(activity.experiment, experiment)}
        </View>
        <If when={isTesting(state())}>
          <TryIt instruction={activity.tryIt} prediction={activity.options[state().prediction ?? 0]} />
        </If>
        <If when={!state().observed && !isTesting(state())}>
          <View class="gap-2">
            {activity.options.map((label, i) => (
              <OptionTile
                letter={String.fromCharCode(65 + i)}
                label={label}
                state={state().prediction === i ? "picked" : "open"}
                onPress={() => state.set(predict(state(), i))}
              />
            ))}
            <If when={state().prediction !== null}>
              <View class="mt-1 gap-2">
                <Text class="text-lg font-bold">How sure are you?</Text>
                <View class="flex-row gap-2">
                  <Each of={confidences}>
                    {(confidence) => (
                      <View
                        role="button"
                        accessibilityLabel={confidence()}
                        onPress={() => state.set(commit(state(), confidence()))}
                        class="flex-1 items-center gap-1 rounded-2xl border-2 px-1 py-2.5"
                        style={{ backgroundColor: tint(predictColor, 0.08), borderColor: tint(predictColor, 0.35) }}
                      >
                        <Text class="text-xl">{confidenceIcons[confidence()]}</Text>
                        <Text class="text-center text-sm font-semibold">{confidence()}</Text>
                      </View>
                    )}
                  </Each>
                </View>
              </View>
            </If>
          </View>
        </If>
        <If when={state().observed}>
          <AnswerPanel
            title={predictionTitle(right(), state().confidence ?? confidences[0])}
            explanation={predictResultText(activity, state())}
            lead={right() ? undefined : <AnswerLine text={activity.options[activity.answer]} />}
            color={right() ? feedbackColors.correct : predictColor}
            icon={right() ? "\u2713" : "\u2728"}
            onContinue={finish}
          />
        </If>
      </Scroll>
    </View>
  );
}

/** While the experiment runs: what to do, and the prediction being tested. */
function TryIt(props: { instruction: string; prediction: string }) {
  return (
    <View class="gap-1.5 rounded-[20px] p-3.5" style={{ backgroundColor: tint(predictColor, 0.1) }}>
      <View class="flex-row items-center gap-2">
        <Text class="text-xl">{"\u{1F446}"}</Text>
        <Text class="flex-1 text-lg font-bold" style={{ color: predictColor }}>
          {props.instruction}
        </Text>
      </View>
      <Text class="text-base text-zinc-500">{`You predicted: ${props.prediction}`}</Text>
    </View>
  );
}

/** The real answer, shown when the prediction missed. */
function AnswerLine(props: { text: string }) {
  return (
    <View class="flex-row items-center gap-1.5">
      <Text class="text-xl font-bold" style={{ color: feedbackColors.correct }}>
        {"\u2713"}
      </Text>
      <Text class="flex-1 text-lg font-bold" style={{ color: feedbackColors.correct }}>
        {props.text}
      </Text>
    </View>
  );
}
