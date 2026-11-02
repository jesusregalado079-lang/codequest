import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import * as storage from '../src/daily/store.js';
import * as pin from '../src/daily/pin.js';
import { addEntry, payWeek, reopenWeek, setEntryStatus, setJobPrice } from '../src/daily/chores.js';

const TODAY = '2026-11-04';
const MONDAY = '2026-11-02';
const NOW = '2026-11-04T12:00:00.000Z';
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
const click = (selector) => { const element = document.querySelector(selector); assert.ok(element, selector); element.click(); };
const field = (selector, value) => { const element = document.querySelector(selector); assert.ok(element, selector); element.value = value; };
let boot = 0;
async function launch(track, chores) {
  document.body.innerHTML = '<main id="app"></main>';
  let saved = storage.withTrack(storage.emptyStore(), track);
  saved = storage.withChores(saved, () => ({ chores }));
  saved = pin.lockParent(await pin.setParentPin(saved, '1234', Date.now() - 1000));
  storage.saveCore(saved);
  await import(`../src/daily/app.js?chores-payday-test=${++boot}`);
}
function week(cents = 900, paid = true) {
  let chores = storage.choresOf(storage.emptyStore());
  chores = setJobPrice(chores, 'trash', cents).chores;
  chores = addEntry(chores, { track: 'guided', date: TODAY, todayIso: TODAY, jobId: 'trash', by: 'kid', nowIso: NOW, id: 'job1' }).chores;
  chores = setEntryStatus(chores, 'job1', 'confirmed', NOW).chores;
  return paid ? payWeek(chores, MONDAY, NOW).chores : chores;
}
async function unlock() {
  click('[data-action="daily-parent-open"]');
  field('[data-parent-pin="enter"]', '1234');
  click('[data-action="daily-parent-enter-pin"]');
  for (let i = 0; i < 20 && !document.querySelector('[data-action="chores-view-chores"]'); i++) await new Promise((resolve) => setTimeout(resolve, 10));
  click('[data-action="chores-view-chores"]');
}
await launch('guided', week());
click('[data-action="open-payday"]');
assert.match(document.querySelector('.pd-chore-suggestion').textContent, /Your chores, week of Nov 2.*\$9\.00 from 1 job\./s);
click('[data-action="payday-use-chores"]');
assert.equal(storage.load().payday.sessions[0].earned, 900);
assert.ok(storage.load().chores.paid[MONDAY].helperUsedAt);
assert.equal(document.querySelector('.pd-chore-suggestion'), null);
click('[data-action="payday-change-amount"]');
assert.equal(document.querySelector('.pd-chore-suggestion'), null, 'used paid week stays hidden on earn screen');
const forged = document.createElement('button');
forged.dataset.action = 'payday-use-chores';
document.querySelector('#app').append(forged);
forged.click();
assert.equal(storage.load().payday.sessions.length, 1, 'second tap cannot reuse a paid week');
assert.ok(storage.load().chores.paid[MONDAY].helperUsedAt);
assert.equal(reopenWeek(storage.load().chores, MONDAY).chores.paid[MONDAY], undefined);

await launch('guided', week());
click('[data-action="open-payday"]');
field('[data-payday-input="earn"]', '4.25');
click('[data-action="payday-earn-submit"]');
assert.equal(storage.load().payday.sessions[0].earned, 425);
assert.equal(storage.load().chores.paid[MONDAY].helperUsedAt, undefined);

await launch('guided', week(6000));
click('[data-action="open-payday"]');
assert.match(document.querySelector('.pd-chore-suggestion').textContent, /more than the Payday Helper can split/);
assert.equal(document.querySelector('[data-action="payday-use-chores"]'), null);

await launch('guided', week());
await unlock();
click('[data-action="chores-open-payday"]');
assert.equal(storage.load().payday.sessions[0].earned, 900, 'paid parent button starts same amount');
assert.ok(storage.load().chores.paid[MONDAY].helperUsedAt);
assert.equal(document.querySelector('.cqd-chore-parent'), null, 'parent mode exited');

await launch('guided', week(775, false));
await unlock();
assert.equal(document.querySelector('[data-action="chores-open-payday"]'), null, 'no Payday button for a week that is not paid yet');
const forgedUnpaid = document.createElement('button');
forgedUnpaid.dataset.action = 'chores-open-payday';
document.querySelector('#app').append(forgedUnpaid);
forgedUnpaid.click();
assert.equal(storage.load().payday.sessions.length, 0, 'an unpaid week cannot start the Payday Helper (it could be used twice)');
assert.match(document.querySelector('.cqd-chore-parent-message').textContent, /Mark the week as paid first/);
assert.equal(storage.load().chores.paid[MONDAY], undefined, 'unpaid week remains unpaid');
click('[data-action="chores-pay-week"]');
assert.equal(storage.load().chores.paid[MONDAY].helperUsedAt, undefined, 'paying does not use the Helper');
click('[data-action="chores-open-payday"]');
assert.equal(storage.load().payday.sessions[0].earned, 775, 'once paid, the button starts the same amount');
assert.ok(storage.load().chores.paid[MONDAY].helperUsedAt, 'and marks the week used');

await launch('standard', week());
assert.equal(document.querySelector('[data-action="open-payday"]'), null);
const forgedOlder = document.createElement('button');
forgedOlder.dataset.action = 'open-payday';
document.querySelector('#app').append(forgedOlder);
forgedOlder.click();
assert.equal(document.querySelector('.pd-chore-suggestion'), null, 'older track cannot see a suggestion even from forged navigation');
click('[data-action="back-to-calendar"]');
await unlock();
assert.equal(document.querySelector('[data-action="chores-open-payday"]'), null);
assert.equal(document.querySelector('.pd-chore-suggestion'), null);
globalThis.Date = RealDate;
console.log('ok — chore Payday suggestion, used flag, typed amount, range, parent links, older track');
