# CodeQuest Pro — content & engine contract

Adult track. Typed JavaScript only, no blocks. Text-first: long-form readings,
challenge editor, progressive hints, XP/badge payoffs. Lives entirely under
`src/pro/` + `pro.html`. NEVER modify kid-track files.

## Chapter module shape

Each chapter is one ES module at `src/pro/chapters/chN.js`, default-exporting:

```js
export default {
  id: 'ch1',                 // 'ch1'..'ch8'
  title: 'Values & Variables',
  tagline: 'one-line hook shown on the chapter card',
  badge: { name: 'Variable Wrangler', emoji: '🧮' }, // awarded on chapter completion
  intro: `...`,              // long-form chapter opener (multiple paragraphs, markdown-lite)
  lessons: [ /* 5-6 lessons */ ],
}
```

## Lesson shape

```js
{
  id: 'ch1-l1',              // '<chapterId>-l<N>'
  title: 'Your First Variable',
  reading: `...`,            // THE TUTORIAL. Long-form — 4-10 paragraphs. See "Reading style".
  task: `...`,               // 1-3 sentences: exactly what code to write.
  starter: `// starter code shown in the editor\n`,
  tests: [
    { name: 'defines total', code: `assert(typeof total === 'number', 'total should be a number')` },
  ],
  hints: [ 'gentle nudge', 'concrete direction', 'near-solution walkthrough' ], // exactly 3
  solution: `...`,           // MUST pass all tests
  xp: 10,                    // 10 normal, 15 hard, 20 capstone
}
```

## Execution model (engine + tests both follow this)

User code and each test's `code` are concatenated into ONE script:

```
<userCode>
;
<test1.code>   // wrapped so each test reports pass/fail independently
...
```

- Tests therefore see all top-level bindings from user code (const/let/function).
- An `assert(condition, message)` function is provided in scope; throwing = fail.
- `console.log` is captured and shown in an output panel.
- Runs in a dedicated Worker, terminated after 2000 ms ("possible infinite loop").
- Modern JS is fine (const, let, arrow functions, template literals, classes).

Content authors: tests must ONLY rely on top-level bindings + assert + plain JS.
No DOM, no fetch, no timers, no Math.random-dependent assertions.

## Reading style (the user is a big reader)

- Written for an adult beginner aiming at computer engineering. No baby talk.
- Multiple substantial paragraphs. Explain the WHY and the mental model, not
  just syntax. Include engineer-mindset asides ("in real codebases…",
  "an interviewer will ask…", "this is how memory actually works…").
- Markdown-lite supported by the renderer: blank-line paragraphs, `**bold**`,
  `inline code` with backticks, fenced ``` code blocks, `## subheadings`,
  `- ` bullet lists. Nothing else.

## Hints

Exactly 3 per lesson, escalating: (1) restate the concept to apply,
(2) name the exact construct/approach, (3) walk through all-but-typing-it.
Engine reveals one at a time; each reveal costs 2 XP off the lesson award.

## Payoffs (engine)

- XP total + progress bar, rank titles at thresholds:
  0 Newcomer · 50 Script Dabbler · 150 Loop Artisan · 300 Function Smith ·
  500 Data Bender · 750 Abstraction Architect · 1000 Engineer-in-Training
- Chapter badge card awarded when all its lessons pass.
- Streak: consecutive days with ≥1 lesson completed.
- localStorage key `codequest-pro-v1` (separate from kid key `codequest-v1`).

## Curriculum map

| Ch | Title | Concept |
|----|-------|---------|
| 1 | Values & Variables | types, const/let, expressions |
| 2 | Making Decisions | comparisons, booleans, if/else, logical ops |
| 3 | Loops & Repetition | while, for, iteration patterns, off-by-one |
| 4 | Functions | declarations, params/returns, arrows, scope |
| 5 | Arrays & Objects | collections, indexing, mutation, nesting |
| 6 | Working With Text & Data | string methods, parsing, formatting real data |
| 7 | Thinking in Higher Order | callbacks, map/filter/reduce, composition |
| 8 | The Engineer's Toolkit | binary/numbers, Big-O intuition, debugging, reading code |

