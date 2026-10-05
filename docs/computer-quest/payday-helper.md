# Payday Helper (the younger son's tool)

Built 2026-10-05 from the Drive doc `Payday Helper feature spec (younger son) v2` (folder `CodeQuest Plans`). A standalone tool on the iPad Daily Work page (`daily.html`), not part of any week's sheets. He types what he earned and the bills and coins he was handed; the app splits it into Give 10% / Save 20% / Spend 70% and he works out how to make each jar from his REAL pieces by breaking bills and coins. The app asks questions instead of giving answers and checks his work itself, so a parent marks nothing. This is the one place the app tells a kid right or wrong (the Planner Brief's "never mark" rule does not apply here, by the spec's own exception).

## Where things live
| What | File |
| --- | --- |
| Money rules: pieces, jar math (whole cents), subset-sum "can these make it?", break / jar checks, the two stored worked examples | `src/payday/logic.js` |
| The session: one payday as plain JSON + the pure reducer `act(state, action, now)` (flow, hint ladder, hints) | `src/payday/session.js` |
| Saving: normalising what comes back from localStorage, start/act/abandon helpers | `src/payday/state.js` |
| Screens (HTML strings) | `src/payday/view.js` |
| Parent summary | `src/payday/summary.js` |
| Wiring: route `payday`, `payday-*` actions, Enter key | `src/daily/app.js` |
| Store: `store.payday = { sessions: [...] }` (newest first, 30 kept), normalised on every load | `src/daily/store.js` |
| Button on the younger son's calendar (under the verse button) | `src/daily/calendar.js` |
| Parent Mode "Payday" tab (younger son's iPad only) | `src/daily/parent-view.js` |
| Styles (`.pd-*`, bills drawn in CSS, `.cqd-payday-*`) | `src/daily/daily.css` |
| Tests | `test/payday-logic.test.js`, `payday-session.test.js`, `payday-view.test.js`; browser: `daily-regression.cjs payday` |

## The flow (spec v2)
1. **Earned** — dollars, 0.01 to 50.00, at most two decimals. Bad input: "That does not look right. Check the amount and try again."
2. **Handed** — eight counters (the $20, $10, $5, $1 bills, quarter, dime, nickel, penny), 0 to 20 each, with a running "My bills and coins add up to $__." "That's everything" must match what he earned; otherwise only the difference is shown (too much / too little), never which piece. Then a recap he confirms (Yes / No). Two links always: "Change the amount I earned" and "Change my bills and coins" (clears the counters).
3. **Jars** — Give (10%), Save (20%), Spend (70%), always in that order. Give = (E+5) div 10, Save = (2E+5) div 10, Spend = E − Give − Save (whole cents), so the three always add up and Spend is never negative.
4. **Add the jars** — tap each jar into a tray ("So far: $__"), type the total. Must equal what he earned.
5. **Make Give, then Save** — show his pieces; "Can you make exactly $X with only these pieces, without breaking any?" (yes / no; the app works out the truth with a bounded subset-sum); if no: tap a piece to break, build smaller pieces that add up to exactly the same value, back to the question; if yes: tap pieces from his hand into the jar ("In your jar so far" / "This jar needs"). **Spend**: tap the pieces left in his hand into a tray and type the total.

Rules kept: only pieces he entered ever appear; the only way to get new ones is breaking one into strictly smaller pieces of the same total value (no combining in v1); hand + built jars always equals what he earned (asserted after every break and jar, and checked again when a saved payday is loaded: money that does not add up is dropped).

## Wrong answers
Per question: first miss, a hint that never contains the answer; second miss, a stored worked example with different money (never the amount he earned: the $6.25 example is used when he earned $3.50); third miss, the hint again; fourth miss in a row, "Show this screen to a grown-up." with one button, "My grown-up helped me. Try again." (resets the count, never skips the question). Steps 1 and 2 use their own plain messages and the same fourth-miss rule. The spec says both "the miss count starts over" after the example and "four misses in a row"; these are two counters: the hint/example ladder cycles, the in-a-row count is what triggers the grown-up screen.

## Parent Mode
A "Payday" tab (younger son's iPad only): the last ten paydays with date, amount earned, what he entered, the jars, finished or not, and per question whether it was right the first time, needed a hint, needed the worked example, or got stuck (with, for Step 2, the amount and what he entered). Nothing to mark and no Save button. It never prints what he typed for a missed question.

## Decisions made while building (the spec left these open)
- Button placement: under the memory-verse button on the younger son's calendar.
- Picking a penny to break (or a piece not in his hand) is a miss; any other piece he holds is accepted (the spec: accept any breaking that keeps the values exact).
- A $0.00 jar (paydays under about 5 cents) has nothing to build and is skipped.
- Resume is built: a half-finished payday comes back on the same screen. "Start a new payday" asks first and the old one stays in the grown-up's list as not finished.
- In Step 4 the tray shows the total, so he reads the answer off the tray he built (the spec's UNSURE item; assumed intended).
- Counters 0-20 in Step 2; a broken piece may become at most 100 of any smaller piece.

## Not built (spec "would help")
Combining pieces (4 quarters into a $1 bill); more than two stored examples; an older-son version.
