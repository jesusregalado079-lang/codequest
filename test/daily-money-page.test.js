import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import * as c from '../src/daily/chores.js';
import * as storage from '../src/daily/store.js';
import { renderMoneyPage, moneyPageBounds } from '../src/daily/money-page-view.js';
import { renderChoreSheet } from '../src/daily/chores-sheet-view.js';
import { renderChoresParent } from '../src/daily/chores-parent.js';
import { renderCalendar } from '../src/daily/calendar.js';

const TODAY = '2026-11-18';
const NOW = `${TODAY}T12:00:00.000Z`;
const NOV = '2026-11';
const OCT = '2026-10';
const week = (totalCents, giveCents = null, saveCents = null, spendCents = null) => ({ totalCents, giveCents, saveCents, spendCents });
const month = (overrides = {}) => ({ goalFor: '', goalCostCents: null, goalSavedCents: null,
  savingsFromLastCents: null, spendingFromLastCents: null, savingsNowCents: null, spendingNowCents: null,
  savingForMonth: '', earningGoalCents: null, totalEarnedCents: null, totalGivenCents: null,
  totalSavedCents: null, totalSpentCents: null, ...overrides });
const savedMonth = (overrides = {}) => ({ ...month(overrides), savedAt: NOW });
const doc = (html) => new JSDOM(html).window.document;

assert.deepEqual(c.monthMondays(NOV), ['2026-11-02', '2026-11-09', '2026-11-16', '2026-11-23', '2026-11-30']);
assert.deepEqual(c.monthMondays(OCT), ['2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26']);
assert.deepEqual(c.monthMondays('2026-06'), ['2026-06-01', '2026-06-08', '2026-06-15', '2026-06-22', '2026-06-29']);
assert.deepEqual(c.monthMondays('2026-13'), []);
assert.deepEqual(c.monthMondays('bad'), []);
const empty = c.emptyChores();
assert.deepEqual(empty.months, {});
assert.equal(c.monthLocked(empty, NOV), false);
assert.equal(c.monthLocked({ ...empty, paid: { '2026-11-30': { cents: 1 } } }, NOV), true);
assert.equal(c.monthLocked({ ...empty, paid: { '2026-12-07': { cents: 1 } } }, NOV), true, 'later payment locks a month with an empty last week');
assert.equal(c.monthLocked({ ...empty, paid: { '2026-11-23': { cents: 1 } } }, NOV), false);
assert.equal(c.monthPageEditable(empty, '2026-12', TODAY), false);
assert.equal(c.monthPageEditable(empty, NOV, TODAY), true);
assert.equal(c.monthPageEditable(empty, OCT, TODAY), true);
assert.equal(c.monthPageEditable({ ...empty, paid: { '2026-11-30': { cents: 1 } } }, NOV, TODAY), false);
const saved = c.saveMonthPage(empty, NOV, month({ goalFor: 'Bike', goalCostCents: 2500, totalEarnedCents: 425 }), { todayIso: TODAY, nowIso: NOW });
assert.equal(saved.error, undefined);
assert.deepEqual(saved.chores.months[NOV], savedMonth({ goalFor: 'Bike', goalCostCents: 2500, totalEarnedCents: 425 }));
assert.ok(c.saveMonthPage(empty, NOV, month({ goalCostCents: -1 }), { todayIso: TODAY, nowIso: NOW }).error);
assert.ok(c.saveMonthPage(empty, NOV, month({ goalFor: 'a'.repeat(81) }), { todayIso: TODAY, nowIso: NOW }).error);
assert.ok(c.saveMonthPage(empty, NOV, month(), { todayIso: TODAY, nowIso: NOW }).error);
assert.ok(c.saveMonthPage({ ...empty, paid: { '2026-11-30': { cents: 1 } } }, NOV, month({ goalFor: 'Bike' }), { todayIso: TODAY, nowIso: NOW }).error);
assert.ok(c.saveMonthPage(empty, '2026-12', month({ goalFor: 'Bike' }), { todayIso: TODAY, nowIso: NOW }).error);
const normalized = c.normalizeChores({ months: {
  [NOV]: savedMonth({ goalFor: '\u0000  Bike  ', savingForMonth: 'x'.repeat(81), goalSavedCents: 100 }),
  '2026-13': savedMonth({ goalFor: 'bad key' }),
  [OCT]: { ...savedMonth({ goalFor: 'bad stamp' }), savedAt: 'bad' },
  '2026-09': savedMonth({ goalCostCents: 100001 }),
  '2026-08': savedMonth(),
} });
assert.deepEqual(Object.keys(normalized.months), [NOV]);
assert.equal(normalized.months[NOV].goalFor, 'Bike');
assert.equal(normalized.months[NOV].savingForMonth, '', 'long stored words become blank');
assert.equal(c.normalizeChores({}).months[NOV], undefined, 'old stores still load');
const backup = c.exportChores({ track: 'guided', chores: saved.chores }, NOW);
assert.equal(backup.version, 1);
assert.deepEqual(c.importChores(empty, backup, 'replace', 'guided').chores.months, saved.chores.months);
assert.deepEqual(c.importChores(empty, backup, 'merge', 'guided').chores.months, saved.chores.months);
const existing = { ...empty, months: { [NOV]: savedMonth({ goalFor: 'Existing' }) } };
assert.equal(c.importChores(existing, backup, 'merge', 'guided').chores.months[NOV].goalFor, 'Existing');
assert.equal(c.importChores(existing, backup, 'replace', 'guided').chores.months[NOV].goalFor, 'Bike');
assert.ok(c.importChores(empty, { ...backup, chores: { ...backup.chores, months: [] } }, 'merge', 'guided').error);
const overLimit = Object.fromEntries(Array.from({ length: 601 }, (_, i) => [`${2000 + Math.floor(i / 12)}-${String(i % 12 + 1).padStart(2, '0')}`, savedMonth({ goalFor: 'x' })]));
assert.equal(Object.keys(c.normalizeChores({ months: overLimit }).months).length, 600);
assert.ok(c.importChores(empty, { ...backup, chores: { ...backup.chores, months: overLimit } }, 'merge', 'guided').error);
const paid = { ...empty, paid: { '2026-11-02': { cents: 175 }, '2026-11-09': { cents: 125 }, '2026-10-26': { cents: 100 } },
  savingsUsed: { a: { id: 'a', date: TODAY, cents: 20, why: 'Gift', status: 'approved', addedAt: NOW, checkedAt: NOW },
    b: { id: 'b', date: TODAY, cents: 50, why: 'Toy', status: 'waiting', addedAt: NOW, checkedAt: null },
    c: { id: 'c', date: '2026-10-30', cents: 30, why: 'Book', status: 'approved', addedAt: NOW, checkedAt: NOW } },
  months: { [NOV]: savedMonth({ savingsFromLastCents: 100 }) } };
