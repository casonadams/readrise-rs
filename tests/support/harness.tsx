import { host, mount, signal, Text, View } from "nsh";
import type { JSX } from "nsh/jsx-runtime";
import { type Lesson, lessonId } from "../../src/core/course";
import type { ActivityResult } from "../../src/core/scoring";
import { startSession } from "../../src/core/session";
import { statesOfMatter } from "../../src/courses/states-of-matter/course";
import { HeatLabView } from "../../src/courses/states-of-matter/ui/heat-lab-view";
import { ExplainerView } from "../../src/ui/activities/explainer";
import { PredictView } from "../../src/ui/activities/predict";
import { QuizView } from "../../src/ui/activities/quiz";
import { SortView } from "../../src/ui/activities/sort";
import { WhoIsRightView } from "../../src/ui/activities/who-is-right";
import { PrimaryButton } from "../../src/ui/kit/button";
import { SubjectColor } from "../../src/ui/kit/theme";
import { LessonResult } from "../../src/ui/lesson-result";
import { LessonRunner } from "../../src/ui/lesson-runner";
import * as fixtures from "./fixtures";
import { type TestCourse, testCourses } from "./installed";

/**
 * Test entry: mounts the screen `host.params.screen` names. Activities run inside the real lesson runner, so they
 * get the height they get in the app; `complete` shows as `done: <xp> xp, <mistakes> mistakes`.
 */
function Done(props: { result: ActivityResult }) {
  return <Text>{`done: ${props.result.xp} xp, ${props.result.mistakes} mistakes`}</Text>;
}

function InRunner<A>(props: { activity: A; render: (activity: A, complete: (r: ActivityResult) => void) => JSX.Element }) {
  const result = signal<ActivityResult | null>(null);
  const lesson: Lesson<A> = { id: lessonId("harness"), title: "Harness", activities: [props.activity] };
  return (
    <If
      when={result()}
      else={
        <LessonRunner
          lesson={lesson}
          session={startSession("harness", 0)}
          renderActivity={props.render}
          onResult={() => {}}
          onProgress={() => {}}
          onFinish={(r) => result.set(r)}
          onLeave={() => {}}
        />
      }
    >
      {(r) => <Done result={r()} />}
    </If>
  );
}

function fixtureActivity(name: string): JSX.Element {
  switch (name) {
    case "quiz":
      return <InRunner activity={fixtures.quiz} render={(a, complete) => <QuizView activity={a} complete={complete} />} />;
    case "quizReason":
      return (
        <InRunner activity={fixtures.quizReason} render={(a, complete) => <QuizView activity={a} complete={complete} />} />
      );
    case "sort":
      return <InRunner activity={fixtures.sort} render={(a, complete) => <SortView activity={a} complete={complete} />} />;
    case "whoIsRight":
      return (
        <InRunner
          activity={fixtures.whoIsRight}
          render={(a, complete) => <WhoIsRightView activity={a} complete={complete} />}
        />
      );
    case "predict":
      return (
        <InRunner
          activity={fixtures.predict}
          render={(a, complete) => (
            <PredictView activity={a} complete={complete} renderExperiment={fixtures.renderFakeExperiment} />
          )}
        />
      );
    case "explainer":
      return (
        <InRunner
          activity={fixtures.explainer}
          render={(a, complete) => <ExplainerView activity={a} complete={complete} renderScene={fixtures.renderFakeScene} />}
        />
      );
  }
  throw new Error(`unknown fixture activity: ${name}`);
}

function ExperimentHarness(props: { course: TestCourse; experiment: string; active: boolean }) {
  const observed = signal(0);
  return (
    <View class="flex-1 p-6">
      {props.course.experiment(props.experiment, {
        active: props.active,
        onObserved: () => observed.update((n) => n + 1),
      })}
      <Text>{`Observed ${observed()}`}</Text>
    </View>
  );
}

