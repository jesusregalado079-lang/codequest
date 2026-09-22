import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { currentWeek, weekdayKey } from '../src/cq/daily-work/schedule.js';
import { dailyWorkHtml, dailyWorkReady, itemMeta, itemWithSheet, updateDailyWork } from '../src/cq/daily-work/daily-work-ui.js';
import { checkDailyParentPin, createDailyParentState, dailyParentHtml, dayStatus, gradeDailyWork, gradeSuggestion, setDailyParentPin } from '../src/cq/daily-work/daily-work-parent.js';
import { normalizeDailyWork } from '../src/cq/daily-work/state.js';

const week = (id, assignedWeekOf = null) => ({
  id, label: id, assignedWeekOf,
  weekItems: [{ id: 'verse-sheet', title: 'Memory Verse', subject: 'memory-verse', intro: null, example: null, citation: 'Test 1:1', items: [
    { id: 'verse', kind: 'fill-blank', prompt: 'A ___ B ___.', wordBank: ['first', 'second'], answer: ['first', 'second'], scaleMax: null },
  ] }],
  days: {
    monday: { sheets: [{ id: 'practice', title: 'Practice', subject: 'math', intro: 'Try this.', example: '1 + 1 = 2.', items: [
      { id: 'number', kind: 'numeric', prompt: 'Number', wordBank: null, answer: 50, scaleMax: null },
      { id: 'short', kind: 'short-text', prompt: 'Short', wordBank: null, answer: null, scaleMax: null },
      { id: 'long', kind: 'long-text', prompt: 'Long', wordBank: null, answer: null, scaleMax: null },
      { id: 'scale', kind: 'scale', prompt: 'Scale', wordBank: null, answer: null, scaleMax: 5 },
      { id: 'coins', kind: 'coin-total', prompt: 'Make 50 cents', wordBank: null, answer: 50, scaleMax: null, coinSet: ['quarter', 'penny', 'dime', 'nickel'], targetCents: 50, pile: null },
      { id: 'pile', kind: 'coin-total', prompt: 'You have 3 dimes and 4 pennies. How much is that?', wordBank: null, answer: 34, scaleMax: null, coinSet: ['penny', 'dime'], targetCents: null, pile: { dime: 3, penny: 4 } },
    ] }] },
    tuesday: { sheets: [] }, wednesday: { sheets: [] }, thursday: { sheets: [] }, friday: { sheets: [] },
  },
});
const content = { guided: { weeks: { 'week-11': week('week-11', '2026-09-21'), live: week('live') } } };
const monday = '2026-09-21';
const empty = () => ({ track: 'guided', dailyWork: { weeks: {} } });

// Calendar lookup: an assigned span wins; exactly one unscheduled week is a safe fallback.
assert.equal(currentWeek(content, 'guided', monday).id, 'week-11');
assert.equal(currentWeek({ guided: { weeks: { live: week('live') } } }, 'guided', '2026-10-01').id, 'live');
assert.equal(currentWeek({ guided: { weeks: { } } }, 'guided', monday), null);
assert.equal(currentWeek({ guided: { weeks: { a: week('a'), b: week('b') } } }, 'guided', monday), null);

// All weekday keys map to a work view; Saturday and Sunday deliberately do not.
[['2026-09-21', 'monday'], ['2026-09-22', 'tuesday'], ['2026-09-23', 'wednesday'], ['2026-09-24', 'thursday'], ['2026-09-25', 'friday'], ['2026-09-26', 'saturday'], ['2026-09-27', 'sunday']].forEach(([date, key]) => {
  assert.equal(weekdayKey(date), key);
  const html = dailyWorkHtml(empty(), { content, todayIso: date });
  if (key === 'saturday' || key === 'sunday') assert.match(html, /No Daily Work today/);
  else assert.match(html, /Daily Work/);
});

