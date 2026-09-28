function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.keys(value).forEach((key) => deepFreeze(value[key]));
  return Object.freeze(value);
}

export const Item = (id, kind, prompt, extra) => Object.assign({
  id, kind, prompt, wordBank: null, answer: null, scaleMax: null,
}, extra || {});

// `extra` (optional, additive) carries the tithe-week fields: `payCents` = the coins must ALSO be able to make
// exactly this much (a parent-side check), `mustHave` = { denom, min } a coin that has to be included, and
// `parentNote` = a line only the grown-up sees on the check-work page (never on the kid's sheet).
export const CoinItem = (id, prompt, targetCents, coinSet, extra) => Item(id, 'coin-total', prompt, Object.assign({
  answer: targetCents, coinSet, targetCents, pile: null,
}, extra || {}));

export const Sheet = (id, subject, title, intro, example, items, extra) => Object.assign({
  id, subject, title, intro, example, items,
}, extra || {});

export const Day = (sheets) => ({ sheets });

// `assignedWeekOf` = the real Monday (ISO date) this week is shown, see schedule.js. null = the single unscheduled week.
export const Week = (id, label, weekItems, days, assignedWeekOf = null) => ({ id, label, assignedWeekOf, weekItems, days });

const coins = ['penny', 'nickel', 'dime', 'quarter'];
const coinsWithBill = [...coins, 'dollar-bill'];
const numeric = (id, prompt, answer) => Item(id, 'numeric', prompt, { answer });
// Same numeric item, plus a `unit` the dedicated iPad page's percent-shading grid checks for
// (src/daily/sheet-view.js) — purely additive, the hub's plain-numeric renderer never looks at it.
const percent = (id, prompt, answer) => Item(id, 'numeric', prompt, { answer, unit: 'percent' });
// A percent problem shown with the adaptive block bar (src/daily/blocks.js): `part` out of `whole`,
// and `help` = how much the bar labels for the kid on that sheet ('all' | 'unit' | 'clues' | 'none' —
// authored to fade across the week). The answer is (part * 100) / whole so it stays an exact integer
// (0.3 * 100 is 30.000000000000004 in JS). Only additive fields, so the hub and older readers ignore them.
const blocks = (id, prompt, part, whole, help) => Item(id, 'numeric', prompt, { answer: (part * 100) / whole, unit: 'percent', part, whole, help });
const STEPS = '(1) Count the blocks in the whole. (2) Find what ONE block is worth: 100 ÷ the number of blocks. (3) Count the blocks you have, then multiply.';
const coin = (id, prompt, targetCents, coinSet = coins, extra) => CoinItem(id, prompt, targetCents, coinSet, extra);
const codeQuest = (id) => Sheet(id, 'codequest', 'CodeQuest',
  'Time to play! Fill this out after you finish.\n\n🎮 CodeQuest Day! Play CodeQuest today for at least 15–20 minutes. Try to reach a new level!', null, [
    Item('level', 'short-text', 'Which level did you reach today?'),
    Item('learned', 'long-text', 'Write 1–2 sentences about something you built, solved, or learned:'),
    Item('tricky', 'scale', "On a scale of 1–5, how tricky was today's level?", { scaleMax: 5 }),
  ]);

