// Week 18: source structure, independently derived answers, schedule, and kid render.
import assert from 'node:assert/strict';
import { DAILY_WORK } from '../src/cq/daily-work/content.js';
import { currentWeek } from '../src/cq/daily-work/schedule.js';

globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
const { renderSheetArticle } = await import('../src/daily/sheet-view.js');
const { gradeSuggestion } = await import('../src/daily/parent-view.js');

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const SUBJECTS = [
  ['math', 'word-problems', 'bible-reading'],
  ['math', 'codequest'],
  ['codequest', 'bible-reading'],
  ['math', 'word-problems'],
  ['math', 'word-problems', 'bible-reading'],
];
const COUNTS = {
  standard: [[9, 3, 3], [9, 3], [3, 1], [9, 4], [6, 5, 3]],
  guided: [[8, 7, 3], [8, 3], [3, 1], [8, 7], [8, 7, 3]],
};
const TITLES = {
  standard: [
    ['Sales Tax: The Price Goes Up', 'Clue Words: Tax and Tip Go Up, Off and Sale Go Down'],
    ['Percent Off: The Price Goes Down'],
    [],
    ['Up or Down? Then Find the Answer', 'Two Steps: Sale First, Then Tax'],
    ['Show What You Know', 'Shopping Stories on Your Own'],
  ],
  guided: [
    ['Sixes: Five Groups Plus One More', 'Groups of Six'],
    ['Eights: Double the Fours'],
    [],
    ['Nines: Ten Groups Minus One', 'Groups of Nine'],
    ['Show What You Know', 'Show What You Know: Stories'],
  ],
};
const verseData = {
  standard: {
    citation: '1 John 4:7-8 (NLT)',
    words: ['continue', 'child', 'knows'],
    text: 'Dear friends, let us continue to love one another, for love comes from God. Anyone who loves is a child of God and knows God. But anyone who does not love does not know God, for God is love.',
  },
  guided: {
    citation: '1 John 4:19 (NLT)',
    words: ['loved', 'first'],
    text: 'We love each other because he loved us first.',
  },
};
const forbidden = /\b(?:easy|hard|guided|standard|Jesse|Dad|UNSURE|INTENTIONAL REPEAT)\b/i;
const week = (track) => DAILY_WORK[track].weeks['week-18'];
const cents = (value) => {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(value));
  assert.ok(match, 'money amount: ' + value);
  return BigInt(match[1]) * 100n + BigInt((match[2] || '').padEnd(2, '0'));
};
const checkCents = (item, expected, label) => {
  assert.equal(item.kind, 'numeric', label);
  assert.equal(typeof item.answer, 'number', label);
  assert.equal(cents(item.answer), expected, label);
};
const priceAndRate = (prompt) => {
  const price = /\$(\d+(?:\.\d{1,2})?)/.exec(prompt);
  const rate = /(\d+)%/.exec(prompt);
  assert.ok(price && rate, 'price and rate: ' + prompt);
  return { price: cents(price[1]), rate: BigInt(rate[1]) };
};
const clue = (prompt) => {
  if (/\b(?:tax|tip|fee)\b/i.test(prompt)) return 'up';
  if (/\b(?:off|sale|discount|coupon)\b/i.test(prompt)) return 'down';
  assert.fail('missing direction clue: ' + prompt);
};
const scenario = (sheet, index) => {
  for (let i = index; i >= 0; i--) {
    if (/\$\d/.test(sheet.items[i].prompt) && /\d+%/.test(sheet.items[i].prompt)) return sheet.items[i].prompt;
  }
  assert.fail('missing scenario: ' + sheet.title + '/' + sheet.items[index].id);
};
const olderExpected = (sheet, index) => {
  const item = sheet.items[index], prompt = item.prompt;
  const direct = /What is (\d+(?:\.\d+)?) × (\d+)\?/.exec(prompt);
  if (direct) return cents(direct[2]) * BigInt(direct[1].replace('.', '')) / 10n ** BigInt((direct[1].split('.')[1] || '').length);
  const estimate = /What is 10% of (\d+)\?/.exec(prompt);
  if (estimate) return cents(estimate[1]) / 10n;
  const source = scenario(sheet, index);
  const { price, rate } = priceAndRate(source);
  // The second line of a two-step story taxes its independently computed sale price.
  if (/^Then \d+% tax is added to the sale price\./.test(prompt)) {
    const prior = sheet.items[index - 1].prompt;
    const sale = priceAndRate(prior);
    return sale.price * (100n - sale.rate) / 100n * (100n + BigInt(/Then (\d+)%/.exec(prompt)[1])) / 100n;
  }
  if (/How much (?:do you save|is the tax|is the tip)/i.test(prompt)) return price * rate / 100n;
  const direction = clue(source);
  return price * (direction === 'up' ? 100n + rate : 100n - rate) / 100n;
};
const storyOperation = (prompt) => {
  if (/gives? \d+ away|spends? \d+/i.test(prompt)) return 'B';
  if (/gets? \d+ more/i.test(prompt)) return 'A';
  return 'C';
};
const youngerExpected = (sheet, index) => {
  const item = sheet.items[index], prompt = item.prompt;
  if (sheet.subject === 'math') {
    const product = /(\d+) × (\d+) = \?/.exec(prompt);
    if (product) return Number(product[1]) * Number(product[2]);
    const sum = /(\d+) \+ (\d+) = \?/.exec(prompt);
    if (sum) return Number(sum[1]) + Number(sum[2]);
    const difference = /(\d+) − (\d+) = \?/.exec(prompt);
    if (difference) return Number(difference[1]) - Number(difference[2]);
    assert.fail('unparsed math prompt: ' + prompt);
  }
  const source = /\d/.test(prompt) && !/^How many/.test(prompt) ? prompt : sheet.items[index - 1].prompt;
  const numbers = [...source.matchAll(/\d+/g)].map((m) => Number(m[0]));
  assert.equal(numbers.length, 2, 'two story numbers: ' + source);
  const op = storyOperation(source);
  return op === 'A' ? numbers[0] + numbers[1] : op === 'B' ? numbers[0] - numbers[1] : numbers[0] * numbers[1];
};

