import assert from 'node:assert/strict';
import { DAILY_WORK } from '../src/cq/daily-work/content.js';
import { renderSheetArticle, scratchProblemGroups } from '../src/daily/sheet-view.js';
import { MAX_SCRATCH_CHARS, drawingFor, emptyStore, load, saveDrawing, saveInk, scratchDrawingKey } from '../src/daily/store.js';
import { closedLayoutHeight, hasVisibleInk } from '../src/daily/drawing.js';

const disk = new Map();
globalThis.localStorage = {
  getItem(key) { return disk.get(key) ?? null; },
  setItem(key, value) { disk.set(key, value); },
  removeItem(key) { disk.delete(key); },
};
const blank = { sheets: {}, submittedAt: null };
assert.equal(closedLayoutHeight(900, [189, 189]), 522, 'open panel heights include their top margins');
assert.equal(closedLayoutHeight(100, []), 100);
assert.equal(closedLayoutHeight(10, [20]), 0);
const pixels = new Uint8ClampedArray(8);
const fakeCanvas = { width: 2, height: 1, getContext: () => ({ getImageData: () => ({ data: pixels }) }) };
assert.equal(hasVisibleInk(fakeCanvas), false);
pixels[0] = 255;
assert.equal(hasVisibleInk(fakeCanvas), false, 'RGB without alpha is blank');
pixels[7] = 1;
assert.equal(hasVisibleInk(fakeCanvas), true);
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
assert.equal(key, `${sheet.id}~s~1`);
assert.ok(key.length <= 100);
assert.equal(scratchDrawingKey('more-or-less-then-percent', '3-of-10'), 'more-or-less-then-percent~s~3-of-10');
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
assert.equal(dayInk['math~s~1'], undefined, 'same-day scratch leaves before page drawing');
disk.clear();
let protectedPair = saveDrawing(emptyStore(), 'week-17', 'monday', 'math', image(200000));
protectedPair = saveDrawing(protectedPair, 'week-19', 'monday', 'math', image(850000));
protectedPair = saveDrawing(protectedPair, 'week-19', 'monday', key, image(110000));
assert.equal(saveInk(protectedPair, ['week-19', 'monday', key, 'math']).ok, true);
const pairInk = JSON.parse(disk.get('codequest-daily-ink-v1'));
assert.equal(pairInk['week-17'], undefined, 'older sheet evicted before current scratch and page ink');
assert.ok(pairInk['week-19'].monday.math && pairInk['week-19'].monday[key], 'scratch and page ink both protected');
disk.clear();
assert.equal(saveInk(protectedPair, ['week-19', 'monday', key]).ok, true);
const threeElementInk = JSON.parse(disk.get('codequest-daily-ink-v1'));
assert.ok(threeElementInk['week-19'].monday[key], 'three-element keep still protects its named key');
let overBudgetPair = saveDrawing(emptyStore(), 'week-19', 'monday', 'math', image(895000));
overBudgetPair = saveDrawing(overBudgetPair, 'week-19', 'monday', key, image(115000));
disk.clear();
assert.equal(saveInk(overBudgetPair, ['week-19', 'monday', key, 'math']).ok, true);
assert.ok(JSON.parse(disk.get('codequest-daily-ink-v1'))['week-19'].monday.math, 'four-element keep protects page ink under pressure');
disk.clear();
assert.equal(saveInk(overBudgetPair, ['week-19', 'monday', key]).ok, true);
assert.equal(JSON.parse(disk.get('codequest-daily-ink-v1'))['week-19'].monday.math, undefined, 'three-element keep retains prior single-key behavior');
// A real sheet id can never look like a scratch key, now or in a future week: scratch keys use `~s~`, which no sheet id may contain.
for (const track of ['guided', 'standard']) for (const week of Object.values(DAILY_WORK[track].weeks)) {
  const sheets = [...(week.weekItems || []), ...Object.values(week.days || {}).flatMap((day) => day.sheets || [])];
  for (const sheet of sheets) assert.equal(String(sheet.id).includes('~'), false, `sheet id ${sheet.id} must not contain ~`);
}
assert.equal(scratchDrawingKey('sam-s-store', '1'), 'sam-s-store~s~1', 'a possessive-looking sheet id stays an ordinary sheet id');
console.log('Daily scratch grouping, rendering, neutrality, store round-trip, cap, and eviction: passed');
