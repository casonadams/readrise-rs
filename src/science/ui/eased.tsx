import { effect } from "nsh";
import type { JSX } from "nsh/jsx-runtime";
import { createTween, easeInOut } from "./tween";

/** An explainer scene that shows `View` at `frames[step]`, easing from one step's value to the next. */
export function Eased(props: { frames: readonly number[]; step: () => number; View: (p: { value: number }) => JSX.Element }) {
  const value = createTween(props.frames[0]);
  effect(() => value.animateTo(props.frames[props.step()], 2500, easeInOut));
  const Shown = props.View;
  return <Shown value={value.value()} />;
}