for (const track of ['standard', 'guided']) {
  const w = week(track);
  assert.equal(w.id, 'week-18');
  assert.equal(w.label, 'Week 18');
  assert.equal(w.assignedWeekOf, '2026-11-09');
  assert.equal('breakWeek' in w, false);
  assert.equal('celebration' in w, false);
  assert.equal(currentWeek(DAILY_WORK, track, '2026-11-08').id, 'week-17');
  for (const date of ['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15']) {
    assert.equal(currentWeek(DAILY_WORK, track, date).id, 'week-18', track + '/' + date);
  }
  assert.equal(currentWeek(DAILY_WORK, track, '2026-11-16'), null);
  assert.deepEqual(DAYS.map((day) => w.days[day].sheets.map((sheet) => sheet.subject)), SUBJECTS);
  assert.deepEqual(DAYS.map((day) => w.days[day].sheets.map((sheet) => sheet.items.length)), COUNTS[track]);
  assert.deepEqual(DAYS.map((day) => w.days[day].sheets.filter((sheet) => ['math', 'word-problems'].includes(sheet.subject)).map((sheet) => sheet.title)), TITLES[track]);
  assert.equal(w.weekItems.length, 1);
  const verse = w.weekItems[0], expectedVerse = verseData[track];
  assert.equal(verse.id, 'memory-verse');
  assert.equal(verse.subject, 'memory-verse');
  assert.equal(verse.title, 'Memory Verse');
  assert.equal(verse.intro, null);
  assert.equal(verse.example, null);
  assert.equal(verse.citation, expectedVerse.citation);
  assert.equal(verse.items.length, 1);
  assert.equal(verse.items[0].id, 'verse');
  assert.equal(verse.items[0].kind, 'fill-blank');
  assert.deepEqual(verse.items[0].wordBank, expectedVerse.words);
  assert.deepEqual(verse.items[0].answer, expectedVerse.words);
  assert.equal(verse.items[0].prompt.split('___').length - 1, expectedVerse.words.length);
  let blank = 0;
  assert.equal(verse.items[0].prompt.replace(/___/g, () => expectedVerse.words[blank++]), expectedVerse.text);
  assert.equal(forbidden.test([verse.title, verse.citation, verse.items[0].prompt, ...expectedVerse.words].join(' ')), false);
  for (const day of DAYS) {
    for (const sheet of w.days[day].sheets) {
      assert.equal(new Set(sheet.items.map((item) => item.id)).size, sheet.items.length, track + '/' + day + ' unique ids');
      if (['math', 'word-problems'].includes(sheet.subject)) {
        assert.ok(sheet.intro && sheet.example, track + '/' + day + ' how-to and example');
        assert.equal(/^\d+\. /m.test(sheet.example), false, 'worked example list numbers removed');
      }
      if (sheet.subject === 'bible-reading') {
        assert.deepEqual(sheet, DAILY_WORK[track].weeks['week-17'].days[day].sheets[2], track + '/' + day + ' Bible exact reuse');
      }
      if (sheet.subject === 'codequest') {
        assert.deepEqual(sheet, DAILY_WORK[track].weeks['week-17'].days[day].sheets[1], track + '/' + day + ' CodeQuest exact reuse');
      }
      const kidText = [sheet.title, sheet.intro || '', sheet.example || '', ...sheet.items.flatMap((item) => [item.prompt, ...(item.wordBank || []), ...(item.choices || [])])].join(' ');
      assert.equal(forbidden.test(kidText), false, track + '/' + day + '/' + sheet.title + ' kid text');
      const html = renderSheetArticle(w, day, sheet, { sheets: {}, submittedAt: null }, false, () => 0, () => false);
      const withoutNotes = { ...sheet, items: sheet.items.map(({ parentNote, ...item }) => item) };
      assert.equal(
        html,
        renderSheetArticle(w, day, withoutNotes, { sheets: {}, submittedAt: null }, false, () => 0, () => false),
        track + '/' + day + '/' + sheet.title + ' parent notes do not affect kid render',
      );
      assert.equal(html.includes('parentNote'), false);
      for (const [index, item] of sheet.items.entries()) {
        assert.ok(item.parentNote, track + '/' + day + '/' + item.id + ' parent note');
        if (!kidText.includes(item.parentNote)) {
          assert.equal(html.includes(item.parentNote), false, track + '/' + day + '/' + item.id + ' note hidden');
        }
        assert.notEqual(item.unit, 'percent');
        if (sheet.subject === 'math' || sheet.subject === 'word-problems') {
          if (item.kind === 'numeric') {
            if (track === 'standard') checkCents(item, olderExpected(sheet, index), track + '/' + day + '/' + sheet.title + '/' + item.id);
            else {
              assert.equal(item.answer, youngerExpected(sheet, index), track + '/' + day + '/' + sheet.title + '/' + item.id);
              const hint = /Hint: (\d+) × (\d+) = (\d+)/.exec(item.prompt);
              if (hint) {
                assert.equal(Number(hint[1]) * Number(hint[2]), Number(hint[3]), day + '/' + item.id + ' hint fact');
                assert.equal(item.answer, day === 'thursday' ? Number(hint[3]) - Number(hint[2]) : 2 * Number(hint[3]), day + '/' + item.id + ' hint route');
              }
            }
          }
          if (track === 'standard' && item.kind === 'fill-blank') {
            assert.equal(item.prompt.includes('___'), false);
            assert.deepEqual(item.wordBank, day === 'thursday' ? ['up', 'down'] : ['more', 'less']);
            const sourceClue = clue(item.prompt);
            assert.deepEqual(item.answer, [day === 'thursday' ? sourceClue : sourceClue === 'up' ? 'more' : 'less']);
          }
          if (track === 'guided' && item.kind === 'multiple-choice') {
            assert.equal(item.prompt.includes('A) Add'), false);
            assert.ok(item.prompt.endsWith('What do you need to do?'));
            assert.deepEqual(item.choices, ['Add', 'Take away', 'Multiply']);
            assert.equal(item.answer, storyOperation(item.prompt));
          }
        }
      }
    }
  }
  if (track === 'standard') {
    for (const day of ['monday', 'tuesday']) {
      const items = w.days[day].sheets[0].items;
      assert.equal(items.find((item) => item.id === '1c').answer, items.find((item) => item.id === '1d').answer, day + ' route agreement');
    }
    assert.equal(w.days.friday.sheets[0].items.at(-1).kind, 'short-text');
    assert.equal(w.days.friday.sheets[1].items.at(-1).kind, 'short-text');
  } else {
    for (const day of ['monday', 'tuesday', 'thursday']) {
      const items = w.days[day].sheets[0].items;
      for (const prefix of ['1', '2']) {
        const a = items.find((item) => item.id === prefix + 'a');
        const b = items.find((item) => item.id === prefix + 'b');
        const c = items.find((item) => item.id === prefix + 'c');
        const amount = day === 'monday' ? Number(/one more group of (\d+)/.exec(b.prompt)[1]) : day === 'thursday' ? Number(/one group of (\d+)/.exec(b.prompt)[1]) : a.answer;
        assert.equal(b.answer, day === 'thursday' ? a.answer - amount : a.answer + amount, day + '/' + prefix + ' intermediate');
        assert.equal(c.answer, b.answer, day + '/' + prefix + ' chain');
      }
    }
    const scale = w.days.friday.sheets[0].items.at(-1);
    assert.equal(scale.kind, 'scale');
    assert.equal(scale.scaleMax, 5);
  }
}
const moneyItem = week('standard').days.monday.sheets[0].items.find((item) => item.id === '1c');
assert.equal(moneyItem.answer, 42.4);
assert.equal(gradeSuggestion(moneyItem, '42.40'), true);
assert.equal(gradeSuggestion(moneyItem, '42.4'), true);
assert.equal(gradeSuggestion(moneyItem, '42.41'), false);

console.log('Week 18 structure, independent answers, schedule, and kid render: passed');
