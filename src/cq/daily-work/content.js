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

// Week 17 (Monday 2026-11-02): percent of an amount and multiplication facts.
// Math, Word Problems, and Bible Reading wording and parent notes come from the Week 17 Drive docs.
const bible17Monday = () => bibleChoice('Exodus 19:1-14, then 19:16-25', [
  choice("q1", "At the start of Exodus 19, what did God remind the people He had done for them?", ["He carried them out of Egypt on eagles' wings and brought them to Himself","He built them a city to live in, with strong walls and a home for every family","He gave them a king to lead them"], "A", "Exodus 19:4. God reminded them that He carried them out of Egypt on eagles' wings and brought them to Himself. He rescued them first, before giving any rules."),
  choice("q2", "God said that if they obeyed Him, what would they be?", ["The richest nation on earth","His treasured possession","The rulers over Egypt"], "B", "Exodus 19:5-6. If they obeyed Him and kept His covenant, they would be His treasured possession, a kingdom of priests and a holy nation."),
  choice("q3", "What happened on the third day at the mountain?", ["A soft rain fell and everything was quiet, so the people packed up and went home before noon","Nothing happened, and Moses came down early","Thunder, lightning, a thick cloud and a loud trumpet, and the whole mountain shook"], "C", "Exodus 19:16-18. On the third day there was thunder and lightning, a thick cloud, a very loud trumpet and smoke, and the whole mountain shook."),
]);
const bible17Friday = () => bibleChoice('Matthew 22:34-40, then Luke 10:25-37', [
  choice("q1", "An expert in the law asked Jesus which commandment is the greatest. What did Jesus say?", ["Never work on the Sabbath, because resting is the greatest commandment of all","Love the Lord your God with all your heart, soul and mind","Give away everything you own"], "B", "Matthew 22:34-38. Jesus said the first and greatest commandment is to love the Lord your God with all your heart, soul and mind."),
  choice("q2", "What did Jesus say the second commandment is?", ["Obey the king","Pray three times a day without fail","Love your neighbor as yourself"], "C", "Matthew 22:39. The second is like the first: love your neighbor as yourself. Verse 40 says all the Law and the Prophets hang on these two commandments, which is the Sunday lesson point."),
  choice("q3", "In Jesus' story, a hurt man lay on the road. Who stopped to help him?", ["A priest","A Levite","A Samaritan"], "C", "Luke 10:30-37. The priest and the Levite both walked past. The Samaritan stopped, cared for the man and paid for his room. Jesus ends by saying the neighbor is the one who showed mercy, and to go and do the same."),
]);
const bible17Wednesday = (guided) => bibleReading('Exodus 20:1-21',
  guided ? "Exodus 20 gives ten commands. Pick one command about how to treat God and one about how to treat people. Say what each one asks you to do. Write 1 or 2 sentences." : "Exodus 20 gives ten commands. Pick one command about how to treat God and one about how to treat people. Say what each one asks you to do. Write 2 sentences.",
  "A good answer picks one command about God (verses 3-11: no other gods, no idols, do not misuse God's name, keep the Sabbath day) and one about people (verses 12-17: honor your father and mother, and no murder, adultery, stealing, lying or coveting), and says what each one asks in plain words. Any one from each group is right. If the boys ask: verse 2 comes first on purpose, because God says He brought them out of Egypt before He gives any rule. Adultery (verse 14) means being unfaithful to a husband or wife. Coveting (verse 17) means wanting what belongs to someone else. Verses 5-6 are tricky. A simple way to say it is that sin hurts families, and God's love lasts far longer.");
