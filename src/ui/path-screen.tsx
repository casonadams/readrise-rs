import { announce, cleanup, type Signal, Scroll, signal, Text, View } from "nsh";
import type { Catalog } from "../core/catalog";
import type { Course, Grade, Lesson } from "../core/course";
import { type Day, type Progress, starsOf, streakOn } from "../core/progress";
import { LessonNode, type NodeState } from "./lesson-node";

export function gradeLabel(grade: Grade): string {
  if (grade === "preK") return "Pre-K";
  if (grade === "kindergarten") return "Kindergarten";
  return `Grade ${grade.slice("grade".length)}`;
}

/** Sideways offset of the `index`th node, so the path winds down the screen. */
function windOffset(index: number): number {
  return Math.round(Math.sin(index * 1.1) * 72);
}

function StatChip(props: { emoji: string; value: number; label: string; lit: boolean }) {
  return (
    <View
      class={`flex-row items-center gap-1 rounded-full px-3 py-1.5 ${props.lit ? "bg-orange-100 dark:bg-orange-950" : "bg-zinc-100 dark:bg-zinc-800"}`}
      accessibilityLabel={`${props.value} ${props.label}`}
    >
      <Text>{props.emoji}</Text>
      <Text class="font-bold text-foreground">{String(props.value)}</Text>
    </View>
  );
}

function CourseBanner(props: { course: Course<unknown>; open: boolean }) {
  return (
    <View
      class={`mx-4 mt-5 mb-1 rounded-[22px] p-[18px] ${props.open ? "" : "bg-zinc-200 dark:bg-zinc-800"}`}
      style={props.open ? { backgroundColor: props.course.subject.color } : undefined}
    >
      <Text class={`text-xs font-extrabold tracking-widest ${props.open ? "text-white/85" : "text-zinc-500"}`}>
        {gradeLabel(props.course.grade).toUpperCase()}
      </Text>
      <Text class={`text-2xl font-extrabold ${props.open ? "text-white" : "text-zinc-500"}`}>{props.course.title}</Text>
    </View>
  );
}

/** One subject's learning path: each course a banner over a winding trail of lessons. */
export function PathScreen<A>(props: {
  catalog: Catalog<A>;
  courses: readonly Course<A>[];
  progress: Signal<Progress>;
  today: Day;
  onOpen: (course: Course<A>, lesson: Lesson<A>) => void;
}) {
  const subject = props.courses[0].subject;
  const notice = signal<string | null>(null);
  let noticeTimer: ReturnType<typeof setTimeout> | undefined;
  cleanup(() => clearTimeout(noticeTimer));
  const nodeState = (course: Course<A>, index: number): NodeState => {
    const lesson = course.lessons[index];
    if (!props.catalog.isLessonUnlocked(props.progress(), course, lesson)) return "locked";
    return starsOf(props.progress(), course, lesson) > 0 ? "done" : "open";
  };
  const press = (course: Course<A>, index: number) => {
    if (nodeState(course, index) !== "locked") return props.onOpen(course, course.lessons[index]);
    clearTimeout(noticeTimer);
    const message = props.catalog.isCourseUnlocked(props.progress(), course)
      ? `Finish ${course.lessons[index - 1].title} first.`
      : `Finish ${course.requires.map((id) => props.catalog.course(id).title).join(" and ")} to unlock this unit.`;
    notice.set(message);
    announce(message);
    noticeTimer = setTimeout(() => notice.set(null), 2500);
  };
  return (
    <View class="flex-1 bg-background text-foreground pt-[env(safe-area-inset-top)]">
      <View class="flex-row items-center gap-2 px-4 py-3">
        <Text class="flex-1 text-2xl font-bold text-foreground">{`${subject.emoji} ${subject.title}`}</Text>
        <StatChip
          emoji={"\u{1F525}"}
          value={streakOn(props.progress(), props.today)}
          label="day streak"
          lit={streakOn(props.progress(), props.today) > 0}
        />
        <StatChip emoji={"\u2B50"} value={props.progress().xp} label="XP" lit={false} />
      </View>
      <Scroll class="flex-1" contentClass="pb-[calc(env(safe-area-inset-bottom)+48px)]">
        <Each of={props.courses}>
          {(course) => (
            <View>
              <CourseBanner course={course()} open={props.catalog.isCourseUnlocked(props.progress(), course())} />
              <View class="mt-2 items-center">
                <Each of={course().lessons}>
                  {(lesson, index) => (
                    <LessonNode
                      title={lesson().title}
                      state={nodeState(course(), index())}
                      stars={starsOf(props.progress(), course(), lesson())}
                      offset={windOffset(index())}
                      color={subject.color}
                      onPress={() => press(course(), index())}
                    />
                  )}
                </Each>
              </View>
            </View>
          )}
        </Each>
      </Scroll>
      <If when={notice()}>
        {(message) => (
          <View
            class="absolute inset-x-4 bottom-0 mb-[calc(env(safe-area-inset-bottom)+16px)] rounded-xl bg-zinc-800 px-4 py-3 dark:bg-zinc-200"
          >
            <Text class="text-white dark:text-zinc-900">
              {message()}
            </Text>
          </View>
        )}
      </If>
    </View>
  );
}