const guided = Week('week-11', 'Week 11', [
  Sheet('memory-verse', 'memory-verse', 'Memory Verse', null, null, [
    Item('verse', 'fill-blank', "If you are ___ in ___ things, you will be faithful in large ones. But if you are dishonest in little things, you won't be honest with greater responsibilities.", {
      wordBank: ['faithful', 'little'], answer: ['faithful', 'little'],
    }),
  ], { citation: 'Luke 16:10 (NLT)' }),
], {
  monday: Day([
    Sheet('coin-combinations', 'math', 'Coin Combinations',
      'Every coin has its own value: penny, nickel, dime, quarter. When you need a certain amount of money, you can mix and match coins in more than one way to get there. Practice figuring out which coins to use below.',
      'There is often more than one way to make the same amount! Here are three ways to make $0.35 — Way 1: a quarter + a dime (25 + 10 = 35). Way 2: three dimes + a nickel (10 + 10 + 10 + 5 = 35). Way 3: seven nickels (5 × 7 = 35).', [
        numeric('penny-value', 'Penny = ? ¢', 1), numeric('nickel-value', 'Nickel = ? ¢', 5),
        numeric('dime-value', 'Dime = ? ¢', 10), numeric('quarter-value', 'Quarter = ? ¢', 25),
        coin('make-40', 'Make $0.40', 40), coin('make-60', 'Make $0.60', 60),
        coin('make-75', 'Make $0.75', 75), coin('make-90', 'Make $0.90', 90),
      ]),
    Sheet('word-problems', 'word-problems', 'Word Problems',
      'Some problems give you coins and ask for the total. Others give you a target amount and ask which coins to use. Read carefully to see which one you are solving.',
      'You have 2 quarters and 1 dime. 25 + 25 + 10 = $0.60.', [
        numeric('dimes-and-pennies', 'You have 3 dimes and 4 pennies. How much money do you have?', 34),
        coin('gumball-way-1', 'Make $0.60 — Way 1', 60), coin('gumball-way-2', 'Make $0.60 — Way 2', 60),
        numeric('quarter-dime-nickels', 'You have 1 quarter, 1 dime, and 3 nickels. How much money do you have?', 50),
      ]),
  ]),
  tuesday: Day([
    Sheet('coin-combinations', 'math', 'Coin Combinations',
      'Once you go past one whole dollar, you can use a $1 bill to cover the dollar part, then add coins for the cents. This works exactly the same way as yesterday, just with one more piece.',
      'Make $1.25 two ways: (1) one $1 bill + 1 quarter. (2) one $1 bill + 2 dimes + 1 nickel.', [
        coin('make-110', 'Make $1.10', 110, coinsWithBill), coin('make-130', 'Make $1.30', 130, coinsWithBill),
        coin('make-145', 'Make $1.45', 145, coinsWithBill),
      ]),
    codeQuest('codequest'),
  ]),
  wednesday: Day([
    Sheet('coin-combinations', 'math', 'Coin Combinations',
      'Remember: there is almost always more than one right answer when it comes to making change! Challenge yourself to find two different combinations for each amount below.',
      'Two ways to make $0.50: (1) 2 quarters. (2) 5 dimes.', [
        coin('make-80-way-1', 'Make $0.80 — Way 1', 80), coin('make-80-way-2', 'Make $0.80 — Way 2', 80),
        coin('make-65-way-1', 'Make $0.65 — Way 1', 65),
      ]),
    codeQuest('codequest'),
  ]),
  thursday: Day([
    Sheet('coin-combinations', 'math', 'Coin Combinations',
      'Real amounts are not always clean, round numbers. Messy amounts like 84 cents still work the exact same way — just take it one coin at a time, biggest coins first.',
      'Make $0.84: 3 quarters + 1 nickel + 4 pennies. 25+25+25+5+1+1+1+1 = 84¢. Messy amounts still work the same way!', [
        coin('make-84', 'Make $0.84 (try it yourself, any way that works)', 84),
        coin('make-147', 'Make $1.47', 147, coinsWithBill), coin('make-63', 'Make $0.63', 63),
      ]),
    Sheet('word-problems', 'word-problems', 'Word Problems',
      'Add up the coins you are given carefully, biggest to smallest. For target-amount problems, think about which coins get you there with the fewest coins possible.',
      'You have 3 quarters, 1 dime, and 2 pennies. 75+10+2 = $0.87.', [
        numeric('quarters-dimes-pennies', 'You have 2 quarters, 3 dimes, and 4 pennies. How much money do you have?', 84),
        coin('snack', 'You need exactly $0.84 for a snack. Which coins would you use?', 84),
        numeric('bill-quarter-dime-nickels', 'You have 1 dollar bill, 1 quarter, 1 dime, and 2 nickels. How much money do you have?', 145),
      ]),
  ]),
  friday: Day([
    Sheet('coin-combinations', 'math', 'Coin Combinations',
      'Watch the modeled example first: start with the biggest pieces and work your way down to pennies. Then try the same method yourself on the amounts below. That is the whole method: start with the biggest pieces (bills, then quarters), and work your way down to pennies. Now you try it completely on your own!',
      'Make $1.62: one $1 bill + 2 quarters + 1 dime + 2 pennies. 100+25+25+10+1+1 = $1.62.', [
        coin('make-138', 'Make $1.38 (show your coins below)', 138, coinsWithBill), coin('make-79', 'Make $0.79', 79),
      ]),
    Sheet('word-problems', 'word-problems', 'Word Problems',
      'Now it is your turn! Work through each problem the same way you practiced all week — biggest pieces first.\n\nShow What You Know! Try these on your own.', null, [
        numeric('quarters-dimes-pennies', 'You have 4 quarters, 2 dimes, and 3 pennies. How much money do you have?', 123),
        coin('toy', 'You need exactly $1.38 to buy a toy. Which bills and coins would you use?', 138, coinsWithBill),
      ]),
  ]),
}, '2026-09-21');