const standard17 = Week('week-17', 'Week 17', [
  Sheet('memory-verse', 'memory-verse', 'Memory Verse', null, null, [
    Item('verse', 'fill-blank', "Don't worry about anything; instead, ___ about everything. Tell God what you need, and ___ him for all he has done. Then you will experience God's ___, which exceeds anything we can understand. His peace will guard your hearts and minds as you live in Christ Jesus.", { wordBank: ["pray","thank","peace"], answer: ["pray","thank","peace"] }),
  ], { citation: "Philippians 4:6-7 (NLT)" }),
], {
  monday: Day([
    Sheet("percent-is-a-decimal", "math", "Percent Is a Decimal",
      "Percent means 'out of 100'. 35% is 35 out of 100, which is 0.35. So finding 35% of 60 is the same as multiplying: 0.35 × 60. You already know how: ignore the decimal point and multiply (35 × 60 = 2100), then count the decimal places in 0.35 (two) and put the decimal point back: 21.00, which is 21. Use your benchmark percents to check the answer. 35% is between 25% and 50%. 25% of 60 is 15 and 50% of 60 is 30, so the answer should be between 15 and 30. 21 fits.",
      "35% of 60. Write 35% as 0.35. Ignore the decimal point: 35 × 60 = 2100. 0.35 has 2 decimal places: 21.00, which is 21. Check: 25% of 60 is 15 and 50% of 60 is 30, and 21 is between them.\n\n8% of 50. Write 8% as 0.08. Ignore the decimal point: 8 × 50 = 400. 0.08 has 2 decimal places: 4.00, which is 4. Check: 10% of 50 is 5, and 8% is a little less. 4 fits.", [
        money("1a", "Write 45% as a decimal.", 0.45, "45 out of 100 = 0.45."),
        money("1b", "What is 45% of 40?", 18, "0.45 × 40: 45 × 40 = 1800; 2 places = 18.00. Accept 18, 18.0 or 18.00."),
        money("2a", "Write 6% as a decimal.", 0.06, "6 out of 100 = 0.06."),
        money("2b", "What is 6% of 25?", 1.5, "0.06 × 25: 6 × 25 = 150; 2 places = 1.50. Accept 1.5 or 1.50."),
        money("3a", "Write 15% as a decimal.", 0.15, "15 out of 100 = 0.15."),
        money("3b", "What is 15% of 80?", 12, "0.15 × 80: 15 × 80 = 1200; 2 places = 12.00. Accept 12, 12.0 or 12.00."),
        money("4", "What is 20% of 85?", 17, "0.20 × 85: 20 × 85 = 1700; 2 places = 17.00. Check: 10% of 85 is 8.5, so 20% is 17."),
        money("5", "What is 75% of 36?", 27, "0.75 × 36: 75 × 36 = 2700; 2 places = 27.00. Check: 75% is three quarters, and 36 ÷ 4 = 9, so 9 × 3 = 27."),
      ]),
    Sheet("tithe-savings-and-spending", "word-problems", "Tithe, Savings and Spending",
      "Money stories often use percents. Your tithe is 10% of what you earn. A savings jar might get 25%. To find the amount, write the percent as a decimal and multiply by what you earned. 10% is 0.10, and 25% is 0.25. Use a benchmark to check: 10% is one tenth of the total, and 25% is one quarter.",
      "You earned $38 this month. Your tithe is 10%. How much is your tithe? Write 10% as 0.10. Ignore the decimal point: 10 × 38 = 380. 0.10 has 2 decimal places: 3.80. Answer: $3.80. Check: one tenth of 38 is a little less than 4. It fits.", [
        money("1", "You earned $65 this month. Your tithe is 10%. How much is your tithe, in dollars?", 6.5, "0.10 × 65 = 6.50. Accept 6.5 or 6.50."),
        money("2", "You earned $48. You save 25% of it. How much do you save, in dollars?", 12, "0.25 × 48 = 12.00. Check: one quarter of 48 is 12. Accept 12, 12.0 or 12.00."),
        money("3", "You earned $72. You spend 70% of it. How much do you spend, in dollars?", 50.4, "0.70 × 72: 70 × 72 = 5040; 2 places = 50.40. Accept 50.4 or 50.40."),
      ]),
    bible17Monday(),
  ]),
  tuesday: Day([
    Sheet("sales-tax-a-percent-on-top-of-the-price", "math", "Sales Tax: A Percent on Top of the Price",
      "Sales tax is a percent of the price that the store adds on top. If the tax is 8% and the price is $25, the tax is 0.08 × 25 = 2.00. Then add it to the price to find the total: 25 + 2 = 27. The steps are: write the percent as a decimal, multiply to find the tax, then add the tax to the price. Check with a benchmark: 8% is a little less than 10%, and 10% of 25 is 2.50, so the tax should be a little less than $2.50. $2 fits.",
      "A $20 book with 8% tax. Tax: 0.08 × 20. Ignore the decimal point: 8 × 20 = 160. 2 decimal places: 1.60. The tax is $1.60. Total: 20 + 1.60 = 21.60. Answer: $21.60.\n\nA $45 shirt with 6% tax. Tax: 0.06 × 45. Ignore the decimal point: 6 × 45 = 270. 2 decimal places: 2.70. The tax is $2.70. Total: 45 + 2.70 = 47.70. Answer: $47.70.", [
        money("1a", "Write 7% as a decimal.", 0.07, "7 out of 100 = 0.07."),
        money("1b", "A jacket costs $30. The tax is 7%. How much is the tax, in dollars?", 2.1, "0.07 × 30: 7 × 30 = 210; 2 places = 2.10. Accept 2.1 or 2.10."),
        money("1c", "What is the total for the jacket, in dollars?", 32.1, "30 + 2.10 = 32.10. Accept 32.1 or 32.10."),
        money("2a", "Write 9% as a decimal.", 0.09, "9 out of 100 = 0.09."),
        money("2b", "A game costs $50. The tax is 9%. How much is the tax, in dollars?", 4.5, "0.09 × 50: 9 × 50 = 450; 2 places = 4.50. Accept 4.5 or 4.50."),
        money("2c", "What is the total for the game, in dollars?", 54.5, "50 + 4.50 = 54.50. Accept 54.5 or 54.50."),
        money("3a", "A bike helmet costs $80. The tax is 5%. How much is the tax, in dollars?", 4, "0.05 × 80: 5 × 80 = 400; 2 places = 4.00. Accept 4, 4.0 or 4.00."),
        money("3b", "What is the total for the helmet, in dollars?", 84, "80 + 4 = 84."),
        money("4", "A pair of shoes costs $24. The tax is 8%. How much is the tax, in dollars?", 1.92, "0.08 × 24: 8 × 24 = 192; 2 places = 1.92."),
      ]),
    codeQuest13(),
  ]),
  wednesday: Day([
    Sheet("percent-off-pay-what-is-left", "math", "Percent Off: Pay What Is Left",
      "When a sale takes 20% off, you still pay the other 80%. 100% − 20% = 80%. So the sale price is 0.80 times the original price. The steps are: subtract the discount from 100% to find what percent you pay, write that percent as a decimal, then multiply by the price. Check with a benchmark: 25% off means you pay three quarters, and 50% off means you pay half.",
      "$40 shoes, 25% off. You pay 100% − 25% = 75%. Write 75% as 0.75. Ignore the decimal point: 75 × 40 = 3000. 2 decimal places: 30.00. Answer: $30. Check: three quarters of 40 is 30.\n\n$55 game, 20% off. You pay 100% − 20% = 80%. Write 80% as 0.80. Ignore the decimal point: 80 × 55 = 4400. 2 decimal places: 44.00. Answer: $44. Check: 10% of 55 is 5.50, so 20% off is about 11 less, and 55 − 11 = 44.", [
        money("1a", "A backpack costs $60 and is 30% off. What percent do you pay?", 70, "100 − 30 = 70."),
        money("1b", "How much do you pay for the backpack, in dollars?", 42, "0.70 × 60: 70 × 60 = 4200; 2 places = 42.00. Accept 42, 42.0 or 42.00."),
        money("2a", "A jacket costs $90 and is 10% off. What percent do you pay?", 90, "100 − 10 = 90."),
        money("2b", "How much do you pay for the jacket, in dollars?", 81, "0.90 × 90: 90 × 90 = 8100; 2 places = 81.00. Check: 10% of 90 is 9, and 90 − 9 = 81."),
        money("3", "A shirt costs $44 and is 25% off. How much do you pay, in dollars?", 33, "0.75 × 44: 75 × 44 = 3300; 2 places = 33.00. Check: one quarter of 44 is 11, and 44 − 11 = 33."),
        money("4", "A bike costs $120 and is 15% off. How much do you pay, in dollars?", 102, "100 − 15 = 85. 0.85 × 120: 85 × 120 = 10200; 2 places = 102.00. Check: 10% of 120 is 12 and 5% is 6, so 18 off, and 120 − 18 = 102."),
        money("5", "A lamp costs $35 and is 20% off. How much do you pay, in dollars?", 28, "0.80 × 35: 80 × 35 = 2800; 2 places = 28.00. Check: 20% of 35 is 7, and 35 − 7 = 28."),
      ]),
    codeQuest13(),
    bible17Wednesday(false),
  ]),
  thursday: Day([
    Sheet("estimate-first-then-find-the-exact-answer", "math", "Estimate First, Then Find the Exact Answer",
      "Estimate first, because it catches mistakes. Round the percent to a benchmark you know (10%, 25%, 50%), find that, and then work out the exact answer with a decimal. For 18% of 50, round to 20%: 20% of 50 is 10, so the answer should be a little less than 10. The exact answer is 0.18 × 50 = 9. The same steps work for tax (add it to the price), for discounts (pay what is left), and for tips and tithes.",
      "18% of 50. Estimate: 18% is close to 20%, and 20% of 50 is 10, so a little less than 10. Exact: 0.18 × 50. Ignore the decimal point: 18 × 50 = 900. 2 decimal places: 9.00, which is 9. It fits the estimate.\n\n$80 shoes, 35% off. Estimate: 35% is between 25% and 50%, so the discount is between 20 and 40. Exact: 0.35 × 80. Ignore the decimal point: 35 × 80 = 2800. 2 decimal places: 28.00. You save $28, so you pay 80 − 28 = $52.\n\n$90 headphones with 7% tax. Estimate: 7% is a little less than 10%, and 10% of 90 is 9, so the tax is a little less than 9. Exact: 0.07 × 90. Ignore the decimal point: 7 × 90 = 630. 2 decimal places: 6.30. The tax is $6.30, so the total is 90 + 6.30 = $96.30.", [
        money("1a", "Estimate: round 48% to 50%. What is half of 90?", 45, "90 ÷ 2 = 45."),
        money("1b", "What is 48% of 90?", 43.2, "0.48 × 90: 48 × 90 = 4320; 2 places = 43.20. Accept 43.2 or 43.20. It should be a little less than 45."),
        money("2a", "Estimate: round 11% to 10%. What is 10% of 70?", 7, "70 ÷ 10 = 7."),
        money("2b", "What is 11% of 70?", 7.7, "0.11 × 70: 11 × 70 = 770; 2 places = 7.70. Accept 7.7 or 7.70. It should be a little more than 7."),
        money("3", "A jacket costs $52 and is 15% off. How much do you pay, in dollars?", 44.2, "100 − 15 = 85. 0.85 × 52: 85 × 52 = 4420; 2 places = 44.20. Accept 44.2 or 44.20."),
        money("4", "A game costs $75. The tax is 6%. What is the total, in dollars?", 79.5, "0.06 × 75 = 4.50. 75 + 4.50 = 79.50. Accept 79.5 or 79.50."),
        money("5", "A TV costs $140 and is 20% off. How much do you pay, in dollars?", 112, "0.80 × 140: 80 × 140 = 11200; 2 places = 112.00. Check: 20% of 140 is 28, and 140 − 28 = 112."),
        money("6", "The tax is 5% on a $36 purchase. How much is the tax, in dollars?", 1.8, "0.05 × 36: 5 × 36 = 180; 2 places = 1.80. Accept 1.8 or 1.80."),
      ]),
    Sheet("percents-in-real-life", "word-problems", "Percents in Real Life",
      "A story may use a percent for a tithe, savings, a tip or a sale. Find the percent and the amount it applies to. Write the percent as a decimal, multiply, and check with a benchmark. When the story has several steps, do them in order and write each answer where it belongs.",
      "You earn $56. You give 10% as your tithe and save 25%. How much is left? Step 1: tithe = 0.10 × 56 = 5.60. Step 2: savings = 0.25 × 56 = 14.00. Step 3: left = 56 − 5.60 − 14.00 = 36.40. Answer: $36.40.", [
        money("1", "You earn $80. You give 10%, save 20%, and spend the rest. How much do you spend, in dollars?", 56, "Give: 0.10 × 80 = 8. Save: 0.20 × 80 = 16. Spend: 80 − 8 − 16 = 56. Check: 70% of 80 is 56."),
        money("2", "A restaurant bill is $40. You leave a 15% tip. How much is the tip, in dollars?", 6, "0.15 × 40: 15 × 40 = 600; 2 places = 6.00. Check: 10% of 40 is 4 and 5% is 2, so 6."),
        money("3", "You buy a $32 game with 8% tax. What is the total, in dollars?", 34.56, "Tax: 0.08 × 32: 8 × 32 = 256; 2 places = 2.56. Total: 32 + 2.56 = 34.56."),
      ]),
  ]),
  friday: Day([
    Sheet("show-what-you-know", "math", "Show What You Know",
      "No steps are written out today, so use them yourself. Estimate with a benchmark, write the percent as a decimal, ignore the decimal point and multiply, count the decimal places, and put the point back. For discounts, remember to pay what is left. For tax, remember to add it to the price.",
      "65% of 80. Estimate: 65% is between 50% and 75%, so between 40 and 60. Exact: 0.65 × 80. Ignore the decimal point: 65 × 80 = 5200. 2 decimal places: 52.00. Answer: 52.\n\n$90 coat, 30% off. You pay 100% − 30% = 70%. 0.70 × 90: 70 × 90 = 6300; 2 decimal places: 63.00. Answer: $63.", [
        money("1", "What is 45% of 60?", 27, "0.45 × 60: 45 × 60 = 2700; 2 places = 27.00."),
        money("2", "What is 12% of 75?", 9, "0.12 × 75: 12 × 75 = 900; 2 places = 9.00."),
        money("3", "A shirt costs $85 and is 20% off. How much do you pay, in dollars?", 68, "0.80 × 85: 80 × 85 = 6800; 2 places = 68.00."),
        money("4", "A meal costs $44. The tax is 9%. What is the total, in dollars?", 47.96, "Tax: 0.09 × 44: 9 × 44 = 396; 2 places = 3.96. Total: 44 + 3.96 = 47.96."),
        money("5", "What is 35% of $140? Type the number of dollars.", 49, "0.35 × 140: 35 × 140 = 4900; 2 places = 49.00."),
        money("6", "What is 6% of 250?", 15, "0.06 × 250: 6 × 250 = 1500; 2 places = 15.00."),
      ]),
    Sheet("percent-stories-on-your-own", "word-problems", "Percent Stories on Your Own",
      "Read each story twice. Find the percent and the amount it applies to, write the percent as a decimal, multiply, and check with a benchmark. There are no steps written out today, because you know them now.",
      "You earn $120 doing chores in a month. You give 10% and save 30%. How much is left? Step 1: tithe = 0.10 × 120 = 12. Step 2: savings = 0.30 × 120 = 36. Step 3: left = 120 − 12 − 36 = 72. Answer: $72.", [
        money("1", "A game costs $64 and is 25% off. What is the sale price, in dollars?", 48, "0.75 × 64: 75 × 64 = 4800; 2 places = 48.00. Check: one quarter of 64 is 16, and 64 − 16 = 48."),
        money("2", "You earn $150. You save 30% of it. How much do you save, in dollars?", 45, "0.30 × 150: 30 × 150 = 4500; 2 places = 45.00."),
        money("3", "A meal costs $20 and you leave a 15% tip. What is the total with the tip, in dollars?", 23, "Tip: 0.15 × 20 = 3.00. Total: 20 + 3 = 23."),
        note("4", "In one sentence, explain why finding 20% off is the same as paying 80%.", "A good answer says that if 20% comes off, the other 80% is what is left to pay, so you can multiply by 0.80."),
      ]),
    bible17Friday(),
  ]),
}, '2026-11-02');
const guided17 = Week('week-17', 'Week 17', [
  Sheet('memory-verse', 'memory-verse', 'Memory Verse', null, null, [
    Item('verse', 'fill-blank', "For I can do everything through ___, who gives me ___.", { wordBank: ["Christ","strength"], answer: ["Christ","strength"] }),
  ], { citation: "Philippians 4:13 (NLT)" }),
], {
  monday: Day([
    Sheet("fours-two-ways", "math", "Fours Two Ways",
      "There are two ways to find a 4s fact, and they check each other. Way 1: find the 2s fact and double it. 4 × 7: 2 × 7 = 14, and 14 + 14 = 28. Way 2: find the 5s fact and take away one group. You know your 5s. 4 × 7: 5 × 7 = 35, and 35 − 7 = 28. Both ways give 28. If your two ways match, you can trust the answer.",
      "4 × 7. Way 1: 2 × 7 = 14, and 14 + 14 = 28. Way 2: 5 × 7 = 35, and 35 − 7 = 28. Both give 28. So 4 × 7 = 28.\n\n4 × 8. Way 1: 2 × 8 = 16, and 16 + 16 = 32. Way 2: 5 × 8 = 40, and 40 − 8 = 32. Both give 32. So 4 × 8 = 32.", [
        withNote(times("1a", 5, 6), "INTENTIONAL REPEAT (Week 16): he needs to see facts more than once."),
        money("1b", "Take away one group of 6. 30 − 6 = ?", 24, "30 − 6 = 24."),
        money("1c", "So 4 × 6 = ?", 24, "INTENTIONAL REPEAT (Weeks 16 and earlier): he needs to see facts more than once."),
        withNote(times("2a", 5, 9), "INTENTIONAL REPEAT (Weeks 13, 14 and 16): he needs to see facts more than once."),
        money("2b", "Take away one group of 9. 45 − 9 = ?", 36, "45 − 9 = 36."),
        money("2c", "So 4 × 9 = ?", 36, "INTENTIONAL REPEAT (Weeks 13, 14 and 16): he needs to see facts more than once."),
        withNote(times("3", 4, 10), "INTENTIONAL REPEAT (Weeks 14 and 16): he needs to see facts more than once."),
      ]),
    Sheet("groups-of-four", "word-problems", "Groups of Four",
      "When every group is the same size and you want the total, you multiply. Read the story slowly, find how many groups there are and how many are in each group, and then multiply. Use your two ways for the 4s: double the 2s fact, or take one group away from the 5s fact.",
      "A chair has 4 legs. There are 7 chairs. How many legs in all? Clue: 'a chair has 4' and 'there are 7 chairs' mean equal groups, so MULTIPLY. 4 × 7: 5 × 7 = 35, and 35 − 7 = 28. Answer: 28 legs.", [
        money("1", "A cow has 4 legs. There are 9 cows. How many legs in all?", 36, "4 × 9 = 36. INTENTIONAL REPEAT (Math problem 2c today): he needs to see facts more than once."),
        money("2", "A pack has 4 pencils. Cal buys 8 packs. How many pencils in all?", 32, "4 × 8 = 32. INTENTIONAL REPEAT (Math worked example today): he needs to see facts more than once."),
        money("3", "Rae has 6 boxes. Each box has 4 crayons. How many crayons in all?", 24, "6 × 4 = 24. INTENTIONAL REPEAT (Math problem 1c today): he needs to see facts more than once."),
      ]),
    bible17Monday(),
  ]),
  tuesday: Day([
    Sheet("sevens-again-five-groups-plus-two-groups", "math", "Sevens Again: Five Groups Plus Two Groups",
      "Seven is five plus two. So a 7s fact is a 5s fact plus a 2s fact. You know your 5s and your 2s. 7 × 4: 5 × 4 = 20, 2 × 4 = 8, and 20 + 8 = 28. Write the two parts, then add. Last week you did this with smaller facts. Today the facts get bigger, and the steps are the same.",
      "7 × 9. Step 1: 5 × 9 = 45. Step 2: 2 × 9 = 18. Step 3: 45 + 18 = 63. So 7 × 9 = 63.\n\n7 × 4. Step 1: 5 × 4 = 20. Step 2: 2 × 4 = 8. Step 3: 20 + 8 = 28. So 7 × 4 = 28.", [
        withNote(times("1a", 5, 8), "INTENTIONAL REPEAT (Weeks 16 and earlier): he needs to see facts more than once."),
        withNote(times("1b", 2, 8), "8 + 8 = 16."),
        money("1c", "Add your two answers. 7 × 8 = ?", 56, "40 + 16 = 56. INTENTIONAL REPEAT (Week 16): he needs to see facts more than once."),
        withNote(times("2a", 5, 6), "INTENTIONAL REPEAT (Week 16): he needs to see facts more than once."),
        withNote(times("2b", 2, 6), "6 + 6 = 12."),
        money("2c", "Add your two answers. 7 × 6 = ?", 42, "30 + 12 = 42. INTENTIONAL REPEAT (Week 16): he needs to see facts more than once."),
        money("3", "7 × 7 = ? Hint: 5 × 7 = 35 and 2 × 7 = 14.", 49, "35 + 14 = 49. INTENTIONAL REPEAT (Week 16 Friday's worked example): he needs to see facts more than once."),
      ]),
    codeQuest13(),
  ]),
  wednesday: Day([
    Sheet("fours-and-sevens-mixed", "math", "Fours and Sevens Mixed",
      "Today the 4s and 7s are mixed together. For a 4s fact, find the 5s fact and take away one group, or double the 2s fact. For a 7s fact, add a 5s fact and a 2s fact. Only the first problem has the steps written out. On the others, do the steps yourself.",
      "7 × 10. Step 1: 5 × 10 = 50. Step 2: 2 × 10 = 20. Step 3: 50 + 20 = 70. So 7 × 10 = 70.\n\n4 × 4. Step 1: 5 × 4 = 20. Step 2: take away one group of 4: 20 − 4 = 16. So 4 × 4 = 16. Check with double-double: 2 × 4 = 8, and 8 + 8 = 16.", [
        withNote(times("1a", 5, 7), "INTENTIONAL REPEAT (Weeks 13, 14 and 16): he needs to see facts more than once."),
        money("1b", "Take away one group of 7. 35 − 7 = ?", 28, "35 − 7 = 28."),
        money("1c", "So 4 × 7 = ?", 28, "INTENTIONAL REPEAT (Weeks 13, 14 and 16): he needs to see facts more than once."),
        withNote(times("2", 7, 3), "5 × 3 + 2 × 3 = 15 + 6 = 21. INTENTIONAL REPEAT (Week 16): he needs to see facts more than once."),
        withNote(times("3", 4, 8), "5 × 8 − 8 = 40 − 8 = 32. INTENTIONAL REPEAT (Week 16's worked example and Monday): he needs to see facts more than once."),
        withNote(times("4", 7, 9), "45 + 18 = 63. INTENTIONAL REPEAT (Tuesday's worked example): he needs to see facts more than once."),
        withNote(times("5", 4, 6), "5 × 6 − 6 = 24. INTENTIONAL REPEAT (Monday and Week 16): he needs to see facts more than once."),
      ]),
    codeQuest13(),
    bible17Wednesday(true),
  ]),
  thursday: Day([
    Sheet("fours-and-sevens-again", "math", "Fours and Sevens Again",
      "Today you do the 4s and 7s again, and a few 5s and 10s keep those facts warm. If you get stuck on a 4s fact, take one group away from the 5s fact. If you get stuck on a 7s fact, add a 5s fact and a 2s fact. Doing the same steps again and again is how facts stick. The last problem has its steps written out.",
      "7 × 6. Step 1: 5 × 6 = 30. Step 2: 2 × 6 = 12. Step 3: 30 + 12 = 42. So 7 × 6 = 42.\n\n4 × 3. Step 1: 5 × 3 = 15. Step 2: take away one group of 3: 15 − 3 = 12. So 4 × 3 = 12.", [
        withNote(times("1", 7, 4), "INTENTIONAL REPEAT (Weeks 13, 14 and 16): he needs to see facts more than once."),
        withNote(times("2", 4, 9), "INTENTIONAL REPEAT (Weeks 13, 14 and 16): he needs to see facts more than once."),
        withNote(times("3", 5, 7), "INTENTIONAL REPEAT (Weeks 13, 14 and 16): he needs to see facts more than once."),
        withNote(times("4", 10, 6), "INTENTIONAL REPEAT (Weeks 13 and 16): he needs to see facts more than once."),
        withNote(times("5a", 5, 8), "INTENTIONAL REPEAT (Week 16): he needs to see facts more than once."),
        withNote(times("5b", 2, 8), "8 + 8 = 16."),
        money("5c", "Add your two answers. 7 × 8 = ?", 56, "40 + 16 = 56. INTENTIONAL REPEAT (Week 16 and Tuesday): he needs to see facts more than once."),
      ]),
    Sheet("groups-of-seven", "word-problems", "Groups of Seven",
      "Read the story and find how many groups there are and how many are in each group. When the groups are equal and you want the total, multiply. For a 7s fact, add a 5s fact and a 2s fact.",
      "A week has 7 days. There are 6 weeks. How many days in all? Clue: 'a week has 7' and 'there are 6 weeks' mean equal groups, so MULTIPLY. 7 × 6: 5 × 6 = 30, 2 × 6 = 12, and 30 + 12 = 42. Answer: 42 days.", [
        money("1", "A box has 7 crayons. Jax has 4 boxes. How many crayons in all?", 28, "4 × 7 = 28. INTENTIONAL REPEAT (Math problem 1 today): he needs to see facts more than once."),
        money("2", "Fay has 7 bags. Each bag has 5 stickers. How many stickers in all?", 35, "7 × 5 = 35. INTENTIONAL REPEAT (Math problem 3 today): he needs to see facts more than once."),
        money("3", "A shelf has 7 books. There are 8 shelves. How many books in all?", 56, "7 × 8 = 56. INTENTIONAL REPEAT (Math problem 5c today): he needs to see facts more than once."),
      ]),
  ]),
  friday: Day([
    Sheet("show-what-you-know", "math", "Show What You Know",
      "No steps are written out today, so use the tricks yourself. For a 4s fact, take one group away from the 5s fact, or double the 2s fact. For a 7s fact, add a 5s fact and a 2s fact. If you get stuck, go back to the worked example and follow the same steps one at a time. The last item asks how sure you feel.",
      "7 × 8. Step 1: 5 × 8 = 40. Step 2: 2 × 8 = 16. Step 3: 40 + 16 = 56. So 7 × 8 = 56.\n\n4 × 9. Step 1: 5 × 9 = 45. Step 2: take away one group of 9: 45 − 9 = 36. So 4 × 9 = 36.", [
        withNote(times("1", 4, 6), "INTENTIONAL REPEAT (Monday and Wednesday): he needs to see facts more than once."),
        withNote(times("2", 7, 5), "INTENTIONAL REPEAT (Weeks 13, 14 and 16): he needs to see facts more than once."),
        withNote(times("3", 4, 8), "INTENTIONAL REPEAT (Monday and Wednesday): he needs to see facts more than once."),
        withNote(times("4", 7, 9), "INTENTIONAL REPEAT (Tuesday and Wednesday): he needs to see facts more than once."),
        withNote(times("5", 10, 7), "INTENTIONAL REPEAT (Week 13, Week 16 and Wednesday): he needs to see facts more than once."),
        withNote(times("6", 4, 7), "INTENTIONAL REPEAT (Weeks 13, 14 and 16, and Monday and Wednesday): he needs to see facts more than once."),
        withNote(times("7", 7, 6), "INTENTIONAL REPEAT (Tuesday and Thursday): he needs to see facts more than once."),
        Item("8", 'scale', "How sure do you feel about your 4s and 7s? (1 = not sure, 5 = very sure)", { scaleMax: 5, parentNote: "Any number from 1 to 5 is fine. Jesse can use it to see how he feels." }),
      ]),
    Sheet("groups-and-coins", "word-problems", "Groups and Coins",
      "Equal groups show up in stories about coins and counting. 7 nickels is 7 groups of 5 cents, so you multiply 5 × 7. Read the story, find how many groups there are and how many are in each group, and then multiply.",
      "Mo has 7 nickels. How many cents does he have? A nickel is 5 cents. 7 groups of 5 means MULTIPLY. 5 × 7 = 35. Answer: 35 cents.", [
        money("1", "Cal has 4 bags. Each bag has 9 marbles. How many marbles in all?", 36, "4 × 9 = 36. INTENTIONAL REPEAT (Monday, Thursday and Week 16): he needs to see facts more than once."),
        money("2", "A week has 7 days. There are 8 weeks. How many days in all?", 56, "7 × 8 = 56. INTENTIONAL REPEAT (Tuesday and Thursday): he needs to see facts more than once."),
        money("3", "Nia has 7 dimes. How many cents does she have?", 70, "7 × 10 = 70. INTENTIONAL REPEAT (Week 13, Week 16 and Wednesday): he needs to see facts more than once."),
      ]),
    bible17Friday(),
  ]),
}, '2026-11-02');


