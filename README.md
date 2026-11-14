# Smart Alex

Get smart with me Alex.

Science courses for grades 5-8 (States of Matter; Mixtures and Solutions) where learners predict, get surprised,
and argue a classmate out of a misconception. A TSX app on [Native Shell](https://nsh.dev).
All app code is TSX, so lesson and UI changes ship as signed OTA packages without a new app build.
Live web build: https://casonadams.github.io/smartalex/ (deployed by `.github/workflows/pages.yml` on pushes to `main`).

| Path | Role |
| --- | --- |
| `src/core/` | Learning engine, no `nsh` imports: course model, scoring (XP, stars), progress and streaks, unlocks, the lesson arc rules (`rules.ts`), and the activity sessions (`sessions/`) |
| `src/ui/` | Screens any course uses: the learning path, the lesson runner and result, the activity screens (`activities/`), shared pieces (`kit/`), and `CoursePack`, how a course plugs in |
| `src/science/` | The science kit, for any science course: `scienceLesson` (the lesson arc as named slots), particle simulation and view, water rules, drawing helpers, the water molecule, the cast of classmates, the Science subject |
| `src/courses/<id>/` | One course: its lessons as data (`lessons/`), its experiments, scenes and extra activities (`ui/`), and its `pack.ts` |
| `src/app/installed.ts` | The installed course packs, in learning order: the one list the app and the tests read |
| `App.tsx` | Navigation between the path and lessons; resumes a lesson in progress (`session.v1`) and saves progress after each lesson |

Layers import downwards only: `core`, then `ui`, then kits like `src/science`, then courses; a course never imports
another course, and a course's content (`course.ts` and what it imports) loads without `nsh`.
`scripts/architecture.ts` checks this, and `bun scripts/test.ts` runs it first, with `scripts/locks.ts`, which
checks that every shipped course, lesson and question id in `ids.lock` and `items.lock` still exists.

Lessons are data: experiments and scenes are referenced by id (`ExperimentId`, `SceneSpec` in `src/courses/states-of-matter/types.ts`).
`courseIssues` checks the lesson design rules (warm-up, one prediction before the first explainer, "Who's right?" last,
feedback for every wrong choice); `src/courses/states-of-matter/course.test.ts` requires the course to have none.

## Develop

The `nsh` and `bun` versions are pinned in `mise.toml`.

    mise install
    nsh check                         # type check
    bun scripts/test.ts               # layers, id locks, every test file in parallel, the layout lint (~1 min)
    nsh test tests/screens/quiz.test.tsx   # one file
    nsh run --target web              # or macos, ios, android

## Tests

| Path | What it covers |
| --- | --- |
| `src/**/*.test.ts` | Pure logic next to its code: the learning engine, lesson rules, particle simulation |
| `tests/screens/` | One file per screen. Behaviour with fixtures, then every real lesson activity, experiment and explainer scene of every installed course (`tests/support/installed.tsx`) at 375x667 and 390x844, asserting with `app.shows(...)` that everything a learner needs is on screen in every state |
| `tests/e2e/` | Every lesson of every course played start to finish at both sizes; resuming a lesson; warm-ups reviewing hard questions |
| `tests/support/` | Viewports, fixtures, the heat lab drag helpers, and `harness.tsx`, the one test entry that mounts any screen by `host.params.screen` (experiments and scenes through their course's pack) |

`app.shows(selector)` is true only for a view with an area, inside the window and every view that clips it, or in
scroll content the user can reach, so a cropped, collapsed or off-screen element fails its test.
`scripts/test.ts` runs each test file in its own `nsh test --trace`, in parallel, and reads the layout the trace prints
to report what assertions cannot see: text larger than its box, views clipped by or spilling out of their parent,
views off screen, collapsed canvases. Screen tests use a manual clock (`clock: {}`), so waits and animations take no
real time.
