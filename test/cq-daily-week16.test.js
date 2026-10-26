// Week 16: independent arithmetic from prompts, sheet structure, reuse, schedule, and kid render.
import assert from 'node:assert/strict';
import { DAILY_WORK } from '../src/cq/daily-work/content.js';
import { currentWeek } from '../src/cq/daily-work/schedule.js';
import { blockPlan, blockView } from '../src/daily/blocks.js';

globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
const { gradeSuggestion } = await import('../src/daily/parent-view.js');
const { renderSheetArticle } = await import('../src/daily/sheet-view.js');

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const WEEKS = {
  guided: DAILY_WORK.guided.weeks['week-16'],
  standard: DAILY_WORK.standard.weeks['week-16'],
};
const SUBJECTS = [
  ['math', 'word-problems', 'bible-reading'],
  ['math', 'codequest', 'bible-reading'],
  ['math', 'codequest', 'bible-reading'],
  ['math', 'word-problems', 'bible-reading'],
  ['math', 'word-problems', 'bible-reading'],
];
const COUNTS = {
  guided: [[7, 3, 3], [7, 3, 1], [7, 3, 3], [7, 3, 3], [8, 3, 1]],
  standard: [[10, 5, 3], [10, 3, 1], [11, 3, 3], [10, 3, 3], [6, 4, 1]],
};
const TITLES = {
  guided: [
    ['Fours: Double, Then Double Again', 'Groups of Four'],
    ['Fives and Tens: Nickels and Dimes'],
    ['Sevens: Five Groups Plus Two Groups'],
    ['Sevens Again, and More Fours', 'Groups of Seven'],
    ['Show What You Know', 'Coins and Groups'],
  ],
  standard: [
    ['Tenths Are Dimes', 'Tenths in Money and Measuring'],
    ['Hundredths Are Cents, and a Shortcut That Always Works'],
    ['Decimal Times Decimal: A Dime of a Dime Is a Penny'],
    ['Put It Together, Then Percent Blocks', 'Decimals in Stories'],
    ['Show What You Know', 'Decimals Out in the World'],
  ],
};
const sheet = (track, day, index) => WEEKS[track].days[day].sheets[index];
const item = (track, day, sheetIndex, id) => {
  const found = sheet(track, day, sheetIndex).items.find((x) => x.id === id);
  assert.ok(found, track + '/' + day + '/' + id + ' exists');
  return found;
};

// Exact decimal arithmetic uses scaled BigInt values. No expected product comes from content.js.
const dec = (value) => {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(String(value));
  assert.ok(match, 'decimal: ' + value);
  return { n: BigInt(match[1] + (match[2] || '')), p: (match[2] || '').length };
};
const ten = (power) => 10n ** BigInt(power);
const cmp = (a, b) => {
  const places = Math.max(a.p, b.p);
  const left = a.n * ten(places - a.p);
  const right = b.n * ten(places - b.p);
  return left === right ? 0 : left > right ? 1 : -1;
};
const multiply = (a, b) => ({ n: a.n * b.n, p: a.p + b.p });
const divide100 = (a) => ({ n: a.n, p: a.p + 2 });
const equalAnswer = (entry, expected, label) => {
  assert.equal(entry.kind, 'numeric', label);
  assert.equal(typeof entry.answer, 'number', label + ' is a JS number');
  assert.equal(cmp(dec(entry.answer), expected), 0, label + ' = ' + entry.answer);
};
const values = (prompt) => (prompt.match(/\d+(?:\.\d+)?/g) || []).map(dec);
const firstProduct = (prompt) => {
  const match = /(\d+(?:\.\d+)?) × (\d+(?:\.\d+)?) = \?/.exec(prompt);
  return match ? multiply(dec(match[1]), dec(match[2])) : null;
};
const render = (week, day, entry) => renderSheetArticle(
  week, day, entry, { sheets: {}, submittedAt: null }, false, () => 0, () => false,
);

