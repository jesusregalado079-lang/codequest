// Computer Quest key-practice drill (src/cq/lessons/key-practice-ui.js).
// Contract: docs/computer-quest/key-practice.md §1 (practice steps) and §3 (the keyMoment schema).
// Runs against a small fake DOM + fake clock — no jsdom, same approach as cq-battle-record.test.js.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  canonicalKey, DONE_MS, FLASH_MS, fingerHintFor, instructionFor, isSafeEventKey, keyPracticePlan,
  matchesStep, mountKeyPractice, POP_MS,
} from '../src/cq/lessons/key-practice-ui.js';

const SOURCE_PATH = new URL('../src/cq/lessons/key-practice-ui.js', import.meta.url).pathname;
const SOURCE = readFileSync(SOURCE_PATH, 'utf8');

// ---------- fake DOM ----------
function makeDoc() {
  const doc = { hidden: false, activeElement: null };
  function makeEl(tag) {
    const classes = new Set();
    const attrs = {};
    const node = {
      tagName: String(tag).toUpperCase(), ownerDocument: doc, children: [], parentNode: null,
      hidden: false, id: '', _text: '',
      get className() { return Array.from(classes).join(' '); },
      set className(value) {
        classes.clear();
        String(value).split(/\s+/).forEach((name) => { if (name) classes.add(name); });
      },
      classList: {
        add(...names) { names.forEach((name) => classes.add(name)); },
        remove(...names) { names.forEach((name) => classes.delete(name)); },
        contains(name) { return classes.has(name); },
      },
      setAttribute(name, value) { attrs[name] = String(value); if (name === 'id') node.id = String(value); },
      getAttribute(name) { return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : null; },
      removeAttribute(name) { delete attrs[name]; },
      appendChild(child) { child.parentNode = node; node.children.push(child); return child; },
      removeChild(child) {
        const at = node.children.indexOf(child);
        if (at !== -1) node.children.splice(at, 1);
        child.parentNode = null;
        return child;
      },
      contains(other) {
        if (!other) return false;
        if (other === node) return true;
        return node.children.some((child) => child.contains && child.contains(other));
      },
      closest() { return null; },
      get textContent() { return node._text; },
      set textContent(value) { node._text = String(value); },
    };
    return node;
  }
  doc.createElement = makeEl;
  doc.head = makeEl('head');
  doc.getElementById = (id) => {
    let found = null;
    walk(doc.head, (node) => { if (node.id === id) found = node; });
    return found;
  };
  return doc;
}
function walk(node, visit) {
  visit(node);
  node.children.forEach((child) => walk(child, visit));
}
function findAll(node, match) {
  const out = [];
  walk(node, (child) => { if (match(child)) out.push(child); });
  return out;
}
const byClass = (node, name) => findAll(node, (child) => child.classList.contains(name));
const one = (node, name) => {
  const hits = byClass(node, name);
  assert.equal(hits.length, 1, `exactly one .${name}`);
  return hits[0];
};
const keyEl = (node, id) => findAll(node, (child) => child.getAttribute('data-k') === id)[0] || null;

function makeWin(doc) {
  const listeners = {};
  const win = {
    document: doc,
    matchMedia: () => ({ matches: false }),
    addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
    removeEventListener(type, fn) {
      if (listeners[type]) listeners[type] = listeners[type].filter((other) => other !== fn);
    },
    _listeners: listeners,
  };
  doc.defaultView = win;
  return win;
}
const keydownCount = (win) => (win._listeners.keydown || []).length;

