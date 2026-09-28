// Week 12 (Monday 2026-09-28), planned by Jesse in a separate session and imported into content.js.
// Every answer key is re-derived here independently of content.js: the tithe builds against a written-out
// model set of coins and the same exact-payment rule the parent view uses, multiplication and money
// answers by plain arithmetic, the percent answers by 100 * part / whole. Also: the weekend catch-up
// schedule, the hidden "Show me the blocks" demo, and that nothing a kid sees ever carries an answer.
import assert from 'node:assert/strict';
import { DAILY_WORK } from '../src/cq/daily-work/content.js';
import { currentWeek } from '../src/cq/daily-work/schedule.js';
import { canPayExactly } from '../src/cq/daily-work/daily-work-ui.js';
import { blockPlan, blockView } from '../src/daily/blocks.js';

globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
const { gradeSuggestion, renderParent, createParentState } = await import('../src/daily/parent-view.js');
const { renderSheetArticle } = await import('../src/daily/sheet-view.js');
const { emptyStore } = await import('../src/daily/store.js');

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const VALUE = { penny: 1, nickel: 5, dime: 10, quarter: 25 };
const worth = (coins) => Object.entries(coins).reduce((sum, [denom, n]) => sum + VALUE[denom] * n, 0);
const g = DAILY_WORK.guided.weeks['week-12'];
const s = DAILY_WORK.standard.weeks['week-12'];
const sheetOf = (week, day, index) => week.days[day].sheets[index];
const itemOf = (week, day, index, id) => sheetOf(week, day, index).items.find((entry) => entry.id === id);
const usd = (cents) => `$${(cents / 100).toFixed(2)}`;

// ---------- exact payment: a bounded subset-sum over the coins actually held ----------
assert.equal(canPayExactly({ quarter: 4 }, 100), true);
assert.equal(canPayExactly({ quarter: 4 }, 75), true);
assert.equal(canPayExactly({ quarter: 4 }, 10), false, 'no quarters make 10');
assert.equal(canPayExactly({ quarter: 4 }, 110), false, 'more than they hold');
assert.equal(canPayExactly({ quarter: 3, dime: 2, nickel: 1 }, 45), true, '25 + 10 + 10');
assert.equal(canPayExactly({ dime: 3, quarter: 2 }, 15), false, 'dimes and quarters never make 15');
assert.equal(canPayExactly({ dime: 1, penny: 2 }, 12), true);
assert.equal(canPayExactly({ dime: 1, penny: 1 }, 12), false, 'one penny short');
assert.equal(canPayExactly({}, 0), true, 'nothing is exactly nothing');
assert.equal(canPayExactly({ quarter: 1 }, -5), false);
assert.equal(canPayExactly({ quarter: 1 }, 2.5), false);
assert.equal(canPayExactly(null, 5), false);
assert.equal(canPayExactly({ penny: 99 }, 99), true, 'the per-coin cap is the same 99 the saved state allows');

// ---------- schedule: weeks by real Monday, weekends keep the week that just ended ----------
for (const track of ['guided', 'standard']) {
  assert.equal(DAILY_WORK[track].weeks['week-11'].assignedWeekOf, '2026-09-21');
  assert.equal(DAILY_WORK[track].weeks['week-12'].assignedWeekOf, '2026-09-28');
  ['2026-09-21', '2026-09-25', '2026-09-26', '2026-09-27'].forEach((day) => assert.equal(currentWeek(DAILY_WORK, track, day).id, 'week-11', `${track} ${day}`));
  ['2026-09-28', '2026-10-02', '2026-10-03', '2026-10-04'].forEach((day) => assert.equal(currentWeek(DAILY_WORK, track, day).id, 'week-12', `${track} ${day}`));
  assert.equal(currentWeek(DAILY_WORK, track, '2026-10-05'), null, 'no week is authored for Oct 5 yet: nothing to show');
  assert.equal(currentWeek(DAILY_WORK, track, '2026-09-20'), null, 'the Sunday before Week 11 shows nothing');
}

