import type { JSX } from "nsh/jsx-runtime";
import { createMotion, effect, View } from "nsh";

/** Shakes its child sideways each time `trigger` goes up. NSH's motion lands still when reduced motion is on. */
export function Shake(props: { trigger: number; class?: string; children: JSX.Element }) {
  const motion = createMotion();
  let last = props.trigger;
  effect(() => {
    const trigger = props.trigger;
    if (trigger > last) void motion.play("shake");
    last = trigger;
  });
  return (
    <View class={props.class ?? ""} style={motion.style}>
      {props.children}
    </View>
  );
}
