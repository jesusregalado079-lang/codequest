import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import * as store from '../src/daily/store.js';
import { addEntry, setEntryStatus, weekMonday } from '../src/daily/chores.js';
import { renderCalendar } from '../src/daily/calendar.js';
import { renderChores } from '../src/daily/chores-view.js';

const TODAY = '2026-11-04';
const YESTERDAY = '2026-11-03';
const RealDate = Date;
globalThis.Date = class extends RealDate {
  constructor(...args) { super(...(args.length ? args : [`${TODAY}T12:00:00`])); }
  static now() { return new RealDate(`${TODAY}T12:00:00`).getTime(); }
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
async function launch(track) {
  document.body.innerHTML = '<main id="app"></main>';
  store.saveCore(store.withTrack(store.emptyStore(), track));
  await import(`../src/daily/app.js?kid-chores-test=${++boot}`);
}
async function reload() {
  document.body.innerHTML = '<main id="app"></main>';
  await import(`../src/daily/app.js?kid-chores-test=${++boot}`);
}
function click(selector) {
  const button = document.querySelector(selector);
  assert.ok(button, `button exists: ${selector}`);
  button.click();
}
function put(chores, options) {
  const result = addEntry(chores, { track: 'guided', date: TODAY, todayIso: TODAY, jobId: 'table', by: 'kid',
    nowIso: `${TODAY}T12:00:00.000Z`, ...options });
  assert.equal(result.error, undefined);
  return result.chores;
}

for (const track of ['guided', 'standard']) {
  await launch(track);
  const home = document.querySelector('[data-action="open-chores"]');
  assert.ok(home, `${track}: My Chores button`);
  assert.match(home.textContent, /Tell us what you did so you get paid/);
  if (track === 'guided') assert.ok(home.compareDocumentPosition(document.querySelector('[data-action="open-payday"]')) & dom.window.Node.DOCUMENT_POSITION_FOLLOWING);
  click('[data-action="open-chores"]');
  assert.equal(document.querySelectorAll('[data-action="chore-add"]').length, 12);
  assert.equal(document.querySelectorAll('.cqd-chore-job[aria-label$="tap to add"]').length, 12);
  const verse = document.querySelector('[data-job="verse"]');
  const laundry = document.querySelector(track === 'guided' ? '[data-job="laundry-fold"]' : '[data-job="laundry-full"]');
  assert.ok(laundry);
  assert.match(verse.textContent, track === 'guided' ? /\$1\.50/ : /\$2\.50/);
  assert.match(laundry.textContent, track === 'guided' ? /\$1\.50/ : /\$2\.50/);
  assert.match(verse.textContent, /Recitar el versículo de memoria/);
  assert.match(laundry.textContent, track === 'guided' ? /Doblar y guardar la ropa/ : /Lavar, secar y doblar la ropa/);
  assert.equal(document.querySelector(track === 'guided' ? '[data-job="laundry-full"]' : '[data-job="laundry-fold"]'), null);
  assert.equal(document.querySelectorAll('[data-action="chore-day"][aria-pressed="true"]').length, 1);
  assert.equal(document.querySelector('.cqd-chore-totals'), null);
  assert.doesNotMatch(document.querySelector('.cqd-chore-screen').innerHTML, /data-action="(?:confirm|price|pay)[^"]*"/);
  click('[data-job="table"]');
  click('[data-job="table"]');
  assert.equal(Object.keys(store.load().chores.entries).length, 2, 'each tap saves an entry');
  assert.match(document.querySelector('[data-job="table"]').textContent, /x2/);
  assert.match(document.querySelector('.cqd-chore-row').textContent, /Set & clear the table x2/);
  click('[data-action="back-to-calendar"]');
  assert.match(document.querySelector('[data-action="open-chores"] .cqd-chore-badge').textContent, /2 waiting/);
  await reload();
  assert.match(document.querySelector('[data-action="open-chores"] .cqd-chore-badge').textContent, /2 waiting/, 'badge survives reload');
  click('[data-action="open-chores"]');
  assert.match(document.querySelector('[data-job="table"]').textContent, /x2/, 'reload from saved store');
  click('[data-action="chore-remove"]');
  assert.equal(Object.keys(store.load().chores.entries).length, 1, 'x removes one waiting entry');
  assert.match(document.querySelector('.cqd-chore-row').textContent, /Set & clear the table/);
  const hostile = `<img onerror="alert('x')">`;
  document.querySelector('[data-chore-other]').value = hostile;
  click('[data-action="chore-add-other"]');
  const other = Object.values(store.load().chores.entries).find((entry) => entry.jobId === 'other');
  assert.ok(other);
  assert.equal(other.cents, null);
  assert.equal(other.name, hostile);
  assert.equal(document.querySelector('.cqd-chore-screen img'), null, 'hostile name is text, not markup');
  assert.match(document.querySelector('.cqd-chore-screen').innerHTML, /&lt;img onerror=/);
  assert.match(document.querySelector('.cqd-chore-rows').textContent, /Waiting, a grown-up picks the price/);
  click(`[data-action="chore-day"][data-date="${YESTERDAY}"]`);
  assert.match(document.querySelector('.cqd-chore-banner').textContent, /You can only add jobs for today/);
  assert.equal(document.querySelector('[data-action="chore-add"]'), null);
  assert.equal(document.querySelector('[data-action="chore-add-other"]'), null);
  assert.equal(document.querySelector('[data-action="chore-remove"]'), null);
  const forged = document.createElement('button');
  forged.dataset.action = 'chore-add'; forged.dataset.job = 'trash'; forged.dataset.date = YESTERDAY;
  document.querySelector('#app').append(forged); forged.click();
  assert.equal(Object.keys(store.load().chores.entries).length, 2, 'forged past-day action cannot add');
  // a forged click for a day that has not come yet is ignored
  const future = document.createElement('button');
  future.dataset.action = 'chore-day'; future.dataset.date = '2026-11-06';
  document.querySelector('#app').append(future); future.click();
  assert.match(document.querySelector('.cqd-chore-banner').textContent, /You can only add jobs for today/, 'still looking back, not moved to a future day');
  // back on today, a bad job shows one plain sentence, never a logic error
  click(`[data-action="chore-day"][data-date="${TODAY}"]`);
  const bad = document.createElement('button');
  bad.dataset.action = 'chore-add'; bad.dataset.job = 'not-a-job'; bad.dataset.date = TODAY;
  document.querySelector('#app').append(bad); bad.click();
  assert.match(document.querySelector('.cqd-chore-screen').textContent, /That did not work\. Ask a grown-up\./);
  assert.doesNotMatch(document.querySelector('.cqd-chore-screen').textContent, /Unknown|inactive|Invalid|Entry ID|Week is paid/);
  assert.equal(Object.keys(store.load().chores.entries).length, 2, 'bad job adds nothing');
  // a job card reads its price and how often it was added, aloud
  const vac = document.querySelector('[data-job="vacuum"]').getAttribute('aria-label');
  assert.match(vac, /Vacuum or sweep, 1 dollar, tap to add/);
  assert.match(document.querySelector('[data-job="table"]').getAttribute('aria-label'), /50 cents, added once today, tap to add again/);
}

let prepared = store.withTrack(store.emptyStore(), 'guided');
let chores = store.choresOf(prepared);
chores = put(chores, { id: 'confirmed', jobId: 'trash' });
chores = setEntryStatus(chores, 'confirmed', 'confirmed', `${TODAY}T13:00:00.000Z`).chores;
chores = put(chores, { id: 'declined', jobId: 'vacuum' });
chores = setEntryStatus(chores, 'declined', 'declined', `${TODAY}T13:00:00.000Z`).chores;
chores = put(chores, { id: 'waiting', jobId: 'table' });
chores = put(chores, { id: 'prior-month', date: '2026-10-31', jobId: 'dinner', by: 'parent' });
chores = setEntryStatus(chores, 'prior-month', 'confirmed', `${TODAY}T13:00:00.000Z`).chores;
chores = put(chores, { id: 'prior-day', date: YESTERDAY, jobId: 'dinner', by: 'parent' });
chores = setEntryStatus(chores, 'prior-day', 'confirmed', `${TODAY}T13:00:00.000Z`).chores;
prepared = store.withChores(prepared, () => ({ chores }));
const preparedHtml = renderChores(prepared, TODAY);
const preparedDoc = new JSDOM(preparedHtml).window.document;
const totals = preparedDoc.querySelectorAll('.cqd-chore-totals strong');
assert.equal(totals.length, 0, 'kid sees no computed totals');
assert.equal(preparedDoc.querySelectorAll('[data-action="chore-remove"]').length, 1, 'only waiting row has x');
assert.equal(new JSDOM(renderChores(prepared, TODAY, YESTERDAY)).window.document.querySelector('[data-action="chore-remove"]'), null);
assert.match(renderCalendar(prepared, TODAY, 2026, 10), /1 waiting/);
assert.equal(weekMonday(TODAY), '2026-11-02');
store.saveCore(prepared);
assert.deepEqual(store.load().chores, chores, 'chore records survive save and load');

globalThis.Date = RealDate;
console.log('ok — daily chores kid: tracks, catalog, taps, badge, look-back, status, totals, escaping, persistence');
