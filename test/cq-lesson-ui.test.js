import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  chestResumeIndex, esc, hasUnsavedLessonInput, lessonStateChanged, lessonText, parentStatus, parseLessonHash,
  phaseLabel, PHASES, plainText, questCard, shouldRefreshFromStorage, shuffled, shuffledChoices, todayYmd,
  visibleOptions, windowsFromPlatformVersion, windowsLines,
} from '../src/cq/lesson-view.js';
import {
  completePractice, lessonStatus, missionStepDone, normalizeLessons, openChest, quizQuestionsToAsk, recordParentCheck,
  recordQuizAttempt, recordSpotIt, recordWarmup, setPosition, setWindows, startLesson, tickMission, addActiveMs,
} from '../src/cq/lesson-logic.js';
import { chooseLegendary, normalizeCq, packComplete } from '../src/cq/character.js';
import { LEGENDARY_CHOICES } from '../src/cq/items.js';
import { LESSONS, getLesson, trackLessons } from '../src/cq/lessons/pack1.js';
import { mountLesson } from '../src/cq/lesson-ui.js';
import { emptyLessonState } from '../src/cq/lesson-logic.js';

// Small LCG, scrambled so neighbouring seeds do not start in step.
const seeded = (seed) => {
  let state = Math.imul(seed ^ 0x9e3779b9, 2654435761) >>> 0;
  const next = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
  next(); next(); next();
  return next;
};
const isIdentity = (entries) => entries.every((entry, position) => entry.index === position);

// ---------- text rendering ----------
assert.equal(esc('<b a="1">&\'</b>'), '&#60;b a=&#34;1&#34;&#62;&#38;&#39;&#60;/b&#62;');
assert.equal(esc(null), '');
assert.equal(lessonText('Click **Start** then **Esc**.', 'Max'), 'Click <strong>Start</strong> then <strong>Esc</strong>.');
assert.equal(lessonText('Open [your folder] and [your folder].', 'Max'),
  'Open <span class="cq-folder">Max</span> and <span class="cq-folder">Max</span>.');
const xssText = lessonText('<img src=x onerror=alert(1)> **<script>alert(1)</script>** [your folder]', '<svg onload=alert(2)>');
assert.ok(!/<img|<script|<svg/.test(xssText), 'Lesson text and nickname markup are escaped');
assert.ok(xssText.includes('<strong>&#60;script&#62;alert(1)&#60;/script&#62;</strong>'));
assert.ok(xssText.includes('<span class="cq-folder">&#60;svg onload=alert(2)&#62;</span>'));
// Nickname text is literal: no bold conversion, no nested substitution, no attribute break-out.
assert.equal(lessonText('[your folder]', '**Bo** [your folder]'), '<span class="cq-folder">**Bo** [your folder]</span>');
assert.equal(lessonText('[your folder]', '"><i>'), '<span class="cq-folder">&#34;&#62;&#60;i&#62;</span>');
assert.equal(lessonText('$& $1 [your folder]', '$&$1'), '$&#38; $1 <span class="cq-folder">$&#38;$1</span>');
assert.equal(lessonText('a ** b', 'x'), 'a ** b', 'A lone marker stays plain text');
assert.equal(plainText('**Rocks** folder'), 'Rocks folder');
// Every real lesson string renders without leaking raw ** or unescaped angle brackets.
LESSONS.forEach((lesson) => {
  const strings = [lesson.title, lesson.practice, lesson.parentWatch || '']
    .concat(lesson.learn.map((card) => card.text), lesson.mission.map((step) => step.text), lesson.parentChecks)
    .concat(...lesson.warmup.concat(lesson.quiz, lesson.chest).map((q) => [q.q, q.why || ''].concat(q.choices)));
  strings.forEach((value) => {
    const html = lessonText(value, 'Kid');
    assert.ok(!html.includes('**'), `${lesson.id}: unpaired bold marker in "${value}"`);
    assert.ok(!/<(?!\/?strong>|span class="cq-folder">|\/span>)/.test(html), `${lesson.id}: unexpected tag in "${value}"`);
  });
});

