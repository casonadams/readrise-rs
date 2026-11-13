import { createAnimatedValue, type PanEvent, Scroll, signal, Text, View, type ViewRef } from "nsh";
import type { SortActivity } from "../../core/course";
import { drop as dropInto, finishSort, showSortHint, type SortState, sortStart } from "../../core/sessions/sort";
import { ActivityHeader } from "../kit/activity-header";
import { PrimaryButton } from "../kit/button";
import { FadeIn } from "../kit/fade-in";
import { FeedbackBanner } from "../kit/feedback-banner";
import { Shake } from "../kit/shake";
import { TextAction } from "../kit/text-action";
import { tint } from "../kit/tint";
import { activityKinds, feedbackColors, SubjectColor } from "../kit/theme";
import type { ActivityProps } from "./types";

const binColors = ["#1E88E5", "#EF6C00", "#00897B"];
const progressWidth = 90;

interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Sort each item into the right box: drag it, or tap a box. A wrong box is answered with the rule. */
export function SortView(props: ActivityProps<SortActivity>) {
  const activity = props.activity;
  const total = activity.items.length;
  const state = signal<SortState>(sortStart(activity));
  const shakes = signal<Readonly<Record<number, number>>>({});
  const flashing = signal<number | null>(null);
  const dragX = createAnimatedValue(0);
  const dragY = createAnimatedValue(0);
  const hovered = signal<number | null>(null);
  let touchStart: { x: number; y: number } | null = null;
  const binRefs: (ViewRef | undefined)[] = [];
  let cardRef: ViewRef | undefined;
  let cardCentre: { x: number; y: number } | null = null;
  let rects: (Rect | undefined)[] = [];
  let finished = false;

  const binAt = (x: number, y: number): number | null => {
    const i = rects.findIndex(
      (r) => r !== undefined && x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height,
    );
    return i < 0 ? null : i;
  };
  const measureBins = async () => {
    rects = await Promise.all(
      binRefs.map(async (ref) => {
        const m = await ref?.measure();
        if (!m) return undefined;
        return {
          x: m.pagePosition.x,
          y: m.pagePosition.y,
          width: m.bounds.size.width,
          height: m.bounds.size.height,
        };
      }),
    );
  };
  const measureCard = async () => {
    const m = await cardRef?.measure();
    cardCentre = m
      ? { x: m.pagePosition.x + m.bounds.size.width / 2, y: m.pagePosition.y + m.bounds.size.height / 2 }
      : null;
  };

  const place = (bin: number) => {
    const before = state();
    const after = dropInto(activity, before, bin);
    if (after.mistakes > before.mistakes) {
      shakes.update((s) => ({ ...s, [bin]: (s[bin] ?? 0) + 1 }));
      flashing.set(bin);
      setTimeout(() => flashing.set(null), 500);
    }
    state.set(after);
  };

  let measured: Promise<unknown> = Promise.resolve();
  const startDrag = () => {
    measured = Promise.all([measureBins(), measureCard()]);
  };
  const endDrag = async (e: PanEvent) => {
    hovered.set(null);
    await measured;
    const centre = e.cancelled ? null : cardCentre;
    const bin = centre === null ? null : binAt(centre.x + e.translation.x, centre.y + e.translation.y);
    if (bin !== null) {
      dragX.set(0);
      dragY.set(0);
      place(bin);
      return;
    }
    void dragX.spring(0, { velocity: e.velocity.x });
    void dragY.spring(0, { velocity: e.velocity.y });
  };

  const finish = () => {
    if (finished) return;
    const step = finishSort(activity, state());
    if ("result" in step) {
      finished = true;
      props.complete(step.result);
    }
  };

  return (
    <View class="flex-1 gap-3 px-5 pb-5 pt-2">
      <ActivityHeader
        kind="sort"
        trailing={
          <View class="flex-row items-center gap-2.5">
            <Text class="text-base font-semibold text-zinc-500">{`${state().next} of ${total}`}</Text>
            <View class="h-2 overflow-hidden rounded-full bg-zinc-300" style={{ width: progressWidth }}>
              <View
                class="h-2 rounded-full"
                style={{
                  width: total === 0 ? progressWidth : progressWidth * (state().next / total),
                  backgroundColor: activityKinds.sort.color,
                  transitionProperty: "all",
                  transitionDuration: 300,
                }}
              />
            </View>
          </View>
        }
      />
      <Text class="shrink-0 text-2xl font-bold leading-snug">{activity.prompt}</Text>
      <View class="z-10 min-h-[108px] shrink-0 items-center justify-center">
        <Each of={[state().next]}>
          {(item) =>
            item() < total ? (
              <FadeIn>
                <View class="items-center gap-1.5">
                  <View
                    ref={(ref: ViewRef) => {
                      cardRef = ref;
                    }}
                    pan={{ x: dragX, y: dragY }}
                    onPanStart={startDrag}
                    onPanEnd={endDrag}
                    onTouchStart={(e) => {
                      touchStart = { x: e.pageX, y: e.pageY };
                      startDrag();
                    }}
                    onTouchMove={(e) => {
                      if (touchStart === null || cardCentre === null) return;
                      hovered.set(
                        binAt(cardCentre.x + e.pageX - touchStart.x, cardCentre.y + e.pageY - touchStart.y),
                      );
                    }}
                    onTouchEnd={() => hovered.set(null)}
                    onTouchCancel={() => hovered.set(null)}
                    class="flex-row items-center rounded-[20px] border-2 bg-white py-3.5 pl-3 pr-6 dark:bg-zinc-900"
                    style={{ borderColor: SubjectColor(), translate: [dragX, dragY] }}
                  >
                    <Text class="text-3xl font-bold leading-snug">{activity.items[item()].label}</Text>
                  </View>
                  <Text class="text-sm text-zinc-500">Drag it to a box, or tap a box</Text>
                </View>
              </FadeIn>
            ) : (
              <FadeIn>
                <View class="items-center gap-1">
                  <Text class="text-4xl">{"\u{1F389}"}</Text>
                  <Text class="text-2xl font-bold">All sorted!</Text>
                </View>
              </FadeIn>
            )
          }
        </Each>
      </View>
      <Scroll class="-mx-5 flex-1" contentClass="gap-3 px-5 pb-1">
        <If when={state().feedback}>
          {(feedback) => (
            <FeedbackBanner kind={feedback().kind} title={feedback().title} message={feedback().message} />
          )}
        </If>
        <If when={state().next < total && activity.hint !== undefined && !state().hintShown}>
          <TextAction label="Need a hint?" onPress={() => state.set(showSortHint(activity, state()))} />
        </If>
        <View class="flex-row gap-2.5">
          <Each of={activity.bins} key="index">
            {(title, i) => (
              <Bin
                title={title()}
                color={binColors[i() % binColors.length]}
                compact={activity.bins.length > 2}
                labels={() => state().placed[i()].map((item) => activity.items[item].label)}
                hovered={() => hovered() === i()}
                flashing={() => flashing() === i()}
                shake={() => shakes()[i()] ?? 0}
                onPress={() => place(i())}
                setRef={(ref) => {
                  binRefs[i()] = ref;
                }}
              />
            )}
          </Each>
        </View>
      </Scroll>
      <If when={state().next === total}>
        <PrimaryButton label="Continue" onPress={finish} />
      </If>
    </View>
  );
}

