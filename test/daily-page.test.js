// Unit coverage for the dedicated Daily Work iPad page's own new modules (src/daily/). The full
// kid+parent loop (typing, coin taps, drawing, submit, grading, calendar status) is already proven
// end-to-end in a real browser separately; this file covers the pure logic these tests can reach
// cheaply and would actually catch a regression in: storage normalization (including the same
// prototype-pollution guards state.js already uses), the duplicated PIN/lockout logic, and
// dayStatus's state table.
import assert from 'node:assert/strict';

class MemoryStorage {
  #data = new Map();
  getItem(key) { return this.#data.has(key) ? this.#data.get(key) : null; }
  setItem(key, value) { this.#data.set(key, String(value)); }
  removeItem(key) { this.#data.delete(key); }
  clear() { this.#data.clear(); }
}
globalThis.localStorage = new MemoryStorage();

const store = await import('../src/daily/store.js');
const pin = await import('../src/daily/pin.js');
const { dayStatus, buildMonth, realWeekDates, currentWeekSnapshots } = await import('../src/daily/calendar.js');
const { DAILY_WORK } = await import('../src/cq/daily-work/content.js');

// --- store.js ---------------------------------------------------------------

assert.deepEqual(store.emptyStore(), {
  track: null, parent: { pinHash: null, pinSalt: null, failCount: 0, lockUntil: 0, unlockedUntil: 0, resets: [] },
  dailyWork: { weeks: {} }, drawings: {}, history: {}, blockFills: {},
});

localStorage.setItem('codequest-daily-v1', 'not json at all {{{');
assert.deepEqual(store.load(), store.emptyStore(), 'unparsable storage falls back to an empty store');

localStorage.clear();
store.save(store.setTrack('guided'));
assert.equal(store.load().track, 'guided', 'setTrack persists through save/load');
assert.throws(() => store.setTrack('bogus-track'), /unknown track/);

localStorage.clear();
let s = store.emptyStore();
s = store.saveDrawing(s, 'week-11', 'monday', 'coin-combinations', 'data:image/webp;base64,AAAA');
store.save(s);
assert.equal(store.drawingFor(store.load(), 'week-11', 'monday', 'coin-combinations'), 'data:image/webp;base64,AAAA');
assert.equal(store.drawingFor(store.load(), 'week-11', 'tuesday', 'coin-combinations'), null, 'a different day has no drawing');
s = store.saveDrawing(store.load(), 'week-11', 'monday', 'coin-combinations', null);
store.save(s);
assert.equal(store.drawingFor(store.load(), 'week-11', 'monday', 'coin-combinations'), null, 'saving null clears a drawing');

// normalizeDrawings guards: prototype-pollution keys, non-image values, and oversized strings are
// all dropped rather than stored, the same discipline state.js already applies to dailyWork.
// Written as a raw JSON string (not JSON.stringify of a JS object literal) so the "__proto__" key
// below is a genuine own property after JSON.parse, the way a tampered localStorage blob would be —
// a `{ __proto__: ... }` object *literal* in source would set the prototype instead of testing it.
localStorage.setItem('codequest-daily-v1', JSON.stringify({ track: 'guided' }).slice(0, -1)
  + `,"drawings":{"__proto__":{"evil":{"x":"data:image/webp;base64,AA"}},"week-11":{"monday":{`
  + `"coin-combinations":"data:image/webp;base64,AA",`
  + `"constructor":"data:image/webp;base64,AA",`
  + `"pile":"not-a-data-url",`
  + `"oversized":"data:image/webp;base64,${'A'.repeat(1000000)}"`
  + `}}}}`);
const loaded = store.load();
assert.equal(store.drawingFor(loaded, 'week-11', 'monday', 'coin-combinations'), 'data:image/webp;base64,AA');
assert.equal(store.drawingFor(loaded, 'week-11', 'monday', 'pile'), null);
assert.equal(Object.prototype.hasOwnProperty.call(loaded.drawings, '__proto__'), false);
assert.equal(({}).evil, undefined, 'prototype was never actually polluted');

// Build storage payloads as JSON text, including values a JS object literal cannot faithfully
// represent. JSON itself cannot encode NaN; an invalid NaN token must use the load fallback.
for (const raw of ['-1', '0', '"3600000"', '"NaN"', 'null', '{}']) {
  localStorage.setItem('codequest-daily-v1', `{"parent":{"unlockedUntil":${raw}}}`);
  assert.equal(store.load().parent.unlockedUntil, 0, `invalid unlock expiry ${raw} is dropped`);
}
localStorage.setItem('codequest-daily-v1', '{"parent":{"unlockedUntil":NaN}}');
assert.equal(store.load().parent.unlockedUntil, 0, 'non-JSON NaN falls back to an empty store');
store.save({ ...store.emptyStore(), parent: { ...store.emptyStore().parent, unlockedUntil: NaN } });
assert.equal(store.load().parent.unlockedUntil, 0, 'a saved NaN normalizes to zero after JSON serialization');
localStorage.setItem('codequest-daily-v1', '{"parent":{"unlockedUntil":3600001}}');
assert.equal(store.load().parent.unlockedUntil, 3600001, 'a finite positive expiry survives loading');

console.log('ok — daily store.js: empty shape, fallback on garbage, setTrack, drawing save/clear round-trip, normalize guards');

// --- store.js: history (month-view calendar persistence, 2026-09-22) ----------------------------

localStorage.clear();
let withHistory = store.snapshotHistory(store.emptyStore(), '2026-09-21', 'week-11', 'monday', 'not-started');
const firstEntry = store.historyFor(withHistory, '2026-09-21');
assert.equal(firstEntry.iso, '2026-09-21');
assert.equal(firstEntry.status, 'not-started');
assert.equal(firstEntry.weekId, 'week-11');
assert.equal(firstEntry.dayKey, 'monday');
assert.ok(Number.isFinite(Date.parse(firstEntry.updatedAt)), 'updatedAt is a real, parseable timestamp');
assert.equal(store.historyFor(withHistory, '2026-09-22'), null, 'a date never snapshotted has no history entry');

// Bad inputs are silently ignored (return the store unchanged) rather than corrupting it.
assert.equal(store.snapshotHistory(withHistory, 'not-a-date', 'week-11', 'monday', 'complete'), withHistory);
assert.equal(store.snapshotHistory(withHistory, '2026-09-21', 'week-11', 'monday', 'not-a-real-status'), withHistory);

// Re-snapshotting the same date upserts (doesn't append) — confirms this is a status cache, not a log.
withHistory = store.snapshotHistory(withHistory, '2026-09-21', 'week-11', 'monday', 'complete');
assert.equal(Object.keys(withHistory.history).length, 1);
assert.equal(store.historyFor(withHistory, '2026-09-21').status, 'complete');

// normalizeHistory (via load()) drops garbage the same way normalizeDrawings does: non-date keys,
// unknown statuses, and a genuine prototype-pollution-shaped key are all rejected.
localStorage.setItem('codequest-daily-v1', JSON.stringify({ track: 'guided' }).slice(0, -1)
  + `,"history":{"__proto__":{"evil":{"status":"complete","weekId":"w","dayKey":"monday"}},`
  + `"2026-09-21":{"status":"complete","weekId":"week-11","dayKey":"monday"},`
  + `"not-a-date":{"status":"complete","weekId":"week-11","dayKey":"monday"},`
  + `"2026-09-22":{"status":"not-a-status","weekId":"week-11","dayKey":"tuesday"}}}`);
const loadedHistory = store.load();
assert.deepEqual(Object.keys(loadedHistory.history), ['2026-09-21']);
assert.equal(Object.prototype.hasOwnProperty.call(loadedHistory.history, '__proto__'), false);
assert.equal(({}).evil, undefined, 'prototype was never actually polluted (history)');

console.log('ok — daily store.js: history snapshot/lookup, upsert-not-append, normalize guards');

// --- pin.js -------------------------------------------------------------------

localStorage.clear();
let pinStore = store.load();
assert.equal(pin.hasParentPin(pinStore), false);
assert.equal(pin.parentUnlocked(pinStore, 1000), false, 'Parent Mode starts locked');
pinStore = await pin.setParentPin(pinStore, '1234', 1000);
store.save(pinStore);
assert.equal(pin.hasParentPin(store.load()), true);
assert.equal(pinStore.parent.unlockedUntil, 3601000, 'first PIN setup starts a one-hour window');
assert.equal(pin.parentUnlocked(store.load(), 3600999), true, 'setup unlock survives a storage round trip');
assert.equal(pin.parentUnlocked(pinStore, 3601000), false, 'setup unlock ends at its exact boundary');

pinStore = pin.lockParent(pinStore);
store.save(pinStore);
assert.equal(pinStore.parent.unlockedUntil, 0, 'Lock now clears the window');
assert.equal(pin.parentUnlocked(store.load(), 1001), false, 'Lock now persists across reload');

const good = await pin.checkParentPin(pinStore, '1234', 1000);
pinStore = good.store;
store.save(pinStore);
assert.equal(good.ok, true);
assert.equal(pinStore.parent.unlockedUntil, 3601000, 'successful check starts a new one-hour window');
assert.equal(pin.parentUnlocked(store.load(), 3600999), true, 'still unlocked at 59:59.999');
assert.equal(pin.parentUnlocked(pinStore, 3601000), false, 'locked at exactly one hour');
assert.equal(pin.parentUnlocked(pinStore, 3601001), false, 'locked after one hour');

pinStore = pin.lockParent(pinStore);
const wrongWithoutWindow = await pin.checkParentPin(pinStore, '0000', 1500);
assert.equal(wrongWithoutWindow.ok, false);
assert.equal(wrongWithoutWindow.store.parent.unlockedUntil, 0, 'a wrong PIN never starts a window');
pinStore = wrongWithoutWindow.store;

let last;
for (let i = 1; i < 5; i++) {
  last = await pin.checkParentPin(pinStore, '0000', 2000 + i);
  pinStore = last.store;
  store.save(pinStore);
}
assert.equal(last.ok, false);
assert.ok(last.lockedMs > 0, 'the 5th wrong attempt locks the PIN out');
assert.equal(pinStore.parent.unlockedUntil, 0, 'lockout does not unlock Parent Mode');

const stillLocked = await pin.checkParentPin(pinStore, '1234', 2000 + 5 * 100);
assert.equal(stillLocked.ok, false, 'even the correct PIN is rejected while locked');

const afterCooldown = await pin.checkParentPin(pinStore, '1234', 2000 + 61000);
pinStore = afterCooldown.store;
store.save(pinStore);
assert.equal(afterCooldown.ok, true, 'the correct PIN works again once the 60s lockout has passed');
assert.equal(pinStore.parent.unlockedUntil, 63000 + 3600000, 'a post-lockout success starts a fixed window');

pinStore = pin.resetParentPin(pinStore, 9999);
store.save(pinStore);
assert.equal(pin.hasParentPin(store.load()), false);
assert.equal(pinStore.parent.unlockedUntil, 0, 'PIN reset clears the unlock window');
assert.deepEqual(pin.recentPinResets(pinStore, 9999 + 86400000), [new Date(9999).toISOString()]);
assert.deepEqual(pin.recentPinResets(pinStore, 9999 + 31 * 86400000), [], 'a reset older than 30 days drops out of the recent list');

await assert.rejects(() => pin.setParentPin(pinStore, '12'), /four digits/);

// The page starts with an in-memory store, runs a PIN operation, then a calendar history
// snapshot persists that same in-memory store. The old direct-storage PIN writer lost the PIN
// and both lockout fields when the snapshot saved the pre-PIN copy.
localStorage.clear();
let pageStore = store.load();
const { setDailyParentPin, checkDailyParentPin, createParentState, gradeDailyWork, renderParent } = await import('../src/daily/parent-view.js');
const setResult = await setDailyParentPin(pageStore, '2468', '2468', 1000);
assert.equal(setResult.ok, true);
pageStore = setResult.store;
store.save(pageStore);
const savedHash = pageStore.parent.pinHash;
assert.match(savedHash, /^[0-9a-f]{64}$/, 'the page store contains a SHA-256 PIN hash before the calendar save');
const saveCalendarSnapshot = () => {
  pageStore = store.snapshotHistory(pageStore, '2026-09-23', 'week-11', 'wednesday', 'not-started');
  store.save(pageStore);
};
saveCalendarSnapshot();
assert.equal(store.load().parent.pinHash, savedHash, 'calendar return keeps the set PIN');
assert.equal(store.load().parent.unlockedUntil, 3601000, 'calendar return keeps the setup unlock');
pageStore = pin.lockParent(pageStore);
store.save(pageStore);

for (let i = 0; i < 4; i++) {
  const failed = await checkDailyParentPin(pageStore, '0000', 3000 + i);
  assert.equal(failed.unlocked, false);
  pageStore = failed.store;
  store.save(pageStore);
}
saveCalendarSnapshot();
assert.equal(store.load().parent.failCount, 4, 'calendar return keeps failed-try count');

const fifth = await checkDailyParentPin(pageStore, '0000', 3004);
pageStore = fifth.store;
store.save(pageStore);
saveCalendarSnapshot();
assert.equal(store.load().parent.lockUntil, 63004, 'calendar return keeps the 60-second lockout');
assert.equal(store.load().parent.failCount, 0);
assert.equal((await checkDailyParentPin(pageStore, '2468', 3005)).unlocked, false);

const unlocked = await checkDailyParentPin(pageStore, '2468', 63004);
assert.equal(unlocked.unlocked, true);
pageStore = unlocked.store;
store.save(pageStore);
saveCalendarSnapshot();
assert.equal(store.load().parent.lockUntil, 0, 'successful check clears the lockout through the same store flow');
assert.equal(store.load().parent.unlockedUntil, 3663004, 'calendar history save keeps the successful unlock');
assert.equal(pin.parentUnlocked(store.load(), 3663003), true, 'the saved unlock survives a page reload');
const reloadStore = { ...store.load(), track: 'guided' };
assert.match(renderParent(reloadStore, createParentState(), '2026-09-23', 3663003), /Check work/,
  'reopening Parent Mode from a reloaded store skips the PIN gate');
assert.match(renderParent(reloadStore, createParentState(), '2026-09-23', 3663004), /Grown-ups only/,
  'a render at the expiry boundary returns to the PIN gate');
const expiredWhileGrading = { ...pageStore, track: 'guided' };
assert.equal(pin.parentUnlocked(expiredWhileGrading, 3663004), false);
const gradedAfterExpiry = gradeDailyWork(expiredWhileGrading, 'week-11', 'monday',
  { 'coin-combinations/penny-value': 'correct' }, '2026-09-23T12:00:00.000Z');
assert.equal(gradedAfterExpiry.dailyWork.weeks['week-11'].days.monday.sheets['coin-combinations'].items['penny-value'].status, 'correct',
  'a grade staged before expiry can still be saved');
assert.equal(gradedAfterExpiry.parent.unlockedUntil, 3663004, 'grading does not extend the fixed window');

pageStore = pin.resetParentPin(pageStore, 70000);
store.save(pageStore);
saveCalendarSnapshot();
assert.equal(store.load().parent.pinHash, null, 'reset stays reset after calendar return');
assert.equal(store.load().parent.unlockedUntil, 0, 'calendar return keeps the reset window cleared');
assert.deepEqual(store.load().parent.resets, [new Date(70000).toISOString()]);

console.log('ok — daily pin.js: set/check/lockout/cooldown/reset, matching progress.js’s own PIN semantics');

// --- drawing.js: pen/eraser pointer path and unchanged saved data URL ----------------------------

const { attachDrawing } = await import('../src/daily/drawing.js');
const pointerListeners = new Map();
const marks = [];
const context = {
  globalCompositeOperation: 'source-over', lineWidth: 0,
  save() {}, restore() { this.globalCompositeOperation = 'source-over'; },
  beginPath() {}, moveTo() {}, lineTo() {}, arc() {},
  fill() { marks.push({ kind: 'tap', operation: this.globalCompositeOperation, width: this.lineWidth }); },
  stroke() { marks.push({ kind: 'stroke', operation: this.globalCompositeOperation, width: this.lineWidth }); },
  clearRect() {},
};
const fakeCanvas = {
  width: 100, height: 100,
  getContext: () => context,
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
  setPointerCapture() {}, releasePointerCapture() {},
  addEventListener: (name, listener) => pointerListeners.set(name, listener),
  removeEventListener: (name) => pointerListeners.delete(name),
  toDataURL: (format) => { assert.equal(format, 'image/webp'); return 'data:image/webp;base64,AAAA'; },
};
const savedStrokes = [];
const drawing = attachDrawing(fakeCanvas, { onStroke: (dataUrl) => savedStrokes.push(dataUrl) });
const pointer = { pointerId: 1, button: 0, clientX: 20, clientY: 20, preventDefault() {} };
pointerListeners.get('pointerdown')(pointer);
pointerListeners.get('pointerup')(pointer);
drawing.setTool('eraser');
pointerListeners.get('pointerdown')(pointer);
pointerListeners.get('pointermove')({ ...pointer, clientX: 30 });
pointerListeners.get('pointerup')(pointer);
assert.equal(marks[0].operation, 'source-over');
assert.equal(marks[1].operation, 'destination-out', 'eraser removes canvas alpha');
assert.ok(marks[1].width > marks[0].width, 'eraser footprint is larger than the pen');
assert.equal(marks[2].operation, 'destination-out', 'finger or Pencil movement uses the eraser');
assert.deepEqual(savedStrokes, ['data:image/webp;base64,AAAA', 'data:image/webp;base64,AAAA'], 'both completed strokes save in the existing data URL format');
const erasedDrawing = store.saveDrawing(store.emptyStore(), 'week-11', 'monday', 'sheet', savedStrokes[1]);
store.save(erasedDrawing);
assert.equal(store.drawingFor(store.load(), 'week-11', 'monday', 'sheet'), savedStrokes[1]);
drawing.clear();
assert.equal(savedStrokes.at(-1), null, 'Clear still persists a full wipe');
drawing.detach();

console.log('ok — daily drawing.js: pen/eraser composition, wider eraser, per-stroke WebP save, clear');

// --- calendar.js dayStatus ------------------------------------------------------

const sheets = [{ id: 's', items: [{ id: 'a', sheetId: 's' }, { id: 'b', sheetId: 's' }] }]
  .map((sheet) => ({ ...sheet, items: sheet.items }));
const withItems = (overrides) => ({
  sheets: { s: { items: { a: { value: null, status: 'unanswered', checkedAt: null }, b: { value: null, status: 'unanswered', checkedAt: null }, ...overrides } } },
  submittedAt: null,
});

assert.equal(dayStatus(withItems({}), sheets), 'not-started');
assert.equal(dayStatus(withItems({ a: { value: 1, status: 'answered', checkedAt: null } }), sheets), 'in-progress');
assert.equal(dayStatus({ ...withItems({ a: { value: 1, status: 'answered', checkedAt: null } }), submittedAt: '2026-01-01T00:00:00.000Z' }, sheets), 'awaiting-check');
assert.equal(dayStatus(withItems({ a: { value: null, status: 'wrong', checkedAt: '2026-01-01T00:00:00.000Z' } }), sheets), 'needs-fixes');
assert.equal(dayStatus({ ...withItems({
  a: { value: 1, status: 'correct', checkedAt: '2026-01-01T00:00:00.000Z' },
  b: { value: 1, status: 'correct', checkedAt: '2026-01-01T00:00:00.000Z' },
}), submittedAt: '2026-01-01T00:00:00.000Z' }, sheets), 'complete');

// 2026-09-22 is a Tuesday; its real Monday-Friday is 2026-09-21..25.
assert.deepEqual(realWeekDates('2026-09-22'), [
  { dayKey: 'monday', iso: '2026-09-21' }, { dayKey: 'tuesday', iso: '2026-09-22' },
  { dayKey: 'wednesday', iso: '2026-09-23' }, { dayKey: 'thursday', iso: '2026-09-24' },
  { dayKey: 'friday', iso: '2026-09-25' },
]);
// A Sunday should resolve to the Monday BEFORE it, not the one after.
assert.equal(realWeekDates('2026-09-20').find((d) => d.dayKey === 'monday').iso, '2026-09-14');

['guided', 'standard'].forEach((track) => {
  const empty = store.emptyStore();
  empty.track = track;
  const month = buildMonth(empty, 2026, 8, '2026-09-22'); // September is month index 8
  assert.equal(month.cells.filter(Boolean).length, 30, `${track} September 2026 has 30 real day cells`);
  assert.equal(month.cells.length % 7, 0, 'the grid pads out to full weeks');
  const todayCell = month.cells.find((c) => c && c.iso === '2026-09-22');
  assert.ok(todayCell, `${track} today's cell exists in the grid`);
  assert.equal(todayCell.clickable, true, `${track} today is clickable (live content)`);
  assert.equal(todayCell.hasWork, true, `${track} today has authored work`);
  const restOfWeek = ['2026-09-21', '2026-09-23', '2026-09-24', '2026-09-25']
    .map((iso) => month.cells.find((c) => c && c.iso === iso));
  restOfWeek.forEach((cell) => assert.equal(cell.clickable, true, `${track} ${cell.iso} (same real week) is also clickable`));
  const outsideWeek = month.cells.find((c) => c && c.iso === '2026-09-01');
  assert.equal(outsideWeek.clickable, false, `${track} a day outside the current real week is never clickable`);
  assert.equal(outsideWeek.hasWork, false, `${track} with no history snapshot yet, a past day shows no work`);
  const weekendCell = month.cells.find((c) => c && c.iso === '2026-09-19'); // a Saturday
  assert.equal(weekendCell.isWeekend, true);
  assert.equal(weekendCell.clickable, false, 'weekends are never clickable — no content is ever scheduled on them');

  // History persists a day's status once content rotates it out of the "current real week" window.
  const snapshots = currentWeekSnapshots(empty, '2026-09-22');
  assert.ok(snapshots.length >= 5, `${track} has a snapshot for every day of the current real week`);
  let withHistory = empty;
  snapshots.forEach((entry) => { withHistory = store.snapshotHistory(withHistory, entry.iso, entry.weekId, entry.dayKey, entry.status); });
  // Simulate time passing: ask about a date that's no longer "this real week" relative to a later today.
  const laterMonth = buildMonth(withHistory, 2026, 8, '2026-10-05');
  const historicalCell = laterMonth.cells.find((c) => c && c.iso === '2026-09-21');
  assert.equal(historicalCell.clickable, false, `${track} a day from a since-rotated-out week is read-only`);
  assert.equal(historicalCell.hasWork, true, `${track} but its history snapshot still shows it had work`);
  assert.equal(historicalCell.status, 'not-started', `${track} snapshotted status is preserved exactly (nothing was answered in this test)`);
});

console.log('ok — daily calendar.js: dayStatus state table, buildCalendar sees all 5 weekdays for both live tracks');

// --- sheet-view.js: weekVerse() and the verse's exclusion from the gated/paged flow -------------

const { weekVerse, sheetsForDay } = await import('../src/daily/sheet-view.js');

['guided', 'standard'].forEach((track) => {
  const week = DAILY_WORK[track].weeks['week-11'];
  const verse = weekVerse(week);
  assert.ok(verse, `${track} week has a memory verse`);
  assert.doesNotMatch(verse.html, /___/, `${track} verse has every blank filled in, no literal ___`);
  assert.match(verse.html, /<strong class="cqd-verse-word">/, `${track} verse highlights its answer words`);
  assert.ok(verse.citation, `${track} verse has a citation`);
  // The verse must never appear inside any day's gated sheet list — that's the whole point of the
  // "ungraded reference card, not a daily chore" change (2026-09-22).
  ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach((dayKey) => {
    const daySheets = sheetsForDay(week, dayKey);
    assert.ok(!daySheets.some((sheet) => sheet.id === 'memory-verse'), `${track} ${dayKey} does not include the memory-verse sheet`);
  });
});

assert.equal(weekVerse({ weekItems: [] }), null, 'a week with no weekItems has no verse card');

console.log('ok — daily sheet-view.js: weekVerse() reconstructs full correct text, excluded from every day’s gated sheets');

// --- content.js: the percent-grid `unit` field lands on exactly the intended items --------------

const standardWeek = DAILY_WORK.standard.weeks['week-11'];
const allStandardItems = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  .flatMap((dayKey) => (standardWeek.days[dayKey].sheets || []).flatMap((sheet) => sheet.items.map((item) => ({ ...item, sheetId: sheet.id }))));
const numericStandardItems = allStandardItems.filter((item) => item.kind === 'numeric');
assert.ok(numericStandardItems.length > 15, 'sanity: standard track has plenty of numeric items this week');
numericStandardItems.forEach((item) => {
  assert.equal(item.unit, 'percent', `${item.sheetId}/${item.id} is marked unit:percent`);
  assert.ok(Number.isInteger(item.answer), `${item.sheetId}/${item.id}'s answer is a whole percent`);
});
const guidedWeek = DAILY_WORK.guided.weeks['week-11'];
const anyGuidedUnit = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  .flatMap((dayKey) => (guidedWeek.days[dayKey].sheets || []).flatMap((sheet) => sheet.items))
  .some((item) => item.unit !== undefined);
assert.equal(anyGuidedUnit, false, 'the guided track (money, not percent) never gets a unit field — the addition is fully additive and track-scoped');

console.log('ok — content.js: every standard-track percent item is unit:percent with a whole-number answer; guided track untouched');

// --- blocks.js: the adaptive block bar for percent problems (2026-09-23) -------------------------

const { blockPlan, blockView, clueBlocks, nextFill, formatPct, HELP_LEVELS } = await import('../src/daily/blocks.js');

// Plans: one block per item for small clean wholes, grouped benchmark blocks for big ones.
assert.deepEqual(blockPlan(6, 8), { count: 8, size: 1 }, '6 out of 8 -> 8 blocks of 12.5%');
assert.deepEqual(blockPlan(3, 10), { count: 10, size: 1 });
assert.deepEqual(blockPlan(6, 12), { count: 4, size: 3 }, '12 is grouped: 4 blocks of 3 (25% each), not 12 blocks of 8.33%');
assert.deepEqual(blockPlan(21, 30), { count: 10, size: 3 }, '30 -> 10 blocks of 3 (10% each)');
assert.deepEqual(blockPlan(20, 25), { count: 5, size: 5 });
assert.deepEqual(blockPlan(17, 20), { count: 20, size: 1 }, 'a part that no benchmark grouping can hold falls back to one block per item');
assert.equal(blockPlan(4, 9), null, 'no clean split at all -> no block bar (caller falls back to a plain answer box)');
assert.equal(blockPlan(7, 6), null, 'part > whole is rejected');
assert.equal(blockPlan(1.5, 4), null, 'non-integers are rejected');
assert.equal(blockPlan(-1, 4), null);

// formatPct never produces ugly floating-point tails.
assert.equal(formatPct(12.5), '12.5%');
assert.equal(formatPct(37.5), '37.5%');
assert.equal(formatPct(25), '25%');
assert.equal(formatPct(100 / 3), '33.33%');

// Filling rule: contiguous from the left; tapping the last filled block takes it off.
assert.equal(nextFill(0, 3, 8), 3);
assert.equal(nextFill(3, 3, 8), 2);
assert.equal(nextFill(5, 2, 8), 2, 'tapping an earlier block shrinks the fill to it');
assert.equal(nextFill(2, 8, 8), 8);
assert.equal(nextFill(2, 99, 8), 2, 'an out-of-range tap changes nothing');
assert.equal(nextFill(2, 0, 8), 2);
assert.equal(nextFill('junk', 3, 8), 3);

// Every authored block item: plans cleanly, the answer is an exact whole number that equals fill * unit,
// and the help ramp is exactly all -> unit -> clues -> none across Tue-Fri. Monday is untouched.
const rampByDay = { tuesday: 'all', wednesday: 'unit', thursday: 'clues', friday: 'none' };
Object.entries(rampByDay).forEach(([dayKey, help]) => {
  const items = standardWeek.days[dayKey].sheets.flatMap((sheet) => sheet.items).filter((item) => item.kind === 'numeric');
  assert.ok(items.length >= 5, `${dayKey} has real block problems`);
  items.forEach((item) => {
    assert.equal(item.help, help, `${dayKey}/${item.id} help level`);
    const plan = blockPlan(item.part, item.whole);
    assert.ok(plan, `${dayKey}/${item.id} plans into blocks`);
    assert.ok(Number.isInteger(item.part / plan.size), `${dayKey}/${item.id}: the part is a whole number of blocks`);
    assert.equal((item.part / plan.size) * (100 / plan.count), item.answer, `${dayKey}/${item.id}: blocks x unit equals the authored answer`);
    assert.ok(Number.isInteger(item.answer), `${dayKey}/${item.id} answer is exact`);
    assert.ok(plan.count <= 20, `${dayKey}/${item.id} never needs more than two rows of 10`);
  });
});
standardWeek.days.monday.sheets.flatMap((sheet) => sheet.items).forEach((item) => {
  assert.equal(item.help, undefined, `monday/${item.id} keeps the old 100-square grid — it was already finished by the time this shipped`);
});

// Levels label exactly what they promise.
const sample = (help, extra = {}) => ({ id: 'x', part: 6, whole: 8, help, ...extra });
const all = blockView(sample('all'), 3);
assert.deepEqual(all.labels, ['12.5%', '25%', '37.5%', '50%', '62.5%', '75%', '87.5%', '100%']);
assert.equal(all.readout, '3 blocks = 37.5%');
assert.equal(all.caption, '1 block = 12.5%');
assert.equal(blockView(sample('all'), 0).readout, 'Tap the blocks to fill them in.');
const unit = blockView(sample('unit'), 5);
assert.ok(unit.labels.every((label) => label === null), 'unit level labels no blocks');
assert.equal(unit.readout, null, 'unit level gives no running total');
assert.equal(unit.caption, '1 block = 12.5%');
const none = blockView(sample('none'), 5);
assert.ok(none.labels.every((label) => label === null) && none.readout === null);
assert.equal(none.caption, 'The whole is 8 blocks = 100%', 'the last level tells him only what the whole is');
assert.equal(blockView({ id: 'x', part: 6, whole: 12, help: 'unit' }, 0).caption, '1 block = 3 of the 12 = 25%', 'grouped blocks say what one block holds');
assert.equal(blockView({ id: 'x', part: 6, whole: 8, help: 'bogus' }, 0).help, 'none', 'an unknown help level fails to the LEAST helpful, never the most');
assert.equal(blockView({ id: 'x', part: 4, whole: 9, help: 'all' }, 0), null, 'unplannable numbers give no view');
assert.equal(blockView(sample('all'), 99).filled, 8, 'the fill is clamped to the block count');
assert.equal(blockView(sample('all'), -3).filled, 0);
assert.deepEqual([...HELP_LEVELS], ['all', 'unit', 'clues', 'none']);

// Clues: 1-2 blocks, stable, never the answer's block, never the last block, deterministic per item id.
Object.entries(rampByDay).filter(([, help]) => help === 'clues').forEach(([dayKey]) => {
  standardWeek.days[dayKey].sheets.flatMap((sheet) => sheet.items).forEach((item) => {
    const plan = blockPlan(item.part, item.whole);
    const target = item.part / plan.size;
    const shown = blockView(item, 0).labels.map((label, i) => (label ? i + 1 : 0)).filter(Boolean);
    assert.ok(shown.length >= 1 && shown.length <= 2, `${item.id}: 1-2 clue blocks`);
    assert.ok(!shown.includes(target), `${item.id}: a clue never sits on the block the answer lands on`);
    assert.ok(!shown.includes(plan.count), `${item.id}: a clue is never just "100%"`);
    assert.deepEqual(blockView(item, 0).labels, blockView({ ...item }, 7).labels, `${item.id}: clues don't change with the fill`);
    assert.deepEqual(clueBlocks(item.id, plan.count, target), clueBlocks(item.id, plan.count, target), `${item.id}: same input, same clues`);
  });
});
const spread = new Set(Array.from({ length: 60 }, (_, i) => clueBlocks(`item-${i}`, 10, 7).join(',')));
assert.ok(spread.size > 5, 'different problems really do get different clue blocks (it is randomized, not one fixed pattern)');
assert.deepEqual(clueBlocks('a', 2, 1), [], 'nothing to clue on a 2-block bar whose only non-final block is the answer');

// NEUTRALITY: the view is built from the problem's own numbers and the fill only. Whatever the authored
// answer says (or what he typed), nothing about the output may change — so it can never signal right/wrong.
['all', 'unit', 'clues', 'none'].forEach((help) => {
  const base = { id: 'neutral', part: 6, whole: 8, help };
  assert.deepEqual(blockView({ ...base, answer: 75 }, 6), blockView({ ...base, answer: 12345 }, 6), `${help}: output is independent of item.answer`);
  assert.deepEqual(blockView({ ...base, answer: 75 }, 6), blockView({ ...base, answer: null }, 6), `${help}: ...even with no answer at all`);
  assert.equal(JSON.stringify(blockView(base, 5)).includes('correct'), false, `${help}: nothing in the view says "correct"`);
  assert.equal(JSON.stringify(blockView(base, 5)).includes('wrong'), false, `${help}: nothing in the view says "wrong"`);
});

// --- store.js: block fills ------------------------------------------------------------------

localStorage.clear();
let withFill = store.setBlockFill(store.emptyStore(), 'week-11', 'tuesday', 'finding-the-percent', '6-of-10', 6);
assert.equal(store.blockFillFor(withFill, 'week-11', 'tuesday', 'finding-the-percent', '6-of-10'), 6);
assert.equal(store.blockFillFor(withFill, 'week-11', 'tuesday', 'finding-the-percent', '3-of-10'), 0, 'an untouched item reads as 0');
assert.equal(store.blockFillFor(store.emptyStore(), 'week-11', 'tuesday', 'x', 'y'), 0);
withFill = store.setBlockFill(withFill, 'week-11', 'tuesday', 'finding-the-percent', '6-of-10', 0);
assert.equal(store.blockFillFor(withFill, 'week-11', 'tuesday', 'finding-the-percent', '6-of-10'), 0, 'setting 0 clears it');
store.save(store.setBlockFill(store.emptyStore(), 'week-11', 'friday', 'finding-the-percent', '17-of-20', 17));
assert.equal(store.blockFillFor(store.load(), 'week-11', 'friday', 'finding-the-percent', '17-of-20'), 17, 'a fill survives save + load');
// Hand-built JSON so "__proto__" is a genuine parsed key (a JS-literal one would set the prototype instead).
localStorage.setItem('codequest-daily-v1', JSON.stringify({ track: 'standard' }).slice(0, -1)
  + ',"blockFills":{"__proto__":{"d":{"s":{"i":3}}},"week-11":{"tuesday":{"finding-the-percent":{"ok":4,"zero":0,"neg":-2,"frac":2.5,"big":9999,"str":"7","constructor":3}}}}}');
const fills = store.load();
assert.equal(Object.prototype.hasOwnProperty.call(fills.blockFills, '__proto__'), false, 'a __proto__ key is dropped');
assert.equal(({}).d, undefined, 'the prototype was never polluted');
assert.deepEqual(fills.blockFills['week-11'].tuesday['finding-the-percent'], { ok: 4 }, 'zero, negative, fractional, oversized, string and constructor entries are all rejected');

console.log('ok — daily blocks.js: plans/grouping, fill rule, help levels, stable clues, neutrality, store fills');
