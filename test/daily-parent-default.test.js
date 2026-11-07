// Check work: answers with no automatic right/wrong (typed sentences, the level reached, 1-to-5 ratings)
// start on Correct once the boy has answered them, so a grown-up's plain Save finishes the day.
// Before this, Save skipped them and Tuesday, Wednesday and Friday stayed "Waiting on a parent" forever.
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

class MemoryStorage {
  #data = new Map();
  getItem(key) { return this.#data.has(key) ? this.#data.get(key) : null; }
  setItem(key, value) { this.#data.set(key, String(value)); }
  removeItem(key) { this.#data.delete(key); }
  clear() { this.#data.clear(); }
}
globalThis.localStorage = new MemoryStorage();

const { createParentState, gradeDailyWork, renderParent } = await import('../src/daily/parent-view.js');
const { dayStatus } = await import('../src/daily/calendar.js');
const { sheetsForDay } = await import('../src/daily/sheet-view.js');
const { storedDay } = await import('../src/cq/daily-work/daily-work-ui.js');
const { DAILY_WORK } = await import('../src/cq/daily-work/content.js');

const NOW = Date.parse('2026-11-04T20:00:00Z');
const DATES = { monday: '2026-11-02', tuesday: '2026-11-03', wednesday: '2026-11-04', thursday: '2026-11-05', friday: '2026-11-06' };
const modelValue = (item) => {
  if (item.kind === 'numeric' || item.kind === 'multiple-choice') return item.answer;
  if (item.kind === 'fill-blank') return [...item.answer];
  if (item.kind === 'scale') return '3';
  return 'I built a loop and it worked.';
};
function handedIn(track, dayKey, valueFor = modelValue, status = () => 'answered') {
  const week = DAILY_WORK[track].weeks['week-17'];
  const sheets = {};
  for (const sheet of sheetsForDay(week, dayKey)) {
    sheets[sheet.id] = { items: Object.fromEntries(sheet.items.map((item) => [item.id, { value: valueFor(item), status: status(item), checkedAt: null }])) };
  }
  return { track, parent: { pinHash: 'x', pinSalt: 'y', failCount: 0, lockUntil: 0, unlockedUntil: NOW + 60000, resets: [] },
    dailyWork: { weeks: { 'week-17': { days: { [dayKey]: { submittedAt: '2026-11-04T19:00:00.000Z', sheets } } } } },
    drawings: {}, history: {}, blockFills: {}, payday: { sessions: [] } };
}
// Exactly what the app's Save button does: read every pressed grade button, then grade.
function pressSave(store, dayKey) {
  const state = createParentState(); state.selectedDay = dayKey;
  const doc = new JSDOM(renderParent(store, state, DATES[dayKey], NOW)).window.document;
  const choices = {};
  doc.querySelectorAll('[data-action="daily-parent-grade"][aria-pressed="true"]').forEach((b) => { choices[b.dataset.gradeKey] = b.dataset.choice; });
  return { doc, graded: gradeDailyWork(store, 'week-17', dayKey, choices, '2026-11-04T20:00:00.000Z') };
}
const statusOf = (store, track, dayKey) => dayStatus(storedDay(store, 'week-17', dayKey), sheetsForDay(DAILY_WORK[track].weeks['week-17'], dayKey));

for (const track of ['guided', 'standard']) {
  for (const dayKey of Object.keys(DATES)) {
    const { graded } = pressSave(handedIn(track, dayKey), dayKey);
    assert.equal(statusOf(graded, track, dayKey), 'complete', `${track} ${dayKey}: a plain Save on fully answered work shows the day done`);
  }
}

// The open answers really are on Correct, with a line saying so.
{
  const { doc } = pressSave(handedIn('guided', 'wednesday'), 'wednesday');
  const open = [...doc.querySelectorAll('.cqd-check-item')].filter((li) => /No right answer to check here/.test(li.textContent));
  assert.ok(open.length >= 3, `Wednesday has open answers (${open.length})`);
  for (const li of open) assert.equal(li.querySelector('[data-choice="correct"]').getAttribute('aria-pressed'), 'true');
}
// An open answer the grown-up already marked Incorrect stays Incorrect (the day goes back for fixes).
{
  const store = handedIn('guided', 'wednesday', modelValue, (item) => (item.kind === 'scale' ? 'wrong' : 'answered'));
  const { graded } = pressSave(store, 'wednesday');
  assert.equal(statusOf(graded, 'guided', 'wednesday'), 'needs-fixes', 'a saved Incorrect is never flipped to Correct');
}
// A wrong math answer still starts on Incorrect.
{
  const store = handedIn('guided', 'thursday', (item) => (item.kind === 'numeric' ? Number(item.answer) + 1 : modelValue(item)));
  const { graded } = pressSave(store, 'thursday');
  assert.equal(statusOf(graded, 'guided', 'thursday'), 'needs-fixes', 'wrong math is still suggested Incorrect');
}
// A blank open answer gets no default: nothing is marked Correct for an answer that is not there.
{
  const store = handedIn('guided', 'tuesday', (item) => (item.kind === 'long-text' ? null : modelValue(item)));
  const { doc, graded } = pressSave(store, 'tuesday');
  const blank = [...doc.querySelectorAll('.cqd-check-item')].find((li) => /Not answered/.test(li.textContent));
  assert.ok(blank, 'the blank answer is on the page');
  assert.equal(blank.querySelector('[aria-pressed="true"]'), null, 'a blank answer starts with neither button picked');
  assert.notEqual(statusOf(graded, 'guided', 'tuesday'), 'complete', 'a day with a blank answer is not done');
}
console.log('daily Check work default-grade tests passed');