function Bin(props: {
  title: string;
  color: string;
  compact: boolean;
  labels: () => readonly string[];
  hovered: () => boolean;
  flashing: () => boolean;
  shake: () => number;
  onPress: () => void;
  setRef: (ref: ViewRef) => void;
}) {
  const lit = () => props.hovered() || props.flashing();
  const edge = () => (props.flashing() ? feedbackColors.wrong : props.color);
  return (
    <Shake class="flex-1" trigger={props.shake()}>
      <View
        ref={props.setRef}
        role="button"
        accessibilityLabel={props.title}
        onPress={props.onPress}
        class={`flex-1 rounded-[22px] ${props.compact ? "p-2" : "p-3"}`}
        style={{
          backgroundColor: tint(edge(), lit() ? 0.16 : 0.07),
          borderWidth: props.hovered() ? 3 : 2,
          borderColor: tint(edge(), lit() ? 1 : 0.35),
          transitionProperty: "all",
          transitionDuration: 150,
        }}
      >
        <View class="flex-row items-center justify-between gap-1.5">
          <Text class={`flex-1 font-bold ${props.compact ? "text-base" : "text-lg"}`} style={{ color: props.color }}>
            {props.title}
          </Text>
          <If when={props.labels().length > 0}>
            <View class="rounded-full px-2 py-0.5" style={{ backgroundColor: props.color }}>
              <Text class="text-sm text-white">{`${props.labels().length}`}</Text>
            </View>
          </If>
        </View>
        <View class="mt-2.5 flex-row flex-wrap gap-1.5">
          <Each of={props.labels()} key="index">
            {(label) => (
              <View
                class={`max-w-full rounded-xl border bg-white py-1.5 dark:bg-zinc-900 ${props.compact ? "px-2" : "px-2.5"}`}
                style={{ borderColor: tint(props.color, 0.5) }}
              >
                <Text class={props.compact ? "text-sm" : "text-base"}>{label()}</Text>
              </View>
            )}
          </Each>
        </View>
      </View>
    </Shake>
  );
}