function mount(cq) {
  const dom = new JSDOM('<main id="root"></main>');
  const root = dom.window.document.getElementById('root');
  const render = () => { root.innerHTML = dailyWorkHtml(cq, { content, todayIso: monday }); };
  const data = (element) => ({ week: element.dataset.week, day: element.dataset.day, sheet: element.dataset.sheet, item: element.dataset.item, index: element.dataset.index, denom: element.dataset.denom });
  const apply = (element, action, value) => {
    const details = data(element);
    const item = itemMeta(content, cq.track, details);
    if (item) { details.kind = item.kind; details.answer = item.answer; }
    cq = updateDailyWork(cq, action, details, value, '2026-09-21T12:00:00.000Z');
    render();
  };
  root.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button || button.disabled) return;
    if (button.dataset.action === 'daily-word') apply(button, 'daily-word', button.dataset.word);
    else if (button.dataset.action === 'daily-blank') apply(button, 'daily-blank');
    else if (button.dataset.action === 'daily-scale') apply(button, 'daily-scale', button.dataset.value);
    else if (button.dataset.action === 'daily-submit') apply(button, 'daily-submit');
    // Same dispatch shape ui.js uses for the coin actions: everything travels in the data-* set.
    else if (button.dataset.action.indexOf('daily-coin-') === 0) apply(button, button.dataset.action);
  });
  root.addEventListener('input', (event) => {
    const input = event.target.closest('[data-action="daily-input"]');
    if (!input) return;
    const details = data(input);
    const item = itemMeta(content, cq.track, details);
    details.kind = item.kind;
    cq = updateDailyWork(cq, 'daily-input', details, input.value);
  });
  render();
  return { dom, root, get cq() { return cq; }, render };
}

const mounted = mount(empty());
assert.ok(mounted.root.querySelector('input[inputmode="decimal"]'), 'numeric item has a decimal-friendly input');
assert.ok(mounted.root.querySelector('textarea'), 'long-text item has a textarea');
assert.equal(mounted.root.querySelectorAll('[data-action="daily-scale"]').length, 5, 'scale has one button per point');
assert.equal(mounted.root.querySelectorAll('[data-item="coins"][data-action="daily-coin-add"]').length, 4, 'build-the-amount coin item has one add button per denomination');
assert.equal(/Coming soon/.test(mounted.root.textContent), false, 'the coin placeholder is gone');
assert.equal(mounted.root.querySelector('[data-action="daily-submit"]').disabled, true, 'submit begins disabled');

function input(selector, value) {
  const field = mounted.root.querySelector(selector);
  field.value = value;
  field.dispatchEvent(new mounted.dom.window.Event('input', { bubbles: true }));
}
input('[data-item="number"]', '50%');
assert.equal(mounted.cq.dailyWork.weeks['week-11'].days.monday.sheets.practice.items.number.value, 50);
input('[data-item="number"]', '$1.10');
assert.equal(mounted.cq.dailyWork.weeks['week-11'].days.monday.sheets.practice.items.number.value, 1.1);
input('[data-item="number"]', 'abc');
assert.equal(mounted.cq.dailyWork.weeks['week-11'].days.monday.sheets.practice.items.number.value, 'abc');
input('[data-item="number"]', '50');
input('[data-item="short"]', 'Level 4');
input('[data-item="long"]', 'I learned loops.');
assert.equal(mounted.cq.dailyWork.weeks['week-11'].days.monday.sheets.practice.items.short.value, 'Level 4');
assert.equal(mounted.cq.dailyWork.weeks['week-11'].days.monday.sheets.practice.items.long.value, 'I learned loops.');
mounted.root.querySelector('[data-action="daily-scale"][data-value="4"]').click();
assert.equal(mounted.cq.dailyWork.weeks['week-11'].days.monday.sheets.practice.items.scale.value, 4);

