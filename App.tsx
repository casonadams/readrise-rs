import { mount, signal } from "nsh";
import { createNavStack, NavPage, NavStack } from "nsh/base";
import { attemptActivities } from "./src/core/attempt";
import { Catalog } from "./src/core/catalog";
import type { CourseId, LessonId } from "./src/core/course";
import { lessonKey, localDay, recordLesson, streakOn } from "./src/core/progress";
import type { ActivityResult } from "./src/core/scoring";
import { type LessonSession, resumeOrStart } from "./src/core/session";
import { statesOfMatterPack } from "./src/courses/states-of-matter/pack";
import type { CoursePack } from "./src/ui/course-pack";
import { SubjectColor } from "./src/ui/kit/theme";
import { LessonResult } from "./src/ui/lesson-result";
import { LessonRunner } from "./src/ui/lesson-runner";
import { PathScreen } from "./src/ui/path-screen";
import { createProgressStore } from "./src/ui/progress-store";
import { sessionStore } from "./src/ui/session-store";

type Route = { readonly name: "path" } | { readonly name: "lesson"; readonly courseId: CourseId; readonly lessonId: LessonId };

/** The installed courses, in learning order. */
const packs: readonly CoursePack[] = [statesOfMatterPack];
const catalog = new Catalog(packs.map((p) => p.course));
const store = createProgressStore();
const nav = createNavStack<Route>([{ name: "path" }]);
const today = () => localDay(new Date());

function LessonPage(props: { courseId: CourseId; lessonId: LessonId }) {
  const { course, lesson } = catalog.lesson(props.courseId, props.lessonId);
  const key = lessonKey(course, lesson);
  const session = signal<LessonSession | null>(null);
  void sessionStore
    .load()
    .then((saved) => session.set(resumeOrStart(saved, key, lesson.activities.length, Date.now())));
  const outcome = signal<ActivityResult | null>(null);
  const finish = (result: ActivityResult) => {
    outcome.set(result);
    void sessionStore.clear(key);
    void store.save(recordLesson(store.progress(), course, lesson, result, today()));
  };
  const next = () => catalog.nextUp(store.progress(), course.subject.id);
  return (
    <NavPage title={lesson.title} headerVisible={false} popOnSwipe={false}>
      <If
        when={outcome()}
        else={
          <If when={session()}>
            {(start) => (
              <LessonRunner
                lesson={{ ...lesson, activities: attemptActivities(lesson, start().seed) }}
                session={start()}
                renderActivity={packs[catalog.courses.indexOf(course)].renderActivity}
                onProgress={(next) => void sessionStore.save(next)}
                onFinish={finish}
                onLeave={() => nav.pop()}
              />
            )}
          </If>
        }
      >
        {(result) => (
          <LessonResult
            outcome={result()}
            streak={streakOn(store.progress(), today())}
            nextTitle={next()?.lesson.title ?? null}
            onBack={() => nav.pop()}
            onNext={() => {
              const ref = next();
              if (ref !== null) nav.replace({ name: "lesson", courseId: ref.course.id, lessonId: ref.lesson.id });
            }}
          />
        )}
      </If>
    </NavPage>
  );
}

function App() {
  return (
    <SubjectColor.Provider value={catalog.courses[0].subject.color}>
      <NavStack state={nav} class="flex-1">
        {(route) =>
          route.name === "path" ? (
            <NavPage title="Science" headerVisible={false}>
              <PathScreen
                catalog={catalog}
                courses={catalog.courses}
                progress={store.progress}
                today={today()}
                onOpen={(course, lesson) => nav.push({ name: "lesson", courseId: course.id, lessonId: lesson.id })}
              />
            </NavPage>
          ) : (
            <LessonPage courseId={route.courseId} lessonId={route.lessonId} />
          )
        }
      </NavStack>
    </SubjectColor.Provider>
  );
}

mount(App);
