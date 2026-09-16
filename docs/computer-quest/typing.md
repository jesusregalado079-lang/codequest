# Computer Quest — Typing Dojo (Phase 5 contract)

Status: lead design · 2026-09-16.
Goal from the approved plan: a custom in-app typing game where the **hero moves only on correct keys**. It's **accuracy first**. Each boy **beats his own best**, and there is **no sibling leaderboard**.
Typing norms (lessons-pack1.md): 9yo 8–12 WPM @ 90%+ over the first 3 months; 10yo 12–18 WPM @ 90%+. Short sessions (1–2 min) a few times a week.

## 1. Where it lives
- **A new hub tab, "Typing"** (after Quests), open anytime once the kid has a track.
- **No lesson gating.** Lessons stay as they are; the lessons' "Typing warm-up words" feed the word lists below.

## 2. Modes (session = one short run)
| Mode | Text | Session length | Unlocked |
|---|---|---|---|
| **Home Row** | Home-row letter groups and home-row-only words: `asdf jkl; fjfj dkdk` → `ask dad sad fall flask glad half hall shall lads` | 12 items | always |
| **Lesson Words** | the `typingWords` of every lesson in his track that is passed or in progress (at least lesson 1's words), shuffled | 12 items guided / 15 standard | always |
| **Sentences** | short sentences from the sentence bank for his track (§3) | 4 sentences guided / 6 standard | after lesson 2 of his track is passed |

- An **item** is a word or a sentence. Words are separated by a Space the kid must type.
- A sentence ends with no trailing space; the session ends on its last character.

## 3. Text content (`src/cq/typing/content.js`)
- **Home Row:** fixed ordered drills (letters, then words), deterministic.
- **Guided sentence bank** (9yo: lowercase except a capital I; no punctuation beyond a final period): 10 sentences such as `i can type.`, `a folder holds files.`, `stop and ask a grown-up.`, `the taskbar is at the bottom.`, `rocks are cool.` (write 10 in this spirit; each is ≤ 30 characters and uses lesson vocabulary).
- **Standard sentence bank** (10yo: normal capitals and punctuation): 12 sentences such as `Alt and Tab switch windows.`, `Save your work with Ctrl and S.`, `A file lives inside a folder.`, `Check the address before you click.`, `Accuracy first, speed later.` (write 12; each ≤ 40 characters).
- **All text is plain ASCII.** Every character must be typeable on a US QWERTY keyboard with no dead keys.

## 4. Session rules (`src/cq/typing/engine.js`, pure)
- `createSession({ mode, items, now })` → state `{ mode, text /* full string */, index /* next char */, keystrokes, correct, errors, errorAt: {}, startedAt /* first keypress time */, endedAt, streak, bestStreak }`.
- `pressKey(state, key, now)` → `{ state, result: 'correct' | 'wrong' | 'ignored' }`:
  - `key` is a `KeyboardEvent.key` value.
  - Single printable characters count, including Space as `' '`. Anything else (Shift alone, Enter, arrows, Backspace, Tab, Escape…) → `'ignored'`, and the state is unchanged.
  - The key matching `text[index]` exactly (case-sensitive) → `'correct'`: index+1, correct+1, streak+1.
  - Any other printable key → `'wrong'`: errors+1, `errorAt[index]` += 1, streak reset to 0. The index does NOT advance, and there's no backspace needed.
  - The first counted keypress sets `startedAt`. Reaching the end of the text sets `endedAt`.
- `metrics(state)` → `{ wpm, accuracy, ms, chars, bestStreak, missedKeys }`:
  - `wpm` = round1((correct / 5) / minutes), with minutes floored at 0.25 so tiny sessions don't spike.
  - `accuracy` = round(correct / (correct + errors) × 100).
  - `missedKeys` = the top 3 characters with the most errors.
- `sessionScore(m)` = accuracy ≥ 90 ? wpm : 0. **Only 90%+ sessions count for personal bests.**

## 5. Storage (`cq.typing`, normalized in `normalizeCq` via `src/cq/typing/state.js`)
```
cq.typing = {
  best: { [mode]: { wpm, accuracy, at /* ISO */ } | null },   // modes: 'homeRow' | 'lessonWords' | 'sentences'
  sessions: [ { at, mode, wpm, accuracy, ms, chars } ],      // most recent 20, newest last
  bestGemDays: string[]                                      // 'YYYY-MM-DD' days a best-gem was paid (keep last 30)
}
```
`recordTypingSession(cq, metricsWithMode, nowIso, todayYmd)` → `{ cq, newBest, gems }`:
- Appends the session (capped at 20).
- **New best:** `sessionScore > (best[mode]?.wpm || 0)`, or the same wpm with higher accuracy. It updates `best[mode]`.
- **Gems:** `GEMS.typingBest` (5) is paid only on a new best AND only if `todayYmd` isn't in `bestGemDays` (at most once per day across all modes). The day is then recorded.
- Pure and immutable. Normalization clamps: wpm 0..200 with 1 decimal; accuracy 0..100 int; ms 0..3600000; chars 0..10000.

## 6. The game screen (`src/cq/typing/typing-ui.js`, `render.js`)
- **Top:** mode title, a progress bar (chars typed / total), live **accuracy %** (big) and live streak 🔥. WPM is hidden during play; it's only shown on results (accuracy first).
- **Middle: the run.** A side-view path on a canvas.
  - The kid's hero (`drawCharacter`, facing right) runs along the path. Each **correct** key moves the hero forward one step with a small hop (`walk` animation).
  - Each finished item smashes a stone block into a puff.
  - A **wrong** key makes the hero stumble in place (a tiny shake, skipped with reduced motion) and flashes that letter red. There's no penalty animation beyond that.
- **Text strip under the run:** the current item and the next item.
  - Typed characters are green.
  - The next character is underlined, big and bold.
  - Spaces show as a visible `␣`.
- **On-screen keyboard:** a US QWERTY layout drawn in DOM.
  - The **next key is highlighted**.
  - Keys are tinted by **finger** (left pinky, ring, middle, index; right index, middle, ring, pinky; thumbs on Space).
  - Shift is highlighted when a capital is next.
  - The home-row F and J bumps are shown.
  - **Guided track:** the keyboard is shown by default.
  - **Standard track:** it's shown by default, with a "Hide keyboard" toggle that is remembered per profile in localStorage inside try/catch.
- **Start:** "Press any letter to start" — the timer begins on the first counted key.
- **Keyboard capture:**
  - Only while the typing screen is mounted, on `window` keydown.
  - `preventDefault` only for printable single characters and Space.
  - Ignore events with Ctrl/Alt/Meta held.
  - Ignore events whose target is an interactive element outside the game (same rule as the battle).
- **Results:**
  - Big WPM and accuracy.
  - "Personal best!" banner + "+5 💎" when it applies. If today's best-gem was already paid: "New best! (gems once a day)".
  - If accuracy < 90: "Accuracy first! Get to 90% to set a best."
  - Missed keys: "Practice these: f, j, ;".
  - Buttons: **Again** (same mode) / **Pick a mode** / **Back to hub**.
- **Mode picker:** cards showing each mode's personal best (`— ` if none), a lock on Sentences until lesson 2, and "Last 5 sessions" sparkline-style dots of accuracy.
- **No comparison with other profiles anywhere.**

## 7. Parent report
`profileReport` gains one line after the header: `Typing best: Home Row 9.5 WPM @ 94% · Lesson Words 7 WPM @ 91% · Sentences — · 12 sessions`, with `—` for a mode that has no best.
