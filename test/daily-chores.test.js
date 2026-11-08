import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as c from '../src/daily/chores.js';
import { CHORE_CATALOG } from '../src/daily/chores-catalog.js';
import * as store from '../src/daily/store.js';

class MemoryStorage {
  data = new Map();
  getItem(key) { return this.data.get(key) ?? null; }
  setItem(key, value) { this.data.set(key, String(value)); }
  removeItem(key) { this.data.delete(key); }
  clear() { this.data.clear(); }
}
globalThis.localStorage = new MemoryStorage();
const MON = '2026-10-26';
const TUE = '2026-10-27';
const WED = '2026-10-28';
const NOW = '2026-10-27T12:00:00Z';
const later = '2026-10-27T20:00:00Z';
const add = (chores, id, jobId = 'trash', opts = {}) => c.addEntry(chores, {
  track: 'guided', date: TUE, todayIso: TUE, jobId, by: 'kid', nowIso: NOW, id, ...opts,
});
const ok = (result) => { assert.ok(result && !result.error, result?.error); return result.chores; };
const rejected = (result, label) => assert.equal(typeof result.error, 'string', label);

// Exact catalog, including track-specific laundry and verse prices.
const expectedShared = [
  ['trash', 75, 'Sacar la basura'], ['vacuum', 100, 'Aspirar o barrer'],
  ['counters', 75, 'Limpiar el lavabo'], ['table', 50, 'Poner y recoger la mesa'],
  ['living-room', 100, 'Ordenar la sala'], ['groceries', 75, 'Ayudar con las compras'],
  ['litter', 50, 'Limpiar la caja del gato'], ['dishwasher', 75, 'Lavaplatos: llenar y vaciar'],
  ['dinner', 100, 'Ayudar a hacer la cena'], ['massage', 200, 'Masaje de pies para mamá'],
];
for (const [track, suffix] of [
  ['guided', [['laundry-fold', 150, 'Doblar y guardar la ropa'], ['verse', 150, 'Recitar el versículo de memoria']]],
  ['standard', [['laundry-full', 250, 'Lavar, secar y doblar la ropa'], ['verse', 250, 'Recitar el versículo de memoria']]],
]) {
  const jobs = c.catalogFor(track, c.emptyChores());
  assert.deepEqual(jobs.map((j) => [j.id, j.cents, j.es]), [...expectedShared, ...suffix]);
  assert.equal(new Set(jobs.map((j) => j.id)).size, jobs.length);
  assert.ok(jobs.every((j) => j.name && j.icon && j.active && j.custom === false));
  assert.deepEqual(CHORE_CATALOG[track].map((j) => j.id), jobs.map((j) => j.id));
}
assert.deepEqual(c.catalogFor('bogus', c.emptyChores()), []);

let chores = c.emptyChores();
assert.deepEqual(chores, { jobs: { overrides: {}, custom: [] }, entries: {}, paid: {}, math: {}, savingsUsed: {} });
rejected(add(chores, 'past', 'trash', { date: MON }), 'kid yesterday');
rejected(add(chores, 'future', 'trash', { date: WED }), 'kid tomorrow');
rejected(add(chores, 'bad', 'alien'), 'unknown job');
chores = ok(c.setJobActive(chores, 'trash', false));
assert.equal(c.activeJobs('guided', chores).some((j) => j.id === 'trash'), false);
rejected(add(chores, 'off'), 'inactive job');
chores = ok(c.setJobActive(chores, 'trash', true));
rejected(add(chores, 'other0', 'other', { otherName: ' \n\t ' }), 'blank other');
chores = ok(add(chores, 'one'));
chores = ok(add(chores, 'two'));
assert.equal(c.groupByJob(c.dayEntries(chores, TUE))[0].count, 2);
assert.equal(chores.entries.one.cents, 75, 'price copied at log time');
assert.equal(chores.entries.one.by, 'kid');
const longName = 'A'.repeat(100) + '\u0000';
chores = ok(add(chores, 'other', 'other', { otherName: `  ${longName} ` }));
assert.equal(chores.entries.other.name, 'A'.repeat(80));
assert.equal(chores.entries.other.cents, null);
assert.equal(chores.entries.other.status, 'waiting');
chores = ok(add(chores, 'parent', 'trash', { date: MON, by: 'parent' }));
assert.equal(chores.entries.parent.by, 'parent');
rejected(c.removeEntry(chores, 'parent', { by: 'kid', todayIso: TUE }), 'kid cannot remove parent job');
rejected(c.removeEntry(chores, 'one', { by: 'kid', todayIso: WED }), 'kid remove today only');
chores = ok(c.removeEntry(chores, 'two', { by: 'kid', todayIso: TUE }));
assert.equal(chores.entries.two, undefined);
chores = ok(add(chores, 'two'));

