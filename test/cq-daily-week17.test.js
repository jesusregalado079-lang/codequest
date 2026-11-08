// Week 17: independent arithmetic, source structure, schedule, choices, and kid render.
import assert from 'node:assert/strict';
import { DAILY_WORK } from '../src/cq/daily-work/content.js';
import { currentWeek } from '../src/cq/daily-work/schedule.js';

globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
const { renderSheetArticle } = await import('../src/daily/sheet-view.js');

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const SUBJECTS = [
  ['math', 'word-problems', 'bible-reading'],
  ['math', 'codequest'],
  ['math', 'codequest', 'bible-reading'],
  ['math', 'word-problems'],
  ['math', 'word-problems', 'bible-reading'],
];
const COUNTS = {
  standard: [[8, 3, 3], [9, 3], [7, 3, 1], [8, 3], [6, 4, 3]],
  guided: [[7, 3, 3], [7, 3], [7, 3, 1], [7, 3], [8, 3, 3]],
};
const TITLES = {
  standard: [
    ['Percent Is a Decimal', 'Tithe, Savings and Spending'],
    ['Sales Tax: A Percent on Top of the Price'],
    ['Percent Off: Pay What Is Left'],
    ['Estimate First, Then Find the Exact Answer', 'Percents in Real Life'],
    ['Show What You Know', 'Percent Stories on Your Own'],
  ],
  guided: [
    ['Fours Two Ways', 'Groups of Four'],
    ['Sevens Again: Five Groups Plus Two Groups'],
    ['Fours and Sevens Mixed'],
    ['Fours and Sevens Again', 'Groups of Seven'],
    ['Show What You Know', 'Groups and Coins'],
  ],
};
const BIBLE_TITLES = {
  monday: 'Bible Reading: Exodus 19:1-14, then 19:16-25',
  wednesday: 'Bible Reading: Exodus 20:1-21',
  friday: 'Bible Reading: Matthew 22:34-40, then Luke 10:25-37',
};
const week = (track) => DAILY_WORK[track].weeks['week-17'];
const dec = (value) => {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(String(value));
  assert.ok(match, 'decimal ' + value);
  return { n: BigInt(match[1] + (match[2] || '')), p: (match[2] || '').length };
};
const ten = (p) => 10n ** BigInt(p);
const add = (a, b) => {
  const p = Math.max(a.p, b.p);
  return { n: a.n * ten(p - a.p) + b.n * ten(p - b.p), p };
};
const subtract = (a, b) => {
  const p = Math.max(a.p, b.p);
  return { n: a.n * ten(p - a.p) - b.n * ten(p - b.p), p };
};
const mul = (a, b) => ({ n: a.n * b.n, p: a.p + b.p });
const percentOf = (pct, amount) => mul({ n: BigInt(pct), p: 2 }, dec(amount));
const assertNumber = (entry, expected, label) => {
  assert.equal(entry.kind, 'numeric', label);
  assert.equal(typeof entry.answer, 'number', label + ' JS number');
  const got = dec(entry.answer);
  const p = Math.max(got.p, expected.p);
  assert.equal(got.n * ten(p - got.p), expected.n * ten(p - expected.p), label);
};
const amountAndPercent = (prompt) => {
  const price = /\$(\d+(?:\.\d+)?)/.exec(prompt);
  const pct = /(\d+)%/.exec(prompt);
  assert.ok(price && pct, 'price and percent in ' + prompt);
  return { price: price[1], pct: Number(pct[1]) };
};
const standardAnswer = (entry, current) => {
  const p = entry.prompt;
  let m;
  if ((m = /^Write (\d+)% as a decimal\.$/.exec(p))) return { n: BigInt(m[1]), p: 2 };
  if ((m = /^What is (\d+)% of \$?(\d+)(?:\?|\? Type the number of dollars\.)$/.exec(p))) return percentOf(Number(m[1]), m[2]);
  if ((m = /^Estimate: round \d+% to 50%\. What is half of (\d+)\?$/.exec(p))) return { n: BigInt(m[1]) / 2n, p: 0 };
  if ((m = /^Estimate: round \d+% to 10%\. What is 10% of (\d+)\?$/.exec(p))) return percentOf(10, m[1]);
  if (/give 10%, save 20%, and spend the rest/.test(p)) {
    const price = /\$(\d+)/.exec(p)[1];
    return subtract(subtract(dec(price), percentOf(10, price)), percentOf(20, price));
  }
  if (/tithe|You save|You spend/.test(p)) {
    const { price, pct } = amountAndPercent(p);
    return percentOf(pct, price);
  }
  if (/tip/.test(p)) {
    const { price, pct } = amountAndPercent(p);
    const tip = percentOf(pct, price);
    return /total/.test(p) ? add(dec(price), tip) : tip;
  }
  if (/What percent do you pay\?/.test(p)) {
    const { pct } = amountAndPercent(p);
    return dec(100 - pct);
  }
  if (/pay|sale price/.test(p) && /off/.test(p)) {
    const { price, pct } = amountAndPercent(p);
    return percentOf(100 - pct, price);
  }
  if (/^How much do you pay for the/.test(p)) {
    const source = current.items.find((x) => x.id === entry.id.replace(/b$/, 'a'));
    assert.ok(source, 'discount source ' + entry.id);
    const { price, pct } = amountAndPercent(source.prompt);
    return percentOf(100 - pct, price);
  }
  if (/^What is the total for the/.test(p)) {
    const source = current.items.find((x) => x.id === entry.id.replace(/c$/, 'b') || (entry.id === '3b' && x.id === '3a'));
    assert.ok(source, 'tax source ' + entry.id);
    const { price, pct } = amountAndPercent(source.prompt);
    return add(dec(price), percentOf(pct, price));
  }
  if (/tax/.test(p)) {
    const { price, pct } = amountAndPercent(p);
    const tax = percentOf(pct, price);
    return /total/.test(p) ? add(dec(price), tax) : tax;
  }
  assert.fail('unparsed older-son prompt: ' + p);
};
const guidedAnswer = (entry) => {
  const p = entry.prompt;
  const products = [...p.matchAll(/(\d+) × (\d+) = \?/g)];
  if (products.length) {
    const last = products[products.length - 1];
    return mul(dec(last[1]), dec(last[2]));
  }
  const difference = /(\d+) − (\d+) = \?/.exec(p);
  if (difference) return subtract(dec(difference[1]), dec(difference[2]));
  if (/dimes/.test(p)) {
    const count = /(\d+) dimes/.exec(p);
    assert.ok(count, p);
    return mul(dec(count[1]), dec(10));
  }
  const quantities = p.match(/\d+/g) || [];
  assert.equal(quantities.length, 2, 'two story quantities: ' + p);
  return mul(dec(quantities[0]), dec(quantities[1]));
};
const forbidden = /\b(?:easy|hard|guided|standard|Jesse|Dad|UNSURE|INTENTIONAL REPEAT)\b/i;

