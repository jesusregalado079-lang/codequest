import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import * as storage from '../src/daily/store.js';
import * as pin from '../src/daily/pin.js';
import { addEntry, payWeek, setEntryStatus } from '../src/daily/chores.js';
import { renderChores } from '../src/daily/chores-view.js';

const TODAY = '2026-11-04';
const MONDAY = '2026-11-02';
const TUESDAY = '2026-11-03';
const NOW = '2026-11-04T12:00:00.000Z';
const RealDate = Date;
let clockOffset = 0; // lets a test move the iPad clock without changing the day
globalThis.Date = class extends RealDate {
  constructor(...args) { super(...(args.length ? args : [`${TODAY}T12:00:00Z`])); }
  static now() { return RealDate.parse(`${TODAY}T12:00:00Z`) + clockOffset; }
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
function click(selector) {
  const element = document.querySelector(selector);
  assert.ok(element, `exists: ${selector}`);
  element.click();
}
function field(selector, value) {
  const element = document.querySelector(selector);
  assert.ok(element, `field: ${selector}`);
  element.value = value;
  element.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
}
function entry(chores, id, date, jobId, otherName) {
  const result = addEntry(chores, { track: 'guided', date, todayIso: TODAY, jobId, otherName, by: 'kid', nowIso: NOW, id });
  // Earlier days are entered by a grown-up.
  if (!result.error) return result.chores;
  const parent = addEntry(chores, { track: 'guided', date, todayIso: TODAY, jobId, otherName, by: 'parent', nowIso: NOW, id });
  assert.equal(parent.error, undefined);
  return parent.chores;
}
async function launch(track, chores) {
  document.body.innerHTML = '<main id="app"></main>';
  let saved = storage.withTrack(storage.emptyStore(), track);
  if (chores) saved = storage.withChores(saved, () => ({ chores }));
  saved = pin.lockParent(await pin.setParentPin(saved, '1234', Date.now() - 1000));
  storage.saveCore(saved);
  await import(`../src/daily/app.js?parent-chores-test=${++boot}`);
}
async function unlock() {
  click('[data-action="daily-parent-open"]');
  assert.ok(document.querySelector('.cqd-parent-gate'));
  assert.equal(document.querySelector('[data-action="chores-view-chores"]'), null, 'PIN gate hides chores');
  assert.equal(document.querySelector('[data-action="chores-export-backup"]'), null, 'PIN gate hides backup');
  field('[data-parent-pin="enter"]', '1234');
  click('[data-action="daily-parent-enter-pin"]');
  for (let attempt = 0; attempt < 20 && !document.querySelector('[data-action="chores-view-chores"]'); attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.ok(document.querySelector('[data-action="chores-view-chores"]'));
  assert.equal(document.querySelector('[data-action="chores-view-work"]').getAttribute('aria-pressed'), 'true', 'Check work remains default');
  click('[data-action="chores-view-chores"]');
}
function forged(action, extra = {}) {
  const button = document.createElement('button');
  button.dataset.action = action;
  Object.assign(button.dataset, extra);
  document.querySelector('#app').append(button);
  button.click();
  return button;
}

let chores = storage.choresOf(storage.emptyStore());
chores = entry(chores, 'mon-wait', MONDAY, 'vacuum');
chores = entry(chores, 'mon-other', MONDAY, 'other', `<img onerror="alert('x')">`);
chores = entry(chores, 'tue-wait', TUESDAY, 'table');
let previous = entry(chores, 'oct-paid', '2026-10-26', 'trash');
previous = setEntryStatus(previous, 'oct-paid', 'confirmed', NOW).chores;
previous = payWeek(previous, '2026-10-26', NOW).chores;
previous = entry(previous, 'oct-wait', '2026-10-19', 'trash');
await launch('guided', previous);
assert.equal(document.querySelector('[data-action="chores-entry-status"]'), null, 'boy home has no parent controls');
assert.equal(new JSDOM(renderChores(storage.load(), TODAY)).window.document.querySelector('[data-action^="chores-"]'), null, 'boy chore screen has no grown-up controls');
await unlock();
assert.match(document.querySelector('.cqd-chore-parent-badge').textContent, /4 to check/, 'waiting across unpaid weeks');
assert.equal(document.querySelector('[data-action="chores-day"][aria-pressed="true"]').dataset.date, TUESDAY, 'latest waiting day selected');
assert.ok(document.querySelector('[data-action="chores-open-payday"]') === null, 'no confirmed total in current week');
click('[data-action="chores-entry-status"][data-id="tue-wait"][data-status="confirmed"]');
assert.equal(storage.load().chores.entries['tue-wait'].status, 'confirmed');
assert.equal(document.querySelector('[data-id="tue-wait"][data-status="confirmed"]').getAttribute('aria-pressed'), 'true');
assert.equal(document.querySelector('[data-action="chores-open-payday"]'), null, 'no Payday link until the week is paid (a week must only go through the Helper once)');
click('[data-action="chores-entry-status"][data-id="tue-wait"][data-status="declined"]');
assert.equal(storage.load().chores.entries['tue-wait'].status, 'declined');
click('[data-action="chores-entry-status"][data-id="tue-wait"][data-status="confirmed"]');
assert.equal(storage.load().chores.entries['tue-wait'].status, 'confirmed', 'confirmed again');
click('[data-action="chores-day"][data-date="2026-11-02"]');
assert.equal(document.querySelector('[data-id="mon-other"][data-status="confirmed"]').disabled, true, 'unpriced confirmation blocked');
forged('chores-entry-status', { id: 'mon-other', status: 'confirmed' });
assert.equal(storage.load().chores.entries['mon-other'].status, 'waiting', 'pure rule blocks forged confirmation too');
assert.match(document.querySelector('.cqd-chore-parent-message').textContent, /Set a price first/);
click('[data-action="chores-confirm-day"]');
assert.equal(storage.load().chores.entries['mon-wait'].status, 'confirmed');
assert.equal(storage.load().chores.entries['mon-other'].status, 'waiting');
assert.match(document.querySelector('.cqd-chore-parent-message').textContent, /1 unpriced job skipped/);
field('[data-entry-price="mon-other"]', '2.25');
click('[data-action="chores-set-entry-price"][data-id="mon-other"]');
assert.equal(storage.load().chores.entries['mon-other'].cents, 225);
click('[data-action="chores-entry-status"][data-id="mon-other"][data-status="confirmed"]');
assert.equal(storage.load().chores.entries['mon-other'].status, 'confirmed');
assert.equal(document.querySelector('.cqd-chore-parent img'), null, 'hostile entry name is escaped');
assert.match(document.querySelector('.cqd-chore-parent').innerHTML, /&lt;img onerror=/);
// Add a backdated catalog job, then remove it. Add a priced custom-name entry too.
field('[data-chores-add-job]', 'trash');
click('[data-action="chores-add-entry"]');
let added = Object.values(storage.load().chores.entries).find((item) => item.date === MONDAY && item.jobId === 'trash');
assert.equal(added.date, MONDAY);
assert.equal(added.by, 'parent');
click(`[data-action="chores-remove-entry"][data-id="${added.id}"]`);
assert.equal(storage.load().chores.entries[added.id], undefined);
field('[data-chores-add-job]', 'other');
field('[data-chores-other-name]', `O'Brien <img onerror="x">`);
field('[data-chores-other-price]', '3.00');
click('[data-action="chores-add-entry"]');
added = Object.values(storage.load().chores.entries).find((item) => item.name.startsWith("O'Brien"));
assert.equal(added.cents, 300);
assert.equal(document.querySelector('.cqd-chore-parent img'), null);
click('[data-action="chores-confirm-day"]');
assert.equal(storage.load().chores.entries['mon-wait'].status, 'confirmed');
assert.equal(storage.load().chores.entries[added.id].status, 'confirmed');
// A waiting unpriced job is skipped by week confirmation and keeps payment blocked.
click('[data-action="chores-day"][data-date="2026-11-03"]');
field('[data-chores-add-job]', 'other');
field('[data-chores-other-name]', 'Fresh unpriced');
field('[data-chores-other-price]', '1.00');
click('[data-action="chores-add-entry"]');
const unpricedId = Object.values(storage.load().chores.entries).find((item) => item.name === 'Fresh unpriced').id;
// Use the pure rule to model an unpriced kid entry without changing production code.
const current = storage.load();
const withUnpriced = { ...current.chores, entries: { ...current.chores.entries, [unpricedId]: { ...current.chores.entries[unpricedId], cents: null } } };
storage.saveCore(storage.withChores(current, () => ({ chores: withUnpriced })));
click('[data-action="chores-day"][data-date="2026-11-02"]');
click('[data-action="chores-confirm-week"]');
assert.match(document.querySelector('.cqd-chore-parent-message').textContent, /1 unpriced job skipped/);
assert.equal(storage.load().chores.entries[unpricedId].status, 'waiting');
assert.equal(document.querySelector('[data-action="chores-pay-week"]').disabled, true);
forged('chores-pay-week');
assert.equal(storage.load().chores.paid[MONDAY], undefined, 'pay refused with waiting');
assert.match(document.querySelector('.cqd-chore-parent-message').textContent, /Waiting entries remain/);
click('[data-action="chores-day"][data-date="2026-11-03"]');
field(`[data-entry-price="${unpricedId}"]`, '1.00');
click(`[data-action="chores-set-entry-price"][data-id="${unpricedId}"]`);
click(`[data-action="chores-entry-status"][data-id="${unpricedId}"][data-status="confirmed"]`);
click('[data-action="chores-pay-week"]');
assert.ok(storage.load().chores.paid[MONDAY], 'paid record saved');
assert.match(document.querySelector('.cqd-chore-parent-banner').textContent, /Paid on/);
assert.equal(document.querySelector('[data-action="chores-open-payday"]'), null, 'paid week has no Helper offer');
assert.equal(document.querySelector('[data-action="chores-confirm-week"]').disabled, true);
assert.equal(document.querySelector('[data-action="chores-add-entry"]').disabled, true);
assert.equal(document.querySelector('[data-action="chores-remove-entry"]').disabled, true);
forged('chores-add-entry');
assert.equal(Object.keys(storage.load().chores.entries).length, 7, 'paid week refuses forged add');
assert.match(document.querySelector('.cqd-chore-parent-message').textContent, /Week is paid/);
const historyRows = [...document.querySelectorAll('.cqd-chore-parent-card:has(h2)')].find((card) => card.querySelector('h2')?.textContent === 'Paid so far')?.querySelectorAll('tbody tr') || [];
assert.equal(historyRows.length, 2, 'two paid weeks in history');
assert.match(historyRows[0].textContent, /Nov 2.*\$7\.75/, 'newest paid week first');
assert.match(historyRows[1].textContent, /Oct 26.*\$0\.75/);
assert.match(document.querySelector('.cqd-chore-parent-month').textContent, /This month.*\$7\.75/, 'month-to-date confirmed total');
click('[data-action="chores-reopen-week"]');
assert.equal(storage.load().chores.paid[MONDAY], undefined);
assert.equal(document.querySelector('[data-action="chores-add-entry"]').disabled, false);
click('[data-action="chores-prev-week"]');
assert.ok(document.querySelector('.cqd-chore-parent-banner'), 'previous paid week appears');
click('[data-action="chores-next-week"]');
assert.equal(document.querySelector('.cqd-chore-parent-banner'), null);
// Job settings affect future entries only.
click('[data-action="chores-jobs"]');
const oldPrice = storage.load().chores.entries['mon-wait'].cents;
field('[data-job-price="vacuum"]', '9.99');
assert.equal(storage.load().chores.entries['mon-wait'].cents, oldPrice);
assert.equal(storage.load().chores.jobs.overrides.vacuum.cents, 999);
field('[data-job-price="vacuum"]', '1000.01');
assert.equal(storage.load().chores.jobs.overrides.vacuum.cents, 999, 'price above $1000 refused');
click('[data-action="chores-toggle-job"][data-id="vacuum"]');
assert.equal(storage.load().chores.jobs.overrides.vacuum.active, false);
click('[data-action="chores-toggle-job"][data-id="vacuum"]');
field('[data-custom-name]', `<img onerror="x"> "Job"`);
field('[data-custom-es]', `Nombre 'es'`);
field('[data-custom-price]', '4.50');
click('[data-action="chores-add-job"]');
const custom = storage.load().chores.jobs.custom[0];
assert.equal(custom.cents, 450);
assert.equal(document.querySelector('.cqd-chore-parent img'), null);
assert.match(document.querySelector('.cqd-chore-parent').innerHTML, /&lt;img onerror=/);
click('[data-action="chores-check"]');
field('[data-chores-add-job]', custom.id);
click('[data-action="chores-add-entry"]');
const customEntry = Object.values(storage.load().chores.entries).find((item) => item.jobId === custom.id);
assert.equal(customEntry.cents, 450);
field('[data-chores-add-job]', 'vacuum');
click('[data-action="chores-add-entry"]');
const vacuumEntries = Object.values(storage.load().chores.entries).filter((item) => item.jobId === 'vacuum');
assert.equal(vacuumEntries[vacuumEntries.length - 1].cents, 999, 'new entry copies new price');
click('[data-action="chores-jobs"]');
click(`[data-action="chores-remove-job"][data-id="${custom.id}"]`);
assert.equal(storage.load().chores.jobs.custom.length, 0);
assert.equal(storage.load().chores.entries[customEntry.id].name, custom.name, 'removing custom job keeps old entries');
click('[data-action="daily-parent-lock"]');
assert.equal(document.querySelector('[data-action="chores-view-chores"]'), null);
click('[data-action="daily-parent-open"]');
assert.equal(document.querySelector('[data-action="chores-view-chores"]'), null, 'PIN required again');

let olderChores = storage.choresOf(storage.emptyStore());
olderChores = addEntry(olderChores, { track: 'standard', date: TODAY, todayIso: TODAY, jobId: 'trash', by: 'kid', nowIso: NOW, id: 'older-confirmed' }).chores;
olderChores = setEntryStatus(olderChores, 'older-confirmed', 'confirmed', NOW).chores;
await launch('standard', olderChores);
await unlock();
assert.equal(document.querySelector('[data-action="chores-open-payday"]'), null, 'older son never sees Payday helper');
assert.ok(document.querySelector('.cqd-chore-parent').textContent.includes('His money math'));
assert.match(document.querySelector('.cqd-chore-parent').textContent, /OLDER SON/);
let savedBlob;
let savedName;
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;
const originalAnchorClick = dom.window.HTMLAnchorElement.prototype.click;
URL.createObjectURL = (blob) => { savedBlob = blob; return 'blob:chores-test'; };
URL.revokeObjectURL = () => {};
dom.window.HTMLAnchorElement.prototype.click = function () { savedName = this.download; };
click('[data-action="chores-export-backup"]');
assert.equal(savedName, 'codequest-chores-older-2026-11-04.json');
const exported = JSON.parse(await savedBlob.text());
assert.equal(exported.track, 'standard');
assert.deepEqual(exported.chores, storage.load().chores);
assert.match(document.querySelector('[data-backup-status]').textContent, /Backup file saved.*Google Drive/);
const giveFile = (text, name = 'chores.json') => {
  const input = document.querySelector('[data-chores-backup-file]');
  Object.defineProperty(input, 'files', { configurable: true, value: [{ name, type: 'application/json', size: text.length, text: async () => text }] });
};
const waitImport = () => new Promise((resolve) => setTimeout(resolve, 0));
giveFile('{broken');
click('[data-action="chores-import-backup"]');
await waitImport();
assert.match(document.querySelector('[data-backup-status]').textContent, /not valid JSON/);
assert.deepEqual(storage.load().chores, exported.chores, 'bad file leaves records alone');
giveFile(JSON.stringify({ ...exported, track: 'guided' }));
click('[data-action="chores-import-backup"]');
await waitImport();
assert.match(document.querySelector('[data-backup-status]').textContent, /younger son's iPad/);
const additional = JSON.parse(JSON.stringify(exported));
additional.chores.entries.added = { ...additional.chores.entries['older-confirmed'], id: 'added', date: '2026-11-02' };
giveFile(JSON.stringify(additional));
click('[data-action="chores-import-backup"]');
await waitImport();
assert.equal(storage.load().chores.entries.added.id, 'added');
assert.match(document.querySelector('[data-backup-status]').textContent, /Added .* jobs, skipped/);
giveFile(JSON.stringify(exported));
document.querySelector('[data-chores-backup-replace]').checked = true;
click('[data-action="chores-import-backup"]');
await waitImport();
assert.deepEqual(storage.load().chores, exported.chores, 'replace restores exact export');

// ---- The PIN lock: a locked or expired Parent Mode refuses every grown-up action.
let guard = storage.choresOf(storage.emptyStore());
guard = addEntry(guard, { track: 'guided', date: TODAY, todayIso: TODAY, jobId: 'trash', by: 'kid', nowIso: NOW, id: 'guard-wait' }).chores;
document.body.innerHTML = '<main id="app"></main>';
let windowOpen = storage.withChores(storage.withTrack(storage.emptyStore(), 'guided'), () => ({ chores: guard }));
windowOpen = await pin.setParentPin(windowOpen, '1234', Date.now() - 1000);
storage.saveCore(windowOpen);
assert.equal(pin.parentUnlocked(windowOpen, Date.now()), true, 'window is open');
assert.equal(pin.parentUnlocked(windowOpen, Date.now() + 2 * 3600000), false, 'window ends after an hour');
await import(`../src/daily/app.js?parent-chores-test=${++boot}`);
click('[data-action="daily-parent-open"]');
assert.equal(document.querySelector('.cqd-parent-gate'), null, 'window open: Parent Mode opens without a PIN');
click('[data-action="chores-view-chores"]');
assert.ok(document.querySelector('[data-action="chores-pay-week"]'), 'window open: Chores open');
// The window ends while Chores is open: forged clicks must stop working.
clockOffset = 2 * 3600000;
forged('chores-confirm-week');
forged('chores-entry-status', { id: 'guard-wait', status: 'confirmed' });
assert.deepEqual(storage.load().chores, guard, 'an expired window blocks grown-up actions');
clockOffset = 0;
// Locked outright: forged clicks on the gate do nothing either.
click('[data-action="chores-view-work"]');
click('[data-action="daily-parent-lock"]');
click('[data-action="daily-parent-open"]');
assert.ok(document.querySelector('.cqd-parent-gate'), 'locked Parent Mode shows the gate');
forged('chores-confirm-week');
forged('chores-entry-status', { id: 'guard-wait', status: 'confirmed' });
assert.deepEqual(storage.load().chores, guard, 'forged clicks on a locked Parent Mode change nothing');
URL.createObjectURL = originalCreateObjectURL;
URL.revokeObjectURL = originalRevokeObjectURL;
dom.window.HTMLAnchorElement.prototype.click = originalAnchorClick;
globalThis.Date = RealDate;
console.log('ok — parent chores: PIN, badge, statuses, prices, day/week checks, backdated add, pay/reopen, history, tracks, jobs, escaping');
