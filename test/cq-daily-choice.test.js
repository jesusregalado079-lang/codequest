// Multiple-choice item kind for the Daily Work iPad page: the action, the neutral kid markup, the
// locked row, and the parent-side suggestion/markup/grading. Items are defined inline here (the
// shipped content is frozen), and the content-taking helpers accept an optional `content` argument
// for exactly this reason.
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

const { Item } = await import('../src/cq/daily-work/content.js');
const { itemWithSheet, ready, storedItem, updateDailyWork, choiceLabel } = await import('../src/cq/daily-work/daily-work-ui.js');
const { normalizeDailyWork } = await import('../src/cq/daily-work/state.js');
const { renderSheetArticle, applyDailyAction } = await import('../src/daily/sheet-view.js');
const { gradeSuggestion, gradeDailyWork, renderParent, createParentState } = await import('../src/daily/parent-view.js');

const CHOICES = [
  'He was afraid there were so many of them that they might join his enemies in a war',
  "They had broken the king's laws",
  'They had refused to pay their taxes',
];
const NOTE = 'Exodus 1:9-10. SECRET-PARENT-NOTE-TEXT';
const choiceItem = (answer) => Item('q1', 'multiple-choice', 'Why did the new king make the Israelites work as slaves?', {
  choices: CHOICES, answer, parentNote: NOTE,
});
const numberItem = Item('n1', 'numeric', 'What is 2 + 2?', { answer: 4 });
const sheetFor = (answer) => ({ id: 'bible', title: 'Bible Reading', subject: 'bible', intro: null, example: null, items: [choiceItem(answer), numberItem] });
const weekFor = (answer) => ({
  id: 'week-test', label: 'Week Test', assignedWeekOf: '2026-10-12', weekItems: [],
  days: { monday: { sheets: [sheetFor(answer)] }, tuesday: { sheets: [] }, wednesday: { sheets: [] }, thursday: { sheets: [] }, friday: { sheets: [] } },
});
const content = { guided: { weeks: { 'week-test': weekFor('A') } } };
const empty = () => ({ track: 'guided', dailyWork: { weeks: {} } });
const at = (cq, sheet = 'bible', item = 'q1') => cq.dailyWork.weeks['week-test'].days.monday.sheets[sheet].items[item];
const ref = { week: 'week-test', day: 'monday', sheet: 'bible', item: 'q1' };
const pick = (cq, letter, extra = {}) => updateDailyWork(cq, 'daily-choice', { ...ref, kind: 'multiple-choice', answer: 'A', choiceCount: 3, ...extra }, letter, '2026-10-12T12:00:00.000Z');

// --- the action -----------------------------------------------------------------------------
let cq = pick(empty(), 'B');
assert.equal(at(cq).value, 'B', 'the action stores the letter');
assert.equal(at(cq).status, 'answered', 'a pick flips status to answered');
assert.equal(at(cq).checkedAt, null);
cq = pick(cq, 'C');
assert.equal(at(cq).value, 'C', 'a different pick replaces the earlier one');
cq = pick(cq, 'C');
assert.equal(at(cq).value, 'C', 'picking the already-picked letter keeps it');
assert.equal(at(cq).status, 'answered');

// Invalid input returns the very same object (state untouched).
const base = pick(empty(), 'A');
['D', 'E', 'Z', 'a', 'b', '', ' ', 'AB', 'A;B', '<script>alert(1)</script>', '__proto__', null, undefined, 1, 0, ['A'], { letter: 'A' }].forEach((bad) => {
  assert.equal(pick(base, bad), base, `invalid pick ${JSON.stringify(bad)} is ignored (D/E are beyond 3 choices)`);
});
assert.equal(at(base).value, 'A', 'the earlier pick survives invalid input');
// Without a choice count only the A-E range applies.
assert.equal(at(pick(empty(), 'E', { choiceCount: undefined })).value, 'E');
assert.equal(pick(empty(), 'F', { choiceCount: undefined }).dailyWork.weeks['week-test'], undefined, 'F is outside A-E');
assert.equal(at(pick(empty(), 'E', { choiceCount: 5 })).value, 'E');
assert.equal(pick(base, 'C', { choiceCount: 2 }), base, 'C is out of range for a 2-choice item');