## Career Path progress (since 2026-10-08)
- Every checkable resource in `career-path.js` (phases and `extras`) and `resources.js` has a permanent `id`; that id is its progress key. Change a link's `url` or `name` freely, never its `id`. New items get a new unique id (`p<phase>-…`, `x<group>-…`, `s<group>-…`). The same course listed on two pages shares one id (`ai-fluency`, `linkedin-genai-career-essentials`).
- Expedited items use their `key`; the two Professor Messer courses use the Full roadmap ids so one checkmark shows on both roadmaps.
- Deliverables are `out:<key>`, gate conditions `gate:<key>`, a passed quiz `quiz:<id>` (2 of 3 right).
- Before 2026-10-08 progress was keyed by URL. `legacy-keys.js` (frozen) maps those old keys to ids and `progress.js` `ensureMigrated()` applies it once on both pages. Never edit that table.
- `progress.js` normalises everything it reads, reports failed saves instead of throwing, and exports/imports a JSON backup (Progress page, "Back up your progress").
- `test/pro-career.test.js` checks the data (ids, URLs, hours, quiz answers, milestones) and the storage rules; `.foreman/scratch/browser/pro-career.cjs` checks the pages in a real browser.

## Career Journey (since 2026-10-08)
- `#/career-journey` is the visual map: rank by study hours, % of the core route, streak, the eight phases as a road with "you are here", milestone flags with dates at his pace, the Expedited stages, achievements and a 12-week grid. Ticking anything on the career pages that unlocks an achievement shows a toast and confetti (no confetti with reduced motion).
- Saved alongside `studyDone`: `doneAt` (`{ key: 'YYYY-MM-DD' }`, the day each checkmark was made; ticks from before this have none and count without a date) and `settings.hoursPerWeek` (1–100, default 21 = 3 h a day). Both travel in backups; a merge keeps the earliest date.
- `badges` stores earned achievement ids as `{ badgeId: 'YYYY-MM-DD' }` in `codequest-pro-v1`. First recording uses the badge's computed tick date when available, otherwise today's date. Once earned, a badge stays earned even if its current rule changes or a checkmark is removed. Current `have`/`need` still show live progress. Unknown badge ids survive normalization and backups; import merge unions ids and keeps the earliest date. `careerState()` records newly met rules and only celebrates new earnings from an action.
- Every `applyLabBadgeMigration()` and import checks the 39 lab case ids present at b528832 against their catalog pass marks (80, Detection Coder 100), adding missing old-list lab completion badges and First Lab while preserving existing dates; it writes on apply only when a badge was added, regardless of `migrations['lab-badges-v1']`. Its frozen lists are in `progress.js`; later case additions do not change the check.
- All the math is pure in `career-logic.js` (`journey`, `achievements`, `careerRank`, `currentStreak`, `heatmap`) and tested in `test/pro-journey.test.js`; `.foreman/scratch/browser/pro-journey.cjs` checks the page in a real browser. Badge ids are permanent like item ids.
- `#/career-path/<n>` opens the roadmap at Phase n.

## Exam practice (since 2026-10-08; four exams since 2026-10-09)
- `#/exam` is the exams hub: one card per exam in `src/pro/exam/registry.js` order: Security+ SY0-801, Network+ N10-009, A+ Core 1 220-1201, A+ Core 2 220-1202 (name + code, launch/retirement line, readiness, due in review, seen/total). `#/exam/<examId>` is that exam's hub, then `#/exam/<examId>/domain/<n>`, `#/exam/<examId>/session`, `#/exam/<examId>/result/<attemptId>` (`exam/routes.js`). Old Security+ links (`#/exam/domain/<n>`, `#/exam/session`, `#/exam/result/<id>`) are replaced (`location.replace`) by their `secplus-801` address.
- Every exam gets the same practice: full mocks (90 questions, 90 minutes, fresh draw by the official domain weights, unseen and missed questions first, choices shuffled), domain checks (15, answers at the end), practice and Quiz me (instant feedback with "Why not this one"), a review queue (missed now, right after 1/3/7/14/30 days), Study first (objectives ranked by misses x weight), readiness (average of the last three mocks; ready = three in a row at 85%+, this app's own bar).
- `src/pro/exam/blueprints.js` holds each exam's published format and domains (Security+ checked 2026-10-08 against CompTIA V8 objectives v2.0; Network+, A+ Core 1 and Core 2 checked 2026-10-09, see `.foreman/scratch/certs/SOURCES.md`; their retirement years are CompTIA's usual three years after launch, an estimate). `<examId>.js` pairs a blueprint with its bank `<examId>-bank.js`: `{ sources, questions: [{ id: '<prefix>-<obj>-<nnn>', obj, diff 1-3, q, choices[4], answer, why, whyNot: { '<wrong bank index>': reason }, src: [source keys], checkOnly? }] }`, prefixes `sp8`, `np9`, `ap1`, `ap2`. Ids are permanent like roadmap ids. Held-out (`checkOnly`) questions only appear in mocks and checks until he has answered them once. The banks contain 245 Network+, 228 A+ Core 1, and 245 A+ Core 2 questions; the release gate refuses `seed-` ids.
- Each bank is its own chunk, loaded only on its exam's pages (`exam/loaders.js`). The Journey card, the exams hub and the achievements read `exam/index-data.js` instead (per exam: question ids in bank order + held-out positions), GENERATED by `node src/pro/exam/tools/build-index.mjs` (same script writes the labs index below; `--check` exits 1 when stale). Rerun it after any bank or lab content change; `test/pro-exams.test.js` fails while an index differs from its source.
- Saved in `codequest-pro-v1` under `exams['<examId>']`, one record per exam: `hist` (last 12 answers per question: time, bank choice index or -1, right, mode), `attempts` (last 20 finished mocks/checks), `session` (the one open session). Normalised on load, merged on import, in every backup; exam ids this version does not know are kept as they are.
- Only mock attempts with `total` equal to the exam blueprint's `questions` and `removed` equal to 0 count toward readiness, its average, `runAtTarget`, and Ready badges; shorter attempts remain in history and results.
- Rules are pure in `exam/exam-logic.js`, summaries in `exam/summary.js`. Tested in `test/pro-exam.test.js` (Security+ rules and its bank gate) and `test/pro-exams.test.js` (all four blueprints and banks, indexes, routes, per-exam state, backups, badges). Achievements: the five Security+ exam badges are unchanged; Network+ Ready, A+ Core 1 Ready and A+ Core 2 Ready follow the Exam Ready rule on their own exam (`ctx.exams[examId].runAtTarget`).