const standard = Week('week-11', 'Week 11', [
  Sheet('memory-verse', 'memory-verse', 'Memory Verse', null, null, [
    Item('verse', 'fill-blank', 'I ___ on to reach the end of the race and receive the heavenly ___ for which God, through Christ Jesus, is calling us.', {
      wordBank: ['press', 'prize'], answer: ['press', 'prize'],
    }),
  ], { citation: 'Philippians 3:14 (NLT)' }),
], {
  monday: Day([
    Sheet('finding-the-percent', 'math', 'Finding the Percent',
      'To find what percent one number is of another, write it as a fraction first (the part over the whole), simplify that fraction if you can, then think about what percent that simplified fraction equals. Your benchmark fractions — 1/2, 1/4, 3/4 — will help you recognize the percent quickly.\n\nSo far you have found a percent OF a number. This week flips it: you will find WHAT PERCENT one number is of another. The trick is the same fraction thinking you already know — turn it into a fraction, then into a percent.',
      '10 out of 20 = 10/20 = 1/2 = 50%. Simplify the fraction first, then think: what percent is that fraction? · 6 out of 12 = 6/12 = 1/2 = 50%. Same answer, different numbers — the fraction is what matters.', [
        percent('10-of-20', '10 out of 20 = ?', 50), percent('6-of-12', '6 out of 12 = ?', 50),
        percent('3-of-12', '3 out of 12 = ?', 25), percent('8-of-16', '8 out of 16 = ?', 50),
        percent('12-of-16', '12 out of 16 = ?', 75),
      ]),
    Sheet('word-problems', 'word-problems', 'Word Problems',
      'Turn each situation into a fraction (part out of whole), then figure out the percent. Some of these will simplify cleanly; others you may need to estimate.',
      'You get 9 out of 10 right on a quiz. 9/10 = 90%.', [
        percent('quiz', 'You get 9 out of 10 right on a quiz. What percent?', 90),
        percent('games', 'Your team wins 6 out of 8 games. What percent?', 75),
        percent('pets', '4 out of 5 kids in your class have a pet. What percent?', 80),
        percent('pages', 'You read 21 out of 30 pages. Estimate the percent.', 70),
      ]),
  ]),
  // Tue-Fri were re-authored 2026-09-23 as a gentle ramp after Monday's sheet proved too big a jump for
  // the 10yo (docs/computer-quest/daily-work.md §2a): the SAME three steps every day, blocks that fit
  // each question, and less help each sheet — all labels (Tue) -> just the unit (Wed) -> one or two clue
  // blocks (Thu) -> none (Fri). Monday is untouched: it was already finished on the old 100-square grid.
  tuesday: Day([
    Sheet('finding-the-percent', 'math', 'Finding the Percent',
      `Percent means "out of 100." Big numbers are hard, so we break the whole into equal blocks — small, easy pieces.\n\nEvery problem today comes with blocks to help you. Do the same 3 steps each time: ${STEPS} Tap the blocks to fill them in, then type the percent.`,
      '3 out of 4. The whole is 4 blocks. 100 ÷ 4 = 25, so 1 block = 25%. You have 3 blocks: 3 × 25 = 75. So 3 out of 4 = 75%.', [
        blocks('1-of-4', '1 out of 4 is what percent?', 1, 4, 'all'),
        blocks('2-of-5', '2 out of 5 is what percent?', 2, 5, 'all'),
        blocks('3-of-10', '3 out of 10 is what percent?', 3, 10, 'all'),
        blocks('2-of-8', '2 out of 8 is what percent?', 2, 8, 'all'),
        blocks('6-of-10', '6 out of 10 is what percent?', 6, 10, 'all'),
      ]),
    codeQuest('codequest'),
  ]),
  wednesday: Day([
    Sheet('finding-the-percent', 'math', 'Finding the Percent',
      `Same 3 steps today — but the blocks show you less. You still see what ONE block is worth; you do the counting and the multiplying.\n\nSome totals are big, like 12. Then a block holds a group: 12 split into 4 blocks means each block holds 3, and 100 ÷ 4 = 25, so each block is 25%. ${STEPS}`,
      '6 out of 12. Split 12 into 4 blocks of 3. 100 ÷ 4 = 25, so 1 block = 25%. 6 is 2 blocks (3 + 3): 2 × 25 = 50. So 6 out of 12 = 50%.', [
        blocks('3-of-5', '3 out of 5 is what percent?', 3, 5, 'unit'),
        blocks('7-of-10', '7 out of 10 is what percent?', 7, 10, 'unit'),
        blocks('4-of-8', '4 out of 8 is what percent?', 4, 8, 'unit'),
        blocks('3-of-12', '3 out of 12 is what percent?', 3, 12, 'unit'),
        blocks('9-of-12', '9 out of 12 is what percent?', 9, 12, 'unit'),
      ]),
    codeQuest('codequest'),
  ]),
  thursday: Day([
    Sheet('finding-the-percent', 'math', 'Finding the Percent',
      `Today the blocks give you only a clue or two. Use them to figure out what ONE block is worth, then count and multiply like always.\n\nBig totals are grouped into blocks: 20 becomes 4 blocks of 5, so each block is 25%. ${STEPS}`,
      '15 out of 20. Group 20 into 4 blocks of 5. 100 ÷ 4 = 25, so 1 block = 25%. 15 is 3 blocks (5 + 5 + 5): 3 × 25 = 75. So 15 out of 20 = 75%.', [
        blocks('10-of-20', '10 out of 20 is what percent?', 10, 20, 'clues'),
        blocks('20-of-25', '20 out of 25 is what percent?', 20, 25, 'clues'),
        blocks('21-of-30', '21 out of 30 is what percent?', 21, 30, 'clues'),
        blocks('5-of-25', '5 out of 25 is what percent?', 5, 25, 'clues'),
      ]),
    Sheet('word-problems', 'word-problems', 'Word Problems',
      'Read the story. The TOTAL is the whole, and the piece you have is the part. Then use the same 3 steps with the blocks.',
      'You hit 6 out of 8 targets. The whole is 8 blocks. 100 ÷ 8 = 12.5, so 1 block = 12.5%. 6 × 12.5 = 75. So you hit 75% of the targets.', [
        blocks('shots', 'Your team made 12 out of 16 shots. What percent?', 12, 16, 'clues'),
        blocks('levels', 'You finished 6 out of 24 levels. What percent?', 6, 24, 'clues'),
      ]),
  ]),
  friday: Day([
    Sheet('finding-the-percent', 'math', 'Finding the Percent',
      `Show what you know! The blocks are here, but with no labels — you work out what ONE block is worth all by yourself. Same 3 steps: ${STEPS}`,
      null, [
        blocks('5-of-20', '5 out of 20 is what percent?', 5, 20, 'none'),
        blocks('17-of-20', '17 out of 20 is what percent?', 17, 20, 'none'),
        blocks('8-of-16', '8 out of 16 is what percent?', 8, 16, 'none'),
        blocks('40-of-50', '40 out of 50 is what percent?', 40, 50, 'none'),
        blocks('21-of-28', '21 out of 28 is what percent?', 21, 28, 'none'),
      ]),
    Sheet('word-problems', 'word-problems', 'Word Problems',
      'Show what you know! Find the whole and the part in each story, then use the blocks.', null, [
        blocks('big-test', 'You got 45 out of 50 on a big test. What percent?', 45, 50, 'none'),
        blocks('soccer', 'Your soccer team wins 9 out of 12 games. What percent?', 9, 12, 'none'),
      ]),
  ]),
}, '2026-09-21');

