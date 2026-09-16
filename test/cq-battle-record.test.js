// P6b test gap: test/cq-battle-ui.test.js drives the real battle-ui mountBattle, but uses its own
// hand-written onDone that mirrors lesson-ui's finishBattle by hand — a regression that moved the
// real commit(recordBattle(...)) inside lesson-ui.js's results timer would still pass that test.
// This test drives the REAL src/cq/lesson-ui.js mountLesson()/finishBattle()/onDone wiring instead,
// on a stub DOM + fake timers/rAF (same technique as cq-battle-ui.test.js), and proves the battle
// record lands in storage before the results timer is even scheduled.
import assert from 'node:assert';
import { mountLesson } from '../src/cq/lesson-ui.js';
import { normalizeCq } from '../src/cq/character.js';
import { emptyLessonState } from '../src/cq/lesson-logic.js';
import { endBannerMs } from '../src/cq/battle/view.js';

const RESULTS_MS = endBannerMs(false); // reducedMotion is false for this mount

// ---------- a minimal, functional stub DOM ----------
// Every element created is generic: querySelector(All) always hands back a fresh element (never
// null), so lesson-ui's rendering code never trips over a "missing" node. getContext gives back a
// shared recording 2D context so the battle canvas can draw without a real browser.
const noop = () => {};
const ctx2d = { fillRect: noop, clearRect: noop, save: noop, restore: noop, fillStyle: '#000', globalAlpha: 1, imageSmoothingEnabled: false };
function makeEl(doc) {
  const listeners = {};
  const el = {
    ownerDocument: doc, tagName: 'DIV', className: '', id: '', hidden: false, disabled: false,
    dataset: {}, style: { setProperty: noop, removeProperty: noop }, children: [], _html: '',
    get parentNode() { return makeEl(doc); },
    classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
    setAttribute: noop, getAttribute: () => null, removeAttribute: noop,
    appendChild(child) { el.children.push(child); return child; },
    append(...items) { el.children.push(...items); },
    prepend(...items) { el.children.unshift(...items); },
    removeChild: noop,
    remove: noop, focus: noop, click: noop, blur: noop,
    addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
    removeEventListener(type, fn) { if (listeners[type]) listeners[type] = listeners[type].filter((f) => f !== fn); },
    dispatchEvent: noop,
    querySelector: () => makeEl(doc),
    querySelectorAll: () => [],
    closest: () => null,
    contains: () => true,
    getContext: () => ctx2d,
    get innerHTML() { return el._html; },
    set innerHTML(value) { el._html = value; },
    get textContent() { return el._text || ''; },
    set textContent(value) { el._text = value; },
  };
  el._listeners = listeners;
  return el;
}

function run() {
  const rafs = [];
  const win = {
    devicePixelRatio: 1, performance: { now: () => 0 },
    requestAnimationFrame(cb) { rafs.push(cb); return rafs.length; },
    cancelAnimationFrame: noop, addEventListener: noop, removeEventListener: noop,
    matchMedia: () => ({ matches: false }),
  };
  const doc = {
    hidden: false, activeElement: null, defaultView: win,
    createElement: () => makeEl(doc), addEventListener: noop, removeEventListener: noop,
  };
  win.document = doc;

  let clock = 0;
  let nextTimer = 1;
  const timers = new Map();
  let resultsScheduled = false;
  let resultsHadRecord = null; // whether cq.lessons.g1.battle was already set the moment the results timer was scheduled

  const realSetTimeout = globalThis.setTimeout;
  const realClearTimeout = globalThis.clearTimeout;
  const realDocument = globalThis.document;
  const realWindow = globalThis.window;
  const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

  let cq = normalizeCq({ track: 'guided', lessons: { g1: { ...emptyLessonState(), startedAt: '2026-09-16T12:00:00.000Z', quizPassedAt: '2026-09-16T12:00:00.000Z', passedAt: '2026-09-16T12:00:00.000Z', phase: 'key' } } });
  let saveCount = 0;
  const save = (change) => {
    cq = change(cq);
    saveCount += 1;
    if (cq.lessons.g1.battle && !resultsScheduled) resultsHadRecord = true; // snapshot only matters before results is scheduled
    return cq;
  };

  globalThis.setTimeout = (fn, ms) => {
    const id = nextTimer++;
    timers.set(id, { fn, at: clock + (ms || 0) });
    if (ms === RESULTS_MS && !resultsScheduled) {
      resultsScheduled = true;
      // The regression this test guards against: commit() moved inside this very timer callback.
      // At the instant the results timer is scheduled, the record must already be in storage.
      resultsHadRecord = Boolean(cq.lessons.g1.battle);
    }
    return id;
  };
  globalThis.clearTimeout = (id) => { timers.delete(id); };
  globalThis.document = doc;
  globalThis.window = win;
  Object.defineProperty(globalThis, 'localStorage', { value: { getItem: () => null, setItem: noop }, configurable: true, writable: true });

  const advance = (ms) => {
    clock += ms;
    Array.from(timers.entries()).sort((a, b) => a[1].at - b[1].at).forEach(([id, t]) => {
      if (t.at <= clock && timers.has(id)) { timers.delete(id); t.fn(); }
    });
  };

  let view;
  try {
    const app = makeEl(doc);
    view = mountLesson({
      app, route: 'lesson', lessonId: 'g1', nickname: 'Kid',
      getCq: () => cq, save, sound: noop, onExit: noop,
    });

    // The "key" screen is up (state.phase === 'key', battle not yet recorded). Click the real
    // "Defend the chest!" button through the lesson's own click handler (mountLesson appended
    // `root` to `app`; grab its captured click listener).
    const root = app.children.find((child) => child._listeners && child._listeners.click);
    assert.ok(root, 'the lesson root registered a click listener');
    const battleButton = {
      dataset: { action: 'battle-start' }, disabled: false,
      closest: (selector) => (selector === 'button[data-action]' ? battleButton : null),
    };
    root._listeners.click[0]({ target: battleButton });

    assert.equal(saveCount, 0, 'entering the battle screen does not save anything by itself');

    advance(8000); // the how-to card times out on its own, same as cq-battle-ui.test.js
    // Drive the real battle to a real end via fake rAF frames (same technique as cq-battle-ui.test.js).
    let ts = 0;
    let frames = 0;
    while (!resultsScheduled && frames < 20000) {
      const pending = rafs.splice(0);
      ts += 250;
      pending.forEach((cb) => cb(ts));
      frames += 1;
    }
    assert.ok(resultsScheduled, `the battle ended and scheduled its results timer within ${frames} frames`);
    assert.ok(resultsHadRecord, 'the battle record was committed to storage before the results timer was scheduled');
    assert.ok(cq.lessons.g1.battle, 'cq now carries a battle record');
    const recordedBattle = cq.lessons.g1.battle;

    // Firing the results timer must not record a second time.
    advance(RESULTS_MS);
    assert.deepEqual(cq.lessons.g1.battle, recordedBattle, 'the results timer firing does not change the stored record');
  } finally {
    if (view) view.destroy();
    globalThis.setTimeout = realSetTimeout;
    globalThis.clearTimeout = realClearTimeout;
    globalThis.document = realDocument;
    globalThis.window = realWindow;
    if (storageDescriptor) Object.defineProperty(globalThis, 'localStorage', storageDescriptor);
    else delete globalThis.localStorage;
  }
}

run();

console.log('ok — Computer Quest battle record is committed via the real lesson-ui finishBattle path before the results timer fires');