for (const track of ['guided', 'standard']) {
  const week = WEEKS[track];
  assert.equal(week.id, 'week-16');
  assert.equal(week.label, 'Week 16');
  assert.equal(week.assignedWeekOf, '2026-10-26');
  assert.equal(Object.hasOwn(week, 'breakWeek'), false);
  assert.equal(Object.hasOwn(week, 'celebration'), false);
  assert.equal(currentWeek(DAILY_WORK, track, '2026-10-25').id, 'week-15');
  for (const date of ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01']) {
    assert.equal(currentWeek(DAILY_WORK, track, date).id, 'week-16', track + '/' + date);
  }
  assert.equal(currentWeek(DAILY_WORK, track, '2026-11-02'), null);
  assert.deepEqual(DAYS.map((day) => week.days[day].sheets.map((x) => x.subject)), SUBJECTS);
  assert.deepEqual(DAYS.map((day) => week.days[day].sheets.map((x) => x.items.length)), COUNTS[track]);
  assert.deepEqual(DAYS.map((day) => week.days[day].sheets.filter((x) => x.subject === 'math' || x.subject === 'word-problems').map((x) => x.title)), TITLES[track]);
  assert.equal(week.weekItems.length, 1);
  const verse = week.weekItems[0];
  assert.equal(verse.id, 'memory-verse');
  assert.equal(verse.subject, 'memory-verse');
  assert.equal(verse.title, 'Memory Verse');
  assert.equal(verse.items.length, 1);
  assert.equal(verse.items[0].kind, 'fill-blank');
  const words = track === 'guided' ? ['lamp', 'light'] : ['trust', 'understanding', 'path'];
  const citation = track === 'guided' ? 'Psalm 119:105 (NLT)' : 'Proverbs 3:5-6 (NLT)';
  const text = track === 'guided'
    ? 'Your word is a lamp to guide my feet and a light for my path.'
    : 'trust in the LORD with all your heart; do not depend on your own understanding. Seek his will in all you do, and he will show you which path to take.';
  assert.equal(verse.citation, citation);
  assert.deepEqual(verse.items[0].wordBank, words);
  assert.deepEqual(verse.items[0].answer, words);
  assert.equal(verse.items[0].prompt.split('___').length - 1, words.length);
  let blank = 0;
  assert.equal(verse.items[0].prompt.replace(/___/g, () => words[blank++]), text);
  if (track === 'standard') assert.ok(verse.items[0].prompt.startsWith('___ in the LORD'));
  for (const day of DAYS) {
    const sheets = week.days[day].sheets;
    assert.ok([7, 8].includes(sheet(track, day, 0).items.length) || track === 'standard');
    for (const current of sheets) {
      assert.equal(new Set(current.items.map((x) => x.id)).size, current.items.length, track + '/' + day + ' unique ids');
      if (current.subject === 'math' || current.subject === 'word-problems') {
        assert.ok(current.intro && current.example, track + '/' + day + ' has how-to and example');
        assert.equal(/^\d+\. /m.test(current.example), false, 'list numbers removed');
      }
      const html = render(week, day, current);
      for (const entry of current.items) {
        assert.ok(entry.parentNote, track + '/' + day + '/' + entry.id + ' has parent note');
        assert.equal(html.includes(entry.parentNote), false, track + '/' + day + '/' + entry.id + ' note hidden');
      }
      assert.equal(html.includes('parentNote'), false);
    }
    assert.deepEqual(sheets[2], DAILY_WORK[track].weeks['week-15'].days[day].sheets[0], track + '/' + day + ' Bible reused');
    if (day === 'tuesday' || day === 'wednesday') {
      assert.deepEqual(sheets[1], DAILY_WORK[track].weeks['week-14'].days[day].sheets[1], track + '/' + day + ' CodeQuest reused');
    }
  }
  render(week, 'monday', verse);
}

