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

// ---------------------------------------------------------------------------------------------------------
// Week 13 (Monday 2026-10-05). Planned by Jesse in a separate session and handed over as the Drive doc
// "Week 13 plan"; wording, answers and parent notes are copied from it. New this week: a Bible Reading sheet
// every weekday for both boys, a think-first "more or less than half?" line before each older-son percent
// problem, 16- and 40-block sets, and count-the-pile coin items typed in dollars. Docs: daily-work.md §2c.
// ---------------------------------------------------------------------------------------------------------
const BIBLE_HOWTO = (ref) => `Open your own Bible to ${ref} and read it out loud to a grown-up. Reading out loud makes you slow down and notice what is really happening. Then answer the question below in your own words. Using your own words shows that you understood it, so you do not need to copy the verses.`;
// A written answer the grown-up reads (never marked by the app). long-text = a real writing box.
const bibleReading = (ref, prompt, parentNote) => Sheet('bible-reading', 'bible-reading', `Bible Reading: ${ref}`, BIBLE_HOWTO(ref), null, [
  Item('reflect', 'long-text', prompt, { parentNote }),
]);
const codeQuest13 = () => Sheet('codequest', 'codequest', 'CodeQuest Day',
  'Play CodeQuest for 15 to 20 minutes and try to reach a new level. Then answer the three questions below. This is your chance to tell what you noticed, so there is no right or wrong answer.', null, [
    Item('level', 'short-text', 'Which level did you reach today? Type it, like Level 3.', { parentNote: 'The app does not record the level, so any text is fine.' }),
    Item('learned', 'long-text', 'Write 1 or 2 sentences about something you built, solved or learned.', { parentNote: 'Any honest answer is fine.' }),
    Item('tricky', 'scale', "How tricky was today's level? (1 = not tricky, 5 = very tricky)", { scaleMax: 5, parentNote: 'Any number from 1 to 5 is fine.' }),
  ]);

// Younger son. Every parentNote is the plan's "Parent note" column; coin items put the plan's "Answer" column
// (the model coin set) in front so the grown-up sees both on the check-work page.
const withNote = (item, parentNote) => ({ ...item, parentNote });
const build13 = (id, earned, pay, model, note) => coin(id,
  `You earned ${usd(earned)}. Your tithe is ${usd(pay)}. Trade ONE $1 bill for coins. Build $1.00 in coins that can pay exactly ${usd(pay)}.`,
  100, coins, { payCents: pay, parentNote: `Model coins: ${model} (total 1.00). ${note}` });
const storyBuild = (id, prompt, pay, model, note) => coin(id, prompt, 100, coins, { payCents: pay, parentNote: `Model coins: ${model} (total 1.00). ${note}` });
const restricted = (id, prompt, cents, set, model, note) => coin(id, prompt, cents, set, { parentNote: `Model coins: ${model} (total ${(cents / 100).toFixed(2)}). ${note}` });
const mustInclude = (id, prompt, cents, denom, model, note) => coin(id, prompt, cents, coins, { mustHave: { denom, min: 1 }, parentNote: `Model coins: ${model} (total ${(cents / 100).toFixed(2)}). ${note}` });
// Count the pile: the coins are fixed, he types the total in DOLLARS ("1.25"); the stored answer is in cents.
const pile = (id, prompt, counts, cents, note) => CoinItem(id, prompt, null, coins, { pile: counts, answer: cents, parentNote: note });
const yn = (id, prompt, answer, note) => withNote(yesNo(id, prompt, answer), note);
const mult13 = (id, a, b, note) => withNote(times(id, a, b), note);
const num13 = (id, prompt, answer, note) => money(id, prompt, answer, note);

const guided13 = Week('week-13', 'Week 13', [
  Sheet('memory-verse', 'memory-verse', 'Memory Verse', null, null, [
    Item('verse', 'fill-blank', 'In the same way, let your good deeds ___ out for all to see, so that everyone will ___ your heavenly Father.', {
      wordBank: ['shine', 'praise'], answer: ['shine', 'praise'],
    }),
  ], { citation: 'Matthew 5:16 (NLT)' }),
], {
  monday: Day([
    Sheet('tithe-coins-quarters-dimes', 'math', 'Tithe Coins With Quarters and Dimes',
      'A tithe is 10 percent of what you earn. When you trade a dollar bill for coins, you need coins that can make your tithe exactly, and coins that make the rest of the dollar. That is why you build the tithe first. Find the coins for the tithe, take the tithe away from $1.00 to see what is left, then make what is left with other coins. Add all your coins to check that they make exactly $1.00. Quarters and dimes do most of the work today.',
      'You earned $8.50. Your tithe is $0.85. You trade ONE $1 bill for coins.\nStep 1: the tithe $0.85 = 3 quarters + 1 dime (75 + 10).\nStep 2: $1.00 − $0.85 = $0.15 left.\nStep 3: $0.15 = 1 dime + 1 nickel (10 + 5).\nStep 4: check. 3 quarters + 2 dimes + 1 nickel = 75 + 20 + 5 = $1.00.\n\n2 × 5 means 2 groups of 5. 5 + 5 = 10.', [
        build13('build-55', 550, 55, '3 quarters, 2 dimes and 1 nickel', 'Tithe 0.55 = 2 quarters and 1 nickel. The rest is 0.45 = 1 quarter and 2 dimes. Any set that totals 1.00 and can pay 0.55 is correct.'),
        build13('build-65', 650, 65, '2 quarters, 4 dimes and 2 nickels', 'Tithe 0.65 = 2 quarters, 1 dime and 1 nickel. The rest is 0.35 = 3 dimes and 1 nickel. Any set that totals 1.00 and can pay 0.65 is correct.'),
        pile('pile-3q-4d-2n', 'Count this pile of coins. Type the total in dollars, like 0.84: 3 quarters, 4 dimes and 2 nickels.', { quarter: 3, dime: 4, nickel: 2 }, 125, '75 + 40 + 10 = 125 cents = 1.25.'),
        restricted('only-quarters-dimes-70', 'Using ONLY quarters and dimes, build $0.70.', 70, ['dime', 'quarter'], '2 quarters and 2 dimes', 'Check: 2 quarters and 2 dimes = 0.70.'),
        yn('four-quarters-one-dime', 'I have 4 quarters and 1 dime. Can I make exactly $0.40 with only these coins?', 'no', 'No group of these coins makes exactly 0.40.'),
        mult13('x-2-6', 2, 6, '6 + 6 = 12.'), mult13('x-4-4', 4, 4, '4 + 4 + 4 + 4 = 16.'), mult13('x-3-10', 3, 10, '3 × 10 = 30.'),
      ]),
    Sheet('tithe-stories', 'word-problems', 'Tithe Stories',
      'Read the story twice and find the numbers that matter: how much was earned, how much the tithe is, and what the question asks you to find. Some questions ask for the money someone keeps, some ask about coins, and some ask you to explain. That is why reading slowly helps, because one missed number changes the answer. Write each answer where it belongs.',
      'Zoe earned $9.50 this week. Her tithe is $0.95. How much money does Zoe keep?\nStep 1: line up the decimal points.\nStep 2: 9.50 − 0.95 = 8.55.\nAnswer: $8.55.', [
        num13('theo', 'Theo set the table ($0.50), unloaded groceries ($0.75) and helped make dinner ($1.00). How much did Theo earn?', 2.25, '0.50 + 0.75 + 1.00 = 2.25.'),
        num13('owen', 'Owen earned $3.10 this week. His tithe is $0.31. How much money does Owen keep?', 2.79, '3.10 − 0.31 = 2.79.'),
        note('lily', 'Lily says her tithe on $2.90 is $0.29. Is Lily right? Explain in one sentence.', 'A good answer says yes, because a tithe is 10 percent and 10 percent of 2.90 is 0.29.'),
        yn('max', 'Max has 3 quarters and 3 dimes. His tithe is $0.55. Can Max pay exactly $0.55 with these coins?', 'yes', '1 quarter and 3 dimes = 0.55.'),
      ]),
    bibleReading('Genesis 37:1-11', 'Why were the brothers so upset? Write 1 or 2 sentences.', "A good answer says their father loved Joseph more than the rest of them, or that Joseph's dreams said they would bow down to him. Either counts, and so does both."),
  ]),
  tuesday: Day([
    Sheet('building-with-nickels', 'math', 'Building With Nickels',
      'Nickels are worth 5 cents each, so they are great for making amounts that end in 0 or 5. Some problems tell you to use only certain coins, or to include a certain coin. Read that rule first, then build the amount one coin at a time and add as you go. The total has to be exact, so check it at the end.',
      'Using ONLY nickels, build $0.25. Count by 5s: 5, 10, 15, 20, 25. That is 5 nickels, and 5 × 5 = 25.\n\n4 × 4 means 4 groups of 4. 4 + 4 + 4 + 4 = 16.', [
        restricted('only-nickels-30', 'Using ONLY nickels, build $0.30.', 30, ['nickel'], '6 nickels', 'Check: 6 nickels = 0.30.'),
        mustInclude('dime-87', 'Build $0.87 in coins. You must include at least one dime.', 87, 'dime', '3 quarters, 1 dime and 2 pennies', 'Any set worth 0.87 with a dime is correct.'),
        restricted('only-dimes-nickels-55', 'Using ONLY dimes and nickels, build $0.55.', 55, ['nickel', 'dime'], '5 dimes and 1 nickel', 'Check: 5 dimes and 1 nickel = 0.55.'),
        pile('pile-2q-5d-4n', 'Count this pile of coins. Type the total in dollars, like 0.84: 2 quarters, 5 dimes and 4 nickels.', { quarter: 2, dime: 5, nickel: 4 }, 120, '50 + 50 + 20 = 120 cents = 1.20.'),
        yn('two-quarters-three-nickels', 'I have 2 quarters and 3 nickels. Can I make exactly $0.45 with only these coins?', 'no', 'No group of these coins makes exactly 0.45.'),
        mult13('x-3-3', 3, 3, '3 + 3 + 3 = 9.'), mult13('x-4-7', 4, 7, '7 + 7 + 7 + 7 = 28.'), mult13('x-5-10', 5, 10, '5 × 10 = 50.'),
      ]),
    codeQuest13(),
    bibleReading('Genesis 37:12-36', 'What did the brothers do, and how did they act right afterward? Write 1 or 2 sentences.', 'A good answer says they sold Joseph to traders, then showed their father his bloody robe and let him believe an animal had killed him.'),
  ]),
  wednesday: Day([
    Sheet('trading-coins-to-pay-my-tithe', 'math', 'Trading Coins to Pay My Tithe',
      'Sometimes your coins can not make your exact tithe. First list the amounts your coins can make. If your tithe is not on the list, trade one coin for smaller coins that add up to the same amount. Trading does not change how much money you have. It only changes which coins you are holding.',
      'You have 2 quarters and 4 pennies. Your tithe is $0.13. Can you pay it exactly?\nStep 1: these coins can make 1, 2, 3, 4, 25, 26, 27, 28, 29, 50, 51, 52, 53 and 54 cents.\nStep 2: 13 is not on that list, so no.\nStep 3: trade ONE quarter for 2 dimes and 1 nickel (20 + 5 = 25).\nStep 4: now you have 1 quarter, 2 dimes, 1 nickel and 4 pennies = 25 + 20 + 5 + 4 = 54 cents, the same money as before.\nStep 5: pay 1 dime and 3 pennies = 13 cents. You keep 1 quarter, 1 dime, 1 nickel and 1 penny = 41 cents.\n\n4 × 7 means 4 groups of 7. 7 + 7 + 7 + 7 = 28.', [
        yn('quarters-dimes-17', 'I have 3 quarters and 2 dimes. My tithe is $0.17. Can I pay $0.17 exactly with these coins?', 'no', 'No group of these coins makes exactly 0.17.'),
        yn('quarter-dimes-pennies-23', 'I have 1 quarter, 2 dimes and 3 pennies. My tithe is $0.23. Can I pay $0.23 exactly with these coins?', 'yes', '2 dimes and 3 pennies = 0.23.'),
        restricted('dime-for-nickels-pennies', 'Trade ONE dime for smaller coins. Using ONLY nickels and pennies, build $0.10.', 10, ['penny', 'nickel'], '2 nickels', 'Check: 2 nickels = 0.10.'),
        pile('pile-2q-3d-1n-4p', 'Count this pile of coins. Type the total in dollars, like 0.84: 2 quarters, 3 dimes, 1 nickel and 4 pennies.', { quarter: 2, dime: 3, nickel: 1, penny: 4 }, 89, '50 + 30 + 5 + 4 = 89 cents = 0.89.'),
        mustInclude('nickel-57', 'Build $0.57 in coins. You must include at least one nickel.', 57, 'nickel', '2 quarters, 1 nickel and 2 pennies', 'Any set worth 0.57 with a nickel is correct.'),
        mult13('x-5-7', 5, 7, '7 + 7 + 7 + 7 + 7 = 35.'), mult13('x-6-6', 6, 6, '6 + 6 + 6 + 6 + 6 + 6 = 36.'), mult13('x-2-10', 2, 10, '2 × 10 = 20.'),
      ]),
    codeQuest13(),
    bibleReading('Genesis 39:1-6', 'What does it say about God and Joseph? Write 1 or 2 sentences.', "A good answer says the Lord was with Joseph, which is why he did well and why Potiphar's house was blessed."),
  ]),
  thursday: Day([
    Sheet('tithes-with-pennies', 'math', 'Tithes With Pennies',
      'Some tithes need pennies. Do the same steps as before: build the tithe coins first, take the tithe away from $1.00, build the rest, and check that everything adds up to exactly $1.00. Start with the biggest coin that fits, then move to smaller coins. That order keeps you from running out of the right small coins at the end.',
      'You earned $4.10. Your tithe is $0.41. You trade ONE $1 bill for coins.\nStep 1: the tithe $0.41 = 1 quarter + 1 dime + 1 nickel + 1 penny (25 + 10 + 5 + 1).\nStep 2: $1.00 − $0.41 = $0.59 left.\nStep 3: $0.59 = 2 quarters + 1 nickel + 4 pennies (50 + 5 + 4).\nStep 4: check. 3 quarters + 1 dime + 2 nickels + 5 pennies = 75 + 10 + 10 + 5 = $1.00.\n\n6 × 6 means 6 groups of 6. 6 + 6 + 6 + 6 + 6 + 6 = 36.', [
        build13('tithe-23', 230, 23, '3 quarters, 2 dimes and 5 pennies', 'Tithe 0.23 = 2 dimes and 3 pennies. The rest is 0.77 = 3 quarters and 2 pennies. Any set that totals 1.00 and can pay 0.23 is correct.'),
        build13('tithe-37', 370, 37, '3 quarters, 1 dime, 2 nickels and 5 pennies', 'Tithe 0.37 = 1 quarter, 1 dime and 2 pennies. The rest is 0.63 = 2 quarters, 2 nickels and 3 pennies. Any set that totals 1.00 and can pay 0.37 is correct.'),
        build13('tithe-69', 690, 69, '2 quarters, 4 dimes, 1 nickel and 5 pennies', 'Tithe 0.69 = 2 quarters, 1 dime, 1 nickel and 4 pennies. The rest is 0.31 = 3 dimes and 1 penny. Any set that totals 1.00 and can pay 0.69 is correct.'),
        build13('tithe-74', 740, 74, '3 quarters, 2 dimes and 5 pennies', 'Tithe 0.74 = 2 quarters, 2 dimes and 4 pennies. The rest is 0.26 = 1 quarter and 1 penny. Any set that totals 1.00 and can pay 0.74 is correct.'),
        restricted('only-dimes-pennies-62', 'Using ONLY dimes and pennies, build $0.62.', 62, ['penny', 'dime'], '6 dimes and 2 pennies', 'Check: 6 dimes and 2 pennies = 0.62.'),
        mult13('x-4-9', 4, 9, '9 + 9 + 9 + 9 = 36.'), mult13('x-6-10', 6, 10, '6 × 10 = 60.'), mult13('x-5-9', 5, 9, '9 + 9 + 9 + 9 + 9 = 45.'),
      ]),
    Sheet('earned-or-spent', 'word-problems', 'Earned or Spent?',
      'Money words can be tricky. Money you earned counts toward what you earned, but money you spent does not. Read the story twice, underline what was earned, and cross out what was spent. Then add only the amounts that were earned, so your total is right.',
      'Nora raked leaves and earned $2.00, then weeded a garden and earned $1.30. She also spent $0.60 on a snack. Her tithe is 10 percent of what she EARNED.\nStep 1: earned = $2.00 and $1.30. The snack was spending, so ignore it.\nStep 2: 2.00 + 1.30 = 3.30.\nStep 3: 10 percent of $3.30 is $0.33.\nAnswer: the tithe is $0.33.', [
        num13('beni', 'Beni unloaded groceries ($0.75) and cleaned the litter box ($0.50). Then he spent $0.40 on a sticker. How much did Beni earn?', 1.25, '0.75 + 0.50 = 1.25. The sticker is spending, so it is ignored.'),
        num13('dani', "Dani earned $3.00 raking leaves and $1.80 washing a car. She spent $1.10 on a toy. Her tithe is 10 percent of what she EARNED. How much is Dani's tithe?", 0.48, 'Earned: 3.00 + 1.80 = 4.80. The toy is spending, so it is ignored. 10 percent of 4.80 = 0.48.'),
        storyBuild('hugo', 'Hugo earned $1.70. His tithe is $0.17. He trades ONE $1 bill for coins. Build $1.00 in coins so he can pay exactly $0.17.', 17, '3 quarters, 1 dime, 2 nickels and 5 pennies', 'Tithe 0.17 = 1 dime, 1 nickel and 2 pennies. The rest is 0.83 = 3 quarters, 1 nickel and 3 pennies. Any set that totals 1.00 and can pay 0.17 is correct.'),
        note('four-quarters-17', 'In one sentence, explain why 4 quarters can not pay a $0.17 tithe.', 'A good answer says quarters are worth 25 cents each, so 4 quarters only make 25, 50, 75 or 100, never 17.'),
      ]),
    bibleReading('Genesis 39:19-23', "Yesterday you wrote what the Bible says about God and Joseph. Find the same phrase in today's verses and write it here.", "A good answer is 'the Lord was with Joseph'. Their Bible's wording may differ a little."),
  ]),
  friday: Day([
    Sheet('show-what-you-know', 'math', 'Show What You Know',
      'Today uses everything from this week. For coins, build the tithe first, take it away from $1.00, build the rest, and check the total. For multiplication, think of groups and add them up. If you get stuck, go back to the worked example and follow the same steps one at a time.',
      'You earned $6.80. Your tithe is $0.68. You trade ONE $1 bill for coins.\nStep 1: the tithe $0.68 = 2 quarters + 1 dime + 1 nickel + 3 pennies (50 + 10 + 5 + 3).\nStep 2: $1.00 − $0.68 = $0.32 left.\nStep 3: $0.32 = 1 quarter + 1 nickel + 2 pennies (25 + 5 + 2).\nStep 4: check. 3 quarters + 1 dime + 2 nickels + 5 pennies = 75 + 10 + 10 + 5 = $1.00.\n\n4 × 9 means 4 groups of 9. 9 + 9 + 9 + 9 = 36.', [
        build13('tithe-19', 190, 19, '3 quarters, 1 dime, 2 nickels and 5 pennies', 'Tithe 0.19 = 1 dime, 1 nickel and 4 pennies. The rest is 0.81 = 3 quarters, 1 nickel and 1 penny. Any set that totals 1.00 and can pay 0.19 is correct.'),
        build13('tithe-34', 340, 34, '3 quarters, 1 dime, 2 nickels and 5 pennies', 'Tithe 0.34 = 1 quarter, 1 nickel and 4 pennies. The rest is 0.66 = 2 quarters, 1 dime, 1 nickel and 1 penny. Any set that totals 1.00 and can pay 0.34 is correct.'),
        pile('pile-2q-4d-3n-1p', 'Count this pile of coins. Type the total in dollars, like 0.84: 2 quarters, 4 dimes, 3 nickels and 1 penny.', { quarter: 2, dime: 4, nickel: 3, penny: 1 }, 106, '50 + 40 + 15 + 1 = 106 cents = 1.06.'),
        restricted('only-quarters-pennies-78', 'Using ONLY quarters and pennies, build $0.78.', 78, ['penny', 'quarter'], '3 quarters and 3 pennies', 'Check: 3 quarters and 3 pennies = 0.78.'),
        coin('tithe-7-of-70', 'You earned $0.70. Your tithe is $0.07. Build $0.70 in coins that can pay exactly $0.07.', 70, coins, { payCents: 7, parentNote: 'Model coins: 2 quarters, 1 dime, 1 nickel and 5 pennies (total 0.70). Tithe 0.07 = 1 nickel and 2 pennies. The rest is 0.63 = 2 quarters, 1 dime and 3 pennies. Any set that totals 0.70 and can pay 0.07 is correct.' }),
        mult13('x-6-8', 6, 8, '8 + 8 + 8 + 8 + 8 + 8 = 48.'), mult13('x-7-10', 7, 10, '7 × 10 = 70.'), mult13('x-9-10', 9, 10, '9 × 10 = 90.'),
      ]),
    Sheet('tithe-stories-on-your-own', 'word-problems', 'Tithe Stories on Your Own',
      'Read each story twice. Find what was earned and what was spent, then find the tithe or the coins. Take one step at a time and write each answer where it belongs. Working in order keeps the numbers from getting mixed up.',
      'Zara earned $4.20 and spent $1.10. After she pays her $0.42 tithe, how much does she have left?\nStep 1: 4.20 − 1.10 = 3.10.\nStep 2: 3.10 − 0.42 = 2.68.\nAnswer: $2.68.', [
        num13('jonas', 'Jonas earned $5.20 doing chores and spent $1.50. After he pays his $0.52 tithe, how much does he have left?', 3.18, '5.20 − 1.50 = 3.70. 3.70 − 0.52 = 3.18. Two subtractions with decimals; borrowing has been a past struggle.'),
        storyBuild('priya', 'Priya earned $2.60. Her tithe is $0.26. She trades ONE $1 bill for coins. Build $1.00 in coins so she can pay exactly $0.26.', 26, '3 quarters, 2 dimes and 5 pennies', 'Tithe 0.26 = 1 quarter and 1 penny. The rest is 0.74 = 2 quarters, 2 dimes and 4 pennies. Any set that totals 1.00 and can pay 0.26 is correct.'),
        storyBuild('ravi', 'Ravi earned $7.30. His tithe is $0.73. He trades ONE $1 bill for coins. Build $1.00 in coins so he can pay exactly $0.73.', 73, '3 quarters, 2 dimes and 5 pennies', 'Tithe 0.73 = 2 quarters, 2 dimes and 3 pennies. The rest is 0.27 = 1 quarter and 2 pennies. Any set that totals 1.00 and can pay 0.73 is correct.'),
        note('how-you-knew', 'Tell how you knew which coins to ask for in problem 2.', 'A good answer says she found the tithe coins first, took the tithe away from $1.00, then built the rest.'),
      ]),
    bibleReading('Genesis 40:14, then 40:23, then 41:1', 'What did Joseph ask for, and what happened? Write 1 or 2 sentences.', 'A good answer says he asked the cupbearer to remember him and mention him to Pharaoh so he could get out of prison, but the cupbearer forgot him, and two years later Pharaoh had a dream.'),
  ]),
}, '2026-10-05');