// Week 18 (Monday 2026-11-09). Math and Word Problems follow the Week 18 Drive plan.
const standard18 = Week('week-18', 'Week 18', [
  Sheet('memory-verse', 'memory-verse', 'Memory Verse', null, null, [
    Item('verse', 'fill-blank', "Dear friends, let us ___ to love one another, for love comes from God. Anyone who loves is a ___ of God and ___ God. But anyone who does not love does not know God, for God is love.", { wordBank: ["continue","child","knows"], answer: ["continue","child","knows"] }),
  ], { citation: "1 John 4:7-8 (NLT)" }),
], {
  monday: Day([
    Sheet("sales-tax-the-price-goes-up", "math", "Sales Tax: The Price Goes Up",
      "Sales tax is added on top of the price, so the total is MORE than the price. There are two routes, and they check each other. Route 1: find the tax (write the percent as a decimal and multiply by the price), then add the tax to the price. Route 2: do it in one step. The price plus 8% is 100% + 8% = 108%, which is 1.08, so multiply the price by 1.08. If both routes give the same answer, you can trust it. Before you start, ask 'will the total be more or less than the price?' With tax, it is always more, and only a little more.",
      "A $25 toy with 8% tax. Route 1: tax = 0.08 × 25. Ignore the decimal point: 8 × 25 = 200. 2 decimal places: 2.00. The tax is $2. Total: 25 + 2 = 27. Route 2: 1.08 × 25. Ignore the decimal point: 108 × 25 = 2700. 2 decimal places: 27.00. Both routes give $27. Check: more than 25, and only a little more.\n\nA $60 pair of sneakers with 7% tax. Route 1: tax = 0.07 × 60. Ignore the decimal point: 7 × 60 = 420. 2 decimal places: 4.20. The tax is $4.20. Total: 60 + 4.20 = 64.20. Route 2: 1.07 × 60. Ignore the decimal point: 107 × 60 = 6420. 2 decimal places: 64.20. Both routes give $64.20. Check: more than 60, and only a little more.", [
        pick14("1a", "A $40 game has 6% tax. Will the total be more or less than $40?", ["more","less"], "more", "Tax is added on top, so the total is more."),
        money("1b", "How much is the tax, in dollars?", 2.4, "0.06 × 40: 6 × 40 = 240; 2 places = 2.40. Accept 2.4 or 2.40."),
        money("1c", "Route 1: What is the total, in dollars?", 42.4, "40 + 2.40 = 42.40. Accept 42.4 or 42.40."),
        money("1d", "Route 2: What is 1.06 × 40?", 42.4, "106 × 40 = 4240; 2 places = 42.40. It must match 1c."),
        pick14("2a", "A $70 pair of headphones has 9% tax. Will the total be more or less than $70?", ["more","less"], "more", "Tax is added on top, so the total is more."),
        money("2b", "How much is the tax, in dollars?", 6.3, "0.09 × 70: 9 × 70 = 630; 2 places = 6.30. Accept 6.3 or 6.30."),
        money("2c", "What is the total, in dollars? (Use either route.)", 76.3, "70 + 6.30 = 76.30, or 1.09 × 70: 109 × 70 = 7630; 2 places = 76.30. Accept 76.3 or 76.30."),
        money("3", "A $55 jacket has 8% tax. What is the total, in dollars?", 59.4, "1.08 × 55: 108 × 55 = 5940; 2 places = 59.40. Or 55 + 4.40. Accept 59.4 or 59.40."),
        money("4", "A $120 tablet has 5% tax. What is the total, in dollars?", 126, "1.05 × 120: 105 × 120 = 12600; 2 places = 126.00. Or 120 + 6. Accept 126, 126.0 or 126.00."),
      ]),
    Sheet("clue-words-tax-and-tip-go-up-off-and-sale-go-down", "word-problems", "Clue Words: Tax and Tip Go Up, Off and Sale Go Down",
      "Shopping stories have clue words that tell you which way the price goes. The words tax, tip and fee mean the price goes UP, so you add. The words off, sale, discount and coupon mean the price goes DOWN, so you take away. Read the story, circle the clue word, decide up or down, and then find the answer with either route. For up, multiply by 1 plus the percent (8% tax is 1.08). For down, multiply by 1 minus the percent (20% off is 0.80).",
      "A $40 game has 8% tax. How much do you pay in all? Clue word: tax, so UP. Route 2: 1.08 × 40. Ignore the decimal point: 108 × 40 = 4320. 2 decimal places: 43.20. Answer: $43.20. Check: more than 40.", [
        money("1", "A $35 pizza has a 15% tip added. What is the total with the tip, in dollars?", 40.25, "Tip is a clue word for up. 1.15 × 35: 115 × 35 = 4025; 2 places = 40.25."),
        money("2", "A $150 game console is on sale for 10% off. How much do you pay, in dollars?", 135, "Off is a clue word for down. 0.90 × 150: 90 × 150 = 13500; 2 places = 135.00. Accept 135, 135.0 or 135.00."),
        money("3", "A $25 shirt has a coupon for 40% off. How much do you save, in dollars?", 10, "The question asks how much you SAVE, which is the discount itself: 0.40 × 25: 40 × 25 = 1000; 2 places = 10.00. Accept 10, 10.0 or 10.00."),
      ]),
    bible17Monday(),
  ]),
  tuesday: Day([
    Sheet("percent-off-the-price-goes-down", "math", "Percent Off: The Price Goes Down",
      "A discount is taken off the price, so you pay LESS than the price. There are two routes, and they check each other. Route 1: find the discount (write the percent as a decimal and multiply by the price), then subtract it from the price. Route 2: do it in one step. If 20% comes off, you pay the other 100% − 20% = 80%, which is 0.80, so multiply the price by 0.80. If both routes give the same answer, you can trust it. Before you start, ask 'will I pay more or less than the price?' With a discount, it is always less. Picture the price as a bar: one part is what you save, and the other part is what you pay.",
      "A $50 pair of jeans, 30% off. Route 1: discount = 0.30 × 50. Ignore the decimal point: 30 × 50 = 1500. 2 decimal places: 15.00. You save $15. You pay 50 − 15 = 35. Route 2: you pay 100% − 30% = 70%, which is 0.70. 0.70 × 50: 70 × 50 = 3500; 2 decimal places: 35.00. Both routes give $35. Check: less than 50.\n\nA $90 jacket, 15% off. Route 1: discount = 0.15 × 90. Ignore the decimal point: 15 × 90 = 1350. 2 decimal places: 13.50. You save $13.50. You pay 90 − 13.50 = 76.50. Route 2: you pay 100% − 15% = 85%, which is 0.85. 0.85 × 90: 85 × 90 = 7650; 2 decimal places: 76.50. Both routes give $76.50. Check: less than 90.", [
        pick14("1a", "A $60 sweatshirt is 25% off. Will you pay more or less than $60?", ["more","less"], "less", "A discount takes money off, so you pay less."),
        money("1b", "How much do you save, in dollars?", 15, "0.25 × 60: 25 × 60 = 1500; 2 places = 15.00. Accept 15, 15.0 or 15.00."),
        money("1c", "Route 1: How much do you pay, in dollars?", 45, "60 − 15 = 45."),
        money("1d", "Route 2: What is 0.75 × 60?", 45, "You pay 100% − 25% = 75%. 75 × 60 = 4500; 2 places = 45.00. It must match 1c."),
        pick14("2a", "A $45 game is 40% off. Will you pay more or less than $45?", ["more","less"], "less", "A discount takes money off, so you pay less."),
        money("2b", "How much do you save, in dollars?", 18, "0.40 × 45: 40 × 45 = 1800; 2 places = 18.00. Accept 18, 18.0 or 18.00."),
        money("2c", "How much do you pay, in dollars? (Use either route.)", 27, "45 − 18 = 27, or 0.60 × 45: 60 × 45 = 2700; 2 places = 27.00."),
        money("3", "A $75 hoodie is 20% off. How much do you pay, in dollars?", 60, "You pay 80%: 0.80 × 75: 80 × 75 = 6000; 2 places = 60.00. Or 75 − 15. Accept 60, 60.0 or 60.00."),
        money("4", "A $48 pair of shoes is 35% off. How much do you pay, in dollars?", 31.2, "You pay 65%: 0.65 × 48: 65 × 48 = 3120; 2 places = 31.20. Or 48 − 16.80. Accept 31.2 or 31.20."),
      ]),
    codeQuest13(),
  ]),
  wednesday: Day([
    codeQuest13(),
    bible17Wednesday(false),
  ]),
  thursday: Day([
    Sheet("up-or-down-then-find-the-answer", "math", "Up or Down? Then Find the Answer",
      "Today tax and discounts are mixed, so the first step is always the same: up or down? Look for the clue word. Tax, tip and fee mean UP, and the total is more than the price. Off, sale, discount and coupon mean DOWN, and you pay less than the price. Then estimate with a benchmark (10%, 25%, 50%), and then find the exact answer by multiplying by 1 plus the percent (up) or 1 minus the percent (down). The steps are not written out today, so use them yourself.",
      "An $80 pair of shoes with 7% tax. Up or down? Tax, so UP. Estimate: 10% of 80 is 8, and 7% is a little less than that, so the tax is a little less than 8 and the total is a little less than 88. Exact: 1.07 × 80. Ignore the decimal point: 107 × 80 = 8560. 2 decimal places: 85.60. Answer: $85.60. It fits the estimate.\n\nA $120 coat, 35% off. Up or down? Off, so DOWN. Estimate: 35% is between 25% and 50%, so you save between 30 and 60, and you pay between 60 and 90. Exact: you pay 100% − 35% = 65%. 0.65 × 120: 65 × 120 = 7800. 2 decimal places: 78.00. Answer: $78. It fits the estimate.", [
        pick14("1a", "A $36 shirt has 8% tax. Does the price go up or down?", ["up","down"], "up", "Tax means up."),
        money("1b", "What is the total, in dollars?", 38.88, "1.08 × 36: 108 × 36 = 3888; 2 places = 38.88."),
        pick14("2a", "A $65 game has a coupon for 40% off. Does the price go up or down?", ["up","down"], "down", "Coupon and off mean down."),
        money("2b", "How much do you pay, in dollars?", 39, "You pay 60%: 0.60 × 65: 60 × 65 = 3900; 2 places = 39.00. Accept 39, 39.0 or 39.00."),
        money("3a", "Estimate: a $200 bike has 9% tax. Round 9% to 10%. What is 10% of 200?", 20, "200 ÷ 10 = 20. The tax is a little less than $20."),
        money("3b", "What is the total with the 9% tax, in dollars?", 218, "1.09 × 200: 109 × 200 = 21800; 2 places = 218.00. Accept 218, 218.0 or 218.00."),
        money("4", "A $72 backpack is 25% off. How much do you pay, in dollars?", 54, "You pay 75%: 0.75 × 72: 75 × 72 = 5400; 2 places = 54.00. Or 72 − 18. Accept 54, 54.0 or 54.00."),
        money("5", "A dinner costs $48. You add a 20% tip. What is the total with the tip, in dollars?", 57.6, "Tip means up. 1.20 × 48: 120 × 48 = 5760; 2 places = 57.60. Accept 57.6 or 57.60."),
        money("6", "A $75 game is 30% off. How much do you save, in dollars?", 22.5, "The question asks how much you SAVE, which is the discount itself: 0.30 × 75: 30 × 75 = 2250; 2 places = 22.50. Accept 22.5 or 22.50."),
      ]),
    Sheet("two-steps-sale-first-then-tax", "word-problems", "Two Steps: Sale First, Then Tax",
      "Some stories have two steps. When a story says 'on sale, then tax is added', do the sale first. The sale price is the new price, and the tax is a percent of the sale price, not the original price. Write down each step and its answer. Step 1 is DOWN (multiply by 1 minus the discount). Step 2 is UP (multiply by 1 plus the tax). For a tip, remember that it goes UP.",
      "A $70 shirt is 30% off. Then 6% tax is added to the sale price. What is the final cost? Step 1 (down): you pay 100% − 30% = 70%. 0.70 × 70 = 49. The sale price is $49. Step 2 (up): 1.06 × 49. Ignore the decimal point: 106 × 49 = 5194. 2 decimal places: 51.94. Answer: $51.94.", [
        money("1", "A meal costs $24. You add a 20% tip. How much is the tip, in dollars?", 4.8, "0.20 × 24: 20 × 24 = 480; 2 places = 4.80. Accept 4.8 or 4.80. The question asks for the tip, not the total."),
        money("2a", "An $80 jacket is 25% off. What is the sale price, in dollars?", 60, "You pay 75%: 0.75 × 80: 75 × 80 = 6000; 2 places = 60.00. Accept 60, 60.0 or 60.00."),
        money("2b", "Then 8% tax is added to the sale price. What is the final cost, in dollars?", 64.8, "1.08 × 60: 108 × 60 = 6480; 2 places = 64.80. Accept 64.8 or 64.80."),
        money("3", "A haircut costs $18. You add a 15% tip. What is the total with the tip, in dollars?", 20.7, "1.15 × 18: 115 × 18 = 2070; 2 places = 20.70. Accept 20.7 or 20.70."),
      ]),
  ]),
  friday: Day([
    Sheet("show-what-you-know", "math", "Show What You Know",
      "No steps are written out today. For every problem, ask 'up or down?' first, find the clue word, make an estimate, and then find the exact answer. Up means multiply by 1 plus the percent, and down means multiply by 1 minus the percent. If you want to check yourself, do it with the other route and see if the two answers match.",
      "A $110 sweater, 20% off. Up or down? Off, so DOWN. You pay 100% − 20% = 80%. 0.80 × 110: 80 × 110 = 8800; 2 decimal places: 88.00. Answer: $88. Check: less than 110.\n\nA $60 ticket with 9% tax. Up or down? Tax, so UP. 1.09 × 60: 109 × 60 = 6540; 2 decimal places: 65.40. Answer: $65.40. Check: more than 60, and only a little more.", [
        money("1", "A $45 jacket is 20% off. How much do you pay, in dollars?", 36, "You pay 80%: 0.80 × 45: 80 × 45 = 3600; 2 places = 36.00. Accept 36, 36.0 or 36.00."),
        money("2", "A $70 game has 6% tax. What is the total, in dollars?", 74.2, "1.06 × 70: 106 × 70 = 7420; 2 places = 74.20. Accept 74.2 or 74.20."),
        money("3", "A $200 bike is 25% off. How much do you pay, in dollars?", 150, "You pay 75%: 0.75 × 200: 75 × 200 = 15000; 2 places = 150.00. Accept 150, 150.0 or 150.00."),
        money("4", "A $30 meal has an 18% tip. What is the total with the tip, in dollars?", 35.4, "1.18 × 30: 118 × 30 = 3540; 2 places = 35.40. Accept 35.4 or 35.40."),
        money("5", "A $84 pair of shoes is 15% off. How much do you pay, in dollars?", 71.4, "You pay 85%: 0.85 × 84: 85 × 84 = 7140; 2 places = 71.40. Accept 71.4 or 71.40."),
        note("6", "In one sentence, explain how the words 'tax' and 'off' tell you whether to multiply by more than 1 or less than 1.", "A good answer says that tax makes the price go up, so you multiply by a number bigger than 1 (like 1.08), and off makes the price go down, so you multiply by a number smaller than 1 (like 0.80)."),
      ]),
    Sheet("shopping-stories-on-your-own", "word-problems", "Shopping Stories on Your Own",
      "Read each story twice. Circle the clue word, decide up or down, and then find the answer. Two-step stories need a step for the sale first and then a step for the tax or the tip. There are no steps written out today, because you know them now.",
      "A $200 TV is 15% off. Then 8% tax is added to the sale price. What is the final cost? Step 1 (down): you pay 100% − 15% = 85%. 0.85 × 200 = 170. The sale price is $170. Step 2 (up): 1.08 × 170. Ignore the decimal point: 108 × 170 = 18360. 2 decimal places: 183.60. Answer: $183.60.", [
        money("1", "A $50 backpack is 40% off. How much do you pay, in dollars?", 30, "You pay 60%: 0.60 × 50: 60 × 50 = 3000; 2 places = 30.00. Accept 30, 30.0 or 30.00."),
        money("2", "A dinner costs $30. You add a 20% tip. What is the total with the tip, in dollars?", 36, "1.20 × 30: 120 × 30 = 3600; 2 places = 36.00. Accept 36, 36.0 or 36.00."),
        money("3a", "A $65 jacket is 20% off. What is the sale price, in dollars?", 52, "You pay 80%: 0.80 × 65: 80 × 65 = 5200; 2 places = 52.00. Accept 52, 52.0 or 52.00."),
        money("3b", "Then 6% tax is added to the sale price. What is the final cost, in dollars?", 55.12, "1.06 × 52: 106 × 52 = 5512; 2 places = 55.12."),
        note("4", "In one sentence, tell how you decide whether a price goes up or down.", "A good answer names the clue words: tax, tip or fee mean up, and off, sale, discount or coupon mean down."),
      ]),
    bible17Friday(),
  ]),
}, '2026-11-09');

