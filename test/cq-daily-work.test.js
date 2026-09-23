import assert from 'node:assert/strict';
import { DAILY_WORK, getWeek } from '../src/cq/daily-work/content.js';
import { emptyDailyWorkState, normalizeDailyWork } from '../src/cq/daily-work/state.js';
import { normalizeCq } from '../src/cq/character.js';

const iso = '2026-09-22T12:00:00.000Z';
const coinValues = { penny: 1, nickel: 5, dime: 10, quarter: 25, 'dollar-bill': 100 };
const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

function pileTotal(prompt) {
  const amounts = /You have (.+)\. How much money do you have\?/.exec(prompt);
  if (!amounts) return null;
  const names = { pennies: 'penny', nickel: 'nickel', nickels: 'nickel', dime: 'dime', dimes: 'dime', quarter: 'quarter', quarters: 'quarter', 'dollar bill': 'dollar-bill' };
  let total = 0;
  let found = false;
  const matcher = /(\d+) (pennies|nickel|nickels|dime|dimes|quarter|quarters|dollar bill)/g;
  let match = matcher.exec(amounts[1]);
  while (match) {
    total += Number(match[1]) * coinValues[names[match[2]]];
    found = true;
    match = matcher.exec(amounts[1]);
  }
  return found ? total : null;
}

const item = (id, kind, prompt, answer = null, wordBank = null, scaleMax = null, extra = {}) => ({
  id, kind, prompt, wordBank, answer, scaleMax, ...extra,
});
const numeric = (id, prompt, answer) => item(id, 'numeric', prompt, answer);
const percent = (id, prompt, answer) => item(id, 'numeric', prompt, answer, null, null, { unit: 'percent' });
const blockItem = (id, prompt, part, whole, help) => item(id, 'numeric', prompt, (part * 100) / whole, null, null, { unit: 'percent', part, whole, help });
const standardProse = (dayKey, index) => { const found = DAILY_WORK.standard.weeks['week-11'].days[dayKey].sheets[index]; return { intro: found.intro, example: found.example }; };
const coin = (id, prompt, answer, coinSet = ['penny', 'nickel', 'dime', 'quarter']) => item(id, 'coin-total', prompt, answer, null, null, {
  coinSet, targetCents: answer, pile: null,
});
const sheet = (id, subject, title, intro, example, items, citation) => ({
  id, subject, title, intro, example, items, ...(citation ? { citation } : {}),
});
const codeQuest = () => sheet('codequest', 'codequest', 'CodeQuest',
  'Time to play! Fill this out after you finish.\n\n🎮 CodeQuest Day! Play CodeQuest today for at least 15–20 minutes. Try to reach a new level!', null, [
    item('level', 'short-text', 'Which level did you reach today?'),
    item('learned', 'long-text', 'Write 1–2 sentences about something you built, solved, or learned:'),
    item('tricky', 'scale', "On a scale of 1–5, how tricky was today's level?", null, null, 5),
  ]);

