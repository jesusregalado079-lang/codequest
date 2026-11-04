import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import * as storage from '../src/daily/store.js';
import { addEntry, emptyChores, payWeek, setEntryPrice, setEntryStatus } from '../src/daily/chores.js';
import { choreSheetBounds, renderChoreSheet } from '../src/daily/chores-sheet-view.js';

const TODAY = '2026-11-18';
const NOW = `${TODAY}T12:00:00.000Z`;
const RealDate = Date;
globalThis.Date = class extends RealDate {
  constructor(...args) { super(...(args.length ? args : [`${TODAY}T12:00:00Z`])); }
  static now() { return RealDate.parse(`${TODAY}T12:00:00Z`); }
};
const dom = new JSDOM('<!doctype html><main id="app"></main>', { url: 'https://local.test/daily.html', pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.localStorage = dom.window.localStorage;
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: dom.window.navigator });
globalThis.requestAnimationFrame = (fn) => fn();
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globalThis.matchMedia = () => ({ matches: true, addEventListener() {} });
globalThis.CSS = { escape: (value) => value };
dom.window.HTMLCanvasElement.prototype.getContext = () => ({ clearRect() {}, drawImage() {} });
dom.window.scrollBy = () => {};

let boot = 0;
async function launch(track, chores) {
  document.body.innerHTML = '<main id="app"></main>';
  const base = storage.withTrack(storage.emptyStore(), track);
  storage.saveCore(chores === undefined ? base : { ...base, chores });
  await import(`../src/daily/app.js?chore-sheet-test=${++boot}`);
}
function click(selector) {
  const button = document.querySelector(selector);
  assert.ok(button, `button exists: ${selector}`);
  button.click();
}
function add(chores, { id, date, jobId, by = 'kid', otherName, status = 'waiting', cents }) {
  const added = addEntry(chores, { track: 'guided', date, todayIso: date, jobId, by, otherName, nowIso: NOW, id });
  assert.equal(added.error, undefined);
  let next = added.chores;
  if (cents !== undefined) {
    const priced = setEntryPrice(next, id, cents);
    assert.equal(priced.error, undefined);
    next = priced.chores;
  }
  if (status !== 'waiting') {
    const checked = setEntryStatus(next, id, status, NOW);
    assert.equal(checked.error, undefined);
    next = checked.chores;
  }
  return next;
}
function forgedWeek(monday) {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.action = 'chore-sheet-week';
  button.dataset.monday = monday;
  document.querySelector('#app').append(button);
  button.click();
  button.remove();
}
function sheet() {
  const root = document.querySelector('.cqd-chore-sheet-screen');
  assert.ok(root, 'sheet is open');
  return root;
}
function assertReadOnly(root) {
  assert.deepEqual([...root.querySelectorAll('[data-action]')].map((item) => item.dataset.action).sort(),
    ['chore-sheet-week', 'chore-sheet-week', 'open-chores']);
  assert.equal(root.querySelectorAll('input, textarea, select').length, 0);
  assert.doesNotMatch(root.textContent, /Give 10%|Save 20%|Spend 70%|Dad|easy|hard|guided|standard|answer/i);
}

let chores = emptyChores();
chores = add(chores, { id: 'old', date: '2026-10-27', jobId: 'trash', by: 'parent', status: 'confirmed' });
chores = add(chores, { id: 'table1', date: '2026-11-02', jobId: 'table', status: 'confirmed' });
chores = add(chores, { id: 'table2', date: '2026-11-02', jobId: 'table', status: 'confirmed' });
chores = add(chores, { id: 'table-parent', date: '2026-11-02', jobId: 'table', by: 'parent', status: 'confirmed' });
chores = add(chores, { id: 'verse', date: '2026-11-03', jobId: 'verse', by: 'parent', status: 'confirmed' });
const paid = payWeek(chores, '2026-11-02', '2026-11-09T10:00:00.000Z');
assert.equal(paid.error, undefined);
chores = paid.chores;
chores = add(chores, { id: 'waiting', date: '2026-11-09', jobId: 'trash' });
chores = add(chores, { id: 'other', date: '2026-11-09', jobId: 'other', otherName: 'Something else' });
chores = add(chores, { id: 'declined', date: '2026-11-10', jobId: 'vacuum', by: 'parent', status: 'declined' });
chores = add(chores, { id: 'hostile', date: '2026-11-11', jobId: 'other', otherName: `<img onerror="alert('x')">`, cents: 125, status: 'confirmed' });
chores = add(chores, { id: 'current', date: TODAY, jobId: 'table', status: 'confirmed' });
assert.deepEqual(choreSheetBounds({ chores }, TODAY), { earliest: '2026-10-26', latest: '2026-11-16' });
assert.equal(choreSheetBounds({ chores: { ...chores, paid: { ...chores.paid, '2026-10-19': { paidAt: NOW, cents: 0 } } } }, TODAY).earliest, '2026-10-19', 'paid keys count toward earliest bound');

