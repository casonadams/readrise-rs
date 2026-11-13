import { Scroll, signal, Text, View } from "nsh";
import type { Claim, WhoIsRightActivity } from "../../core/course";
import { pickClaim, type WhoIsRightState, whoIsRightResult, whoIsRightStart } from "../../core/sessions/who-is-right";
import { ActivityHeader } from "../kit/activity-header";
import { AnswerPanel } from "../kit/answer-panel";
import { FeedbackBanner } from "../kit/feedback-banner";
import { KidAvatar } from "../kit/kid-avatar";
import type { OptionState } from "../kit/option-tile";
import { Shake } from "../kit/shake";
import { tint } from "../kit/tint";
import { feedbackColors } from "../kit/theme";
import type { ActivityProps } from "./types";

const neutral = "#D4D4D8";

/** Classmates disagree; the learner picks who is right. Each wrong claim is a common misconception with its own reply. */
export function WhoIsRightView(props: ActivityProps<WhoIsRightActivity>) {
  const activity = props.activity;
  const state = signal<WhoIsRightState>(whoIsRightStart);
  const shakes = signal<Readonly<Record<number, number>>>({});
  let finished = false;

  const pick = (claim: number) => {
    const before = state();
    const after = pickClaim(activity, before, claim);
    if (after.wrong.length > before.wrong.length) {
      shakes.update((s) => ({ ...s, [claim]: (s[claim] ?? 0) + 1 }));
    }
    state.set(after);
  };
  const finish = () => {
    if (finished) return;
    finished = true;
    props.complete(whoIsRightResult(activity, state()));
  };

  const stateOf = (i: number): OptionState => {
    const s = state();
    if (s.solved && i === activity.answer) return "correct";
    if (s.wrong.includes(i)) return "wrong";
    return s.solved ? "dimmed" : "open";
  };
  const lastWrongIndex = () => {
    const wrong = state().wrong;
    return wrong[wrong.length - 1];
  };

  return (
    <View class="flex-1 gap-3 px-5 pb-5 pt-2">
      <ActivityHeader kind="whoIsRight" />
      <Text class="text-2xl font-bold leading-snug">{activity.situation}</Text>
      <Text class="text-base text-zinc-500">Tap the one who is right.</Text>
      <Scroll class="-mx-5 flex-1" contentClass="gap-3.5 px-5 pb-2">
        {activity.claims.map((claim, i) => (
          <Shake trigger={shakes()[i] ?? 0}>
            <ClaimCard claim={claim} state={stateOf(i)} avatarOnRight={i % 2 === 1} onPress={() => pick(i)} />
          </Shake>
        ))}
        <If when={!state().solved && lastWrongIndex() !== undefined}>
          <FeedbackBanner
            kind="wrong"
            title={`Not ${activity.claims[lastWrongIndex() ?? 0].kid.name}`}
            message={activity.feedback[lastWrongIndex() ?? 0] ?? "Think about what the particles are doing."}
          />
        </If>
      </Scroll>
      <If when={state().solved}>
        <AnswerPanel
          title={`Yes! ${activity.claims[activity.answer].kid.name} is right.`}
          explanation={activity.explanation}
          onContinue={finish}
        />
      </If>
    </View>
  );
}

function ClaimCard(props: { claim: Claim; state: OptionState; avatarOnRight: boolean; onPress: () => void }) {
  const edge = () => {
    if (props.state === "correct") return feedbackColors.correct;
    if (props.state === "wrong") return feedbackColors.wrong;
    return neutral;
  };
  const marked = () => props.state === "correct" || props.state === "wrong";
  const faded = () => props.state === "wrong" || props.state === "dimmed";
  const suffix = () => {
    if (props.state === "correct") return ", right";
    if (props.state === "wrong") return ", wrong";
    return "";
  };
  const avatar = (
    <View class="items-center gap-1">
      <KidAvatar kid={props.claim.kid} />
      <Text class="text-base font-semibold">{props.claim.kid.name}</Text>
    </View>
  );
  const bubble = (
    <View
      role="button"
      accessibilityLabel={`${props.claim.kid.name}: ${props.claim.says}${suffix()}`}
      onPress={() => {
        if (props.state === "open") props.onPress();
      }}
      class="min-h-[60px] flex-1 flex-row items-center gap-2 border-2 bg-white p-3.5 dark:bg-zinc-900"
      style={{
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderBottomLeftRadius: props.avatarOnRight ? 20 : 4,
        borderBottomRightRadius: props.avatarOnRight ? 4 : 20,
        borderColor: edge(),
        backgroundColor: marked() ? tint(edge(), 0.1) : undefined,
      }}
    >
      <Text class="flex-1 text-lg font-semibold leading-snug">{`\u201C${props.claim.says}\u201D`}</Text>
      <If when={marked()}>
        <Text class="text-xl font-bold" style={{ color: edge() }}>
          {props.state === "correct" ? "\u2713" : "\u2715"}
        </Text>
      </If>
    </View>
  );
  return (
    <View
      class="flex-row items-end gap-2.5"
      style={{ opacity: faded() ? 0.55 : 1, transitionProperty: "opacity", transitionDuration: 250 }}
    >
      {props.avatarOnRight ? bubble : avatar}
      {props.avatarOnRight ? avatar : bubble}
    </View>
  );
}
