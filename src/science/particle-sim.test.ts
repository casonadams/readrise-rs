import { describe, expect, test } from "nsh/test";
import { seededRandom } from "../core/random";
import { type Particle, ParticleSim } from "./particle-sim";
import type { MatterState } from "./matter";

/** A seeded simulation run for `seconds` of `state`, in a box `height` tall or fitted to a `view` of that size. */
function settled(
  state: MatterState,
  options: { energy?: number; seconds?: number; height?: number; view?: { width: number; height: number } } = {},
): ParticleSim {
  const { energy = 0.5, seconds = 4, height = 1, view } = options;
  const sim = new ParticleSim({ random: seededRandom(7) });
  if (view === undefined) sim.height = height;
  else sim.fit(view.width, view.height);
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
    const wide = (state: MatterState) => settled(state, { energy: 0.8, view: { width: 400, height: 200 } });

    test("fitting keeps the area's shape and the lattice's minimum height", () => {
      const sim = new ParticleSim({ random: seededRandom(7) });
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

describe("a particle count", () => {

  test("fewer particles leave from the top, as water evaporates from its surface", () => {
    const sim = settled("liquid");
    const topmost = Math.min(...sim.particles.map((p) => p.y));
    const kept = sim.particles.filter((p) => p.y > topmost);
    sim.resize(sim.particles.length - 1);
    expect(sim.particles).toEqual(kept);
  });

  test("more particles arrive at the floor heading up, as vapor rises from water below", () => {
    const sim = settled("gas");
    sim.resize(10);
    sim.resize(14);
    const arrived = sim.particles.slice(10);
    expect(arrived).toHaveLength(4);
    for (const p of arrived) {
      expect(Math.abs(p.y - (sim.height - ParticleSim.radius))).toBeLessThan(1e-9);
      expect(p.vy).toBeLessThan(0);
    }
  });

  test("cannot hold more than its lattice", () => {
    expect(() => settled("gas").resize(31)).toThrow("out of range");
  });
});


describe("sugar", () => {
  const sugar = (sim: ParticleSim) => sim.particles.filter((p) => p.sugar);
  const run = (sim: ParticleSim, seconds: number) => {
    for (let i = 0; i < seconds * 60; i++) sim.step(1 / 60, "liquid", 0.5);
  };
  const withSugar = (dissolved: number, undissolved: number, seed = 7) => {
    const sim = new ParticleSim({ random: seededRandom(seed) });
    sim.setSugar(dissolved, undissolved);
    return sim;
  };

  test("keeps the asked-for dissolved and undissolved particles", () => {
    const sim = withSugar(3, 9);
    expect(sugar(sim)).toHaveLength(12);
    expect(sugar(sim).filter((p) => p.held)).toHaveLength(9);
    expect(sim.particles.filter((p) => !p.sugar)).toHaveLength(30);
  });

  test("the crystal stays on the floor while dissolved sugar spreads", () => {
    const sim = withSugar(8, 8);
    run(sim, 4);
    for (const p of sugar(sim).filter((p) => p.held)) {
      expect(p.y).toBeGreaterThan(sim.height - 0.3);
      expect(Math.abs(p.x - sim.width / 2)).toBeLessThan(0.2);
    }
    const loose = xs(sugar(sim).filter((p) => !p.held));
    expect(Math.max(...loose) - Math.min(...loose)).toBeGreaterThan(0.4);
  });

  // Prieto, Blanco & Rodriguez 1989: learners think dissolved sugar sinks, so the model must not show that.
  test("dissolved sugar mixes through the water, not just near the floor", async () => {
    let sugarHigh = 0;
    let waterHigh = 0;
    for (let seed = 0; seed < 6; seed++) {
      // nsh stops a script that blocks for 2 s, so each run gets a turn of its own.
      await new Promise((done) => setTimeout(done, 0));
      const sim = new ParticleSim({ random: seededRandom(seed) });
      sim.fit(100, 80);
      sim.setSugar(12, 0);
      run(sim, 10);
      const water = sim.particles.filter((p) => !p.sugar);
      const middle = (Math.min(...ys(water)) + sim.height) / 2;
      sugarHigh += sugar(sim).filter((p) => p.y < middle).length;
      waterHigh += water.filter((p) => p.y < middle).length;
    }
    expect(sugarHigh / (6 * 12)).toBeGreaterThan((0.75 * waterHigh) / (6 * 30));
  });

  test("dissolves from the top row of the crystal", () => {
    const sim = withSugar(0, 8);
    const topRow = Math.max(...sugar(sim).map((p) => p.homeDepth));
    sim.setSugar(1, 7);
    expect(sugar(sim).filter((p) => !p.held).map((p) => p.homeDepth)).toEqual([topRow]);
  });

  test("fewer dissolved particles re-form the crystal", () => {
    const sim = withSugar(8, 0);
    run(sim, 2);
    sim.setSugar(0, 8);
    run(sim, 2);
    for (const p of sugar(sim)) {
      expect(p.held).toBe(true);
      expect(p.y).toBeGreaterThan(sim.height - 0.3);
    }
  });

  test("changing the water leaves the sugar alone", () => {
    const sim = withSugar(2, 2);
    sim.resize(10);
    expect(sim.particles.filter((p) => !p.sugar)).toHaveLength(10);
    expect(sugar(sim)).toHaveLength(4);
  });
});
