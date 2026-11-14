import { expect, test } from "nsh/test";
import { courseIssues } from "../../core/rules";
import { mixturesAndSolutions } from "./course";
import { dissolvedAt, sugarCube } from "./ui/glass-view";

test("the course opens after States of Matter, its lessons in teaching order", () => {
  expect(mixturesAndSolutions.requires).toEqual(["states-of-matter"]);
  expect(mixturesAndSolutions.lessons.map((l) => l.id)).toEqual(["dissolving", "melting-or-dissolving", "mass", "how-much"]);
});

test("every lesson follows the arc and every wrong choice is explained", () => {
  expect(courseIssues(mixturesAndSolutions)).toEqual([]);
});

test("each lesson uses a different experiment", () => {
  const experiments = mixturesAndSolutions.lessons.flatMap((l) =>
    l.activities.flatMap((a) => (a.kind === "predict" ? [a.experiment] : [])),
  );
  expect(experiments).toEqual(["dissolving", "meltOrDissolve", "mass", "spoons"]);
});

test("stirring dissolves the whole cube, a particle at a time, and never more", () => {
  expect([0, 0.5, 1].map(dissolvedAt)).toEqual([0, 6, sugarCube]);
  expect(dissolvedAt(0.97)).toBeLessThanOrEqual(sugarCube);
});
