// Week 13 (Monday 2026-10-05), planned by Jesse in a separate session ("Week 13 plan" in the Drive folder
// CodeQuest Plans) and typed into content.js. Every answer is re-derived here WITHOUT trusting content.js:
// model coin sets are parsed back out of the parent notes and checked with the same exact-payment rule the
// parent view uses, "can I pay it?" answers are worked out from the coins named in the prompt, percents are
// 100 * part / whole, multiplication and money answers are plain arithmetic in whole cents. Also: the new
// Bible Reading sheets, the think-first "more or less than half" lines, 16- and 40-block bars, the help level
// per weekday, count-the-pile answers typed in dollars, and that nothing a kid sees carries an answer.
import assert from 'node:assert/strict';
import { DAILY_WORK } from '../src/cq/daily-work/content.js';
import { currentWeek } from '../src/cq/daily-work/schedule.js';
import { canPayExactly } from '../src/cq/daily-work/daily-work-ui.js';
import { blockPlan, blockView } from '../src/daily/blocks.js';

globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
const { gradeSuggestion, renderParent, createParentState } = await import('../src/daily/parent-view.js');
const { renderSheetArticle, weekVerse } = await import('../src/daily/sheet-view.js');
const { emptyStore } = await import('../src/daily/store.js');

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const VALUE = { penny: 1, nickel: 5, dime: 10, quarter: 25 };
const SINGULAR = { pennies: 'penny', penny: 'penny', nickels: 'nickel', nickel: 'nickel', dimes: 'dime', dime: 'dime', quarters: 'quarter', quarter: 'quarter' };
const worth = (coins) => Object.entries(coins).reduce((sum, [denom, n]) => sum + VALUE[denom] * n, 0);
const g = DAILY_WORK.guided.weeks['week-13'];
const s = DAILY_WORK.standard.weeks['week-13'];
const sheetOf = (week, day, index) => week.days[day].sheets[index];
const itemOf = (week, day, index, id) => sheetOf(week, day, index).items.find((entry) => entry.id === id);
const allItems = (week) => DAYS.flatMap((day) => week.days[day].sheets.flatMap((sheet, index) => sheet.items.map((entry) => ({ day, index, sheet, entry }))));
const cents = (text) => Math.round(Number(text) * 100);
// "3 quarters, 2 dimes and 1 nickel" -> { quarter: 3, dime: 2, nickel: 1 }
const parseCoins = (text) => {
  const counts = {};
  for (const m of text.matchAll(/(\d+) (quarters|quarter|dimes|dime|nickels|nickel|pennies|penny)\b/g)) counts[SINGULAR[m[2]]] = (counts[SINGULAR[m[2]]] || 0) + Number(m[1]);
  return counts;
};
const modelOf = (entry) => {
  const m = /^Model coins: (.*?) \(total (\d\.\d\d)\)\./.exec(entry.parentNote || '');
  assert.ok(m, `${entry.id}: the parent note starts with the model coins`);
  return { counts: parseCoins(m[1]), total: cents(m[2]) };
};
const plain = (html) => html.replace(/<[^>]*>/g, ' ').replace(/&#39;|&#x27;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

// ---------- schedule: Week 13 starts Monday Oct 5; weekends keep the week that just ended ----------
for (const track of ['guided', 'standard']) {
  assert.equal(DAILY_WORK[track].weeks['week-13'].assignedWeekOf, '2026-10-05');
  assert.equal(DAILY_WORK[track].weeks['week-12'].assignedWeekOf, '2026-09-28', 'Week 12 is untouched');
  ['2026-10-03', '2026-10-04'].forEach((day) => assert.equal(currentWeek(DAILY_WORK, track, day).id, 'week-12', `${track} ${day}: the weekend still shows Week 12`));
  ['2026-10-05', '2026-10-06', '2026-10-09', '2026-10-10', '2026-10-11'].forEach((day) => assert.equal(currentWeek(DAILY_WORK, track, day).id, 'week-13', `${track} ${day}`));
  assert.equal(currentWeek(DAILY_WORK, track, '2026-10-12'), null, 'nothing is authored after Week 13 yet');
}

// ---------- shape: the week the plan describes ----------
assert.equal(g.label, 'Week 13');
assert.equal(s.label, 'Week 13');
const SUBJECTS = [['math', 'word-problems', 'bible-reading'], ['math', 'codequest', 'bible-reading'], ['math', 'codequest', 'bible-reading'], ['math', 'word-problems', 'bible-reading'], ['math', 'word-problems', 'bible-reading']];
assert.deepEqual(DAYS.map((day) => g.days[day].sheets.map((sheet) => sheet.subject)), SUBJECTS, 'younger son: Bible Reading is the third sheet every weekday');
assert.deepEqual(DAYS.map((day) => s.days[day].sheets.map((sheet) => sheet.subject)), SUBJECTS, 'older son: same');
assert.deepEqual(DAYS.map((day) => g.days[day].sheets.map((sheet) => sheet.items.length)), [[8, 4, 1], [8, 3, 1], [8, 3, 1], [8, 4, 1], [8, 4, 1]], 'younger son: items per sheet');
assert.deepEqual(DAYS.map((day) => s.days[day].sheets.map((sheet) => sheet.items.length)), [[8, 3, 1], [8, 3, 1], [8, 3, 1], [8, 3, 1], [8, 4, 1]], 'older son: items per sheet');
[g, s].forEach((week) => DAYS.forEach((day) => week.days[day].sheets.forEach((sheet) => {
  if (sheet.subject === 'math' || sheet.subject === 'word-problems') {
    assert.ok(sheet.example && sheet.intro, `${week.id} ${day} ${sheet.id} opens with a how-to and a worked example`);
  }
  assert.equal(new Set(sheet.items.map((entry) => entry.id)).size, sheet.items.length, `${day} ${sheet.id}: item ids are unique`);
})));

// ---------- the memory verses: reference cards, three blanks for the older son ----------
assert.equal(g.weekItems[0].citation, 'Matthew 5:16 (NLT)');
assert.deepEqual(g.weekItems[0].items[0].answer, ['shine', 'praise']);
assert.deepEqual(g.weekItems[0].items[0].wordBank, ['shine', 'praise']);
assert.equal(g.weekItems[0].items[0].prompt.split('___').length - 1, 2);
assert.equal(plain(weekVerse(g).html), 'In the same way, let your good deeds shine out for all to see, so that everyone will praise your heavenly Father.');
assert.equal(s.weekItems[0].citation, 'Romans 12:2 (NLT)');
assert.deepEqual(s.weekItems[0].items[0].answer, ['behavior', 'transform', 'pleasing']);
assert.deepEqual(s.weekItems[0].items[0].wordBank, ['behavior', 'transform', 'pleasing']);
assert.equal(s.weekItems[0].items[0].prompt.split('___').length - 1, 3, 'three blanks');
assert.equal(plain(weekVerse(s).html), "Don't copy the behavior and customs of this world, but let God transform you into a new person by changing the way you think. Then you will learn to know God's will for you, which is good and pleasing and perfect.");

// ---------- Bible Reading: the new subject ----------
const REFS = ['Genesis 37:1-11', 'Genesis 37:12-36', 'Genesis 39:1-6', 'Genesis 39:19-23', 'Genesis 40:14, then 40:23, then 41:1'];
const BIBLE_Q = {
  guided: ['Why were the brothers so upset? Write 1 or 2 sentences.', 'What did the brothers do, and how did they act right afterward? Write 1 or 2 sentences.', 'What does it say about God and Joseph? Write 1 or 2 sentences.',
    "Yesterday you wrote what the Bible says about God and Joseph. Find the same phrase in today's verses and write it here.", 'What did Joseph ask for, and what happened? Write 1 or 2 sentences.'],
  standard: ['Why were the brothers so upset? Write 2 sentences.', 'What did the brothers do, and how did they act right afterward? Write 2 sentences.', 'What does it say about God and Joseph? Write 2 sentences.',
    "Yesterday you wrote what the Bible says about God and Joseph. Find the same phrase in today's verses and write it here.", 'What did Joseph ask for, and what happened? Write 2 sentences.'],
};
[['guided', g], ['standard', s]].forEach(([track, week]) => DAYS.forEach((day, d) => {
  const sheet = week.days[day].sheets[2];
  assert.equal(sheet.id, 'bible-reading');
  assert.equal(sheet.subject, 'bible-reading');
  assert.equal(sheet.title, `Bible Reading: ${REFS[d]}`);
  assert.equal(sheet.intro, `Open your own Bible to ${REFS[d]} and read it out loud to a grown-up. Reading out loud makes you slow down and notice what is really happening. Then answer the question below in your own words. Using your own words shows that you understood it, so you do not need to copy the verses.`);
  assert.equal(sheet.example, null, 'not a math sheet: no worked example');
  assert.equal(sheet.items.length, 1);
  const entry = sheet.items[0];
  assert.equal(entry.kind, 'long-text', `${track} ${day}: a real writing box`);
  assert.equal(entry.prompt, BIBLE_Q[track][d]);
  assert.equal(entry.answer, null, 'parent-judged, never auto-marked');
  assert.ok(entry.parentNote && entry.parentNote.length > 20, `${track} ${day}: the grown-up gets a note`);
  assert.equal(gradeSuggestion(entry, 'anything'), null, 'no suggestion for a written answer');
  const html = renderSheetArticle(week, day, sheet, { sheets: {}, submittedAt: null }, false, () => 0, () => false);
  assert.ok(html.includes('data-subject="bible-reading"') && html.includes('<textarea'), `${track} ${day}: a writing box on screen`);
  assert.ok(!/<(input|button)[^>]*data-action="daily-(word|blank)/.test(html), 'and nothing to tap-fill');
}));
assert.ok(itemOf(s, 'thursday', 2, 'reflect').parentNote.includes('the Lord was with Joseph'));
assert.ok(itemOf(g, 'monday', 2, 'reflect').parentNote.includes('bow down'));

// ---------- CodeQuest sheet: the plan's wording, same for both boys ----------
[g, s].forEach((week) => ['tuesday', 'wednesday'].forEach((day) => {
  const sheet = sheetOf(week, day, 1);
  assert.equal(sheet.title, 'CodeQuest Day');
  assert.equal(sheet.intro, 'Play CodeQuest for 15 to 20 minutes and try to reach a new level. Then answer the three questions below. This is your chance to tell what you noticed, so there is no right or wrong answer.');
  assert.deepEqual(sheet.items.map((entry) => [entry.id, entry.kind]), [['level', 'short-text'], ['learned', 'long-text'], ['tricky', 'scale']]);
  assert.equal(sheet.items[0].prompt, 'Which level did you reach today? Type it, like Level 3.');
  assert.equal(sheet.items[1].prompt, 'Write 1 or 2 sentences about something you built, solved or learned.');
  assert.equal(sheet.items[2].prompt, "How tricky was today's level? (1 = not tricky, 5 = very tricky)");
  assert.equal(sheet.items[2].scaleMax, 5);
}));

// ---------- older son: think-first lines + percent with blocks ----------
const HELP = { monday: 'unit', tuesday: 'clues', wednesday: 'none', thursday: 'demand', friday: undefined };
const PLAN_PERCENT = { // the plan's answers, typed again from the Drive doc
  monday: { '3-of-10': 30, '19-of-20': 95, '5-of-16': 31.25, '16-of-25': 64, 'free-throws': 40, 'library-card': 76, puzzle: 81.25 },
  tuesday: { '15-of-16': 93.75, '7-of-25': 28, '22-of-40': 55, '14-of-40': 35 },
  wednesday: { '31-of-40': 77.5, '7-of-16': 43.75, '47-of-50': 94, '4-of-20': 20 },
  thursday: { '23-of-25': 92, '1-of-16': 6.25, '18-of-40': 45, '37-of-50': 74, 'pizza-day': 68, marbles: 25, 'soccer-survey': 65 },
  friday: { '3-of-25': 12, '29-of-40': 72.5, '2-of-16': 12.5, '31-of-50': 62, 'video-game': 52.5, crayons: 25, 'math-survey': 48 },
};
let percentItems = 0;
let thinkFirst = 0;
DAYS.forEach((day) => s.days[day].sheets.forEach((sheet) => {
  if (sheet.subject !== 'math' && sheet.subject !== 'word-problems') return;
  sheet.items.forEach((entry, index) => {
    if (entry.id.startsWith('half-')) {
      thinkFirst += 1;
      assert.equal(sheet.subject, 'math', 'think-first lines are on Math only');
      const [, part, whole] = /^half-(\d+)-of-(\d+)$/.exec(entry.id).map(Number);
      assert.equal(entry.kind, 'fill-blank');
      assert.deepEqual(entry.wordBank, ['more', 'less']);
      assert.equal(entry.prompt, `Before you work it out: is ${part} out of ${whole} more than half, or less than half?`);
      assert.notEqual(part * 2, whole, 'nothing is exactly half');
      assert.deepEqual(entry.answer, [part > whole / 2 ? 'more' : 'less'], `${day}/${entry.id}`);
      const next = sheet.items[index + 1];
      assert.equal(next.id, `${part}-of-${whole}`, `${entry.id} comes right before its percent`);
      assert.equal(gradeSuggestion(entry, [part > whole / 2 ? 'more' : 'less']), true);
      assert.equal(gradeSuggestion(entry, [part > whole / 2 ? 'less' : 'more']), false);
      return;
    }
    if (entry.kind !== 'numeric') return; // the one written explanation
    percentItems += 1;
    assert.ok(Number.isInteger(entry.part) && Number.isInteger(entry.whole) && entry.part <= entry.whole, `${entry.id}: part and whole`);
    assert.ok([10, 16, 20, 25, 40, 50].includes(entry.whole), `${entry.id}: block sizes used this week are 10, 16, 20, 25, 40, 50`);
    assert.equal(entry.answer, (100 * entry.part) / entry.whole, `${day}/${entry.id}: answer = 100 * part / whole`);
    assert.equal(entry.answer, PLAN_PERCENT[day][entry.id], `${day}/${entry.id}: matches the plan`);
    assert.equal(entry.help, HELP[day], `${day}/${entry.id}: the help fades across the week`);
    assert.ok(String(entry.parentNote).includes(`${entry.whole === 16 ? '6.25' : 100 / entry.whole} per block`), `${entry.id}: the parent note shows what one block is worth`);
    if (sheet.subject === 'math') {
      const m = /^(\d+) out of (\d+) is what percent\?$/.exec(entry.prompt);
      assert.ok(m && Number(m[1]) === entry.part && Number(m[2]) === entry.whole, `${entry.id}: the prompt says the same numbers`);
    }
    if (day === 'friday') {
      assert.ok(!entry.unit && !entry.perItem, `${entry.id}: Friday is plain typing, no blocks`);
    } else {
      assert.equal(entry.unit, 'percent');
      assert.equal(entry.perItem, true, `${entry.id}: one block per item`);
      assert.deepEqual(blockPlan(entry.part, entry.whole, true), { count: entry.whole, size: 1 }, `${entry.id}: ${entry.whole} blocks`);
    }
  });
}));
assert.equal(percentItems, 29, 'every older-son percent problem');
assert.equal(thinkFirst, 20, 'one think-first line before each of the 20 Math percents');
// word problems have no think-first line; every Math percent has one
DAYS.forEach((day) => s.days[day].sheets.forEach((sheet) => {
  if (sheet.subject === 'word-problems') assert.ok(!sheet.items.some((entry) => entry.id.startsWith('half-')), `${day}: no think-first line on word problems`);
  if (sheet.subject === 'math') assert.equal(sheet.items.filter((entry) => entry.id.startsWith('half-')).length, sheet.items.length / 2);
}));
// the plan's own answer list covers every percent exactly once
assert.equal(Object.values(PLAN_PERCENT).reduce((n, day) => n + Object.keys(day).length, 0), percentItems);

// 16 blocks (6.25% each) and 40 blocks (2.5% each) draw one block per item; 16 sit 8 across so half is a row
assert.deepEqual(blockPlan(11, 16, true), { count: 16, size: 1 });
assert.deepEqual(blockPlan(22, 40, true), { count: 40, size: 1 });
assert.equal(blockPlan(11, 16), null, 'without perItem a 16-set still does not draw (the old rule is unchanged)');
assert.equal(blockPlan(3, 32, true), null, 'a 3.125% block is still not drawn');
assert.equal(blockView(itemOf(s, 'monday', 0, '5-of-16'), 0).cols, 8);
assert.equal(blockView(itemOf(s, 'tuesday', 0, '22-of-40'), 0).cols, 10);
assert.equal(blockView(itemOf(s, 'monday', 0, '5-of-16'), 0).caption, '1 block = 6.25%');
assert.equal(blockView(itemOf(s, 'monday', 0, '19-of-20'), 0).caption, '1 block = 5%');
assert.equal(blockView(itemOf(s, 'tuesday', 0, '22-of-40'), 0).unit, 2.5);

// Monday: the one-block value, nothing else
['3-of-10', '19-of-20', '5-of-16', '16-of-25'].forEach((id) => {
  const entry = itemOf(s, 'monday', 0, id);
  for (let filled = 0; filled <= entry.whole; filled += 1) {
    const view = blockView(entry, filled, false);
    assert.equal(view.help, 'unit');
    assert.ok(view.labels.every((label) => label === null), `${id}: no running percents on Monday's blocks`);
    assert.equal(view.readout, null);
  }
});
// Tuesday: one or two clue labels, never the answer's block and never the last one
DAYS.slice(1, 2).forEach((day) => s.days[day].sheets[0].items.filter((entry) => entry.part !== undefined).forEach((entry) => {
  const view = blockView(entry, 0, false);
  const labelled = view.labels.map((label, i) => (label === null ? null : i + 1)).filter((x) => x !== null);
  assert.ok(labelled.length >= 1 && labelled.length <= 2, `${entry.id}: one or two clue labels`);
  assert.ok(!labelled.includes(entry.part), `${entry.id}: the answer's own block is never labelled`);
  assert.ok(!labelled.includes(entry.whole), `${entry.id}: never the last block`);
  labelled.forEach((block) => assert.notEqual(view.labels[block - 1], `${entry.answer}%`, `${entry.id}: no label is the answer`));
  assert.deepEqual(blockView(entry, 0, false).labels, view.labels, 'stable across renders');
}));
// Wednesday: the bar only. No label, no running total, no answer at ANY fill level.
s.days.wednesday.sheets[0].items.filter((entry) => entry.part !== undefined).forEach((entry) => {
  for (let filled = 0; filled <= entry.whole; filled += 1) {
    const view = blockView(entry, filled, false);
    assert.equal(view.help, 'none');
    assert.ok(view.labels.every((label) => label === null), `wednesday/${entry.id}: no block carries a percent (filled ${filled})`);
    assert.equal(view.readout, null, `wednesday/${entry.id}: no running total (filled ${filled})`);
    assert.equal(view.caption, `The whole is ${entry.whole} blocks = 100%`);
    // (4 out of 20 has 20 blocks AND a 20% answer: the block COUNT is fine, a "20%" printed anywhere is not)
    const printed = [view.caption, view.readout, ...view.labels].filter(Boolean).join(' | ');
    assert.equal(new RegExp(`(^|[^\\d.])${String(entry.answer).replace('.', '\\.')}\\s*%`).test(printed), false, `wednesday/${entry.id}: the answer ${entry.answer}% is printed nowhere (filled ${filled})`);
  }
  const html = renderSheetArticle(s, 'wednesday', sheetOf(s, 'wednesday', 0), { sheets: {}, submittedAt: null }, false, (item) => (item.id === entry.id ? entry.whole : 0), () => false);
  const own = html.split('<li ').find((chunk) => chunk.includes(`data-item="${entry.id}"`));
  assert.ok(own && own.includes('is-filled'));
  assert.equal(own.includes('has-label'), false);
  assert.equal(own.includes('cqd-block-readout'), false);
});
// Thursday: closed until he asks, then the one-block value
const thursdayMath = sheetOf(s, 'thursday', 0);
const thursdayStory = sheetOf(s, 'thursday', 1);
const closedHtml = renderSheetArticle(s, 'thursday', thursdayMath, { sheets: {}, submittedAt: null }, false, () => 0, () => false);
assert.equal(closedHtml.includes('cqd-block-bar'), false, 'no bar until he asks');
assert.equal((closedHtml.match(/daily-block-reveal/g) || []).length, 4, 'four closed percents on the math sheet');
const openedHtml = renderSheetArticle(s, 'thursday', thursdayMath, { sheets: {}, submittedAt: null }, false, () => 0, (entry) => entry.id === '1-of-16');
assert.equal((openedHtml.match(/cqd-block-bar/g) || []).length, 1);
assert.ok(openedHtml.includes('1 block = 6.25%') && openedHtml.includes('--cqd-block-cols:8'), 'the 16-block bar, 8 across');
assert.equal((renderSheetArticle(s, 'thursday', thursdayStory, { sheets: {}, submittedAt: null }, false, () => 0, () => false).match(/daily-block-reveal/g) || []).length, 3);
// Friday: typing only
DAYS.slice(4).forEach((day) => s.days[day].sheets.slice(0, 2).forEach((sheet, i) => {
  const html = renderSheetArticle(s, day, sheet, { sheets: {}, submittedAt: null }, false, () => 0, () => false);
  assert.equal(/cqd-block/.test(html), false, `friday sheet ${i}: no blocks`);
  assert.ok(html.includes('data-kind="numeric"'));
}));

// ---------- younger son: coin items ----------
const coinItems = allItems(g).filter(({ entry }) => entry.kind === 'coin-total');
assert.equal(coinItems.length, 24, '12 tithe builds, 6 restricted trays, 2 "must include" builds and 4 piles: nothing silently dropped');
const builds = coinItems.filter(({ entry }) => entry.payCents !== undefined);
assert.equal(builds.length, 12);
builds.forEach(({ day, entry }) => {
  const model = modelOf(entry);
  const earned = /earned \$(\d+\.\d\d)/.exec(entry.prompt);
  assert.ok(earned, `${entry.id}: says what was earned`);
  assert.equal(entry.payCents, cents(earned[1]) / 10, `${day}/${entry.id}: the tithe is 10% of what was earned`);
  assert.ok(entry.prompt.includes(`$${(entry.payCents / 100).toFixed(2)}`), `${entry.id}: the prompt names the tithe`);
  const asked = /Build \$(\d\.\d\d) in coins/.exec(entry.prompt);
  assert.equal(entry.targetCents, cents(asked[1]), `${entry.id}: builds what the prompt says`);
  assert.equal(entry.answer, entry.targetCents);
  assert.equal(model.total, entry.targetCents, `${entry.id}: the note's total`);
  assert.equal(worth(model.counts), entry.targetCents, `${day}/${entry.id}: the model set is worth the total`);
  assert.ok(canPayExactly(model.counts, entry.payCents), `${day}/${entry.id}: the model set can pay the tithe exactly`);
  assert.equal(gradeSuggestion(entry, model.counts), true);
  assert.equal(gradeSuggestion(entry, { ...model.counts, penny: (model.counts.penny || 0) + 1 }), false, `${entry.id}: a penny too many`);
  assert.ok(!/Model coins/.test(entry.prompt), 'the answer never sits in the prompt');
  assert.deepEqual(entry.coinSet, ['penny', 'nickel', 'dime', 'quarter'], `${entry.id}: full tray`);
});
// a build whose total is right but whose coins can NOT make the tithe is suggested wrong (the point of the week)
assert.equal(gradeSuggestion(itemOf(g, 'monday', 0, 'build-65'), { quarter: 4 }), false, '4 quarters cannot pay 65 cents');
assert.equal(gradeSuggestion(itemOf(g, 'friday', 0, 'tithe-7-of-70'), { quarter: 2, dime: 2 }), false, '70 cents but no way to make 7');
assert.equal(itemOf(g, 'friday', 0, 'tithe-7-of-70').targetCents, 70, 'the $0.70 build is not a $1.00 build');
const dollarBuilds = builds.filter(({ entry }) => entry.targetCents === 100).length;
assert.equal(dollarBuilds, 11, 'eleven tithe builds make $1.00 and one makes $0.70');

// restricted trays and "must include" coins
const restricted = coinItems.filter(({ entry }) => entry.payCents === undefined && !entry.pile);
assert.equal(restricted.length, 6 + 2, '6 restricted trays and 2 "must include" items');
const RESTRICTED = { 'only-quarters-dimes-70': ['dime', 'quarter'], 'only-nickels-30': ['nickel'], 'only-dimes-nickels-55': ['nickel', 'dime'], 'dime-for-nickels-pennies': ['penny', 'nickel'], 'only-dimes-pennies-62': ['penny', 'dime'], 'only-quarters-pennies-78': ['penny', 'quarter'] };
const MUST = { 'dime-87': ['dime', 87], 'nickel-57': ['nickel', 57] };
restricted.forEach(({ day, entry }) => {
  const model = modelOf(entry);
  assert.equal(worth(model.counts), entry.targetCents, `${entry.id}: model total`);
  assert.equal(model.total, entry.targetCents);
  assert.equal(entry.answer, entry.targetCents);
  assert.equal(gradeSuggestion(entry, model.counts), true, `${entry.id}: the model answer is suggested correct`);
  assert.equal(gradeSuggestion(entry, { ...model.counts, penny: (model.counts.penny || 0) + 1 }), false);
  assert.ok(entry.prompt.includes(`$${(entry.targetCents / 100).toFixed(2)}`), `${entry.id}: names the amount`);
  if (RESTRICTED[entry.id]) {
    assert.deepEqual([...entry.coinSet].sort(), [...RESTRICTED[entry.id]].sort(), `${day}/${entry.id}: only these coins in the tray`);
    assert.ok(Object.keys(model.counts).every((denom) => entry.coinSet.includes(denom)), `${entry.id}: the model uses only tray coins`);
    assert.ok(/ONLY/.test(entry.prompt), `${entry.id}: the prompt says ONLY`);
    ['quarters', 'dimes', 'nickels', 'pennies'].forEach((name) => assert.equal(/ONLY[^,.]*/.exec(entry.prompt)[0].includes(name), entry.coinSet.includes(SINGULAR[name]), `${entry.id}: the prompt names ${name} only if the tray has them`));
  } else {
    const [denom, total] = MUST[entry.id];
    assert.equal(entry.targetCents, total);
    assert.deepEqual(entry.mustHave, { denom, min: 1 });
    assert.ok(model.counts[denom] >= 1, `${entry.id}: the model includes a ${denom}`);
    // the right total WITHOUT the required coin is suggested wrong
    const without = total === 87 ? { quarter: 3, penny: 12 } : { quarter: 2, penny: 7 };
    assert.equal(worth(without), total);
    assert.equal(gradeSuggestion(entry, without), false, `${entry.id}: right total, missing coin`);
  }
});

// count the pile: the kid types DOLLARS
const piles = coinItems.filter(({ entry }) => entry.pile);
assert.equal(piles.length, 4);
const PILE_PLAN = { 'pile-3q-4d-2n': 1.25, 'pile-2q-5d-4n': 1.2, 'pile-2q-3d-1n-4p': 0.89, 'pile-2q-4d-3n-1p': 1.06 };
piles.forEach(({ day, entry }) => {
  assert.equal(entry.targetCents, null, 'a pile has nothing to build');
  assert.ok(entry.prompt.startsWith('Count this pile of coins. Type the total in dollars, like 0.84: '), `${entry.id}: asks for dollars`);
  assert.deepEqual(entry.pile, parseCoins(entry.prompt), `${day}/${entry.id}: the pile on screen is the coins the prompt names`);
  assert.equal(entry.answer, worth(entry.pile), `${entry.id}: answer in cents`);
  assert.equal(entry.answer, Math.round(PILE_PLAN[entry.id] * 100), `${entry.id}: matches the plan`);
  const dollars = (entry.answer / 100).toFixed(2);
  assert.equal(gradeSuggestion(entry, Number(dollars)), true, `${entry.id}: ${dollars} is right`);
  assert.equal(gradeSuggestion(entry, entry.answer / 100), true);
  assert.equal(gradeSuggestion(entry, entry.answer), true, 'the same amount typed in cents is not marked wrong');
  assert.equal(gradeSuggestion(entry, (entry.answer + 1) / 100), false, 'a cent off');
  assert.equal(gradeSuggestion(entry, entry.answer / 10), false, 'a tenth of it');
  assert.equal(gradeSuggestion(entry, null), false);
  assert.equal(gradeSuggestion(entry, 'abc'), false);
  const html = renderSheetArticle(g, day, sheetOf(g, day, 0), { sheets: {}, submittedAt: null }, false, () => 0, () => false);
  assert.ok(html.includes('cqd-pile') && html.includes('inputmode="decimal"'), `${entry.id}: shown as a fixed pile with a number box`);
});
assert.equal(coinItems.length - builds.length - restricted.length - piles.length, 0, 'every coin item is a tithe build, a restricted/must-include build or a pile');

// yes/no: worked out from the coins the prompt names, never copied from content.js
const yesNos = allItems(g).filter(({ entry }) => entry.kind === 'fill-blank');
assert.equal(yesNos.length, 5, "two Monday, one Tuesday, two Wednesday yes/no items");
yesNos.forEach(({ day, entry }) => {
  assert.deepEqual(entry.wordBank, ['yes', 'no']);
  const target = /\$(\d\.\d\d)/.exec(entry.prompt);
  const held = parseCoins(entry.prompt.split('. ')[0].replace(/\$\d\.\d\d/g, ''));
  assert.ok(Object.keys(held).length, `${entry.id}: names the coins`);
  assert.deepEqual(entry.answer, [canPayExactly(held, cents(target[1])) ? 'yes' : 'no'], `${day}/${entry.id}: ${JSON.stringify(held)} vs ${target[1]}`);
  assert.equal(gradeSuggestion(entry, entry.answer), true);
});

// multiplication and money, plain arithmetic
let facts = 0;
allItems(g).forEach(({ day, entry }) => {
  const m = /^(\d+) × (\d+) = \?$/.exec(entry.prompt);
  if (!m) return;
  facts += 1;
  assert.equal(entry.kind, 'numeric');
  assert.equal(entry.answer, Number(m[1]) * Number(m[2]), `${day}/${entry.id}`);
  assert.equal(entry.id, `x-${m[1]}-${m[2]}`);
  assert.ok(entry.parentNote.includes(String(entry.answer)));
});
assert.equal(facts, 15);
const MONEY = { theo: 50 + 75 + 100, owen: 310 - 31, beni: 75 + 50, dani: (300 + 180) / 10, jonas: 520 - 150 - 52 };
Object.entries(MONEY).forEach(([id, c]) => {
  const found = allItems(g).find(({ entry }) => entry.id === id).entry;
  assert.equal(found.kind, 'numeric');
  assert.equal(found.answer, c / 100, `${id}: ${c} cents`);
  assert.equal(gradeSuggestion(found, c / 100), true);
  assert.equal(gradeSuggestion(found, `${(c / 100).toFixed(2)}`), true, 'typed with the zero');
  assert.equal(gradeSuggestion(found, (c + 1) / 100), false);
});
assert.deepEqual(allItems(g).filter(({ entry }) => entry.kind === 'short-text' && entry.id !== 'level').map(({ entry }) => entry.id), ['lily', 'four-quarters-17', 'how-you-knew'], 'the three written explanations');

// worked examples are real: the arithmetic they show holds
const exampleSums = [];
allItems(g).forEach(({ sheet }) => { exampleSums.push(sheet.example); });
[...new Set(exampleSums)].filter(Boolean).forEach((text) => {
  for (const m of text.matchAll(/(\d+) \+ (\d+)(?: \+ (\d+))?(?: \+ (\d+))?(?: \+ (\d+))?(?: \+ (\d+))? = (\d+)/g)) {
    const terms = m.slice(1, 7).filter(Boolean).map(Number);
    assert.equal(terms.reduce((a, b) => a + b, 0), Number(m[7]), `example arithmetic: ${m[0]}`);
  }
});

// ---------- plan wording and the app's rules ----------
// no kid-facing text says easy / guided / hard / standard, or names Jesse or Dad
const BANNED = /\b(easy|guided|hard|standard|jesse|dad)\b/i;
[g, s].forEach((week) => {
  const strings = [];
  week.weekItems.forEach((sheet) => { strings.push(sheet.title, sheet.citation || ''); sheet.items.forEach((entry) => strings.push(entry.prompt, ...(entry.wordBank || []))); });
  DAYS.forEach((day) => week.days[day].sheets.forEach((sheet) => {
    strings.push(sheet.title, sheet.intro || '', sheet.example || '');
    sheet.items.forEach((entry) => strings.push(entry.prompt, ...(entry.wordBank || [])));
  }));
  strings.forEach((text) => assert.equal(BANNED.test(text), false, `kid-facing text must not say ${BANNED.exec(text)}: ${text.slice(0, 60)}`));
});
// nothing a kid sees ever carries an answer or a note
const kidPages = [];
DAYS.forEach((day) => {
  g.days[day].sheets.forEach((sheet) => kidPages.push(renderSheetArticle(g, day, sheet, { sheets: {}, submittedAt: null }, false, () => 0, () => false)));
  s.days[day].sheets.forEach((sheet) => kidPages.push(renderSheetArticle(s, day, sheet, { sheets: {}, submittedAt: null }, false, () => 0, () => false)));
});
kidPages.forEach((html) => ['Model coins', 'Model answer', 'For you:', 'payCents', 'parentNote', 'mustHave', 'cqd-check-note', 'A good answer'].forEach((leak) => assert.equal(html.includes(leak), false, `a kid sheet must not contain "${leak}"`)));
// ---------- the parent's check-work page ----------
const answered = JSON.parse(JSON.stringify({ ...emptyStore(), track: 'guided' }));
answered.parent.unlockedUntil = Date.now() + 3600000;
answered.dailyWork = { weeks: { 'week-13': { days: { monday: { sheets: {
  'tithe-coins-quarters-dimes': { items: {
    'build-55': { value: { quarter: 3, dime: 2, nickel: 1 }, status: 'answered', checkedAt: null },
    'build-65': { value: { quarter: 4 }, status: 'answered', checkedAt: null },
    'pile-3q-4d-2n': { value: 1.25, status: 'answered', checkedAt: null },
    'four-quarters-one-dime': { value: ['no'], status: 'answered', checkedAt: null },
    'x-2-6': { value: 12, status: 'answered', checkedAt: null },
  } },
  'bible-reading': { items: { reflect: { value: 'Their dad loved Joseph the most. Joseph told them his dreams.', status: 'answered', checkedAt: null } } },
}, submittedAt: '2026-10-05T15:00:00.000Z' } } } } };
const parentState = createParentState();
parentState.selectedDay = 'monday';
const html = renderParent(answered, parentState, '2026-10-05', Date.now());
assert.ok(html.includes('Model coins: 2 quarters, 4 dimes and 2 nickels (total 1.00)'), 'the parent sees the model coins');
assert.ok(html.includes('cannot</strong> pay it exactly') && html.includes('can</strong> pay it exactly'), 'and whether the built coins can pay the tithe');
assert.ok(html.includes('75 + 40 + 10 = 125 cents = 1.25.'), 'the pile working');
assert.ok(html.includes('Their dad loved Joseph the most.'), 'the Bible Reading answer is shown');
assert.ok(html.includes('A good answer says their father loved Joseph more'), 'with what a good answer says');
assert.ok(html.includes('Suggested: Incorrect') && html.includes('Suggested: Correct'), 'suggestions each way');
assert.equal((html.match(/Suggested:/g) || []).length >= 4, true);

console.log('ok — week 13: schedule, Bible Reading on every weekday, think-first lines, 16/40-block bars and help levels, every tithe/coin/pile/yes-no/multiplication/money/percent answer re-derived, kid pages leak nothing, parent sees the model answers');