// ---------- fake clock ----------
const realSetTimeout = globalThis.setTimeout;
const realClearTimeout = globalThis.clearTimeout;
let clock = 0;
let nextTimer = 1;
let timers = new Map();
globalThis.setTimeout = (fn, ms) => {
  const id = nextTimer;
  nextTimer += 1;
  timers.set(id, { fn, at: clock + (Number.isFinite(ms) ? ms : 0) });
  return id;
};
globalThis.clearTimeout = (id) => { timers.delete(id); };
function advance(ms) {
  clock += ms;
  Array.from(timers.entries())
    .sort((a, b) => a[1].at - b[1].at)
    .forEach(([id, timer]) => { if (timer.at <= clock && timers.has(id)) { timers.delete(id); timer.fn(); } });
}
function resetClock() { clock = 0; timers = new Map(); }

// ---------- harness ----------
function mount(moment, extra) {
  resetClock();
  const doc = makeDoc();
  const win = makeWin(doc);
  const container = doc.createElement('div');
  const calls = { done: 0, tap: 0, win: 0 };
  const view = mountKeyPractice(container, {
    moment,
    onDone: () => { calls.done += 1; },
    sound: { tap: () => { calls.tap += 1; }, win: () => { calls.win += 1; } },
    ...(extra || {}),
  });
  const root = container.children[0];
  return {
    doc, win, container, view, calls, root,
    instruction: () => one(root, 'cq-kp-instruction').textContent,
    hint: () => one(root, 'cq-kp-hint').textContent,
    dots: () => byClass(root, 'cq-kp-dot').map((dot) => dot.textContent),
    phase: () => root.getAttribute('data-phase'),
    glowing: () => byClass(root, 'cq-kp-target').map((node) => node.getAttribute('data-k')).sort(),
    key: (id) => keyEl(root, id),
    press(init) {
      let prevented = false;
      const event = {
        key: '', shiftKey: false, ctrlKey: false, altKey: false, metaKey: false, repeat: false,
        target: null, preventDefault() { prevented = true; }, ...(init || {}),
      };
      (win._listeners.keydown || []).slice().forEach((fn) => fn(event));
      return prevented;
    },
  };
}