// applyDailyAction derives the choice count from the authored item (no data-* needed on the page).
const viaApply = (store, letter) => applyDailyAction(store, 'daily-choice', ref, letter, '2026-10-12T12:00:00.000Z', content);
let applied = viaApply(empty(), 'C');
assert.equal(at(applied).value, 'C');
assert.equal(viaApply(applied, 'D'), applied, 'D is beyond the authored 3 choices');

// --- submit readiness -----------------------------------------------------------------------
const sheets = [{ ...sheetFor('A'), items: itemWithSheet(sheetFor('A')) }];
const day = (store) => (((store.dailyWork.weeks['week-test'] || {}).days || {}).monday) || { sheets: {} };
assert.equal(ready(day(empty()), sheets), false, 'nothing picked: not ready');
const numberOnly = updateDailyWork(empty(), 'daily-input', { ...ref, item: 'n1', kind: 'numeric' }, '4', null);
assert.equal(ready(day(numberOnly), sheets), false, 'the number alone is not enough, the pick is still missing');
assert.equal(ready(day(pick(numberOnly, 'B')), sheets), true, 'ready once every item (including the pick) has a value');
assert.equal(storedItem(day(pick(empty(), 'B')), 'bible', 'q1').value, 'B');

// --- kid markup -----------------------------------------------------------------------------
const kidHtml = (answer, store = empty(), reopened = false) => {
  const week = weekFor(answer);
  return renderSheetArticle(week, 'monday', week.days.monday.sheets[0], day(store), reopened);
};
const htmlA = kidHtml('A');
const htmlC = kidHtml('C');
assert.equal(htmlA, htmlC, 'kid HTML is byte-identical whichever choice is correct');
assert.equal(kidHtml('A', cq), kidHtml('C', cq), 'still identical with a pick saved');
assert.equal(kidHtml('A', pick(empty(), 'A')), kidHtml('C', pick(empty(), 'A')), 'a pick on the correct answer looks the same as a pick on a wrong one');
assert.equal(htmlA.includes('SECRET-PARENT-NOTE-TEXT'), false, 'the parent note never reaches the kid page');
assert.equal(htmlA.includes('Exodus 1:9'), false);
assert.equal(/correct|wrong|incorrect|right/i.test(htmlA.replace(/Why did the new king[^<]*/, '')), false, 'no correctness wording or class in the kid markup');

const doc = new JSDOM(`<main>${kidHtml('A', pick(empty(), 'B'))}</main>`).window.document;
const group = doc.querySelector('[role="radiogroup"]');
assert.ok(group, 'the choices are a radiogroup');
assert.ok(group.getAttribute('aria-labelledby') && doc.getElementById(group.getAttribute('aria-labelledby')), 'the group is labelled by the prompt');
const cards = [...group.querySelectorAll('[role="radio"]')];
assert.equal(cards.length, 3, 'one card per choice');
assert.deepEqual(cards.map((card) => card.dataset.value), ['A', 'B', 'C']);
assert.deepEqual(cards.map((card) => card.getAttribute('aria-checked')), ['false', 'true', 'false'], 'only the picked card is checked');
assert.deepEqual(cards.map((card) => card.dataset.action), ['daily-choice', 'daily-choice', 'daily-choice']);
assert.ok(cards.every((card) => card.tagName === 'BUTTON' && card.getAttribute('type') === 'button'), 'cards are real buttons');
assert.ok(cards.every((card) => card.dataset.week === 'week-test' && card.dataset.sheet === 'bible' && card.dataset.item === 'q1'), 'cards carry the usual item data attributes');
assert.ok(cards[1].classList.contains('is-picked') && !cards[0].classList.contains('is-picked') && !cards[2].classList.contains('is-picked'));
assert.equal(cards[2].textContent.replace(/\s+/g, ' ').trim(), `C${CHOICES[2]}`, 'letter badge plus the choice text');
assert.deepEqual(cards.flatMap((card) => Object.keys(card.dataset)).filter((key) => /answer|correct|note/i.test(key)), [], 'no answer-like data attribute on any card');
assert.equal(doc.querySelectorAll('[data-answer], [data-correct], [data-parent-note]').length, 0);
// The numeric neighbour still renders as before.
assert.ok(doc.querySelector('input[data-kind="numeric"]'), 'other kinds are untouched');
// The text is escaped.
const hostile = { id: 'h', kind: 'multiple-choice', prompt: 'p', choices: ['<img src=x onerror=alert(1)>', 'ok'], answer: 'B' };
const hostileHtml = renderSheetArticle(weekFor('A'), 'monday', { id: 'bible', title: 'T', subject: 'bible', items: [hostile] }, { sheets: {} }, false);
assert.equal(hostileHtml.includes('<img'), false, 'choice text is escaped');

