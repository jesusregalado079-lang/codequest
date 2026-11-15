import assert from 'node:assert/strict';
import { DAILY_WORK } from '../src/cq/daily-work/content.js';
import { renderSheetArticle, scratchProblemGroups } from '../src/daily/sheet-view.js';
import { MAX_SCRATCH_CHARS, drawingFor, emptyStore, load, saveDrawing, saveInk, scratchDrawingKey } from '../src/daily/store.js';

const disk = new Map();
globalThis.localStorage = {
  getItem(key) { return disk.get(key) ?? null; },
  setItem(key, value) { disk.set(key, value); },
  removeItem(key) { disk.delete(key); },
};
const blank = { sheets: {}, submittedAt: null };
const render = (week, day, sheet, scratchOf) => renderSheetArticle(week, day, sheet, blank, false, () => 0, () => false, scratchOf);
const expected = {
  guided: { 18: { math: ['1', '2', '3', '4'], 'word-problems': ['1', '2', '3', '4', '5'] }, 19: { math: ['1', '2', '3', '4', '5', '6', '7', '8'], 'word-problems': ['1', '2', '3', '4', '5'] } },
  standard: { 18: { math: ['1', '2', '3', '4'], 'word-problems': ['1', '2', '3'] }, 19: { math: ['1', '2', '3'], 'word-problems': ['1', '2', '3'] } },
};
for (const track of ['guided', 'standard']) for (const number of [18, 19]) {
  const week = DAILY_WORK[track].weeks[`week-${number}`];
  for (const sheet of week.days.monday.sheets) {
    const groups = scratchProblemGroups(sheet);
    assert.deepEqual(groups.map(({ id }) => id), expected[track][number][sheet.subject] || [], `${track} week ${number} ${sheet.subject}`);
    const html = render(week, 'monday', sheet);
    assert.equal((html.match(/data-action="scratch-toggle"/g) || []).length, groups.length);
    for (const { id, lastIndex } of groups) {
      assert.equal(lastIndex, sheet.items.findLastIndex((item) => new RegExp(`^${id}(?:[a-z])?$`).test(item.id)));
      assert.ok(html.includes(`data-scratch-id="${id}"`));
    }
    assert.equal(/\b(?:easy|hard|guided|standard|Jesse|Dad)\b/i.test(html), false, 'kid markup stays neutral');
  }
}
assert.equal(expected.guided[19].math.length + expected.guided[19]['word-problems'].length, 13);
assert.equal(expected.standard[19].math.length + expected.standard[19]['word-problems'].length, 6);
for (const track of ['guided', 'standard']) {
  const week13 = DAILY_WORK[track].weeks['week-13'];
  const [math, stories] = week13.days.monday.sheets;
  assert.equal(scratchProblemGroups(math).length, track === 'standard' ? 4 : 8);
  assert.equal(scratchProblemGroups(stories).length, track === 'standard' ? 3 : 4);
  if (track === 'standard') {
    assert.deepEqual(scratchProblemGroups(math)[0], { id: '3-of-10', lastIndex: 1 }, 'think-first and percent are one problem');
  }
  assert.equal((render(week13, 'monday', math).match(/data-action="scratch-toggle"/g) || []).length, scratchProblemGroups(math).length);
  assert.equal(render(week13, 'wednesday', week13.days.wednesday.sheets[0]).includes('Scratch paper'), false, 'Wednesday has no scratch, even on Math');
}
for (const track of ['guided', 'standard']) {
  const week = DAILY_WORK[track].weeks['week-19'];
  for (const day of Object.values(week.days)) for (const sheet of day.sheets) {
    if (['math', 'word-problems'].includes(sheet.subject)) continue;
    assert.deepEqual(scratchProblemGroups(sheet), []);
    assert.equal(render(week, 'wednesday', sheet).includes('Scratch paper'), false);
  }
  for (const sheet of week.weekItems) assert.equal(render(week, 'monday', sheet).includes('Scratch paper'), false);
}
const week = DAILY_WORK.guided.weeks['week-19'];
const sheet = week.days.monday.sheets[0];
const openHtml = render(week, 'monday', sheet, (id) => ({ open: id === '1', ink: true }));
assert.match(openHtml, /data-scratch-id="1"[\s\S]*?aria-expanded="true"[\s\S]*?<div class="cqd-scratch-panel" >/);
const closedHtml = render(week, 'monday', sheet, (id) => ({ ink: id === '1' }));
assert.match(closedHtml, /Scratch paper<span aria-hidden="true"> ✎<\/span>/);
assert.match(closedHtml, /<div class="cqd-scratch-panel" hidden>/);

const image = (size) => `data:image/png;base64,${'A'.repeat(size - 22)}`;
const key = scratchDrawingKey(sheet.id, '1');
assert.equal(key, `${sheet.id}-s-1`);
assert.ok(key.length <= 100);
assert.equal(scratchDrawingKey('more-or-less-then-percent', '3-of-10'), 'more-or-less-then-percent-s-3-of-10');
let saved = saveDrawing(emptyStore(), 'week-19', 'monday', key, image(1000));
assert.equal(drawingFor(saved, 'week-19', 'monday', key), image(1000));
assert.equal(saveInk(saved, ['week-19', 'monday', key]).ok, true);
assert.equal(drawingFor(load(), 'week-19', 'monday', key), image(1000));
assert.equal(saveDrawing(saved, 'week-19', 'monday', key, image(MAX_SCRATCH_CHARS + 1)), saved, 'oversize scratch rejected');
disk.clear();
const oldInk = { 'week-18': { monday: { math: image(1000) } } };
disk.set('codequest-daily-ink-v1', JSON.stringify(oldInk));
assert.deepEqual(load().drawings, oldInk, 'old ink store loads unchanged');

// Both kinds of drawing share one budget; old entries leave first, including scratch entries.
disk.clear();
let many = emptyStore();
for (let i = 1; i <= 9; i += 1) many = saveDrawing(many, `week-${i}`, 'monday', scratchDrawingKey('math', '1'), image(110000));
many = saveDrawing(many, 'week-19', 'monday', 'math', image(110000));
assert.equal(saveInk(many, ['week-19', 'monday', 'math']).ok, true);
const trimmed = JSON.parse(disk.get('codequest-daily-ink-v1'));
assert.equal(trimmed['week-1'], undefined, 'oldest scratch evicted');
assert.ok(trimmed['week-2'] && trimmed['week-19'], 'newer scratch and sheet ink kept');
disk.clear();
let sameDay = saveDrawing(emptyStore(), 'week-19', 'monday', 'math', image(110000));
for (let i = 1; i <= 9; i += 1) sameDay = saveDrawing(sameDay, 'week-19', 'monday', scratchDrawingKey('math', String(i)), image(110000));
assert.equal(saveInk(sameDay).ok, true);
const dayInk = JSON.parse(disk.get('codequest-daily-ink-v1'))['week-19'].monday;
assert.ok(dayInk.math, 'page drawing survives same-day scratch pressure');
assert.equal(dayInk['math-s-1'], undefined, 'same-day scratch leaves before page drawing');
console.log('Daily scratch grouping, rendering, neutrality, store round-trip, cap, and eviction: passed');