const expectedGuided = {
  id: 'week-11', label: 'Week 11', assignedWeekOf: null,
  weekItems: [sheet('memory-verse', 'memory-verse', 'Memory Verse', null, null, [
    item('verse', 'fill-blank', "If you are ___ in ___ things, you will be faithful in large ones. But if you are dishonest in little things, you won't be honest with greater responsibilities.", ['faithful', 'little'], ['faithful', 'little']),
  ], 'Luke 16:10 (NLT)')],
  days: {
    monday: { sheets: [
      sheet('coin-combinations', 'math', 'Coin Combinations', 'Every coin has its own value: penny, nickel, dime, quarter. When you need a certain amount of money, you can mix and match coins in more than one way to get there. Practice figuring out which coins to use below.', 'There is often more than one way to make the same amount! Here are three ways to make $0.35 — Way 1: a quarter + a dime (25 + 10 = 35). Way 2: three dimes + a nickel (10 + 10 + 10 + 5 = 35). Way 3: seven nickels (5 × 7 = 35).', [
        numeric('penny-value', 'Penny = ? ¢', 1), numeric('nickel-value', 'Nickel = ? ¢', 5), numeric('dime-value', 'Dime = ? ¢', 10), numeric('quarter-value', 'Quarter = ? ¢', 25),
        coin('make-40', 'Make $0.40', 40), coin('make-60', 'Make $0.60', 60), coin('make-75', 'Make $0.75', 75), coin('make-90', 'Make $0.90', 90),
      ]),
      sheet('word-problems', 'word-problems', 'Word Problems', 'Some problems give you coins and ask for the total. Others give you a target amount and ask which coins to use. Read carefully to see which one you are solving.', 'You have 2 quarters and 1 dime. 25 + 25 + 10 = $0.60.', [
        numeric('dimes-and-pennies', 'You have 3 dimes and 4 pennies. How much money do you have?', 34), coin('gumball-way-1', 'Make $0.60 — Way 1', 60), coin('gumball-way-2', 'Make $0.60 — Way 2', 60), numeric('quarter-dime-nickels', 'You have 1 quarter, 1 dime, and 3 nickels. How much money do you have?', 50),
      ]),
    ] },
    tuesday: { sheets: [
      sheet('coin-combinations', 'math', 'Coin Combinations', 'Once you go past one whole dollar, you can use a $1 bill to cover the dollar part, then add coins for the cents. This works exactly the same way as yesterday, just with one more piece.', 'Make $1.25 two ways: (1) one $1 bill + 1 quarter. (2) one $1 bill + 2 dimes + 1 nickel.', [
        coin('make-110', 'Make $1.10', 110, ['penny', 'nickel', 'dime', 'quarter', 'dollar-bill']), coin('make-130', 'Make $1.30', 130, ['penny', 'nickel', 'dime', 'quarter', 'dollar-bill']), coin('make-145', 'Make $1.45', 145, ['penny', 'nickel', 'dime', 'quarter', 'dollar-bill']),
      ]), codeQuest(),
    ] },
    wednesday: { sheets: [
      sheet('coin-combinations', 'math', 'Coin Combinations', 'Remember: there is almost always more than one right answer when it comes to making change! Challenge yourself to find two different combinations for each amount below.', 'Two ways to make $0.50: (1) 2 quarters. (2) 5 dimes.', [
        coin('make-80-way-1', 'Make $0.80 — Way 1', 80), coin('make-80-way-2', 'Make $0.80 — Way 2', 80), coin('make-65-way-1', 'Make $0.65 — Way 1', 65),
      ]), codeQuest(),
    ] },
    thursday: { sheets: [
      sheet('coin-combinations', 'math', 'Coin Combinations', 'Real amounts are not always clean, round numbers. Messy amounts like 84 cents still work the exact same way — just take it one coin at a time, biggest coins first.', 'Make $0.84: 3 quarters + 1 nickel + 4 pennies. 25+25+25+5+1+1+1+1 = 84¢. Messy amounts still work the same way!', [
        coin('make-84', 'Make $0.84 (try it yourself, any way that works)', 84), coin('make-147', 'Make $1.47', 147, ['penny', 'nickel', 'dime', 'quarter', 'dollar-bill']), coin('make-63', 'Make $0.63', 63),
      ]),
      sheet('word-problems', 'word-problems', 'Word Problems', 'Add up the coins you are given carefully, biggest to smallest. For target-amount problems, think about which coins get you there with the fewest coins possible.', 'You have 3 quarters, 1 dime, and 2 pennies. 75+10+2 = $0.87.', [
        numeric('quarters-dimes-pennies', 'You have 2 quarters, 3 dimes, and 4 pennies. How much money do you have?', 84), coin('snack', 'You need exactly $0.84 for a snack. Which coins would you use?', 84), numeric('bill-quarter-dime-nickels', 'You have 1 dollar bill, 1 quarter, 1 dime, and 2 nickels. How much money do you have?', 145),
      ]),
    ] },
    friday: { sheets: [
      sheet('coin-combinations', 'math', 'Coin Combinations', 'Watch the modeled example first: start with the biggest pieces and work your way down to pennies. Then try the same method yourself on the amounts below. That is the whole method: start with the biggest pieces (bills, then quarters), and work your way down to pennies. Now you try it completely on your own!', 'Make $1.62: one $1 bill + 2 quarters + 1 dime + 2 pennies. 100+25+25+10+1+1 = $1.62.', [
        coin('make-138', 'Make $1.38 (show your coins below)', 138, ['penny', 'nickel', 'dime', 'quarter', 'dollar-bill']), coin('make-79', 'Make $0.79', 79),
      ]),
      sheet('word-problems', 'word-problems', 'Word Problems', 'Now it is your turn! Work through each problem the same way you practiced all week — biggest pieces first.\n\nShow What You Know! Try these on your own.', null, [
        numeric('quarters-dimes-pennies', 'You have 4 quarters, 2 dimes, and 3 pennies. How much money do you have?', 123), coin('toy', 'You need exactly $1.38 to buy a toy. Which bills and coins would you use?', 138, ['penny', 'nickel', 'dime', 'quarter', 'dollar-bill']),
      ]),
    ] },
  },
};

