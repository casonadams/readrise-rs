import type { MatterState } from "./matter";

export interface Particle {
  /** Where this particle sits in a solid: across from the left wall, and up from the floor. */
  readonly homeX: number;
  readonly homeDepth: number;
  readonly phase: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface ParticleSimOptions {
  /** A source of numbers in [0, 1); seed it for a repeatable run. Defaults to `Math.random`. */
  readonly random?: () => number;
  readonly columns?: number;
  readonly rows?: number;
}

/**
 * Dart's `Random(seed)` (the VM's multiply-with-carry generator, 64-bit state), so a seed gives the same run
 * as the Flutter original.
 */
export function seededRandom(seed: number): () => number {
  let state = seedState(BigInt(seed));
  const nextState = () => {
    state = BigInt.asUintN(64, 0xffffda61n * (state & 0xffffffffn) + (state >> 32n));
  };
  const nextInt = (max: number): number => {
    if ((max & -max) === max) {
      nextState();
      return Number(state & 0xffffffffn) & (max - 1);
    }
    let rnd32: number;
    let result: number;
    do {
      nextState();
      rnd32 = Number(state & 0xffffffffn);
      result = rnd32 % max;
    } while (rnd32 - result + max > 2 ** 32);
    return result;
  };
  for (let i = 0; i < 4; i++) nextState();
  return () => (nextInt(1 << 26) * 2 ** 27 + nextInt(1 << 27)) / 2 ** 53;
}

/** Dart's `_setupSeed`: Thomas Wang's 64-bit integer mix. */
function seedState(seed: bigint): bigint {
  let n = BigInt.asUintN(64, seed);
  n = BigInt.asUintN(64, ~n + (n << 21n));
  n ^= n >> 24n;
  n = BigInt.asUintN(64, n * 265n);
  n ^= n >> 14n;
  n = BigInt.asUintN(64, n * 21n);
  n ^= n >> 28n;
  n = BigInt.asUintN(64, n + (n << 31n));
  return n === 0n ? 0x5a17n : n;
}

/**
 * A qualitative particle model in a box `width` units wide (at least 1) and `height` units tall (y grows
 * downward); the particle radius is fixed in these units. Solid: particles vibrate around lattice sites on the
 * floor, centred across the box. Liquid: gravity pools them at the bottom, where they jostle, slide past each
 * other, and level out. Gas: they fly through the whole box and bounce off each other and the walls.
 */
export class ParticleSim {
  /** The particle radius, in box widths. */
  static readonly radius = 0.04;
  /** The shortest box the solid lattice fits in. */
  static readonly minHeight = 0.6;

  private static readonly gravity = 4.0;
  private static readonly maxLiquidSpeed = 1.2;
  private static readonly liquidPasses = 4;

  readonly particles: Particle[] = [];
  private readonly random: () => number;
  private time = 0;
  private boxHeight = 1;
  private boxWidth = 1;

