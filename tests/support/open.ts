import { type App, open } from "nsh/test";
import type { Viewport } from "./viewports";

/** A real course activity inside the lesson runner, on a phone of `viewport`'s size, with a manual clock. */
export function openLessonActivity(viewport: Viewport, lesson: number, activity: number): Promise<App> {
  return open("../support/harness.tsx", {
    clock: {},
    width: viewport.width,
    height: viewport.height,
    reducedMotion: true,
    host: { params: { screen: "lesson-activity", lesson, activity } },
  });
}
