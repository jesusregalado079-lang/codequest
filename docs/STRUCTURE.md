# CodeQuest — Repo Structure

One repository, one static site, **three separate apps** that share only a
build, a test gate, and a GitHub Pages deploy.

Repo: `jesusregalado079-lang/codequest` (public) · Local: `~/codequest`
Live: https://jesusregalado079-lang.github.io/codequest/

| App | Who it's for | URL | Entry |
|---|---|---|---|
| **CodeQuest** | kids 5–10 | `/` | `index.html` |
| **Computer Quest** | kids 5–10, real-computer skills | `/computer.html` | `computer.html` |
| **CodeQuest Pro** | adults (Jesse) | `/pro.html` | `pro.html` |

They do **not** share code, storage, or runtime. Shipping one cannot break the
other. See the table at the bottom for exactly how CodeQuest and Pro differ.
Computer Quest is a kids-app sibling of CodeQuest: same audience, same ES2020
syntax ceiling, same `src/ui/` menu/PIN/picture-code plumbing, but its own
`cq` field inside each profile (normalized by `normalizeCq`) and its own
`src/cq/` tree below.

---

## Top-level layout

```
index.html   play.html  game.html  code.html      ← kids' pages
world.html   quiz.html  build.html
computer.html                                      ← Computer Quest (kids' real-computer app)
pro.html                                           ← Pro (adult) page

src/
  engine/        kids: pure grid-world logic (node-testable)
  blocks/        kids: Blockly block definitions
  levels/        kids: all level content as JSON
  ui/            kids: menu, hero art, coach, sounds — also hosts Computer Quest's
                 grown-ups corner blurb (menu.js) and shared PIN/picture-code screens
  progress.js    kids: localStorage 'codequest-v1'; parent PIN, picture codes, Computer
                 Quest track, and each profile's `cq` field (normalized by normalizeCq)
  custom-levels.js

  cq/                                               ← everything Computer Quest lives here
    items.js           gear/cosmetics catalog, rarity, loot tables
    character.js        normalizeCq, equip/owned state, gems, legendary choice
    sprite.js            hero sprite drawing (canvas; characterCanvas creates a <canvas>)
    ui.js                Computer Quest hub/router (mounts lesson/typing/battle views)
    lesson-state.js       normalizeLessons — strict shape + strict-date validation for saved lesson state
    lesson-logic.js        pure lesson progression rules (startLesson, recordQuizAttempt, recordBattle, …)
    lesson-view.js           pure text/shuffle/label helpers for the lesson screens
    lesson-ui.js              mountLesson — the real lesson screen flow, incl. the battle finish/results wiring
    iso.js                     shared strict ISO-8601 date/timestamp validators (isValidIso, isValidDay)
    lessons/pack1.js            the 10-lesson content pack (5 guided track for the 9yo + 5 standard track for the 10yo)
    battle/
      content.js, engine.js      deterministic horde-battle engine (no Math.random, no DOM)
      render.js, view.js          battle canvas renderer + pure view/HUD helpers
      battle-ui.js                 mountBattle — the real battle screen (DOM, rAF, keyboard, sound)
    typing/
      content.js, engine.js      Typing Dojo drill content + pure typing engine
      state.js                    normalizeTyping — strict shape + strict-date validation
      record.js                    recordTypingSession — best/streak/gem rules
      render.js, view.js          typing canvas renderer + pure view helpers
      typing-ui.js                 mountTyping — the real Typing Dojo screen

  pro/                                             ← everything Pro lives here
    SCHEMA.md          the authoring contract for chapters
    chapters/          ch1..ch8 + index.js  (all Pro content)
    engine/            runner.js + runner-worker.js (runs typed code)
    ui/                pro.js (SPA), pro.css, aether.js (particle backdrop)
    progress.js        localStorage 'codequest-pro-v1'

public/media/    icons, hero art, pro-bg.jpg (Pro home emblem)
docs/computer-quest/   Computer Quest's contracts (read before touching src/cq/):
  lessons-engine.md      lesson state machine + normalization rules
  lessons-pack1.md        the authored content for all 10 lessons
  battle.md                horde battle design + balance targets + save-on-end contract
  typing.md                 Typing Dojo drill design + best/streak/gem rules
  character-and-loot.md      gear, rarity, loot tables, legendary choice
  parent-setup-checklist.md   what a parent actually does, screen by screen
test/
  engine.test.js       proves every kid level is solvable
  pro.test.js          proves every Pro lesson solution passes its own tests
  computer.test.js     proves Computer Quest storage, picture-code, PIN, track, import, and session logic
  cq.test.js               Computer Quest catalog, pure character logic, storage normalization, loot rules
  cq-sprite.test.js         hero sprite: every frame/icon combination renders finite, legal pixels
  cq-lessons.test.js        the lesson content pack itself is well-formed
  cq-lesson-logic.test.js    pure lesson progression rules, incl. strict-date rejection (Feb 30, hour 24, …)
  cq-lesson-ui.test.js       lesson screen text/shuffle/label helpers, full-pack UI call order
  cq-battle.test.js         battle content + deterministic engine + balance (bot win-rate) checks
  cq-battle-ui.test.js       battle view helpers, key mapping, renderer smoke run
  cq-battle-record.test.js    drives the real lesson-ui finishBattle/onDone path on a stub DOM: the
                               battle record is committed to storage before the results timer fires
  cq-typing.test.js          typing engine, storage normalization, incl. strict-date rejection
  cq-typing-ui.test.js        Typing Dojo view helpers, renderer smoke run
  syntax-compat.test.js      scans the kids app (src/cq/ included, src/pro/ excluded) for ES2021+
                              syntax/builtins that break older iPad Safari (??=, .at(, top-level await, …)
docs/STRUCTURE.md  ← this file
README.md          full technical notes for all three apps
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
npm test        # runs every suite (CodeQuest, Computer Quest, Pro) — a red test blocks deploy
npm run build
```

Push to `main` → GitHub Actions runs the tests, builds, deploys to Pages.

_Last updated_ 2026-09-16.