const expectedStandard = {
  id: 'week-11', label: 'Week 11', assignedWeekOf: null,
  weekItems: [sheet('memory-verse', 'memory-verse', 'Memory Verse', null, null, [item('verse', 'fill-blank', 'I ___ on to reach the end of the race and receive the heavenly ___ for which God, through Christ Jesus, is calling us.', ['press', 'prize'], ['press', 'prize'])], 'Philippians 3:14 (NLT)')],
  days: {
    monday: { sheets: [
      sheet('finding-the-percent', 'math', 'Finding the Percent', 'To find what percent one number is of another, write it as a fraction first (the part over the whole), simplify that fraction if you can, then think about what percent that simplified fraction equals. Your benchmark fractions — 1/2, 1/4, 3/4 — will help you recognize the percent quickly.\n\nSo far you have found a percent OF a number. This week flips it: you will find WHAT PERCENT one number is of another. The trick is the same fraction thinking you already know — turn it into a fraction, then into a percent.', '10 out of 20 = 10/20 = 1/2 = 50%. Simplify the fraction first, then think: what percent is that fraction? · 6 out of 12 = 6/12 = 1/2 = 50%. Same answer, different numbers — the fraction is what matters.', [percent('10-of-20', '10 out of 20 = ?', 50), percent('6-of-12', '6 out of 12 = ?', 50), percent('3-of-12', '3 out of 12 = ?', 25), percent('8-of-16', '8 out of 16 = ?', 50), percent('12-of-16', '12 out of 16 = ?', 75)]),
      sheet('word-problems', 'word-problems', 'Word Problems', 'Turn each situation into a fraction (part out of whole), then figure out the percent. Some of these will simplify cleanly; others you may need to estimate.', 'You get 9 out of 10 right on a quiz. 9/10 = 90%.', [percent('quiz', 'You get 9 out of 10 right on a quiz. What percent?', 90), percent('games', 'Your team wins 6 out of 8 games. What percent?', 75), percent('pets', '4 out of 5 kids in your class have a pet. What percent?', 80), percent('pages', 'You read 21 out of 30 pages. Estimate the percent.', 70)]),
    ] },
    // Standard Tue-Fri were re-authored 2026-09-23 as a gentle block-bar ramp (Monday was too big a jump).
    // Their prose (intro/worked example) isn't re-typed here — it isn't an answer key — but every item is
    // spelled out below (id, prompt, part/whole, help level) and the answer keys are ALSO checked
    // independently by the arithmetic pass further down. Monday and the memory verse stay literal golden copies.
    tuesday: { sheets: [
      sheet('finding-the-percent', 'math', 'Finding the Percent', standardProse('tuesday', 0).intro, standardProse('tuesday', 0).example, [blockItem('1-of-4', '1 out of 4 is what percent?', 1, 4, 'all'), blockItem('2-of-5', '2 out of 5 is what percent?', 2, 5, 'all'), blockItem('3-of-10', '3 out of 10 is what percent?', 3, 10, 'all'), blockItem('2-of-8', '2 out of 8 is what percent?', 2, 8, 'all'), blockItem('6-of-10', '6 out of 10 is what percent?', 6, 10, 'all')]), codeQuest(),
    ] },
    wednesday: { sheets: [
      sheet('finding-the-percent', 'math', 'Finding the Percent', standardProse('wednesday', 0).intro, standardProse('wednesday', 0).example, [blockItem('3-of-5', '3 out of 5 is what percent?', 3, 5, 'unit'), blockItem('7-of-10', '7 out of 10 is what percent?', 7, 10, 'unit'), blockItem('4-of-8', '4 out of 8 is what percent?', 4, 8, 'unit'), blockItem('3-of-12', '3 out of 12 is what percent?', 3, 12, 'unit'), blockItem('9-of-12', '9 out of 12 is what percent?', 9, 12, 'unit')]), codeQuest(),
    ] },
    thursday: { sheets: [
      sheet('finding-the-percent', 'math', 'Finding the Percent', standardProse('thursday', 0).intro, standardProse('thursday', 0).example, [blockItem('10-of-20', '10 out of 20 is what percent?', 10, 20, 'clues'), blockItem('20-of-25', '20 out of 25 is what percent?', 20, 25, 'clues'), blockItem('21-of-30', '21 out of 30 is what percent?', 21, 30, 'clues'), blockItem('5-of-25', '5 out of 25 is what percent?', 5, 25, 'clues')]),
      sheet('word-problems', 'word-problems', 'Word Problems', standardProse('thursday', 1).intro, standardProse('thursday', 1).example, [blockItem('shots', 'Your team made 12 out of 16 shots. What percent?', 12, 16, 'clues'), blockItem('levels', 'You finished 6 out of 24 levels. What percent?', 6, 24, 'clues')]),
    ] },
    friday: { sheets: [
      sheet('finding-the-percent', 'math', 'Finding the Percent', standardProse('friday', 0).intro, null, [blockItem('5-of-20', '5 out of 20 is what percent?', 5, 20, 'none'), blockItem('17-of-20', '17 out of 20 is what percent?', 17, 20, 'none'), blockItem('8-of-16', '8 out of 16 is what percent?', 8, 16, 'none'), blockItem('40-of-50', '40 out of 50 is what percent?', 40, 50, 'none'), blockItem('21-of-28', '21 out of 28 is what percent?', 21, 28, 'none')]),
      sheet('word-problems', 'word-problems', 'Word Problems', standardProse('friday', 1).intro, null, [blockItem('big-test', 'You got 45 out of 50 on a big test. What percent?', 45, 50, 'none'), blockItem('soccer', 'Your soccer team wins 9 out of 12 games. What percent?', 9, 12, 'none')]),
    ] },
  },
};

