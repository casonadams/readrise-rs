import { signal, Text, View } from "nsh";
import { AlertDialog } from "nsh/base";
import type { JSX } from "nsh/jsx-runtime";
import type { Lesson } from "../core/course";
import type { ActivityResult } from "../core/scoring";
import { advanceSession, type LessonSession } from "../core/session";
import { SubjectColor } from "./kit/theme";

function Segments(props: { total: number; done: number }) {
  return (
    <View class="flex-1 flex-row gap-1" accessible accessibilityLabel={`Step ${props.done + 1} of ${props.total}`}>
      <Each of={Array.from({ length: props.total }, (_, i) => i)}>
        {(i) => (
          <View
            class={`h-3 flex-1 rounded-md transition ${i() > props.done ? "bg-zinc-200 dark:bg-zinc-700" : ""}`}
            style={
              i() > props.done ? undefined : { backgroundColor: SubjectColor(), opacity: i() < props.done ? 1 : 0.35 }
            }
          />
        )}
      </Each>
    </View>
  );
}

/**
 * Plays a lesson's activities in order from `session`, summing their results: `onResult` gets each activity's
 * result, `onProgress` the session after it, and `onFinish` the lesson's outcome. Leaving after the first
 * activity asks first.
 */
export function LessonRunner<A>(props: {
  lesson: Lesson<A>;
  session: LessonSession;
  renderActivity: (activity: A, complete: (result: ActivityResult) => void) => JSX.Element;
  onResult: (result: ActivityResult) => void;
  onProgress: (session: LessonSession) => void;
  onFinish: (outcome: ActivityResult) => void;
  onLeave: () => void;
}) {
  const session = signal(props.session);
  const index = () => session().index;
  let finished = false;
  const complete = (at: number) => (result: ActivityResult) => {
    if (at !== index() || finished) return;
    props.onResult(result);
    const step = advanceSession(session(), result, props.lesson.activities.length);
    if ("outcome" in step) {
      finished = true;
      props.onFinish(step.outcome);
    } else {
      session.set(step.session);
      props.onProgress(step.session);
    }
  };
  const leave = async () => {
    if (index() === 0) return props.onLeave();
    const choice = await AlertDialog.show({
      title: "Leave this lesson?",
      description: "Next time, you will start again at this step.",
      actions: [
        { id: "stay", label: "Keep going", role: "cancel" },
        { id: "leave", label: "Leave", role: "destructive" },
      ],
    });
    if (choice.action === "leave") props.onLeave();
  };
  return (
    <View class="flex-1 bg-background text-foreground pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <View class="flex-row items-center gap-2 pl-1 pr-5 pt-2 pb-1">
        <View
          role="button"
          accessibilityLabel="Leave lesson"
          onPress={leave}
          class="h-12 w-12 items-center justify-center rounded-full active:bg-zinc-100 dark:active:bg-zinc-800"
        >
          <Text class="text-2xl text-zinc-500">{"\u2715"}</Text>
        </View>
        <Segments total={props.lesson.activities.length} done={index()} />
      </View>
      <View class="flex-1">
        <Each of={[index()]} key={(i) => i}>
          {(at) => props.renderActivity(props.lesson.activities[at()], complete(at()))}
        </Each>
      </View>
    </View>
  );
}