// Older son: "what percent is A of B" with blocks, same skill, no new skill. Every Math problem has a think-first
// line ("more or less than half?") before the percent. One block per item; the help fades across the week:
// Mon '1 block = X%' (unit), Tue a few clue labels, Wed bar only (none), Thu closed until he asks, Fri typing.
const half = (part, whole, note) => withNote(Item(`half-${part}-of-${whole}`, 'fill-blank', `Before you work it out: is ${part} out of ${whole} more than half, or less than half?`, {
  wordBank: ['more', 'less'], answer: [part * 2 > whole ? 'more' : 'less'],
}), note);
const pct13 = (id, prompt, part, whole, help, note) => withNote(wholeBlocks(id, prompt, part, whole, help), note);
const typed13 = (id, prompt, part, whole, note) => withNote(plainPercent(id, prompt, part, whole), note);
// A math line pair: the think-first line, then the percent (with the same working the plan gives the parent).
const pair = (part, whole, help, halfText, percentText) => [
  half(part, whole, halfText),
  pct13(`${part}-of-${whole}`, `${part} out of ${whole} is what percent?`, part, whole, help, percentText),
];

const standard13 = Week('week-13', 'Week 13', [
  Sheet('memory-verse', 'memory-verse', 'Memory Verse', null, null, [
    Item('verse', 'fill-blank', "Don't copy the ___ and customs of this world, but let God ___ you into a new person by changing the way you think. Then you will learn to know God's will for you, which is good and ___ and perfect.", {
      wordBank: ['behavior', 'transform', 'pleasing'], answer: ['behavior', 'transform', 'pleasing'],
    }),
  ], { citation: 'Romans 12:2 (NLT)' }),
], {
  monday: Day([
    Sheet('more-or-less-then-percent', 'math', 'More or Less Than Half? Then the Percent',
      "Before you do any math, make a guess. The 50% mark is half of the blocks. If you shade fewer than half of the blocks, the percent will be under 50, and if you shade more than half, it will be over 50. Then find the exact percent. All the blocks together make 100%, so one block is worth 100 divided by the total number of blocks, and the percent is the number of shaded blocks times what one block is worth. Your guess is a check: if your answer does not match your guess, look at your counting again.",
      '7 out of 20. Guess: half of 20 is 10, and 7 is less than 10, so the answer should be less than 50. One block is 100 ÷ 20 = 5. 7 × 5 = 35. Answer: 35.\n\n11 out of 16. Guess: half of 16 is 8, and 11 is more than 8, so the answer should be more than 50. One block is 100 ÷ 16 = 6.25. 11 × 6.25 = 68.75. Answer: 68.75.', [
        ...pair(3, 10, 'unit', 'Half of 10 is 5. 3 is less than 5, so the answer is less than 50.', '100 ÷ 10 = 10 per block. 3 × 10 = 30.'),
        ...pair(19, 20, 'unit', 'Half of 20 is 10. 19 is more than 10, so the answer is more than 50.', '100 ÷ 20 = 5 per block. 19 × 5 = 95.'),
        ...pair(5, 16, 'unit', 'Half of 16 is 8. 5 is less than 8, so the answer is less than 50.', '100 ÷ 16 = 6.25 per block. 5 × 6.25 = 31.25.'),
        ...pair(16, 25, 'unit', 'Half of 25 is 12.5. 16 is more than 12.5, so the answer is more than 50.', '100 ÷ 25 = 4 per block. 16 × 4 = 64.'),
      ]),
    Sheet('percent-stories', 'word-problems', 'Percent Stories',
      "A story can hide an 'A out of B' inside it. The total is the B, and the part you are asked about is the A. Turn the story into A out of B, make a guess about whether it is more or less than half, then find what one block is worth by dividing 100 by B and multiply by A. This works because all the blocks together are the whole, which is 100%.",
      'A bag has 20 beads and 8 are red. 8 out of 20. Guess: half of 20 is 10, and 8 is less than 10, so the answer should be less than 50. One block is 100 ÷ 20 = 5. 8 × 5 = 40. Answer: 40.', [
        pct13('free-throws', 'You made 4 out of 10 free throws in a game. What percent did you make?', 4, 10, 'unit', '100 ÷ 10 = 10 per block. 4 × 10 = 40.'),
        pct13('library-card', 'A class has 25 kids, and 19 of them have a library card. What percent have a library card?', 19, 25, 'unit', '100 ÷ 25 = 4 per block. 19 × 4 = 76.'),
        pct13('puzzle', 'A puzzle has 16 pieces, and you have put in 13 of them. What percent of the puzzle is done?', 13, 16, 'unit', '100 ÷ 16 = 6.25 per block. 13 × 6.25 = 81.25.'),
      ]),
    bibleReading('Genesis 37:1-11', 'Why were the brothers so upset? Write 2 sentences.', "A good answer says their father loved Joseph more than the rest of them, or that Joseph's dreams said they would bow down to him. Either counts, and so does both."),
  ]),
  tuesday: Day([
    Sheet('bigger-block-sets', 'math', 'Bigger Block Sets',
      'Today the picture labels only a block or two, so you do the counting and the multiplying yourself. With 16 blocks each block is worth 100 ÷ 16 = 6.25, and with 40 blocks each block is worth 100 ÷ 40 = 2.5. Percents can have decimals, because the blocks do not always split into whole numbers. Make your guess first by comparing the shaded blocks to half of the total, then multiply the shaded blocks by what one block is worth.',
      '9 out of 16. Guess: half of 16 is 8, and 9 is more than 8, so the answer should be more than 50. One block is 100 ÷ 16 = 6.25. 9 × 6.25 = 56.25. Answer: 56.25.\n\n9 out of 40. Guess: half of 40 is 20, and 9 is less than 20, so the answer should be less than 50. One block is 100 ÷ 40 = 2.5. 9 × 2.5 = 22.5. Answer: 22.5.', [
        ...pair(15, 16, 'clues', 'Half of 16 is 8. 15 is more than 8, so the answer is more than 50.', '100 ÷ 16 = 6.25 per block. 15 × 6.25 = 93.75.'),
        ...pair(7, 25, 'clues', 'Half of 25 is 12.5. 7 is less than 12.5, so the answer is less than 50.', '100 ÷ 25 = 4 per block. 7 × 4 = 28.'),
        ...pair(22, 40, 'clues', 'Half of 40 is 20. 22 is more than 20, so the answer is more than 50.', '100 ÷ 40 = 2.5 per block. 22 × 2.5 = 55.'),
        ...pair(14, 40, 'clues', 'Half of 40 is 20. 14 is less than 20, so the answer is less than 50.', '100 ÷ 40 = 2.5 per block. 14 × 2.5 = 35.'),
      ]),
    codeQuest13(),
    bibleReading('Genesis 37:12-36', 'What did the brothers do, and how did they act right afterward? Write 2 sentences.', 'A good answer says they sold Joseph to traders, then showed their father his bloody robe and let him believe an animal had killed him.'),
  ]),
  wednesday: Day([
    Sheet('just-the-bar', 'math', 'Just the Bar',
      'Today there are no labels at all, only the bar, so you work out what one block is worth yourself: divide 100 by the total number of blocks. Then multiply by the number of shaded blocks. Your guess still helps, because half of the total is the 50% mark, so you can tell right away whether your answer should be over or under 50. Decimals are fine, because some block sets do not split into whole numbers.',
      '27 out of 40. Guess: half of 40 is 20, and 27 is more than 20, so the answer should be more than 50. One block is 100 ÷ 40 = 2.5. 27 × 2.5 = 67.5. Answer: 67.5.\n\n6 out of 16. Guess: half of 16 is 8, and 6 is less than 8, so the answer should be less than 50. One block is 100 ÷ 16 = 6.25. 6 × 6.25 = 37.5. Answer: 37.5.', [
        ...pair(31, 40, 'none', 'Half of 40 is 20. 31 is more than 20, so the answer is more than 50.', '100 ÷ 40 = 2.5 per block. 31 × 2.5 = 77.5.'),
        ...pair(7, 16, 'none', 'Half of 16 is 8. 7 is less than 8, so the answer is less than 50.', '100 ÷ 16 = 6.25 per block. 7 × 6.25 = 43.75.'),
        ...pair(47, 50, 'none', 'Half of 50 is 25. 47 is more than 25, so the answer is more than 50.', '100 ÷ 50 = 2 per block. 47 × 2 = 94.'),
        ...pair(4, 20, 'none', 'Half of 20 is 10. 4 is less than 10, so the answer is less than 50.', '100 ÷ 20 = 5 per block. 4 × 5 = 20.'),
      ]),
    codeQuest13(),
    bibleReading('Genesis 39:1-6', 'What does it say about God and Joseph? Write 2 sentences.', "A good answer says the Lord was with Joseph, which is why he did well and why Potiphar's house was blessed."),
  ]),
  thursday: Day([
    Sheet('try-it-first', 'math', 'Try It First, Blocks If You Need Them',
      "Try each problem on your own first. If you get stuck, tap 'Show me the blocks' to see them. The blocks do not change the rule, they only let you see why it works. The steps are the same every time: guess more or less than half, divide 100 by the total to find what one block is worth, then multiply by the number you have.",
      '17 out of 40. Guess: half of 40 is 20, and 17 is less than 20, so the answer should be less than 50. One block is 100 ÷ 40 = 2.5. 17 × 2.5 = 42.5. Answer: 42.5.', [
        ...pair(23, 25, 'demand', 'Half of 25 is 12.5. 23 is more than 12.5, so the answer is more than 50.', '100 ÷ 25 = 4 per block. 23 × 4 = 92.'),
        ...pair(1, 16, 'demand', 'Half of 16 is 8. 1 is less than 8, so the answer is less than 50.', '100 ÷ 16 = 6.25 per block. 1 × 6.25 = 6.25.'),
        ...pair(18, 40, 'demand', 'Half of 40 is 20. 18 is less than 20, so the answer is less than 50.', '100 ÷ 40 = 2.5 per block. 18 × 2.5 = 45.'),
        ...pair(37, 50, 'demand', 'Half of 50 is 25. 37 is more than 25, so the answer is more than 50.', '100 ÷ 50 = 2 per block. 37 × 2 = 74.'),
      ]),
    Sheet('percents-in-real-life', 'word-problems', 'Percents in Real Life',
      "Real life is full of 'A out of B' numbers, like survey results and game scores. Find the total (B) and the part (A), guess whether it is more or less than half, divide 100 by B to get what one block is worth, then multiply by A. The blocks are hidden until you tap for them, so try it without them first.",
      'In a survey of 50 people, 11 chose tacos. 11 out of 50. Guess: half of 50 is 25, and 11 is less than 25, so the answer should be less than 50. One block is 100 ÷ 50 = 2. 11 × 2 = 22. Answer: 22.', [
        pct13('pizza-day', 'Your class has 25 kids and 17 of them voted for pizza day. What percent voted for pizza day?', 17, 25, 'demand', '100 ÷ 25 = 4 per block. 17 × 4 = 68.'),
        pct13('marbles', 'A bag has 20 marbles and 5 of them are green. What percent are green?', 5, 20, 'demand', '100 ÷ 20 = 5 per block. 5 × 5 = 25.'),
        pct13('soccer-survey', 'A survey asked 40 students, and 26 said they like soccer best. What percent like soccer best?', 26, 40, 'demand', '100 ÷ 40 = 2.5 per block. 26 × 2.5 = 65.'),
      ]),
    bibleReading('Genesis 39:19-23', "Yesterday you wrote what the Bible says about God and Joseph. Find the same phrase in today's verses and write it here.", "A good answer is 'the Lord was with Joseph'. Their Bible's wording may differ a little."),
  ]),
  friday: Day([
    Sheet('show-what-you-know', 'math', 'Show What You Know',
      'No blocks today. You know the steps now, so do them in your head or on the page: guess more or less than half, divide 100 by the total to find what one block is worth, then multiply by the number you have. Check your answer against your guess before you move on.',
      '8 out of 25. Guess: half of 25 is 12.5, and 8 is less than 12.5, so the answer should be less than 50. One block is 100 ÷ 25 = 4. 8 × 4 = 32. Answer: 32.', [
        half(3, 25, 'Half of 25 is 12.5. 3 is less than 12.5, so the answer is less than 50.'), typed13('3-of-25', '3 out of 25 is what percent?', 3, 25, '100 ÷ 25 = 4 per block. 3 × 4 = 12.'),
        half(29, 40, 'Half of 40 is 20. 29 is more than 20, so the answer is more than 50.'), typed13('29-of-40', '29 out of 40 is what percent?', 29, 40, '100 ÷ 40 = 2.5 per block. 29 × 2.5 = 72.5.'),
        half(2, 16, 'Half of 16 is 8. 2 is less than 8, so the answer is less than 50.'), typed13('2-of-16', '2 out of 16 is what percent?', 2, 16, '100 ÷ 16 = 6.25 per block. 2 × 6.25 = 12.5.'),
        half(31, 50, 'Half of 50 is 25. 31 is more than 25, so the answer is more than 50.'), typed13('31-of-50', '31 out of 50 is what percent?', 31, 50, '100 ÷ 50 = 2 per block. 31 × 2 = 62.'),
      ]),
    Sheet('percent-stories-on-your-own', 'word-problems', 'Percent Stories on Your Own',
      "Read each story twice and turn it into 'A out of B'. Then guess more or less than half, find what one block is worth by dividing 100 by B, and multiply by A. There are no blocks today because you already know why the steps work.",
      'You finished 6 out of 40 pages of a comic book. 6 out of 40. Guess: half of 40 is 20, and 6 is less than 20, so the answer should be less than 50. One block is 100 ÷ 40 = 2.5. 6 × 2.5 = 15. Answer: 15.', [
        typed13('video-game', 'A video game has 40 levels and you have beaten 21 of them. What percent of the levels have you beaten?', 21, 40, '100 ÷ 40 = 2.5 per block. 21 × 2.5 = 52.5.'),
        typed13('crayons', 'A box has 16 crayons and 4 of them are broken. What percent are broken?', 4, 16, '100 ÷ 16 = 6.25 per block. 4 × 6.25 = 25.'),
        typed13('math-survey', 'In a survey of 50 kids, 24 said they like math best. What percent like math best?', 24, 50, '100 ÷ 50 = 2 per block. 24 × 2 = 48.'),
        note('how-you-knew', 'Tell how you knew whether problem 1 was more than half or less than half.', 'A good answer compares the number shaded with half of the total, for example 21 is more than half of 40, which is 20.'),
      ]),
    bibleReading('Genesis 40:14, then 40:23, then 41:1', 'What did Joseph ask for, and what happened? Write 2 sentences.', 'A good answer says he asked the cupbearer to remember him and mention him to Pharaoh so he could get out of prison, but the cupbearer forgot him, and two years later Pharaoh had a dream.'),
  ]),
}, '2026-10-05');