for (const track of ['guided', 'standard']) {
  await launch(track, chores);
  click('[data-action="open-chores"]');
  const opener = document.querySelector('[data-action="open-chore-sheet"]');
  assert.ok(opener, `${track}: sheet entry point`);
  assert.equal(opener.textContent.trim(), '📄 My chore sheet');
  assert.ok(document.querySelector('.cqd-chore-days').compareDocumentPosition(opener) & dom.window.Node.DOCUMENT_POSITION_FOLLOWING);
  const before = localStorage.getItem('codequest-daily-v1');
  click('[data-action="open-chore-sheet"]');
  assert.match(sheet().querySelector('h1').textContent, /Week of Nov 16/);
  assert.equal(sheet().querySelectorAll('.cqd-chore-sheet-days > li').length, 7);
  assert.match(sheet().textContent, /This week is still going\./);
  assert.match(sheet().textContent, /Not yet\./);
  assert.ok(sheet().querySelector('[data-action="chore-sheet-week"]:last-child').disabled, 'later week disabled now');
  assertReadOnly(sheet());
  assert.equal(localStorage.getItem('codequest-daily-v1'), before, 'opening sheet leaves store byte-identical');

  forgedWeek('2026-11-23');
  forgedWeek('2026-11-17');
  forgedWeek('2026-10-12');
  assert.match(sheet().querySelector('h1').textContent, /Nov 16/, 'forged weeks ignored');

  click('[data-action="chore-sheet-week"]:first-child');
  assert.match(sheet().querySelector('h1').textContent, /Week of Nov 9/);
  assert.match(sheet().textContent, /Not paid yet\./);
  assert.equal(sheet().querySelector('.cqd-chore-sheet-paid'), null, 'unpaid week has no paid stamp');
  assert.match(sheet().textContent, /⏳ Waiting for a grown-up/);
  assert.match(sheet().textContent, /⏳ Waiting, a grown-up picks the price/);
  assert.match(sheet().textContent, /↩ Ask a grown-up/);
  assert.equal(sheet().querySelectorAll('.cqd-chore-sheet-name small').length > 0, true);
  assert.equal([...sheet().querySelectorAll('.cqd-chore-sheet-job')].filter((row) => row.textContent.includes('A grown-up wrote this in.')).length, 1);
  assert.match(sheet().textContent, /Confirmed: \$1\.25/);
  assert.match(sheet().querySelector('.cqd-chore-sheet-summary').textContent, /Confirmed\s*\$1\.25/);
  assert.match(sheet().querySelector('.cqd-chore-sheet-summary').textContent, /Waiting for a grown-up\s*\$0\.75/);
  assert.match(sheet().querySelector('.cqd-chore-sheet-summary').textContent, /Ask a grown-up\s*1 job/);
  assert.equal(sheet().querySelector('img'), null, 'hostile job name stays text');
  assert.match(sheet().innerHTML, /&lt;img onerror=/);
  assertReadOnly(sheet());

  click('[data-action="chore-sheet-week"]:first-child');
  assert.match(sheet().querySelector('h1').textContent, /Week of Nov 2/);
  assert.match(sheet().textContent, /Mon, Nov 2 to Sun, Nov 8/);
  assert.match(sheet().textContent, /Set & clear the table x2/);
  assert.equal([...sheet().querySelectorAll('.cqd-chore-sheet-job')].filter((row) => row.textContent.includes('Set & clear the table')).length, 2, 'same job splits kid and grown-up groups');
  const tableRows = [...sheet().querySelectorAll('.cqd-chore-sheet-job')].filter((row) => row.textContent.includes('Set & clear the table'));
  assert.equal(tableRows.filter((row) => row.textContent.includes('A grown-up wrote this in.')).length, 1, 'only the grown-up group carries the note');
  assert.match(sheet().textContent, /Poner y recoger la mesa/);
  assert.match(sheet().textContent, /\$1\.00/);
  assert.match(sheet().textContent, /✓ Confirmed/);
  assert.match(sheet().textContent, /A grown-up wrote this in\./);
  assert.match(sheet().textContent, /Confirmed: \$1\.50/);
  assert.equal(sheet().querySelector('.cqd-chore-sheet-paid').textContent, `PAID · ${new Date('2026-11-09T10:00:00.000Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · $3.00`);
  assert.match(sheet().querySelector('.cqd-chore-sheet-summary').textContent, /Confirmed\s*\$3\.00/);
  assert.match(sheet().querySelector('.cqd-chore-sheet-summary').textContent, /Waiting for a grown-up\s*\$0\.00/);

  click('[data-action="chore-sheet-week"]:first-child');
  assert.match(sheet().querySelector('h1').textContent, /Week of Oct 26/);
  assert.ok(sheet().querySelector('[data-action="chore-sheet-week"]:first-child').disabled, 'earliest week stops paging');
  forgedWeek('2026-10-19');
  assert.match(sheet().querySelector('h1').textContent, /Oct 26/);
  click('[data-action="chore-sheet-week"]:last-child');
  assert.match(sheet().querySelector('h1').textContent, /Nov 2/, 'later paging works');
  assert.equal(localStorage.getItem('codequest-daily-v1'), before, 'paging leaves store byte-identical');
  click('[data-action="open-chores"]');
  assert.ok(document.querySelector('.cqd-chore-screen'), 'back link returns to My Chores');
}

