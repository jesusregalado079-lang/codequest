# CodeQuest — Repo Structure

One repository, one static site, **two separate apps** that share only a build,
a test gate, and a GitHub Pages deploy.

Repo: `jesusregalado079-lang/codequest` (public) · Local: `~/codequest`
Live: https://jesusregalado079-lang.github.io/codequest/

| App | Who it's for | URL | Entry |
|---|---|---|---|
| **CodeQuest** | kids 5–10 | `/` | `index.html` |
| **CodeQuest Pro** | adults (Jesse) | `/pro.html` | `pro.html` |

They do **not** share code, storage, or runtime. Shipping one cannot break the
other. See the table at the bottom for exactly how they differ.

---

## Top-level layout

```
index.html   play.html  game.html  code.html      ← kids' pages
world.html   quiz.html  build.html
pro.html                                           ← Pro (adult) page

src/
  engine/        kids: pure grid-world logic (node-testable)
  blocks/        kids: Blockly block definitions
  levels/        kids: all level content as JSON
  ui/            kids: menu, hero art, coach, sounds
  progress.js    kids: localStorage 'codequest-v1'
  custom-levels.js

  pro/                                             ← everything Pro lives here
    SCHEMA.md          the authoring contract for chapters
    chapters/          ch1..ch8 + index.js  (all Pro content)
    engine/            runner.js + runner-worker.js (runs typed code)
    ui/                pro.js (SPA), pro.css, aether.js (particle backdrop)
    progress.js        localStorage 'codequest-pro-v1'

public/media/    icons, hero art, pro-bg.jpg (Pro home emblem)
test/
  engine.test.js   proves every kid level is solvable
  pro.test.js      proves every Pro lesson solution passes its own tests
docs/STRUCTURE.md  ← this file
README.md          full technical notes for both apps
```

## CodeQuest Pro at a glance

8 chapters × 6 lessons = 48 lessons. Each lesson is **reading first** (prose
explaining the mental model), then a typed challenge, then tests. Three
escalating hints per lesson (−2 XP each). Payoffs: XP, a rank ladder
(Newcomer → Engineer-in-Training), a badge per chapter, a daily streak.

Chapters: 1 Values & Variables · 2 Making Decisions · 3 Loops · 4 Functions ·
5 Arrays & Objects · 6 Text & Data · 7 Higher-Order Functions ·
8 The Engineer's Toolkit (binary, Big-O, debugging, reading code).

Home screen: the gold-pyramid emblem (`public/media/pro-bg.jpg`, from Jesse's
Drive) over a live canvas particle field whose colour follows the chapter.

## How the two apps differ (the part that matters)

| | CodeQuest (kids) | CodeQuest Pro |
|---|---|---|
| Interaction | drag Blockly blocks | type real JavaScript |
| Runtime | js-interpreter, **ES5 only** | real `eval` in a **Web Worker**, modern JS |
| Runaway loops | interpreter step cap | worker killed after 2 s |
| CSP | `script-src 'self'` | adds `'unsafe-eval'` + `worker-src 'self'` |
| Storage key | `codequest-v1` | `codequest-pro-v1` |
| Look | bright, blocky, canvas hero | OLED dark, serif prose, particle backdrop |

## Build & deploy

```
npm install
npm run dev     # http://localhost:5173  (Pro at /pro.html)
npm test        # runs BOTH suites — a red test blocks deploy for either app
npm run build
```

Push to `main` → GitHub Actions runs the tests, builds, deploys to Pages.

_Last updated 2026-07-17._
