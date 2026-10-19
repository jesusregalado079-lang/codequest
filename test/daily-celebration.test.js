import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const { DAILY_WORK } = await import('../src/cq/daily-work/content.js');
const store = await import('../src/daily/store.js');
const { weekVerse, sheetsForDay } = await import('../src/daily/sheet-view.js');
const { renderCalendar, renderVerseScreen, dayStatus } = await import('../src/daily/calendar.js');
const { gradeDailyWork, createParentState, renderParent } = await import('../src/daily/parent-view.js');
const { celebrationHtml } = await import('../src/daily/celebration.js');
const { applyDailyAction, dayReady } = await import('../src/daily/sheet-view.js');
const { storedDay } = await import('../src/cq/daily-work/daily-work-ui.js');

const RealDate = Date;
let clock = '2026-10-19T12:00:00';
globalThis.Date = class extends RealDate {
  constructor(...args) { super(...(args.length ? args : [clock])); }
  static now() { return new RealDate(clock).getTime(); }
};

const blocks = [
  { type: 'p', text: 'Congratulations, I am proud of you boys and your constant learning!' },
  { type: 'p', text: 'God loves to give good gifts to His children, and so do I. The Bible says:' },
  { type: 'quote', text: '"So if you sinful people know how to give good gifts to your children, how much more will your heavenly Father give good gifts to those who ask him." (Matthew 7:11)' },
  { type: 'p', text: 'So this week is a gift from me to you:' },
  { type: 'bullets', items: ['A whole week off from your work', '1½ hours of Fortnite this week'] },
  { type: 'p', text: 'Your Bible reading stays, because that is how we grow closer to our Father in heaven.' },
  { type: 'signoff', text: 'Love, Dad' },
];
const celebration = { id: 'week-15-break', trigger: 'bible-reading', blocks, button: "I'm ready!" };
const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const week = {
  id: 'week-15', label: 'Week 15', assignedWeekOf: '2026-10-19', weekItems: [], breakWeek: true, celebration,
  days: Object.fromEntries(dayKeys.map((day) => [day, { sheets: [{ id: `bible-${day}`, subject: 'bible-reading', title: 'Bible Reading', intro: 'Read with a grown-up.', example: null, items: [{ id: 'question', kind: 'short-text', prompt: 'What happened?', answer: 'PARENT ANSWER SECRET', parentNote: 'PARENT NOTE SECRET' }] }] }])),
};
const inlineContent = { standard: { weeks: { 'week-15': week } } };
const realWeek15 = DAILY_WORK.standard.weeks['week-15'];

const dom = new JSDOM('<!doctype html><main id="app"></main>', { url: 'https://local.test/daily.html', pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.localStorage = dom.window.localStorage;
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: dom.window.navigator });
globalThis.requestAnimationFrame = (fn) => fn();
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globalThis.matchMedia = () => ({ matches: true, addEventListener() {} });
globalThis.CSS = { escape: (value) => value };
dom.window.HTMLCanvasElement.prototype.getContext = () => ({ clearRect() {}, drawImage() {}, lineCap: '', lineJoin: '' });
dom.window.scrollBy = () => {};

function click(selector) {
  const button = document.querySelector(selector);
  assert.ok(button, `button exists: ${selector}`);
  button.click();
}

let boot = 0;
async function launch() {
  document.body.innerHTML = '<main id="app"></main>';
  await import(`../src/daily/app.js?celebration-test=${++boot}`);
}

localStorage.setItem('codequest-daily-v1', JSON.stringify({ track: 'standard', dailyWork: { weeks: {} } }));
const old = store.load();
assert.equal(old.track, 'standard');
assert.deepEqual(old.dailyWork, { weeks: {} });
assert.equal(old.celebrationsSeen, undefined, 'old store keeps its shape');
assert.equal(store.celebrationSeen(old, 'standard', celebration.id), false);
const perBoy = store.markCelebrationSeen(old, 'standard', celebration.id, '2026-10-19T12:00:00.000Z');
store.save(perBoy);
assert.equal(store.celebrationSeen(store.load(), 'standard', celebration.id), true);
assert.equal(store.celebrationSeen(store.load(), 'guided', celebration.id), false, 'each track has its own seen flag');
localStorage.setItem('codequest-daily-v1', '{"track":"standard","celebrationsSeen":{"__proto__":"2026-10-19T12:00:00.000Z","standard:week-15-break":"junk","other:bogus":"2026-10-19T12:00:00.000Z"}}');
assert.deepEqual(store.load().celebrationsSeen, {}, 'unknown and invalid seen entries are dropped');
assert.equal(({}).bogus, undefined);
localStorage.setItem('codequest-daily-v1', JSON.stringify({ track: 'standard', dailyWork: { weeks: {} } }));

assert.equal(weekVerse(week), null);
assert.equal(renderVerseScreen(store.load(), '2026-10-19', inlineContent), '');
const calendar = renderCalendar(store.load(), '2026-10-19', 2026, 9, inlineContent);
assert.doesNotMatch(calendar, /open-verse|No verse|No work|missing work/i);
assert.equal(dayKeys.every((day) => sheetsForDay(week, day).length === 1), true);
assert.equal(dayStatus(storedDay(store.load(), week.id, 'monday'), sheetsForDay(week, 'monday')), 'not-started');