// Review, bulk actions, totals, and immutable copies.
const before = chores;
rejected(c.setEntryStatus(chores, 'other', 'confirmed', later), 'other needs price');
chores = ok(c.setEntryStatus(chores, 'one', 'declined', later));
assert.equal(before.entries.one.status, 'waiting', 'old state is unchanged');
assert.equal(chores.entries.one.checkedAt, later);
chores = ok(c.setEntryStatus(chores, 'one', 'waiting', later));
assert.equal(chores.entries.one.checkedAt, null);
chores = ok(c.setEntryStatus(chores, 'one', 'confirmed', later));
rejected(c.removeEntry(chores, 'one', { by: 'kid', todayIso: TUE }), 'kid cannot remove reviewed job');
chores = ok(c.setEntryStatus(chores, 'one', 'declined', later));
assert.ok(chores.entries.one, 'declined stays in list');
chores = ok(c.setEntryStatus(chores, 'one', 'waiting', later));
const day = c.confirmDay(chores, TUE, later);
assert.deepEqual([day.confirmed, day.skipped], [2, 1]);
chores = ok(day);
assert.deepEqual([c.confirmDay(chores, TUE, later).confirmed, c.confirmDay(chores, TUE, later).skipped], [0, 1]);
const week = c.confirmWeek(chores, MON, later);
assert.deepEqual([week.confirmed, week.skipped], [1, 1]);
chores = ok(week);
assert.equal(c.confirmWeek(chores, MON, later).confirmed, 0);
assert.equal(c.weekTotals(chores, MON).confirmedCents, 225);
assert.equal(c.weekTotals(chores, MON).confirmedJobs, 3);
assert.equal(c.weekTotals(chores, MON).unpriced, 1);
assert.equal(c.dayEntries(chores, TUE).length, 3);
assert.equal(c.weekEntries(chores, MON).length, 4);
chores = ok(c.setEntryPrice(chores, 'other', 300));
chores = ok(c.setEntryStatus(chores, 'other', 'declined', later));
assert.equal(c.weekTotals(chores, MON).confirmedCents, 225, 'declined money excluded');
assert.equal(c.weekTotals(chores, MON).declinedCents, 300);
rejected(c.setEntryPrice(chores, 'one', 0.5), 'float price');
for (const invalid of [-1, 100001, NaN, '75']) rejected(c.setEntryPrice(chores, 'one', invalid), 'invalid entry price');
chores = ok(c.setEntryDate(chores, 'parent', '2026-11-01'));
assert.equal(c.weekTotals(chores, MON).confirmedCents, 225);
assert.equal(c.monthTotals(chores, '2026-10').confirmedCents, 150, 'month based on entry date');
assert.equal(c.monthTotals(chores, '2026-11').confirmedCents, 75, 'cross-month Sunday');
chores = ok(c.setEntryDate(chores, 'parent', MON));

// Settings affect future entries only; names and prices remain on earlier entries.
chores = ok(c.setJobPrice(chores, 'trash', 999));
chores = ok(add(chores, 'after-price'));
assert.equal(chores.entries['after-price'].cents, 999);
assert.equal(chores.entries.one.cents, 75);
chores = ok(c.setJobActive(chores, 'trash', false));
assert.equal(c.activeJobs('guided', chores).some((j) => j.id === 'trash'), false);
assert.equal(chores.entries.one.name, 'Take out trash');
for (const invalid of [-1, 100001, 0.1, '25']) rejected(c.setJobPrice(chores, 'trash', invalid), 'job price validation');
chores = ok(c.addCustomJob(chores, { id: '  Wash Car! ', name: 'Wash car', es: 'Lavar el carro', icon: '🚗', cents: 500 }));
assert.equal(chores.jobs.custom[0].id, 'wash-car');
rejected(c.addCustomJob(chores, { id: 'wash-car', name: 'Again', cents: 1 }), 'duplicate custom ID');
rejected(c.addCustomJob(chores, { id: 'x', name: 'X', cents: -1 }), 'invalid custom price');
chores = ok(add(chores, 'car', 'wash-car'));
assert.equal(chores.entries.car.name, 'Wash car');
chores = ok(c.setJobActive(chores, 'wash-car', false));
assert.equal(c.activeJobs('guided', chores).some((j) => j.id === 'wash-car'), false);
chores = ok(c.removeCustomJob(chores, 'wash-car'));
assert.equal(chores.entries.car.name, 'Wash car');
rejected(c.removeCustomJob(chores, 'wash-car'), 'already removed');