// ---------------------------------------------------------------------------------------------------------
// Week 12 (Monday 2026-09-28). Planned by Jesse in a separate session and imported here; every answer is
// computed (test/cq-daily-work.test.js re-derives them independently). Docs: daily-work.md §2b.
// ---------------------------------------------------------------------------------------------------------
const usd = (cents) => `$${(cents / 100).toFixed(2)}`;
const times = (id, a, b) => numeric(id, `${a} × ${b} = ?`, a * b);
const yesNo = (id, prompt, answer) => Item(id, 'fill-blank', prompt, { wordBank: ['yes', 'no'], answer: [answer] });
// "Trade ONE $1 bill for coins so you can pay this tithe": a coin builder whose total must be $1.00 (or
// `total`) AND whose coins must be able to make `pay` exactly. The kid sees only the prompt and the tray.
const tithe = (id, prompt, total, pay, model, extra) => coin(id, prompt, total, coins, Object.assign({
  payCents: pay,
  parentNote: `Model answer: ${model}. Any set worth ${usd(total)} that includes coins worth exactly ${usd(pay)} is correct.`,
}, extra));
const titheBuild = (id, earned, pay, model, extra) => tithe(id,
  `You earned ${usd(earned)}. Your tithe is ${usd(pay)}. You trade ONE $1 bill for coins. Build $1.00 in coins so that some of the coins make exactly ${usd(pay)} for your tithe.`,
  100, pay, model, extra);
const note = (id, prompt, parentNote) => Item(id, 'short-text', prompt, { parentNote });
const money = (id, prompt, answer, parentNote) => Item(id, 'numeric', prompt, { answer, parentNote });
const TITHE_STEPS = 'Step 1: find the coins that make your tithe. Step 2: take your tithe away from $1.00 to see what is left. Step 3: make what is left with other coins. Step 4: add all your coins to check they make exactly $1.00. You do not have to mark the tithe coins: just make sure some of your coins add up to your tithe.';