mounted.root.querySelector('[data-action="daily-word"][data-word="first"]').click();
mounted.root.querySelector('[data-action="daily-word"][data-word="second"]').click();
assert.deepEqual(mounted.cq.dailyWork.weeks['week-11'].days.monday.sheets['verse-sheet'].items.verse.value, ['first', 'second']);
mounted.root.querySelector('[data-action="daily-blank"][data-index="0"]').click();
assert.deepEqual(mounted.cq.dailyWork.weeks['week-11'].days.monday.sheets['verse-sheet'].items.verse.value, [null, 'second']);
mounted.root.querySelector('[data-action="daily-word"][data-word="first"]').click();
assert.deepEqual(mounted.cq.dailyWork.weeks['week-11'].days.monday.sheets['verse-sheet'].items.verse.value, ['first', 'second']);
assert.deepEqual(normalizeDailyWork({ weeks: { 'week-11': { days: { monday: { sheets: { 'memory-verse': { items: { verse: { value: ['first', 'second'], status: 'answered', checkedAt: null } } } } } } } } }).weeks['week-11'].days.monday.sheets['memory-verse'].items.verse.value, ['first', 'second'], 'profile normalization keeps partial blank arrays');
mounted.render();
assert.equal(mounted.root.querySelector('[data-action="daily-submit"]').disabled, true, 'an untouched coin item blocks submission, same as any other unanswered item');
mounted.root.querySelector('[data-action="daily-coin-add"][data-item="coins"][data-denom="quarter"]').click();
input('[data-item="pile"]', '34');
mounted.render();
assert.equal(mounted.root.querySelector('[data-action="daily-submit"]').disabled, false, 'submit enables once the coin items are answered too');

const beforeSubmit = JSON.stringify(mounted.cq.dailyWork);
mounted.root.querySelector('[data-action="daily-submit"]').click();
const afterSubmit = JSON.parse(JSON.stringify(mounted.cq.dailyWork));
const beforeObject = JSON.parse(beforeSubmit);
afterSubmit.weeks['week-11'].days.monday.submittedAt = beforeObject.weeks['week-11'].days.monday.submittedAt;
assert.deepEqual(afterSubmit, beforeObject, 'submit changes only submittedAt');
assert.equal(mounted.cq.dailyWork.weeks['week-11'].days.monday.submittedAt, '2026-09-21T12:00:00.000Z');

const awaiting = empty();
awaiting.dailyWork = {
  weeks: {
    'week-11': {
      days: {
        monday: {
          submittedAt: '2026-09-21T12:00:00.000Z',
          sheets: { practice: { items: { number: { value: 50, status: 'answered', checkedAt: null } } } },
        },
      },
    },
  },
};
assert.match(dailyWorkHtml(awaiting, { content, todayIso: monday }), /Waiting for a parent to check it/);
const fullyChecked = empty();
const allState = {};
[...content.guided.weeks['week-11'].weekItems, ...content.guided.weeks['week-11'].days.monday.sheets].forEach((sheet) => {
  allState[sheet.id] = { items: {} };
  sheet.items.forEach((item) => { allState[sheet.id].items[item.id] = { value: item.kind === 'fill-blank' ? ['first', 'second'] : 1, status: 'correct', checkedAt: null }; });
});
fullyChecked.dailyWork = {
  weeks: {
    'week-11': {
      days: { monday: { submittedAt: '2026-09-21T12:00:00.000Z', sheets: allState } },
    },
  },
};
assert.match(dailyWorkHtml(fullyChecked, { content, todayIso: monday }), /All done, great job/);

// Now that the coin interactive is real (P10c), a coin-total item is graded the same as anything
// else — an uncorrected one blocks "All done" and the day sits at "waiting for a parent" instead,
// same as any other unfinished item would. (Earlier this was deliberately the opposite, back when
// coin items were unanswerable placeholders — that exclusion no longer applies.)
const stillWaitingOnCoin = empty();
const stateWithoutCoin = {};
[...content.guided.weeks['week-11'].weekItems, ...content.guided.weeks['week-11'].days.monday.sheets].forEach((sheet) => {
  stateWithoutCoin[sheet.id] = { items: {} };
  sheet.items.forEach((item) => {
    if (item.kind === 'coin-total') return; // left as the default: value null, status 'unanswered'
    stateWithoutCoin[sheet.id].items[item.id] = { value: item.kind === 'fill-blank' ? ['first', 'second'] : 1, status: 'correct', checkedAt: null };
  });
});
stillWaitingOnCoin.dailyWork = {
  weeks: { 'week-11': { days: { monday: { submittedAt: '2026-09-21T12:00:00.000Z', sheets: stateWithoutCoin } } } },
};
const stillWaitingHtml = dailyWorkHtml(stillWaitingOnCoin, { content, todayIso: monday });
assert.equal(/All done, great job/.test(stillWaitingHtml), false, 'an uncorrected coin-total item blocks "All done"');
assert.match(stillWaitingHtml, /Waiting for a parent to check it/, 'the day still reads as awaiting a parent, not finished');

