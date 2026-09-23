# Computer Quest — Daily Work (design contract)

Status: **revised 2026-09-22 — moving off the shared PC.** §§0–8 below (v1, "approved... go ahead") shipped and is live at commit `a0557fa` as a tab in the CodeQuest hub. Jesse has now asked for a different shape entirely (§0a). v1 is kept below as a record of what shipped and because its content/schema layer (§§1–3) is fully reused, not because it's still the target design for the kid-facing side.
Grounded in a real sample: `Grade5_Week11_Packet_PRINT.pdf` (10yo, Week 11). §0a supersedes the "same shared Windows PC, one tab" framing below.

## 0a. Revision 2026-09-22 — a dedicated page per boy, on his own iPad
Each boy gets his **own dedicated iPad** (not shared, always available — confirmed 2026-09-22), iOS 27. Daily Work moves **off** the CodeQuest hub/Windows PC entirely and becomes its own page, reached directly, not through Gear/Wardrobe/Trader/Quests/Typing. The rest of Computer Quest (character, gear, lessons, battle, typing) stays exactly as shipped, on the Windows PC, completely unaffected — this is a clean split, not a merge. Because it's a dedicated device, there's no profile picker on this page and no cross-device sync to build — confirmed explicitly, reopening that question isn't needed (Jesse: "they'll have a dedicated machine... let's build it the way I'm saying").

**What changes for the kid, concretely (his own words, 2026-09-22):**
- Opening the page lands on a **calendar**, not straight into today's work.
- Tapping a day opens that day.
- A day **auto-marks done** once finished — no separate "submit" ceremony to notice.
- Each **sheet is its own full page** ("appears the same as the sheet"), not several sheets stacked in one scroll — closer to the original PDF's one-page-per-subject feel (§1), including its light, paper-like look rather than the CQ hub's dark theme, since this page no longer needs to visually match tabs it no longer sits next to.
- Kids can **both** type into the existing fields (numbers, word bank, coins — all unchanged, all reused) **and** actually **write/draw on the page itself** to show their work, finger or Apple Pencil — a real new capability, confirmed explicitly over "just typed, styled like the sheet" (2026-09-22: "i want them to be able to do both").

**Why a dedicated page instead of the hub:** the hub's per-boy Computer Quest identity (gear, gems, character) has nothing to do with worksheets, and the new calendar-first, one-sheet-per-page, draw-anywhere shape doesn't fit a tab panel. Keeping it as its own page also means it can be genuinely modern (next section) instead of constrained by the rest of the app's old-device caution.

**iOS 27 changes a real constraint, not just a preference.** This whole codebase has carried old-iPad-Safari caution since a real incident (the "World 2 glitch" — an `.at()` call broke a lesson on an old iPad; `test/syntax-compat.test.js` still guards `src/ui`, `src/engine`, `src/blocks`, `src/levels`, `src/cq` against ES2021+ syntax because of it). `src/pro/` is already exempt from that scan because it's a separately-shipped, modern-only surface. **The new Daily Work page is exempt the same way, for the same reason, now confirmed by a real device check (iOS 27) rather than assumed:** write it modern, no defensive syntax avoidance, use `Pointer Events` + `<canvas>` for the drawing layer freely — iOS 27 Safari supports all of it natively. Its own directory stays out of `syntax-compat.test.js`'s `DIRS`/`FILES` list, mirroring `src/pro/`'s exemption exactly (see §8b).

### Calendar (the new landing screen)
Each tile shows a status, using the **same priority order** as the parent tracker's `dayStatus()` (`daily-work-parent.js`) — *not started / in progress / awaiting check / needs fixes / complete* — just shown directly to the kid instead of hidden behind the parent PIN, and as of the iPad page it's its own copy (`src/daily/calendar.js`'s `dayStatus()`, duplicated not imported — see §8c step 1's note on why) rather than a literal reuse of the hub's function. Showing "needs fixes" to the kid directly is fine here — it's exactly the information he needs to act on, and it's already true information, not a grading reveal (see the neutrality rule below, which is unaffected).

