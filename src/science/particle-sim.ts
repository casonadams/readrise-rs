import type { Random } from "../core/random";
import type { MatterState } from "./matter";

export interface Particle {
  /** Where this particle sits in a solid or a crystal: across from the left wall, and up from the floor. */
  homeX: number;
  homeDepth: number;
  readonly phase: number;
  /** A particle of sugar dissolving in the water, rather than water. */
  readonly sugar: boolean;
  /** Still held in its crystal: it vibrates at its home instead of moving with the rest. */
  held: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface ParticleSimOptions {
  /** Where the particles start and how they jostle; seed it (`seededRandom`) for a repeatable run. */
  readonly random: Random;
  readonly columns?: number;
  readonly rows?: number;
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
  private static readonly crystalColumns = 4;
  private static readonly crystalSpacing = ParticleSim.radius * 2.1;
  /**
   * How often, per second, a dissolved sugar particle and a touching water particle swap places at middle energy:
   * diffusion, which spreads the sugar evenly through the water instead of leaving it near the crystal.
   */
  private static readonly diffusion = 1.5;
  /** The shortest box the solid lattice fits in. */
  static readonly minHeight = 0.6;

  private static readonly gravity = 4.0;
  private static readonly maxLiquidSpeed = 1.2;
  private static readonly liquidPasses = 4;

  readonly particles: Particle[] = [];
  private readonly random: Random;
  private time = 0;
  private boxHeight = 1;
  private boxWidth = 1;

  private readonly columns: number;
  private readonly rows: number;

  constructor(options: ParticleSimOptions) {
    this.random = options.random;
    this.columns = options.columns ?? 6;
    this.rows = options.rows ?? 5;
    for (let i = 0; i < this.columns * this.rows; i++) {
      const homeX = 0.15 + (i % this.columns) * 0.14;
      this.particles.push(this.particle(i, homeX, this.height - this.homeDepth(i), this.random() * 2 * Math.PI));
    }
  }

  private homeDepth(index: number): number {
    return 0.1 + Math.floor(index / this.columns) * 0.1;
  }

  /** The `index`-th particle, at its lattice site in a solid, starting at `x`, `y` and heading at `angle`. */
  private particle(index: number, x: number, y: number, angle: number): Particle {
    return {
      homeX: 0.15 + (index % this.columns) * 0.14,
      homeDepth: this.homeDepth(index),
      x,
      y,
      vx: Math.cos(angle),
      vy: Math.sin(angle),
      phase: this.random() * 2 * Math.PI,
      sugar: false,
      held: false,
    };
  }

  /**
   * Keeps `count` liquid or gas particles, at most `columns` x `rows`. They leave from the top, as surface
   * particles leave a liquid, and arrive at the floor heading up, as vapor rises from water below.
   */
  resize(count: number): void {
    if (count < 0 || count > this.columns * this.rows) throw new RangeError(`count ${count} is out of range`);
    const water = () => this.particles.filter((p) => !p.sugar);
    while (water().length > count) {
      const top = water().reduce((a, b) => (a.y <= b.y ? a : b));
      this.particles.splice(this.particles.indexOf(top), 1);
    }
    while (water().length < count) {
      const r = ParticleSim.radius;
      const x = r + this.random() * (this.width - 2 * r);
      const angle = -Math.PI / 2 + this.random() - 0.5;
      this.particles.push(this.particle(water().length, x, this.height - r, angle));
    }
  }

  /**
   * Keeps `dissolved` sugar particles moving with the water and `undissolved` ones still in a crystal in the
   * middle of the floor. Particles dissolve from the top of the crystal; fewer dissolved ones re-form it.
   */
  setSugar(dissolved: number, undissolved: number): void {
    const sugar = this.particles.filter((p) => p.sugar);
    for (const extra of sugar.slice(dissolved + undissolved)) this.particles.splice(this.particles.indexOf(extra), 1);
    for (let i = sugar.length; i < dissolved + undissolved; i++) {
      this.particles.push({
        homeX: 0.5,
        homeDepth: Number.POSITIVE_INFINITY,
        x: this.width / 2,
        y: this.height - ParticleSim.radius,
        vx: 0,
        vy: 0,
        phase: this.random() * 2 * Math.PI,
        sugar: true,
        held: true,
      });
    }
    const all = this.particles
      .filter((p) => p.sugar)
      .sort((a, b) => (a.held !== b.held ? (a.held ? -1 : 1) : a.homeDepth - b.homeDepth));
    all.forEach((p, i) => {
      p.held = i < undissolved;
      if (!p.held) return;
      p.homeX = 0.5 + ((i % ParticleSim.crystalColumns) - 1.5) * ParticleSim.crystalSpacing;
      p.homeDepth = ParticleSim.radius + Math.floor(i / ParticleSim.crystalColumns) * ParticleSim.crystalSpacing;
    });
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
    const held = this.particles.filter((p) => p.held);
    switch (state) {
      case "solid":
        this.vibrate(dt, energy, this.particles);
        return;
      case "liquid":
        this.pour(dt, energy);
        this.vibrate(dt, energy, held);
        return;
      case "gas":
        this.fly(dt, energy);
        this.vibrate(dt, energy, held);
        return;
    }
  }

  private vibrate(dt: number, energy: number, vibrating: readonly Particle[]): void {
    const amplitude = 0.008 + 0.014 * energy;
    const pull = Math.min(1, 8 * dt);
    for (const p of vibrating) {
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
    const free = this.particles.filter((p) => !p.held);
    const kick = (0.4 + 0.8 * energy) * Math.sqrt(dt);
    const damping = 1 - Math.min(1, dt);
    const startX = free.map((p) => p.x);
    const startY = free.map((p) => p.y);
    for (const p of free) {
      p.vx = (p.vx + (this.random() * 2 - 1) * kick) * damping;
      p.vy = (p.vy + (this.random() * 2 - 1) * kick + ParticleSim.gravity * dt) * damping;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    for (let pass = 0; pass < ParticleSim.liquidPasses; pass++) {
      separate(this.particles);
      keepInside(this.particles, this.width, this.height);
    }
    diffuse(this.particles, this.random, ParticleSim.diffusion * (0.5 + energy) * dt);
    free.forEach((p, i) => {
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
    const free = this.particles.filter((p) => !p.held);
    if (free.length === 0) return;
    const target = 0.35 + 0.35 * energy;
    let sum = 0;
    for (const p of free) sum += p.vx * p.vx + p.vy * p.vy;
    const rms = Math.sqrt(sum / free.length);
    if (rms < 1e-6) {
      for (const p of free) {
        const angle = this.random() * 2 * Math.PI;
        p.vx = Math.cos(angle) * target;
        p.vy = Math.sin(angle) * target;
      }
    } else {
      const scale = 1 + (target / rms - 1) * Math.min(1, 4 * dt);
      for (const p of free) {
        p.vx *= scale;
        p.vy *= scale;
      }
    }
    for (const p of free) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    collide(this.particles);
    bounceOffWalls(this.particles, this.width, this.height);
  }
}

const radius = ParticleSim.radius;

/** Calls `touch` for each overlapping pair, with the unit vector from a to b and half the overlap. */
function forEachOverlap(
  ps: readonly Particle[],
  touch: (a: Particle, b: Particle, nx: number, ny: number, overlap: number) => void,
): void {
  const minDistance = radius * 2;
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

/**
 * Pushes an overlapping pair apart along the line between them; a particle held in a crystal does not move, so the
 * other moves for both.
 */
function push(a: Particle, b: Particle, nx: number, ny: number, overlap: number): void {
  const moveA = a.held ? 0 : b.held ? 2 * overlap : overlap;
  const moveB = b.held ? 0 : a.held ? 2 * overlap : overlap;
  a.x -= nx * moveA;
  a.y -= ny * moveA;
  b.x += nx * moveB;
  b.y += ny * moveB;
}

function separate(ps: readonly Particle[]): void {
  forEachOverlap(ps, push);
}

/** Separates overlapping pairs and, if they are closing in, swaps their speed along the line between them. */
function collide(ps: readonly Particle[]): void {
  forEachOverlap(ps, (a, b, nx, ny, overlap) => {
    push(a, b, nx, ny, overlap);
    if (a.held || b.held) return;
    const closing = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (closing >= 0) return;
    a.vx += closing * nx;
    a.vy += closing * ny;
    b.vx -= closing * nx;
    b.vy -= closing * ny;
  });
}

function keepInside(ps: readonly Particle[], width: number, height: number): void {
  for (const p of ps) {
    p.x = Math.min(width - radius, Math.max(radius, p.x));
    p.y = Math.min(height - radius, Math.max(radius, p.y));
  }
}

function bounceOffWalls(ps: readonly Particle[], width: number, height: number): void {
  const right = width - radius;
  const floor = height - radius;
  for (const p of ps) {
    if (p.x < radius) {
      p.x = radius;
      p.vx = Math.abs(p.vx);
    } else if (p.x > right) {
      p.x = right;
      p.vx = -Math.abs(p.vx);
    }
    if (p.y < radius) {
      p.y = radius;
      p.vy = Math.abs(p.vy);
    } else if (p.y > floor) {
      p.y = floor;
      p.vy = -Math.abs(p.vy);
    }
  }
}

/** Each dissolved sugar particle swaps places with a touching water particle, with probability `chance`. */
function diffuse(ps: readonly Particle[], random: Random, chance: number): void {
  const reach = radius * 2.3;
  for (const sugar of ps) {
    if (!sugar.sugar || sugar.held) continue;
    for (const water of ps) {
      if (water.sugar) continue;
      const dx = water.x - sugar.x;
      const dy = water.y - sugar.y;
      if (dx * dx + dy * dy > reach * reach || random() >= chance) continue;
      [sugar.x, sugar.y, water.x, water.y] = [water.x, water.y, sugar.x, sugar.y];
      break;
    }
  }
}