const reopened = empty();
reopened.dailyWork = {
  weeks: {
    'week-11': {
      days: {
        monday: {
          submittedAt: '2026-09-21T12:00:00.000Z',
          sheets: { practice: { items: {
            number: { value: 5, status: 'wrong', checkedAt: null },
            short: { value: 'done', status: 'correct', checkedAt: null },
          } } },
        },
      },
    },
  },
};
const reopenedHtml = dailyWorkHtml(reopened, { content, todayIso: monday });
assert.ok(/data-item="number"/.test(reopenedHtml), 'returned item is editable');
assert.match(reopenedHtml, /No answer yet|done/, 'checked item stays shown');
assert.equal(/data-item="short"[^>]*value=/.test(reopenedHtml), false, 'checked item has no input');
const fixed = updateDailyWork(reopened, 'daily-input', { week: 'week-11', day: 'monday', sheet: 'practice', item: 'number', kind: 'numeric' }, '50');
assert.equal(fixed.dailyWork.weeks['week-11'].days.monday.submittedAt, null, 'editing a returned item reopens the day');
assert.equal(fixed.dailyWork.weeks['week-11'].days.monday.sheets.practice.items.number.status, 'answered');
// ---------------------------------------------------------------------------
// coin-total — build the amount (tap to count)
// ---------------------------------------------------------------------------
const coinsUi = mount(empty());
const coinBlock = () => Array.from(coinsUi.root.querySelectorAll('.cq-dw-coin')).find((li) => li.querySelector('.cq-dw-tray'));
const pileBlock = () => Array.from(coinsUi.root.querySelectorAll('.cq-dw-coin')).find((li) => li.querySelector('.cq-dw-pile'));
const coinValue = () => (((coinsUi.cq.dailyWork.weeks['week-11'] || { days: {} }).days.monday || { sheets: {} }).sheets.practice || { items: {} }).items.coins;
const tap = (denom) => coinsUi.root.querySelector(`[data-action="daily-coin-add"][data-item="coins"][data-denom="${denom}"]`).click();
const untap = (denom) => coinsUi.root.querySelector(`[data-action="daily-coin-remove"][data-item="coins"][data-denom="${denom}"]`).click();
const totalText = () => coinBlock().querySelector('.cq-dw-coin-total').textContent;
const clearButton = () => coinBlock().querySelector('[data-action="daily-coin-clear"]');

// Denominations always run cheapest → dearest, whatever order the author listed them in.
assert.deepEqual(Array.from(coinBlock().querySelectorAll('[data-action="daily-coin-add"]')).map((b) => b.dataset.denom), ['penny', 'nickel', 'dime', 'quarter'], 'coins render in ascending value order');
assert.equal(coinBlock().querySelectorAll('[data-action="daily-coin-remove"]').length, 0, 'no take-one-back control until something has been tapped');
assert.equal(clearButton().disabled, true, 'Clear is inert with an empty tray');
assert.match(totalText(), /\$0\.00/, 'the running total starts at zero');
assert.match(coinBlock().textContent, /Try to make: \$0\.50/, 'the target amount is restated from the prompt');

tap('quarter');
assert.deepEqual(coinValue().value, { quarter: 1 }, 'the first tap stores one coin');
assert.equal(coinValue().status, 'answered', 'the first tap marks the item answered');
tap('quarter'); tap('dime'); tap('penny'); tap('penny'); tap('penny'); tap('penny');
assert.deepEqual(coinValue().value, { penny: 4, dime: 1, quarter: 2 }, 'every tap increments its own denomination');
assert.equal(Object.prototype.hasOwnProperty.call(coinValue().value, 'nickel'), false, 'untouched denominations are omitted, not stored as zero');
assert.match(totalText(), /\$0\.64/, 'the live total sums 2 quarters + 1 dime + 4 pennies');
assert.match(coinBlock().querySelector('[data-denom="quarter"][data-action="daily-coin-add"]').getAttribute('aria-label'), /Quarter, 25 cents, tap to add one, 2 quarters so far/, 'the add button speaks the denomination, its value and the running count');
assert.match(coinBlock().querySelector('[data-denom="quarter"][data-action="daily-coin-add"]').textContent, /×2/, 'a count badge appears once a coin is tapped');