/** An active experiment the learner can leave: "Leave" takes it off the screen. */
function LeavingExperimentHarness(props: { course: TestCourse; experiment: string }) {
  const observed = signal(0);
  const shown = signal(true);
  return (
    <View class="flex-1 p-6">
      <If when={shown()}>
        {props.course.experiment(props.experiment, { active: true, onObserved: () => observed.update((n) => n + 1) })}
      </If>
      <Text>{`Observed ${observed()}`}</Text>
      <PrimaryButton label="Leave" onPress={() => shown.set(false)} />
    </View>
  );
}

function SceneHarness(props: { course: TestCourse; scene: string }) {
  const step = signal(0);
  const last = props.course.sceneSteps[props.scene] - 1;
  return (
    <View class="flex-1 gap-3 p-6">
      <View class="flex-1">{props.course.scene(props.scene, step)}</View>
      <Text>{`Step ${step()}`}</Text>
      <PrimaryButton label="Next step" onPress={() => step.update((n) => Math.min(last, n + 1))} />
    </View>
  );
}

function HeatLabHarness() {
  const result = signal<ActivityResult | null>(null);
  return (
    <View class="flex-1">
      <HeatLabView activity={fixtures.heatLab} complete={(r) => result.set(r)} />
      <Text>{result() === null ? "Result none" : `Result ${result()?.xp}`}</Text>
    </View>
  );
}

/** The runner over three stand-in steps, from a saved session when `index`, `xp` and `mistakes` are given. */
function RunnerHarness() {
  const status = signal("running");
  const saved = signal("nothing saved");
  const params = host.params;
  const session = {
    ...startSession("fixture", 0),
    index: Number(params.index ?? 0),
    xp: Number(params.xp ?? 0),
    mistakes: Number(params.mistakes ?? 0),
  };
  return (
    <View class="flex-1">
      <Text>{status()}</Text>
      <Text>{saved()}</Text>
      <LessonRunner
        lesson={fixtures.steps}
        session={session}
        onResult={() => {}}
        onProgress={(s) => saved.set(`saved at ${s.index}: ${s.xp} xp, ${s.mistakes} mistakes`)}
        renderActivity={(step, complete) => (
          <View role="button" onPress={() => complete(step.result)} class="p-4">
            <Text>{`Finish ${step.name}`}</Text>
          </View>
        )}
        onFinish={(r) => status.set(`finished: ${r.xp} xp, ${r.mistakes} mistakes`)}
        onLeave={() => status.set("left")}
      />
    </View>
  );
}

function ResultHarness() {
  const pressed = signal("nothing pressed");
  return (
    <View class="flex-1">
      <Text>{pressed()}</Text>
      <LessonResult
        outcome={{ xp: Number(host.params.xp), mistakes: Number(host.params.mistakes) }}
        streak={Number(host.params.streak)}
        nextTitle={typeof host.params.next === "string" ? host.params.next : null}
        onNext={() => pressed.set("next pressed")}
        onBack={() => pressed.set("back pressed")}
      />
    </View>
  );
}

function screen(): JSX.Element {
  const params = host.params;
  const course = testCourses[String(params.course ?? statesOfMatter.id)];
  switch (params.screen) {
    case "lesson-activity": {
      const activity = course.course.lessons[Number(params.lesson)].activities[Number(params.activity)];
      return <InRunner activity={activity} render={course.pack.renderActivity} />;
    }
    case "fixture-activity":
      return fixtureActivity(String(params.activity));
    case "experiment":
      return <ExperimentHarness course={course} experiment={String(params.experiment)} active={params.active === true} />;
    case "experiment-leaving":
      return <LeavingExperimentHarness course={course} experiment={String(params.experiment)} />;
    case "scene":
      return <SceneHarness course={course} scene={String(params.scene)} />;
    case "heat-lab":
      return <HeatLabHarness />;
    case "runner":
      return <RunnerHarness />;
    case "result":
      return <ResultHarness />;
  }
  throw new Error(`unknown screen: ${String(params.screen)}`);
}

function Harness() {
  return (
    <SubjectColor.Provider value={testCourses[String(host.params.course ?? statesOfMatter.id)].course.subject.color}>
      <View class="flex-1 bg-background text-foreground">{screen()}</View>
    </SubjectColor.Provider>
  );
}

mount(Harness);
