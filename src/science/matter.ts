export type MatterState = "solid" | "liquid" | "gas";

export const minCelsius = -20;
export const maxCelsius = 120;

/** Water at sea-level pressure; at exactly 0 C real ice and water coexist, the model keeps it liquid. */
export function waterStateAt(celsius: number): MatterState {
  if (celsius < 0) return "solid";
  return celsius < 100 ? "liquid" : "gas";
}

/** Particle motion on a 0..1 scale over the lab's temperature range. */
export function energyAt(celsius: number): number {
  return Math.min(1, Math.max(0, (celsius - minCelsius) / (maxCelsius - minCelsius)));
}

export function speedWord(celsius: number): "Slow" | "Medium" | "Fast" {
  const energy = energyAt(celsius);
  if (energy < 0.35) return "Slow";
  return energy < 0.7 ? "Medium" : "Fast";
}

const changes: Readonly<Record<string, string>> = {
  "solid>liquid": "Melting",
  "liquid>solid": "Freezing",
  "liquid>gas": "Boiling",
  "gas>liquid": "Condensing",
};

/** The name of a change between neighbouring states, or null. */
export function changeName(from: MatterState, to: MatterState): string | null {
  return changes[`${from}>${to}`] ?? null;
}