assert.deepEqual(c.monthRightAmounts(paid, NOV), { paidWeeks: 2, earned: 300, given: 31, saved: 60, spent: 209, approvedUsed: 20, savingsNow: 140 });
assert.equal(c.monthRightAmounts({ ...paid, months: {} }, NOV).savingsNow, null);
assert.equal(c.monthRightAmounts(paid, OCT).approvedUsed, 30);
const withMath = { ...empty, math: { '2026-11-16': { ...week(425, 43, null, null), savedAt: NOW } },
  months: { [NOV]: savedMonth({ goalFor: '<img src=x onerror=alert(1)>', goalCostCents: 900, savingsFromLastCents: 100,
    savingsNowCents: 140, totalEarnedCents: 300, totalGivenCents: 31, totalSavedCents: 60, totalSpentCents: 209 }) } };
for (const track of ['guided', 'standard']) {
  const home = renderCalendar({ track, chores: withMath }, TODAY, 2026, 10);
  assert.ok(home.indexOf('data-action="open-chores"') < home.indexOf('data-action="open-money"'));
  assert.ok(home.indexOf('data-action="open-money"') < home.indexOf('cqd-month-grid'));
  assert.match(home, /My money page for the month/);
  assert.ok(home.includes('data-action="open-chores"'));
  if (track === 'guided') assert.ok(home.includes('data-action="open-payday"'));
  const page = doc(renderMoneyPage({ track, chores: withMath }, TODAY, NOV));
  const html = page.body.innerHTML;
  const ordered = ['Give · Save · Spend Tracker', 'My Savings Goal', '1. Give · Da', 'Week 1',
    'November Money Review · Revisión Mensual', 'Saving for this month:', 'TOTAL EARNED', 'Savings I used'];
  let previous = -1;
  for (const part of ordered) { const at = html.indexOf(part); assert.ok(at > previous, `${part} in paper order`); previous = at; }
  assert.equal(page.querySelectorAll('.cqd-money-week').length, 5);
  assert.equal(page.querySelector('[data-money-week="2026-11-16"] [data-money-week-field="totalCents"]').value, '4.25');
  assert.equal(page.querySelector('[data-money-week="2026-11-16"] [data-money-week-field="giveCents"]').value, '0.43');
  assert.match(page.querySelector('[data-money-week="2026-11-23"]').textContent, /Not yet\./);
  assert.equal(page.querySelector('[data-money-week="2026-11-23"] input'), null);
  assert.equal(page.querySelector('img'), null);
  assert.match(renderMoneyPage({ track, chores: withMath }, TODAY, NOV), /&#60;img/);
  assert.doesNotMatch(page.body.textContent, /Right amount|\$3\.00|Jesse|Dad|Grade|easy|hard|guided|standard/);
  assert.ok([...page.querySelectorAll('input[data-money-month], input[data-money-week-field]')].every((input) => input.closest('label')));
  assert.equal(page.querySelector('input[data-money-month="goalFor"]').maxLength, 80);
  assert.equal(page.querySelector('input[data-money-month="goalCostCents"]').inputMode, 'decimal');
  assert.equal(page.querySelector('[data-action="money-savings-add"]') !== null, true);
  const sheet = doc(renderChoreSheet({ track, chores: withMath }, TODAY, '2026-11-16'));
  assert.equal(sheet.querySelector('[data-chore-math], [data-chore-savings-cents], [data-chore-savings-why]'), null);
  assert.match(sheet.body.textContent, /Week summary/);
}
assert.deepEqual(moneyPageBounds({ chores: { ...empty, entries: { old: { date: '2026-10-30' } } } }, TODAY), { earliest: OCT, latest: NOV });
assert.equal(moneyPageBounds({ chores: empty }, TODAY).earliest, NOV);
assert.equal(moneyPageBounds({ chores: { ...empty, entries: { sunday: { date: '2026-11-01' } } } }, TODAY).earliest, OCT, 'Sunday job belongs to its October Monday');
const oldPage = doc(renderMoneyPage({ track: 'guided', chores: { ...withMath, savingsUsed: { old: { date: '2026-10-30', cents: 75, why: 'Snack', status: 'approved', addedAt: NOW, id: 'old' } } } }, TODAY, OCT));
assert.equal(oldPage.querySelector('[data-action="money-savings-add"]'), null);
assert.match(oldPage.querySelector('.cqd-money-savings').textContent, /Snack/);
const locked = { ...withMath, paid: { '2026-11-30': { cents: 100, paidAt: NOW } } };
const lockedPage = doc(renderMoneyPage({ track: 'guided', chores: locked }, TODAY, NOV));
assert.equal(lockedPage.querySelector('input[data-money-month]'), null);
assert.match(lockedPage.body.textContent, /locked after payday/i);
const parentStore = { track: 'guided', chores: { ...paid, months: { [NOV]: savedMonth({ goalFor: 'Bike', goalCostCents: 900,
  savingsFromLastCents: 100, savingsNowCents: 140, totalEarnedCents: 300, totalGivenCents: 31,
  totalSavedCents: 60, totalSpentCents: 209 }) } } };
const parent = doc(renderChoresParent(parentStore, { weekMonday: '2026-11-09', day: '2026-11-09', choresView: 'check' }, TODAY));
const card = parent.querySelector('.cqd-chore-parent-money-page');
assert.match(card.textContent, /His money page · November 2026/);
assert.ok(parent.body.innerHTML.indexOf('His money page · November 2026') > parent.body.innerHTML.indexOf('Pay the week'));
assert.ok(parent.body.innerHTML.indexOf('His money page · November 2026') < parent.body.innerHTML.indexOf('Paid so far'));
assert.match(card.textContent, /\$3\.00 ✓/);
assert.match(card.textContent, /\$0\.31 ✓/);
assert.match(card.textContent, /\$1\.40 ✓/);
assert.match(card.textContent, /2 paid weeks in November/);
assert.match(card.textContent, /Bike/);
const parentNeeds = doc(renderChoresParent({ ...parentStore, chores: { ...paid, months: { [NOV]: savedMonth({ savingsNowCents: 140 }) } } },
  { weekMonday: '2026-11-09', day: '2026-11-09', choresView: 'check' }, TODAY));
assert.match(parentNeeds.querySelector('.cqd-chore-parent-money-page').textContent, /Needs his Savings from last month/);
assert.equal(parentNeeds.querySelector('.cqd-chore-parent-money-page tr:last-child td:last-child').textContent, '—');

// One paid week reads "1 paid week"; a month with no paid week shows no right amounts and no ✓ for the totals.
const oneWeek = doc(renderChoresParent({ track: 'guided', chores: { ...paid, months: { '2026-10': savedMonth({ totalEarnedCents: 100 }) } } },
  { weekMonday: '2026-10-26', day: '2026-10-26', choresView: 'check' }, TODAY)).querySelector('.cqd-chore-parent-money-page');
assert.match(oneWeek.textContent, /1 paid week in October\./);
assert.match(oneWeek.textContent, /\$1\.00 ✓/);
const noPaid = doc(renderChoresParent({ track: 'guided', chores: { ...empty, months: { [NOV]: savedMonth({ totalEarnedCents: 0, savingsFromLastCents: 500, savingsNowCents: 500 }) } } },
  { weekMonday: '2026-11-09', day: '2026-11-09', choresView: 'check' }, TODAY)).querySelector('.cqd-chore-parent-money-page');
assert.match(noPaid.textContent, /No paid weeks in November yet/);
assert.equal(noPaid.querySelector('tbody tr:first-child td:last-child').textContent, '—');
assert.ok(!/\$0\.00 ✓/.test(noPaid.textContent), 'no ✓ against an empty month');
assert.match(noPaid.querySelector('tbody tr:last-child').textContent, /\$5\.00 ✓/);

// Integration: one bad amount prevents every part of a page save, even a valid weekly row.
const RealDate = Date;
globalThis.Date = class extends RealDate {
  constructor(...args) { super(...(args.length ? args : [`${TODAY}T12:00:00Z`])); }
  static now() { return RealDate.parse(`${TODAY}T12:00:00Z`); }
};
const browser = new JSDOM('<!doctype html><main id="app"></main>', { url: 'https://local.test/daily.html', pretendToBeVisual: true });
globalThis.window = browser.window;
globalThis.document = browser.window.document;
globalThis.localStorage = browser.window.localStorage;
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: browser.window.navigator });
globalThis.requestAnimationFrame = (fn) => fn();
globalThis.getComputedStyle = browser.window.getComputedStyle.bind(browser.window);
globalThis.matchMedia = () => ({ matches: true, addEventListener() {} });
globalThis.CSS = { escape: (value) => value };
browser.window.HTMLCanvasElement.prototype.getContext = () => ({ clearRect() {}, drawImage() {} });
browser.window.scrollBy = () => {};
const base = storage.withTrack(storage.emptyStore(), 'guided');
storage.saveCore(base);
await import('../src/daily/app.js?monthly-page-test');
const click = (selector) => { const el = document.querySelector(selector); assert.ok(el, selector); el.click(); };
const field = (selector, value) => { const el = document.querySelector(selector); assert.ok(el, selector); el.value = value; };
click('[data-action="open-money"]');
const blankBefore = localStorage.getItem('codequest-daily-v1');
click('[data-action="money-save"]');
assert.match(document.querySelector('[data-money-status]').textContent, /Nothing to save yet\./);
assert.equal(localStorage.getItem('codequest-daily-v1'), blankBefore);
field('[data-money-month="goalCostCents"]', 'bad');
field('[data-money-week="2026-11-16"] [data-money-week-field="totalCents"]', '4.25');
const before = localStorage.getItem('codequest-daily-v1');
click('[data-action="money-save"]');
assert.equal(localStorage.getItem('codequest-daily-v1'), before);
assert.equal(storage.choresOf(storage.load()).math['2026-11-16'], undefined);
assert.match(document.querySelector('[data-money-status]').textContent, /Type each amount like 4.25/);
field('[data-money-month="goalCostCents"]', '9');
field('[data-money-week="2026-11-16"] [data-money-week-field="totalCents"]', '-1');
click('[data-action="money-save"]');
assert.equal(localStorage.getItem('codequest-daily-v1'), before, 'bad weekly amount also prevents month save');
field('[data-money-week="2026-11-16"] [data-money-week-field="totalCents"]', '$4.25');
click('[data-action="money-save"]');
assert.equal(storage.choresOf(storage.load()).math['2026-11-16'].totalCents, 425);
assert.equal(storage.choresOf(storage.load()).months[NOV].goalCostCents, 900);
assert.match(document.querySelector('[data-money-status]').textContent, /Saved/);
globalThis.Date = RealDate;
console.log('daily money page tests passed');