for (const track of ['standard', 'guided']) {
  const w = week(track);
  assert.equal(w.id, 'week-17');
  assert.equal(w.label, 'Week 17');
  assert.equal(w.assignedWeekOf, '2026-11-02');
  assert.equal('breakWeek' in w, false);
  assert.equal('celebration' in w, false);
  assert.equal(currentWeek(DAILY_WORK, track, '2026-11-01').id, 'week-16');
  for (const date of ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08']) {
    assert.equal(currentWeek(DAILY_WORK, track, date).id, 'week-17', track + '/' + date);
  }
  assert.equal(currentWeek(DAILY_WORK, track, '2026-11-09').id, 'week-18');
  assert.deepEqual(DAYS.map((d) => w.days[d].sheets.map((s) => s.subject)), SUBJECTS);
  assert.deepEqual(DAYS.map((d) => w.days[d].sheets.map((s) => s.items.length)), COUNTS[track]);
  assert.deepEqual(DAYS.map((d) => w.days[d].sheets.filter((s) => ['math', 'word-problems'].includes(s.subject)).map((s) => s.title)), TITLES[track]);
  assert.equal(w.weekItems.length, 1);
  const verse = w.weekItems[0];
  assert.equal(verse.id, 'memory-verse');
  assert.equal(verse.subject, 'memory-verse');
  assert.equal(verse.title, 'Memory Verse');
  assert.equal(verse.intro, null);
  assert.equal(verse.example, null);
  assert.equal(verse.items.length, 1);
  assert.equal(verse.items[0].id, 'verse');
  assert.equal(verse.items[0].kind, 'fill-blank');
  const words = track === 'standard' ? ['pray', 'thank', 'peace'] : ['Christ', 'strength'];
  const citation = track === 'standard' ? 'Philippians 4:6-7 (NLT)' : 'Philippians 4:13 (NLT)';
  const fullVerse = track === 'standard'
    ? "Don't worry about anything; instead, pray about everything. Tell God what you need, and thank him for all he has done. Then you will experience God's peace, which exceeds anything we can understand. His peace will guard your hearts and minds as you live in Christ Jesus."
    : 'For I can do everything through Christ, who gives me strength.';
  assert.equal(verse.citation, citation);
  assert.deepEqual(verse.items[0].wordBank, words);
  assert.deepEqual(verse.items[0].answer, words);
  assert.equal(verse.items[0].prompt.split('___').length - 1, words.length);
  let blank = 0;
  assert.equal(verse.items[0].prompt.replace(/___/g, () => words[blank++]), fullVerse);
  assert.equal(forbidden.test([verse.title, verse.citation, verse.items[0].prompt, ...words].join(' ')), false);
  const verseHtml = renderSheetArticle(w, 'monday', verse, { sheets: {}, submittedAt: null }, false, () => 0, () => false);
  assert.ok(verseHtml);
  for (const day of DAYS) {
    const sheets = w.days[day].sheets;
    if (track === 'guided') assert.ok([7, 8].includes(sheets[0].items.length));
    for (const current of sheets) {
      assert.equal(new Set(current.items.map((x) => x.id)).size, current.items.length, track + '/' + day + ' unique IDs');
      if (['math', 'word-problems'].includes(current.subject)) {
        assert.ok(current.intro && current.example, track + '/' + day + ' how-to and example');
        assert.equal(/^\d+\. /m.test(current.example), false, 'worked example list numbers removed');
      }
      if (current.subject === 'bible-reading') {
        assert.equal(current.id, 'bible-reading');
        assert.equal(current.title, BIBLE_TITLES[day]);
        assert.equal(current.items.length, day === 'wednesday' ? 1 : 3);
      }
      const html = renderSheetArticle(w, day, current, { sheets: {}, submittedAt: null }, false, () => 0, () => false);
      const kidText = [current.title, current.intro || '', current.example || '', ...current.items.flatMap((x) => [x.prompt, ...(x.wordBank || []), ...(x.choices || [])])].join(' ');
      assert.equal(forbidden.test(kidText), false, track + '/' + day + '/' + current.title + ' kid-facing scan');
      for (const entry of current.items) {
        assert.ok(entry.parentNote, track + '/' + day + '/' + entry.id + ' parent note');
        assert.equal(html.includes(entry.parentNote), false, track + '/' + day + '/' + entry.id + ' note hidden');
        assert.notEqual(entry.unit, 'percent');
        if (['math', 'word-problems'].includes(current.subject) && entry.kind === 'numeric') {
          assertNumber(entry, track === 'standard' ? standardAnswer(entry, current) : guidedAnswer(entry), track + '/' + day + '/' + current.title + '/' + entry.id);
        }
      }
      assert.equal(html.includes('parentNote'), false);
    }
    if (day === 'tuesday' || day === 'wednesday') {
      assert.deepEqual(sheets[1], DAILY_WORK[track].weeks['week-16'].days[day].sheets[1], 'CodeQuest exact reuse');
    }
    if (day === 'friday' && track === 'standard') {
      const item = sheets[1].items[3];
      assert.equal(item.id, '4');
      assert.equal(item.kind, 'short-text');
    }
    if (day === 'friday' && track === 'guided') {
      const item = sheets[0].items[7];
      assert.equal(item.id, '8');
      assert.equal(item.kind, 'scale');
      assert.equal(item.scaleMax, 5);
    }
  }
}
for (const day of ['monday', 'friday']) {
  const older = week('standard').days[day].sheets[2].items;
  const younger = week('guided').days[day].sheets[2].items;
  assert.deepEqual(younger, older, day + ' same questions and keys');
  assert.deepEqual(older.map((x) => x.answer), day === 'monday' ? ['A', 'B', 'C'] : ['B', 'C', 'C']);
  for (const item of older) {
    assert.equal(item.kind, 'multiple-choice');
    assert.equal(item.choices.length, 3);
    assert.ok(['A', 'B', 'C'].includes(item.answer));
    const right = item.choices[item.answer.charCodeAt(0) - 65].length;
    const wrong = Math.max(...item.choices.filter((_, i) => i !== item.answer.charCodeAt(0) - 65).map((x) => x.length));
    assert.ok(!(right > wrong * 1.2 && right > wrong + 6), day + '/' + item.id + ' right choice length');
  }
}
for (const track of ['standard', 'guided']) {
  const item = week(track).days.wednesday.sheets[2].items[0];
  assert.equal(item.kind, 'long-text');
  assert.ok(item.prompt.endsWith(track === 'standard' ? 'Write 2 sentences.' : 'Write 1 or 2 sentences.'));
}
// The two worked tithe/save/left stories are prose examples, so check their final amounts too.
for (const day of ['thursday', 'friday']) {
  const example = week('standard').days[day].sheets[1].example;
  const earned = /You earn \$(\d+)/.exec(example);
  const give = /give (\d+)%/.exec(example);
  const save = /save (\d+)%/.exec(example);
  const stated = /Answer: \$(\d+(?:\.\d+)?)/.exec(example);
  assert.ok(earned && give && save && stated, day + ' multi-step example quantities');
  const left = subtract(subtract(dec(earned[1]), percentOf(Number(give[1]), earned[1])), percentOf(Number(save[1]), earned[1]));
  const result = dec(stated[1]);
  const places = Math.max(left.p, result.p);
  assert.equal(left.n * ten(places - left.p), result.n * ten(places - result.p), day + ' worked left amount');
}
// First and last guided chains agree with their visible intermediate lines.
for (const [day, prefix, operation] of [['monday', '1', 'subtract'], ['tuesday', '1', 'add'], ['wednesday', '1', 'subtract'], ['thursday', '5', 'add']]) {
  const entries = week('guided').days[day].sheets[0].items;
  const line = (suffix) => entries.find((x) => x.id === prefix + suffix);
  const expected = operation === 'add'
    ? add(dec(line('a').answer), dec(line('b').answer))
    : subtract(dec(line('a').answer), dec(/(?:one group of |− )(\d+)/.exec(line('b').prompt)[1]));
  assertNumber(line('c'), expected, day + ' guided chain');
}
// A how-to paragraph can never come from another sheet: the CodeQuest how-to only belongs on CodeQuest sheets, and the
// younger son's Friday "Groups and Coins" sheet carries its own coin-groups paragraph (found by the blind verifier).
['guided', 'standard'].forEach((track) => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach((day) => {
  DAILY_WORK[track].weeks['week-17'].days[day].sheets.forEach((sheet) => {
    if (sheet.subject !== 'codequest') assert.equal(/Play CodeQuest/.test(sheet.intro || ''), false, `${track} ${day} ${sheet.id}: the CodeQuest how-to is on a ${sheet.subject} sheet`);
    assert.ok(sheet.intro && sheet.intro.length > 40, `${track} ${day} ${sheet.id}: how-to paragraph present`);
  });
}));
assert.match(DAILY_WORK.guided.weeks['week-17'].days.friday.sheets[1].intro, /^Equal groups show up in stories about coins and counting\. 7 nickels is 7 groups of 5 cents, so you multiply 5 × 7\./, 'Friday Groups and Coins how-to');

console.log('Week 17 content, independent answers, schedule, and kid render: passed');