  constructor(options: ParticleSimOptions = {}) {
    this.random = options.random ?? Math.random;
    const columns = options.columns ?? 6;
    const rows = options.rows ?? 5;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        const homeX = 0.15 + c * 0.14;
        const homeDepth = 0.1 + r * 0.1;
        const angle = this.random() * 2 * Math.PI;
        this.particles.push({
          homeX,
          homeDepth,
          x: homeX,
          y: this.height - homeDepth,
          vx: Math.cos(angle),
          vy: Math.sin(angle),
          phase: this.random() * 2 * Math.PI,
        });
      }
    }
  }

  /** The box's height, at least `minHeight`. */
  get height(): number {
    return this.boxHeight;
  }

  set height(value: number) {
    this.boxHeight = Math.max(ParticleSim.minHeight, value);
  }

  /** The box's width, at least 1: a box wider than tall gives the particles more room sideways. */
  get width(): number {
    return this.boxWidth;
  }

  set width(value: number) {
    this.boxWidth = Math.max(1, value);
  }

  /** Sizes the box to fit a `width` x `height` area, keeping the lattice's minimum height. */
  fit(width: number, height: number): void {
    const aspect = height / width;
    this.height = aspect;
    this.width = aspect < ParticleSim.minHeight ? ParticleSim.minHeight / aspect : 1;
  }

  /** Advances the simulation by `dt` seconds. `energy` is 0..1. */
  step(dt: number, state: MatterState, energy: number): void {
    if (dt <= 0) return;
    this.time += dt;
    switch (state) {
      case "solid":
        this.vibrate(dt, energy);
        return;
      case "liquid":
        this.pour(dt, energy);
        return;
      case "gas":
        this.fly(dt, energy);
        return;
    }
  }

  private vibrate(dt: number, energy: number): void {
    const amplitude = 0.008 + 0.014 * energy;
    const pull = Math.min(1, 8 * dt);
    for (const p of this.particles) {
      const tx = p.homeX + (this.width - 1) / 2 + amplitude * Math.sin(this.time * 18 + p.phase);
      const ty = this.height - p.homeDepth + amplitude * Math.cos(this.time * 15 + p.phase);
      p.x += (tx - p.x) * pull;
      p.y += (ty - p.y) * pull;
    }
  }

  /**
   * Gravity and thermal kicks move the particles; overlaps are then pushed apart and those pushes become
   * velocity, so a heap flows and levels out like water instead of standing like sand.
   */
  private pour(dt: number, energy: number): void {
    const kick = (0.4 + 0.8 * energy) * Math.sqrt(dt);
    const damping = 1 - Math.min(1, dt);
    const startX = this.particles.map((p) => p.x);
    const startY = this.particles.map((p) => p.y);
    for (const p of this.particles) {
      p.vx = (p.vx + (this.random() * 2 - 1) * kick) * damping;
      p.vy = (p.vy + (this.random() * 2 - 1) * kick + ParticleSim.gravity * dt) * damping;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    for (let pass = 0; pass < ParticleSim.liquidPasses; pass++) {
      this.separate();
      this.keepInside();
    }
    this.particles.forEach((p, i) => {
      p.vx = (p.x - startX[i]) / dt;
      p.vy = (p.y - startY[i]) / dt;
      const speed = Math.hypot(p.vx, p.vy);
      if (speed > ParticleSim.maxLiquidSpeed) {
        p.vx *= ParticleSim.maxLiquidSpeed / speed;
        p.vy *= ParticleSim.maxLiquidSpeed / speed;
      }
    });
  }

  /** Free flight with elastic bounces; a thermostat sets the average speed from `energy`. */
  private fly(dt: number, energy: number): void {
    const target = 0.35 + 0.35 * energy;
    let sum = 0;
    for (const p of this.particles) sum += p.vx * p.vx + p.vy * p.vy;
    const rms = Math.sqrt(sum / this.particles.length);
    if (rms < 1e-6) {
      for (const p of this.particles) {
        const angle = this.random() * 2 * Math.PI;
        p.vx = Math.cos(angle) * target;
        p.vy = Math.sin(angle) * target;
      }
    } else {
      const scale = 1 + (target / rms - 1) * Math.min(1, 4 * dt);
      for (const p of this.particles) {
        p.vx *= scale;
        p.vy *= scale;
      }
    }
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.bounceOffWalls();
    this.collide();
  }

  private keepInside(): void {
    const low = ParticleSim.radius;
    const right = this.width - ParticleSim.radius;
    const floor = this.height - ParticleSim.radius;
    for (const p of this.particles) {
      p.x = Math.min(right, Math.max(low, p.x));
      p.y = Math.min(floor, Math.max(low, p.y));
    }
  }

  private bounceOffWalls(): void {
    const low = ParticleSim.radius;
    const right = this.width - ParticleSim.radius;
    const floor = this.height - ParticleSim.radius;
    for (const p of this.particles) {
      if (p.x < low) {
        p.x = low;
        p.vx = Math.abs(p.vx);
      } else if (p.x > right) {
        p.x = right;
        p.vx = -Math.abs(p.vx);
      }
      if (p.y < low) {
        p.y = low;
        p.vy = Math.abs(p.vy);
      } else if (p.y > floor) {
        p.y = floor;
        p.vy = -Math.abs(p.vy);
      }
    }
  }

  /** Pushes every overlapping pair apart along the line between them. */
  private separate(): void {
    this.forEachOverlap((a, b, nx, ny, overlap) => {
      a.x -= nx * overlap;
      a.y -= ny * overlap;
      b.x += nx * overlap;
      b.y += ny * overlap;
    });
  }

  /** Separates overlapping pairs and, if they are closing in, swaps their speed along the line between them. */
  private collide(): void {
    this.forEachOverlap((a, b, nx, ny, overlap) => {
      a.x -= nx * overlap;
      a.y -= ny * overlap;
      b.x += nx * overlap;
      b.y += ny * overlap;
      const closing = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (closing >= 0) return;
      a.vx += closing * nx;
      a.vy += closing * ny;
      b.vx -= closing * nx;
      b.vy -= closing * ny;
    });
  }

  /** Calls `touch` for each overlapping pair, with the unit vector from a to b and half the overlap. */
  private forEachOverlap(touch: (a: Particle, b: Particle, nx: number, ny: number, overlap: number) => void): void {
    const minDistance = ParticleSim.radius * 2;
    const ps = this.particles;
    for (let i = 0; i < ps.length; i++) {
      for (let j = i + 1; j < ps.length; j++) {
        const a = ps[i];
        const b = ps[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.hypot(dx, dy);
        if (distance >= minDistance || distance === 0) continue;
        touch(a, b, dx / distance, dy / distance, (minDistance - distance) / 2);
      }
    }
  }
}