try {
  // ---------- pure helpers ----------
  assert.equal(canonicalKey('Enter'), 'Enter');
  assert.equal(canonicalKey('Esc'), 'Escape');
  assert.equal(canonicalKey('Escape'), 'Escape');
  assert.equal(canonicalKey('←'), 'ArrowLeft');
  assert.equal(canonicalKey('→'), 'ArrowRight');
  assert.equal(canonicalKey('I', true), 'I', 'Shift+letter expects the uppercase event.key');
  assert.equal(canonicalKey('I', false), 'i', 'a letter without Shift expects the lowercase event.key');
  assert.equal(canonicalKey('i', true), 'I');
  assert.equal(canonicalKey('Space'), ' ');
  ['Tab', 'F2', '⊞', 'Control', 'Alt', '5', '.', '', '   ', null, undefined, 42].forEach((tap) => {
    assert.equal(canonicalKey(tap, false), null, `unsafe/unknown tap stays out: ${String(tap)}`);
  });

  assert.deepEqual(keyPracticePlan(null), []);
  assert.deepEqual(keyPracticePlan({ kind: 'diagram', hold: ['⊞'], tap: 'E' }), [], 'diagram moments are never drilled');
  assert.deepEqual(keyPracticePlan({ kind: 'practice', tap: 'Tab' }), [], 'Tab is dropped silently');
  assert.equal(keyPracticePlan({ kind: 'practice', tap: 'Enter' }).length, 1);
  assert.equal(keyPracticePlan({ kind: 'practice', sequence: [{ tap: '←', reps: 2 }, { tap: '→', reps: 2 }] }).length, 2);
  {
    const [step] = keyPracticePlan({ kind: 'practice', tap: 'Enter' });
    assert.equal(step.reps, 1, 'reps defaults to 1');
    const [three] = keyPracticePlan({ kind: 'practice', tap: 'I', shift: true, reps: 3 });
    assert.equal(three.reps, 3);
    assert.equal(three.key, 'I');
    assert.equal(three.shift, true);
    const [floaty] = keyPracticePlan({ kind: 'practice', tap: 'Enter', reps: 2.7 });
    assert.equal(floaty.reps, 2, 'a fractional reps count floors');
    const [bad] = keyPracticePlan({ kind: 'practice', tap: 'Enter', reps: 0 });
    assert.equal(bad.reps, 1, 'reps below 1 falls back to 1');
  }

  // Instruction wording is derived from the data, never a per-key table.
  assert.equal(instructionFor(keyPracticePlan({ tap: 'Enter' })[0]), 'Press Enter');
  assert.equal(instructionFor(keyPracticePlan({ tap: 'Esc' })[0]), 'Press Esc');
  assert.equal(instructionFor(keyPracticePlan({ tap: 'Backspace', reps: 3 })[0]), 'Press Backspace 3 times');
  assert.equal(instructionFor(keyPracticePlan({ tap: 'I', shift: true, reps: 3 })[0]), 'Hold Shift, then press I 3 times');
  assert.equal(instructionFor(keyPracticePlan({ tap: '←', reps: 2 })[0]), 'Press ← 2 times');
  assert.equal(instructionFor(null), '');
  assert.equal(fingerHintFor(keyPracticePlan({ tap: 'I', shift: true })[0]), 'Use your right middle finger.');
  assert.equal(fingerHintFor(keyPracticePlan({ tap: 'Enter' })[0]), '', 'Enter is not on the finger chart');

  {
    const [enter] = keyPracticePlan({ tap: 'Enter' });
    const [shiftI] = keyPracticePlan({ tap: 'I', shift: true });
    assert.equal(matchesStep({ key: 'Enter' }, enter), true);
    assert.equal(matchesStep({ key: 'Enter', shiftKey: true }, enter), false, 'a stray Shift is not this step');
    assert.equal(matchesStep({ key: 'Enter', ctrlKey: true }, enter), false);
    assert.equal(matchesStep({ key: 'I', shiftKey: true }, shiftI), true);
    assert.equal(matchesStep({ key: 'i' }, shiftI), false, 'case-sensitive for letters');
    assert.equal(matchesStep({ key: 'Esc' }, keyPracticePlan({ tap: 'Esc' })[0]), true, 'old Esc key name still counts');
    assert.equal(matchesStep(null, enter), false);
    assert.equal(matchesStep({ key: 'Enter' }, null), false);
    assert.equal(isSafeEventKey({ key: 'Tab' }), false);
    assert.equal(isSafeEventKey({ key: 'F2' }), false);
    assert.equal(isSafeEventKey({ key: 's', ctrlKey: true }), false, 'never a modifier combo');
    assert.equal(isSafeEventKey({ key: 'Backspace' }), true);
  }

  // ---------- 1 rep completes and calls onDone exactly once ----------
  {
    const h = mount({ kind: 'practice', tap: 'Enter' });
    assert.equal(h.instruction(), 'Press Enter');
    assert.equal(h.phase(), 'run');
    assert.deepEqual(h.dots(), [], 'no rep counter for a single rep');
    assert.equal(one(h.root, 'cq-kp-reps').hidden, true);
    assert.ok(h.key('Enter'), 'the board grew an Enter key because this moment needs one');
    assert.equal(h.key('Enter').classList.contains('cq-kb-next'), true, 'target glows with the Dojo glow class');
    assert.deepEqual(h.glowing(), ['Enter']);
    assert.equal(keydownCount(h.win), 1);

    assert.equal(h.press({ key: 'Enter' }), true, 'preventDefault on the matching safe key');
    assert.equal(h.calls.tap, 1);
    assert.equal(h.calls.win, 1, 'the win sound plays as soon as the last rep lands');
    assert.equal(h.phase(), 'done');
    assert.equal(h.instruction(), '✓ Got it!');
    assert.deepEqual(h.glowing(), [], 'the glow stops once the drill is done');
    assert.equal(h.calls.done, 0, 'onDone waits for the ✓ beat');
    advance(DONE_MS - 1);
    assert.equal(h.calls.done, 0);
    advance(2);
    assert.equal(h.calls.done, 1);
    advance(5000);
    assert.equal(h.calls.done, 1, 'onDone fires exactly once');
    h.press({ key: 'Enter' });
    assert.equal(h.calls.done, 1, 'presses after the drill change nothing');
    assert.equal(h.calls.tap, 1);
  }

  // ---------- reduced motion shortens the beat but keeps the single call ----------
  {
    resetClock();
    const doc = makeDoc();
    const win = makeWin(doc);
    win.matchMedia = () => ({ matches: true });
    const container = doc.createElement('div');
    let done = 0;
    mountKeyPractice(container, { moment: { tap: 'Enter' }, onDone: () => { done += 1; } });
    (win._listeners.keydown || []).forEach((fn) => fn({ key: 'Enter', preventDefault() {} }));
    advance(250);
    assert.equal(done, 1, 'prefers-reduced-motion still completes, just sooner');
  }

  // ---------- multi-rep counts up and does not complete early ----------
  {
    const h = mount({ kind: 'practice', tap: 'Backspace', reps: 3 });
    assert.equal(h.instruction(), 'Press Backspace 3 times');
    assert.deepEqual(h.dots(), ['○', '○', '○']);
    h.press({ key: 'Backspace' });
    assert.deepEqual(h.dots(), ['●', '○', '○']);
    assert.equal(h.phase(), 'run');
    h.press({ key: 'Backspace' });
    assert.deepEqual(h.dots(), ['●', '●', '○']);
    advance(5000);
    assert.equal(h.calls.done, 0, 'two of three reps never completes, however long we wait');
    assert.equal(h.phase(), 'run');
    h.press({ key: 'Backspace' });
    assert.deepEqual(h.dots(), ['●', '●', '●']);
    assert.equal(h.phase(), 'done');
    advance(DONE_MS + 10);
    assert.equal(h.calls.done, 1);
    assert.equal(h.calls.tap, 3, 'one tap sound per correct press');
    assert.equal(h.calls.win, 1);
  }

  // ---------- held keys do not autorepeat their way through the reps ----------
  {
    const h = mount({ tap: 'Backspace', reps: 3 });
    assert.equal(h.press({ key: 'Backspace' }), true);
    assert.equal(h.press({ key: 'Backspace', repeat: true }), true, 'still swallowed so the browser does not go back');
    assert.equal(h.press({ key: 'Backspace', repeat: true }), true);
    assert.deepEqual(h.dots(), ['●', '○', '○'], 'auto-repeat never counts as a real press');
    advance(5000);
    assert.equal(h.calls.done, 0);
  }

  // ---------- Shift+letter needs the real Shift ----------
  {
    const h = mount({ kind: 'practice', tap: 'I', shift: true, reps: 3 });
    assert.equal(h.instruction(), 'Hold Shift, then press I 3 times');
    assert.equal(h.hint(), 'Use your right middle finger.');
    assert.deepEqual(h.glowing(), ['Shift-L5', 'i'], 'the letter and the OTHER hand\'s Shift both glow');
    assert.equal(h.key('Shift-R5').classList.contains('cq-kp-target'), false);

    assert.equal(h.press({ key: 'i' }), false, 'a lowercase i is not Shift+I: no preventDefault');
    assert.deepEqual(h.dots(), ['○', '○', '○'], 'and it does not count');
    assert.equal(h.key('i').classList.contains('cq-kp-miss'), true, 'it flashes red on its own keycap');
    assert.equal(h.calls.tap, 0);
    advance(FLASH_MS + 1);
    assert.equal(h.key('i').classList.contains('cq-kp-miss'), false, 'the flash clears itself');

    assert.equal(h.press({ key: 'I', shiftKey: true }), true);
    assert.deepEqual(h.dots(), ['●', '○', '○']);
    assert.equal(h.key('i').classList.contains('cq-kp-pop'), true, 'happy pop on the key');
    advance(POP_MS + 1);
    assert.equal(h.key('i').classList.contains('cq-kp-pop'), false);
    h.press({ key: 'I', shiftKey: true });
    h.press({ key: 'I', shiftKey: true });
    assert.equal(h.phase(), 'done');
    advance(DONE_MS + 10);
    assert.equal(h.calls.done, 1);
  }

  // ---------- a sequence completes only after both items, in order ----------
  {
    const h = mount({ kind: 'practice', sequence: [{ tap: 'Backspace' }, { tap: 'Enter' }] });
    assert.equal(h.instruction(), 'Press Backspace');
    assert.deepEqual(h.glowing(), ['Backspace']);
    h.press({ key: 'Enter' });
    assert.equal(h.instruction(), 'Press Backspace', 'the second item cannot be done first');
    assert.equal(h.calls.tap, 0);
    advance(5000);
    assert.equal(h.calls.done, 0);
    h.press({ key: 'Backspace' });
    assert.equal(h.instruction(), 'Press Enter');
    assert.deepEqual(h.glowing(), ['Enter']);
    assert.equal(h.phase(), 'run');
    advance(5000);
    assert.equal(h.calls.done, 0, 'half a sequence is not done');
    h.press({ key: 'Enter' });
    assert.equal(h.phase(), 'done');
    advance(DONE_MS + 10);
    assert.equal(h.calls.done, 1);
    assert.equal(h.calls.tap, 2);
  }

  // ---------- an arrow sequence with reps (g5.4) ----------
  {
    const h = mount({ kind: 'practice', sequence: [{ tap: '←', reps: 2 }, { tap: '→', reps: 2 }] });
    assert.equal(h.instruction(), 'Press ← 2 times');
    assert.ok(h.key('ArrowLeft') && h.key('ArrowRight') && h.key('ArrowUp') && h.key('ArrowDown'), 'the whole arrow cluster is drawn');
    assert.deepEqual(h.dots(), ['○', '○']);
    h.press({ key: 'ArrowLeft' });
    h.press({ key: 'ArrowRight' });
    assert.deepEqual(h.dots(), ['●', '○'], 'the other arrow does not count for this item');
    h.press({ key: 'ArrowLeft' });
    assert.equal(h.instruction(), 'Press → 2 times');
    assert.deepEqual(h.dots(), ['○', '○'], 'the counter resets for the next item');
    h.press({ key: 'ArrowRight' });
    h.press({ key: 'ArrowRight' });
    advance(DONE_MS + 10);
    assert.equal(h.calls.done, 1);
  }

  // ---------- wrong keys never count, never throw, never get swallowed ----------
  {
    const h = mount({ kind: 'practice', tap: 'Enter' });
    ['z', ';', ' ', ',', 'Q', '9', 'ArrowUp', 'Backspace', 'Escape'].forEach((key) => {
      assert.equal(h.press({ key }), false, `wrong key ${JSON.stringify(key)} is left to the browser`);
    });
    assert.equal(h.phase(), 'run');
    assert.equal(h.calls.tap, 0);
    assert.equal(h.calls.done, 0);
    assert.doesNotThrow(() => { h.press({ key: 'Dead' }); h.press({}); h.press({ key: null }); });
    advance(5000);
    assert.equal(h.calls.done, 0, 'wrong keys never finish the drill');
    h.press({ key: 'Enter' });
    advance(DONE_MS + 10);
    assert.equal(h.calls.done, 1, 'and they left no damage behind');
  }

  // ---------- Ctrl/Alt/Meta are the operating system's, never ours ----------
  {
    const h = mount({ kind: 'practice', tap: 'Enter' });
    [{ ctrlKey: true }, { altKey: true }, { metaKey: true }, { ctrlKey: true, shiftKey: true }].forEach((mods) => {
      assert.equal(h.press({ key: 'Enter', ...mods }), false, 'never preventDefault a modifier combo');
    });
    assert.equal(h.phase(), 'run');
    assert.equal(h.calls.tap, 0);
    advance(5000);
    assert.equal(h.calls.done, 0);

    const shifted = mount({ kind: 'practice', tap: 'I', shift: true });
    assert.equal(shifted.press({ key: 'I', shiftKey: true, ctrlKey: true }), false);
    assert.equal(shifted.press({ key: 'I', shiftKey: true, altKey: true }), false);
    assert.equal(shifted.phase(), 'run', 'Ctrl+Shift+I (devtools) is not the drill');
    assert.equal(shifted.calls.tap, 0);
  }

  // ---------- focus on a control outside the drill (battle b12 rule) ----------
  {
    const outside = { closest: (selector) => (selector.indexOf('button') === 0 ? outside : null) };
    const enter = mount({ kind: 'practice', tap: 'Enter' });
    assert.equal(enter.container.contains(outside), false, 'the fake Next button really is outside');
    assert.equal(enter.press({ key: 'Enter', target: outside }), false, 'Enter belongs to the focused button');
    assert.equal(enter.phase(), 'run');
    enter.press({ key: 'Enter' });
    assert.equal(enter.phase(), 'done', 'and still works when focus is not on that button');

    const letter = mount({ kind: 'practice', tap: 'I', shift: true });
    assert.equal(letter.press({ key: 'I', shiftKey: true, target: outside }), true, 'letters still drill from anywhere');
    assert.equal(letter.phase(), 'done');
  }

  // ---------- destroy() mid-practice ----------
  {
    const h = mount({ kind: 'practice', tap: 'Backspace', reps: 3 });
    assert.equal(keydownCount(h.win), 1, 'one window keydown listener while mounted');
    h.press({ key: 'Backspace' });
    assert.deepEqual(h.dots(), ['●', '○', '○']);
    assert.equal(h.container.children.length, 1);

    h.view.destroy();
    assert.equal(keydownCount(h.win), 0, 'destroy() removed the window listener');
    assert.equal(h.container.children.length, 0, 'and its markup');
    assert.equal(timers.size, 0, 'and every pending timer');
    assert.equal(h.press({ key: 'Backspace' }), false, 'a keydown after destroy reaches nothing');
    assert.deepEqual(h.dots(), ['●', '○', '○'], 'no state changed');
    assert.equal(h.calls.tap, 1);
    advance(60000);
    assert.equal(h.calls.done, 0, 'destroy() before completion never calls onDone');
    assert.doesNotThrow(() => h.view.destroy(), 'destroy() is safe twice');
  }

  // ---------- destroy() inside the ✓ beat still cancels onDone ----------
  {
    const h = mount({ kind: 'practice', tap: 'Enter' });
    h.press({ key: 'Enter' });
    assert.equal(h.phase(), 'done');
    advance(DONE_MS - 100);
    assert.equal(h.calls.done, 0);
    h.view.destroy();
    advance(60000);
    assert.equal(h.calls.done, 0, 'leaving the step during the ✓ beat cancels the callback');
    assert.equal(keydownCount(h.win), 0);
  }

  // ---------- unsafe or empty moments are silent no-ops ----------
  [
    { kind: 'practice', tap: 'Tab' },
    { kind: 'practice', tap: 'F2' },
    { kind: 'diagram', hold: ['Ctrl'], tap: 'S', result: 'Saved.', scene: 'save-dot-gone' },
    { kind: 'practice', sequence: [] },
    {},
    null,
    undefined,
  ].forEach((moment) => {
    const h = mount(moment);
    assert.equal(h.phase(), 'idle', `idle for ${JSON.stringify(moment)}`);
    assert.equal(h.instruction(), '');
    assert.doesNotThrow(() => {
      h.press({ key: 'Tab' });
      h.press({ key: 'F2' });
      h.press({ key: 'Enter' });
      h.press({ key: 's', ctrlKey: true });
    });
    advance(60000);
    assert.equal(h.calls.done, 0, 'a moment we cannot drill never claims the kid did it');
    assert.doesNotThrow(() => h.view.destroy());
  });

  // ---------- mount safety ----------
  assert.doesNotThrow(() => {
    const view = mountKeyPractice(null, { moment: { tap: 'Enter' } });
    view.destroy();
  }, 'no container: an inert handle, not a crash');

  // ---------- the stylesheet lands once per document ----------
  {
    resetClock();
    const doc = makeDoc();
    const win = makeWin(doc);
    const a = doc.createElement('div');
    const b = doc.createElement('div');
    const first = mountKeyPractice(a, { moment: { tap: 'Enter' } });
    const second = mountKeyPractice(b, { moment: { tap: 'Esc' } });
    assert.equal(doc.head.children.filter((node) => node.tagName === 'STYLE').length, 1, 'one <style>, however many drills mount');
    assert.equal(keydownCount(win), 2);
    first.destroy();
    second.destroy();
    assert.equal(keydownCount(win), 0);
  }

  // ---------- sound is optional and never fatal ----------
  {
    resetClock();
    const doc = makeDoc();
    const win = makeWin(doc);
    const container = doc.createElement('div');
    let done = 0;
    mountKeyPractice(container, {
      moment: { tap: 'Enter' },
      onDone: () => { done += 1; },
      sound: { tap() { throw new Error('no audio'); }, win() { throw new Error('no audio'); } },
    });
    assert.doesNotThrow(() => (win._listeners.keydown || []).forEach((fn) => fn({ key: 'Enter', preventDefault() {} })));
    advance(DONE_MS + 10);
    assert.equal(done, 1, 'a throwing sound hook never blocks the drill');
    // …and no sound at all is fine too.
    const bare = doc.createElement('div');
    assert.doesNotThrow(() => {
      const view = mountKeyPractice(bare, { moment: { tap: 'Enter' } });
      (win._listeners.keydown || []).forEach((fn) => fn({ key: 'Enter', preventDefault() {} }));
      advance(DONE_MS + 10);
      view.destroy();
    });
  }

  // ---------- source rules ----------
  [
    { name: 'logical assignment ??=', re: /\?\?=/ },
    { name: 'logical assignment ||=', re: /\|\|=/ },
    { name: 'logical assignment &&=', re: /&&=/ },
    { name: 'Array/String.prototype.at(', re: /\.at\(/ },
    { name: 'Object.hasOwn', re: /Object\.hasOwn\(/ },
    { name: 'structuredClone', re: /\bstructuredClone\(/ },
    { name: 'findLast', re: /\.findLast(Index)?\(/ },
    { name: 'replaceAll', re: /\.replaceAll\(/ },
    { name: 'numeric separator', re: /\b\d[\d_]*_\d[\d_]*\b/ },
  ].forEach(({ name, re }) => assert.equal(re.test(SOURCE), false, `no ES2021+ builtin: ${name}`));
  assert.equal(/\binnerHTML\b/.test(SOURCE), false, 'no innerHTML anywhere: the drill builds and mutates real nodes');
  assert.equal(/\b(alert|confirm|prompt)\s*\(/.test(SOURCE), false, 'no alert/confirm/prompt');
  assert.ok(/isInteractiveOutside/.test(SOURCE) && /isActivationKey/.test(SOURCE), 'reuses the battle outside-focus pattern');
  assert.ok(/KEYBOARD_ROWS/.test(SOURCE) && /FINGER_FOR_KEY/.test(SOURCE), 'reuses the Typing Dojo keyboard data');

  console.log('ok — key-practice drill: reps, sequences, Shift, wrong keys, modifiers, outside focus, destroy');
} finally {
  globalThis.setTimeout = realSetTimeout;
  globalThis.clearTimeout = realClearTimeout;
}