// ---------- shape: the week the plan describes ----------
assert.equal(g.label, 'Week 12');
assert.deepEqual(DAYS.map((day) => g.days[day].sheets.map((sheet) => sheet.items.length)), [[8, 4], [8, 3], [8, 3], [8, 4], [7, 4]], 'younger son: items per sheet');
assert.deepEqual(DAYS.map((day) => s.days[day].sheets.map((sheet) => sheet.items.length)), [[3, 3], [4, 3], [4, 3], [5, 3], [5, 3]], 'older son: items per sheet');
assert.deepEqual(DAYS.map((day) => g.days[day].sheets.map((sheet) => sheet.subject)), [['math', 'word-problems'], ['math', 'codequest'], ['math', 'codequest'], ['math', 'word-problems'], ['math', 'word-problems']]);
assert.deepEqual(DAYS.map((day) => s.days[day].sheets.map((sheet) => sheet.subject)), [['math', 'word-problems'], ['math', 'codequest'], ['math', 'codequest'], ['math', 'word-problems'], ['math', 'word-problems']]);
assert.equal(g.weekItems[0].citation, '2 Corinthians 9:7 (NLT)');
assert.deepEqual(g.weekItems[0].items[0].answer, ['decide', 'cheerfully']);
assert.equal(g.weekItems[0].items[0].prompt.split('___').length - 1, 2);
assert.equal(s.weekItems[0].citation, 'Isaiah 40:31 (NLT)');
assert.deepEqual(s.weekItems[0].items[0].answer, ['trust', 'weary']);
assert.equal(s.weekItems[0].items[0].prompt.split('___').length - 1, 2);
[g, s].forEach((week) => DAYS.forEach((day) => week.days[day].sheets.forEach((sheet) => {
  if (sheet.subject === 'math' || sheet.subject === 'word-problems') assert.ok(sheet.example, `${week.id} ${day} ${sheet.id} opens with a worked example`);
  if (sheet.subject === 'math' || sheet.subject === 'word-problems') assert.ok(sheet.intro, `${week.id} ${day} ${sheet.id} has a how-to`);
})));

