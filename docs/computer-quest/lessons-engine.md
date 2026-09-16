# Computer Quest — Lesson Engine (Phase 3 contract)

Status: lead design · 2026-09-16.
Content comes from `lessons-pack1.md`, which is approved and binding for all wording. Rewards come from `character-and-loot.md`.
Phase 3 delivers the full loop **except the horde battle**: lesson → quiz → parent check → 🗝️ key → **chest** → loot. Phase 4 inserts the battle between key and chest.

## 1. Lesson data (`src/cq/lessons/pack1.js`)
`export const LESSONS = [ ...10 lesson objects in order g1..g5, s1..s5 ]` plus `export function getLesson(id)` and `export function trackLessons(track)`. Deep-frozen.

```
Lesson = {
  id: 'g1', track: 'guided' | 'standard', number: 1..5,
  title: 'Meet Your Computer',
  minutes: '~20',                       // display text from the doc header
  newIdea: 'the parts of the computer and the Start button',
  warmup: Question[],                   // 3; first lessons (g1, s1) are "starting check" (same shape)
  learn: Card[],
  mission: Step[],
  typingWords: string[],                // used by Phase 5; stored now
  quiz: Question[],
  passScore: number,                    // g*: 4 (of 5); s1–s4: 5 (of 6); s5: 6 (of 7)
  parentChecks: string[],
  chest: Question[],                    // g*: 2, s*: 3
  item: 'start-blade',                  // must equal LESSON_AWARDS[id].item
  practice: string,                     // Practice Mission text
  parentWatch: string | null,           // "Parent watch-for" text, if the doc has one
  after: string[] | null                // "After G5/S5 he can:" bullet list, only g5 and s5
}
Question = { q: string, choices: string[] /* 2–3 */, answer: number /* index */, why: string | null }
  // warmup and chest questions have no "why" in the doc → why: null (UI shows the right answer instead)
Card = { text: string, list?: string[], win?: { '10'?: string, '11'?: string } }
Step = { text: string, options?: Option[], grownup?: boolean, kind?: 'windowsCheck' | 'spotIt', cards?: SpotCard[], pass?: number }
Option = { win: '10' | '11' | 'both', text: string }
SpotCard = { text: string, answer: 'ok' | 'stop' }   // S5's first card: answer 'ok' with text describing picking the first non-ad result
```

**Text rules:**
- Wording is copied verbatim from `lessons-pack1.md`. The only markup allowed is `**bold**`.
- The emoji in quiz choices stay.
- `[your folder]` stays literally in the data. The UI replaces it with the boy's nickname.
- 🛑 grown-up steps get `grownup: true`, and the leading 🛑 / "With a grown-up:" label is removed from the text.
- The Windows-version step (G1 step 8, S1 step 2) is `kind: 'windowsCheck'`.
- Spot It steps (G5 step 7, S5 step 1) are `kind: 'spotIt'` with `cards` and `pass`: G5 4 of 5, S5 5 of 6.
- Win10/Win11 alternatives become `options`. Lines that say "Either one" / "Shortcut for both" / "Both" are `win: 'both'`.

## 2. Lesson state (inside profile `cq.lessons`, normalized by `normalizeLessons`)
```
cq.windows: '10' | '11' | null          // set by the windowsCheck step, auto-detect, or grown-ups corner
cq.lessons: { [lessonId]: LessonState }
LessonState = {
  phase: 'warmup' | 'learn' | 'mission' | 'quiz' | 'parent' | 'key' | 'chest' | 'done',
  index: number,                          // position within the phase (card/step/question) for resume
  startedAt: ISO | null,
  activeMs: number,                       // visible time in warmup..parent (not key/chest/battle)
  warmup: Answer[],                       // recorded once; never re-asked after the first run
  mission: boolean[],                     // ticked steps
  spotIt: { [stepIndex]: SpotAnswer[] },  // last run per Spot It step
  quizAttempts: Attempt[],
  quizPassedAt: ISO | null,
  parent: { at: ISO | null, checks: boolean[], note: string },
  passedAt: ISO | null,                   // = quiz passed AND all parent checks ticked
  chest: { openedAt: ISO | null, firstTry: boolean[], cosmetic: string | null, gems: number },
  practiceDays: string[],                 // 'YYYY-MM-DD' local days a Practice Mission was completed (gems once per day)
  battle: null                            // reserved for Phase 4
}
Answer = { q: number, choice: number, correct: boolean }
SpotAnswer = { card: number, pick: 'ok' | 'stop', correct: boolean }
Attempt = { at: ISO, answers: Answer[] }  // attempt 1 = all questions; later attempts = only still-unsolved questions
```

