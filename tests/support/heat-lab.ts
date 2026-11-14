import type { App } from "nsh/test";

export const goalButton = "label:/^(Goal reached! Next goal|Finish)$/";

const targetCelsius: Record<string, number> = { solid: -15, liquid: 40, gas: 110 };

function celsiusShown(app: App): number {
  const reading = app.texts().find((t) => /^-?\d+\u00B0C/.test(t));
  if (reading === undefined) throw new Error("no temperature on screen");
  return parseInt(reading, 10);
}

/**
 * Drags the heat lab's slider until the goal for `target` is reached. Drags move the value relative to where it is,
 * so each stays within `reach` of the middle; the slider settles a moment after the finger lifts.
 */
export async function reachState(app: App, target: string, reach: number): Promise<void> {
  for (let i = 0; i < 20 && app.count(goalButton) === 0; i++) {
    const gap = targetCelsius[target] - celsiusShown(app);
    await app.drag("label:Water temperature", { x: Math.max(-reach, Math.min(reach, gap * 2)) });
    await app.wait(250);
  }
}