**2026-09-22 revision — a full month grid, not just the current week.** Jesse: he wants the boys to be able to "go back and see what they did for the months as they go by." The calendar is now a real Sunday-first month grid (`buildMonth()`) with prev/next navigation (capped 12 months back, 1 month forward — there's never future content to look ahead to). Only the real calendar week containing **today** is ever live/clickable (computed directly from today's date via `realWeekDates()`, independent of any week's `assignedWeekOf`, which live content doesn't currently set); every other cell is either read-only (a past/future day, not part of today's live content) or blank (a weekend, where nothing is ever scheduled).

**Why history needed its own storage, not just `dailyWork`:** content genuinely rotates month to month (only one week has ever existed in `content.js` at a time), and `state.js`'s `normalizeDailyWork()` — deliberately, for the hub — drops any stored week whose id isn't in the *current* `DAILY_WORK` content. Left alone, that would silently erase a month's worth of history the moment its content got replaced. `src/daily/store.js` gained a separate `history` bucket, keyed by real ISO date (not week/day ids), storing only a coarse status snapshot (never item-level answers) — `snapshotHistory()`/`historyFor()`, capped at 400 entries (~18 months of weekdays). `app.js` snapshots the current real week into history on every calendar render (`snapshotToday()`, an upsert, not a log) — that's what makes "today's" status still show correctly once next month's content replaces this week's.

A historical day is **never clickable** — its content doesn't exist anymore to page through or answer, only its last-known status is shown. The memory-verse reference card (see "Memory verse" under Manipulatives below) moved off the calendar's body — no room for it inline on a full month grid — into its own screen (`renderVerseScreen()`), reached via a button (`data-action="open-verse"`).

**Groundwork for next month, explicitly:** `buildMonth(store, year, month, todayIso)` takes any year/month, not just the current one — nothing about the grid itself is hardcoded to September 2026. The calendar section carries `data-month`/`data-season` attributes (season derived from a plain month→season table) for CSS to theme against, and a reserved `.cqd-mascot` container for a kid-friendly avatar/robot companion — both intentionally left for the visual pass (see the P13 ticket, ledger 2026-09-22) rather than hardcoded here.

### One sheet, one page
Inside a day: each of that day's own `Sheet`s (in order — **not** the week's Memory Verse sheet, which moved to the calendar screen as an ungraded reference card, 2026-09-22, see below) is its own full page — `intro`/`example`/`citation`/items exactly as already authored (§3, unchanged), styled closer to the original PDF's card language (colored subject header bar, gold dashed worked-example box) on a light, paper-toned page rather than the CQ hub's dark navy. Simple next/back paging between a day's sheets, not one long scroll. All the existing item-kind renderers (numeric, fill-blank, scale, short/long-text, the real coin-total interactive) are reused as-is — this is a new page shell and visual skin around proven, tested logic, not a rewrite of it.

### Manipulatives — coins this week, more subjects coming (added 2026-09-22)
Jesse, after the first visual pass: "when he counts the money that its put into a jar and tallied up, the idea is that im trying to teach him how to distinguish the coins hell need to make a certain amount of money up" (guided track) and "for the older one we just want his percentages to be interactive if possible" (standard track), plus explicitly: coins are this week's content only — dollar amounts and other math concepts are coming in future weeks and will need the same hands-on treatment. Three things shipped from this:

