import type { Choice, Right, Wrong } from "../../src/core/course";

/** The right choice; content rules guarantee there is exactly one. */
export function rightOf(choices: readonly Choice[]): Right {
  return choices.filter((c): c is Right => c.right)[0];
}

/** The first wrong choice. */
export function wrongOf(choices: readonly Choice[]): Wrong {
  return choices.filter((c): c is Wrong => !c.right)[0];
}
