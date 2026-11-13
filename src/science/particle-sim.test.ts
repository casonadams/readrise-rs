import { describe, expect, test } from "nsh/test";
import { type Particle, ParticleSim, seededRandom } from "./particle-sim";
import type { MatterState } from "./matter";

function settled(
  state: MatterState,
  options: { energy?: number; seconds?: number; height?: number } = {},
): ParticleSim {
  const { energy = 0.5, seconds = 4, height = 1 } = options;
  const sim = new ParticleSim({ random: seededRandom(7) });
  sim.height = height;
  for (let i = 0; i < seconds * 60; i++) sim.step(1 / 60, state, energy);
  return sim;
}

function meanSpeed(sim: ParticleSim): number {
  const total = sim.particles.reduce((sum, p) => sum + Math.hypot(p.vx, p.vy), 0);
  return total / sim.particles.length;
}

function ys(particles: readonly Particle[]): number[] {
  return particles.map((p) => p.y);
}

function xs(particles: readonly Particle[]): number[] {
  return particles.map((p) => p.x);
}

describe("particle sim", () => {
  test("solid: particles stay near their lattice sites", () => {
    const sim = settled("solid");
    for (const p of sim.particles) {
      expect(Math.abs(p.x - p.homeX)).toBeLessThan(0.03);
      expect(Math.abs(p.y - (sim.height - p.homeDepth))).toBeLessThan(0.03);
    }
  });

  test("liquid: particles stay in the lower part of the box", () => {
    const sim = settled("liquid");
    for (const p of sim.particles) {
      expect(p.y).toBeGreaterThanOrEqual(0.5);
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(1);
      expect(p.y).toBeLessThanOrEqual(1);
    }
  });

  test("gas: particles spread through the whole box", () => {
    const sim = settled("gas", { energy: 0.8 });
    expect(Math.min(...ys(sim.particles))).toBeLessThan(0.3);
    expect(Math.max(...ys(sim.particles))).toBeGreaterThan(0.7);
    for (const p of sim.particles) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(1);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(1);
    }
  });

  test("more energy means faster particles", () => {
    expect(meanSpeed(settled("gas", { energy: 1, seconds: 1 }))).toBeGreaterThan(
      meanSpeed(settled("gas", { energy: 0, seconds: 1 })),
    );
    expect(meanSpeed(settled("liquid", { energy: 1, seconds: 1 }))).toBeGreaterThan(
      meanSpeed(settled("liquid", { energy: 0, seconds: 1 })),
    );
  });

  test("gas is faster than liquid at the same energy", () => {
    expect(meanSpeed(settled("gas", { seconds: 1 }))).toBeGreaterThan(meanSpeed(settled("liquid", { seconds: 1 })));
  });

  test("cooling a gas settles it into the lower box (condensing)", () => {
    const sim = settled("gas", { seconds: 2 });
    for (let i = 0; i < 6 * 60; i++) sim.step(1 / 60, "liquid", 0.5);
    for (const p of sim.particles) expect(p.y).toBeGreaterThanOrEqual(0.5);
  });

  test("a liquid does not pile particles on top of each other", () => {
    const sim = settled("liquid");
    let closest = Infinity;
    sim.particles.forEach((a, i) => {
      for (const b of sim.particles.slice(i + 1)) {
        closest = Math.min(closest, Math.hypot(a.x - b.x, a.y - b.y));
      }
    });
    expect(closest).toBeGreaterThan(ParticleSim.radius);
  });

  test("liquid: particles pool at the bottom instead of floating", () => {
    const sim = settled("liquid");
    const y = ys(sim.particles);
    expect(Math.min(...y)).toBeGreaterThan(0.68);
    expect(y.reduce((a, b) => a + b, 0) / y.length).toBeGreaterThan(0.8);
  });

  test("gas: two particles meeting head on bounce off each other", () => {
    const sim = new ParticleSim({ random: seededRandom(7), columns: 2, rows: 1 });
    const [a, b] = sim.particles;
    Object.assign(a, { x: 0.45, y: 0.5, vx: 0.5, vy: 0 });
    Object.assign(b, { x: 0.55, y: 0.5, vx: -0.5, vy: 0 });
    for (let i = 0; i < 10; i++) sim.step(1 / 60, "gas", 0.3);
    expect(a.vx).toBeLessThan(0);
    expect(b.vx).toBeGreaterThan(0);
    expect(b.x - a.x).toBeGreaterThanOrEqual(ParticleSim.radius * 2 - 1e-9);
  });

  test("liquid: a heap against one wall levels out within a second", () => {
    for (let seed = 0; seed < 6; seed++) {
      const sim = new ParticleSim({ random: seededRandom(seed) });
      sim.particles.forEach((p, i) => {
        Object.assign(p, { x: 0.96 - (i % 5) * 0.08, y: 0.96 - Math.floor(i / 5) * 0.08, vx: 0, vy: 0 });
      });
      for (let i = 0; i < 60; i++) sim.step(1 / 60, "liquid", 0.5);
      expect(Math.min(...xs(sim.particles))).toBeLessThan(0.12);
      expect(Math.min(...ys(sim.particles))).toBeGreaterThan(0.68);
    }
  });

  describe("in a box taller than it is wide", () => {
    const height = 1.7;

    test("a solid rests on the floor", () => {
      const sim = settled("solid", { height });
      expect(Math.max(...ys(sim.particles))).toBeGreaterThan(height - 0.15);
      expect(Math.min(...ys(sim.particles))).toBeGreaterThan(height - 0.65);
    });

    test("a liquid pools at the bottom", () => {
      const sim = settled("liquid", { height });
      for (const p of sim.particles) {
        expect(p.y).toBeGreaterThan(height - 0.35);
        expect(p.y).toBeLessThanOrEqual(height);
      }
    });

    test("a gas fills the whole box", () => {
      const sim = settled("gas", { energy: 0.8, height });
      expect(Math.min(...ys(sim.particles))).toBeLessThan(0.4);
      expect(Math.max(...ys(sim.particles))).toBeGreaterThan(height - 0.4);
      for (const p of sim.particles) {
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(height);
      }
    });
  });

  describe("in a box wider than the lattice needs", () => {
    function wide(state: MatterState): ParticleSim {
      const sim = new ParticleSim({ random: seededRandom(7) });
      sim.fit(400, 200);
      for (let i = 0; i < 4 * 60; i++) sim.step(1 / 60, state, 0.8);
      return sim;
    }

    test("fitting keeps the area's shape and the lattice's minimum height", () => {
      const sim = new ParticleSim();
      sim.fit(400, 200);
      expect([sim.width, sim.height]).toEqual([1.2, 0.6]);
      sim.fit(200, 400);
      expect([sim.width, sim.height]).toEqual([1, 2]);
    });

    test("a gas reaches both side walls and stays inside", () => {
      const sim = wide("gas");
      expect(Math.min(...xs(sim.particles))).toBeLessThan(0.15);
      expect(Math.max(...xs(sim.particles))).toBeGreaterThan(sim.width - 0.15);
      for (const p of sim.particles) {
        expect(p.x).toBeGreaterThanOrEqual(ParticleSim.radius - 1e-9);
        expect(p.x).toBeLessThanOrEqual(sim.width - ParticleSim.radius + 1e-9);
      }
    });

    test("a solid's lattice sits in the middle", () => {
      const sim = wide("solid");
      const mean = xs(sim.particles).reduce((a, b) => a + b, 0) / sim.particles.length;
      expect(Math.abs(mean - sim.width / 2)).toBeLessThan(0.02);
    });
  });
});
