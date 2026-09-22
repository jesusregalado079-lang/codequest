# Computer Quest — Daily Work (design contract)

Status: approved · 2026-09-22 (Jesse: "go ahead"). Build step 1 (data model + real seed content) shipped in-repo, uncommitted — see `src/cq/daily-work/`.
Grounded in a real sample: `Grade5_Week11_Packet_PRINT.pdf` (10yo, Week 11). Same shared Windows PC as the rest of the app — no cross-device sync, no server. New tab in the CodeQuest hub, next to Gear / Wardrobe / Trader / Quests / Typing.

## 0. Why this exists
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

## 4. Kid-side flow ("Daily Work" tab)
- **Which week is "current" (closes a gap step 1 left open):** if any week in the boy's track has an `assignedWeekOf` whose Mon–Fri span contains today, use it. Otherwise, if exactly one week in that track has `assignedWeekOf: null`, treat it as the live/unscheduled current week regardless of the real calendar (this is Week 11's actual situation right now — authored, not yet calendar-assigned). Zero or more-than-one null-assigned week is an edge case that can't happen yet with one authored week; degrade to a friendly empty state rather than guessing.
- Opens to **today** (real calendar date, via the existing `src/cq/iso.js` strict-date helpers — same pattern the rest of the app already uses), using today's real weekday to pick `week.days[weekday]` once the current week is found above. Weekends: "no work today" state.
- Shows this week's `weekItems` (Memory Verse) alongside today's `sheets`, so it isn't buried on a day the kid skips ahead of.
- Each item renders by `kind`: numeric/short-text/long-text → a text box; fill-blank → the word bank shown as tappable chips plus blanks (mirrors the word-bank style already in the printed page); scale → 1–N buttons.
- Nothing shows red/green while answering — `status` stays `answered`, never `correct`/`wrong`, until a parent checks it. Kids cannot self-mark.
- Once every item across all of today's sheets has a value, the day flips to "ready to check" (`submittedAt` set) and the UI tells the kid to go get a parent.
- A day already fully checked with nothing wrong shows a completed state; the kid can still look back at past days (read-only) through the tracker (§6).

## 5. Parent mode (grading)
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
Calendar-style, per boy: for each weekday, one of *not started / in progress / awaiting check / has items to fix / complete*. Lets Jesse see at a glance whether a day got skipped entirely, without opening it. Visible in parent mode; a simplified version (e.g. a streak count) can also show on the kid's own tab, extending the `streak` concept the app already tracks for typing/lessons rather than inventing a parallel one.

## 7. Open items (Jesse to confirm or the lead decides during build if minor)
- Exact name for the tab — "Daily Work" is a placeholder.
- How much week history stays visible/browsable versus archived.
- Whether both boys' check screens live side by side in parent mode or are switched between (small UI call, not architectural).
- Exact `coin-total` interaction (tap-to-add vs. drag-and-drop), which denominations to start with (pennies–quarters vs. also dollar bills), and coin art style.
- Visual identity: the worksheet look from §8a, or restyle to match the rest of the app's pixel-game look — real fork, not yet decided.
- Whether the separate Give/Save/Spend + chore-calendar system connects to Daily Work at all, or stays fully separate — asked Jesse, pending.

## 8a. Visual identity (reference for the polish pass, step 5 below)
From Jesse's print-era brief, confirmed against the real Week 11 PDF:
- **Fonts:** Baloo2 for headers, Nunito for body — both Google Fonts, same as any other web font pull.
- **Card style:** a colored bar across the top — icon in a circle + bold title — rounded card body, a colored dot in the footer.
- **Day badge:** a small colored pill under the top bar reading MONDAY / TUESDAY / etc.
- **Worked example:** always a gold dashed box, always before the practice problems (standing rule, §2).
- **Subject colors, kept exactly as given:** math = blue, reading = purple, writing = green, science = teal, social studies = orange, Spanish = rose, verse = gold, word problems = teal, CodeQuest = green. (Writing/CodeQuest share green and science/word-problems share teal in Jesse's own list — kept as-is, likely never on the same sheet at once.)

This is a different visual language than the rest of CodeQuest's blocky pixel-game look — worksheet-friendly, not game-friendly. Real open question, not decided: match Daily Work to this worksheet identity (what the boys already know from paper) or restyle it to the app's pixel look for tab-to-tab consistency. Added to §7.

## 8. Build order
1. Data model + normalize/storage functions + one real authored week (Week 11, both boys) as seed content, tested — no UI yet.
2. Kid-side Daily Work tab: view today, answer items, reach "ready to check," for the plain item kinds (numeric/fill-blank/short-text/long-text/scale) first. The `coin-total` interactive (tap/drag coins, live running total, never self-grades — see §3) is real UI work on its own, closer to a small game mechanic than a form field — built as a follow-up within this step, not blocking the rest.
3. Parent-mode grading screen + the fix-and-recheck loop.
4. Daily tracker (parent-facing calendar + kid-facing streak).
5. Polish pass — art/feel consistent with the rest of the app (subject header colors already exist in the source packet: orange/Memory Verse, blue/Math, teal/Word Problems, green/CodeQuest — worth carrying over), plus a real second week authored end-to-end as a dry run of the weekly workflow.
