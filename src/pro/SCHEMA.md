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
- All the math is pure in `career-logic.js` (`journey`, `achievements`, `careerRank`, `currentStreak`, `heatmap`) and tested in `test/pro-journey.test.js`; `.foreman/scratch/browser/pro-journey.cjs` checks the page in a real browser. Badge ids are permanent like item ids.
- `#/career-path/<n>` opens the roadmap at Phase n.

## Exam practice (since 2026-10-08)
- `#/exam` is certification practice, Security+ SY0-801 first: full mocks (90 questions, 90 minutes, fresh draw by the official domain weights 16/24/19/27/14, unseen and missed questions first, choices shuffled), domain checks (15, answers at the end), practice and Quiz me (instant feedback with "Why not this one"), a review queue (missed now, right after 1/3/7/14/30 days), Study first (objectives ranked by misses x weight), readiness (average of the last three mocks; ready = three in a row at 85%+, this app's own bar).
- `src/pro/exam/secplus-801.js` holds the published format and domains (checked 2026-10-08, CompTIA V8 objectives v2.0); `secplus-801-bank.js` the questions: `{ id: 'sp8-<obj>-<nnn>', obj, diff 1-3, q, choices[4], answer, why, whyNot: { '<wrong bank index>': reason }, src: [source keys], checkOnly? }`. Ids are permanent like roadmap ids. Held-out (`checkOnly`) questions only appear in mocks and checks until he has answered them once.
- Saved in `codequest-pro-v1` under `exams['secplus-801']`: `hist` (last 12 answers per question: time, bank choice index or -1, right, mode), `attempts` (last 20 finished mocks/checks), `session` (the one open session). Normalised on load, merged on import, in every backup.
- Rules are pure in `exam/exam-logic.js`, tested in `test/pro-exam.test.js` (which also gates the bank: ids, answer, why-not per wrong choice, sources, no dashes, answer-position and length balance). Questions are written per `.foreman/scratch/secplus/CONTRACT.md` and checked blind per `VERIFY.md`; `build-bank.mjs` merges them.
