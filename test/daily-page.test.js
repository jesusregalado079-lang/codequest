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
  track: null, parent: { pinHash: null, pinSalt: null, failCount: 0, lockUntil: 0, resets: [] },
  dailyWork: { weeks: {} }, drawings: {}, history: {},
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
assert.equal(pin.hasParentPin(), false);
await pin.setParentPin('1234');
assert.equal(pin.hasParentPin(), true);

const good = await pin.checkParentPin('1234', 1000);
assert.equal(good.ok, true);

let last;
for (let i = 0; i < 5; i++) last = await pin.checkParentPin('0000', 2000 + i);
assert.equal(last.ok, false);
assert.ok(last.lockedMs > 0, 'the 5th wrong attempt locks the PIN out');

const stillLocked = await pin.checkParentPin('1234', 2000 + 5 * 100);
assert.equal(stillLocked.ok, false, 'even the correct PIN is rejected while locked');

const afterCooldown = await pin.checkParentPin('1234', 2000 + 61000);
assert.equal(afterCooldown.ok, true, 'the correct PIN works again once the 60s lockout has passed');

pin.resetParentPin(9999);
assert.equal(pin.hasParentPin(), false);
assert.deepEqual(pin.recentPinResets(9999 + 86400000), [new Date(9999).toISOString()]);
assert.deepEqual(pin.recentPinResets(9999 + 31 * 86400000), [], 'a reset older than 30 days drops out of the recent list');

await assert.rejects(() => pin.setParentPin('12'), /four digits/);

console.log('ok — daily pin.js: set/check/lockout/cooldown/reset, matching progress.js’s own PIN semantics');

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
  if (item.id === 'free-throws') {
    assert.equal(item.unit, undefined, 'the one non-integer-percent item (87.5%) is NOT marked unit:percent — a 100-square grid cannot represent it');
  } else {
    assert.equal(item.unit, 'percent', `${item.sheetId}/${item.id} is marked unit:percent so it gets the shading grid`);
    assert.ok(Number.isInteger(item.answer), `${item.sheetId}/${item.id}'s answer is a whole percent`);
  }
});
const guidedWeek = DAILY_WORK.guided.weeks['week-11'];
const anyGuidedUnit = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  .flatMap((dayKey) => (guidedWeek.days[dayKey].sheets || []).flatMap((sheet) => sheet.items))
  .some((item) => item.unit !== undefined);
assert.equal(anyGuidedUnit, false, 'the guided track (money, not percent) never gets a unit field — the addition is fully additive and track-scoped');

console.log('ok — content.js: unit:percent lands only on standard-track integer-percent items, guided track untouched');