const guided12 = Week('week-12', 'Week 12', [
  Sheet('memory-verse', 'memory-verse', 'Memory Verse', null, null, [
    Item('verse', 'fill-blank', "You must each ___ in your heart how much to give. And don't give reluctantly or in response to pressure. 'For God loves a person who gives ___.'", {
      wordBank: ['decide', 'cheerfully'], answer: ['decide', 'cheerfully'],
    }),
  ], { citation: '2 Corinthians 9:7 (NLT)' }),
], {
  monday: Day([
    Sheet('coins-for-my-tithe', 'math', 'Coins for My Tithe',
      `You trade a $1 bill for coins, and your tithe is a small amount. If you ask for the wrong coins, you can't pay your exact tithe.\n\n${TITHE_STEPS}`,
      "You earned $1.00. Your tithe is $0.10. You trade your $1 bill for coins.\nWrong way: 4 quarters is $1.00, but no quarters make exactly $0.10, so you can't pay your tithe.\nStep 1: $0.10 is 1 dime.\nStep 2: $1.00 − $0.10 = $0.90 left.\nStep 3: make $0.90 with 3 quarters (75) + 2 nickels (10) + 5 pennies (5). 75 + 10 + 5 = 90.\nStep 4: check everything: 1 dime + 3 quarters + 2 nickels + 5 pennies = 10 + 75 + 10 + 5 = 100 cents = $1.00. The dime is the tithe.\n\nMultiplication: 3 × 4 means 3 groups of 4. 4 + 4 + 4 = 12.", [
        titheBuild('tithe-20', 200, 20, '2 dimes + 3 quarters + 1 nickel'),
        titheBuild('tithe-30', 300, 30, '2 quarters + 5 dimes'),
        titheBuild('tithe-40', 400, 40, '3 quarters + 2 dimes + 1 nickel'),
        tithe('tithe-10-new-way', 'You earned $1.00. Your tithe is $0.10. You trade your $1 bill for coins. Build $1.00 in coins that includes exactly $0.10 for your tithe. Use a different set of coins than the worked example.', 100, 10, '2 quarters + 5 dimes'),
        titheBuild('tithe-80', 800, 80, '3 quarters + 2 dimes + 1 nickel'),
        times('x-5-6', 5, 6), times('x-2-9', 2, 9), times('x-3-5', 3, 5),
      ]),
    Sheet('tithe-stories', 'word-problems', 'Tithe Stories',
      'Read the story twice. Circle the money words. Ask yourself: How much did I earn? How much is my tithe? Which coins do I need?',
      "Sam earned $2.00 mowing a lawn. Sam's tithe is $0.20. Sam trades ONE $1 bill for coins. Which coins should Sam ask for so Sam can pay exactly $0.20?\nStep 1: $0.20 is 2 dimes.\nStep 2: $1.00 − $0.20 = $0.80 left.\nStep 3: $0.80 = 3 quarters (75) + 1 nickel (5).\nStep 4: check: 20 + 75 + 5 = 100 cents = $1.00. Sam asks for 2 dimes, 3 quarters and 1 nickel.", [
        tithe('mia', 'Mia earned $6.00 doing chores this week. Her tithe is $0.60. She trades ONE $1 bill for coins. Build $1.00 in coins so she can pay exactly $0.60.', 100, 60, '3 quarters + 2 dimes + 1 nickel'),
        money('leo', 'Leo earned $3.00. His tithe is $0.30. How much money does Leo keep after he pays his tithe?', 2.7, 'Answer: $2.70 ($3.00 − $0.30).'),
        tithe('ava', 'Ava earned $7.00. Her tithe is $0.70. She trades ONE $1 bill for coins. Build $1.00 in coins so she can pay exactly $0.70.', 100, 70, '3 quarters + 2 dimes + 1 nickel'),
        note('kai', 'Kai says, "My tithe on $5.00 is $0.50." Is Kai right? Explain in one sentence.', 'Yes. 10% of $5.00 is $0.50 ($5.00 ÷ 10).'),
      ]),
  ]),
  tuesday: Day([
    Sheet('coins-for-my-tithe-2', 'math', 'Coins for My Tithe, Part 2: When 4 Quarters Work',
      `Same steps as yesterday: tithe coins first, then take the tithe away, then make the rest, then check the total. Watch for something new: sometimes 4 quarters DO work. It only works when the tithe is made of quarters.\n\n${TITHE_STEPS}`,
      "You earned $5.00. Your tithe is $0.50. You trade ONE $1 bill for coins.\nStep 1: $0.50 is 2 quarters.\nStep 2: $1.00 − $0.50 = $0.50 left.\nStep 3: $0.50 = 2 quarters.\nStep 4: check: 4 quarters = 100 cents = $1.00. Two are the tithe. 4 quarters worked this time because the tithe is made of quarters. On Monday the tithe was $0.10, and 4 quarters could not pay it.\n\nMultiplication: 4 × 5 means 4 groups of 5. 5 + 5 + 5 + 5 = 20.", [
        titheBuild('tithe-25', 250, 25, '4 quarters (1 quarter is the tithe)'),
        titheBuild('tithe-15', 150, 15, '3 quarters + 2 dimes + 1 nickel'),
        tithe('tithe-5-half-dollar', 'You earned $0.50 (2 quarters). Your tithe is $0.05. You trade both quarters for coins. Build $0.50 in coins so that some of the coins make exactly $0.05 for your tithe.', 50, 5, '1 quarter + 2 dimes + 1 nickel (the total is $0.50, not $1.00)'),
        titheBuild('tithe-35', 350, 35, '3 quarters + 2 dimes + 1 nickel'),
        titheBuild('tithe-75', 750, 75, '4 quarters (3 quarters are the tithe)'),
        times('x-3-6', 3, 6), times('x-2-8', 2, 8), times('x-3-8', 3, 8),
      ]),
    codeQuest('codequest'),
  ]),
  wednesday: Day([
    Sheet('can-i-pay-my-tithe', 'math', 'Can I Pay My Tithe? Trading Coins',
      "Sometimes your coins can't make your exact tithe. First, list what your coins can make. If your tithe is not on the list, trade one coin for smaller coins that CAN make it. Trading doesn't change how much money you have. It only changes the coins.",
      "You have 3 quarters (75 cents). Your tithe is $0.10. Can you pay it exactly?\nStep 1: what can 3 quarters make? 25 cents, 50 cents, 75 cents.\nStep 2: is 10 cents on that list? No.\nStep 3: trade ONE quarter for coins that include a dime: 1 dime + 3 nickels = 10 + 15 = 25 cents.\nStep 4: now you have 2 quarters, 1 dime and 3 nickels = 50 + 10 + 15 = 75 cents. It is the same money as before.\nStep 5: pay the dime as tithe. You keep 2 quarters + 3 nickels = 50 + 15 = 65 cents. Check: 75 − 10 = 65.\n\nMultiplication: 3 × 7 means 3 groups of 7. 7 + 7 + 7 = 21.", [
        yesNo('four-quarters', 'I have 4 quarters. My tithe is $0.10. Can I pay $0.10 exactly with these coins?', 'no'),
        coin('trade-a-quarter', 'Trade ONE quarter for coins that make $0.25 and include at least one dime. Build $0.25 in coins.', 25, coins, {
          mustHave: { denom: 'dime', min: 1 },
          parentNote: 'Model answer: 1 dime + 3 nickels. Any set worth $0.25 with at least 1 dime is correct (for example 2 dimes + 1 nickel).',
        }),
        yesNo('two-quarters-three-nickels', 'I have 2 quarters and 3 nickels. My tithe is $0.50. Can I pay $0.50 exactly with these coins?', 'yes'),
        yesNo('three-dimes-two-quarters', 'I have 3 dimes and 2 quarters. My tithe is $0.15. Can I pay $0.15 exactly with these coins?', 'no'),
        coin('dime-for-nickels', 'You have 3 dimes and 2 quarters. Trade ONE dime for nickels so you can pay $0.15. Build $0.10 using only nickels.', 10, ['nickel'], {
          parentNote: 'Answer: 2 nickels. Now the coins are 2 dimes, 2 nickels and 2 quarters, and 1 dime + 1 nickel pays the $0.15.',
        }),
        times('x-5-5', 5, 5), times('x-4-6', 4, 6), times('x-2-7', 2, 7),
      ]),
    codeQuest('codequest'),
  ]),
  thursday: Day([
    Sheet('harder-tithes-pennies', 'math', 'Harder Tithes: Pennies Too',
      `Some tithes need pennies. Do the same steps: tithe coins first, then take the tithe away from $1.00, then make the rest, then check the total. Go biggest coin first.\n\n${TITHE_STEPS}`,
      "You earned $5.40. Your tithe is $0.54. You trade ONE $1 bill for coins.\nStep 1: make $0.54. 2 quarters = 50, and 4 more cents = 4 pennies. So the tithe is 2 quarters + 4 pennies.\nStep 2: $1.00 − $0.54 = $0.46 left.\nStep 3: make $0.46. 1 quarter = 25, leaving 21. 2 dimes = 20, leaving 1. 1 penny = 1. So 1 quarter + 2 dimes + 1 penny.\nStep 4: check: 3 quarters + 2 dimes + 5 pennies = 75 + 20 + 5 = 100 cents = $1.00.\n\nMultiplication: 6 × 7 means 6 groups of 7. Count by 7s, six times: 7, 14, 21, 28, 35, 42. So 6 × 7 = 42.", [
        titheBuild('tithe-36', 360, 36, '3 quarters + 2 dimes + 5 pennies'),
        titheBuild('tithe-28', 280, 28, '3 quarters + 2 dimes + 5 pennies'),
        titheBuild('tithe-45', 450, 45, '3 quarters + 2 dimes + 1 nickel'),
        titheBuild('tithe-12', 120, 12, '3 quarters + 2 dimes + 5 pennies'),
        titheBuild('tithe-63', 630, 63, '2 quarters + 4 dimes + 1 nickel + 5 pennies'),
        times('x-8-4', 8, 4), times('x-9-3', 9, 3), times('x-5-8', 5, 8),
      ]),
    Sheet('read-carefully', 'word-problems', 'Read Carefully: Earn, Then Tithe',
      "Read the whole story twice. Underline the money you EARNED. Cross out money you SPENT, because spending doesn't count toward your tithe. Then find your tithe and your coins.",
      "Noah walked two dogs on Saturday. One family paid him $1.50 and the other paid him $1.00. He also bought a $0.75 snack. Noah's tithe is 10% of what he EARNED. What is his tithe?\nStep 1: he earned $1.50 and $1.00. The $0.75 snack was spending, so ignore it.\nStep 2: $1.50 + $1.00 = $2.50 earned.\nStep 3: 10% of $2.50: move the decimal one place left to get $0.25.\nAnswer: $0.25.", [
        money('mia-earned', 'Mia babysat her cousin on Friday. Her aunt paid her $2.00 and gave her a $0.50 tip. Then Mia bought a $0.75 sticker. How much did Mia EARN in all?', 2.5, 'Answer: $2.50 ($2.00 + $0.50). The sticker is spending, so it does not count.'),
        money('luis-tithe', "Luis earned $3.00 raking leaves and $1.00 washing a car. He spent $0.60 on a snack. His tithe is 10% of what he EARNED. How much is Luis's tithe?", 0.4, 'Answer: $0.40. He earned $3.00 + $1.00 = $4.00 (the snack is spending), and 10% of $4.00 is $0.40.'),
        tithe('rosa', 'Rosa earned $1.80 this week. Her tithe is $0.18. She trades ONE $1 bill for coins. Build $1.00 in coins so she can pay exactly $0.18.', 100, 18, '3 quarters + 1 dime + 2 nickels + 5 pennies'),
        note('four-quarters-why', "Explain in one sentence why 4 quarters can't pay a $0.18 tithe.", 'A good answer: quarters are 25 cents each, so 4 quarters can only make 25, 50, 75 or 100 cents, never 18 cents.'),
      ]),
  ]),
  friday: Day([
    Sheet('review-tithe-multiplication', 'math', 'Review: Tithe Coins and Multiplication',
      `Use everything from this week. For the coins: tithe coins first, subtract, make the rest, check. For multiplication: count groups.\n\n${TITHE_STEPS}`,
      "You earned $2.00. Your tithe is $0.20. You trade ONE $1 bill for coins.\nStep 1: $0.20 is 2 dimes.\nStep 2: $1.00 − $0.20 = $0.80.\nStep 3: $0.80 = 3 quarters + 1 nickel = 75 + 5.\nStep 4: check: 20 + 75 + 5 = 100 cents = $1.00.\n\nMultiplication: 6 × 3 means 6 groups of 3. 3 + 3 + 3 + 3 + 3 + 3 = 18.", [
        titheBuild('tithe-16', 160, 16, '3 quarters + 1 dime + 2 nickels + 5 pennies'),
        titheBuild('tithe-32', 320, 32, '3 quarters + 1 dime + 2 nickels + 5 pennies'),
        tithe('tithe-8-eighty', 'You earned $0.80 (3 quarters and 1 nickel). Your tithe is $0.08. You trade all of those coins for other coins. Build $0.80 in coins so that some of the coins make exactly $0.08 for your tithe.', 80, 8, '2 quarters + 2 dimes + 1 nickel + 5 pennies (the total is $0.80, not $1.00)'),
        times('x-5-6', 5, 6), times('x-4-5', 4, 5), times('x-3-7', 3, 7), times('x-8-4', 8, 4),
      ]),
    Sheet('show-what-you-know', 'word-problems', 'Show What You Know',
      'Try these on your own. Read each story twice. Find what was EARNED, find the tithe, then find your coins or your answer.',
      "Sam earned $3.00 and spent $1.00. How much does Sam have left after he pays his $0.30 tithe?\nStep 1: $3.00 − $1.00 = $2.00.\nStep 2: $2.00 − $0.30 = $1.70.\nAnswer: $1.70.", [
        tithe('kai-coins', 'Kai earned $9.00 doing chores. His tithe is $0.90. He trades ONE $1 bill for coins. Build $1.00 in coins so he can pay exactly $0.90.', 100, 90, '3 quarters + 2 dimes + 1 nickel'),
        money('kai-left', 'Kai earned $9.00 and spent $2.00. After he pays his $0.90 tithe, how much does he have left?', 6.1, 'Answer: $6.10. $9.00 − $2.00 = $7.00, then $7.00 − $0.90 = $6.10.'),
        tithe('lena', 'Lena earned $1.40. Her tithe is $0.14. She trades ONE $1 bill for coins. Build $1.00 in coins so she can pay exactly $0.14.', 100, 14, '3 quarters + 2 dimes + 5 pennies'),
        note('how-you-knew', 'Tell how you knew which coins to ask for in the last coin problem.', 'A good answer says he found the tithe coins first, then took the tithe away from $1.00, then made the rest with other coins.'),
      ]),
  ]),
}, '2026-09-28');