// --- locked row -----------------------------------------------------------------------------
const lockedState = { sheets: { bible: { items: { q1: { value: 'B', status: 'correct', checkedAt: '2026-10-12T13:00:00.000Z' } } } }, submittedAt: null };
const lockedDoc = new JSDOM(`<main>${renderSheetArticle(weekFor('B'), 'monday', weekFor('B').days.monday.sheets[0], lockedState, true)}</main>`).window.document;
assert.equal(lockedDoc.querySelector('.cqd-locked').textContent.trim(), `B: ${CHOICES[1]}`, 'a locked row shows the letter and its text');
assert.equal(lockedDoc.querySelectorAll('[role="radio"]').length, 0, 'a locked item has no cards to tap');
assert.equal(choiceLabel(choiceItem('A'), 'C'), `C: ${CHOICES[2]}`);
assert.equal(choiceLabel(choiceItem('A'), 'D'), null);
assert.equal(choiceLabel(choiceItem('A'), null), null);

// --- parent suggestion ----------------------------------------------------------------------
assert.equal(gradeSuggestion(choiceItem('A'), 'A'), true);
assert.equal(gradeSuggestion(choiceItem('A'), 'B'), false);
assert.equal(gradeSuggestion(choiceItem('C'), 'C'), true);
assert.equal(gradeSuggestion(choiceItem('A'), null), false, 'unanswered does not throw and is never suggested Correct');
assert.equal(gradeSuggestion(choiceItem('A'), undefined), false);
assert.equal(gradeSuggestion({ kind: 'multiple-choice', choices: CHOICES }, 'A'), false, 'an item with no answer is never suggested Correct');
assert.equal(gradeSuggestion(numberItem, 4), true, 'numeric grading is unchanged');
assert.equal(gradeSuggestion(Item('s', 'short-text', 'p'), 'x'), null, 'free text still has no suggestion');

// --- parent markup --------------------------------------------------------------------------
const parentStore = (extra) => ({ ...empty(), parent: { pinHash: 'x', pinSalt: 'y', failCount: 0, lockUntil: 0, unlockedUntil: Date.now() + 3600000, resets: [] }, ...extra });
const parentText = (store, answer = 'A') => {
  const html = renderParent(store, { ...createParentState(), selectedDay: 'monday' }, '2026-10-12', Date.now(), { guided: { weeks: { 'week-test': weekFor(answer) } } });
  const parentDoc = new JSDOM(`<main>${html}</main>`).window.document;
  return { html, doc: parentDoc, text: parentDoc.body.textContent.replace(/\s+/g, ' ') };
};
const picked = parentText(parentStore({ dailyWork: pick(empty(), 'B').dailyWork }), 'A');
assert.ok(picked.text.includes(`Answer: B: ${CHOICES[1]}`), 'parent sees the pick as "B: text"');
assert.ok(picked.text.includes(`Correct choice: A: ${CHOICES[0]}`), 'parent sees the correct choice');
assert.ok(picked.text.includes('For you: Exodus 1:9-10. SECRET-PARENT-NOTE-TEXT'), 'parent sees the note');
assert.ok(picked.text.includes('Suggested: Incorrect'), 'a wrong pick is pre-suggested Incorrect');
const firstGrade = picked.doc.querySelectorAll('.cqd-check-item')[0].querySelectorAll('[data-action="daily-parent-grade"]');
assert.deepEqual([...firstGrade].map((button) => button.getAttribute('aria-pressed')), ['false', 'true'], 'Incorrect is pre-selected for a wrong pick');
const right = parentText(parentStore({ dailyWork: pick(empty(), 'A').dailyWork }), 'A');
assert.ok(right.text.includes('Suggested: Correct'));
const rightGrade = right.doc.querySelectorAll('.cqd-check-item')[0].querySelectorAll('[data-action="daily-parent-grade"]');
assert.deepEqual([...rightGrade].map((button) => button.getAttribute('aria-pressed')), ['true', 'false']);
const blank = parentText(parentStore({}), 'A');
assert.ok(blank.text.includes('Answer: Not answered'), 'unanswered shows "Not answered"');
assert.ok(blank.text.includes(`Correct choice: A: ${CHOICES[0]}`));