await launch('guided');
click('[data-action="open-chores"]');
const emptyBefore = localStorage.getItem('codequest-daily-v1');
click('[data-action="open-chore-sheet"]');
assert.equal(sheet().querySelectorAll('.cqd-chore-sheet-days > li').length, 7, 'legacy store without chores renders');
assert.equal(sheet().querySelectorAll('.cqd-chore-sheet-empty').length, 7);
assert.ok(sheet().querySelectorAll('[data-action="chore-sheet-week"]:disabled').length === 2);
assert.equal(localStorage.getItem('codequest-daily-v1'), emptyBefore);
assertReadOnly(sheet());

// A pure render must not mutate its input either.
const directStore = { track: 'guided', chores };
const directBefore = JSON.stringify(directStore);
renderChoreSheet(directStore, TODAY, '2026-11-02');
assert.equal(JSON.stringify(directStore), directBefore);
console.log('daily chore sheet tests passed');

// The PAID stamp uses the same local-time day as the grown-up "Paid on" line: a week paid late on Sunday
// evening in California is already Monday in UTC, and both pages must still show Sunday.
{
  const lateSunday = '2026-11-09T04:30:00.000Z';
  const local = new Date(lateSunday).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const html = renderChoreSheet({ track: 'guided', chores: { ...emptyChores(), paid: { '2026-11-02': { paidAt: lateSunday, cents: 250 } } } }, TODAY, '2026-11-02');
  const stamp = new JSDOM(html).window.document.querySelector('.cqd-chore-sheet-paid').textContent;
  assert.equal(stamp, `PAID · ${local} · $2.50`, 'paid stamp uses the local day, like the grown-up page');
}
console.log('daily chore sheet paid-day test passed');

// A job a grown-up wrote in on a later day this week shows in its box, so the week total never counts a hidden job.
{
  const later = addEntry(emptyChores(), { track: 'guided', date: '2026-11-20', todayIso: TODAY, jobId: 'table', by: 'parent', nowIso: NOW, id: 'later1' }).chores;
  const doc = new JSDOM(renderChoreSheet({ track: 'guided', chores: setEntryStatus(later, 'later1', 'confirmed', NOW).chores }, TODAY, '2026-11-16')).window.document;
  const friday = [...doc.querySelectorAll('.cqd-chore-sheet-day')][4];
  assert.match(friday.textContent, /Set & clear the table/, 'a later-day job written in by a grown-up is shown');
  assert.doesNotMatch(friday.textContent, /Not yet\./, 'a later day with a job does not say Not yet');
  assert.match(doc.querySelectorAll('.cqd-chore-sheet-day')[5].textContent, /Not yet\./, 'an empty later day still says Not yet');
}
// A finished week with nothing in it says so, instead of "Not paid yet."
{
  const old = addEntry(emptyChores(), { track: 'guided', date: '2026-11-02', todayIso: '2026-11-02', jobId: 'table', by: 'kid', nowIso: NOW, id: 'old1' }).chores;
  const empty = new JSDOM(renderChoreSheet({ track: 'guided', chores: old }, TODAY, '2026-11-09')).window.document.querySelector('.cqd-chore-sheet-summary').textContent;
  assert.match(empty, /No chores this week\./);
  assert.doesNotMatch(empty, /Not paid yet/);
  const unpaid = new JSDOM(renderChoreSheet({ track: 'guided', chores: old }, TODAY, '2026-11-02')).window.document.querySelector('.cqd-chore-sheet-summary').textContent;
  assert.match(unpaid, /Not paid yet\./);
}
// Bounds and the render clamp on their own: future-only data never opens a future week, and a forged week shows this week.
{
  const future = addEntry(emptyChores(), { track: 'guided', date: '2026-11-20', todayIso: TODAY, jobId: 'table', by: 'parent', nowIso: NOW, id: 'f1' }).chores;
  const futureStore = { track: 'guided', chores: future };
  assert.deepEqual(choreSheetBounds(futureStore, '2026-11-09'), { earliest: '2026-11-09', latest: '2026-11-09' });
  for (const forged of ['2026-11-23', '2026-11-17', 'junk', undefined]) {
    assert.match(new JSDOM(renderChoreSheet(futureStore, TODAY, forged)).window.document.querySelector('h1').textContent, /Week of Nov 16/, `render clamps ${forged}`);
  }
}
console.log('daily chore sheet review-fix tests passed');
