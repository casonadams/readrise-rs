import { host, mount, signal, Text, View } from "nsh";
import type { JSX } from "nsh/jsx-runtime";
import type { Lesson } from "../../src/core/course";
import type { ActivityResult } from "../../src/core/scoring";
import { statesOfMatter } from "../../src/science/course";
import type { ExperimentId, SceneSpec } from "../../src/science/types";
import { renderExperiment } from "../../src/science/ui/experiments";
import { HeatLabView } from "../../src/science/ui/heat-lab-view";
import { renderScene } from "../../src/science/ui/scenes";
import { renderScienceActivity } from "../../src/ui/activities";
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

/**
 * Test entry: mounts the screen `host.params.screen` names. Activities run inside the real lesson runner, so they
 * get the height they get in the app; `complete` shows as `done: <xp> xp, <mistakes> mistakes`.
 */
function Done(props: { result: ActivityResult }) {
  return <Text>{`done: ${props.result.xp} xp, ${props.result.mistakes} mistakes`}</Text>;
}

function InRunner<A>(props: { activity: A; render: (activity: A, complete: (r: ActivityResult) => void) => JSX.Element }) {
  const result = signal<ActivityResult | null>(null);
  const lesson: Lesson<A> = { id: "harness", title: "Harness", activities: [props.activity] };
  return (
    <If
      when={result()}
      else={<LessonRunner lesson={lesson} renderActivity={props.render} onFinish={(r) => result.set(r)} onLeave={() => {}} />}
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

function ExperimentHarness(props: { experiment: ExperimentId; active: boolean }) {
  const observed = signal(0);
  return (
    <View class="flex-1 p-6">
      {renderExperiment(props.experiment, { active: props.active, onObserved: () => observed.update((n) => n + 1) })}
      <Text>{`Observed ${observed()}`}</Text>
    </View>
  );
}

const sceneSteps: Record<SceneSpec["id"], number> = { matter: 4, waterMolecule: 5, states: 5, heat: 3 };

function SceneHarness(props: { scene: SceneSpec }) {
  const step = signal(0);
  const last = props.scene.id === "heat" ? props.scene.stages.length - 1 : sceneSteps[props.scene.id] - 1;
  return (
    <View class="flex-1 gap-3 p-6">
      <View class="flex-1">{renderScene(props.scene, step)}</View>
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

function RunnerHarness() {
  const status = signal("running");
  return (
    <View class="flex-1">
      <Text>{status()}</Text>
      <LessonRunner
        lesson={fixtures.steps}
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
  switch (params.screen) {
    case "lesson-activity": {
      const activity = statesOfMatter.lessons[Number(params.lesson)].activities[Number(params.activity)];
      return <InRunner activity={activity} render={renderScienceActivity} />;
    }
    case "fixture-activity":
      return fixtureActivity(String(params.activity));
    case "experiment":
      return <ExperimentHarness experiment={fixtures.experimentId(String(params.experiment))} active={params.active === true} />;
    case "scene":
      return <SceneHarness scene={fixtures.scene(String(params.scene))} />;
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
    <SubjectColor.Provider value={statesOfMatter.subject.color}>
      <View class="flex-1 bg-background text-foreground">{screen()}</View>
    </SubjectColor.Provider>
  );
}

mount(Harness);
