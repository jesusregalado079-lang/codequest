# Computer Quest — Key Practice & Shortcut Diagrams (Phase 7 contract)

Status: lead design · 2026-09-16, per Jesse: mission steps currently end in a blind "I did it" tick with no real teaching behind it. Two fixes, by whether the key combo can be safely watched by a webpage.

**The hard constraint (unchanged from battle.md/typing.md):** a browser page can safely watch `Enter`, `Backspace`, `Space`, `Esc`, letters, arrow keys, and `Shift+letter`. It must never try to catch `Ctrl+*`, `Alt+*`, the Windows key, `Tab`, or F-keys — those are real OS/browser shortcuts; faking or intercepting them either lies to the kid or breaks his real browser tab (e.g. a caught `Ctrl+S` would show nothing, while the real one would pop a save dialog he never sees).

So every step in the pack gets classified into exactly one of two treatments.

## 1. Practice steps (safe keys — real detection)

The step's normal "I did it ✓" tick is replaced by a live drill:
- The on-screen keyboard from the Typing Dojo (`src/cq/typing/content.js` `KEYBOARD_ROWS`, `FINGER_FOR_KEY`) is reused here, so the art and finger colors are already consistent.
- The target key(s) glow/pulse on the keyboard. `Shift+letter` glows Shift AND the letter.
- Listens for real `keydown` on `window` while this step is open. A press only counts if it matches: same `key`, and `shiftKey` matches whether the step needs Shift.
- **Reps:** a step whose whole point is learning the key (e.g. every step in G5) needs 3 correct presses in a row, with a small counter (●●○) and a happy pop/hop each time, like a mini typing-dojo moment. A step where the key is incidental to a bigger task (e.g. "press Enter" after typing a folder name) needs only 1.
- A wrong key never counts against him — a small red flash on the wrong key, no penalty, streak doesn't reset since this isn't a scored typing session.
- Once satisfied, it ticks the same `mission[i]` flag `tickMission` already writes — no lesson-state schema change.

## 2. Shortcut diagrams (OS-level keys — illustrated, not captured)

