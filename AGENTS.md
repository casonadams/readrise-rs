# Readrise agent guide

Read `README.md` for the layout. This file holds the rules for building and changing lessons and their screens.
They come from learning-science research and from mistakes already made and fixed in Readrise; follow them unless
the user asks otherwise.

## Layers and reuse

- Layers import downwards only: `src/core` (the learning engine, no `nsh`), then `src/ui` (screens any course
  uses), then kits like `src/science` (parts any course of that subject uses), then courses in
  `src/courses/<id>/`. A course never imports another course. `App.tsx` lists the installed `CoursePack`s and is
  the only place that imports courses. `scripts/architecture.ts` enforces this; `bun scripts/test.ts` runs it.
- A course's content (`course.ts`, its lessons and what they import) loads without `nsh`: lessons are data, and
  experiments and scenes are named by id (`ExperimentId`, `SceneSpec`), drawn by the course's `ui/`.
- Before writing a component, look in `src/ui/kit`, `src/ui/activities` and the subject's kit. Reuse in this order:
  use a component as is; compose components; implement an interface the shared code offers (`RenderExperiment`,
  `RenderScene`, `RenderVisual`, `CoursePack`); extract an interface from an existing component and add your
  implementation; only then add a new component, in a kit if any course of the subject could use it. Never copy a
  component into a course.
- Vary behaviour with a new component or function, looks by composing, and use props only for data (counts,
  colours, labels). Never add a flag that switches behaviour.
- Activity logic is a pure state machine (`src/core/sessions/`, or a course's own like `heat-lab.ts`), tested
  without a screen; the view shows the state, forwards taps and applies each step with `stepper`.
- Course and lesson ids are stored in learners' saved progress. Never rename or remove one; add a new lesson
  instead.

## Colours and dark mode

- Neutral colours follow the appearance. Use Tailwind token classes (`text-foreground`, `bg-background`) or a
  colour with its `dark:` partner (`bg-white dark:bg-zinc-900`); science visuals use `ink` from
  `src/science/ui/palette.ts`, backed by the `science-*` tokens in `nsh.json`'s `"theme"`.
- `palette` holds only fixed colours that mean something: substances (oxygen red, hydrogen white, water blue),
  heat red and cold blue, negative charge red and positive charge blue, right and wrong. Never put a text, surface
  or outline colour there.
- Check every screen you change in both appearances: `tests/screens/dark-mode.test.tsx` asserts text colours with
  `app.spanStyle`.

## The lesson arc

Every lesson after the first follows this order. Each step has a reason.

| Step | Activity | Why |
| --- | --- | --- |
| 1. Warm-up | `quiz` with `role: "warmUp"`, 2 questions on earlier lessons | Retrieval, spacing and interleaving improve long-term learning ([Agarwal et al.](https://link.springer.com/article/10.1007/s10648-012-9210-2)) |
| 2. Predict | `predict` with a hands-on experiment | Predict-Observe-Explain makes learners commit to an idea, then confront it ([POE review](https://www.mdpi.com/2673-8392/6/11/242)) |
| 3. Explain | `explainer`: short steps over an animated scene | Names what they just saw; one idea per step |
| 4. Practise | `sort`, a lab, or similar | Applies the idea to many cases |
| 5. Check | `quiz` with `role: "check"` and a `reason` on key questions | Two-tier questions catch right answers given for wrong reasons ([two-tier review](https://files.eric.ed.gov/fulltext/EJ1285412.pdf)) |
| 6. Who's right? | `whoIsRight` | Classmates voice the misconception; the learner argues against it |

The first lesson of a course skips the warm-up. Exactly one prediction per lesson, before the first explainer.
`courseIssues` (`src/core/rules.ts`) checks the arc and the feedback rules below; each course's test requires it
to find none.

## Designing around misconceptions

- Start from what learners wrongly believe, not from the textbook order. Find the known misconceptions for the
  topic first (for matter, [Novick & Nussbaum 1981](https://onlinelibrary.wiley.com/doi/10.1002/sce.3730650209)
  and [RSC *Beyond Appearances*](https://edu.rsc.org/changes-of-state/students-ideas-about-changes-of-state-beyond-appearances/4017768.article)).
- Make the misconception a predict option and a wrong claim in "Who's right?". The prediction should surprise
  most learners.
- Predictions are never marked as mistakes. Ask "How sure are you?" only on predictions: confident errors are
  corrected best by feedback ([Butterfield & Metcalfe 2006](https://www.columbia.edu/cu/psychology/metcalfe/PDFs/Butterfield_Metcalfe_2006.pdf)).
- Every wrong choice gets its own feedback saying why it is wrong, not just "try again"
  ([Shute 2008](https://journals.sagepub.com/doi/abs/10.3102/0034654307313795)): quiz options and reasons
  (`feedback`), predictions (`reactions`) and claims (`feedback`).
- Hints nudge without giving the answer away. Quiz hints appear on request and on their own after two misses;
  using one makes the question worth half.

## Writing for young readers

- Grades 5-8 read these lessons; earlier grades may too. Use short sentences and everyday words. Define a
  science word the first time it appears.
- One idea per explainer step, one or two sentences each.
- Prediction outcomes: at most two short sentences. Reactions, feedback and hints: one sentence. The evidence on
  screen does the explaining.
- Use concrete, everyday situations (balloons, puddles, a cold glass) before abstract statements.
- Classmates in "Who's right?" come from `src/science/classmates.ts`; keep the cast diverse and vary who is right.
- No "all of the above"; avoid choices whose position gives the answer away.

## Scenes and experiments

- A scene is a pure function of its step (`RenderScene`) and animates between steps.
- An experiment gets `active` and `onObserved` (`ExperimentProps`): its controls do nothing until `active`, and
  it calls `onObserved` exactly once, after the result is visible. One control per experiment.
- Keep the evidence on screen after the reveal: the result may cover the choices, never the experiment.
- Physical behaviour must look right. `ParticleSim` takes the real box shape (`fit(width, height)`) and is drawn
  at one scale on both axes: never stretch a simulation to fit a box. Liquids pool and level out, gases fill the
  whole box and bounce off each other, solids rest on the floor.
- Use the standard colours in `palette`: oxygen red, hydrogen white, negative charge red, positive charge blue,
  heat red, cold blue.

## UI and UX

- Every practice activity starts with `ActivityHeader` naming its kind, so the learner knows whether they are
  guessing, learning, practising or proving it.
- Reuse `OptionTile`, `AnswerPanel` and `FeedbackBanner`; do not create look-alikes.
- Every screen holds on the phones in `tests/support/viewports.ts` (375x667 and 390x844).
- Accessibility: every tappable answer has a label that includes its state ("..., wrong", "..., correct");
  canvases have an `accessibilityLabel`.

## Tests

- `mise exec -- nsh check` type-checks. `bun scripts/test.ts` checks the layers, runs every test file in
  parallel and lints the layout each one traces (text larger than its box, clipped or off-screen views,
  collapsed canvases); a change is done only when it reports no failures and no issues.
- Pure logic is tested next to its code (`src/**/*.test.ts`); each screen has a file in `tests/screens/` that
  runs every real activity of its kind at both phone sizes; `tests/e2e/` plays every lesson start to finish.
- Assert what the learner sees with `app.shows(selector)`, which fails for anything cropped, collapsed or off
  screen. Use the manual clock (`clock: {}`) so waits and animations take no real time.
- Screenshots need a real platform: `nsh test <file> --target web`.
- For a bug, first write a test that fails, then fix it.
