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
        numeric('10-of-20', '10 out of 20 = ?', 50), numeric('6-of-12', '6 out of 12 = ?', 50),
        numeric('3-of-12', '3 out of 12 = ?', 25), numeric('8-of-16', '8 out of 16 = ?', 50),
        numeric('12-of-16', '12 out of 16 = ?', 75),
      ]),
    Sheet('word-problems', 'word-problems', 'Word Problems',
      'Turn each situation into a fraction (part out of whole), then figure out the percent. Some of these will simplify cleanly; others you may need to estimate.',
      'You get 9 out of 10 right on a quiz. 9/10 = 90%.', [
        numeric('quiz', 'You get 9 out of 10 right on a quiz. What percent?', 90),
        numeric('games', 'Your team wins 6 out of 8 games. What percent?', 75),
        numeric('pets', '4 out of 5 kids in your class have a pet. What percent?', 80),
        numeric('pages', 'You read 21 out of 30 pages. Estimate the percent.', 70),
      ]),
  ]),
  tuesday: Day([
    Sheet('finding-the-percent', 'math', 'Finding the Percent',
      'Keep practicing the same method: write the fraction, simplify it, then name the percent. If the simplified fraction is not one of your benchmarks, think about what it would be out of 100.',
      '12 out of 20 = 12/20 = 3/5 = 60%. (3/5 is the same as 6/10, which is 60 out of 100.)', [
        numeric('12-of-20', '12 out of 20 = ?', 60), numeric('14-of-20', '14 out of 20 = ?', 70),
        numeric('9-of-12', '9 out of 12 = ?', 75), numeric('7-of-28', '7 out of 28 = ?', 25),
        numeric('20-of-25', '20 out of 25 = ?', 80),
      ]),
    codeQuest('codequest'),
  ]),
  wednesday: Day([
    Sheet('finding-the-percent', 'math', 'Finding the Percent',
      'Here is another way to find the percent: figure out what you would need to multiply the bottom number by to reach 100, then multiply the top number by that same amount. That gives you the percent directly.',
      '17 out of 20 = 17/20. Since 20 × 5 = 100, multiply the top too: 17 × 5 = 85. So 85%.', [
        numeric('17-of-20', '17 out of 20 = ?', 85), numeric('11-of-20', '11 out of 20 = ?', 55),
        numeric('22-of-25', '22 out of 25 = ?', 88), numeric('6-of-24', '6 out of 24 = ?', 25),
      ]),
    codeQuest('codequest'),
  ]),
  thursday: Day([
    Sheet('finding-the-percent', 'math', 'Finding the Percent',
      'This is exactly how test scores, sports stats, and surveys get turned into percents in real life. Use the same method: fraction first, then simplify to find the percent.',
      'Basketball: 15 out of 20 free throws made. 15/20 = 3/4 = 75%.', [
        numeric('test', '27 out of 30 on a test = ?', 90),
        numeric('basketball', 'Basketball: 15 out of 20 free throws made = ?', 75),
        numeric('survey', 'Survey: 40 out of 50 students prefer pizza = ?', 80),
        numeric('spelling', 'Spelling: 17 out of 20 correct = ?', 85),
      ]),
    Sheet('word-problems', 'word-problems', 'Word Problems',
      'Same method as Math, applied to real situations. Write the fraction, simplify, then name the percent.',
      'Video game: beat 45 out of 50 levels. 45/50 = 9/10 = 90%.', [
        numeric('video-game', 'Video game: beat 45 out of 50 levels. What percent?', 90),
        numeric('summer', 'Survey of 40 kids: 32 like summer best. What percent?', 80),
        numeric('free-throws', 'Free throws in practice: 14 out of 16 made. What percent?', 87.5),
      ]),
  ]),
  friday: Day([
    Sheet('finding-the-percent', 'math', 'Finding the Percent',
      "Some of these ask you to find a percent OF a number (your old skill). Others ask what percent one number IS of another (your new skill this week). Read each one carefully before you start.\n\nMixed review: some ask 'what percent is A of B,' others ask 'what is X% of a number.' Read carefully to see which direction each question goes.", null, [
        numeric('15-of-20', 'What percent is 15 out of 20?', 75), numeric('25-percent-of-60', '25% of 60 = ?', 15),
        numeric('9-of-12', 'What percent is 9 out of 12?', 75), numeric('90-percent-of-40', '90% of 40 = ?', 36),
        numeric('6-of-8', 'What percent is 6 out of 8?', 75),
      ]),
    Sheet('word-problems', 'word-problems', 'Word Problems',
      'Work through each one using the fraction method you practiced all week. Show your fraction before you write the final percent.\n\nShow What You Know! Try these on your own.', null, [
        numeric('big-test', 'You get 42 out of 50 on a big test. What percent?', 84),
        numeric('soccer', 'Your soccer team wins 9 out of 12 games. What percent?', 75),
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
