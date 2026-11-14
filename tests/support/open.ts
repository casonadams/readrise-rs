import { type App, open } from "nsh/test";
import type { Viewport } from "./viewports";

/** Where an activity is: its course, lesson and place in the lesson. */
export interface ActivityAt {
  readonly course: string;
  readonly lesson: number;
  readonly activity: number;
}

/** A real course activity inside the lesson runner, on a phone of `viewport`'s size, with a manual clock. */
export function openLessonActivity(viewport: Viewport, at: ActivityAt): Promise<App> {
  return open("../support/harness.tsx", {
    clock: {},
    width: viewport.width,
    height: viewport.height,
    reducedMotion: true,
    host: { params: { screen: "lesson-activity", ...at } },
  });
}