const markup = celebrationHtml(celebration);
const inlineDialog = new JSDOM(markup).window.document.querySelector('[role="dialog"]');
const inlineBlocks = [...inlineDialog.querySelectorAll('.cqd-celebration-copy > h2, .cqd-celebration-copy > p, .cqd-celebration-copy > blockquote, .cqd-celebration-copy > ul')];
assert.deepEqual(inlineBlocks.map((node) => node.tagName), ['H2', 'P', 'BLOCKQUOTE', 'P', 'UL', 'P', 'P']);
assert.deepEqual(inlineBlocks.map((node) => node.tagName === 'UL' ? [...node.querySelectorAll('li')].map((li) => li.textContent) : node.textContent), blocks.map((block) => block.items || block.text));
assert.equal(inlineDialog.querySelector('[data-action="close-celebration"]').textContent, celebration.button);
assert.doesNotMatch(markup, /PARENT ANSWER SECRET|PARENT NOTE SECRET/);

let inlineStore = store.withTrack(store.emptyStore(), 'standard');
inlineStore = applyDailyAction(inlineStore, 'daily-input', { week: week.id, day: 'monday', sheet: 'bible-monday', item: 'question' }, 'He trusted God.', new Date().toISOString(), inlineContent);
assert.equal(dayReady(storedDay(inlineStore, week.id, 'monday'), sheetsForDay(week, 'monday')), true);
inlineStore = applyDailyAction(inlineStore, 'daily-submit', { week: week.id, day: 'monday' }, null, new Date().toISOString(), inlineContent);
assert.ok(storedDay(inlineStore, week.id, 'monday').submittedAt, 'one-sheet day submits');
const inlineParent = { ...inlineStore, parent: { ...inlineStore.parent, unlockedUntil: Date.now() + 60_000 } };
assert.match(renderParent(inlineParent, createParentState(), '2026-10-19', Date.now(), inlineContent), /He trusted God\./);
inlineStore = gradeDailyWork(inlineStore, week.id, 'monday', { 'bible-monday/question': 'correct' }, new Date().toISOString(), inlineContent);
assert.equal(dayStatus(storedDay(inlineStore, week.id, 'monday'), sheetsForDay(week, 'monday')), 'complete', 'parent can finish one-sheet day');

if (realWeek15) {

await launch();
click('[data-action="open-day"][data-day="monday"]');
let dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
assert.ok(dialog, 'first Bible Reading open displays celebration');
assert.equal(document.activeElement, dialog.querySelector('[data-action="close-celebration"]'), 'focus moves into dialog');
assert.equal(dialog.querySelector('[data-action="close-celebration"]').textContent, realWeek15.celebration.button);
assert.equal(dialog.querySelector('#cqd-celebration-title').textContent, realWeek15.celebration.blocks[0].text);
const renderedBlocks = [...dialog.querySelectorAll('.cqd-celebration-copy > h2, .cqd-celebration-copy > p, .cqd-celebration-copy > blockquote, .cqd-celebration-copy > ul')];
assert.deepEqual(renderedBlocks.map((node) => node.tagName), ['H2', 'P', 'BLOCKQUOTE', 'P', 'UL', 'P', 'P']);
assert.deepEqual(renderedBlocks.map((node) => node.tagName === 'UL' ? [...node.querySelectorAll('li')].map((li) => li.textContent) : node.textContent), realWeek15.celebration.blocks.map((block) => block.items || block.text));
assert.doesNotMatch(dialog.outerHTML, /PARENT ANSWER SECRET|PARENT NOTE SECRET|parentNote|answer/i);
assert.equal(dialog.querySelectorAll('.cqd-confetti').length, 16);
click('[data-action="close-celebration"]');
assert.equal(document.querySelector('[role="dialog"]'), null);
assert.equal(document.activeElement.dataset.action, 'open-celebration', 'focus returns to trophy');
assert.equal(store.celebrationSeen(store.load(), 'standard', celebration.id), true);
assert.ok(document.querySelector('[data-action="open-celebration"]'));
assert.match(document.querySelector('#app').textContent, /Sheet 1 of 1/);
assert.doesNotMatch(document.querySelector('#app').textContent, /No verse|No work|missing work/i);

click('[data-action="open-celebration"]');
assert.ok(document.querySelector('[role="dialog"]'), 'trophy reopens dialog');
document.querySelector('[role="dialog"]').dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
assert.equal(document.querySelector('[role="dialog"]'), null, 'Escape closes dialog');
assert.equal(document.activeElement.dataset.action, 'open-celebration');
click('[data-action="back-to-calendar"]');
click('[data-action="open-day"][data-day="tuesday"]');
assert.equal(document.querySelector('[role="dialog"]'), null, 'another sheet does not auto-open again');
assert.ok(document.querySelector('[data-action="open-celebration"]'), 'trophy is on every Bible Reading sheet');

await launch();
click('[data-action="open-day"][data-day="monday"]');
assert.equal(document.querySelector('[role="dialog"]'), null, 'saved seen flag survives page reload');
} else console.log('skip — real Week 15 app integration (content not installed)');

clock = '2026-10-12T12:00:00';
localStorage.setItem('codequest-daily-v1', JSON.stringify({ track: 'standard', dailyWork: { weeks: {} } }));
await launch();
click('[data-action="open-day"][data-day="monday"]');
assert.equal(document.querySelector('[role="dialog"]'), null, 'normal week has no celebration');
assert.equal(document.querySelector('[data-action="open-celebration"]'), null, 'normal week has no trophy');
assert.ok(document.querySelector('[data-action="open-verse"]') === null, 'verse button is on calendar only');
click('[data-action="back-to-calendar"]');
assert.ok(document.querySelector('[data-action="open-verse"]'), 'normal week keeps its verse button');

globalThis.Date = RealDate;
console.log('ok — daily celebration: break week, dialog, persistence, trophy, submit, parent check, normal week');