// ---------- shuffling with original indices ----------
const values = ['a', 'b', 'c', 'd', 'e'];
for (let seed = 1; seed <= 200; seed++) {
  const result = shuffled(values, seeded(seed));
  assert.equal(result.length, values.length);
  assert.deepEqual(result.map((entry) => entry.index).sort(), [0, 1, 2, 3, 4], 'A permutation of the original indices');
  result.forEach((entry) => assert.equal(entry.value, values[entry.index], 'Each entry maps back to its original index'));
}
assert.ok(Array.from({ length: 50 }, (_, seed) => shuffled(values, seeded(seed + 7))).some((result) => !isIdentity(result)),
  'shuffled is not the identity for every call');
assert.equal(new Set(Array.from({ length: 200 }, (_, seed) => JSON.stringify(shuffled(values, seeded(seed + 1)).map((e) => e.index)))).size > 50, true,
  'shuffled produces many different orders');
[() => 0, () => 0.9999999, () => 1, () => -3, () => NaN, () => 'x'].forEach((rng) => {
  const result = shuffled(values, rng);
  assert.deepEqual(result.map((entry) => entry.index).sort(), [0, 1, 2, 3, 4], 'Broken rng values still give a permutation');
});
assert.deepEqual(shuffled([], Math.random), []);
assert.deepEqual(shuffled(['only'], Math.random), [{ value: 'only', index: 0 }]);

// Choice shuffles: 3+ choices never show the authored order, even with stuck or constant rngs.
const three = Object.freeze(['right', 'wrong 1', 'wrong 2']);
const orders = new Map();
for (let seed = 1; seed <= 3000; seed++) {
  const result = shuffledChoices(three, seeded(seed));
  assert.ok(!isIdentity(result), 'Three choices never render in data order');
  result.forEach((entry) => assert.equal(entry.value, three[entry.index]));
  const key = result.map((entry) => entry.index).join('');
  orders.set(key, (orders.get(key) || 0) + 1);
}
assert.equal(orders.size, 5, 'All five non-identity orders occur');
orders.forEach((count, key) => assert.ok(count > 450 && count < 750, `Order ${key} is roughly uniform (${count}/3000)`));
const firstShownFirst = Array.from(orders.entries()).filter(([key]) => key[0] === '0').reduce((sum, [, count]) => sum + count, 0);
assert.ok(firstShownFirst < 900, 'The authored first answer is shown first well under half the time');
[() => 0, () => 0.5, () => 0.9999999, () => NaN].forEach((rng) => {
  const result = shuffledChoices(three, rng);
  assert.ok(!isIdentity(result), 'Constant rng still avoids data order');
  result.forEach((entry) => assert.equal(entry.value, three[entry.index]));
});
// Two choices: a fair coin flip (forcing a swap would always put the usually-first answer second).
const two = ['yes', 'no'];
const twoOrders = new Set(Array.from({ length: 100 }, (_, seed) => shuffledChoices(two, seeded(seed + 1)).map((e) => e.index).join('')));
assert.deepEqual(Array.from(twoOrders).sort(), ['01', '10']);
// Mapping a displayed pick back to data: clicking the displayed position that shows the answer submits the ORIGINAL index.
LESSONS.forEach((lesson) => lesson.quiz.forEach((q) => {
  const shown = shuffledChoices(q.choices, seeded(q.q.length));
  const position = shown.findIndex((entry) => entry.value === q.choices[q.answer]);
  assert.equal(shown[position].index, q.answer);
}));