assert.ok(Object.isFrozen(DAILY_WORK));
assert.ok(Object.isFrozen(DAILY_WORK.guided.weeks['week-11'].days.monday.sheets));
assert.ok(Object.isFrozen(DAILY_WORK.standard.weeks['week-11'].weekItems[0].items[0].wordBank));
assert.throws(() => { DAILY_WORK.guided.weeks['week-11'].days.monday.sheets[0].items[0].answer = 2; }, TypeError);
assert.throws(() => { DAILY_WORK.standard.weeks['week-11'].weekItems[0].items[0].wordBank.push('wrong'); }, TypeError);
assert.deepEqual(DAILY_WORK.guided.weeks['week-11'], expectedGuided);
assert.deepEqual(DAILY_WORK.standard.weeks['week-11'], expectedStandard);
assert.equal(getWeek('guided', 'week-11'), DAILY_WORK.guided.weeks['week-11']);
assert.equal(getWeek('none', 'week-11'), null);
assert.equal(getWeek('guided', 'none'), null);

Object.values(DAILY_WORK).forEach((track) => Object.values(track.weeks).forEach((week) => {
  [...week.weekItems, ...days.flatMap((day) => week.days[day].sheets)].forEach((currentSheet) => {
    const ids = currentSheet.items.map((currentItem) => currentItem.id);
    assert.equal(new Set(ids).size, ids.length, `${week.id}/${currentSheet.id} item ids are unique`);
    currentSheet.items.filter((currentItem) => currentItem.kind === 'coin-total').forEach((currentItem) => {
      const pileTotal = currentItem.pile && Object.entries(currentItem.pile).reduce((total, [denom, count]) => total + coinValues[denom] * count, 0);
      assert.equal(currentItem.answer, currentItem.targetCents == null ? pileTotal : currentItem.targetCents, `${currentItem.id} coin answer`);
    });
    currentSheet.items.filter((currentItem) => currentItem.kind === 'numeric' && !currentItem.prompt.includes('Estimate')).forEach((currentItem) => {
      const coinReview = /^(Penny|Nickel|Dime|Quarter) = \? ¢$/.exec(currentItem.prompt);
      const outOf = /(\d+(?:\.\d+)?) out of (\d+(?:\.\d+)?)/.exec(currentItem.prompt);
      const percentOf = /^(\d+(?:\.\d+)?)% of (\d+(?:\.\d+)?) = \?$/.exec(currentItem.prompt);
      const total = pileTotal(currentItem.prompt);
      if (coinReview) assert.equal(currentItem.answer, coinValues[coinReview[1].toLowerCase()], currentItem.prompt);
      if (outOf) {
        const exact = 100 * Number(outOf[1]) / Number(outOf[2]);
        assert.equal(currentItem.answer, Number.isInteger(currentItem.answer) ? Math.round(exact) : exact, currentItem.prompt);
      }
      if (percentOf) assert.equal(currentItem.answer, Number(percentOf[1]) * Number(percentOf[2]) / 100, currentItem.prompt);
      if (total !== null) assert.equal(currentItem.answer, total, currentItem.prompt);
    });
  });
}));