## Code split (since 2026-10-09)
- The `pro.html` entry holds the router, the Beginner tier, the career pages and the small synchronous data (blueprints, generated indexes). The Intermediate and Expert lesson tiers, the exam pages, each exam bank and the labs (pages, engines, content, `labs.css`) load with dynamic `import()` on their routes (`ui/lazy.js`). No change to `vite.config.js` or shared code.
- Every navigation takes a token; a chunk renders only while its token is the latest, so a slow chunk never paints over a newer page. While loading, the page shows its header and a short loading line; a failed load shows an error line with Retry (and Reload). Browsers remember a failed import, so Retry re-imports the failed chunk under a fresh `?retry=` query (`retryImport`) and re-attaches stylesheets that failed.
- The router calls `leaveExam()` / `leaveLabs()` only on modules that have loaded, so clocks and key listeners stop on leave without eager imports. `.foreman/scratch/browser/pro-split.cjs` checks all of this against the production build served under `/codequest/`.

## Hands-on labs (since 2026-10-09)
- `#/labs` practices the exam's performance-based questions: hub (`#/labs`), one lab's cases (`#/labs/<labId>`), one runner (`#/labs/<labId>/<caseId>`). Six labs, in `src/pro/labs/catalog.js` (`LABS`, `caseOf`, `LAB_SOURCES`): `fw` Firewall & Network Diagram, `logs` Log Detective, `subnet` Subnet Sprint (its four generated-drill LEVELS are its cases), `cli` Terminal Troubleshooter, `phish` Phish Inspector, `code` Detection Coder.
- Content lives in `src/pro/labs/content/*.js` (shapes in `.foreman/scratch/labs/SPEC.md`); every case is tagged with SY0-801 objective ids (`objs`) and optionally `examObjs: { '<examId>': ['5.3', ...] }` for the other exams. The catalog normalises them and keeps each lab's per-exam union (`lab.examObjs`); `objsFor(lab, examId)` and `labsForObjectives(objIds, examId)` read `objs` for Security+ and `examObjs` for the others. The entry and the exam pages use `ui/labs/catalog-index.js` (generated by the exam index script: ids, pass marks, case ids, per-exam objectives) so they never load the labs content. Engines are pure: `labs/lab-logic.js` (runs, summary), `firewall.js`, `subnet.js`, `grading.js`. UI is `src/pro/ui/labs/` (one module per runner, `labs.css`).
- Saved in `codequest-pro-v1` under `labs`: `{ '<labId>/<caseId>': [{ t: ms epoch, score: 0-100, secs: 0-86400 }] }`, one run per graded attempt, the last 10 kept per item. A case is passed when its best score reaches the lab's pass mark (80; Detection Coder 100). Normalised on load (`normalizeLabs`), merged on import (`mergeLabs`: union, identical runs once), in every backup. Read and written through `getLabs()` / `saveLabs(labs)` -> `{ ok }`.
- Achievements (group Labs, after the exam badges): First Lab, Firewall Fixer, Log Detective, Subnet Sprinter, Terminal Medic, Phish Spotter, Detection Coder, Ten Perfect, Hands-On Hero. They read `ctx.labs` (the labs summary); without it they show no progress. Tested in `test/pro-labs.test.js`.