// ---------------------------------------------------------------------------------------------------------
// Week 14 (Monday 2026-10-12). Planned by Jesse in a separate session and handed over as the Drive docs
// "Week 14 plan" and "Week 14 Bible reading (updated)"; wording, answers and parent notes are copied from them.
// New this week: multiple-choice Bible Reading (Mon, Tue, Thu), decimal multiplication for the older son
// (stepped lines 1a, 1b, 1c are separate items), percent as "out of 100" and choosing the operation for the
// younger son. Docs: daily-work.md §2d.
// ---------------------------------------------------------------------------------------------------------
// A multiple-choice item: `choices` are the option texts in display order (letters are implied by position),
// `answer` is the correct LETTER. The grown-up sees the letter and the note; the kid sees neither.
const choice = (id, prompt, choices, answer, parentNote) => Item(id, 'multiple-choice', prompt, { choices, answer, parentNote });
const BIBLE_CHOICE_HOWTO = (ref) => `Open your own Bible to ${ref} and read it out loud to a grown-up. Reading out loud makes you slow down and notice what is really happening. Then answer the three questions below by picking the best answer for each one. If you are not sure, go back to your Bible and look again.`;
const bibleChoice = (ref, items) => Sheet('bible-reading', 'bible-reading', `Bible Reading: ${ref}`, BIBLE_CHOICE_HOWTO(ref), null, items);
// A fill-in-the-word line (word bank = exactly the words that are answers on that sheet).
const pick14 = (id, prompt, bank, answer, parentNote) => Item(id, 'fill-blank', prompt, { wordBank: bank, answer: [answer], parentNote });
const BIGGER_SMALLER = ['bigger', 'smaller'];
const dollarPercent = ' Type the number, like 10.';

const BIBLE14 = {
  monday: {
    ref: 'Exodus 1:1-22',
    items: () => [
      choice('q1', 'Why did the new king of Egypt make the Israelites work as slaves?', [
        'He was afraid there were so many of them that they might join his enemies in a war',
        "They had broken the king's laws, so he made them work as a punishment for their crimes",
        'They had refused to pay their taxes, so he took away their land and made them work',
      ], 'A', 'Exodus 1:9-10. The king said the Israelites were too many, and that they might join his enemies if a war broke out.'),
      choice('q2', 'What did the midwives do when the king told them to kill the Hebrew baby boys?', [
        'They did what the king said, because they were afraid of him',
        'They quit their jobs because they were afraid of the king',
        'They let the baby boys live because they feared God',
      ], 'C', 'Exodus 1:15-21. The midwives feared God and did not do what the king said, so the boys lived.'),
      choice('q3', 'At the end of the chapter, what did the king order his people to do to the Hebrew baby boys?', [
        'Send them away to another country',
        'Throw them into the Nile River',
        'Put them to work in the palace',
      ], 'B', 'Exodus 1:22. Every Hebrew baby boy was to be thrown into the Nile.'),
    ],
  },
  tuesday: {
    ref: 'Exodus 2:1-25',
    items: () => [
      choice('q1', "How did Moses' mother keep her baby safe?", [
        'She gave him to a family of traders who were traveling to another country far away',
        'She put him in a basket among the reeds on the Nile, and his sister watched over him',
        "She hid him inside the king's palace, where the servants helped to take care of him",
      ], 'B', "Exodus 2:2-4. She hid him for three months, then put him in a basket in the reeds on the Nile while his sister watched. Pharaoh's daughter found him and took him in."),
      choice('q2', 'Why did Moses run away from Egypt when he grew up?', [
        'He was tired of living in the palace, so he decided to leave and see the world',
        'The Israelites were angry at him and asked him to leave Egypt',
        'He killed an Egyptian who was beating a Hebrew, and Pharaoh found out',
      ], 'C', 'Exodus 2:11-15. Moses killed the Egyptian, and when Pharaoh found out he ran away to Midian.'),
      choice('q3', 'At the end of the chapter, the Israelites cried out because of their slavery. What did God do?', [
        'He heard them, and He cared about them',
        'He sent a flood to wash away the Egyptians',
        'He waited for them to stop crying',
      ], 'A', 'Exodus 2:23-25. God heard their groaning and was concerned about them.'),
    ],
  },
  thursday: {
    ref: 'Exodus 4:1-23, then 4:27-31',
    items: () => [
      choice('q1', 'Moses was afraid the people would not believe that God sent him. What did God give Moses to show them?', [
        'A sword and a shield, so that he could fight the soldiers of Egypt',
        'A letter from Pharaoh that said the people must obey Moses',
        'Signs: his staff turned into a snake, and his hand turned white',
      ], 'C', 'Exodus 4:1-9. God gave Moses signs, including the staff that became a snake and the hand that turned white.'),
      choice('q2', 'Moses said, "I am not a good speaker." How did God answer?', [
        '"Then you can stay home, and I will send an angel to speak to Pharaoh for you."',
        "He said He made the mouth and would help Moses speak, and He sent Moses' brother Aaron too",
        'He changed His mind and picked a better speaker to go to Pharaoh instead of Moses',
      ], 'B', 'Exodus 4:10-16. God said He would help Moses speak, and Aaron would speak for him.'),
      choice('q3', 'At the end of the reading, Aaron showed the people the signs. What did the people do?', [
        'They believed, and they bowed down and worshiped God',
        'They laughed at Moses and Aaron and told them to go back home',
        'They ran away because they were afraid of the snake',
      ], 'A', 'Exodus 4:29-31. The people believed, and when they heard that God cared about them, they bowed down and worshiped.'),
    ],
  },
};
const bible14Choice = (day) => bibleChoice(BIBLE14[day].ref, BIBLE14[day].items());
const bible14Wed = (sentences) => bibleReading('Exodus 3:1-22', `What strange thing did Moses see on the mountain, and what did God promise him when Moses asked, "Who am I to do this?" ${sentences}`, 'A good answer says Moses saw a bush on fire that did not burn up. When Moses asked who he was to do this, God promised, "I will be with you" (Exodus 3:12). It may also say God was sending Moses to Pharaoh to bring the Israelites out of Egypt.');
const bible14Fri = (sentences) => bibleReading('Exodus 5:1-23', `What happened when Moses asked Pharaoh to let the people go, and how did the Israelites feel about Moses afterward? ${sentences}`, 'A good answer says Pharaoh said no and made the work harder (no straw, but the same number of bricks), and the Israelite foremen blamed Moses and Aaron. There is no happy ending yet. That is on purpose, and it is the cliffhanger for next week.');

