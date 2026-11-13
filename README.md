# Readrise (Native Shell)

Readrise's science course, rebuilt as a TSX app on [Native Shell](https://nsh.dev).
All app code is TSX, so lesson and UI changes ship as signed OTA packages without a new app build.
Live web build: https://casonadams.github.io/readrise-rs/ (deployed by `.github/workflows/pages.yml` on pushes to `main`).

| Path | Role |
| --- | --- |
| `src/core/` | Learning engine, no `nsh` imports: course model, scoring (XP, stars), progress and streaks, unlocks, the lesson arc rules (`rules.ts`), and the activity sessions (`sessions/`) |
| `src/science/` | The States of Matter course: lessons as data (`lessons/`), water and heat rules (`matter.ts`, `heat-lab.ts`) |
| `src/science/ui/` | The course's experiments, explainer scenes, particle view and heat lab |
| `src/ui/` | Screens: the learning path, the lesson runner and result, the activity screens (`activities/`) and shared pieces (`kit/`) |
| `App.tsx` | Navigation between the path and lessons; saves progress after each lesson |

Lessons are data: experiments and scenes are referenced by id (`ExperimentId`, `SceneSpec` in `src/science/types.ts`).
`courseIssues` checks the lesson design rules (warm-up, one prediction before the first explainer, "Who's right?" last,
feedback for every wrong choice); `src/science/science.test.ts` requires the course to have none.

## Develop

The `nsh` and `bun` versions are pinned in `mise.toml`.

    mise install
    nsh check                         # type check
    bun scripts/test.ts               # every test file in parallel, plus the layout lint (~10 s)
    nsh test tests/screens/quiz.test.tsx   # one file
    nsh run --target web              # or macos, ios, android

## Tests

| Path | What it covers |
| --- | --- |
| `src/**/*.test.ts` | Pure logic next to its code: the learning engine, lesson rules, particle simulation |
| `tests/screens/` | One file per screen. Behaviour with fixtures, then every real lesson activity at 375x667 and 390x844, asserting with `app.shows(...)` that everything a learner needs is on screen in every state |
| `tests/e2e/` | Every lesson played start to finish at both sizes |
| `tests/support/` | Viewports, fixtures, and `harness.tsx`, the one test entry that mounts any screen by `host.params.screen` |

`app.shows(selector)` is true only for a view with an area, inside the window and every view that clips it, or in
scroll content the user can reach, so a cropped, collapsed or off-screen element fails its test.
`scripts/test.ts` runs each test file in its own `nsh test --trace`, in parallel, and reads the layout the trace prints
to report what assertions cannot see: text larger than its box, views clipped by or spilling out of their parent,
views off screen, collapsed canvases. Screen tests use a manual clock (`clock: {}`), so waits and animations take no
real time.
