import type { JSX } from "nsh/jsx-runtime";
import { createMotion, View } from "nsh";

/** Fades in while rising into place when it mounts: a new question, a new caption. */
export function FadeIn(props: { children: JSX.Element }) {
  const motion = createMotion({ enter: "fadeInUp" });
  return <View style={motion.style}>{props.children}</View>;
}