untap('penny');
assert.deepEqual(coinValue().value, { penny: 3, dime: 1, quarter: 2 }, 'the minus control removes exactly one');
assert.match(totalText(), /\$0\.63/, 'the total follows a removal');
untap('penny'); untap('penny'); untap('penny');
assert.equal(Object.prototype.hasOwnProperty.call(coinValue().value, 'penny'), false, 'a denomination back at zero drops out of the stored value');
assert.equal(coinBlock().querySelectorAll('[data-denom="penny"][data-action="daily-coin-remove"]').length, 0, 'the minus control disappears at zero — there is no way to go negative by clicking');
// Belt and braces: even a hand-fired remove on a denomination at zero cannot go below zero.
const forced = updateDailyWork(coinsUi.cq, 'daily-coin-remove', { week: 'week-11', day: 'monday', sheet: 'practice', item: 'coins', denom: 'penny' }, null, '2026-09-21T12:00:00.000Z');
assert.deepEqual(forced.dailyWork.weeks['week-11'].days.monday.sheets.practice.items.coins.value, { dime: 1, quarter: 2 }, 'removing a coin that is not there is a no-op, never a negative count');
const bogus = updateDailyWork(coinsUi.cq, 'daily-coin-add', { week: 'week-11', day: 'monday', sheet: 'practice', item: 'coins', denom: 'doubloon' }, null, '2026-09-21T12:00:00.000Z');
assert.deepEqual(bogus.dailyWork.weeks['week-11'].days.monday.sheets.practice.items.coins.value, { dime: 1, quarter: 2 }, 'an unknown denomination is ignored');

clearButton().click();
assert.equal(coinValue().value, null, 'Clear zeroes every denomination');
assert.equal(coinValue().status, 'unanswered', 'Clear puts the item back to unanswered');
assert.match(totalText(), /\$0\.00/, 'the total returns to zero after Clear');
assert.equal(coinBlock().querySelectorAll('[data-action="daily-coin-remove"]').length, 0, 'Clear removes every minus control');
tap('dime'); tap('dime');
assert.deepEqual(coinValue().value, { dime: 2 }, 'building again after Clear starts from scratch');
assert.match(totalText(), /\$0\.20/, 'the total restarts with the rebuilt pile');

// A stored count object survives the profile normalizer untouched (state.js coinCounts()).
assert.deepEqual(normalizeDailyWork({ weeks: { 'week-11': { days: { monday: { sheets: { practice: { items: { coins: { value: { penny: 4, dime: 1, quarter: 2 }, status: 'answered', checkedAt: null } } } } } } } } }).weeks['week-11'].days.monday.sheets.practice.items.coins.value, { penny: 4, dime: 1, quarter: 2 }, 'coin counts round-trip through profile normalization');

// --- the rule that must never break: the app never tells the kid whether the total is right. ---
// Same taps, same everything — only the authored target differs, and in the first case the kid's
// total lands exactly on it. If any correctness signal existed, these two would diverge by more
// than the restated target line.
function coinHtml(targetCents) {
  const custom = JSON.parse(JSON.stringify(content));
  custom.guided.weeks['week-11'].days.monday.sheets[0].items.forEach((entry) => { if (entry.id === 'coins') entry.targetCents = targetCents; });
  const state = { track: 'guided', dailyWork: { weeks: { 'week-11': { days: { monday: { submittedAt: null, sheets: { practice: { items: { coins: { value: { quarter: 2 }, status: 'answered', checkedAt: null } } } } } } } } } };
  return dailyWorkHtml(state, { content: custom, todayIso: monday });
}
const exactMatch = coinHtml(50);  // the kid's two quarters hit the target exactly
const nearMiss = coinHtml(51);    // identical taps, target one cent away
assert.notEqual(exactMatch, nearMiss, 'the fixtures really do differ (the restated target)');
assert.equal(exactMatch.replace('Try to make: $0.50', 'TARGET'), nearMiss.replace('Try to make: $0.51', 'TARGET'), 'hitting the target exactly changes nothing on screen but the restated target — no class, colour, tick or wording');
const exactBlock = /<li class="cq-dw-item cq-dw-coin"[^>]*>[\s\S]*?Your total[\s\S]*?<\/li>/.exec(exactMatch)[0];
assert.equal(/correct|wrong|✓|✔|match|well done|you got it|nice job/i.test(exactBlock), false, 'no verdict wording anywhere in the coin markup');