// ---------- younger son: tithe builds ----------
// [day, sheet index, item id, earned cents, tithe cents, total to build, a model answer]
const builds = [
  ['monday', 0, 'tithe-20', 200, 20, 100, { dime: 2, quarter: 3, nickel: 1 }],
  ['monday', 0, 'tithe-30', 300, 30, 100, { quarter: 2, dime: 5 }],
  ['monday', 0, 'tithe-40', 400, 40, 100, { quarter: 3, dime: 2, nickel: 1 }],
  ['monday', 0, 'tithe-10-new-way', 100, 10, 100, { quarter: 2, dime: 5 }],
  ['monday', 0, 'tithe-80', 800, 80, 100, { quarter: 3, dime: 2, nickel: 1 }],
  ['monday', 1, 'mia', 600, 60, 100, { quarter: 3, dime: 2, nickel: 1 }],
  ['monday', 1, 'ava', 700, 70, 100, { quarter: 3, dime: 2, nickel: 1 }],
  ['tuesday', 0, 'tithe-25', 250, 25, 100, { quarter: 4 }],
  ['tuesday', 0, 'tithe-15', 150, 15, 100, { quarter: 3, dime: 2, nickel: 1 }],
  ['tuesday', 0, 'tithe-5-half-dollar', 50, 5, 50, { quarter: 1, dime: 2, nickel: 1 }],
  ['tuesday', 0, 'tithe-35', 350, 35, 100, { quarter: 3, dime: 2, nickel: 1 }],
  ['tuesday', 0, 'tithe-75', 750, 75, 100, { quarter: 4 }],
  ['thursday', 0, 'tithe-36', 360, 36, 100, { quarter: 3, dime: 2, penny: 5 }],
  ['thursday', 0, 'tithe-28', 280, 28, 100, { quarter: 3, dime: 2, penny: 5 }],
  ['thursday', 0, 'tithe-45', 450, 45, 100, { quarter: 3, dime: 2, nickel: 1 }],
  ['thursday', 0, 'tithe-12', 120, 12, 100, { quarter: 3, dime: 2, penny: 5 }],
  ['thursday', 0, 'tithe-63', 630, 63, 100, { quarter: 2, dime: 4, nickel: 1, penny: 5 }],
  ['thursday', 1, 'rosa', 180, 18, 100, { quarter: 3, dime: 1, nickel: 2, penny: 5 }],
  ['friday', 0, 'tithe-16', 160, 16, 100, { quarter: 3, dime: 1, nickel: 2, penny: 5 }],
  ['friday', 0, 'tithe-32', 320, 32, 100, { quarter: 3, dime: 1, nickel: 2, penny: 5 }],
  ['friday', 0, 'tithe-8-eighty', 80, 8, 80, { quarter: 2, dime: 2, nickel: 1, penny: 5 }],
  ['friday', 1, 'kai-coins', 900, 90, 100, { quarter: 3, dime: 2, nickel: 1 }],
  ['friday', 1, 'lena', 140, 14, 100, { quarter: 3, dime: 2, penny: 5 }],
];
builds.forEach(([day, index, id, earned, pay, total, model]) => {
  const found = itemOf(g, day, index, id);
  assert.ok(found, `${day}/${id} exists`);
  assert.equal(found.kind, 'coin-total');
  assert.equal(found.targetCents, total, `${id}: build total`);
  assert.equal(found.answer, total);
  assert.equal(found.payCents, pay, `${id}: tithe`);
  assert.equal(pay, earned / 10, `${id}: the tithe is 10% of what was earned`);
  assert.ok(found.prompt.includes(usd(pay)), `${id}: the prompt names the tithe ${usd(pay)}`);
  assert.equal(worth(model), total, `${id}: the model set is worth the total`);
  assert.ok(canPayExactly(model, pay), `${id}: the model set can pay the tithe exactly`);
  assert.equal(gradeSuggestion(found, model), true, `${id}: the model answer is suggested correct`);
  // A right total whose coins can NOT make the tithe is suggested wrong; so is the wrong total.
  assert.equal(gradeSuggestion(found, { ...model, penny: (model.penny || 0) + 1 }), false, `${id}: total off by a penny`);
  assert.ok(String(found.parentNote).includes('Model answer'), `${id}: a parent note`);
  assert.ok(!found.prompt.includes('Model answer'), `${id}: the answer never sits in the prompt`);
  assert.equal(new Set(found.coinSet).size, found.coinSet.length);
});
// The whole point of the week: 4 quarters make $1.00 but can only pay quarter-sized tithes.
const tenCents = itemOf(g, 'monday', 0, 'tithe-10-new-way');
assert.equal(gradeSuggestion(tenCents, { quarter: 4 }), false, '4 quarters cannot pay a 10 cent tithe');
assert.equal(gradeSuggestion(tenCents, { dime: 1, quarter: 3, nickel: 2, penny: 5 }), true);
assert.equal(gradeSuggestion(itemOf(g, 'tuesday', 0, 'tithe-25'), { quarter: 4 }), true, '4 quarters DO pay a 25 cent tithe');
assert.equal(gradeSuggestion(itemOf(g, 'friday', 1, 'lena'), { quarter: 4 }), false, '4 quarters cannot pay 14 cents');
assert.equal(gradeSuggestion(itemOf(g, 'monday', 0, 'tithe-20'), {}), false, 'no coins is never suggested correct');

// "at least one dime" and "nickels only"
const tradeQuarter = itemOf(g, 'wednesday', 0, 'trade-a-quarter');
assert.equal(tradeQuarter.targetCents, 25);
assert.deepEqual(tradeQuarter.mustHave, { denom: 'dime', min: 1 });
assert.equal(gradeSuggestion(tradeQuarter, { dime: 1, nickel: 3 }), true);
assert.equal(gradeSuggestion(tradeQuarter, { dime: 2, nickel: 1 }), true, 'any set worth 25 with a dime');
assert.equal(gradeSuggestion(tradeQuarter, { nickel: 5 }), false, 'worth 25 but no dime');
assert.equal(gradeSuggestion(tradeQuarter, { quarter: 1 }), false, 'worth 25 but no dime');
const nickels = itemOf(g, 'wednesday', 0, 'dime-for-nickels');
assert.deepEqual(nickels.coinSet, ['nickel'], 'only nickels are offered');
assert.equal(nickels.targetCents, 10);
assert.equal(gradeSuggestion(nickels, { nickel: 2 }), true);
assert.equal(gradeSuggestion(nickels, { nickel: 3 }), false);