- **Coin jar + tally marks** (`src/daily/sheet-view.js`'s `coinJar()`/`tallyMarks()`, guided track's build-the-amount coin items). A jar fills and tally marks (groups of 5) count up as coins are tapped. **Its fill level is a function of coin COUNT against a fixed visual cap, deliberately never money-in vs. the target amount** — a fill gauge tied to the target would be exactly the live correctness comparison the coin interactive was built to avoid (§ neutrality rule, unchanged). This is a real constraint on any future fill-gauge-style manipulative too: cap-based, never answer-based.
- **100-square percent-shading grid** (`src/daily/sheet-view.js`'s `percentGridItem()`, standard track's percent items — `content.js` gained a small additive `unit: 'percent'` field on the relevant items, read only by this page; the hub's own renderer never looks at it and is unaffected). One big tappable surface (not 100 individual buttons — both physically impossible at a legible size and unnecessary), tap/click anywhere to shade up to that row/col via a dedicated `daily-percent-set` action (`updateDailyWork` gained a 2-line additive branch reusing `daily-scale`'s existing "store a plain number" write). Only items with an integer answer get the grid (87.5% can't be shaded on a 100-square grid) — the one non-integer item this week stays a plain numeric input.
- **Memory verse → ungraded reference card, not a daily quiz.** Originally the verse was a `fill-blank` item repeated inside every day's paged flow (answer it fresh five times a week to unblock submit). Jesse's read: it's for a Friday recitation to him, not graded homework — "something they come back to." Now `sheetsForDay()` (`src/daily/sheet-view.js`) excludes the week's `weekItems` sheet entirely from the gated/paged/graded flow, and a separate `weekVerse()` function reconstructs the full correct verse text (blanks filled with their answers, highlighted) for a standing card on the calendar screen (`.cqd-verse-card`). Never blocks any day's submit, never appears in parent mode's check-work list, never graded. This change is isolated to `src/daily/` — the still-shipped-but-soon-to-be-removed PC hub tab's own rendering is untouched.

**Standing direction for future weeks:** coins are one instance of a general pattern — a hands-on manipulative that visualizes a quantity being built up, with genuinely reusable underlying mechanics (a fill gauge, a tally counter, a shading grid) rather than one bespoke widget per math concept. Dollar amounts are the next concrete one Jesse named. See the P12 animation/groundwork ticket (ledger, 2026-09-22) for what got generalized vs. left coin-specific.

**P12 (2026-09-22, Codex gpt-6-astra) shipped the actual groundwork, verified by the lead:** `src/daily/manipulatives.js` — `quantityVessel({count,cap,label,skin})` (the jar is now a `skin` on a generic fill gauge — a future bill-stack manipulative supplies its own skin/CSS custom properties, no new fill logic), `tallyMarks()`, `shadeCells()` (the percent grid's cell renderer, reusable for any N-cell field). `src/daily/motion.js` — `createDailyMotion(root)`, a presentation-only capture/re-render/animate bridge that never reads or writes app state. Full extension contract (how to wire in a new manipulative, what NOT to do — e.g. don't reuse the `.cqd-percent-grid` class for a non-percent field) is written out in `.foreman/scratch/result-P12-animation.md`; read that before building the next manipulative rather than re-deriving the pattern from the CSS.

### The drawing layer
A full-page `<canvas>` overlaid on each sheet — a **page-level scratch layer**, not a new item kind tied to one question, closer to real paper's margins than a form field. Kids write/draw anywhere on the sheet with a finger or Apple Pencil (`Pointer Events`: `pointerdown`/`pointermove`/`pointerup`, unified across touch/pencil/mouse — no separate touch-event handling needed on iOS 27). Shipped toolset (2026-09-22, `src/daily/drawing.js`): one pen + Clear — no eraser, no undo, deliberately not built since nothing asked for them and Clear already covers "start over." Since the canvas sits on top of the same page as the typed fields, a Type/Draw mode switch decides which one receives taps at a time (canvas `pointer-events:none` in Type mode, `auto` in Draw mode) — otherwise ink strokes would eat taps meant for inputs, or vice versa; the ink itself stays visible on the page in both modes. Saved as a compressed image (`canvas.toDataURL('image/webp')` at a capped, non-retina resolution to keep it small) alongside that sheet's item state, restored on reopen. A day's "done" status is still driven purely by the existing `ready()` logic (every typed/tapped item answered) — the drawing layer is supplementary context for the parent to look at, never something the app scores or requires a minimum amount of.
**The neutrality rule still applies in full:** nothing about the drawing layer may hint whether an answer is right — it has no relationship to any item's `answer`/`targetCents` at all, it's pure ungraded scratch space. A drawn/written item is reviewed by the parent the same way free-text already is: the parent looks, the parent decides — no new grading logic, no auto-suggestion attempted on ink.

### Storage
Its own localStorage key (e.g. `codequest-daily-v1`), separate from `codequest-v1` — not because they'd collide (different device, different browser entirely) but so the same URL opened anywhere never risks reading or writing the wrong blob. Reuses `content.js`/`state.js`/`schedule.js` unchanged (pure data/logic, no hub coupling). One-time setup on first open per iPad: which boy's content (`guided` vs `standard` track) — asked once, stored locally, never asked again, since the device is his. Setting a parent PIN the first time follows the exact same flow already built (`hasParentPin`/`checkParentPin`/`setParentPin` from `progress.js`) — parent-mode checking happens right there on the iPad, since that's where the data lives now.

## 0. Why this exists (v1 — shipped, superseded for the kid-facing side by §0a)
The printer broke. Jesse used to get a weekly packet from a separate session and print it for the boys. Two changes happen at once: it goes digital (a real tab in CodeQuest, on-screen instead of paper), and the content itself is now authored directly in this project instead of a separate PDF-generating session — no document handoff, no transcribing (§2). Jesse still tells the lead what each week should cover per boy; the lead writes the actual items straight into the schema below. Kids do the day's work on-screen, Jesse checks it in a locked parent mode from the same PC, wrong answers bounce back for the kid to fix, and a tracker shows whether a day got done at all.

## 1. Reference shape (from the one real sample so far)
Not a flat "2 generic sheets/day." The Week 11 PDF Jesse sent is now the *pacing and tone reference* for everything authored going forward (§2), not a document that keeps arriving — worked example before problems, "now you try" numbered lists, harder as the week goes, Friday mixed review:

- **Memory Verse** — one item, not tied to a weekday. A Bible verse with blanks, a word bank (e.g. "press", "prize"), then "write it 2 times — try the last one from memory." Sits at the top of the week.
- **Monday / Thursday / Friday** — a **Math** sheet + a **Word Problems** sheet. Each has a short method reminder, one or two worked examples, then a **"Now you try!"** list of 4–5 numbered problems ending in a blank line. Every one of these is free-typed (a number or "12%"), never multiple choice.
- **Tuesday / Wednesday** — a **Math** sheet + a **CodeQuest** sheet: "play CodeQuest for 15–20 minutes," then 3 questions — which level you reached (free text), 1–2 sentences on what you built or learned (free text), and a 1–5 "how tricky" rating (not right/wrong, just a number).
- **Coins/money (younger boy)** — his own real Week 11 packet (`Grade4_Week11_Packet.pdf`), read in full 2026-09-22: a coin-value review row Monday, then coin-combination practice all week (single combos → crossing $1 with bills → two-ways-required → messy amounts like 84¢ → mixed review), plus fixed-pile word problems ("you have 3 dimes and 4 pennies, how much?"). This packet was generated but never delivered — the printer broke first — so it's the actual current week for him, not a future one. Needs a real on-screen interactive per Jesse's choice, not just a typed word problem — see the `coin-total` item kind in §3.

So the second sheet's *subject* changes by day, and Memory Verse doesn't belong to any single day at all. The data model below reflects that instead of assuming a fixed 2-slot shape.

**Answer keys:** the packet shows no answers. The lead computes the correct value for every numeric item when authoring the week (confirmed with Jesse — no separate answer-key document exists). Free-text and rating items have no "correct" value; the parent judges them.

**Handwriting items:** "write it 2 times" doesn't translate to typing. The digital version keeps the fill-in-the-blank part of Memory Verse and drops the copy-it-twice instruction. If Jesse still wants the handwriting rep, that stays a paper/notebook thing outside the app.

**Nice overlap:** Tuesday/Wednesday's CodeQuest sheet is about this same app. "Which level did you reach" is a candidate to pull from the boy's real save data later instead of him retyping it — noted as a fast-follow, not built in v1.

## 2. Weekly authoring — done here, not a separate session
**Confirmed 2026-09-22:** no more separate PDF-generating session, no document handoff. Each week, for each boy, Jesse tells the lead what to cover — topics, skill focus, grade level, anything to reinforce from last week — the same kind of brief he'd have given that other session. The lead writes the week directly into the data shape below (worked examples, problem wording, numeric answer keys) and commits + pushes it, the same way lesson content in `pack1.js` was authored from Jesse's description. **Jesse stays the one deciding what gets taught and when; the lead does the writing.** No self-serve authoring UI in v1 — a later add if the back-and-forth becomes a bottleneck.

Jesse also handed over the full context brief the old session ran on. Everything about ITS pipeline is retired — no Python/wkhtmltopdf, no duplex-print blank-page trick, no color-printer or OCR-verification concerns; none of that applies once the output is on-screen, not paper. What carries forward is the **standing content rules**, unchanged by the delivery method:

- **Ask how last week landed, per boy, before planning the next one.** Never ramp difficulty blind.
- **Plan a week in text first, get Jesse's go-ahead, then author it.** Never build a week on spec.
- **Every Math/Word-Problems sheet opens with a worked example** (a fully solved model problem) before any practice problems. Not optional.
- **Full instructional paragraphs** explaining *why* a method works, not short one-liners.
- **No answer key ever shown to the kid** — already satisfied by the app's own design (nothing is marked correct/wrong until a parent checks it in §5).
- **CodeQuest days: 2 per week per son, replacing a Word-Problems slot, not adding to the pile.** Not fixed to Tuesday/Wednesday specifically — that's just what's been used so far.
- **Chore-price reference** (both grades, for realistic word problems): take out trash $0.75 · vacuum/sweep $1.00 · wipe counters $0.75 · set/clear table $0.50 · tidy living room $1.00 · unload groceries $0.75 · clean litter box $0.50 · load/unload dishwasher $0.75 · help make dinner $1.00 · foot massage for Mom $2.00 · laundry fold/put away $1.50 (G4) / full wash-dry-fold $2.50 (G5) · say memory verse from memory $2.50. A separate Give/Save/Spend + chore-calendar system uses these too — out of scope here unless Jesse says otherwise.

## 3. Content data shape (per profile)
```
DailyWorkContent = {
  guided: { weeks: { [weekId]: Week } },     // 9yo — same track key lessons.js already uses
  standard: { weeks: { [weekId]: Week } },   // 10yo
}
Week = {
  id: string,                     // Jesse's own week number, e.g. 'week-11' — stable, independent of any calendar date
  label: string,                  // display text, e.g. "Week 11"
  assignedWeekOf: string | null,  // the real Monday's ISO date, set at rollout time when the lead schedules which week shows when — not known/guessed at authoring time
  weekItems: Sheet[],             // not tied to a day — Memory Verse lives here
  days: {
    monday: Day, tuesday: Day, wednesday: Day, thursday: Day, friday: Day,
  },
}
Day = {
  sheets: Sheet[],                // ordered; length and subjects vary by day (see §1) — never assume exactly 2
}
Sheet = {
  id: string,
  subject: string,                 // open label, not a fixed enum: 'math' | 'word-problems' | 'codequest' | 'memory-verse' | ... — future weeks can add Reading/Spelling/Science without a schema change
  title: string,                   // e.g. "Finding the Percent"
  intro: string | null,            // the blue "how to" reminder box, if present
  example: string | null,          // the tan "Worked Example" box, if present
  citation: string | null,         // added during build step 1: scripture reference on a memory-verse sheet, e.g. "Luke 16:10 (NLT)". Optional, omitted (undefined) rather than set to null on every other sheet.
  items: Item[],
}
Item = {
  id: string,
  kind: 'numeric' | 'fill-blank' | 'short-text' | 'long-text' | 'scale' | 'coin-total',
  prompt: string,
  wordBank: string[] | null,       // fill-blank only
  answer: string | number | (string | number)[] | null,  // an array for a multi-blank fill-blank item (Memory Verse has 2 blanks, in order); a single value otherwise. numeric/fill-blank/coin-total: known, computed by the lead. null on short-text/long-text/scale — always parent-judged.
  scaleMax: number | null,         // scale only, e.g. 5
}
```

**`coin-total` (younger boy — a real coin interactive, not a typed word problem, confirmed 2026-09-22):**
```
CoinItem = Item & {
  kind: 'coin-total',
  coinSet: ('penny' | 'nickel' | 'dime' | 'quarter' | 'dollar-bill')[],  // which denominations appear; dollar-bill shows up once an amount crosses $1
  targetCents: number | null,     // set → "build this amount"; null → "here's a pile, find the total"
  pile: { [denom: string]: number } | null,  // fixed coin counts shown, "find the total" mode only
  answer: number,                  // correct total in cents either way, computed by the lead
}
```
Two modes, confirmed against the real Grade 4 Week 11 packet (both boys, coins + percent, fully read 2026-09-22 — the two seed weeks for build step 1):
- **Build the amount** (`targetCents` set) — an unlimited tray of each coin in `coinSet`; the kid taps/drags coins onto their total until they think it matches. `ItemState.value` is a **per-denomination count** (e.g. `{ quarter: 3, dime: 1, penny: 4 }`) — *any* combination that sums to the target is correct, not one fixed "right" set of coins (the packet asks for this explicitly: "there is often more than one way"). Correctness = "does it sum to `targetCents`," never "does it match one specific combination."
- **Count the pile** (`pile` set) — a fixed set of coins is shown, already chosen; the kid is just totaling them up, not choosing anything. `ItemState.value` here is a **plain number**, same as the `numeric` item kind — no per-denomination breakdown to give, since there's nothing to choose.
- **"Show two different ways"** (the packet asks for this on several items) — no new field. Author it as two sibling items sharing the same `targetCents`/`answer`, same as any other pair of items on a sheet.

Either way: **a live running total on screen is fine — that's just reflecting the kid's own actions, same as watching a number while typing it. The app must never auto-compare that total to `targetCents`/`answer` and reveal right or wrong itself.** That stays the parent's call in §5, same as every other item kind — the interactive doesn't get to grade itself just because it's more visual. Exact interaction (tap-to-add vs. real drag-and-drop) is a build-time UI call, not a design fork; noted here only so the schema anticipates it. This makes checking easy in §5 either way: the parent sees the actual coins chosen for a build-the-amount item, or the plain total for a count-the-pile one.
Per-item state (kid's answer + grading) is stored separately from the content above, so re-authoring next week never touches this week's history. It lives at `cq.dailyWork` **inside each profile**, exactly where `cq.lessons` already lives — content is shared per track, progress is per boy:
```
DailyWorkState = {
  weeks: { [weekId]: { days: { [dayKey]: DayState } } }   // weekId matches Week.id, e.g. 'week-11'
}
DayState = {
  sheets: { [sheetId]: { items: { [itemId]: ItemState } } },
  submittedAt: iso | null,          // set once every item in every sheet for that day has a value
}
ItemState = {
  value: string | number | null,    // the kid's answer
  status: 'unanswered' | 'answered' | 'correct' | 'wrong',
  checkedAt: iso | null,
}
```

## 4. Kid-side flow ("Daily Work" tab) — v1, shipped to the PC hub, superseded by §0a for where kids actually work now
- **Which week is "current" (closes a gap step 1 left open):** if any week in the boy's track has an `assignedWeekOf` whose Mon–Fri span contains today, use it. Otherwise, if exactly one week in that track has `assignedWeekOf: null`, treat it as the live/unscheduled current week regardless of the real calendar (this is Week 11's actual situation right now — authored, not yet calendar-assigned). Zero or more-than-one null-assigned week is an edge case that can't happen yet with one authored week; degrade to a friendly empty state rather than guessing.
- Opens to **today** (real calendar date, via the existing `src/cq/iso.js` strict-date helpers — same pattern the rest of the app already uses), using today's real weekday to pick `week.days[weekday]` once the current week is found above. Weekends: "no work today" state.
- Shows this week's `weekItems` (Memory Verse) alongside today's `sheets`, so it isn't buried on a day the kid skips ahead of.
- Each item renders by `kind`: numeric/short-text/long-text → a text box; fill-blank → the word bank shown as tappable chips plus blanks (mirrors the word-bank style already in the printed page); scale → 1–N buttons.
- Nothing shows red/green while answering — `status` stays `answered`, never `correct`/`wrong`, until a parent checks it. Kids cannot self-mark.
- Once every item across all of today's sheets has a value, the day flips to "ready to check" (`submittedAt` set) and the UI tells the kid to go get a parent.
- A day already fully checked with nothing wrong shows a completed state; the kid can still look back at past days (read-only) through the tracker (§6).

## 5. Parent mode (grading) — the write semantics below are unchanged and fully reused on the new iPad page (§0a); only "where the entry point lives" changed (right there on the boy's iPad, not a hub tab)
Reuses the existing parent PIN logic from `src/progress.js` (`hasParentPin`/`checkParentPin`/`setParentPin` — the exact functions the grown-ups corner already calls) — kids never reach this screen. **Resolved (was TBD):** one boy at a time, matching how the rest of the app is already profile-scoped (parent mode shows whichever boy's profile is currently active in this browser session; checking the other boy means switching profiles first, the same way everything else here already works) — not a cross-profile side-by-side view.
- Entry point sits on the Daily Work tab itself (a small, deliberately low-key "🔒 Parent Mode" control — discoverable, not kid-bait), since that's physically where a parent already is when a kid says "I'm done." Unlocking is a plain in-memory flag: a page reload always asks for the PIN again, same security posture as everything else in this app.
- A "Check work" screen, defaulting to today's weekday, with a day picker to catch up on a day earlier in the current week.
- Each item shows the kid's `value` next to the prompt. Numeric/fill-blank/coin-total items show the computed `answer` (coin-total: the sum of the kid's tapped counts vs. `targetCents`, or the typed total vs. `answer` in pile mode) as a suggested check, pre-marked correct if it matches, fully overridable; short-text/long-text/scale items always start neutral — the parent decides.
- Parent marks each item Correct / Incorrect, then saves. Per item:
  - **Correct** → `status: 'correct'`, `value` unchanged, `checkedAt` set to now.
  - **Incorrect** → `status: 'wrong'` (not `'unanswered'` — `status` is exactly the signal the kid view already keys off to know which items reopen; see `hasFixes()`/the locked-item check in `daily-work-ui.js`), `value: null` (the kid's old wrong answer is cleared, not shown back as a hint), `checkedAt` set to now.
  - `submittedAt` is not touched by grading itself — the existing kid-side edit path already clears it the moment the kid starts fixing a reopened item (`setItem()`'s `hadFixes` check), which is what correctly forces an explicit resubmit rather than the day silently flipping back to "awaiting parent" on its own.
- Kid returns to Daily Work, sees only the flagged (`'wrong'`) items reopened and editable, everything `'correct'` stays locked and shown, fixes just the flagged ones, resubmits, parent rechecks. This loop needs no new state-machine work — `ready()`/`isComplete()`/`hasFixes()`/`view()` in `daily-work-ui.js` already implement it correctly; parent mode only ever needs to WRITE item statuses, never re-derive the day's overall state itself.

## 6. Daily tracker
Calendar-style, per boy: for each weekday, one of *not started / in progress / awaiting check / has items to fix / complete*. This exact `dayStatus()` logic is now also the kid-facing calendar in §0a, not just a parent-only view — the "simplified version on the kid's own tab" idea below shipped as literally the same tracker, not a separate simplified one.

## 7. Open items — resolved 2026-09-22 unless noted
- ~~Exact name for the tab~~ — moot, it's not a tab anymore (§0a).
- How much week history stays visible/browsable versus archived — still open, not urgent with one authored week.
- ~~Both boys' check screens side by side~~ — moot, one iPad each, no shared screen at all (§0a).
- Exact `coin-total` interaction — **resolved and shipped**: tap-to-add/remove/clear, pennies–dollar-bills, real coin sizes/colors. Unchanged by §0a, reused as-is.
- ~~Visual identity fork~~ — **resolved**: the worksheet/print look, per §0a — no longer torn between matching the hub's pixel style, since the page doesn't sit next to that hub anymore.
- Give/Save/Spend + chore-calendar connection — still open, still out of scope unless Jesse asks.

## 8b. Old-device exemption for the new page (see §0a)
`test/syntax-compat.test.js` scans `DIRS = ['src/ui', 'src/engine', 'src/blocks', 'src/levels', 'src/cq']` and a couple of named files for ES2021+ syntax unsafe on old iPad Safari — `src/pro/` is the one existing carve-out, commented in that test as "the grown-ups track, shipped separately." The new Daily Work page's own directory gets the identical carve-out, for the identical reason: a separately-shipped surface, confirmed modern-only (iOS 27), not sharing an origin with anything old-Safari still has to support. Do not add its files to `DIRS`/`FILES`; do add a one-line comment there (matching the existing `src/pro/` one) naming the new directory and why.

## 8a. Visual identity (reference — now the PRIMARY direction for §0a's page, not just a polish-later idea)
From Jesse's print-era brief, confirmed against the real Week 11 PDF:
- **Fonts:** Baloo2 for headers, Nunito for body — both Google Fonts, same as any other web font pull.
- **Card style:** a colored bar across the top — icon in a circle + bold title — rounded card body, a colored dot in the footer.
- **Day badge:** a small colored pill under the top bar reading MONDAY / TUESDAY / etc.
- **Worked example:** always a gold dashed box, always before the practice problems (standing rule, §2).
- **Subject colors, kept exactly as given:** math = blue, reading = purple, writing = green, science = teal, social studies = orange, Spanish = rose, verse = gold, word problems = teal, CodeQuest = green. (Writing/CodeQuest share green and science/word-problems share teal in Jesse's own list — kept as-is, likely never on the same sheet at once.)

This is a different visual language than the rest of CodeQuest's blocky pixel-game look — worksheet-friendly, not game-friendly. **Resolved 2026-09-22:** since the page no longer sits next to the pixel-game hub (§0a), there's no more tab-to-tab consistency to weigh against it — lean fully into this worksheet identity, light/paper-toned background included, for the new page.

## 8. Build order — v1 (shipped to the hub; kept as a record)
1. ✅ Data model + normalize/storage functions + one real authored week (Week 11, both boys) as seed content, tested.
2. ✅ Kid-side hub tab: all item kinds incl. the real coin-total interactive.
3. ✅ Parent-mode grading screen + the fix-and-recheck loop.
4. ✅ Daily tracker.
5. ✅ A small reduced-motion-aware animation pass.
All shipped, commit `a0557fa`, live. Superseded for where kids actually work by the build order below.

## 8c. Build order — the dedicated iPad page (§0a, current target)
1. DONE. New page shell — `daily.html` + `src/daily/app.js`, own `codequest-daily-v1` storage (`src/daily/store.js`, reusing `state.js`'s `normalizeDailyWork`/`emptyDailyWorkState` unchanged for the `dailyWork` field) + the one-time per-iPad track picker + a PIN-set/enter flow. Correction to this line as originally written: the PIN flow is `src/daily/pin.js`, progress.js's exact salt/hash/lockout logic **duplicated, not imported** — progress.js is hardwired to the PC hub's `codequest-v1` key, and importing it (even just for its PIN exports) would've dragged that key's assumptions, plus progress.js's unrelated character/gear schema, into this page's bundle. Same reasoning applied to `dayStatus`/`gradeSuggestion`/`gradeDailyWork` in steps 2 and 5 below.
2. DONE. Calendar landing (`src/daily/calendar.js`) — 5 weekday tiles, `dayStatus()` **duplicated** from `daily-work-parent.js` (not imported — see step 1's note; confirmed empirically worth it: the built page's JS is ~24.5kB gzipped ~8kB, nowhere near `pro.js`/`computer.js`'s size), tap a day to open it.
3. DONE. Per-sheet paged view (`src/daily/sheet-view.js`) — next/back between a day's sheets (including the week-level Memory Verse sheet, which appears first on every day, same as the old stacked view). Fresh markup (the old renderItem/coinItem/etc. are private to daily-work-ui.js and built for a stacked scroll, not a pager) but every exported pure state helper (`updateDailyWork`, `itemMeta`, `storedDay`, `storedItem`, `isComplete`, `hasFixes`, `ready`, coin math) reused unchanged — reskin + repage around proven logic, not a rewrite of it. The worksheet visual identity (§8a) is still Codex's pass, not yet applied — current CSS is a functional placeholder (see §8a note).
4. DONE, scoped down from the original line. The drawing layer (`src/daily/drawing.js`) — canvas per sheet, Pointer Events, pen + Clear, saved+restored as a capped-resolution `image/webp` data URL per (week, day, sheet). No eraser and no undo — not asked for, not built; Clear (whole-page) covers "start over," matching the project's own "don't add features beyond what's needed" convention. Toggled against typing via a Type/Draw mode switch (canvas `pointer-events` off in Type mode, on in Draw mode) rather than the two being simultaneously live, so drawing strokes can't eat taps meant for input fields. Never touches grading/neutrality logic (§0a) — confirmed, drawings are stored data, never read by any suggestion/grading path.
5. DONE, same duplication note as step 1. Parent-mode grading (`src/daily/parent-view.js`) — same write semantics as §5 below (`gradeDailyWork`/`gradeSuggestion` duplicated, not imported, for the same progress.js-isolation reason), reachable right there on the iPad via a "🔒 Parent Mode" link on the calendar screen.
6. NOT YET DONE. Remove the "Daily Work" tab from the CodeQuest hub (`src/cq/ui.js`) — waiting until the Codex visual pass (next) is verified, per this list's own ordering.
7. DONE, landed with step 1 as planned. `syntax-compat.test.js` exemption (§8b).

Verification for steps 1-5: 2 real-browser Playwright scripts (lead's own, not delegated) covering the full kid+parent loop including the reopen/needs-fixes path (wrong item re-editable, correct items genuinely locked) and a drawing save→reload→revisit pixel-level repaint check, plus a new `test/daily-page.test.js` unit file (store normalize + prototype-pollution guards, PIN set/check/lockout/cooldown/reset, `dayStatus`'s state table). Full test chain + build green throughout. Detail in the ledger, 2026-09-22.