// ---------------------------------------------------------------------------
// coin-total — count the pile (read-only coins, one typed total)
// ---------------------------------------------------------------------------
assert.ok(pileBlock(), 'a pile item renders');
assert.equal(pileBlock().querySelectorAll('button').length, 0, 'a pile is read-only — nothing to tap');
assert.match(pileBlock().textContent, /3 dimes/, 'the pile states its coins');
assert.match(pileBlock().textContent, /4 pennies/, 'plural coin names read naturally');
const pileInput = pileBlock().querySelector('input[data-action="daily-input"]');
assert.ok(pileInput, 'the pile item takes a typed total');
assert.equal(pileInput.getAttribute('inputmode'), 'decimal', 'the pile total uses the numeric keypad hint');
pileInput.value = '34¢';
pileInput.dispatchEvent(new coinsUi.dom.window.Event('input', { bubbles: true }));
assert.equal(coinsUi.cq.dailyWork.weeks['week-11'].days.monday.sheets.practice.items.pile.value, 34, 'the pile total goes through the shared numeric sanitizer');
coinsUi.render();
assert.equal(pileBlock().querySelector('input').value, '34', 'the saved pile total comes back on screen (sanitized, same as any numeric item)');

// Coin items now count toward "ready" the same as anything else (fixed post-P10c: they used to
// be excluded because they were literally unanswerable, which no longer applies).
assert.equal(dailyWorkReady(coinsUi.cq, { content, todayIso: monday }), false, 'coins alone do not make the day ready — the other items are still unanswered');
const otherItemsDone = empty();
otherItemsDone.dailyWork = { weeks: { 'week-11': { days: { monday: { submittedAt: null, sheets: {
  'verse-sheet': { items: { verse: { value: ['first', 'second'], status: 'answered', checkedAt: null } } },
  practice: { items: {
    number: { value: 50, status: 'answered', checkedAt: null }, short: { value: 'x', status: 'answered', checkedAt: null },
    long: { value: 'y', status: 'answered', checkedAt: null }, scale: { value: 3, status: 'answered', checkedAt: null },
  } },
} } } } } };
assert.equal(dailyWorkReady(otherItemsDone, { content, todayIso: monday }), false, 'the two coin items (build-the-amount and count-the-pile) are still unanswered, so the day is not ready yet');
const oneCoinItemDone = JSON.parse(JSON.stringify(otherItemsDone));
oneCoinItemDone.dailyWork.weeks['week-11'].days.monday.sheets.practice.items.coins = { value: { quarter: 2 }, status: 'answered', checkedAt: null };
assert.equal(dailyWorkReady(oneCoinItemDone, { content, todayIso: monday }), false, 'one of the two coin items answered is still not every item answered');
const coinsTappedToo = JSON.parse(JSON.stringify(oneCoinItemDone));
coinsTappedToo.dailyWork.weeks['week-11'].days.monday.sheets.practice.items.pile = { value: 34, status: 'answered', checkedAt: null };
assert.equal(dailyWorkReady(coinsTappedToo, { content, todayIso: monday }), true, 'ready once every item — coins included — has a value');
// A coin item a parent has locked shows the coins chosen, not "[object Object]".
const lockedCoins = JSON.parse(JSON.stringify(coinsTappedToo));
lockedCoins.dailyWork.weeks['week-11'].days.monday.submittedAt = '2026-09-21T12:00:00.000Z';
lockedCoins.dailyWork.weeks['week-11'].days.monday.sheets.practice.items.coins.status = 'correct';
lockedCoins.dailyWork.weeks['week-11'].days.monday.sheets.practice.items.number.status = 'wrong';
const lockedHtml = dailyWorkHtml(lockedCoins, { content, todayIso: monday });
assert.match(lockedHtml, /2 quarters · \$0\.50/, 'a locked coin answer reads back as the coins chosen');
assert.equal(/object Object/.test(lockedHtml), false, 'no raw object ever reaches the page');