// yes / no questions, re-derived from the coins the prompt itself lists
const held = (prompt) => {
  const match = /I have (.+?)\. My tithe/.exec(prompt);
  const names = { quarters: 'quarter', dimes: 'dime', nickels: 'nickel', pennies: 'penny' };
  const coins = {};
  match[1].split(' and ').forEach((part) => { const [n, name] = part.split(' '); coins[names[name]] = Number(n); });
  return coins;
};
[['four-quarters', 10, 'no'], ['two-quarters-three-nickels', 50, 'yes'], ['three-dimes-two-quarters', 15, 'no']].forEach(([id, pay, answer]) => {
  const found = itemOf(g, 'wednesday', 0, id);
  assert.equal(found.kind, 'fill-blank');
  assert.deepEqual(found.wordBank, ['yes', 'no']);
  assert.ok(found.prompt.includes(usd(pay)));
  assert.deepEqual(found.answer, [canPayExactly(held(found.prompt), pay) ? 'yes' : 'no'], `${id}: derived from the coins`);
  assert.deepEqual(found.answer, [answer]);
  assert.equal(gradeSuggestion(found, [answer]), true);
  assert.equal(gradeSuggestion(found, [answer === 'yes' ? 'no' : 'yes']), false);
});

// multiplication, money and words
const times = /^(\d+) × (\d+) = \?$/;
let multiplications = 0;
DAYS.forEach((day) => g.days[day].sheets.forEach((sheet) => sheet.items.forEach((entry) => {
  const match = times.exec(entry.prompt);
  if (!match) return;
  multiplications += 1;
  assert.equal(entry.kind, 'numeric');
  assert.equal(entry.answer, Number(match[1]) * Number(match[2]), entry.prompt);
})));
assert.equal(multiplications, 3 + 3 + 3 + 3 + 4, 'three facts on Mon-Thu, four on Friday');
assert.equal(Math.round(itemOf(g, 'monday', 1, 'leo').answer * 100), 300 - 30, 'Leo keeps $3.00 - $0.30');
assert.equal(Math.round(itemOf(g, 'thursday', 1, 'mia-earned').answer * 100), 200 + 50, 'earned counts pay and the tip, not the sticker');
assert.equal(Math.round(itemOf(g, 'thursday', 1, 'luis-tithe').answer * 100), (300 + 100) / 10, 'tithe is 10% of what was EARNED');
assert.equal(Math.round(itemOf(g, 'friday', 1, 'kai-left').answer * 100), 900 - 200 - 90, 'earned - spent - tithe');
['kai', 'four-quarters-why'].forEach((id) => assert.equal(sheetOf(g, id === 'kai' ? 'monday' : 'thursday', 1).items.find((entry) => entry.id === id).kind, 'short-text'));
assert.equal(itemOf(g, 'friday', 1, 'how-you-knew').kind, 'short-text');
DAYS.forEach((day) => g.days[day].sheets.filter((sheet) => sheet.subject === 'codequest').forEach((sheet) => assert.deepEqual(sheet.items.map((entry) => entry.kind), ['short-text', 'long-text', 'scale'])));

