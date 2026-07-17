# 🚀 CodeQuest

A game that teaches kids to actually code — from "the robot walks one square" to
typing real JavaScript by hand. Built for two kids (ages 5–7 and 8–10) sharing
one iPad.

**Live:** https://jesusregalado079-lang.github.io/codequest/

No accounts, no login, no server, no cost. Open it in Safari → Share → **Add to
Home Screen** and it behaves like a native app, offline included.

---

## The teaching contract

Every world teaches one real computer-science concept, and the blocks kids drag
**are** JavaScript — the `</>` panel shows the real code their blocks generate,
live, from the very first level. Nothing here is pretend.

| World | Concept | Land | Reward |
|---|---|---|---|
| 1 · Step by Step 🐾 | Sequencing | Sunny Meadow | Leather |
| 2 · Loops 🔁 | `for` loops | Golden Desert | Iron |
| 3 · If This, Then That 🤔 | Conditionals + sensors | Crystal Caves | Gold |
| 4 · Name Your Moves 🧩 | Functions | Frost Peaks | Diamond |
| 5 · Robot Memory 🎒 | Variables | Ember Mines | Emerald |
| 6 · Game Builder 🕹️ | Events — they build a playable arcade game | Neon Arcade | Obsidian |
| 7 · Type Real Code ⌨️ | Typed JavaScript, no blocks | The Terminal | Coder's Hoodie |
| 8 · Free Build 🏗️ | Level design — make levels, dare your sibling | The Workshop | Builder's Kit |

70 curriculum levels + unlimited kid-made ones. Each world: 📖 lesson → levels →
🎓 recap → 📝 quiz that **also re-tests earlier worlds**.

### Two modes, one app
- **🌱 Sprout (5–7)** — icon-only blocks, bigger targets, code panel hidden.
- **🌳 Explorer (8–10)** — labelled blocks, `</>` code panel, star ratings that
  reward fewer blocks (elegance is taught early).
- **⌨️ Expert mode** — earned by finishing any whole world. Every curriculum
  level then routes to the typed editor instead of blocks. Toggle on the map.

---

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # every level solvable, quizzes valid, error messages helpful
npm run build
```

Push to `main` → GitHub Actions runs the tests, builds, and deploys to Pages.
A red test blocks the deploy.

---

## Architecture

Static site. No backend, no framework, no database.

```
index.html   menu: profiles, world map, Workshop, outfits, grown-ups corner
play.html    block puzzle page   (worlds 1-5, kid-made levels)
game.html    Gem Rain arcade     (world 6)
code.html    typed code editor   (world 7 + expert mode)
world.html   lesson + recap pages
quiz.html    end-of-world quiz
build.html   level maker         (world 8)

src/engine/    pure logic, node-testable, zero DOM
  world.js         grid state: move/turn/collect, pathAhead/onGem sensors, isWin
  runner.js        runs generated JS in js-interpreter, returns an event list
  renderer.js      canvas: draws a level + replays the event list with tweens
  arcade.js        Gem Rain state + deterministic physics
  arcade-runner.js calls the kid's event handlers as things happen
src/blocks/blocks.js   every custom Blockly block + its JS generator
src/levels/*.json      all content: grids, lessons, quizzes, themes
src/ui/                pages, hero art, sounds, tutorial coach, error translation
```

**Dependencies:** Blockly (block editor) and js-interpreter (sandbox). That's it.
Vanilla JS + canvas everywhere else — the UI is a menu, a block pane and a canvas;
a framework buys nothing.

### Ideas worth keeping
- **Levels are data.** Adding content = writing JSON. Never touch the engine.
- **Engines are pure.** `runProgram(code, level)` → events. That's why `npm test`
  can prove all 70 levels are solvable without a browser.
- **Code is never `eval`'d.** Everything runs in js-interpreter with step caps,
  so an infinite loop shows a friendly message instead of freezing the iPad.
- **Progress is local.** One localStorage key, per-device, per-profile. Backup /
  Restore writes a file (grown-ups corner). Nothing leaves the device.

---

## Gotchas (read before adding anything)

- **js-interpreter is ES5 only.** `let`, `const`, arrow functions and template
  literals are *syntax errors*. All generated code, snippets and lesson text must
  use `var`. (World 2/4 lessons once promised `let` — kids would have typed it in
  World 7 and hit an error. Fixed; don't reintroduce it.)
- **Blockly's `repeat` block already uses `count`** as its loop variable, so
  custom loop generators use `i`.
- **Kid-typed names are untrusted.** Profile names come from a child *and* from
  importable backup files — always `esc()` before touching `innerHTML`.
- **Levels can't be reached by URL if locked.** `play/code/game/world/quiz` all
  guard on `worldUnlocked` + `levelUnlocked` and bounce to the map.
- **Custom levels never award curriculum stars** and unlock every block.

## Adding a world

1. `src/levels/worldN.json` — `intro`, `recap`, `quiz`, `theme`, `place`, `levels`.
2. Register it in `src/levels/index.js`.
3. New blocks? `src/blocks/blocks.js` (block def + JS generator).
4. Add an armor tier in `src/ui/hero.js` keyed to the boss level id.
5. **Add solutions to `test/engine.test.js`** — the suite proves every level is
   solvable at its par. It has caught real par mistakes; don't skip it.

Flags a world JSON can set: `arcade` (game page), `typed` (code page), `sandbox`
(level maker), `unlockAfter: "<levelId>"` (custom gate — Free Build opens after
World 4 because building is the reward for learning, not for finishing).

---

## Known gaps / open questions

- **Pre-readers can't read.** Sprout mode gives icon-only blocks, but hints,
  lessons, the tutorial and quizzes are all text. The 5-year-old needs a grown-up
  reading along. Fix if wanted: tap-to-hear via the Web Speech API (no deps).
- **Touch-drag has never been verified by actual small fingers on a real iPad.**
  This is the #1 unknown.
- No cloud sync, by design. Moving devices = Backup → Restore.
- World 6 stays block-based in expert mode: wiring event handlers is the lesson.
- Safari evicts storage for sites untouched ~7 days. Home-screen web apps are
  exempt — which is why Add to Home Screen matters.

## Credit

Designed and built with Claude Code. Character, armor and world art are original
canvas drawings — no third-party game assets or trademarks.
