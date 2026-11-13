import { type Accessor, cleanup, reduceMotion, signal, untracked } from "nsh";

export type Curve = (t: number) => number;

export const linear: Curve = (t) => t;
export const easeIn: Curve = (t) => t * t * t;
export const easeOut: Curve = (t) => 1 - (1 - t) ** 3;
export const easeInOut: Curve = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
export const easeInOutBack: Curve = (t) => {
  const c2 = 1.70158 * 1.525;
  return t < 0.5
    ? ((2 * t) ** 2 * ((c2 + 1) * 2 * t - c2)) / 2
    : ((2 * t - 2) ** 2 * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
};
export const easeOutBack: Curve = (t) => {
  const c1 = 1.70158;
  return 1 + (c1 + 1) * (t - 1) ** 3 + c1 * (t - 1) ** 2;
};
/** Flutter's `Curves.elasticOut` (period 0.4). */
export const elasticOut: Curve = (t) => 2 ** (-10 * t) * Math.sin(((t - 0.1) * 2 * Math.PI) / 0.4) + 1;

export interface Tween {
  readonly value: Accessor<number>;
  /** Eases from the current value to `to` over `ms`, a display frame at a time. */
  animateTo(to: number, ms: number, curve?: Curve): void;
  /** Sets the value at once, stopping any animation. */
  jump(to: number): void;
}

/**
 * A number that eases between the values it is given, one display frame at a time. It snaps when the user
 * asks for less motion, and its loop stops with the component that made it.
 */
export function createTween(initial: number): Tween {
  const value = signal(initial);
  let frame = 0;
  const stop = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  };
  cleanup(stop);
  return {
    value,
    jump(to) {
      stop();
      value.set(to);
    },
    animateTo(to, ms, curve = linear) {
      stop();
      const from = untracked(value);
      if (ms <= 0 || untracked(() => reduceMotion()) || from === to) {
        value.set(to);
        return;
      }
      let start: number | undefined;
      const tick = (now: number) => {
        start ??= now;
        const t = Math.min(1, (now - start) / ms);
        value.set(from + (to - from) * curve(t));
        frame = t < 1 ? requestAnimationFrame(tick) : 0;
      };
      frame = requestAnimationFrame(tick);
    },
  };
}