// ---------- labels ----------
assert.deepEqual(PHASES, ['warmup', 'learn', 'mission', 'quiz', 'parent', 'key', 'chest']);
assert.deepEqual(PHASES.map(phaseLabel), ['Warm-up', 'Learn', 'Mission', 'Quiz', 'Grown-up', 'Key', 'Chest']);
assert.equal(phaseLabel('done'), 'Loot');
assert.equal(phaseLabel('toString'), 'Lesson');
assert.equal(phaseLabel(undefined), 'Lesson');
assert.equal(parentStatus('locked'), 'Locked');
assert.equal(parentStatus('ready'), 'Ready');
assert.equal(parentStatus('in-progress', 'quiz'), 'In progress (Quiz)');
assert.equal(parentStatus('in-progress', 'parent'), 'In progress (Grown-up)');
assert.equal(parentStatus('not-yet'), 'Not yet');
assert.equal(parentStatus('passed'), 'Passed');
assert.equal(parentStatus('done'), 'Chest opened');
assert.equal(parentStatus('constructor'), 'Unknown');
const g1 = getLesson('g1');
const g2 = getLesson('g2');
assert.deepEqual(questCard('locked', g2, 'warmup'), { state: '🔒 Pass Lesson 1 first', button: null, route: null });
assert.equal(questCard('ready', g1).button, 'Start ▶');
assert.equal(questCard('in-progress', g1, 'mission').button, 'Continue ▶');
assert.ok(questCard('in-progress', g1, 'mission').state.includes('Mission'));
assert.equal(questCard('not-yet', g1).button, 'Call a grown-up again ▶');
assert.equal(questCard('passed', g1).button, 'Open your chest 🗝️ ▶');
assert.deepEqual([questCard('done', g1).button, questCard('done', g1).route], ['Practice Mission ▶', 'practice']);
// Kid-facing wording never says "guided" or "easy".
['locked', 'ready', 'in-progress', 'not-yet', 'passed', 'done'].forEach((status) => {
  const card = questCard(status, g2, 'quiz');
  assert.ok(!/guided|easy/i.test(`${card.state} ${card.button}`));
});
const uiSource = readFileSync(new URL('../src/cq/lesson-ui.js', import.meta.url), 'utf8');
const kidStrings = uiSource.match(/'[^'\n]*'|`[^`\n]*`/g).join(' ');
assert.ok(!/\bguided\b|\beasy\b/i.test(kidStrings), 'Lesson screens never say guided or easy');

// ---------- Windows ----------
const options = [{ win: '11', text: 'eleven' }, { win: '10', text: 'ten' }, { win: 'both', text: 'both' }];
assert.deepEqual(visibleOptions(options, '11'), [{ text: 'eleven', label: null }, { text: 'both', label: null }]);
assert.deepEqual(visibleOptions(options, '10'), [{ text: 'ten', label: null }, { text: 'both', label: null }]);
assert.deepEqual(visibleOptions(options, null), [
  { text: 'eleven', label: 'Windows 11:' }, { text: 'ten', label: 'Windows 10:' }, { text: 'both', label: null }]);
assert.deepEqual(visibleOptions(undefined, '10'), []);
assert.deepEqual(windowsLines({ '11': 'middle', '10': 'left' }, '10'), [{ label: null, text: 'left' }]);
assert.deepEqual(windowsLines({ '11': 'middle', '10': 'left' }, null), [{ label: 'Windows 11:', text: 'middle' }, { label: 'Windows 10:', text: 'left' }]);
assert.deepEqual(windowsLines({ '11': 'middle' }, '10'), [{ label: 'Windows 11:', text: 'middle' }]);
assert.deepEqual(windowsLines(undefined, '11'), []);
assert.equal(windowsFromPlatformVersion('15.0.0'), '11');
assert.equal(windowsFromPlatformVersion('13.0.0'), '11');
assert.equal(windowsFromPlatformVersion('12.9'), '10');
assert.equal(windowsFromPlatformVersion('10.0.0'), '10');
assert.equal(windowsFromPlatformVersion('1'), '10');
assert.equal(windowsFromPlatformVersion('0.3.0'), null);
['', 'x', '11 ', '-13', '13.a', null, undefined, 13].forEach((value) => assert.equal(windowsFromPlatformVersion(value), null));