const guided14 = Week('week-14', 'Week 14', [
  Sheet('memory-verse', 'memory-verse', 'Memory Verse', null, null, [
    Item('verse', 'fill-blank', "Make allowance for each other's ___, and forgive anyone who offends you. Remember, the Lord ___ you, so you must forgive others.", {
      wordBank: ['faults', 'forgave'], answer: ['faults', 'forgave'],
    }),
  ], { citation: 'Colossians 3:13 (NLT)' }),
], {
  monday: Day([
    Sheet('percent-means-out-of-100', 'math', 'Percent Means Out of 100',
      "Percent means 'out of 100.' The sign for it is %. A dollar is 100 cents, so cents are a perfect way to see percent. One penny is 1 cent out of 100 cents, so it is 1 percent of a dollar. A dime is 10 cents out of 100, so it is 10 percent of a dollar. To find the percent of a dollar, count the cents. The number of cents is the percent.",
      '1 dime. A dime is 10 cents. A dollar is 100 cents. 10 out of 100 is 10 percent. Answer: 10%.\n\n1 dime and 3 pennies. 10 + 3 = 13 cents. 13 out of 100 is 13 percent. Answer: 13%.\n\n2 × 5 means 2 groups of 5. 5 + 5 = 10.', [
        money('1', `What percent of a dollar is 1 quarter?${dollarPercent}`, 25, '25 cents. 25 out of 100 = 25%.'),
        money('2', `What percent of a dollar is 3 dimes?${dollarPercent}`, 30, '30 cents. 30 out of 100 = 30%.'),
        money('3', `What percent of a dollar is 2 quarters?${dollarPercent}`, 50, '50 cents. 50 out of 100 = 50%.'),
        money('4', `What percent of a dollar is 1 quarter and 2 nickels?${dollarPercent}`, 35, '25 + 10 = 35 cents. 35 out of 100 = 35%.'),
        money('5', `What percent of a dollar is 4 dimes and 2 pennies?${dollarPercent}`, 42, '40 + 2 = 42 cents. 42 out of 100 = 42%.'),
        money('6', '2 × 3 = ?', 6, '3 + 3 = 6.'),
        money('7', '2 × 4 = ?', 8, '4 + 4 = 8.'),
      ]),
    Sheet('percent-stories', 'word-problems', 'Percent Stories',
      'In a story, find how many cents there are. A dollar is 100 cents, so the number of cents is the percent of a dollar. Read the story slowly and find the coins. Add the coins to find the cents, then write that number as the percent.',
      'Eli has 40 cents. A dollar is 100 cents. What percent of a dollar does Eli have? 40 out of 100 is 40 percent. Answer: 40%.', [
        money('1', `Sofia has 65 cents. What percent of a dollar does Sofia have?${dollarPercent}`, 65, '65 out of 100 = 65%.'),
        money('2', `Omar has 3 quarters. What percent of a dollar does Omar have?${dollarPercent}`, 75, '75 cents. 75 out of 100 = 75%.'),
        money('3', `Tina has 2 dimes and 3 pennies. What percent of a dollar does Tina have?${dollarPercent}`, 23, '20 + 3 = 23 cents. 23%.'),
        pick14('4', 'Ben says that 50 cents is 50 percent of a dollar. Is Ben right?', ['yes', 'no'], 'yes', '50 out of 100 = 50%.'),
      ]),
    bible14Choice('monday'),
  ]),
  tuesday: Day([
    Sheet('your-jars-are-percents-too', 'math', 'Your Jars Are Percents Too',
      'You already know that percent means out of 100. Your money jars are percents too. Give is 10 percent, Save is 20 percent, and Spend is 70 percent. Add them: 10 + 20 + 70 = 100, so the three jars together make the whole 100 percent. If you earn $1.00, which is 100 cents, then Give is 10 cents, Save is 20 cents and Spend is 70 cents.',
      '1 dime. A dime is 10 cents. A dollar is 100 cents. 10 out of 100 is 10 percent. Answer: 10%.\n\nYour Give jar has $0.10 out of $1.00. 10 cents out of 100 cents is 10 percent. Give is 10%.\n\n2 × 6 means 2 groups of 6. 6 + 6 = 12.', [
        money('1', `What percent of a dollar is 2 dimes and 1 nickel?${dollarPercent}`, 25, '20 + 5 = 25 cents. 25 out of 100 = 25%.'),
        money('2', `What percent of a dollar is 1 quarter and 3 pennies?${dollarPercent}`, 28, '25 + 3 = 28 cents. 28 out of 100 = 28%.'),
        money('3', `Your Save jar is $0.20 out of $1.00. What percent is that?${dollarPercent}`, 20, '20 out of 100 = 20%.'),
        money('4', `Your Spend jar is $0.70 out of $1.00. What percent is that?${dollarPercent}`, 70, '70 out of 100 = 70%.'),
        money('5', `Give is 10 percent and Save is 20 percent. What percent is left for Spend?${dollarPercent}`, 70, '100 − 10 − 20 = 70.'),
        money('6', '2 × 4 = ?', 8, '4 + 4 = 8.'),
        money('7', '4 × 10 = ?', 40, '4 × 10 = 40.'),
      ]),
    codeQuest13(),
    bible14Choice('tuesday'),
  ]),
  wednesday: Day([
    Sheet('add-or-subtract', 'math', 'Add or Subtract?',
      "A word problem hides an operation, and clue words help you find it. 'In all,' 'altogether,' 'total' and 'gets more' usually mean ADD, because you are putting amounts together. 'Left,' 'fewer,' 'gave away,' 'spent' and 'change' usually mean SUBTRACT, because you are taking an amount away. Read the problem, circle the clue words with your pen, choose add or subtract, and then solve.",
      "1 dime. A dime is 10 cents. A dollar is 100 cents. 10 out of 100 is 10 percent. Answer: 10%.\n\nJin has 12 marbles. He gets 5 more. How many marbles does he have in all? Clue: 'gets more' and 'in all' mean putting together, so ADD. 12 + 5 = 17.\n\nJin has 17 marbles. He gives away 6. How many are left? Clue: 'gives away' and 'left' mean taking away, so SUBTRACT. 17 − 6 = 11.\n\n3 × 10 means 3 groups of 10. Count by 10s: 10, 20, 30. 3 × 10 = 30.", [
        money('1', `What percent of a dollar is 1 quarter and 4 pennies?${dollarPercent}`, 29, '25 + 4 = 29 cents. 29 out of 100 = 29%.'),
        pick14('2', 'Lucia has 14 stickers. Her friend gives her 8 more. How many stickers does Lucia have in all? Which operation do you use?', ['add', 'subtract'], 'add', "'More' and 'in all' mean putting together."),
        money('3', 'Solve it. How many stickers does Lucia have in all?', 22, '14 + 8 = 22.'),
        pick14('4', 'Noel has 25 cents. He spends 9 cents. How many cents are left? Which operation do you use?', ['add', 'subtract'], 'subtract', "'Spends' and 'left' mean taking away."),
        money('5', 'Solve it. How many cents are left?', 16, '25 − 9 = 16.'),
        money('6', '4 × 7 = ?', 28, '7 + 7 + 7 + 7 = 28. INTENTIONAL REPEAT (Week 13): he needs to see facts more than once.'),
        money('7', '5 × 7 = ?', 35, '7 + 7 + 7 + 7 + 7 = 35. INTENTIONAL REPEAT (Week 13): he needs to see facts more than once.'),
        money('8', '6 × 6 = ?', 36, '6 + 6 + 6 + 6 + 6 + 6 = 36. INTENTIONAL REPEAT (Week 13): he needs to see facts more than once.'),
      ]),
    codeQuest13(),
    bible14Wed('Write 1 or 2 sentences.'),
  ]),
  thursday: Day([
    Sheet('add-subtract-or-multiply', 'math', 'Add, Subtract, or Multiply?',
      "Some problems have groups that are all the same size. The clue words are 'each,' 'every,' 'groups of' and 'rows of.' When you see equal groups and you want the total, you MULTIPLY. Multiplying is a quick way to add the same number again and again. 4 groups of 3 is 3 + 3 + 3 + 3, which is 4 × 3. If the amounts are different sizes and you put them together, ADD. If you take something away, SUBTRACT. Read the problem, look for equal groups, and choose.",
      "1 dime. A dime is 10 cents. A dollar is 100 cents. 10 out of 100 is 10 percent. Answer: 10%.\n\nJin has 12 marbles. He gets 5 more. How many in all? Clue: 'gets more' means putting together, so ADD. 12 + 5 = 17.\n\nThere are 2 boxes with 3 crayons in each box. How many crayons in all? Clue: 'in each box' means equal groups, so MULTIPLY. 2 × 3 = 6, because 3 + 3 = 6.\n\n4 × 7 means 4 groups of 7. 7 + 7 + 7 + 7 = 28.", [
        money('1', `What percent of a dollar is 3 dimes and 6 pennies?${dollarPercent}`, 36, '30 + 6 = 36 cents. 36 out of 100 = 36%.'),
        pick14('2', 'Mara has 30 cents and finds 15 more cents. Which operation tells how many cents she has in all?', ['add', 'multiply'], 'add', "'Finds more' and 'in all' mean putting together."),
        pick14('3', 'There are 2 bags with 4 oranges in each bag. Which operation tells how many oranges in all?', ['add', 'multiply'], 'multiply', "'In each bag' means equal groups."),
        money('4', 'Solve it. How many oranges in all?', 8, '2 × 4 = 8.'),
        pick14('5', 'There are 4 packs with 10 stickers in each pack. Which operation tells how many stickers in all?', ['add', 'multiply'], 'multiply', "'In each pack' means equal groups."),
        money('6', 'Solve it. How many stickers in all?', 40, '4 × 10 = 40.'),
        money('7', '4 × 9 = ?', 36, '9 + 9 + 9 + 9 = 36. INTENTIONAL REPEAT (Week 13): he needs to see facts more than once.'),
        money('8', '5 × 9 = ?', 45, '9 + 9 + 9 + 9 + 9 = 45. INTENTIONAL REPEAT (Week 13): he needs to see facts more than once.'),
      ]),
    Sheet('which-operation-stories', 'word-problems', 'Which Operation? Stories',
      'Read the story twice and look for clue words. If amounts are put together, add. If something is taken away or you find how many are left, subtract. If there are equal groups, multiply. Choose the operation first, then solve.',
      "A tray holds 2 rows of 5 cookies. How many cookies are on the tray? Clue: 'rows of' means equal groups, so MULTIPLY. 2 × 5 = 10, because 5 + 5 = 10. Answer: 10 cookies.", [
        pick14('1', 'Kofi has 18 cents. He finds 7 more cents. Which operation tells how many cents Kofi has in all?', ['add', 'subtract', 'multiply'], 'add', "'Finds more' and 'in all' mean putting together."),
        money('2', 'Solve it. How many cents does Kofi have in all?', 25, '18 + 7 = 25.'),
        pick14('3', 'There are 4 plates with 2 cookies on each plate. Which operation tells how many cookies in all?', ['add', 'subtract', 'multiply'], 'multiply', "'On each plate' means equal groups."),
        money('4', 'Solve it. How many cookies in all?', 8, '4 × 2 = 8.'),
        pick14('5', 'Dina had 20 stickers. She gave away 8. Which operation tells how many are left?', ['add', 'subtract', 'multiply'], 'subtract', "'Gave away' and 'left' mean taking away."),
        money('6', 'Solve it. How many stickers are left?', 12, '20 − 8 = 12.'),
      ]),
    bible14Choice('thursday'),
  ]),
  friday: Day([
    Sheet('share-equally-divide', 'math', 'Share Equally: Divide',
      "Sometimes you share things equally, or you ask how many groups you can make. That is DIVIDING. The clue words are 'share equally,' 'split,' 'each person gets' and 'how many groups.' Division is the opposite of multiplying. If 2 × 5 = 10, then 10 shared into 2 equal groups is 5 in each group, so 10 ÷ 2 = 5. To divide, ask yourself what number times the number you are dividing by makes the total. Today you also choose among all four operations. ADD puts amounts together. SUBTRACT takes away. MULTIPLY finds the total of equal groups. DIVIDE shares equally.",
      "1 dime. A dime is 10 cents. A dollar is 100 cents. 10 out of 100 is 10 percent. Answer: 10%.\n\n10 stickers are shared equally by 2 children. How many stickers does each child get? Clue: 'shared equally' means DIVIDE. 2 × 5 = 10, so 10 ÷ 2 = 5. Each child gets 5.\n\nHana had 13 cents and spent 4 cents. How many are left? Clue: 'spent' and 'left' mean SUBTRACT. 13 − 4 = 9.\n\n4 × 9 means 4 groups of 9. 9 + 9 + 9 + 9 = 36.", [
        money('1', `What percent of a dollar is 2 quarters and 3 pennies?${dollarPercent}`, 53, '50 + 3 = 53 cents. 53 out of 100 = 53%.'),
        pick14('2', '8 apples are shared equally by 2 children. Which operation tells how many apples each child gets?', ['divide', 'subtract', 'multiply', 'add'], 'divide', "'Shared equally' means divide."),
        money('3', 'Solve it. How many apples does each child get?', 4, '2 × 4 = 8, so 8 ÷ 2 = 4.'),
        pick14('4', 'Pia has 15 cents and spends 6 cents. Which operation tells how many cents are left?', ['divide', 'subtract', 'multiply', 'add'], 'subtract', "'Spends' and 'left' mean taking away."),
        pick14('5', 'There are 3 rows with 3 chairs in each row. Which operation tells how many chairs in all?', ['divide', 'subtract', 'multiply', 'add'], 'multiply', "'In each row' means equal groups."),
        pick14('6', 'Kim has 8 stickers and gets 6 more. Which operation tells how many stickers Kim has in all?', ['divide', 'subtract', 'multiply', 'add'], 'add', "'Gets more' and 'in all' mean putting together."),
        money('7', '6 × 8 = ?', 48, '8 + 8 + 8 + 8 + 8 + 8 = 48. INTENTIONAL REPEAT (Week 13): he needs to see facts more than once.'),
        money('8', '5 × 7 = ?', 35, '7 + 7 + 7 + 7 + 7 = 35. INTENTIONAL REPEAT (Week 13, and Wednesday this week): he needs to see facts more than once.'),
      ]),
    Sheet('mixed-stories-all-four', 'word-problems', 'Mixed Stories, All Four',
      "Today every kind of story is mixed together. For each one, read twice, find the clue words, choose the operation, and then solve. Clue words: 'in all,' 'together' and 'more' mean add. 'Left,' 'gave away' and 'fewer' mean subtract. 'Each,' 'every,' 'groups of' and 'rows of' mean multiply. 'Shared equally' and 'split' mean divide.",
      "10 pencils are shared equally by 5 children. How many pencils does each child get? Clue: 'shared equally' means DIVIDE. 5 × 2 = 10, so 10 ÷ 5 = 2. Each child gets 2 pencils.", [
        pick14('1', 'A box has 18 crayons. Dev gives away 7. Which operation tells how many crayons are left?', ['subtract', 'divide', 'multiply'], 'subtract', "'Gives away' and 'left' mean taking away."),
        money('2', 'Solve it. How many crayons are left?', 11, '18 − 7 = 11.'),
        pick14('3', '5 children share 15 stickers equally. Which operation tells how many stickers each child gets?', ['subtract', 'divide', 'multiply'], 'divide', "'Share equally' means divide."),
        money('4', 'Solve it. How many stickers does each child get?', 3, '5 × 3 = 15, so 15 ÷ 5 = 3.'),
        pick14('5', 'There are 4 packs with 2 pencils in each pack. Which operation tells how many pencils in all?', ['subtract', 'divide', 'multiply'], 'multiply', "'In each pack' means equal groups."),
        money('6', 'Solve it. How many pencils in all?', 8, '4 × 2 = 8.'),
      ]),
    bible14Fri('Write 1 or 2 sentences.'),
  ]),
}, '2026-10-12');