Every `Ctrl+*`, `Alt+*`, Windows-key, `Tab`, `F2` step gets a structured breakdown card added under the existing step text (the step's original approved wording is kept verbatim; this is new content added alongside it, like the S5 practice-mission addition):

```
HOLD DOWN          [key graphic, lit and staying lit]
THEN TAP            [key graphic, blinking once per beat]
LET GO OF BOTH
WHAT HAPPENS: <one plain sentence, concrete, no jargon>
```

Plus a small **scene graphic** — an original blocky-pixel mockup (canvas `fillRect`, same voxel style as the hero/battle art, no real Windows screenshots) showing the before/after result, so "what happens" has a picture, not just a sentence. A fixed library of reusable scenes covers every case in the pack (§4), so no lesson needs a one-off scene.

The diagram is **non-interactive** — it explains, it doesn't grade. The step still ends with the existing "I did it" tick (he did it for real on Windows), and 🛑-marked steps keep the grown-up note. This is the honest version of "we can't verify it, so we make sure he understood it before he tries it for real."

## 3. Data schema (additive, no lesson-state change)

Extend the `Step` shape in `src/cq/lessons/pack1.js` with an optional `keyMoment`:

```
keyMoment: {
  kind: 'practice' | 'diagram',
  hold: string[],        // key labels to hold, e.g. [] or ['Ctrl'] or ['Alt'] or ['⊞']
  tap: string,           // the key tapped while holding, e.g. 'S', 'C', 'Tab', 'E', '←'
  taps: number,          // how many times to tap (default 1; Alt+Tab practice step uses 2)
  shift: boolean,        // practice-only: Shift+letter
  reps: number,          // practice-only: correct presses needed (default 1)
  result: string,        // one plain sentence: what actually happens
  scene: string,         // diagram-only: id into the scene library (§4)
} | null
```
`getLesson`/`trackLessons` stay unchanged; `keyMoment` is just data the renderer reads.

## 4. Scene library (diagram-only, original art, reused across lessons)

| scene id | shows | used by |
|---|---|---|
| `start-open` | Start menu popping open over the taskbar | g1 Windows-key step |
| `file-explorer-open` | a File Explorer window appearing | g2, g3, s1 Windows+E steps |
| `alt-tab-preview` | the row of small app-preview tiles Alt+Tab shows | s1 Alt+Tab step |
| `snap-left` / `snap-right` | two windows side by side, one highlighted sliding to that half | s1 Windows+arrow steps |
| `desktop-toggle` | windows minimizing away to bare desktop, then popping back | s1 Windows+D step |
| `undo-arrow` | a curved "back" arrow over a renamed/moved file reverting | s3 both Ctrl+Z steps |
| `copy-twin` | a file icon duplicating into two | s4, s5 Ctrl+C steps |
| `paste-drop` | the copied icon dropping into a new folder | s4, s5 Ctrl+V steps |
| `save-dot-gone` | a document tab's unsaved-dot blinking out | s4 Ctrl+S step |
| `rename-box` | a filename turning into an editable blue-highlighted box | g4/s3 F2 steps (diagram only — F2 is not practice-captured either, per the standing "never bind Tab/F-keys" rule) |

Each scene is one small canvas function, ~40×30 grid units, drawn twice (before/after) or as a 2-frame loop. Nine scenes cover all ~15 diagram steps in Pack 1; new lessons reuse the library before adding a new scene.

## 5. Classification of every mission step with a real key in it

**Practice (interactive, safe):**
- g1.4 `Esc` (closes Start) — 1 rep, alongside the existing click
- g2.5 `Enter` (after typing notepad) — 1 rep
- g3.5 `Backspace` + `Enter` (fix + confirm folder name) — 1 rep each
- g4.2, g4.4 `Enter` — 1 rep
- g5.1 `Shift+I` — 3 reps (this step's whole point)
- g5.2 `Enter` — 1 rep
- g5.3 `Backspace` ×2 — 2 reps of Backspace alone (matches the approved lesson text "Backspace 2 times"), then confirms it happened in the real Notepad text via the existing "I did it"
- g5.4 `←` then `→` — 2 reps each direction
- s2.1 (typing a sentence — free text, no single-key drill; left as-is)
- s4.1 home-row awareness — no single key; left as-is
- s4.2 `Shift+→` (select) — 3 reps, held-Shift + repeated arrow

**Diagram (illustrated, OS-level):**
- g1.5 Windows key alone — `start-open`
- g2.0 `Win+E` — `file-explorer-open`
- g3.0 `Win+E` — `file-explorer-open`
- g4.3 F2 rename — `rename-box`
- s1.2 `Win+E` — `file-explorer-open`
- s1.3 `Alt+Tab` (tap Tab twice) — `alt-tab-preview`
- s1.4 `Win+←` / `Win+→` — `snap-left` / `snap-right`
- s1.5 `Win+D` — `desktop-toggle`
- s3.3 F2 rename — `rename-box`
- s3.4, s3.5 `Ctrl+Z` — `undo-arrow`
- s4.3 `Ctrl+C` then `Ctrl+V` — `copy-twin` then `paste-drop`
- s4.4 `Ctrl+Z` — `undo-arrow`
- s4.5 `Ctrl+S` — `save-dot-gone`
- s5.5 `Ctrl+C` then `Ctrl+V` — `copy-twin` then `paste-drop`

## 6. Lesson screen integration (`src/cq/lesson-ui.js`, `lesson-view.js`)

- A mission step with `keyMoment` renders the existing step text/options exactly as now, then the key-moment block beneath it.
- `practice` kind: the step's "Next ▶" stays disabled until the reps are satisfied (same pattern as today's `missionStepDone` gate) — no change to `tickMission`'s contract, just a new UI gate calling it once reps hit target.
- `diagram` kind: the "I did it ✓" tick stays exactly as it works today; the diagram is explanatory only and never blocks progress on its own.
- Steps with no `keyMoment` render exactly as they do today — zero behavior change for the ~25 non-key steps.
- Reuses `src/cq/typing/render.js`'s canvas patterns for the keyboard; new scene functions live in a new `src/cq/lessons/scenes.js`.

## 7. What does NOT change
- Lesson wording, quiz, warm-up, chest, parent checks, gear rewards — untouched.
- `Ctrl/Alt/Windows/Tab/F-key` steps still require the grown-up-adjacent real task; the app never claims to have verified them.
- No new save data beyond the existing `mission[]` boolean array.