const coinStatuses = JSON.stringify(coinsUi.cq.dailyWork).match(/"status":"([^"]+)"/g) || [];
assert.equal(coinStatuses.some((entry) => /correct|wrong/.test(entry)), false, 'coin taps never create grading statuses');
const outputStatuses = JSON.stringify(mounted.cq.dailyWork).match(/"status":"([^"]+)"/g) || [];
assert.equal(outputStatuses.some((entry) => /correct|wrong/.test(entry)), false, 'kid write paths never create grading statuses');
const kidUiSource = readFileSync(new URL('../src/cq/daily-work/daily-work-ui.js', import.meta.url), 'utf8');
assert.equal(/status:\s*['"](?:correct|wrong)['"]/.test(kidUiSource), false, 'kid UI never writes grading statuses');
// Static backstop for the coin rule: no line of real code ever holds the authored target and a
// total together, which is what a self-grading comparison would have to look like.
assert.equal(kidUiSource.split('\n').some((line) => /targetCents/.test(line) && /\btotal\b/i.test(line) && !/^\s*\/\//.test(line)), false, 'the running total is never computed or compared against targetCents');

// ---------------------------------------------------------------------------
// parent mode — tracker, suggestions, PIN boundary and grading writes
// ---------------------------------------------------------------------------
const parentSheets = [...content.guided.weeks['week-11'].weekItems, ...content.guided.weeks['week-11'].days.monday.sheets]
  .map((sheet) => ({ ...sheet, items: itemWithSheet(sheet) }));
const parentDay = (submittedAt, items) => ({ submittedAt, sheets: { practice: { items: items || {} } } });
assert.equal(dayStatus(parentDay('2026-09-21T12:00:00.000Z', {
  number: { value: 50, status: 'correct', checkedAt: null }, short: { value: 'x', status: 'correct', checkedAt: null }, long: { value: 'x', status: 'correct', checkedAt: null }, scale: { value: 1, status: 'correct', checkedAt: null }, coins: { value: { quarter: 2 }, status: 'correct', checkedAt: null }, pile: { value: 34, status: 'correct', checkedAt: null },
}), parentSheets), 'awaiting-check', 'a submitted day missing the verse is awaiting check');
const everyCorrect = {};
parentSheets.forEach((sheet) => {
  everyCorrect[sheet.id] = { items: {} };
  sheet.items.forEach((item) => { everyCorrect[sheet.id].items[item.id] = { value: item.kind === 'fill-blank' ? ['first', 'second'] : 1, status: 'correct', checkedAt: null }; });
});
const completeDay = { submittedAt: '2026-09-21T12:00:00.000Z', sheets: everyCorrect };
assert.equal(dayStatus(completeDay, parentSheets), 'complete', 'submitted and all correct is complete');
const overlap = JSON.parse(JSON.stringify(completeDay));
overlap.sheets.practice.items.number.status = 'wrong';
assert.equal(dayStatus(overlap, parentSheets), 'needs-fixes', 'submitted plus a wrong item resolves to needs-fixes before awaiting-check');
const inProgress = { submittedAt: null, sheets: { practice: { items: { number: { value: 50, status: 'answered', checkedAt: null } } } } };
assert.equal(dayStatus(inProgress, parentSheets), 'in-progress', 'an unsent answer is in progress');
assert.equal(dayStatus({ submittedAt: null, sheets: {} }, parentSheets), 'not-started', 'a blank day is not started');

const byId = (id) => content.guided.weeks['week-11'].days.monday.sheets[0].items.find((item) => item.id === id);
const verseItem = content.guided.weeks['week-11'].weekItems[0].items[0];
assert.equal(gradeSuggestion(byId('number'), '50'), true, 'numeric suggestions tolerate stored numeric strings');
assert.equal(gradeSuggestion(byId('number'), 'not a number'), false, 'unparseable numeric input is incorrect');
assert.equal(gradeSuggestion(verseItem, ['first', 'second']), true, 'fill blanks match in order');
assert.equal(gradeSuggestion(verseItem, ['second', 'first']), false, 'fill blanks reject reordered words');
assert.equal(gradeSuggestion(byId('coins'), { quarter: 1, dime: 1, nickel: 1 }), false, 'coin build suggestion compares the counted sum to target cents');
assert.equal(gradeSuggestion(byId('coins'), { quarter: 2 }), true, 'coin build accepts any combination totaling target cents');
assert.equal(gradeSuggestion(byId('pile'), '34'), true, 'coin pile suggestion compares typed total');
['short', 'long', 'scale'].forEach((id) => assert.equal(gradeSuggestion(byId(id), 'anything'), null, `${id} stays parent-judged`));

const gradingSource = empty();
gradingSource.dailyWork = { weeks: { 'week-11': { days: { monday: { submittedAt: '2026-09-21T12:00:00.000Z', sheets: {
  'verse-sheet': { items: { verse: { value: ['first', 'second'], status: 'answered', checkedAt: null } } },
  practice: { items: {
    number: { value: 50, status: 'answered', checkedAt: null }, short: { value: 'note', status: 'answered', checkedAt: null }, long: { value: 'leave alone', status: 'answered', checkedAt: 'old-time' },
  } },
} } } } } };
const graded = gradeDailyWork(gradingSource, content, 'week-11', 'monday', { 'practice/number': 'correct', 'practice/short': 'wrong' }, '2026-09-22T10:00:00.000Z');
const gradeDay = graded.dailyWork.weeks['week-11'].days.monday;
assert.equal(gradeDay.submittedAt, '2026-09-21T12:00:00.000Z', 'grading never touches submittedAt');
assert.deepEqual(gradeDay.sheets.practice.items.number, { value: 50, status: 'correct', checkedAt: '2026-09-22T10:00:00.000Z' }, 'correct keeps value and stamps checkedAt');
assert.deepEqual(gradeDay.sheets.practice.items.short, { value: null, status: 'wrong', checkedAt: '2026-09-22T10:00:00.000Z' }, 'incorrect clears value and stamps checkedAt');
assert.deepEqual(gradeDay.sheets.practice.items.long, { value: 'leave alone', status: 'answered', checkedAt: 'old-time' }, 'untouched item is byte-for-byte unchanged');
assert.match(dailyWorkHtml(graded, { content, todayIso: monday }), /sent back a few answers to fix/, 'a wrong grade reopens the actual kid view');
const parentCheckMarkup = dailyParentHtml(gradingSource, { content, state: { open: true, unlocked: true, selectedDay: 'monday', pinMessage: '' }, todayIso: monday });
assert.match(parentCheckMarkup, /This week/, 'the parent check view includes the daily tracker');
assert.match(parentCheckMarkup, /Suggested: Correct/, 'known-answer items render a computed suggestion');
assert.match(parentCheckMarkup, /No automatic suggestion — parent decides/, 'short text, long text and scale remain parent-judged');
assert.match(parentCheckMarkup, /Not answered/, 'blank coin and numeric answers are called out instead of left empty');

const savedLocalStorage = globalThis.localStorage;
const pinDom = new JSDOM('', { url: 'https://codequest.test/' });
globalThis.localStorage = pinDom.window.localStorage;
try {
  const freshGate = dailyParentHtml(empty(), { content, state: createDailyParentState(), todayIso: monday });
  assert.match(freshGate, /Set a grown-up PIN/, 'no parent PIN shows the set-a-PIN form');
  const mismatch = await setDailyParentPin('1234', '9999');
  assert.equal(mismatch.ok, false, 'mismatched PIN confirmation does not set a PIN');
  const set = await setDailyParentPin('1234', '1234');
  assert.equal(set.ok, true, 'matching four-digit PIN sets successfully');
  const wrongPin = await checkDailyParentPin('0000', Date.now());
  assert.equal(wrongPin.unlocked, false, 'wrong PIN does not unlock parent mode');
  assert.match(wrongPin.message, /Wrong PIN — 4 tries left/, 'wrong PIN reports tries remaining');
  const correctPin = await checkDailyParentPin('1234', Date.now());
  assert.equal(correctPin.unlocked, true, 'correct PIN unlocks parent mode');
  assert.equal(createDailyParentState().unlocked, false, 'a fresh Daily Work module state always starts locked');
} finally {
  if (savedLocalStorage === undefined) delete globalThis.localStorage;
  else globalThis.localStorage = savedLocalStorage;
}

console.log('cq daily work UI tests passed');