// Older son: multiply decimals, taught from the beginning. Stepped lines (1a, 1b, 1c) are separate items kept
// together and in order; the help fades Mon/Tue (2 stepped, 1 half-stepped) -> Wed (bigger-or-smaller lines)
// -> Thu (estimate lines, "1 block = X%") -> Fri (nothing written out, a few clue labels).
const standard14 = Week('week-14', 'Week 14', [
  Sheet('memory-verse', 'memory-verse', 'Memory Verse', null, null, [
    Item('verse', 'fill-blank', 'Get rid of all ___, rage, anger, harsh words, and slander, as well as all types of evil ___. Instead, be kind to each other, tenderhearted, ___ one another, just as God through Christ has forgiven you.', {
      wordBank: ['bitterness', 'behavior', 'forgiving'], answer: ['bitterness', 'behavior', 'forgiving'],
    }),
  ], { citation: 'Ephesians 4:31-32 (NLT)' }),
], {
  monday: Day([
    Sheet('tenths-decimals-are-smaller-units', 'math', 'Tenths: Decimals Are Smaller Units',
      'A decimal is a whole number counted in smaller units. The number 0.4 means 4 tenths, because one whole is split into 10 equal tenths. So 3 × 0.4 means 3 groups of 4 tenths, which is 12 tenths. Ten tenths make 1 whole, so 12 tenths is 1 whole and 2 tenths, which is 1.2. You can always do it in two steps: multiply the whole numbers (3 × 4 = 12), then say what unit you are counting (tenths) and turn it back into a decimal. Then check with an estimate. 0.4 is a little less than half, so 3 groups of it should be a little more than 1, and 1.2 fits.',
      '3 × 0.4. 0.4 is 4 tenths. 3 × 4 tenths = 12 tenths. 12 tenths = 1.2 (10 tenths make 1, and 2 tenths are left). Answer: 1.2. Check: 0.4 is a little less than half, so 3 groups should be a little more than 1. 1.2 fits.\n\n5 × 0.6. 0.6 is 6 tenths. 5 × 6 tenths = 30 tenths. 30 tenths = 3 wholes. Answer: 3. Check: 0.6 is a little more than half, so 5 groups should be a little more than 2.5. 3 fits.\n\n4 × 1.2. 1.2 is 12 tenths. 4 × 12 tenths = 48 tenths. 48 tenths = 4.8 (4 wholes and 8 tenths). Answer: 4.8. Check: 1.2 is a little more than 1, so 4 groups should be a little more than 4. 4.8 fits.', [
        money('1a', 'How many tenths is 0.7?', 7, '0.7 = 7 tenths.'),
        money('1b', '4 × 7 = ?', 28, '28 tenths.'),
        money('1c', '4 × 0.7 = ?', 2.8, '28 tenths = 2.8.'),
        money('2a', 'How many tenths is 0.3?', 3, '0.3 = 3 tenths.'),
        money('2b', '5 × 3 = ?', 15, '15 tenths.'),
        money('2c', '5 × 0.3 = ?', 1.5, '15 tenths = 1.5.'),
        money('3a', 'Multiply the tenths: 3 × 16 = ?', 48, '1.6 is 16 tenths. 3 × 16 = 48 tenths.'),
        money('3b', '3 × 1.6 = ?', 4.8, '48 tenths = 4.8.'),
        money('4', '6 × 0.4 = ?', 2.4, '6 × 0.4 = 2.4.'),
        money('5', '7 × 0.5 = ?', 3.5, '7 × 0.5 = 3.5.'),
      ]),
    Sheet('tenths-in-real-life', 'word-problems', 'Tenths in Real Life',
      'Stories use decimals when they talk about money and measuring. First find how many groups there are and how big each group is. Then multiply the same way as on the Math sheet: turn the decimal into tenths, multiply the whole numbers, then turn it back. Money gives you a check. $0.50 is 5 tenths of a dollar, so 3 times $0.50 is 15 tenths of a dollar, which is $1.50.',
      'A bag of rice weighs 0.8 kg. You have 3 bags. How many kg of rice do you have? Step 1: 3 groups of 0.8 kg. Step 2: 0.8 is 8 tenths. Step 3: 3 × 8 = 24 tenths. Step 4: 24 tenths = 2.4. Answer: 2.4 kg.', [
        money('1a', 'You clean the litter box ($0.50) 5 times this week. First, how many tenths of a dollar is $0.50?', 5, '$0.50 = 5 tenths of a dollar.'),
        money('1b', '5 × 5 = ?', 25, '25 tenths of a dollar.'),
        money('1c', 'How much do you earn, in dollars?', 2.5, '25 tenths = 2.50. Accept 2.5 or 2.50.'),
        money('2', 'A ribbon piece is 0.9 meters long. You need 6 pieces. How many meters of ribbon do you need?', 5.4, '6 × 9 = 54 tenths = 5.4.'),
        money('3', 'You set the table ($0.50) 9 times. How much do you earn, in dollars?', 4.5, '9 × 5 = 45 tenths = 4.50. Accept 4.5 or 4.50.'),
      ]),
    bible14Choice('monday'),
  ]),
  tuesday: Day([
    Sheet('hundredths-and-a-shortcut', 'math', 'Hundredths, and a Shortcut That Always Works',
      'Last time you counted tenths. Hundredths work the same way, just smaller. 0.25 means 25 hundredths, because one whole is split into 100 equal parts. So 3 × 1.25 is 3 groups of 125 hundredths, which is 375 hundredths, and 375 hundredths is 3.75. That leads to a shortcut that always works. Ignore the decimal point and multiply as if the numbers were whole (3 × 125 = 375). Then count how many decimal places the number you started with had (1.25 has 2) and put the decimal point back so the answer has the same number of places (3.75). It works because ignoring the point counts the small units, and putting the point back turns them into wholes. Always check with an estimate. 1.25 is a little more than 1, so 3 groups should be a little more than 3.',
      '4 × 2.5. Ignore the decimal point: 4 × 25 = 100. 2.5 has 1 decimal place, so the answer has 1 decimal place: 10.0, which is 10. Check: 2.5 is between 2 and 3, so 4 groups is between 8 and 12. 10 fits.\n\n3 × 1.25. Ignore the decimal point: 3 × 125 = 375. 1.25 has 2 decimal places, so the answer has 2: 3.75. Check: 1.25 is a little more than 1, so 3 groups is a little more than 3. 3.75 fits.\n\n6 × 0.35. Ignore the decimal point: 6 × 35 = 210. 0.35 has 2 decimal places, so the answer has 2: 2.10, which is 2.1. Check: 0.35 is a little more than one third, so 6 groups is a little more than 2. 2.1 fits.', [
        money('1a', 'Ignore the decimal point: 7 × 32 = ?', 224, '7 × 32 = 224.'),
        money('1b', 'How many decimal places does 3.2 have?', 1, '3.2 has 1.'),
        money('1c', '7 × 3.2 = ?', 22.4, '224 with 1 decimal place = 22.4.'),
        money('2a', 'Ignore the decimal point: 4 × 625 = ?', 2500, '4 × 625 = 2500.'),
        money('2b', 'How many decimal places does 6.25 have?', 2, '6.25 has 2.'),
        money('2c', '4 × 6.25 = ?', 25, '2500 with 2 decimal places = 25.'),
        money('3a', 'Ignore the decimal point: 9 × 15 = ?', 135, '9 × 15 = 135.'),
        money('3b', '9 × 1.5 = ?', 13.5, '135 with 1 decimal place = 13.5.'),
        money('4', '8 × 3.75 = ?', 30, '8 × 3.75 = 30.'),
        money('5', '5 × 2.8 = ?', 14, '5 × 2.8 = 14.'),
      ]),
    codeQuest13(),
    bible14Choice('tuesday'),
  ]),
  wednesday: Day([
    Sheet('decimal-times-decimal', 'math', 'Decimal Times Decimal: Tenths of Tenths',
      "Now both numbers are decimals. Think of 0.3 × 0.4 as 3 tenths of 4 tenths. A tenth of a tenth is a hundredth, so the answer is in hundredths: 3 × 4 = 12 hundredths, which is 0.12. That is why the shortcut still works. Ignore the decimal points (3 × 4 = 12), count the decimal places in both numbers together (1 + 1 = 2), and put the decimal point back so the answer has that many places (0.12). Notice that 0.12 is smaller than 0.4. When you multiply by a number smaller than 1, you take only part of the other number, so the answer gets smaller. When you multiply by a number bigger than 1, the answer gets bigger. Ask 'bigger or smaller?' first, because it catches mistakes.",
      '0.3 × 0.4. Ignore the decimal points: 3 × 4 = 12. 1 + 1 = 2 decimal places: 0.12. Check: 0.3 is smaller than 1, so the answer should be smaller than 0.4. 0.12 fits.\n\n0.5 × 0.8. Ignore the decimal points: 5 × 8 = 40. 1 + 1 = 2 decimal places: 0.40, which is 0.4. Check: 0.5 is one half, and half of 0.8 is 0.4. It fits.\n\n1.2 × 0.3. Ignore the decimal points: 12 × 3 = 36. 1 + 1 = 2 decimal places: 0.36. Check: 1.2 is a little more than 1, so the answer should be a little more than 0.3. 0.36 fits.', [
        pick14('1a', 'Is 0.2 × 0.6 bigger or smaller than 0.2?', BIGGER_SMALLER, 'smaller', '0.6 is less than 1, so the answer is smaller than 0.2.'),
        money('1b', 'Ignore the decimal points: 2 × 6 = ?', 12, '2 × 6 = 12.'),
        money('1c', 'How many decimal places in all? (0.2 has 1, 0.6 has 1)', 2, '1 + 1 = 2.'),
        money('1d', '0.2 × 0.6 = ?', 0.12, '12 with 2 decimal places = 0.12.'),
        pick14('2a', 'Is 0.7 × 0.5 bigger or smaller than 0.7?', BIGGER_SMALLER, 'smaller', '0.5 is less than 1, so the answer is smaller than 0.7.'),
        money('2b', 'Ignore the decimal points: 7 × 5 = ?', 35, '7 × 5 = 35.'),
        money('2c', '0.7 × 0.5 = ?', 0.35, '35 with 2 decimal places = 0.35.'),
        pick14('3a', 'Is 1.2 × 1.5 bigger or smaller than 1.2?', BIGGER_SMALLER, 'bigger', '1.5 is more than 1, so the answer is bigger than 1.2.'),
        money('3b', '1.2 × 1.5 = ?', 1.8, '1.2 × 1.5 = 1.8.'),
        pick14('4a', 'Is 0.4 × 2.5 bigger or smaller than 0.4?', BIGGER_SMALLER, 'bigger', '2.5 is more than 1, so the answer is bigger than 0.4.'),
        money('4b', '0.4 × 2.5 = ?', 1, '0.4 × 2.5 = 1.'),
      ]),
    codeQuest13(),
    bible14Wed('Write 2 sentences.'),
  ]),
  thursday: Day([
    Sheet('put-it-together-then-percent-blocks', 'math', 'Put It Together, Then Percent Blocks',
      'Today you use all three ideas together, and then you use them on the percent blocks that were tricky before. The steps are the same every time: ignore the decimal points and multiply the whole numbers, count the decimal places, put the decimal point back, and check with an estimate. On the percent blocks, one block is worth 100 divided by the number of blocks, and the percent is the number of shaded blocks times what one block is worth. That last step is decimal multiplication, so the shortcut you learned this week does it for you. With 16 blocks, one block is worth 6.25%. Items 1 to 3 are decimal multiplication on its own. Items 4 and 5 are percent blocks, and the picture tells you what one block is worth.',
      '4 × 0.9. Estimate: 0.9 is a little less than 1, so the answer should be a little less than 4. Ignore the decimal point: 4 × 9 = 36. 0.9 has 1 decimal place: 3.6. It fits the estimate.\n\n6 × 2.15. Estimate: 2.15 is close to 2, so the answer is about 12. Ignore the decimal point: 6 × 215 = 1290. 2.15 has 2 decimal places: 12.90, which is 12.9. It fits the estimate.\n\n0.8 × 0.7. Smaller than 0.8, because 0.7 is less than 1. Ignore the decimal points: 8 × 7 = 56. 1 + 1 = 2 decimal places: 0.56.\n\nPercent blocks: 15 out of 40. One block is 100 ÷ 40 = 2.5%. Ignore the decimal point: 15 × 25 = 375. 2.5 has 1 decimal place: 37.5. Answer: 37.5%.', [
        money('1a', 'Estimate: round 0.8 to 1. 6 × 1 = ?', 6, 'Close to the real answer, which is 4.8.'),
        money('1b', '6 × 0.8 = ?', 4.8, '6 × 0.8 = 4.8.'),
        money('2a', 'Estimate: round 4.25 to 4. 7 × 4 = ?', 28, 'Close to the real answer, which is 29.75.'),
        money('2b', '7 × 4.25 = ?', 29.75, '7 × 4.25 = 29.75.'),
        pick14('3a', 'Is 0.6 × 0.9 bigger or smaller than 0.6?', BIGGER_SMALLER, 'smaller', '0.9 is less than 1, so the answer is smaller than 0.6.'),
        money('3b', '0.6 × 0.9 = ?', 0.54, '0.6 × 0.9 = 0.54.'),
        money('4a', 'Ignore the decimal point: 3 × 625 = ?', 1875, 'One block is 6.25%. 3 × 625 = 1875.'),
        pct13('4b', '3 out of 16 is what percent?', 3, 16, 'unit', '3 × 6.25 = 18.75.'),
        money('5a', 'Ignore the decimal point: 11 × 25 = ?', 275, 'One block is 2.5%. 11 × 25 = 275.'),
        pct13('5b', '11 out of 40 is what percent?', 11, 40, 'unit', '11 × 2.5 = 27.5.'),
      ]),
    Sheet('decimals-in-stories', 'word-problems', 'Decimals in Stories',
      'Stories with decimals usually give you a price or a measurement and a number of groups. Find the groups and the size of each one, multiply with the steps you learned, and check with an estimate. For money, remember that cents are hundredths of a dollar, so $0.75 is 75 hundredths.',
      'You buy 5 stickers at $0.45 each. How much do you pay? Estimate: $0.45 is close to $0.50, and 5 × $0.50 is $2.50, so about $2.50. Ignore the decimal point: 5 × 45 = 225. $0.45 has 2 decimal places: 2.25. Answer: $2.25, which is close to the estimate.', [
        money('1', 'You take out the trash ($0.75) 4 times this week. How much do you earn, in dollars?', 3, '4 × 75 = 300; 2 places = 3.00. Accept 3 or 3.00.'),
        money('2', 'A notebook costs $2.35. You buy 4 notebooks. How much do you pay, in dollars?', 9.4, '4 × 235 = 940; 2 places = 9.40. Accept 9.4 or 9.40.'),
        money('3', 'A recipe needs 1.5 cups of flour. You make 0.5 of the recipe. How many cups of flour do you need?', 0.75, '15 × 5 = 75; 1 + 1 = 2 places = 0.75.'),
      ]),
    bible14Choice('thursday'),
  ]),
  friday: Day([
    Sheet('show-what-you-know', 'math', 'Show What You Know',
      'No steps are written out today, so use them yourself: ignore the decimal points and multiply the whole numbers, count the decimal places, put the decimal point back, and check with an estimate or with bigger or smaller. On the percent blocks the picture only gives a few clues, so work out what one block is worth first.',
      '2.5 × 3.2. Estimate: 2.5 × 3 = 7.5, so about 8. Ignore the decimal points: 25 × 32 = 800. 1 + 1 = 2 decimal places: 8.00, which is 8. It fits the estimate.\n\nPercent blocks: 13 out of 40. One block is 100 ÷ 40 = 2.5%. Ignore the decimal point: 13 × 25 = 325. 2.5 has 1 decimal place: 32.5. Answer: 32.5%.', [
        money('1', '8 × 0.7 = ?', 5.6, '8 × 0.7 = 5.6.'),
        money('2', '5 × 3.6 = ?', 18, '5 × 3.6 = 18.'),
        money('3', '0.3 × 0.9 = ?', 0.27, '0.3 × 0.9 = 0.27.'),
        money('4', '1.5 × 4.2 = ?', 6.3, '1.5 × 4.2 = 6.3.'),
        pct13('5', '10 out of 16 is what percent?', 10, 16, 'clues', '10 × 6.25 = 62.5.'),
        pct13('6', '33 out of 40 is what percent?', 33, 40, 'clues', '33 × 2.5 = 82.5.'),
      ]),
    Sheet('decimals-out-in-the-world', 'word-problems', 'Decimals Out in the World',
      'Decimal multiplication shows up in shopping, measuring, cooking and percents. A price per pound times the pounds gives the cost. A length times a width gives the area. A percent is a decimal too. 15% means 15 out of 100, which is 0.15, so 15% of a number is 0.15 times that number. Read each story, decide what is being multiplied, and then use the steps.',
      'Ribbon costs $1.20 per meter. You buy 2.5 meters. How much do you pay? Estimate: $1.20 is a little more than $1, so a little more than 2.5 dollars, about $3. Write $1.20 as 1.2. Ignore the decimal points: 12 × 25 = 300. 1 + 1 = 2 decimal places: 3.00. Answer: $3.00.', [
        money('1', 'Apples cost $1.80 per pound. You buy 2.5 pounds. How much do you pay, in dollars?', 4.5, '18 × 25 = 450; 2 places = 4.50. Accept 4.5 or 4.50.'),
        money('2', 'A garden bed is 3.2 meters long and 1.5 meters wide. What is its area in square meters?', 4.8, '32 × 15 = 480; 2 places = 4.80. Accept 4.8.'),
        money('3', 'Find 15% of $42. Write 15% as 0.15 and multiply. How many dollars is it?', 6.3, '0.15 × 42: 15 × 42 = 630; 2 places = 6.30. Accept 6.3 or 6.30.'),
        money('4', 'A car uses 8.5 gallons of gas at $3.20 per gallon. How much does the gas cost, in dollars?', 27.2, 'Write $3.20 as 3.2. 85 × 32 = 2720; 1 + 1 = 2 decimal places = 27.20. Accept 27.2 or 27.20.'),
      ]),
    bible14Fri('Write 2 sentences.'),
  ]),
}, '2026-10-12');