// Older son: "what percent is A of B" again, no new skill. The blocks are ONE PER ITEM here (B blocks, each
// worth 100 ÷ B percent, up to 50), and the picture fades: Mon/Tue every block labeled, Wed only what one
// block is worth, Thu closed until he asks ('demand'), Fri no blocks at all.
const wholeBlocks = (id, prompt, part, whole, help) => Item(id, 'numeric', prompt, { answer: (part * 100) / whole, unit: 'percent', part, whole, help, perItem: true });
const plainPercent = (id, prompt, part, whole) => Item(id, 'numeric', prompt, { answer: (part * 100) / whole, part, whole });
const BLOCK_STEPS = 'Count the blocks in total. That is the B number. Work out what ONE block is worth: 100 ÷ B. Then count the blocks you have and multiply.';

const standard12 = Week('week-12', 'Week 12', [
  Sheet('memory-verse', 'memory-verse', 'Memory Verse', null, null, [
    Item('verse', 'fill-blank', 'But those who ___ in the Lord will find new strength. They will soar high on wings like eagles. They will run and not grow ___. They will walk and not faint.', {
      wordBank: ['trust', 'weary'], answer: ['trust', 'weary'],
    }),
  ], { citation: 'Isaiah 40:31 (NLT)' }),
], {
  monday: Day([
    Sheet('what-percent-blocks', 'math', 'What Percent? Watch the Blocks Fill',
      `${BLOCK_STEPS}\n\nShade A blocks and watch the percent grow. Percent = blocks shaded × what one block is worth. Tap the blocks to fill them in, then type the percent.`,
      "3 out of 4: 4 blocks in total. One block = 100 ÷ 4 = 25%. Shade 1 block: 25%. 2 blocks: 50%. 3 blocks: 75%. So 3 out of 4 = 75%.\n\n6 out of 8: 8 blocks in total. One block = 100 ÷ 8 = 12.5%. Shading goes 12.5, 25, 37.5, 50, 62.5, 75. So 6 out of 8 = 75%. Check: 6/8 simplifies to 3/4, which is 75%.\n\n4 out of 5: 5 blocks in total. One block = 100 ÷ 5 = 20%. 4 blocks = 80%.", [
        wholeBlocks('2-of-5', '2 out of 5 is what percent?', 2, 5, 'all'),
        wholeBlocks('7-of-10', '7 out of 10 is what percent?', 7, 10, 'all'),
        wholeBlocks('2-of-8', '2 out of 8 is what percent?', 2, 8, 'all'),
      ]),
    Sheet('percent-stories', 'word-problems', 'Percent Stories: Watch First',
      'Turn the story into "A out of B." Then shade the blocks and read the percent.',
      "You got 9 out of 10 quiz questions right. 10 blocks in total. One block = 10%. Shading 9 blocks goes 10, 20, 30, 40, 50, 60, 70, 80, 90. So 90%.\n\nYour team won 3 out of 4 games. 4 blocks. One block = 25%. Shading 3 blocks goes 25, 50, 75. So 75%.", [
        wholeBlocks('games', 'Your team wins 3 out of 5 games. What percent did it win?', 3, 5, 'all'),
        wholeBlocks('bus', '8 out of 10 kids in your class ride the bus. What percent ride the bus?', 8, 10, 'all'),
        wholeBlocks('homework', 'You finish 4 out of 8 pages of homework. What percent is done?', 4, 8, 'all'),
      ]),
  ]),
  tuesday: Day([
    Sheet('bigger-block-sets', 'math', 'Bigger Block Sets',
      `Same steps as Monday. When there are lots of blocks, the shortcut is 100 ÷ B to find what one block is worth. Then multiply by how many you shaded.\n\n${BLOCK_STEPS}`,
      '12 out of 20: 20 blocks in total. One block = 100 ÷ 20 = 5%. Shading goes 5, 10, 15, and so on up to 12 blocks: 60. So 12 out of 20 = 60%. Check: 12 × 5 = 60.\n\n9 out of 25: 25 blocks in total. One block = 100 ÷ 25 = 4%. 9 × 4 = 36. So 9 out of 25 = 36%.', [
        wholeBlocks('14-of-20', '14 out of 20 is what percent?', 14, 20, 'all'),
        wholeBlocks('3-of-8', '3 out of 8 is what percent?', 3, 8, 'all'),
        wholeBlocks('20-of-25', '20 out of 25 is what percent?', 20, 25, 'all'),
        wholeBlocks('11-of-20', '11 out of 20 is what percent?', 11, 20, 'all'),
      ]),
    codeQuest('codequest'),
  ]),
  wednesday: Day([
    Sheet('fifty-and-eight', 'math', 'Fifty Blocks and Eight Blocks',
      `Same steps again. With 50 blocks, one block is worth 100 ÷ 50 = 2%. With 8 blocks, one block is worth 12.5%.\n\n${BLOCK_STEPS}`,
      '30 out of 50: 50 blocks in total. One block = 100 ÷ 50 = 2%. 30 × 2 = 60. So 30 out of 50 = 60%.\n\n5 out of 8: 8 blocks in total. One block = 12.5%. Shading goes 12.5, 25, 37.5, 50, 62.5. So 5 out of 8 = 62.5%.', [
        wholeBlocks('35-of-50', '35 out of 50 is what percent?', 35, 50, 'unit'),
        wholeBlocks('7-of-8', '7 out of 8 is what percent?', 7, 8, 'unit'),
        wholeBlocks('18-of-20', '18 out of 20 is what percent?', 18, 20, 'unit'),
        wholeBlocks('12-of-25', '12 out of 25 is what percent?', 12, 25, 'unit'),
      ]),
    codeQuest('codequest'),
  ]),
  thursday: Day([
    Sheet('try-it-yourself', 'math', 'Try It Yourself (Blocks If You Need Them)',
      `Try each problem yourself first. If you get stuck, tap "Show me the blocks." The steps are the same: ${BLOCK_STEPS}`,
      '13 out of 20: 20 blocks in total. One block = 5%. 13 × 5 = 65. So 13 out of 20 = 65%.', [
        wholeBlocks('1-of-5', '1 out of 5 is what percent?', 1, 5, 'demand'),
        wholeBlocks('3-of-4', '3 out of 4 is what percent?', 3, 4, 'demand'),
        wholeBlocks('5-of-8', '5 out of 8 is what percent?', 5, 8, 'demand'),
        wholeBlocks('17-of-20', '17 out of 20 is what percent?', 17, 20, 'demand'),
        wholeBlocks('21-of-25', '21 out of 25 is what percent?', 21, 25, 'demand'),
      ]),
    Sheet('real-life-percents', 'word-problems', 'Real-Life Percents',
      'Turn the story into "A out of B," find what one block is worth, then find the percent. Tap "Show me the blocks" if you need them.',
      'Your soccer team wins 6 out of 10 games. 10 blocks in total. One block = 10%. 6 × 10 = 60. So 60%.', [
        wholeBlocks('free-throws', 'In basketball practice you made 6 out of 8 free throws. What percent did you make?', 6, 8, 'demand'),
        wholeBlocks('spelling', 'You got 16 out of 20 spelling words right. What percent is that?', 16, 20, 'demand'),
        wholeBlocks('pizza-survey', 'In a survey, 41 out of 50 students said they like pizza. What percent like pizza?', 41, 50, 'demand'),
      ]),
  ]),
  friday: Day([
    Sheet('independent-check', 'math', 'Independent Check',
      `You know this now. Work each one on your own. No blocks today. ${BLOCK_STEPS}`,
      '3 out of 5: one block = 100 ÷ 5 = 20%. 3 × 20 = 60. So 3 out of 5 = 60%.', [
        plainPercent('4-of-5', '4 out of 5 is what percent?', 4, 5),
        plainPercent('6-of-8', '6 out of 8 is what percent?', 6, 8),
        plainPercent('9-of-10', '9 out of 10 is what percent?', 9, 10),
        plainPercent('15-of-20', '15 out of 20 is what percent?', 15, 20),
        plainPercent('32-of-50', '32 out of 50 is what percent?', 32, 50),
      ]),
    Sheet('show-what-you-know', 'word-problems', 'Show What You Know',
      'Try these on your own. Turn each story into "A out of B" first.',
      'You answered 4 out of 5 questions right. One block = 20%. 4 × 20 = 80. So 80%.', [
        plainPercent('quiz', 'You got 18 out of 25 questions right on a quiz. What percent is that?', 18, 25),
        plainPercent('pizza-slice', 'You ate 1 out of 8 slices of a pizza. What percent of the pizza did you eat?', 1, 8),
        plainPercent('soccer-survey', 'In a survey, 33 out of 50 kids said they like soccer best. What percent is that?', 33, 50),
      ]),
  ]),
}, '2026-09-28');

export const DAILY_WORK = deepFreeze({
  guided: { weeks: { 'week-11': guided, 'week-12': guided12 } },
  standard: { weeks: { 'week-11': standard, 'week-12': standard12 } },
});

export function getWeek(track, weekId) {
  return DAILY_WORK[track]?.weeks?.[weekId] || null;
}
