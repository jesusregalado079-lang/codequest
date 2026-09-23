function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.keys(value).forEach((key) => deepFreeze(value[key]));
  return Object.freeze(value);
}

export const Item = (id, kind, prompt, extra) => Object.assign({
  id, kind, prompt, wordBank: null, answer: null, scaleMax: null,
}, extra || {});

export const CoinItem = (id, prompt, targetCents, coinSet) => Item(id, 'coin-total', prompt, {
  answer: targetCents, coinSet, targetCents, pile: null,
});

export const Sheet = (id, subject, title, intro, example, items, extra) => Object.assign({
  id, subject, title, intro, example, items,
}, extra || {});

export const Day = (sheets) => ({ sheets });

export const Week = (id, label, weekItems, days) => ({ id, label, assignedWeekOf: null, weekItems, days });

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
const coin = (id, prompt, targetCents, coinSet = coins) => CoinItem(id, prompt, targetCents, coinSet);
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
});

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
});

export const DAILY_WORK = deepFreeze({
  guided: { weeks: { 'week-11': guided } },
  standard: { weeks: { 'week-11': standard } },
});

export function getWeek(track, weekId) {
  return DAILY_WORK[track]?.weeks?.[weekId] || null;
}
