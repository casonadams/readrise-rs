import type { Signal } from "nsh";
import type { ActivityResult, Step } from "../../core/scoring";

/** Applies a session's steps to `state`: a new state is shown; the first result completes the activity, once. */
export function stepper<S>(state: Signal<S>, complete: (result: ActivityResult) => void): (step: Step<S>) => void {
  let finished = false;
  return (step) => {
    if (finished) return;
    if ("result" in step) {
      finished = true;
      complete(step.result);
    } else {
      state.set(step.state);
    }
  };
}
