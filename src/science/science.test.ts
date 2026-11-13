import { describe, expect, test } from "nsh/test";
import { Catalog } from "../core/catalog";
import { courseIssues } from "../core/rules";
import { statesOfMatter } from "./course";
import { advance, goalReached, heatLabStart } from "./heat-lab";
import { changeName, energyAt, type MatterState, speedWord, waterStateAt } from "./matter";
import type { HeatLabActivity } from "./types";

test("the course is open from the start and ordered matter, states, heat, changes", () => {
  expect(statesOfMatter.requires).toEqual([]);
  expect(statesOfMatter.lessons.map((l) => l.id)).toEqual(["matter", "states", "heat", "changes"]);
  expect(new Catalog([statesOfMatter]).courses).toHaveLength(1);
});

test("every lesson follows the arc and every wrong choice is explained", () => {
  expect(courseIssues(statesOfMatter)).toEqual([]);
});

test("each lesson uses a different experiment", () => {
  const experiments = statesOfMatter.lessons.flatMap((l) =>
    l.activities.flatMap((a) => (a.kind === "predict" ? [a.experiment] : [])),
  );
  expect(experiments).toEqual(["balloon", "zoom", "heatGas", "stove"]);
});

describe("water", () => {
  const cases: [number, MatterState][] = [
    [-20, "solid"],
    [-0.5, "solid"],
    [0, "liquid"],
    [99.5, "liquid"],
    [100, "gas"],
    [120, "gas"],
  ];
  for (const [celsius, state] of cases) {
    test(`${celsius} C -> ${state}`, () => {
      expect(waterStateAt(celsius)).toBe(state);
    });
  }

  test("energy rises with temperature and stays within 0..1", () => {
    expect(energyAt(-40)).toBe(0);
    expect(energyAt(-20)).toBe(0);
    expect(energyAt(50)).toBe(0.5);
    expect(energyAt(120)).toBe(1);
    expect(energyAt(200)).toBe(1);
    expect(energyAt(20)).toBeLessThan(energyAt(21));
  });

  test("speed words follow energy", () => {
    expect([speedWord(-20), speedWord(40), speedWord(120)]).toEqual(["Slow", "Medium", "Fast"]);
  });

  test("only changes between neighbouring states are named", () => {
    expect(changeName("solid", "liquid")).toBe("Melting");
    expect(changeName("gas", "liquid")).toBe("Condensing");
    expect(changeName("solid", "gas")).toBe(null);
    expect(changeName("gas", "gas")).toBe(null);
  });
});

describe("heat lab", () => {
  const lab: HeatLabActivity = {
    kind: "heatLab",
    goals: [
      { prompt: "Melt it", target: "liquid" },
      { prompt: "Freeze it", target: "solid" },
    ],
  };

  test("starts cold and moves on only when the goal state is reached", () => {
    expect(goalReached(lab, heatLabStart)).toBe(false);
    expect(advance(lab, heatLabStart)).toEqual({ state: heatLabStart });
    expect(advance(lab, { celsius: 20, goal: 0 })).toEqual({ state: { celsius: 20, goal: 1 } });
  });

  test("the last goal finishes with full XP and no mistakes", () => {
    expect(advance(lab, { celsius: -5, goal: 1 })).toEqual({ result: { xp: 20, mistakes: 0 } });
  });
});