// ---------- older son: what percent is A of B ----------
const HELP_BY_DAY = { monday: 'all', tuesday: 'all', wednesday: 'unit', thursday: 'demand', friday: undefined };
let percentItems = 0;
DAYS.forEach((day) => s.days[day].sheets.forEach((sheet) => sheet.items.forEach((entry) => {
  if (sheet.subject === 'codequest') return;
  percentItems += 1;
  const match = /(\d+) out of (\d+)/.exec(entry.prompt);
  assert.ok(match, `${entry.id}: "A out of B" in the prompt`);
  const [part, whole] = [Number(match[1]), Number(match[2])];
  assert.equal(entry.kind, 'numeric');
  assert.equal(entry.part, part);
  assert.equal(entry.whole, whole);
  assert.equal(entry.answer, (100 * part) / whole, `${day}/${entry.id}`);
  assert.equal(entry.help, HELP_BY_DAY[day], `${day}/${entry.id}: the help fades across the week`);
  if (day === 'friday') {
    assert.ok(!entry.unit && !entry.perItem, `${entry.id}: Friday is a plain typed answer, no blocks`);
  } else {
    assert.equal(entry.unit, 'percent');
    assert.equal(entry.perItem, true, `${entry.id}: one block per item`);
    assert.deepEqual(blockPlan(part, whole, true), { count: whole, size: 1 }, `${entry.id}: B blocks`);
    assert.ok(whole <= 50);
    assert.ok(Number.isInteger(1000 / whole), `${entry.id}: one block is a clean percent`);
  }
})));
assert.equal(percentItems, 3 + 3 + 4 + 4 + 5 + 3 + 5 + 3, 'every math and word-problem item (CodeQuest days excluded)');
// The spot answers the plan wrote out by hand
[['monday', 0, '2-of-5', 40], ['monday', 0, '2-of-8', 25], ['tuesday', 0, '3-of-8', 37.5], ['wednesday', 0, '7-of-8', 87.5], ['wednesday', 0, '12-of-25', 48],
  ['thursday', 1, 'pizza-survey', 82], ['friday', 1, 'pizza-slice', 12.5], ['friday', 1, 'soccer-survey', 66], ['friday', 0, '32-of-50', 64]].forEach(([day, index, id, answer]) => {
  assert.equal(itemOf(s, day, index, id).answer, answer, `${id}`);
});
// ONE block per item, even for 20, 25 and 50 (Week 11 grouped these into benchmark blocks; this week does not)
assert.deepEqual(blockPlan(14, 20, true), { count: 20, size: 1 });
assert.deepEqual(blockPlan(35, 50, true), { count: 50, size: 1 });
assert.notDeepEqual(blockPlan(14, 20), { count: 20, size: 1 }, 'without perItem the old grouping still applies');
assert.deepEqual(blockPlan(3, 60, true), blockPlan(3, 60), 'past 50 items a perItem problem falls back to the normal grouping');
assert.ok(blockPlan(3, 60, true).count <= 50);
assert.equal(blockView(itemOf(s, 'wednesday', 0, '35-of-50'), 0).caption, '1 block = 2%');
assert.equal(blockView(itemOf(s, 'monday', 0, '2-of-8'), 0).labels[0], '12.5%');

// the Thursday demo stays closed until he asks
const demand = itemOf(s, 'thursday', 0, '17-of-20');
const closed = blockView(demand, 0, false);
assert.equal(closed.hidden, true, 'closed at first');
assert.equal(closed.demand, true);
const open = blockView(demand, 3, true);
assert.equal(open.hidden, false);
assert.equal(open.help, 'unit', 'opened, it shows what one block is worth');
assert.equal(open.caption, '1 block = 5%');
assert.equal(open.filled, 3);
assert.equal(JSON.stringify(blockView(demand, 0, false)).includes('"answer"'), false);

// ---------- what the kid sees never carries an answer or a note ----------
const kidStore = { ...emptyStore(), track: 'guided' };
const sheetHtml = (week, day, index, extra) => renderSheetArticle(week, day, sheetOf(week, day, index), { sheets: {}, submittedAt: null }, false, () => 0, () => false, extra);
const kidPages = [];
DAYS.forEach((day) => { g.days[day].sheets.forEach((_, index) => kidPages.push(sheetHtml(g, day, index))); s.days[day].sheets.forEach((_, index) => kidPages.push(sheetHtml(s, day, index))); });
kidPages.forEach((html) => {
  ['Model answer', 'For you:', 'payCents', 'parentNote', 'mustHave', 'cqd-check-note'].forEach((leak) => assert.equal(html.includes(leak), false, `a kid sheet must not contain "${leak}"`));
});
const thursdayHtml = sheetHtml(s, 'thursday', 0);
assert.ok(thursdayHtml.includes('Show me the blocks'), 'Thursday offers the demo');
assert.equal(thursdayHtml.includes('cqd-block-bar'), false, 'and shows no bar until it is asked for');
assert.equal(thursdayHtml.includes('daily-block-reveal'), true);
const opened = renderSheetArticle(s, 'thursday', sheetOf(s, 'thursday', 0), { sheets: {}, submittedAt: null }, false, () => 0, (entry) => entry.id === '17-of-20');
assert.equal((opened.match(/cqd-block-bar/g) || []).length, 1, 'only the opened problem draws its blocks');
assert.equal((opened.match(/daily-block-reveal/g) || []).length, 4, 'the other four are still closed');
assert.ok(sheetHtml(s, 'friday', 0).includes('data-kind="numeric"') && !sheetHtml(s, 'friday', 0).includes('cqd-percent-grid') && !sheetHtml(s, 'friday', 0).includes('cqd-block'), 'Friday: typed answers only');
assert.ok(sheetHtml(g, 'wednesday', 0).includes('cqd-bank'), 'the yes/no questions show a word bank');

