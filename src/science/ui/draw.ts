import type { CanvasRenderingContext2D } from "nsh";

/**
 * Maps a `stageWidth` x `stageHeight` drawing, in its own points, onto a `width` x `height` canvas: scaled to
 * fit and centred, as Flutter's FittedBox does. Returns the scale.
 */
export function fitStage(
  cx: CanvasRenderingContext2D,
  width: number,
  height: number,
  stageWidth: number,
  stageHeight: number,
): number {
  const scale = Math.min(width / stageWidth, height / stageHeight);
  cx.translate((width - stageWidth * scale) / 2, (height - stageHeight * scale) / 2);
  cx.scale(scale, scale);
  return scale;
}

export function fillCircle(cx: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
  cx.beginPath();
  cx.arc(x, y, radius, 0, Math.PI * 2);
  cx.fill();
}