const guided18 = Week('week-18', 'Week 18', [
  Sheet('memory-verse', 'memory-verse', 'Memory Verse', null, null, [
    Item('verse', 'fill-blank', "We love each other because he ___ us ___.", { wordBank: ["loved","first"], answer: ["loved","first"] }),
  ], { citation: "1 John 4:19 (NLT)" }),
], {
  monday: Day([
    Sheet("sixes-five-groups-plus-one-more", "math", "Sixes: Five Groups Plus One More",
      "Six is five plus one. So 6 groups is 5 groups plus 1 more group. You know your 5s. To find a 6s fact, find the 5s fact and add one more group. 6 × 7: 5 × 7 = 35, and one more group of 7 makes 35 + 7 = 42. Write the two parts, then add.",
      "6 × 7. Step 1: 5 × 7 = 35. Step 2: add one more group of 7: 35 + 7 = 42. So 6 × 7 = 42.\n\n6 × 8. Step 1: 5 × 8 = 40. Step 2: add one more group of 8: 40 + 8 = 48. So 6 × 8 = 48.", [
        withNote(times("1a", 5, 6), "INTENTIONAL REPEAT (Weeks 16 and 17): he needs to see facts more than once."),
        money("1b", "Add one more group of 6. 30 + 6 = ?", 36, "30 + 6 = 36."),
        money("1c", "So 6 × 6 = ?", 36, "INTENTIONAL REPEAT (Week 13): he needs to see facts more than once."),
        withNote(times("2a", 5, 9), "INTENTIONAL REPEAT (Weeks 13, 14, 16 and 17): he needs to see facts more than once."),
        money("2b", "Add one more group of 9. 45 + 9 = ?", 54, "45 + 9 = 54."),
        money("2c", "So 6 × 9 = ?", 54, "New fact this week."),
        withNote(times("3", 6, 4), "INTENTIONAL REPEAT (Weeks 16 and 17): he needs to see facts more than once. 5 × 4 + 4 = 24."),
        withNote(times("4", 6, 10), "INTENTIONAL REPEAT (Weeks 13 and 17): he needs to see facts more than once."),
      ]),
    Sheet("groups-of-six", "word-problems", "Groups of Six",
      "Read the story slowly. Find what the groups are and how many are in each group. Then ask what you need to do. When every group is the same size and you want the total, you multiply. When some are taken away, you take away. When some are added, you add.",
      "A pack has 6 pencils. There are 3 packs. How many pencils in all? Clue: 'a pack has 6' and 'there are 3 packs' mean equal groups, so MULTIPLY. 6 × 3: 5 × 3 = 15, and one more group of 3 makes 15 + 3 = 18. Answer: 18 pencils.", [
        choice("1a", "A tray has 6 muffins. There are 6 trays. What do you need to do?", ["Add", "Take away", "Multiply"], "C", "Equal groups means multiply."),
        money("1b", "How many muffins in all?", 36, "6 × 6 = 36. INTENTIONAL REPEAT (Math problem 1c today): he needs to see facts more than once."),
        money("2", "Sia has 6 jars. Each jar has 9 buttons. How many buttons in all?", 54, "6 × 9 = 54. INTENTIONAL REPEAT (Math problem 2c today): he needs to see facts more than once."),
        money("3", "A bus has 8 rows. Each row has 6 seats. How many seats in all?", 48, "8 × 6 = 48. INTENTIONAL REPEAT (Math worked example today, 6 × 8): he needs to see facts more than once."),
        choice("4a", "Tam has 36 stickers. He gives 6 away. What do you need to do?", ["Add", "Take away", "Multiply"], "B", "'Gives away' means take away."),
        money("4b", "How many stickers does Tam have left?", 30, "36 − 6 = 30."),
        money("5", "Uri has 10 boxes. Each box has 6 crayons. How many crayons in all?", 60, "10 × 6 = 60. INTENTIONAL REPEAT (Math problem 4 today): he needs to see facts more than once."),
      ]),
    bible17Monday(),
  ]),
  tuesday: Day([
    Sheet("eights-double-the-fours", "math", "Eights: Double the Fours",
      "Eight is double four. So an 8s fact is a 4s fact doubled. You know your 4s. To find 8 × 6: 4 × 6 = 24, and double 24 is 24 + 24 = 48. Find the 4s fact first, then double it.",
      "8 × 6. Step 1: 4 × 6 = 24. Step 2: double 24: 24 + 24 = 48. So 8 × 6 = 48.\n\n8 × 3. Step 1: 4 × 3 = 12. Step 2: double 12: 12 + 12 = 24. So 8 × 3 = 24.", [
        withNote(times("1a", 4, 7), "INTENTIONAL REPEAT (Weeks 13, 14, 16 and 17): he needs to see facts more than once."),
        money("1b", "Double it. 28 + 28 = ?", 56, "28 + 28 = 56."),
        money("1c", "So 8 × 7 = ?", 56, "INTENTIONAL REPEAT (7 × 8 from Weeks 16 and 17): he needs to see facts more than once."),
        withNote(times("2a", 4, 9), "INTENTIONAL REPEAT (Weeks 13, 14, 16 and 17): he needs to see facts more than once."),
        money("2b", "Double it. 36 + 36 = ?", 72, "36 + 36 = 72."),
        money("2c", "So 8 × 9 = ?", 72, "New fact this week."),
        money("3", "8 × 8 = ? Hint: 4 × 8 = 32, then double it.", 64, "32 + 32 = 64. New fact this week."),
        withNote(times("4", 8, 5), "INTENTIONAL REPEAT (5 × 8 from Weeks 16 and 17): he needs to see facts more than once."),
      ]),
    codeQuest13(),
  ]),
  wednesday: Day([
    codeQuest13(),
    bible17Wednesday(true),
  ]),
  thursday: Day([
    Sheet("nines-ten-groups-minus-one", "math", "Nines: Ten Groups Minus One",
      "Nine is ten minus one. So 9 groups is 10 groups take away 1 group. You know your 10s. To find 9 × 7: 10 × 7 = 70, and take away one group of 7: 70 − 7 = 63. Find the 10s fact first, then take one group away.",
      "9 × 7. Step 1: 10 × 7 = 70. Step 2: take away one group of 7: 70 − 7 = 63. So 9 × 7 = 63.\n\n9 × 4. Step 1: 10 × 4 = 40. Step 2: take away one group of 4: 40 − 4 = 36. So 9 × 4 = 36.", [
        withNote(times("1a", 10, 6), "INTENTIONAL REPEAT (Weeks 13 and 17): he needs to see facts more than once."),
        money("1b", "Take away one group of 6. 60 − 6 = ?", 54, "60 − 6 = 54."),
        money("1c", "So 9 × 6 = ?", 54, "INTENTIONAL REPEAT (Monday's 6 × 9): he needs to see facts more than once."),
        withNote(times("2a", 10, 8), "INTENTIONAL REPEAT (Weeks 13 and 17, and Tuesday): he needs to see facts more than once."),
        money("2b", "Take away one group of 8. 80 − 8 = ?", 72, "80 − 8 = 72."),
        money("2c", "So 9 × 8 = ?", 72, "INTENTIONAL REPEAT (Tuesday's 8 × 9): he needs to see facts more than once."),
        money("3", "9 × 9 = ? Hint: 10 × 9 = 90, then take away one group of 9.", 81, "90 − 9 = 81. New fact this week."),
        withNote(times("4", 9, 5), "INTENTIONAL REPEAT (Weeks 13, 14, 16 and 17): he needs to see facts more than once."),
      ]),
    Sheet("groups-of-nine", "word-problems", "Groups of Nine",
      "Read the story slowly. Find what the groups are and how many are in each group. Then ask what you need to do. Equal groups means multiply. For a 9s fact, find the 10s fact and take one group away.",
      "A pack has 9 cards. There are 3 packs. How many cards in all? Clue: 'a pack has 9' and 'there are 3 packs' mean equal groups, so MULTIPLY. 9 × 3: 10 × 3 = 30, and take away one group of 3: 30 − 3 = 27. Answer: 27 cards.", [
        choice("1a", "A shelf has 9 books. There are 7 shelves. What do you need to do?", ["Add", "Take away", "Multiply"], "C", "Equal groups means multiply."),
        money("1b", "How many books in all?", 63, "9 × 7 = 63. INTENTIONAL REPEAT (Math worked example today): he needs to see facts more than once."),
        money("2", "Val has 9 bags. Each bag has 8 stones. How many stones in all?", 72, "9 × 8 = 72. INTENTIONAL REPEAT (Math problem 2c today): he needs to see facts more than once."),
        money("3", "A team has 9 players. There are 6 teams. How many players in all?", 54, "9 × 6 = 54. INTENTIONAL REPEAT (Math problem 1c today): he needs to see facts more than once."),
        choice("4a", "Wes has 20 marbles. He gets 9 more. What do you need to do?", ["Add", "Take away", "Multiply"], "A", "'Gets 9 more' means add."),
        money("4b", "How many marbles does Wes have now?", 29, "20 + 9 = 29."),
        money("5", "A box has 9 pencils. Bo has 5 boxes. How many pencils in all?", 45, "9 × 5 = 45. INTENTIONAL REPEAT (Math problem 4 today): he needs to see facts more than once."),
      ]),
  ]),
  friday: Day([
    Sheet("show-what-you-know", "math", "Show What You Know",
      "No steps are written out today, so use the tricks yourself. For a 6s fact, find the 5s fact and add one more group. For an 8s fact, find the 4s fact and double it. For a 9s fact, find the 10s fact and take one group away. If you get stuck, go back to the worked example and follow the same steps one at a time. The last item asks how sure you feel.",
      "6 × 7. Step 1: 5 × 7 = 35. Step 2: add one more group of 7: 35 + 7 = 42. So 6 × 7 = 42.\n\n9 × 4. Step 1: 10 × 4 = 40. Step 2: take away one group of 4: 40 − 4 = 36. So 9 × 4 = 36.", [
        withNote(times("1", 6, 6), "INTENTIONAL REPEAT (Monday and Week 13): he needs to see facts more than once."),
        withNote(times("2", 8, 7), "INTENTIONAL REPEAT (Tuesday): he needs to see facts more than once."),
        withNote(times("3", 9, 8), "INTENTIONAL REPEAT (Tuesday and Thursday): he needs to see facts more than once."),
        withNote(times("4", 6, 9), "INTENTIONAL REPEAT (Monday and Thursday): he needs to see facts more than once."),
        withNote(times("5", 8, 8), "INTENTIONAL REPEAT (Tuesday): he needs to see facts more than once."),
        withNote(times("6", 9, 9), "INTENTIONAL REPEAT (Thursday): he needs to see facts more than once."),
        withNote(times("7", 7, 9), "INTENTIONAL REPEAT (Weeks 17 and 18): he needs to see facts more than once."),
        Item("8", 'scale', "How sure do you feel about your 6s, 8s and 9s? (1 = not sure, 5 = very sure)", { scaleMax: 5, parentNote: "Any number from 1 to 5 is fine. Jesse can use it to see how he feels." }),
      ]),
    Sheet("show-what-you-know-stories", "word-problems", "Show What You Know: Stories",
      "Read each story slowly. Find what the groups are and how many are in each group. Then ask what you need to do. Equal groups means multiply, 'gives away' or 'spends' means take away, and 'gets more' means add. There are no steps written out today.",
      "Sia has 8 bags. Each bag has 6 oranges. How many oranges in all? Clue: 'each bag has 6' and 'Sia has 8 bags' mean equal groups, so MULTIPLY. 8 × 6: 4 × 6 = 24, and double 24 is 48. Answer: 48 oranges.", [
        choice("1a", "A fish tank has 8 fish. There are 7 tanks. What do you need to do?", ["Add", "Take away", "Multiply"], "C", "Equal groups means multiply."),
        money("1b", "How many fish in all?", 56, "8 × 7 = 56. INTENTIONAL REPEAT (Math problem 2 today): he needs to see facts more than once."),
        money("2", "A car has 4 wheels. There are 9 cars. How many wheels in all?", 36, "4 × 9 = 36. INTENTIONAL REPEAT (Thursday's worked example, 9 × 4): he needs to see facts more than once."),
        money("3", "A bag has 8 apples. Val has 8 bags. How many apples in all?", 64, "8 × 8 = 64. INTENTIONAL REPEAT (Math problem 5 today): he needs to see facts more than once."),
        choice("4a", "Tam has 50 cents. He spends 9 cents. What do you need to do?", ["Add", "Take away", "Multiply"], "B", "'Spends' means take away."),
        money("4b", "How many cents does Tam have left?", 41, "50 − 9 = 41."),
        money("5", "Wes has 6 boxes. Each box has 9 crayons. How many crayons in all?", 54, "6 × 9 = 54. INTENTIONAL REPEAT (Math problem 4 today): he needs to see facts more than once."),
      ]),
    bible17Friday(),
  ]),
}, '2026-11-09');
export const DAILY_WORK = deepFreeze({
  guided: { weeks: { 'week-11': guided, 'week-12': guided12, 'week-13': guided13, 'week-14': guided14, 'week-15': guided15, 'week-16': guided16, 'week-17': guided17, 'week-18': guided18 } },
  standard: { weeks: { 'week-11': standard, 'week-12': standard12, 'week-13': standard13, 'week-14': standard14, 'week-15': standard15, 'week-16': standard16, 'week-17': standard17, 'week-18': standard18 } },
});

export function getWeek(track, weekId) {
  return DAILY_WORK[track]?.weeks?.[weekId] || null;
}