// All older-son numeric answers are derived from their prompt's factors, units, or story quantities.
let olderNumeric = 0;
let comparisons = 0;
let blocks = 0;
for (const day of DAYS) {
  for (const current of WEEKS.standard.days[day].sheets.filter((x) => ['math', 'word-problems'].includes(x.subject))) {
    current.items.forEach((entry, index) => {
      const label = 'standard/' + day + '/' + current.title + '/' + entry.id;
      if (entry.kind === 'fill-blank') {
        const match = /^Is ([\d.]+) × ([\d.]+) bigger or smaller than ([\d.]+)\?$/.exec(entry.prompt);
        assert.ok(match, label + ' comparison prompt');
        const expected = cmp(multiply(dec(match[1]), dec(match[2])), dec(match[3])) > 0 ? 'bigger' : 'smaller';
        assert.deepEqual(entry.wordBank, ['bigger', 'smaller']);
        assert.deepEqual(entry.answer, [expected], label);
        assert.equal(gradeSuggestion(entry, [expected]), true);
        assert.equal(gradeSuggestion(entry, [expected === 'bigger' ? 'smaller' : 'bigger']), false);
        comparisons++;
        return;
      }
      olderNumeric++;
      let expected;
      const p = entry.prompt;
      let match;
      if (entry.part !== undefined) {
        match = /^(\d+) out of (\d+) is what percent\?$/.exec(p);
        assert.ok(match, label + ' block prompt');
        assert.equal(entry.part, Number(match[1]));
        assert.equal(entry.whole, Number(match[2]));
        expected = { n: BigInt(entry.part * 10000), p: 2 };
        assert.equal(expected.n % BigInt(entry.whole), 0n, label + ' exact percent');
        expected.n /= BigInt(entry.whole);
        assert.equal(entry.unit, 'percent');
        assert.equal(entry.perItem, true);
        assert.equal(entry.help, day === 'thursday' ? 'unit' : 'clues');
        assert.deepEqual(blockPlan(entry.part, entry.whole, true), { count: entry.whole, size: 1 });
        const view = blockView(entry, 0, false);
        assert.ok(view && view.count === entry.whole);
        if (day === 'thursday') {
          assert.equal(view.caption, '1 block = ' + (entry.whole === 16 ? '6.25' : '2.5') + '%');
          const before = current.items[index - 1];
          assert.equal(before.id, entry.id[0] + 'a');
          const unscaled = firstProduct(before.prompt);
          assert.ok(unscaled);
          const digits = entry.whole === 16 ? 2 : 1;
          assert.equal(cmp({ n: unscaled.n, p: digits }, expected), 0, label + ' stepped block line');
        } else {
          assert.ok(view.labels.some((x) => x !== null), label + ' has clue labels');
        }
        blocks++;
      } else if ((match = /^How many tenths is ([\d.]+)\?$/.exec(p))) {
        expected = multiply(dec(match[1]), dec(10));
      } else if ((match = /^How many decimal places does ([\d.]+) have\?$/.exec(p))) {
        expected = dec(dec(match[1]).p);
      } else if (p.startsWith('How many decimal places in all?')) {
        const places = [...p.matchAll(/has (\d+)/g)].reduce((sum, x) => sum + Number(x[1]), 0);
        expected = dec(places);
      } else if (p === 'How much do you earn, in dollars?') {
        const first = current.items[0].prompt;
        match = /\(\$([\d.]+)\) (\d+) times/.exec(first);
        assert.ok(match, label + ' source price and count');
        expected = multiply(dec(match[1]), dec(match[2]));
      } else if ((match = /^You clean the litter box \(\$([\d.]+)\) \d+ times this week\. First, how many tenths/.exec(p))) {
        expected = multiply(dec(match[1]), dec(10));
      } else if ((expected = firstProduct(p))) {
        // Factor pair read from the answer line, including estimate and ignore-the-point lines.
      } else if ((match = /^Find (\d+)% of \$(\d+)/.exec(p))) {
        expected = multiply(divide100(dec(match[1])), dec(match[2]));
      } else {
        const factors = values(p);
        assert.equal(factors.length, 2, label + ' has two story quantities');
        expected = multiply(factors[0], factors[1]);
      }
      equalAnswer(entry, expected, label);
    });
  }
}
assert.equal(comparisons, 7);
assert.equal(blocks, 4);
assert.ok(olderNumeric > 50, 'every older numeric line checked');