assert.deepEqual(normalizeDailyWork(null), emptyDailyWorkState());
assert.deepEqual(normalizeDailyWork({ weeks: { nope: { days: { monday: {} } } } }), emptyDailyWorkState());
const validDailyWork = { weeks: { 'week-11': { days: { monday: { sheets: { math: { items: { coins: { value: { quarter: 3, dime: 1, penny: 4 }, status: 'answered', checkedAt: iso } } } }, submittedAt: iso } } } } };
assert.deepEqual(normalizeDailyWork(validDailyWork), validDailyWork);

const hostile = normalizeDailyWork({ weeks: { 'week-11': { days: {
  monday: { sheets: { math: { items: {
    unknownStatus: { value: 4, status: 'maybe', checkedAt: iso },
    badCoins: { value: { quarter: -1, dime: 1.5, nickel: 4, unknown: 5 }, status: 'answered', checkedAt: '2026-02-30T12:00:00.000Z' },
    unsafe: { value: ['not', 'allowed'], status: 'correct', checkedAt: '2026-09-22T24:00:00.000Z' },
  } } }, submittedAt: 'not-a-date' }, saturday: { sheets: {} },
} }, nope: { days: { monday: {} } } } });
assert.deepEqual(hostile, { weeks: { 'week-11': { days: { monday: { sheets: { math: { items: {
  unknownStatus: { value: 4, status: 'unanswered', checkedAt: iso },
  badCoins: { value: { nickel: 4 }, status: 'answered', checkedAt: null },
  unsafe: { value: null, status: 'correct', checkedAt: null },
} } }, submittedAt: null } } } } });

const noDailyWork = normalizeCq({ track: 'guided' });
assert.deepEqual(noDailyWork.dailyWork, emptyDailyWorkState());
assert.deepEqual(normalizeCq({ track: 'guided', dailyWork: validDailyWork }).dailyWork, validDailyWork);

console.log('cq daily work tests passed');