// Calendar UTC arithmetic, including Sunday, year rollover and leap day.
const dates = c.weekDates('2026-10-26');
assert.deepEqual(dates, ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01']);
for (const date of dates) assert.equal(c.weekMonday(date), MON);
assert.equal(c.weekMonday('2027-01-01'), '2026-12-28');
assert.equal(c.weekMonday('2024-02-29'), '2024-02-26');
assert.deepEqual(c.weekDates('2024-02-26').slice(2, 5), ['2024-02-28', '2024-02-29', '2024-03-01']);
assert.equal(c.monthKey('2024-02-29'), '2024-02');
assert.equal(c.isIso('2024-02-29'), true);
for (const invalid of ['2023-02-29', '2026-02-30', '2026-1-01', 'bogus', null, []]) {
  assert.equal(c.isIso(invalid), false);
  assert.equal(c.weekMonday(invalid), null);
  assert.equal(c.monthKey(invalid), null);
}
assert.deepEqual(c.weekDates('2026-10-27'), []);

// Payment lock covers every entry mutation and both endpoints of a date move.
let payable = c.emptyChores();
rejected(c.payWeek(payable, MON, later), 'nothing confirmed');
payable = ok(add(payable, 'pay-one'));
rejected(c.payWeek(payable, MON, later), 'waiting entry');
payable = ok(c.setEntryStatus(payable, 'pay-one', 'confirmed', later));
payable = ok(add(payable, 'pay-waiting'));
rejected(c.payWeek(payable, MON, later), 'waiting entry alongside confirmed entry');
payable = ok(c.removeEntry(payable, 'pay-waiting', { by: 'parent' }));
payable = ok(c.payWeek(payable, MON, later));
assert.deepEqual(payable.paid[MON].entryIds, ['pay-one']);
assert.equal(payable.paid[MON].cents, 75);
rejected(c.payWeek(payable, MON, later), 'already paid');
rejected(add(payable, 'pay-two'), 'paid add');
rejected(c.removeEntry(payable, 'pay-one', { by: 'parent' }), 'paid remove');
rejected(c.setEntryStatus(payable, 'pay-one', 'declined', later), 'paid status');
rejected(c.setEntryPrice(payable, 'pay-one', 100), 'paid price');
rejected(c.setEntryDate(payable, 'pay-one', WED), 'paid date');
rejected(c.confirmDay(payable, TUE, later), 'paid bulk day');
rejected(c.confirmWeek(payable, MON, later), 'paid bulk week');
let move = ok(add(c.emptyChores(), 'outside', 'trash', { date: '2026-11-02', by: 'parent' }));
move = { ...move, paid: payable.paid };
rejected(c.setEntryDate(move, 'outside', TUE), 'move into paid week');
payable = ok(c.reopenWeek(payable, MON));
assert.equal(payable.paid[MON], undefined);
payable = ok(c.setEntryPrice(payable, 'pay-one', 100));
assert.equal(payable.entries['pay-one'].cents, 100);

// Exact same jar arithmetic as Payday Helper, including the odd-cent cases.
for (const amount of [0, 1, 5, 9, 10, 99, 1075, 100000]) {
  const split = c.splitCents(amount);
  assert.equal(split.give + split.save + split.spend, amount);
  assert.equal(split.spend >= 0, true);
}
assert.deepEqual(c.splitCents(1075), { give: 108, save: 215, spend: 752 });

// Hostile saved data must normalize to stable, bounded canonical objects.
for (const bad of [null, 3, [], 'oops', new Date(), Object.create({ entries: { evil: true } })]) {
  assert.deepEqual(c.normalizeChores(bad), c.emptyChores());
}
const hostile = JSON.parse(`{"jobs":{"overrides":{"__proto__":{"active":false},"trash":{"cents":"100","active":false}},"custom":[{"id":"custom","name":"${'X'.repeat(90)}","es":"Y","cents":25}]},"entries":{"__proto__":{"id":"__proto__"},"bad":{"date":"2026-02-30"},"float":{"date":"2026-10-27","jobId":"trash","name":"Float","cents":1.5,"status":"waiting","by":"kid"},"string":{"date":"2026-10-27","jobId":"trash","name":"String","cents":"75","status":"waiting","by":"kid"},"negative":{"date":"2026-10-27","jobId":"trash","name":"Negative","cents":-1,"status":"waiting","by":"kid"},"unknown":{"date":"2026-10-27","jobId":"trash","name":"Unknown","cents":75,"status":"maybe","by":"kid"},"good":{"date":"2026-10-27","jobId":"trash","name":"${'N'.repeat(90)}","es":"Name","icon":"🗑️","cents":75,"status":"confirmed","by":"kid","addedAt":"2026-10-27T12:00:00Z","checkedAt":"2026-10-27T20:00:00Z"}},"paid":{"2026-10-26":{"cents":75,"paidAt":"2026-10-27T20:00:00Z","entryIds":["missing"]}}}`);
const clean = c.normalizeChores(hostile);
assert.deepEqual(Object.keys(clean), ['jobs', 'entries', 'paid', 'math', 'savingsUsed']);
assert.equal(clean.jobs.overrides.trash.active, false);
assert.equal(clean.jobs.overrides.trash.cents, undefined);
assert.equal(clean.jobs.custom[0].name.length, 80);
assert.deepEqual(Object.keys(clean.entries), ['good']);
assert.equal(clean.entries.good.name.length, 80);
assert.deepEqual(clean.paid, {});
assert.equal(Object.prototype.hasOwnProperty.call(clean.entries, '__proto__'), false);
assert.deepEqual(c.normalizeChores(clean), clean);
const validPaid = c.normalizeChores({ entries: { good: clean.entries.good }, paid: {
  [MON]: { cents: 75, paidAt: later, entryIds: ['good'] },
} });
assert.deepEqual(validPaid.paid[MON], { cents: 75, paidAt: later, entryIds: ['good'] });
assert.deepEqual(c.normalizeChores(validPaid), validPaid);
const usedPaid = { ...validPaid, paid: { [MON]: { ...validPaid.paid[MON], helperUsedAt: later } } };
assert.equal(c.normalizeChores(usedPaid).paid[MON].helperUsedAt, later);
assert.equal(c.normalizeChores({ ...usedPaid, paid: { [MON]: { ...usedPaid.paid[MON], helperUsedAt: 'bad' } } }).paid[MON].helperUsedAt, undefined);
assert.equal(ok(c.reopenWeek(usedPaid, MON)).paid[MON], undefined);
// Bad data that could never come from the screens: a waiting job inside a paid week (it could never be removed),
// and a custom job borrowing the built-in "other" id.
const waitingInPaid = c.normalizeChores({ ...validPaid, entries: { ...validPaid.entries, stuck: { ...validPaid.entries.good, id: 'stuck', status: 'waiting', checkedAt: null } } });
assert.equal(waitingInPaid.entries.stuck, undefined, 'a waiting job inside a paid week is dropped');
assert.ok(waitingInPaid.entries.good && waitingInPaid.paid[MON], 'the paid week and its jobs stay');
const declinedInPaid = c.normalizeChores({ ...validPaid, entries: { ...validPaid.entries, nope: { ...validPaid.entries.good, id: 'nope', status: 'declined' } } });
assert.ok(declinedInPaid.entries.nope, 'a not-done job inside a paid week is allowed');
const otherCustom = c.normalizeChores({ jobs: { custom: [{ id: 'other', name: 'Sneaky', cents: 100, icon: '⭐', es: '' }, { id: 'mine', name: 'Mine', cents: 100, icon: '⭐', es: '' }] } });
assert.deepEqual(otherCustom.jobs.custom.map((job) => job.id), ['mine'], 'a custom job cannot reuse the reserved "other" id');
const backup = c.exportChores({ track: 'guided', chores: usedPaid }, later);
assert.deepEqual(backup, { format: 'codequest-chores', version: 1, exportedAt: later, track: 'guided', chores: usedPaid });
assert.deepEqual(c.importChores(c.emptyChores(), backup, 'replace', 'guided').chores, usedPaid);
assert.deepEqual(c.importChores(c.emptyChores(), backup, 'merge', 'guided').chores, usedPaid);
assert.match(c.importChores(c.emptyChores(), backup, 'merge', 'standard').error, /younger son's iPad/);
assert.match(c.importChores(c.emptyChores(), { ...backup, track: 'standard' }, 'merge', 'guided').error, /older son's iPad/);
for (const invalid of [null, 5, [], { ...backup, format: 'other' }, { ...backup, version: 2 },
  { ...backup, chores: { entries: Array.from({ length: 5001 }) } },
  { ...backup, chores: { entries: Object.fromEntries(Array.from({ length: 5001 }, (_, i) => [`e${i}`, clean.entries.good])) } }]) {
  rejected(c.importChores(validPaid, invalid, 'merge', 'guided'), 'hostile backup');
}
const downgraded = { ...backup, chores: { ...backup.chores, entries: {
  good: { ...clean.entries.good, status: 'waiting', checkedAt: null, cents: 0 },
  newone: { ...clean.entries.good, id: 'newone', date: '2026-11-02' },
} } };
const preserved = c.importChores(validPaid, downgraded, 'merge', 'guided');
assert.equal(preserved.chores.entries.good.status, 'confirmed', 'merge must not downgrade confirmed entries');
assert.equal(preserved.chores.entries.good.cents, 75);
assert.equal(preserved.chores.entries.newone.status, 'confirmed');
const unpaidPreserved = c.importChores({ ...validPaid, paid: {} }, downgraded, 'merge', 'guided');
assert.equal(unpaidPreserved.chores.entries.good.status, 'confirmed', 'unpaid confirmed entry cannot be downgraded');
const paidCollision = c.importChores(usedPaid, { ...backup, chores: { ...backup.chores, entries: {
  outsider: { ...clean.entries.good, id: 'outsider' },
} } }, 'merge', 'guided');
assert.equal(paidCollision.chores.entries.outsider, undefined, 'merge cannot add into a paid week');
const prototypeBackup = JSON.parse(JSON.stringify(backup).replace('"entries":{', '"entries":{"__proto__":{"bad":true},'));
assert.equal(Object.prototype.hasOwnProperty.call(c.importChores(c.emptyChores(), prototypeBackup, 'replace', 'guided').chores.entries, '__proto__'), false);
const manyEntries = {};
for (let i = 0; i < 5100; i++) manyEntries[`id${i}`] = { ...clean.entries.good, id: `id${i}` };
assert.equal(Object.keys(c.normalizeChores({ entries: manyEntries }).entries).length, 5000);
assert.equal(c.normalizeChores({ entries: { nan: { ...clean.entries.good, cents: NaN } } }).entries.nan, undefined);

// Legacy store and core save/load preserve all older fields; helpers touch only chores.
localStorage.clear();
const legacy = store.emptyStore();
assert.equal('chores' in legacy, false, 'an iPad that never logged a chore keeps the exact legacy store shape');
legacy.track = 'guided';
legacy.history = { '2026-10-27': { iso: TUE, status: 'complete', weekId: 'week-17', dayKey: 'tuesday', updatedAt: NOW } };
localStorage.setItem('codequest-daily-v1', JSON.stringify(legacy));
const oldLoaded = store.load();
assert.equal('chores' in oldLoaded, false, 'loading an old store adds no chores key');
assert.deepEqual(oldLoaded, legacy);
const updated = store.withChores(oldLoaded, (current) => add(current, 'stored'));
assert.throws(() => store.withChores(oldLoaded, () => ({ error: 'no change' })), /no change/);
assert.deepEqual(store.choresOf(updated), updated.chores);
const { chores: _after, ...otherAfter } = updated;
assert.deepEqual(otherAfter, oldLoaded, 'withChores changes only chores');
assert.deepEqual(store.choresOf(oldLoaded), c.emptyChores());
assert.equal(store.saveCore(updated).ok, true);
assert.deepEqual(store.load().chores, updated.chores);
assert.deepEqual(c.normalizeChores(store.load().chores), updated.chores);
assert.equal(store.saveCore({ ...updated, chores: validPaid }).ok, true);
assert.deepEqual(store.load().chores, validPaid, 'paid records survive core round-trip');
assert.equal(store.saveCore(updated).ok, true);
const committed = store.commit(store.load(), (s) => store.withChores(s, (ch) => c.setEntryStatus(ch, 'stored', 'confirmed', later)));
assert.equal(committed.core.ok, true);
assert.equal(store.refreshed(updated).chores.entries.stored.status, 'confirmed');
assert.equal(store.load().chores.entries.stored.status, 'confirmed');

assert.ok(readFileSync(new URL('../src/daily/chores.js', import.meta.url), 'utf8').includes("import { jarAmounts }"));
console.log('ok — daily chores: catalog, entry rules, review, totals, payment, normalization, store persistence');