// Week 15 (Monday 2026-10-19): break week, with Bible Reading only.
// Monday and Tuesday repeat the Week 14 sheets, including their balanced choice wording.
const BIBLE15 = {
  wednesday: {
    ref: 'Daniel 1:1-21',
    items: () => [
      choice('q1', "Daniel and his friends were taken from home to train in the king's palace in Babylon. What did Daniel decide not to do?", [
        'Learn the language of Babylon',
        "Eat the king's rich food and wine",
        'Meet with the king',
      ], 'B', "Daniel 1:8. Daniel decided not to eat the king's rich food and wine."),
      choice('q2', 'Daniel asked for a ten-day test. What happened?', [
        'They ate vegetables and water, and looked healthier than the others',
        "They ate the king's food, and looked healthier than the others",
        'They ate vegetables and water, and got very sick',
      ], 'A', "Daniel 1:12-15. After ten days on vegetables and water, they looked healthier than the young men who ate the king's food."),
      choice('q3', 'Near the end of the chapter, who gave Daniel and his three friends knowledge and understanding?', [
        'The chief official',
        "The king's teachers",
        'God',
      ], 'C', 'Daniel 1:17. God gave the four young men knowledge and understanding.'),
    ],
  },
  thursday: {
    ref: 'Daniel 3:1-30',
    items: () => [
      choice('q1', 'King Nebuchadnezzar set up a huge gold statue and gave an order. What was the order?', [
        'Bring a gift of gold to the king every day',
        'Build a new palace for the king and his family',
        'Bow down to the statue when the music plays',
      ], 'C', 'Daniel 3:4-6. When the music played, everyone had to bow down to the gold statue, or be thrown into a blazing furnace.'),
      choice('q2', 'Shadrach, Meshach and Abednego would not bow down. What did they tell the king?', [
        'God can save us, but even if He does not, we will not bow',
        'We are sorry, and we will bow down to the statue now',
        'We did not hear the music, so we did not bow',
      ], 'A', 'Daniel 3:16-18. They said God was able to save them, but even if He did not, they would not bow down.'),
      choice('q3', 'The king threw the three men into the furnace, then looked inside. What did he see?', [
        'The fire had gone out, and the men were asleep',
        'Four men walking in the fire, not tied up and not hurt',
        'The three men had escaped before the fire was lit',
      ], 'B', 'Daniel 3:24-25. The king saw four men walking in the fire, not tied up and not hurt.'),
    ],
  },
};
const bible15Choice = (day) => bibleChoice(BIBLE15[day].ref, BIBLE15[day].items());
const bible15Fri = (sentences) => bibleReading('Daniel 6:1-23, then 6:25-28', `Why was Daniel thrown into the lions' den, and how did God take care of him there? ${sentences}`, "A good answer says jealous officials tricked the king into making a law that no one could pray to anyone but the king. Daniel kept praying to God, so he was thrown to the lions, and God sent an angel to shut the lions' mouths, so Daniel was not hurt (Daniel 6:22).");
const celebration15 = () => ({
  id: 'week-15-break',
  trigger: 'bible-reading',
  blocks: [
    { type: 'p', text: 'Congratulations, I am proud of you boys and your constant learning!' },
    { type: 'p', text: 'God loves to give good gifts to His children, and so do I. The Bible says:' },
    { type: 'quote', text: '"So if you sinful people know how to give good gifts to your children, how much more will your heavenly Father give good gifts to those who ask him." (Matthew 7:11)' },
    { type: 'p', text: 'So this week is a gift from me to you:' },
    { type: 'bullets', items: ['A whole week off from your work', '1½ hours of Fortnite this week'] },
    { type: 'p', text: 'Your Bible reading stays, because that is how we grow closer to our Father in heaven.' },
    { type: 'signoff', text: 'Love, Dad' },
  ],
  button: "I'm ready!",
});
const week15 = (sentences) => Object.assign(Week('week-15', 'Week 15', [], {
  monday: Day([bible14Choice('thursday')]),
  tuesday: Day([bible14Fri(sentences)]),
  wednesday: Day([bible15Choice('wednesday')]),
  thursday: Day([bible15Choice('thursday')]),
  friday: Day([bible15Fri(sentences)]),
}, '2026-10-19'), { breakWeek: true, celebration: celebration15() });
const guided15 = week15('Write 1 or 2 sentences.');
const standard15 = week15('Write 2 sentences.');

