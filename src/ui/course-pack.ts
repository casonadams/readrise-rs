import type { JSX } from "nsh/jsx-runtime";
import type { AnyActivity, Course } from "../core/course";
import type { ActivityResult } from "../core/scoring";

export type RenderActivity<A> = (activity: A, complete: (result: ActivityResult) => void) => JSX.Element;

/** A course and the screens for its activities: the one thing the app needs to install a course. */
export interface CoursePack {
  readonly course: Course<AnyActivity>;
  readonly renderActivity: RenderActivity<AnyActivity>;
}

export function coursePack<A extends AnyActivity>(course: Course<A>, renderActivity: RenderActivity<A>): CoursePack {
  // The runner only ever passes this course's own activities back.
  return { course, renderActivity: (activity, complete) => renderActivity(activity as A, complete) };
}