// ---------- dates + routes ----------
assert.equal(todayYmd(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
assert.equal(todayYmd(new Date(2026, 11, 31, 0, 1)), '2026-12-31');
assert.match(todayYmd(), /^\d{4}-\d{2}-\d{2}$/);
assert.deepEqual(parseLessonHash('#lesson/g1'), { route: 'lesson', id: 'g1' });
assert.deepEqual(parseLessonHash('#practice/s5'), { route: 'practice', id: 's5' });
['', '#', '#lesson/', '#lesson/g6', '#lesson/x1', '#shop/g1', '#lesson/g1/extra', '#lesson/<img>', null].forEach((hash) => assert.equal(parseLessonHash(hash), null));

// ---------- chest resume index (b8: resume at the first unanswered question) ----------
assert.equal(chestResumeIndex(0, 2), 0, 'fresh chest starts at Q1');
assert.equal(chestResumeIndex(1, 2), 1, 'one answered so far resumes at Q2');
assert.equal(chestResumeIndex(2, 2), 1, 'progress already complete stays on the last question, not past it');
assert.equal(chestResumeIndex(5, 2), 1, 'corrupted/over-length progress clamps to the last question');
assert.equal(chestResumeIndex(0, 1), 0, 'single-question chest');
assert.equal(chestResumeIndex(undefined, 3), 0, 'missing progress treated as none');

// ---------- storage-refresh decision (b9: stale-snapshot + storage-event rebuild) ----------
const s0 = { phase: 'learn', activeMs: 60000, index: 0 };
const s0ActiveOnly = { ...s0, activeMs: 65000 };
const s0OtherField = { ...s0, index: 1 };
assert.equal(lessonStateChanged(JSON.stringify(s0), JSON.stringify(s0)), false, 'identical JSON: unchanged');
assert.equal(lessonStateChanged(JSON.stringify(s0ActiveOnly), JSON.stringify(s0)), false,
  'an activeMs-only difference (this tab\'s own flush, or another tab\'s) is not "this lesson changed"');
assert.equal(lessonStateChanged(JSON.stringify(s0OtherField), JSON.stringify(s0)), true, 'a real field difference is a change');
// The combined decision: no rebuild while unsaved input is present, even for a real change.
assert.equal(shouldRefreshFromStorage(JSON.stringify(s0OtherField), JSON.stringify(s0), false), true, 'changed-this-lesson + no unsaved input: refresh');
assert.equal(shouldRefreshFromStorage(JSON.stringify(s0OtherField), JSON.stringify(s0), true), false, 'changed-this-lesson but unsaved input present: do not refresh');
assert.equal(shouldRefreshFromStorage(JSON.stringify(s0), JSON.stringify(s0), false), false, 'other-field-elsewhere (no diff here) + no unsaved input: no refresh needed');
assert.equal(shouldRefreshFromStorage(JSON.stringify(s0ActiveOnly), JSON.stringify(s0), false), false, 'activeMs-only change: no refresh even with no unsaved input');
assert.equal(shouldRefreshFromStorage(JSON.stringify(s0ActiveOnly), JSON.stringify(s0), true), false, 'activeMs-only change + unsaved input: still no refresh');

// ---------- unsaved in-screen input (incl. PIN digits) ----------
assert.equal(hasUnsavedLessonInput({ kind: 'quiz', quizPos: 0, quizSelected: null }), false, 'quiz not yet touched');
assert.equal(hasUnsavedLessonInput({ kind: 'quiz', quizPos: 0, quizSelected: 1 }), true, 'quiz: an answer is selected');
assert.equal(hasUnsavedLessonInput({ kind: 'quiz', quizPos: 2, quizSelected: null }), true, 'quiz: mid-attempt (past question 1)');
assert.equal(hasUnsavedLessonInput({ kind: 'parent-checks', checksTicked: false, noteValue: '' }), false, 'parent checks: nothing ticked or typed');
assert.equal(hasUnsavedLessonInput({ kind: 'parent-checks', checksTicked: true, noteValue: '' }), true, 'parent checks: a box is ticked');
assert.equal(hasUnsavedLessonInput({ kind: 'parent-checks', checksTicked: false, noteValue: '  hi  ' }), true, 'parent checks: a note is typed');
assert.equal(hasUnsavedLessonInput({ kind: 'parent-checks', checksTicked: false, noteValue: '   ' }), false, 'parent checks: whitespace-only note does not count');
assert.equal(hasUnsavedLessonInput({ kind: 'chest', chestWrongCount: 0 }), false, 'chest: no wrong picks yet');
assert.equal(hasUnsavedLessonInput({ kind: 'chest', chestWrongCount: 1 }), true, 'chest: a wrong pick is showing');
assert.equal(hasUnsavedLessonInput({ kind: 'parent-pin', pinValue: '' }), false, 'PIN box empty');
assert.equal(hasUnsavedLessonInput({ kind: 'parent-pin', pinValue: '12' }), true, 'PIN digits typed count as unsaved input');
assert.equal(hasUnsavedLessonInput({ kind: 'learn' }), false, 'a screen kind with nothing to lose');
assert.equal(hasUnsavedLessonInput(), false, 'no signals at all');

// ---------- status line cleared on every screen change (stale status message) ----------
assert.match(uiSource, /function go\(next, focus\) \{\s*announce\(''\);/, 'go() clears the aria-live status line on every screen change');
assert.match(uiSource, /function refreshFromStorage\(\) \{[\s\S]*?go\(openScreen\(\)\);/,
  'the storage-refresh rebuild goes through go() (not a bare render()), so the status line is cleared there too');

// ---------- the UI's call order is legal against the lesson rules (a whole pack, both tracks) ----------
const rng = seeded(99);
const pickShown = (choices, answer, wrongFirst = false) => {
  const shown = shuffledChoices(choices, rng);
  const pick = wrongFirst ? shown.find((entry) => entry.index !== answer) : shown.find((entry) => entry.index === answer);
  return pick.index;
};
function playLesson(cq, lesson, day, { quizMistakes = 0 } = {}) {
  let state = startLesson(cq, lesson, '2026-09-16T12:00:00.000Z');
  state = setPosition(recordWarmup(state, lesson, lesson.warmup.map((q, i) => ({ q: i, choice: pickShown(q.choices, q.answer, i === 0) }))), lesson.id, 'learn', 0);
  state = addActiveMs(state, lesson.id, 61000);
  lesson.learn.forEach((_, i) => { if (i) state = setPosition(state, lesson.id, 'learn', i); });
  state = setPosition(state, lesson.id, 'mission', 0);
  lesson.mission.forEach((step, i) => {
    if (i) state = setPosition(state, lesson.id, 'mission', i);
    if (step.kind === 'windowsCheck') state = setWindows(state, '11');
    else if (step.kind === 'spotIt') {
      const order = shuffled(step.cards, rng).map((entry) => entry.index);
      state = recordSpotIt(state, lesson, i, order.map((card, n) => ({ card, pick: n === 0 ? (step.cards[card].answer === 'ok' ? 'stop' : 'ok') : step.cards[card].answer })));
    } else state = tickMission(state, lesson, i, true);
    assert.ok(missionStepDone(state, lesson, i), `${lesson.id} step ${i + 1} done`);
  });
  state = setPosition(state, lesson.id, 'quiz', 0);
  let attempts = 0;
  while (normalizeLessons(state.lessons)[lesson.id].phase === 'quiz') {
    const asks = shuffled(quizQuestionsToAsk(state, lesson), rng).map((entry) => entry.value);
    state = recordQuizAttempt(state, lesson, asks.map((q, n) => ({ q, choice: pickShown(lesson.quiz[q].choices, lesson.quiz[q].answer, attempts === 0 && n < quizMistakes) })), '2026-09-16T12:10:00.000Z');
    attempts += 1;
    assert.ok(attempts < 5);
  }
  assert.equal(lessonStatus(state, lesson), 'in-progress');
  const partial = lesson.parentChecks.map((_, i) => i !== 0);
  state = recordParentCheck(state, lesson, partial, 'Needed a hint <b>', '2026-09-16T12:20:00.000Z');
  assert.equal(lessonStatus(state, lesson), 'not-yet');
  assert.throws(() => completePractice(state, lesson, day), /not passed/, 'Not-yet practice earns nothing; the UI sends him back to the grown-up');
  state = recordParentCheck(state, lesson, lesson.parentChecks.map(() => true), 'All good', '2026-09-16T12:30:00.000Z');
  assert.equal(lessonStatus(state, lesson), 'passed');
  state = setPosition(state, lesson.id, 'chest', 0);
  const opened = openChest(state, lesson, lesson.chest.map((_, i) => i !== 0), '2026-09-16T12:40:00.000Z', rng);
  assert.equal(opened.loot.item, lesson.item);
  state = opened.cq;
  assert.equal(lessonStatus(state, lesson), 'done');
  const practice = completePractice(state, lesson, day);
  assert.equal(practice.gems, 10);
  assert.equal(completePractice(practice.cq, lesson, day).gems, 0, 'Same day: come back tomorrow');
  return { cq: practice.cq, attempts };
}
for (const track of ['guided', 'standard']) {
  let cq = normalizeCq({ track, look: null });
  const lessons = trackLessons(track);
  lessons.forEach((lesson, i) => {
    if (i + 1 < lessons.length) assert.equal(lessonStatus(cq, lessons[i + 1]), 'locked');
    const played = playLesson(cq, lesson, `2026-09-${String(16 + i).padStart(2, '0')}`, { quizMistakes: 2 });
    assert.ok(played.attempts >= 2, 'Missed questions come back in a fix-up round');
    cq = played.cq;
  });
  assert.equal(cq.windows, '11');
  assert.ok(packComplete(cq));
  assert.equal(cq.legendaryChoice, null);
  cq = chooseLegendary(cq, LEGENDARY_CHOICES[1]);
  assert.equal(cq.legendaryChoice, LEGENDARY_CHOICES[1]);
  assert.ok(cq.cosmetics.includes('title-champion'));
  assert.equal(normalizeLessons(cq.lessons)[lessons[0].id].parent.note, 'All good');
}

// ---------- source rules for the new UI modules ----------
const viewSource = readFileSync(new URL('../src/cq/lesson-view.js', import.meta.url), 'utf8');
const hubSource = readFileSync(new URL('../src/cq/ui.js', import.meta.url), 'utf8');
[uiSource, viewSource, hubSource].forEach((source) => {
  assert.equal(/\.at\(|Object\.hasOwn|structuredClone|findLast|replaceAll|\?\?=|\|\|=|&&=/.test(source), false, 'No ES2021+ builtins');
  assert.equal(/\balert\(|\bconfirm\(|\bprompt\(/.test(source), false, 'No alert/confirm/prompt');
  assert.equal(/<[a-z][^>]*\son[a-z]+=/i.test(source), false, 'No inline event handlers (CSP)');
});
assert.ok(uiSource.includes('function showKeyScreen('), 'Key screen stays a separate function');
assert.ok(uiSource.includes('battle inserts here in Phase 4'));
assert.ok(!/\binnerHTML\s*=\s*[^`'"]*\+/.test(uiSource), 'innerHTML is built from escaped templates only');
// The lesson UI module loads without a DOM (nothing runs at import time).
const module = await import('../src/cq/lesson-ui.js');
assert.equal(typeof module.mountLesson, 'function');

console.log('ok — Computer Quest lesson view helpers, choice shuffles, labels, Windows hints, and full-pack UI call order pass');

// Saved key → practice → key → retry → results → practice → results. The real mount and
// battle loop run; only DOM painting and timers are faked.
{
  const noop = () => {};
  let doc;
  function el() {
    const queries = new Map();
    const handlers = {};
    const attrs = {};
    const node = { ownerDocument: doc, nodeType: 1, hidden: false, disabled: false, dataset: {}, children: [],
      style: { setProperty: noop }, classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
      parentNode: { clientWidth: 850, removeChild: noop }, clientWidth: 850, innerHTML: '',
      append(...items) { node.children.push(...items); }, removeChild: noop, focus() { doc.activeElement = node; },
      addEventListener(type, fn) { handlers[type] = fn; }, removeEventListener: noop,
      setAttribute(name, value) { attrs[name] = value; }, getAttribute(name) { return attrs[name]; },
      querySelector(selector) { if (!queries.has(selector)) queries.set(selector, el()); return queries.get(selector); },
      querySelectorAll: () => [], contains: () => true, getContext: () => null };
    node.handlers = handlers;
    return node;
  }
  const rafs = [];
  const win = { devicePixelRatio: 1, performance: { now: () => 0 }, scrollTo: noop,
    requestAnimationFrame(fn) { rafs.push(fn); return rafs.length; }, cancelAnimationFrame: noop,
    addEventListener: noop, removeEventListener: noop, matchMedia: () => ({ matches: false }) };
  doc = { defaultView: win, hidden: false, activeElement: null, createElement: () => el(),
    addEventListener: noop, removeEventListener: noop };
  const iso = '2026-09-16T12:00:00.000Z';
  const saved = { ...emptyLessonState(), phase: 'key', startedAt: iso, quizPassedAt: iso, passedAt: iso,
    battle: { playedAt: iso, outcome: 'fell', ms: 10000, poofs: 4, gems: 1, tries: 1 } };
  let cq = normalizeCq({ track: 'guided', gems: 1, lessons: { g1: saved } });
  let saves = 0;
  const prior = { document: globalThis.document, window: globalThis.window, setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout, localStorage: Object.getOwnPropertyDescriptor(globalThis, 'localStorage') };
  const timers = new Map(); let nextTimer = 1;
  globalThis.document = doc; globalThis.window = win;
  globalThis.setTimeout = (fn, ms) => { const id = nextTimer++; timers.set(id, { fn, ms }); return id; };
  globalThis.clearTimeout = (id) => { timers.delete(id); };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem(key) { return key.startsWith('codequest-cq-howto-') ? '1' : null; }, setItem: noop,
  } });
  let mounted;
  try {
    const app = el();
    mounted = mountLesson({ app, route: 'lesson', lessonId: 'g1', nickname: 'Kid', getCq: () => cq,
      save(change) { cq = change(cq); saves += 1; }, sound: noop, onExit: noop });
    const root = app.children[0];
    const view = root.children[0];
    const click = (action) => {
      const button = { dataset: { action }, disabled: false };
      button.closest = () => button;
      root.handlers.click({ target: button });
    };
    assert.match(view.innerHTML, /⚔️ Play the battle again/);
    assert.match(view.innerHTML, /🎓 Learn the controls/);
    const beforePractice = JSON.stringify(cq);
    click('battle-learn');
    let battleRoot = view.querySelector('.cq-battle-host').children.at(-1);
    let panel = battleRoot.querySelector('.cq-training-panel');
    assert.match(panel.innerHTML, /Step 1 of 4/);
    const skip = { dataset: { training: 'skip' } }; skip.closest = () => skip;
    panel.handlers.click({ target: skip });
    assert.match(view.innerHTML, /⚔️ Play the battle again/);
    assert.equal(JSON.stringify(cq), beforePractice, 'practice skip never saves');
    click('battle-retry');
    let frames = 0; let ts = 0;
    while (cq.lessons.g1.battle.tries === 1 && frames < 20000) {
      const pending = rafs.splice(0); ts += 250; pending.forEach((fn) => fn(ts)); frames += 1;
    }
    assert.ok(frames < 20000, 'retry reaches an engine result');
    assert.equal(cq.lessons.g1.battle.tries, 2);
    assert.equal(cq.gems, 1, 'paid retry does not add gems');
    const results = Array.from(timers.values()).find((timer) => timer.ms === 1300);
    assert.ok(results, 'results timer scheduled after saving');
    results.fn();
    assert.match(view.innerHTML, /Already earned/);
    assert.match(view.innerHTML, /🔁 (Try again|Play again)/);
    const afterRetry = JSON.stringify(cq);
    click('battle-learn');
    battleRoot = view.querySelector('.cq-battle-host').children.at(-1);
    panel = battleRoot.querySelector('.cq-training-panel');
    panel.handlers.click({ target: skip });
    assert.match(view.innerHTML, /Already earned/);
    assert.equal(JSON.stringify(cq), afterRetry, 'practice from results never saves');
    assert.ok(saves > 0, 'retry went through the real save path');

    mounted.destroy();
    cq = normalizeCq({ track: 'guided', lessons: { g1: { ...emptyLessonState(), phase: 'key',
      startedAt: iso, quizPassedAt: iso, passedAt: iso } } });
    const skipApp = el();
    mounted = mountLesson({ app: skipApp, route: 'lesson', lessonId: 'g1', nickname: 'Kid', getCq: () => cq,
      save(change) { cq = change(cq); }, sound: noop, onExit: noop });
    const skipRoot = skipApp.children[0];
    const skipButton = { dataset: { action: 'battle-skip' }, disabled: false };
    skipButton.closest = () => skipButton;
    skipRoot.handlers.click({ target: skipButton });
    assert.equal(cq.lessons.g1.battle.outcome, 'skipped');
    assert.equal(cq.lessons.g1.phase, 'key', 'a skip remains replayable until the first chest answer');
    mounted.destroy();
    const reopenApp = el();
    mounted = mountLesson({ app: reopenApp, route: 'lesson', lessonId: 'g1', nickname: 'Kid', getCq: () => cq,
      save(change) { cq = change(cq); }, sound: noop, onExit: noop });
    assert.match(reopenApp.children[0].children[0].innerHTML, /⚔️ Play the battle again/);
  } finally {
    if (mounted) mounted.destroy();
    globalThis.document = prior.document; globalThis.window = prior.window;
    globalThis.setTimeout = prior.setTimeout; globalThis.clearTimeout = prior.clearTimeout;
    if (prior.localStorage) Object.defineProperty(globalThis, 'localStorage', prior.localStorage);
    else delete globalThis.localStorage;
  }
}