// --- grading: Incorrect clears the value and reopens just that item -------------------------
const answeredBoth = updateDailyWork(pick(empty(), 'B'), 'daily-input', { ...ref, item: 'n1', kind: 'numeric' }, '4', null);
const graded = gradeDailyWork(answeredBoth, 'week-test', 'monday', { 'bible/q1': 'wrong', 'bible/n1': 'correct' }, '2026-10-12T14:00:00.000Z', content);
assert.equal(at(graded).value, null, 'wrong clears the stored pick');
assert.equal(at(graded).status, 'wrong');
assert.equal(at(graded).checkedAt, '2026-10-12T14:00:00.000Z');
assert.equal(at(graded, 'bible', 'n1').status, 'correct', 'the other item is not reopened');
assert.equal(at(graded, 'bible', 'n1').value, 4);
const regraded = gradeDailyWork(pick(graded, 'A'), 'week-test', 'monday', { 'bible/q1': 'correct' }, '2026-10-12T15:00:00.000Z', content);
assert.equal(at(regraded).status, 'correct');
assert.equal(at(regraded).value, 'A', 'a repicked, correct answer keeps its letter');
// The reopened item shows its cards again, empty.
const reopenedDoc = new JSDOM(`<main>${renderSheetArticle(weekFor('A'), 'monday', weekFor('A').days.monday.sheets[0], day(graded), true)}</main>`).window.document;
assert.equal(reopenedDoc.querySelectorAll('[role="radio"]').length, 3, 'a wrong item reopens as tappable cards');
assert.equal(reopenedDoc.querySelectorAll('[aria-checked="true"]').length, 0, 'with nothing picked');
assert.equal(reopenedDoc.querySelectorAll('.cqd-item-locked').length, 1, 'while the correct neighbour stays locked');

// --- saved state: old shapes still load, and a stored letter survives ------------------------
const oldShape = { weeks: { 'week-11': { days: { monday: { submittedAt: null, sheets: { practice: { items: { number: { value: 50, status: 'answered', checkedAt: null } } } } } } } } };
assert.deepEqual(normalizeDailyWork(oldShape), normalizeDailyWork(JSON.parse(JSON.stringify(oldShape))), 'normalizing is stable');
assert.equal(normalizeDailyWork(oldShape).weeks['week-11'].days.monday.sheets.practice.items.number.value, 50, 'an old numeric value is unchanged');
const withLetter = normalizeDailyWork({ weeks: { 'week-11': { days: { monday: { submittedAt: null, sheets: { 'bible-reading': { items: { q1: { value: 'B', status: 'answered', checkedAt: null } } } } } } } } });
assert.equal(withLetter.weeks['week-11'].days.monday.sheets['bible-reading'].items.q1.value, 'B', 'a stored letter is a plain string and round-trips');
assert.deepEqual(normalizeDailyWork(undefined), { weeks: {} });

console.log('cq-daily-choice tests passed');