// Week 16 (Monday 2026-10-26): second pass on decimal multiplication and multiplication facts.
// Math and Word Problems wording, examples, answers, and parent notes come from the approved Drive plan.
const standard16 = Week('week-16', 'Week 16', [
  Sheet('memory-verse', 'memory-verse', 'Memory Verse', null, null, [
    Item('verse', 'fill-blank', "___ in the LORD with all your heart; do not depend on your own ___. Seek his will in all you do, and he will show you which ___ to take.", {
      wordBank: ["trust","understanding","path"], answer: ["trust","understanding","path"],
    }),
  ], { citation: "Proverbs 3:5-6 (NLT)" }),
], {
  monday: Day([
    Sheet("tenths-are-dimes", "math", "Tenths Are Dimes",
      "A decimal is a whole number counted in smaller units, and money shows it well. One dime is a tenth of a dollar, so 0.3 means 3 tenths, which is 3 dimes. So 4 × 0.3 is 4 groups of 3 dimes, which is 12 dimes. Ten dimes make 1 whole dollar, so 12 dimes is 1 dollar and 2 dimes, which is 1.2. You can always do it in three steps: say how many tenths the decimal is, multiply the whole numbers, and then turn the tenths back into a decimal (10 tenths make 1 whole). Then check with an estimate.",
      "5 × 0.4. 0.4 is 4 tenths. 5 × 4 tenths = 20 tenths. 20 tenths = 2 wholes. Answer: 2. Check: 0.4 is a little less than half, so 5 groups should be a little less than 2.5. 2 fits.\n\n4 × 0.8. 0.8 is 8 tenths. 4 × 8 tenths = 32 tenths. 32 tenths = 3.2 (3 wholes and 2 tenths). Answer: 3.2. Check: 0.8 is a little less than 1, so 4 groups should be a little less than 4. 3.2 fits.\n\n7 × 1.3. 1.3 is 13 tenths. 7 × 13 tenths = 91 tenths. 91 tenths = 9.1 (9 wholes and 1 tenth). Answer: 9.1. Check: 7 × 1 = 7, and the extra 0.3 in each group adds about 2 more, so about 9. 9.1 fits.", [
        money("1a", "How many tenths is 0.6?", 6, "0.6 = 6 tenths."),
        money("1b", "8 × 6 = ?", 48, "48 tenths."),
        money("1c", "8 × 0.6 = ?", 4.8, "48 tenths = 4.8."),
        money("2a", "How many tenths is 0.9?", 9, "0.9 = 9 tenths."),
        money("2b", "7 × 9 = ?", 63, "63 tenths."),
        money("2c", "7 × 0.9 = ?", 6.3, "63 tenths = 6.3."),
        money("3a", "Multiply the tenths: 9 × 14 = ?", 126, "1.4 is 14 tenths. 9 × 14 = 126 tenths."),
        money("3b", "9 × 1.4 = ?", 12.6, "126 tenths = 12.6."),
        money("4", "6 × 0.7 = ?", 4.2, "6 × 0.7 = 4.2."),
        money("5", "3 × 2.6 = ?", 7.8, "3 × 2.6 = 7.8."),
      ]),
    Sheet("tenths-in-money-and-measuring", "word-problems", "Tenths in Money and Measuring",
      "Stories use decimals for money and for measuring. First find how many groups there are and how big each group is. Then multiply the same way as on the Math sheet: turn the decimal into tenths, multiply the whole numbers, and turn it back. Money gives you a check. $0.50 is 5 dimes, which is 5 tenths of a dollar, so 8 times $0.50 is 40 tenths of a dollar, which is $4.",
      "A stick is 0.4 meters long. You line up 8 sticks end to end. How many meters long is the line? Step 1: 8 groups of 0.4 m. Step 2: 0.4 is 4 tenths. Step 3: 8 × 4 = 32 tenths. Step 4: 32 tenths = 3.2. Answer: 3.2 meters.", [
        money("1a", "You clean the litter box ($0.50) 8 times this week. First, how many tenths of a dollar is $0.50?", 5, "$0.50 = 5 tenths of a dollar (5 dimes)."),
        money("1b", "8 × 5 = ?", 40, "40 tenths of a dollar."),
        money("1c", "How much do you earn, in dollars?", 4, "40 tenths = 4 dollars. Accept 4, 4.0 or 4.00."),
        money("2", "A shelf board is 0.8 meters long. You need 7 boards. How many meters of board do you need?", 5.6, "7 × 8 = 56 tenths = 5.6."),
        money("3", "You fold and put away laundry ($1.50) 3 times. How much do you earn, in dollars?", 4.5, "3 × 15 = 45 tenths = 4.50. Accept 4.5 or 4.50."),
      ]),
    bible14Choice('thursday'),
  ]),
  tuesday: Day([
    Sheet("hundredths-are-cents-and-a-shortcut-that-always-works", "math", "Hundredths Are Cents, and a Shortcut That Always Works",
      "Last time you counted tenths as dimes. Hundredths work the same way, just smaller: one cent is a hundredth of a dollar. So 1.35 is 135 cents, or 135 hundredths. That leads to a shortcut that always works. Ignore the decimal point and multiply as if the numbers were whole (4 × 135 = 540). Then count how many decimal places the number you started with had (1.35 has 2) and put the decimal point back so the answer has the same number of places (5.40, which is 5.4). It works because ignoring the point counts the small units, and putting the point back turns them into wholes. Before you start, ask 'bigger or smaller?': multiplying by a number bigger than 1 makes the answer bigger than the number you started with, and multiplying by a number smaller than 1 makes it smaller. Then check with an estimate.",
      "6 × 2.5. Ignore the decimal point: 6 × 25 = 150. 2.5 has 1 decimal place, so the answer has 1: 15.0, which is 15. Check: 2.5 is between 2 and 3, so 6 groups is between 12 and 18. 15 fits.\n\n4 × 1.35. Ignore the decimal point: 4 × 135 = 540. 1.35 has 2 decimal places, so the answer has 2: 5.40, which is 5.4. Check: 1.35 is between 1 and 1.5, so 4 groups is between 4 and 6. 5.4 fits.\n\n9 × 0.35. Ignore the decimal point: 9 × 35 = 315. 0.35 has 2 decimal places, so the answer has 2: 3.15. Check: 0.35 is a little more than 0.3, so 9 groups is a little more than 2.7, which is about 3. 3.15 fits.", [
        money("1a", "Ignore the decimal point: 6 × 14 = ?", 84, "6 × 14 = 84."),
        money("1b", "How many decimal places does 1.4 have?", 1, "1.4 has 1."),
        money("1c", "6 × 1.4 = ?", 8.4, "84 with 1 decimal place = 8.4."),
        money("2a", "Ignore the decimal point: 5 × 125 = ?", 625, "5 × 125 = 625."),
        money("2b", "How many decimal places does 1.25 have?", 2, "1.25 has 2."),
        money("2c", "5 × 1.25 = ?", 6.25, "625 with 2 decimal places = 6.25."),
        pick14("3a", "Is 8 × 0.45 bigger or smaller than 8?", ['bigger', 'smaller'], "smaller", "0.45 is less than 1, so the answer is smaller than 8."),
        money("3b", "8 × 0.45 = ?", 3.6, "8 × 45 = 360; 2 places = 3.60. Accept 3.6 or 3.60."),
        pick14("4a", "Is 4 × 2.75 bigger or smaller than 4?", ['bigger', 'smaller'], "bigger", "2.75 is more than 1, so the answer is bigger than 4."),
        money("4b", "4 × 2.75 = ?", 11, "4 × 275 = 1100; 2 places = 11.00. Accept 11, 11.0 or 11.00."),
      ]),
    codeQuest13(),
    bible14Fri("Write 2 sentences."),
  ]),
  wednesday: Day([
    Sheet("decimal-times-decimal-a-dime-of-a-dime-is-a-penny", "math", "Decimal Times Decimal: A Dime of a Dime Is a Penny",
      "Now both numbers are decimals. Think of 0.3 × 0.4 as 3 tenths of 4 tenths. A tenth of a dime is a penny, and a penny is a hundredth of a dollar, so a tenth of a tenth is a hundredth. The answer is in hundredths: 3 × 4 = 12 hundredths, which is 0.12. That is why the shortcut still works. Ignore the decimal points (3 × 4 = 12), count the decimal places in both numbers together (1 + 1 = 2), and put the decimal point back so the answer has that many places (0.12). Notice that 0.12 is smaller than 0.4. When you multiply by a number smaller than 1, you take only part of the other number, so the answer gets smaller. When you multiply by a number bigger than 1, the answer gets bigger. Ask 'bigger or smaller?' first, because it catches mistakes.",
      "0.6 × 0.7. Ignore the decimal points: 6 × 7 = 42. 1 + 1 = 2 decimal places: 0.42. Check: 0.6 is smaller than 1, so the answer should be smaller than 0.7. 0.42 fits.\n\n0.5 × 0.6. Ignore the decimal points: 5 × 6 = 30. 1 + 1 = 2 decimal places: 0.30, which is 0.3. Check: 0.5 is one half, and half of 0.6 is 0.3. It fits.\n\n1.4 × 0.5. Ignore the decimal points: 14 × 5 = 70. 1 + 1 = 2 decimal places: 0.70, which is 0.7. Check: 0.5 is one half, and half of 1.4 is 0.7. It fits.", [
        pick14("1a", "Is 0.4 × 0.9 bigger or smaller than 0.4?", ['bigger', 'smaller'], "smaller", "0.9 is less than 1, so the answer is smaller than 0.4."),
        money("1b", "Ignore the decimal points: 4 × 9 = ?", 36, "4 × 9 = 36."),
        money("1c", "How many decimal places in all? (0.4 has 1, 0.9 has 1)", 2, "1 + 1 = 2."),
        money("1d", "0.4 × 0.9 = ?", 0.36, "36 with 2 decimal places = 0.36."),
        pick14("2a", "Is 0.9 × 0.5 bigger or smaller than 0.9?", ['bigger', 'smaller'], "smaller", "0.5 is less than 1, so the answer is smaller than 0.9."),
        money("2b", "Ignore the decimal points: 9 × 5 = ?", 45, "9 × 5 = 45."),
        money("2c", "0.9 × 0.5 = ?", 0.45, "45 with 2 decimal places = 0.45."),
        pick14("3a", "Is 1.3 × 1.2 bigger or smaller than 1.3?", ['bigger', 'smaller'], "bigger", "1.2 is more than 1, so the answer is bigger than 1.3."),
        money("3b", "1.3 × 1.2 = ?", 1.56, "13 × 12 = 156; 2 places = 1.56."),
        pick14("4a", "Is 0.7 × 3.5 bigger or smaller than 0.7?", ['bigger', 'smaller'], "bigger", "3.5 is more than 1, so the answer is bigger than 0.7."),
        money("4b", "0.7 × 3.5 = ?", 2.45, "7 × 35 = 245; 2 places = 2.45."),
      ]),
    codeQuest13(),
    bible15Choice('wednesday'),
  ]),
  thursday: Day([
    Sheet("put-it-together-then-percent-blocks", "math", "Put It Together, Then Percent Blocks",
      "Today you use all three ideas together, and then you use them on the percent blocks. The steps are the same every time: ask 'bigger or smaller?' or make an estimate, ignore the decimal points and multiply the whole numbers, count the decimal places, and put the decimal point back. On the percent blocks, one block is worth 100 divided by the number of blocks, and the percent is the number of shaded blocks times what one block is worth. That last step is decimal multiplication, so the shortcut does it for you. With 16 blocks one block is worth 6.25%, and with 40 blocks it is worth 2.5%. Items 1 to 3 are decimal multiplication on its own. Items 4 and 5 are percent blocks, and the picture tells you what one block is worth.",
      "9 × 0.6. Estimate: 0.6 is a little more than 0.5, and 9 × 0.5 = 4.5, so the answer should be a little more than 4.5. Ignore the decimal point: 9 × 6 = 54. 0.6 has 1 decimal place: 5.4. It fits the estimate.\n\n4 × 3.15. Estimate: 3.15 is close to 3, so the answer is about 12. Ignore the decimal point: 4 × 315 = 1260. 3.15 has 2 decimal places: 12.60, which is 12.6. It fits the estimate.\n\n0.4 × 0.7. Smaller than 0.7, because 0.4 is less than 1. Ignore the decimal points: 4 × 7 = 28. 1 + 1 = 2 decimal places: 0.28.\n\nPercent blocks: 12 out of 40. One block is 100 ÷ 40 = 2.5%. Ignore the decimal point: 12 × 25 = 300. 2.5 has 1 decimal place: 30.0. Answer: 30%.", [
        money("1a", "Estimate: round 0.9 to 1. 8 × 1 = ?", 8, "Close to the real answer, which is 7.2."),
        money("1b", "8 × 0.9 = ?", 7.2, "8 × 9 = 72; 1 place = 7.2."),
        money("2a", "Estimate: round 5.2 to 5. 6 × 5 = ?", 30, "Close to the real answer, which is 31.2."),
        money("2b", "6 × 5.2 = ?", 31.2, "6 × 52 = 312; 1 place = 31.2."),
        pick14("3a", "Is 0.8 × 0.4 bigger or smaller than 0.8?", ['bigger', 'smaller'], "smaller", "0.4 is less than 1, so the answer is smaller than 0.8."),
        money("3b", "0.8 × 0.4 = ?", 0.32, "8 × 4 = 32; 2 places = 0.32."),
        money("4a", "Ignore the decimal point: 12 × 625 = ?", 7500, "One block is 6.25%. 12 × 625 = 7500."),
        withNote(wholeBlocks("4b", "12 out of 16 is what percent?", 12, 16, "unit"), "12 × 6.25 = 75."),
        money("5a", "Ignore the decimal point: 19 × 25 = ?", 475, "One block is 2.5%. 19 × 25 = 475."),
        withNote(wholeBlocks("5b", "19 out of 40 is what percent?", 19, 40, "unit"), "19 × 2.5 = 47.5."),
      ]),
    Sheet("decimals-in-stories", "word-problems", "Decimals in Stories",
      "Stories with decimals usually give you a price or a measurement and a number of groups. Find the groups and the size of each one, multiply with the steps you learned, and check with an estimate. For money, remember that cents are hundredths of a dollar, so $0.75 is 75 hundredths.",
      "You buy 7 pencils at $0.35 each. How much do you pay? Estimate: $0.35 is between $0.30 and $0.40, so the cost is between 7 × $0.30 = $2.10 and 7 × $0.40 = $2.80. Ignore the decimal point: 7 × 35 = 245. $0.35 has 2 decimal places: 2.45. Answer: $2.45, which is between the two estimates.", [
        money("1", "You unload groceries ($0.75) 6 times this week. How much do you earn, in dollars?", 4.5, "6 × 75 = 450; 2 places = 4.50. Accept 4.5 or 4.50."),
        money("2", "A notebook costs $3.25. You buy 5 notebooks. How much do you pay, in dollars?", 16.25, "5 × 325 = 1625; 2 places = 16.25."),
        money("3", "A recipe needs 3.5 cups of milk. You make 0.6 of the recipe. How many cups of milk do you need?", 2.1, "35 × 6 = 210; 1 + 1 = 2 places = 2.10. Accept 2.1 or 2.10."),
      ]),
    bible15Choice('thursday'),
  ]),
  friday: Day([
    Sheet("show-what-you-know", "math", "Show What You Know",
      "No steps are written out today, so use them yourself: ask 'bigger or smaller?' or make an estimate, ignore the decimal points and multiply the whole numbers, count the decimal places, and put the decimal point back. On the percent blocks the picture only gives a few clues, so work out what one block is worth first.",
      "4.5 × 1.2. Estimate: 4.5 × 1 = 4.5, so about 5. Ignore the decimal points: 45 × 12 = 540. 1 + 1 = 2 decimal places: 5.40, which is 5.4. It fits the estimate.\n\nPercent blocks: 24 out of 40. One block is 100 ÷ 40 = 2.5%. Ignore the decimal point: 24 × 25 = 600. 2.5 has 1 decimal place: 60.0. Answer: 60%.", [
        money("1", "9 × 0.4 = ?", 3.6, "9 × 4 = 36; 1 place = 3.6."),
        money("2", "6 × 3.7 = ?", 22.2, "6 × 37 = 222; 1 place = 22.2."),
        money("3", "0.6 × 0.8 = ?", 0.48, "6 × 8 = 48; 2 places = 0.48."),
        money("4", "1.6 × 3.5 = ?", 5.6, "16 × 35 = 560; 2 places = 5.60. Accept 5.6 or 5.60."),
        withNote(wholeBlocks("5", "14 out of 16 is what percent?", 14, 16, "clues"), "14 × 6.25 = 87.5."),
        withNote(wholeBlocks("6", "25 out of 40 is what percent?", 25, 40, "clues"), "25 × 2.5 = 62.5."),
      ]),
    Sheet("decimals-out-in-the-world", "word-problems", "Decimals Out in the World",
      "Decimal multiplication shows up in shopping, measuring, cooking and percents. A price per pound times the pounds gives the cost. A length times a width gives the area. A percent is a decimal too. 20% means 20 out of 100, which is 0.20, so 20% of a number is 0.20 times that number. Read each story, decide what is being multiplied, and then use the steps.",
      "Cheese costs $3.60 per pound. You buy 2.5 pounds. How much do you pay? Estimate: $3.60 is close to $4, and 4 × 2.5 = 10, so about $10. Write $3.60 as 3.6. Ignore the decimal points: 36 × 25 = 900. 1 + 1 = 2 decimal places: 9.00. Answer: $9.00, which is close to the estimate.", [
        money("1", "Grapes cost $2.40 per pound. You buy 3.5 pounds. How much do you pay, in dollars?", 8.4, "Write $2.40 as 2.4. 24 × 35 = 840; 2 places = 8.40. Accept 8.4 or 8.40."),
        money("2", "A poster is 1.2 meters long and 0.8 meters wide. What is its area in square meters?", 0.96, "12 × 8 = 96; 2 places = 0.96."),
        money("3", "Find 20% of $35. Write 20% as 0.20 and multiply. How many dollars is it?", 7, "0.20 × 35: 20 × 35 = 700; 2 places = 7.00. Accept 7, 7.0 or 7.00."),
        money("4", "A truck uses 6.5 gallons of gas at $3.40 per gallon. How much does the gas cost, in dollars?", 22.1, "Write $3.40 as 3.4. 65 × 34 = 2210; 1 + 1 = 2 places = 22.10. Accept 22.1 or 22.10."),
      ]),
    bible15Fri("Write 2 sentences."),
  ]),
}, '2026-10-26');
const guided16 = Week('week-16', 'Week 16', [
  Sheet('memory-verse', 'memory-verse', 'Memory Verse', null, null, [
    Item('verse', 'fill-blank', "Your word is a ___ to guide my feet and a ___ for my path.", {
      wordBank: ["lamp","light"], answer: ["lamp","light"],
    }),
  ], { citation: "Psalm 119:105 (NLT)" }),
], {
  monday: Day([
    Sheet("fours-double-then-double-again", "math", "Fours: Double, Then Double Again",
      "A multiplication fact is groups. 4 × 3 means 4 groups of 3. You already know your 2s, and 4 groups is 2 groups plus 2 more groups. So to find a 4s fact, find the 2s fact first and then double the answer. 4 × 3: 2 × 3 = 6, and double 6 is 6 + 6 = 12. Also, anything times 0 is 0, because zero groups, or groups with nothing in them, is nothing.",
      "4 × 3. Step 1: 2 × 3 = 6. Step 2: double 6: 6 + 6 = 12. So 4 × 3 = 12.\n\n0 × 8 = 0. There are zero groups of 8, so there is nothing. 8 × 0 = 0 too.", [
        money("1a", "2 × 4 = ?", 8, "4 + 4 = 8. INTENTIONAL REPEAT (Week 14): he needs to see facts more than once."),
        money("1b", "Double it. 8 + 8 = ?", 16, "8 + 8 = 16."),
        money("1c", "So 4 × 4 = ?", 16, "INTENTIONAL REPEAT (Week 13): he needs to see facts more than once."),
        money("2a", "2 × 5 = ?", 10, "5 + 5 = 10. INTENTIONAL REPEAT (Week 14): he needs to see facts more than once."),
        money("2b", "Double it. So 4 × 5 = ?", 20, "10 + 10 = 20."),
        money("3", "4 × 6 = ? Hint: 2 × 6 = 12, then double it.", 24, "12 + 12 = 24."),
        money("4", "9 × 0 = ?", 0, "Anything times 0 is 0."),
      ]),
    Sheet("groups-of-four", "word-problems", "Groups of Four",
      "Some stories have equal groups. When every group is the same size and you want the total, you multiply. Read the story slowly, find how many groups there are and how many are in each group, and then multiply. Use your 4s: find the 2s fact first and double it.",
      "A car has 4 wheels. There are 3 cars. How many wheels in all? Clue: 'a car has 4' and 'there are 3 cars' mean equal groups, so MULTIPLY. 4 × 3: 2 × 3 = 6, and 6 + 6 = 12. Answer: 12 wheels.", [
        money("1", "A dog has 4 legs. There are 6 dogs. How many legs in all?", 24, "4 × 6 = 24. INTENTIONAL REPEAT (same fact as problem 3 on today's Math sheet): he needs to see facts more than once."),
        money("2", "A table has 4 legs. There are 4 tables. How many legs in all?", 16, "4 × 4 = 16. INTENTIONAL REPEAT (Math problem 1c today and Week 13): he needs to see facts more than once."),
        money("3", "Ivy has 5 bags. Each bag has 4 apples. How many apples in all?", 20, "5 × 4 = 20. INTENTIONAL REPEAT (Math problem 2b today): he needs to see facts more than once."),
      ]),
    bible14Choice('thursday'),
  ]),
  tuesday: Day([
    Sheet("fives-and-tens-nickels-and-dimes", "math", "Fives and Tens: Nickels and Dimes",
      "A nickel is worth 5 cents, so counting nickels is counting by 5s. 3 nickels: 5, 10, 15, so 5 × 3 = 15. A dime is worth 10 cents, so counting dimes is counting by 10s. 6 dimes: 10, 20, 30, 40, 50, 60, so 10 × 6 = 60. Here is a tip. Every 5s answer ends in 5 or 0, and every 10s answer ends in 0. Your 5s will help you tomorrow with your 7s.",
      "5 × 3. Count 3 nickels: 5, 10, 15. 5 × 3 = 15.\n\n10 × 6. Count 6 dimes: 10, 20, 30, 40, 50, 60. 10 × 6 = 60.\n\n4 × 4. 2 × 4 = 8, and double 8 is 16. 4 × 4 = 16.", [
        money("1", "5 × 2 = ?", 10, "2 nickels = 10. INTENTIONAL REPEAT (Week 14): he needs to see facts more than once."),
        money("2", "5 × 6 = ?", 30, "6 nickels = 30."),
        money("3", "5 × 8 = ?", 40, "8 nickels = 40."),
        pile("4", "Count this pile of coins. Type the total in dollars, like 0.84: 7 nickels.", { nickel: 7 }, 35, "7 × 5 = 35 cents = 0.35. INTENTIONAL REPEAT (5 × 7, Weeks 13 and 14): he needs to see facts more than once."),
        money("5", "10 × 8 = ?", 80, "8 dimes = 80."),
        money("6", "4 × 6 = ?", 24, "2 × 6 = 12, double it. INTENTIONAL REPEAT (Monday): he needs to see facts more than once."),
        money("7", "4 × 5 = ?", 20, "2 × 5 = 10, double it. INTENTIONAL REPEAT (Monday): he needs to see facts more than once."),
      ]),
    codeQuest13(),
    bible14Fri("Write 1 or 2 sentences."),
  ]),
  wednesday: Day([
    Sheet("sevens-five-groups-plus-two-groups", "math", "Sevens: Five Groups Plus Two Groups",
      "Seven is five plus two. So 7 groups is 5 groups plus 2 more groups. You know your 5s from yesterday, and you know your 2s. To find a 7s fact, find the 5s fact, find the 2s fact, and add them. 7 × 4: 5 × 4 = 20, 2 × 4 = 8, and 20 + 8 = 28. Write the two parts, then add.",
      "7 × 3. Step 1: 5 × 3 = 15. Step 2: 2 × 3 = 6. Step 3: 15 + 6 = 21. So 7 × 3 = 21.\n\n7 × 6. Step 1: 5 × 6 = 30. Step 2: 2 × 6 = 12. Step 3: 30 + 12 = 42. So 7 × 6 = 42.\n\n4 × 3. 2 × 3 = 6, and double 6 is 12. 4 × 3 = 12.", [
        money("1a", "5 × 4 = ?", 20, "INTENTIONAL REPEAT (same fact as 4 × 5, Monday and Tuesday): he needs to see facts more than once."),
        money("1b", "2 × 4 = ?", 8, "INTENTIONAL REPEAT (Monday and Week 14): he needs to see facts more than once."),
        money("1c", "Add your two answers. 7 × 4 = ?", 28, "20 + 8 = 28. INTENTIONAL REPEAT (4 × 7, Weeks 13 and 14): he needs to see facts more than once."),
        money("2a", "5 × 5 = ?", 25, "5 nickels = 25."),
        money("2b", "2 × 5 = ?", 10, "INTENTIONAL REPEAT (Monday): he needs to see facts more than once."),
        money("2c", "Add your two answers. 7 × 5 = ?", 35, "25 + 10 = 35. INTENTIONAL REPEAT (5 × 7, Weeks 13 and 14, and Tuesday's count-the-pile): he needs to see facts more than once."),
        money("3", "7 × 10 = ? Hint: 5 × 10 = 50 and 2 × 10 = 20.", 70, "50 + 20 = 70. INTENTIONAL REPEAT (Week 13): he needs to see facts more than once."),
      ]),
    codeQuest13(),
    bible15Choice('wednesday'),
  ]),
  thursday: Day([
    Sheet("sevens-again-and-more-fours", "math", "Sevens Again, and More Fours",
      "Today you use both tricks again. For a 7s fact, add a 5s fact and a 2s fact. For a 4s fact, find the 2s fact and double it. Doing the same steps again is how they stick. Notice that 4 × 7 and 7 × 4 are the same fact: 4 groups of 7 or 7 groups of 4 give the same total, 28.",
      "7 × 8. Step 1: 5 × 8 = 40. Step 2: 2 × 8 = 16. Step 3: 40 + 16 = 56. So 7 × 8 = 56.\n\n4 × 7. Step 1: 2 × 7 = 14. Step 2: double 14: 14 + 14 = 28. So 4 × 7 = 28.\n\n4 × 8. Step 1: 2 × 8 = 16. Step 2: double 16: 16 + 16 = 32. So 4 × 8 = 32.", [
        money("1", "7 × 2 = ?", 14, "7 + 7 = 14."),
        money("2a", "5 × 6 = ?", 30, "INTENTIONAL REPEAT (Tuesday): he needs to see facts more than once."),
        money("2b", "2 × 6 = ?", 12, "INTENTIONAL REPEAT (Week 14): he needs to see facts more than once."),
        money("2c", "Add your two answers. 7 × 6 = ?", 42, "30 + 12 = 42. INTENTIONAL REPEAT (Wednesday's worked example): he needs to see facts more than once."),
        money("3", "4 × 9 = ? Hint: 2 × 9 = 18, then double it.", 36, "18 + 18 = 36. INTENTIONAL REPEAT (Weeks 13 and 14): he needs to see facts more than once."),
        money("4", "4 × 10 = ?", 40, "4 × 10 = 40. INTENTIONAL REPEAT (Week 14): he needs to see facts more than once."),
        money("5", "7 × 3 = ?", 21, "5 × 3 + 2 × 3 = 15 + 6 = 21. INTENTIONAL REPEAT (Wednesday's worked example): he needs to see facts more than once."),
      ]),
    Sheet("groups-of-seven", "word-problems", "Groups of Seven",
      "Read the story and find how many groups there are and how many are in each group. When the groups are equal and you want the total, multiply. For a 7s fact, add a 5s fact and a 2s fact.",
      "A week has 7 days. There are 5 weeks. How many days in all? Clue: 'a week has 7' and 'there are 5 weeks' mean equal groups, so MULTIPLY. 7 × 5: 5 × 5 = 25, 2 × 5 = 10, and 25 + 10 = 35. Answer: 35 days.", [
        money("1", "A week has 7 days. There are 4 weeks. How many days in all?", 28, "4 × 7 = 28. INTENTIONAL REPEAT (Wednesday and Thursday's worked example): he needs to see facts more than once."),
        money("2", "Gus has 6 packs. Each pack has 7 stickers. How many stickers in all?", 42, "6 × 7 = 42. INTENTIONAL REPEAT (Math problem 2c today): he needs to see facts more than once."),
        money("3", "A shelf holds 7 books. There are 3 shelves. How many books in all?", 21, "3 × 7 = 21. INTENTIONAL REPEAT (Math problem 5 today): he needs to see facts more than once."),
      ]),
    bible15Choice('thursday'),
  ]),
  friday: Day([
    Sheet("show-what-you-know", "math", "Show What You Know",
      "No steps are written out today, so use the tricks yourself. For a 4s fact, find the 2s fact and double it. For a 5s fact, count nickels. For a 7s fact, add a 5s fact and a 2s fact. If you get stuck, go back to the worked example and follow the same steps one at a time. The last item asks how sure you feel.",
      "7 × 7. Step 1: 5 × 7 = 35. Step 2: 2 × 7 = 14. Step 3: 35 + 14 = 49. So 7 × 7 = 49.\n\nWhat percent of a dollar is 1 quarter and 1 nickel? 25 + 5 = 30 cents. 30 out of 100 is 30 percent. Answer: 30%.", [
        money("1", "4 × 7 = ?", 28, "2 × 7 = 14, double it. INTENTIONAL REPEAT (Weeks 13 and 14, Wednesday, Thursday): he needs to see facts more than once."),
        money("2", "5 × 9 = ?", 45, "9 nickels = 45. INTENTIONAL REPEAT (Weeks 13 and 14): he needs to see facts more than once."),
        money("3", "7 × 6 = ?", 42, "30 + 12 = 42. INTENTIONAL REPEAT (Wednesday and Thursday): he needs to see facts more than once."),
        money("4", "4 × 10 = ?", 40, "INTENTIONAL REPEAT (Week 14 and Thursday): he needs to see facts more than once."),
        money("5", "8 × 5 = ?", 40, "INTENTIONAL REPEAT (5 × 8, Tuesday): he needs to see facts more than once."),
        money("6", "7 × 8 = ?", 56, "40 + 16 = 56. INTENTIONAL REPEAT (Thursday's worked example): he needs to see facts more than once."),
        money("7", "What percent of a dollar is 2 quarters and 1 dime? Type the number, like 10.", 60, "50 + 10 = 60 cents. 60 out of 100 = 60%. This is the only percent item this week."),
        Item("8", 'scale', "How sure do you feel about your 4s facts? (1 = not sure, 5 = very sure)", { scaleMax: 5, parentNote: "Any number from 1 to 5 is fine. Jesse can use it to see how he feels." }),
      ]),
    Sheet("coins-and-groups", "word-problems", "Coins and Groups",
      "Coins make equal groups. 6 nickels is 6 groups of 5 cents, so you multiply 5 × 6. Read the story, find how many groups there are and how many cents are in each group, and then multiply.",
      "Luz has 6 nickels. How many cents does she have? A nickel is 5 cents. 6 groups of 5 means MULTIPLY. 5 × 6 = 30. Answer: 30 cents.", [
        money("1", "Ana has 7 dimes. How many cents does she have?", 70, "7 × 10 = 70. INTENTIONAL REPEAT (Week 13 and Wednesday): he needs to see facts more than once."),
        money("2", "Gus has 9 nickels. How many cents does he have?", 45, "9 × 5 = 45. INTENTIONAL REPEAT (Weeks 13 and 14, and Math problem 2 today): he needs to see facts more than once."),
        money("3", "There are 8 bags with 5 oranges in each bag. How many oranges in all?", 40, "8 × 5 = 40. INTENTIONAL REPEAT (Tuesday and Math problem 5 today): he needs to see facts more than once."),
      ]),
    bible15Fri("Write 1 or 2 sentences."),
  ]),
}, '2026-10-26');

export const DAILY_WORK = deepFreeze({
  guided: { weeks: { 'week-11': guided, 'week-12': guided12, 'week-13': guided13, 'week-14': guided14, 'week-15': guided15, 'week-16': guided16 } },
  standard: { weeks: { 'week-11': standard, 'week-12': standard12, 'week-13': standard13, 'week-14': standard14, 'week-15': standard15, 'week-16': standard16 } },
});

export function getWeek(track, weekId) {
  return DAILY_WORK[track]?.weeks?.[weekId] || null;
}
