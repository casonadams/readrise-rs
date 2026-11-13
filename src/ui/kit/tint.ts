/** `hex` (#RRGGBB) at `alpha` (0..1), as #RRGGBBAA. */
export function tint(hex: string, alpha: number): string {
  return `${hex}${Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0")}`;
}
