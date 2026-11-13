import { Scroll, signal, Text, View } from "nsh";
import type { ChoiceQuestion, QuizActivity, Reason } from "../../core/course";
import {
  currentQuestion,
  isSettled,
  nextQuestion,
  pickAnswer,
  pickReason,
  type QuizState,
  quizStart,
  showHint,
} from "../../core/sessions/quiz";
import { ActivityHeader } from "../kit/activity-header";
import { AnswerPanel } from "../kit/answer-panel";
import { FadeIn } from "../kit/fade-in";
import { FeedbackBanner } from "../kit/feedback-banner";
import { type OptionState, OptionTile } from "../kit/option-tile";
import { Shake } from "../kit/shake";
import { StepDots } from "../kit/step-dots";
import { TextAction } from "../kit/text-action";
import { feedbackColors } from "../kit/theme";
import type { ActivityProps, RenderVisual } from "./types";

const lastOf = (picks: readonly number[]): number | undefined => picks[picks.length - 1];

/** Multiple-choice questions: a wrong pick is crossed out and explained, the hint comes on request or after two misses. */
export function QuizView<V>(props: ActivityProps<QuizActivity<V>> & { renderVisual?: RenderVisual<V> }) {
  const state = signal<QuizState>(quizStart);
  const shakes = signal<Readonly<Record<string, number>>>({});
  const renderVisual = props.renderVisual;
  let finished = false;

  const bump = (key: string) => shakes.update((s) => ({ ...s, [key]: (s[key] ?? 0) + 1 }));
  const current = () => currentQuestion(props.activity, state());

  const pick = (option: number) => {
    const before = state();
    const after = pickAnswer(props.activity, before, option);
    if (after.mistakes > before.mistakes) bump(`${before.index}:a${option}`);
    state.set(after);
  };
  const pickWhy = (option: number) => {
    const before = state();
    const after = pickReason(props.activity, before, option);
    if (after.mistakes > before.mistakes) bump(`${before.index}:r${option}`);
    state.set(after);
  };
  const advance = () => {
    if (finished) return;
    const step = nextQuestion(props.activity, state());
    if ("result" in step) {
      finished = true;
      props.complete(step.result);
    } else {
      state.set(step.state);
    }
  };

  const answerState = (q: ChoiceQuestion<V>, i: number): OptionState => {
    const s = state();
    if (s.answered && i === q.answer) return "correct";
    if (s.wrong.includes(i)) return "wrong";
    return s.answered ? "dimmed" : "open";
  };
  const reasonState = (r: Reason, i: number): OptionState => {
    const s = state();
    if (s.reasoned && i === r.answer) return "correct";
    if (s.wrongReasons.includes(i)) return "wrong";
    return s.reasoned ? "dimmed" : "open";
  };
  const wrongMessage = (q: ChoiceQuestion<V>) => {
    const s = state();
    const last = lastOf(s.wrong);
    if (s.answered || last === undefined) return undefined;
    return q.feedback?.[last] ?? "Not quite. Try another answer.";
  };
  const wrongReasonMessage = (r: Reason) => {
    const s = state();
    const last = lastOf(s.wrongReasons);
    if (s.reasoned || last === undefined) return undefined;
    return r.feedback?.[last] ?? "Not quite. Think about the particles.";
  };

  const reasonBlock = (index: number, reason: Reason) => (
    <View class="mt-2 gap-2.5">
      <View class="flex-row items-center gap-2">
        <Text class="text-xl font-bold" style={{ color: feedbackColors.correct }}>
          {"\u2713"}
        </Text>
        <Text class="text-lg font-bold" style={{ color: feedbackColors.correct }}>
          Right!
        </Text>
        <Text class="flex-1 text-lg font-bold">{reason.prompt ?? "Why is that?"}</Text>
      </View>
      {reason.options.map((label, i) => (
        <Shake trigger={shakes()[`${index}:r${i}`] ?? 0}>
          <OptionTile letter={`${i + 1}`} label={label} state={reasonState(reason, i)} onPress={() => pickWhy(i)} />
        </Shake>
      ))}
      <If when={wrongReasonMessage(reason)}>{(message) => <FeedbackBanner kind="wrong" message={message()} />}</If>
    </View>
  );

  const questionBody = (index: number) => {
    const q = props.activity.questions[index];
    const reason = q.reason;
    const visual = q.visual;
    const hintMessage = () => (!state().answered && state().hintShown ? q.hint : undefined);
    return (
      <View class="gap-2.5">
        <Text class="text-2xl font-bold leading-snug">{q.prompt}</Text>
        {renderVisual !== undefined && visual !== undefined ? (
          <View class="h-[180px] shrink-0">{renderVisual(visual)}</View>
        ) : undefined}
        <View class="mt-3 gap-2.5">
          {q.options.map((label, i) => (
            <Shake trigger={shakes()[`${index}:a${i}`] ?? 0}>
              <OptionTile
                letter={String.fromCharCode(65 + i)}
                label={label}
                state={answerState(q, i)}
                onPress={() => pick(i)}
              />
            </Shake>
          ))}
        </View>
        <If when={wrongMessage(q)}>{(message) => <FeedbackBanner kind="wrong" message={message()} />}</If>
        <If when={hintMessage()}>{(message) => <FeedbackBanner kind="hint" title="Hint" message={message()} />}</If>
        <If when={q.hint !== undefined && !state().answered && !state().hintShown}>
          <TextAction label="Need a hint?" onPress={() => state.set(showHint(state()))} />
        </If>
        {reason !== undefined ? <If when={state().answered}>{() => reasonBlock(index, reason)}</If> : undefined}
      </View>
    );
  };

  return (
    <View class="flex-1 gap-4 px-5 pb-5 pt-2">
      <ActivityHeader
        kind={props.activity.role === "warmUp" ? "warmUp" : "check"}
        trailing={
          <View class="flex-row items-center gap-2.5">
            <Text class="text-base font-semibold text-zinc-500">
              {`${state().index + 1} of ${props.activity.questions.length}`}
            </Text>
            <StepDots count={props.activity.questions.length} current={state().index} />
          </View>
        }
      />
      <Scroll class="-mx-5 flex-1" contentClass="px-5">
        <Each of={[state().index]}>{(index) => <FadeIn>{questionBody(index())}</FadeIn>}</Each>
      </Scroll>
      <If when={isSettled(props.activity, state())}>
        <AnswerPanel
          title={
            state().wrong.length === 0 && state().wrongReasons.length === 0 && !state().hintShown
              ? "Correct!"
              : "You got it!"
          }
          explanation={current().explanation}
          onContinue={advance}
        />
      </If>
    </View>
  );
}
