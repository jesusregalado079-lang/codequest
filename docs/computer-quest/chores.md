# Chores on the iPad: preparation (DRAFT, nothing built, nothing shipped)

Status 2026-11-01: decisions frozen (below). Building in stages, nothing ships until Jesse says "ship".
Mockups: `.foreman/scratch/chores/shots/` (pictures only, made from the real page's styles; not app code).

## Why
Chores are tracked on paper (monthly packet, one per boy, `Chore_Money_Packet_*.pdf` in Drive, plus Jesse's older `chore_money_tracker.html`). The boys forget to tell a grown-up, so they miss pay. Goal: the boy logs what he did each day in the app, a grown-up confirms (per day or per week), and the confirmed total is what gets paid.

## Where we stand now (inventory, 2026-11-01)
- Each boy has his own iPad and his own `codequest-daily-v1` storage. Parent Mode (4-digit PIN) already exists on each iPad and already checks Daily Work day by day.
- The younger son's Payday Helper already splits an amount into Give 10% / Save 20% / Spend 70% and walks him through the bills and coins; its first step ("How much did you earn?") is typed by hand today. The older son has no Payday Helper.
- No chore code exists in the app. The prices live in the planner brief: trash $0.75, vacuum/sweep $1.00, wipe counters $0.75, set/clear table $0.50, tidy living room $1.00, unload groceries $0.75, litter box $0.50, dishwasher $0.75, help make dinner $1.00, foot massage for Mom $2.00, fold/put away laundry $1.50 (younger) or full wash/dry/fold $2.50 (older), say the memory verse $1.50.
- Paper packet details seen: Spanish job names, a "pick any, write the job name in the day box" section (paid), an "unpaid, checked by an adult each day" section, and "money at the start / end of the month" lines.
- Payday Helper v3 changes (Drive doc, approved by Jesse, not built, waiting for his go) touch the same helper; the chore link is a small add-on that works before or after it.
- Known small bug found while preparing: on the younger son's calendar home the "$5" bill icon covers the first letters of "Payday Helper" at iPad width.

## Proposed behavior
- Boy: new "My Chores" button on the calendar home. Tap a job card to log it for a day (today by default; earlier days of the current week allowed). He can take a job off with x until a grown-up has checked it. He sees Waiting / Confirmed / "Ask a grown-up" and his totals. He never sets a price.
- Grown-up (PIN): new "Chores" tab next to "Check work". Per job Confirm or Not done, "Confirm all of <day>", "Confirm the whole week". Nothing is deleted when a job is not confirmed.
- Pay: week table, 10/20/70 guide, "Mark the week as paid" (locks it, keeps who/what/when), and for the younger son "Open the Payday Helper with $X" which offers "Use $X" on its first step.
- Prices are copied onto each entry when it is logged, so changing a price later never rewrites an old week.

## Stages
0. Done: inventory, paper packets and tracker read, mockups.
1. Jesse confirms or denies the decisions below; spec frozen.
2. Pure logic + tests, no screens: job lists, entries, statuses, week totals, split, paid records, safe loading of saved data (Codex builds, Claude blind-verifies).
3. Boy's screens (My Chores, forgot-an-earlier-day).
4. Grown-up screens (check by day / week, pay the week, job list and prices).
5. Payday Helper "Use $X" link (younger); amounts-only for the older son unless Jesse wants jars for him too.
6. Backup/export of chore records (it is money), real-iPad check, verification by a second model, ship only when Jesse says "ship".

## Decisions (frozen 2026-11-01, Jesse's answers on the review page)
1. Job names: English with the Spanish name underneath (as in the pictures).
2. Memory verse: $1.50 for the younger son, $2.50 for the older son.
3. Earlier days: the boys log jobs only for TODAY. Grown-ups can add or override jobs on earlier days. (This replaces picture 3: for the boys, earlier days are look-back only.)
4. "Something else I did": the boy types the name, a grown-up picks the price when checking.
5. The same job twice in a day: tapping it again counts it again.
6. Confirm by day AND by the whole week.
7. "Mark the week as paid" record: yes. Payday Helper "Use $X" button: yes, for the younger son only.
8. Older son: no Payday Helper help. His confirmed amounts stay on his screen and add up for the month, so he can save them himself.
9. The paper packet's unpaid daily jobs and monthly money stay on paper.
10. Backup export file for the chore records: yes.
11. Fix the "$5" bill icon covering "Payday Helper" on the younger son's calendar: yes, with this work.
Pictures 1, 2, 4, 6 and 7 approved as shown (job list: memory verse price per boy as in 2). Picture 3 changes as in 3. Picture 5 changes as in 7 and 8: no Payday Helper button for the older son, and a "This month" total on both boys' chore screens.

## How it works now

Each boy taps jobs he did today in My Chores. He can see earlier days, but only a grown-up can add a job for an earlier day. The grown-up uses the PIN to confirm jobs, set a price for Something else, mark jobs not done, and mark a week paid. A paid week is locked until the grown-up reopens it.

On the younger son's iPad, an unused paid week appears on the first Payday Helper screen. He can use its amount or type a different one. The grown-up can also open the Helper from that week's pay screen, but only once the week is marked paid (an unpaid week could otherwise go through the Helper twice). Using a paid total marks it used once. Reopening a week that was already used clears that mark, so Parent Mode says so and the grown-up tells him to type only the new part. The older son's iPad has no Helper link.

Parent Mode can export a JSON backup file and import one by merging or replacing chore records. Each iPad accepts backups for its own boy only. Import requires pressing the button. Chore records live in this iPad's `codequest-daily-v1` browser storage, so keep a backup file somewhere safe. Confirmed entries keep their original price. Merge never replaces an existing entry or a paid record, and reopening a paid week removes its payment and Helper-used flag.

## Trust rules added after the blind review (11/1)
- A boy never sees a system error. Any refused tap shows "That did not work. Ask a grown-up."
- A paid week never holds a waiting job, and a custom job cannot reuse the built-in "other" id; backups that say otherwise are cleaned on load.
- The device clock decides what "today" is. Setting it forward lets a boy log future days; paid weeks stay locked either way.

## My chore sheet (added 11/3)
Jesse asked that each boy can see his own record, like the paper sheet, without anything filled in for him. My Chores has a "📄 My chore sheet" button. The sheet is read-only: one box per day (Monday to Sunday) with the jobs that were really logged and their status, a line on any job a grown-up wrote in, the week's Confirmed and Waiting totals, and a PAID stamp (local date and amount) once the week is paid. "← Earlier week" pages back to the first week with any chore; it never shows a future week. Every week stays on that iPad (the backup file is still the safety net). It shows no Give/Save/Spend split, because the Payday Helper is where the younger son works that out.

## Money math and savings used (added 11/8)
Both boys see job prices, but no app-added chore money totals. Each week's chore sheet has four boxes for his own total, Give 10%, Save 20%, and Spend 70%. He can save part of the math and return later. The app does not tell him if it is right. The boxes stay editable until a grown-up marks the week paid and all four lines are saved. Reopening keeps the math. Every week's work stays on his iPad and in backups.

The current week's sheet also lets him record how much savings he used and what for. A grown-up approves or declines each request in Parent Mode. He sees the decision, but no savings balance. He can remove a request he made today while it is waiting.

The grown-up sees his numbers next to the actual confirmed and split amounts on Pay the week. The grown-up also sees savings requests and the app's saved-so-far figure after approved uses. Payment does not depend on his math. The Payday Helper remains for the younger boy, but it no longer offers a chore amount; he types the amount he worked out. This replaces decision 8 and the 11/3 read-only chore sheet rule.

## 11/8 night: the money page
The boys now have a separate Give · Save · Spend Tracker button on the Daily Work home page. It copies the monthly paper page: goal, three jar banners, four or five weekly money rows, monthly review, earning goal, four totals, then Savings I used. The weekly My money math boxes and Savings I used section moved off the chore sheet; the chore sheet still shows jobs, statuses, week summary, and the paid stamp. Weekly rows keep using `chores.math[monday]`. Savings requests keep using `chores.savingsUsed`; approval stays in Parent Mode.

`chores.months[YYYY-MM]` stores the boy's own page: `goalFor`, `goalCostCents`, `goalSavedCents`, `savingsFromLastCents`, `spendingFromLastCents`, `savingsNowCents`, `spendingNowCents`, `savingForMonth`, `earningGoalCents`, `totalEarnedCents`, `totalGivenCents`, `totalSavedCents`, `totalSpentCents`, and `savedAt`. Words are at most 80 characters; money is cents or blank. Old stores and version 1 backups without `months` still load.

A week belongs to the month containing its Monday. The month page locks after its last Monday is paid, or after any later week is paid if the last week had nothing to pay. Future months cannot be edited. Individual weekly rows still follow the existing weekly math lock rule. Parent Mode shows his monthly totals and Savings I have now next to right amounts from paid weeks in that Monday month. Approved savings uses dated in the month reduce the savings right amount. The boy sees only amounts he wrote.
