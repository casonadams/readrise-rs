import { type MatterState, minCelsius, maxCelsius } from "../matter";

/** The Material colours the science visuals use (the Flutter originals' scheme, light). */
export const palette = {
  surface: "#FEF7FF",
  surfaceLowest: "#FFFFFF",
  outline: "#79747E",
  outlineVariant: "#CAC4D0",
  onSurface: "#1D1B20",
  onSurfaceVariant: "#49454F",
  onPrimary: "#FFFFFF",
  error: "#B3261E",
  green: "#2E7D32",
  greenButton: "#43A047",
  wrong: "#C62828",
  purple: "#7B1FA2",
  flame: "#EF6C00",
  cold: "#1E88E5",
  hot: "#E53935",
  oxygen: "#E53935",
  hydrogen: "#F5F5F5",
  hydrogenInk: "#424242",
  negative: "#C62828",
  positive: "#1565C0",
  grey: "#616161",
  rock: "#8D6E63",
  water: "#1E88E5",
  air: "#26A69A",
  light: "#F9A825",
  sound: "#8E24AA",
  bondGrey: "#79747E",
} as const;

const particleColors: Record<MatterState, string> = {
  solid: "#3F51B5",
  liquid: "#2196F3",
  gas: "#03A9F4",
};

/** The colour particles are drawn in for `state`. */
export function particleColor(state: MatterState): string {
  return particleColors[state];
}

export function stateName(state: MatterState): string {
  return state[0].toUpperCase() + state.slice(1);
}

/** The thermometer colour: cold blue at the lab's coldest, hot red at its hottest. */
export function temperatureColor(celsius: number): string {
  const t = (celsius - minCelsius) / (maxCelsius - minCelsius);
  return mixHex(palette.cold, palette.hot, Math.min(1, Math.max(0, t)));
}

/** Rounds half away from zero, as Dart's `round` does, so -2.5 shows as -3. */
export function dartRound(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value));
}

/** `a` mixed toward `b` by `t` (0..1); both `#RRGGBB`. */
export function mixHex(a: string, b: string, t: number): string {
  const ca = hexChannels(a);
  const cb = hexChannels(b);
  const channel = (i: number) => Math.round(ca[i] + (cb[i] - ca[i]) * t);
  return `#${[channel(0), channel(1), channel(2)].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/** `hex` (`#RRGGBB`) at `alpha` (0..1) as a CSS colour. */
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexChannels(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function hexChannels(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}