// Wednesday: he adds the blocks up himself. Nothing in the bar (no running percent, no labels, no readout) says the
// answer at ANY fill level, even with every block filled in.
s.days.wednesday.sheets[0].items.forEach((entry) => {
  const plan = blockPlan(entry.part, entry.whole, true);
  for (let filled = 0; filled <= plan.count; filled += 1) {
    const view = blockView(entry, filled, false);
    assert.ok(view.labels.every((label) => label === null), `wednesday/${entry.id}: no block carries a percent (filled ${filled})`);
    assert.equal(view.readout, null, `wednesday/${entry.id}: no running total (filled ${filled})`);
    assert.ok(/^1 block = /.test(view.caption), `wednesday/${entry.id}: only what ONE block is worth`);
    assert.equal(JSON.stringify(view).includes(String(entry.answer)), false, `wednesday/${entry.id}: the answer ${entry.answer} appears nowhere in the view (filled ${filled})`);
  }
  const fullBar = renderSheetArticle(s, 'wednesday', sheetOf(s, 'wednesday', 0), { sheets: {}, submittedAt: null }, false, (item) => (item.id === entry.id ? plan.count : 0), () => false);
  const own = fullBar.split('<li ').find((chunk) => chunk.includes(`data-item="${entry.id}"`));
  assert.ok(own && own.includes('is-filled'), `wednesday/${entry.id}: the fully filled bar is drawn`);
  assert.equal(own.includes('has-label'), false, `wednesday/${entry.id}: no labelled block in the HTML`);
  assert.equal(own.includes('cqd-block-readout'), false, `wednesday/${entry.id}: no readout line in the HTML`);
  assert.equal(new RegExp(`(?<![\\d.])${String(entry.answer).replace('.', '\\.')}\\s*%`).test(own), false, `wednesday/${entry.id}: the answer is not printed in the item`);
});

// ---------- the parent's check-work page shows the model answer and the tithe check ----------
const answered = JSON.parse(JSON.stringify({ ...emptyStore(), track: 'guided' }));
answered.parent.unlockedUntil = Date.now() + 3600000;
answered.dailyWork = { weeks: { 'week-12': { days: { monday: { sheets: { 'coins-for-my-tithe': { items: {
  'tithe-10-new-way': { value: { quarter: 4 }, status: 'answered', checkedAt: null },
  'tithe-20': { value: { dime: 2, quarter: 3, nickel: 1 }, status: 'answered', checkedAt: null },
} } }, submittedAt: '2026-09-28T15:00:00.000Z' } } } } };
const parentState = createParentState();
parentState.selectedDay = 'monday';
const html = renderParent(answered, parentState, '2026-09-28', Date.now());
assert.ok(html.includes('Model answer: 2 dimes + 3 quarters + 1 nickel'), 'the parent sees the model answer');
assert.ok(html.includes('cannot</strong> pay it exactly') && html.includes('can</strong> pay it exactly'), 'and whether the tithe can be paid with the coins built');
assert.ok(html.includes('Suggested: Incorrect') && html.includes('Suggested: Correct'), 'with a suggestion each way');

console.log('ok — week 12: schedule + weekend catch-up, every tithe build/answer re-derived, percent items one block per item and fading help, hidden demo, kid pages leak nothing, parent sees model answers');
