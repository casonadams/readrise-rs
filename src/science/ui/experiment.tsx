import { cleanup, signal, View } from "nsh";
import type { JSX } from "nsh/jsx-runtime";
import type { ExperimentProps } from "../../ui/activities/types";
import { PrimaryButton } from "../../ui/kit/button";
import { ink, palette } from "./palette";
import { ExperimentSlider } from "./parts";

/** What a control or a view is given: the control's value, and how to change it (unset until active). */
export interface ControlProps<T> {
  readonly value: T;
  readonly onChange?: (value: T) => void;
}

/** The one control of an experiment, and the value it starts at. */
export interface Control<T> {
  readonly initial: T;
  readonly Show: (props: ControlProps<T>) => JSX.Element;
}

/** A slider from 0 to 1 between two glyphs. */
export function sliderControl(options: { label: string; low: string; high: string; color?: string }): Control<number> {
  return {
    initial: 0,
    Show: (props) => <ExperimentSlider value={props.value} onChange={props.onChange} {...options} />,
  };
}

/** A button pressed up to `presses` times, with a dot per press; it steps aside after the last one. */
export function tapControl(options: { label: string; presses: number }): Control<number> {
  return {
    initial: 0,
    Show: (props) => (
      <If when={props.value < options.presses}>
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 6 }}>
            {Array.from({ length: options.presses }, (_, i) => (
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: i < props.value ? palette.hot : ink.faint(),
                  transitionProperty: "backgroundColor",
                  transitionDuration: 200,
                }}
              />
            ))}
          </View>
          <PrimaryButton
            label={options.label}
            onPress={() => props.onChange?.(props.value + 1)}
            disabled={props.onChange === undefined}
          />
        </View>
      </If>
    ),
  };
}

export interface ControlledExperimentSpec<T> {
  readonly control: Control<T>;
  /** True once `value` shows the experiment's result. */
  readonly observed: (value: T) => boolean;
  /** What the learner watches: a function of the control's value. */
  readonly View: (props: { readonly value: T }) => JSX.Element;
  /** Milliseconds the result takes to show once observed; reporting waits for it. */
  readonly settle?: number;
}

function ControlledExperiment<T>(props: ExperimentProps & { readonly spec: ControlledExperimentSpec<T> }) {
  const spec = props.spec;
  const value = signal(spec.control.initial);
  let reported = false;
  let settling = 0;
  cleanup(() => clearTimeout(settling));
  const change = (next: T) => {
    value.set(next);
    if (reported || !spec.observed(next)) return;
    reported = true;
    settling = setTimeout(() => props.onObserved(), spec.settle ?? 0);
  };
  const Watch = spec.View;
  const Control = spec.control.Show;
  return (
    <View style={{ flex: 1, gap: 10 }}>
      <View style={{ flex: 1 }}>
        <Watch value={value()} />
      </View>
      <Control value={value()} onChange={props.active ? change : undefined} />
    </View>
  );
}

/**
 * An experiment made of one control and a view of its value: the control does nothing until `active`, and once
 * `observed(value)` holds and its result has had `settle` ms to show, it reports `onObserved`, once.
 */
export function controlledExperiment<T>(spec: ControlledExperimentSpec<T>): (props: ExperimentProps) => JSX.Element {
  return (props) => <ControlledExperiment spec={spec} active={props.active} onObserved={props.onObserved} />;
}