## 3. Rules (pure functions in `src/cq/lesson-logic.js`)
- **Unlock:** in his track, lesson 1 is always open; lesson N opens when lesson N−1 has `passedAt`. Lessons outside his track are never startable.
- **Phases advance in order:** warmup → learn → mission → quiz → parent → key → chest → done. Resume goes to the stored phase and index. Going back within a phase is allowed. Skipping ahead isn't (except warmup when the answers were already recorded).
- **Mission:** "Next" needs the current step ticked. A Spot It step counts as ticked when its last run meets `pass`; otherwise "Try again" reshuffles. A windowsCheck step counts as ticked once `cq.windows` is set.
- **Quiz:** unique questions answered correctly across attempts. Once that count reaches `passScore` → `quizPassedAt`. A retry contains only the unsolved questions, in a new shuffled order. Choices are shuffled per attempt, but stored `choice` is the ORIGINAL index. No attempt limit.
- **Parent check:**
  - It needs a correct parent PIN (UI calls `checkParentPin`) before `recordParentCheck(state, checks, note)`.
  - All checks ticked → `passedAt`, phase `key`. Otherwise it stays in phase `parent` and records the partial ticks and note ("not yet"). The kid can do the Practice Mission and call the grown-up again.
- **Key:** a screen reading "🗝️ You earned a key!" → Continue → chest. Phase 4 puts the battle here.
- **Chest (once per lesson):**
  - Questions go in order. A wrong answer → wobble, show hint (`why`, or the right answer when why is null), retry the same question. `firstTry[i]` records whether the first pick was correct.
  - When all are answered, one pure call `openChest(cq, lessonId, firstTry, rng)`:
    - `awardLesson` (item + titles)
    - + `chestGems({ firstTryCorrect, total })`
    - + `rollChest`
    - Returns `{ cq, loot: { item, titles, cosmetic, gems /* total incl. roll fallback */ } }` and sets `chest.openedAt`, phase `done`.
  - It throws if the lesson isn't passed, the chest is already opened, or the lesson isn't in his track.
- **Pack complete:** after the 5th chest, if `packComplete(cq)` and no `legendaryChoice` → the UI shows the legendary choice (3 options) → `chooseLegendary`.
- **Practice Mission:** available once a lesson is passed. "I did it" → `completePractice(cq, lessonId, today)`: first time that local day → +10 gems (`GEMS.practice`) and the day is recorded. Later the same day → no gems (the UI says "Come back tomorrow for more gems").
- **Active time:** the UI adds elapsed visible milliseconds in warmup..parent phases via `addActiveMs(state, ms)`, capped at 5 minutes per call to ignore sleep/resume gaps.

## 4. Parent report (pure text builders in `lesson-logic.js`)
`lessonReport(profile, lesson)` → the multi-line text below (only for lessons with `startedAt`). `profileReport(profile)` → a header plus every started lesson in order. `familyReport(profiles)` → every profile that has a track, separated by a blank line.

```
Computer Quest — Max — 2026-09-16
Lesson G3 "Folders Are Containers" — PASSED            (or IN PROGRESS: <phase> / NOT YET (parent check))
Warm-up review: 2/3 (missed: "Where does a minimized window go?")
Quiz: try 1 = 3/5 (missed Q4, Q5) · try 2 = 2/2 · passed
Real task (parent-checked): 3/3                         (or 2/3 — not yet: "<unticked check text>")
Chest questions first try: 1/2 (missed: "Which key fixes a typo?")
Time: lesson 24 min · battle —
Practice Missions done: 1 day(s)
Windows: 11
Parent note: <note or —>
Next up: G4 "Find It and Keep It Tidy"                  (or "Pack 1 complete!")
```
- The date is the report date, local, YYYY-MM-DD, passed in for testability.
- Missed question text is the `q` string, with `**` removed.
- `—` marks unavailable fields.

## 5. Guards
- `progress.js` gains `requireUnlockedProfile()`. It returns the active profile when it exists and `isUnlocked(id)`. Otherwise it calls `location.replace('index.html')` and returns null.
- **Every kid page** (play, code, game, quiz, world, build, computer) calls it at startup and stops if it returns null.
- This closes the direct-URL bypass.

## 6. Windows version
- **On first load of a lesson:** if `cq.windows` is null and `navigator.userAgentData?.getHighEntropyValues` exists, request `['platformVersion']`. Major ≥ 13 → '11'. Major 1–12 → '10'. Anything else → leave null.
- **Detection is a hint only.** The windowsCheck step still asks the kid (with the grown-up) to confirm by tapping **Windows 10** or **Windows 11**.
- **Display:** a step with `options` shows the options for `cq.windows` plus 'both'. If `cq.windows` is null, it shows all options labeled "Windows 10:" / "Windows 11:".
- **Grown-ups corner** can change it per profile.

## 7. Grown-ups corner additions (menu.js, behind PIN)
Per profile with a track:
- Windows version select.
- A lesson table: lesson, status (locked / in progress <phase> / not yet / passed / chest opened), quiz tries, parent checks x/y, minutes.
- Editable parent note per lesson.
- **Copy report** (profileReport).

At top: **Copy both boys' report** (familyReport).
- Copy uses `navigator.clipboard.writeText`, with a fallback to a selected read-only `<textarea>` and the message "Press Ctrl+C to copy".