// Younger-son facts, doubling and 5s+2s chains, stories, coin percent, and pile cents.
let youngerNumeric = 0;
let pileCount = 0;
for (const day of DAYS) {
  for (const current of WEEKS.guided.days[day].sheets.filter((x) => ['math', 'word-problems'].includes(x.subject))) {
    for (const entry of current.items) {
      const label = 'guided/' + day + '/' + current.title + '/' + entry.id;
      if (entry.kind === 'scale') {
        assert.equal(day, 'friday');
        assert.equal(entry.id, '8');
        assert.equal(entry.scaleMax, 5);
        assert.equal(entry.answer, null);
        continue;
      }
      if (entry.pile) {
        const match = /(\d+) nickels/.exec(entry.prompt);
        assert.ok(match, label + ' pile prompt');
        const cents = Number(match[1]) * 5;
        assert.deepEqual(entry.pile, { nickel: Number(match[1]) });
        assert.equal(entry.answer, cents, label + ' answer stored in cents');
        assert.equal(gradeSuggestion(entry, '0.35'), true);
        pileCount++;
        continue;
      }
      youngerNumeric++;
      let expected = firstProduct(entry.prompt);
      let match;
      if (!expected && (match = /(\d+) \+ (\d+) = \?/.exec(entry.prompt))) {
        expected = { n: BigInt(match[1]) + BigInt(match[2]), p: 0 };
      }
      if (!expected && /^What percent of a dollar is /.test(entry.prompt)) {
        const quarters = /(\d+) quarters?/.exec(entry.prompt);
        const dimes = /(\d+) dimes?/.exec(entry.prompt);
        expected = dec((quarters ? Number(quarters[1]) * 25 : 0) + (dimes ? Number(dimes[1]) * 10 : 0));
      }
      if (!expected && /has \d+ (dimes|nickels)/.test(entry.prompt)) {
        match = /has (\d+) (dimes|nickels)/.exec(entry.prompt);
        expected = dec(Number(match[1]) * (match[2] === 'dimes' ? 10 : 5));
      }
      if (!expected) {
        const factors = values(entry.prompt);
        assert.equal(factors.length, 2, label + ' story has two quantities');
        expected = multiply(factors[0], factors[1]);
      }
      equalAnswer(entry, expected, label);
      if (day === 'monday' && entry.id === '4') {
        assert.equal(entry.answer, 0);
        assert.equal(gradeSuggestion(entry, '0'), true);
        assert.equal(gradeSuggestion(entry, '1'), false);
      }
    }
  }
}
assert.equal(pileCount, 1);
assert.equal(youngerNumeric, 43, 'every younger numeric line checked');
const chain = (day, ids, expected) => {
  const prompts = ids.map((id) => item('guided', day, 0, id).prompt);
  const answers = ids.map((id) => item('guided', day, 0, id).answer);
  assert.deepEqual(answers, expected, day + ' stepped chain');
  assert.ok(prompts.every(Boolean));
};
chain('monday', ['1a', '1b', '1c'], [2 * 4, 2 * 4 * 2, 4 * 4]);
chain('monday', ['2a', '2b'], [2 * 5, 4 * 5]);
chain('wednesday', ['1a', '1b', '1c'], [5 * 4, 2 * 4, 7 * 4]);
chain('wednesday', ['2a', '2b', '2c'], [5 * 5, 2 * 5, 7 * 5]);
chain('thursday', ['2a', '2b', '2c'], [5 * 6, 2 * 6, 7 * 6]);

// The authoring marker stays in parent notes and out of every visible string.
const banned = /\b(easy|hard|guided|standard|Jesse|Dad|UNSURE)\b|INTENTIONAL REPEAT/i;
for (const track of ['guided', 'standard']) {
  const week = WEEKS[track];
  const visible = [week.label];
  for (const entry of week.weekItems) {
    visible.push(entry.title, entry.intro || '', entry.example || '', entry.citation || '');
    for (const x of entry.items) visible.push(x.prompt, ...(x.wordBank || []));
  }
  for (const day of DAYS) for (const current of week.days[day].sheets) {
    visible.push(current.title, current.intro || '', current.example || '', current.citation || '');
    for (const x of current.items) visible.push(x.prompt, ...(x.wordBank || []), ...(x.choices || []));
  }
  for (const text of visible) assert.equal(banned.test(text), false, track + ' visible: ' + text);
}
assert.ok(item('guided', 'monday', 0, '1a').parentNote.includes('INTENTIONAL REPEAT'));
assert.ok(!sheet('guided', 'tuesday', 0).example.includes('INTENTIONAL REPEAT'));
console.log('ok - week 16: schedules, 30 daily sheets, Bible reuse, verses, independent arithmetic, blocks, chains, parent-note isolation');
