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
