// P7d: the REAL src/cq/lesson-ui.js mission screen driving the REAL key-practice drill and shortcut
// diagram (src/cq/lessons/key-practice-ui.js, src/cq/lessons/diagram-ui.js) on the REAL Pack 1 data.
// Contract: docs/computer-quest/key-practice.md §6.
//
// test/cq-lesson-ui.test.js is a pure-helper file (no DOM at all) and cq-battle-record.test.js's stub
// DOM never parses innerHTML — this wiring lives entirely in the innerHTML the mission body writes and
// the host div the mount call then finds inside it, so this file adds the smallest stub DOM that can
// parse that markup back into a tree. Still no jsdom, same spirit as every other cq UI test.
import assert from 'node:assert/strict';
import { mountLesson } from '../src/cq/lesson-ui.js';
import { normalizeCq } from '../src/cq/character.js';
import { emptyLessonState } from '../src/cq/lesson-logic.js';
import { DONE_MS } from '../src/cq/lessons/key-practice-ui.js';

// ---------- stub DOM ----------
const VOID_TAGS = ['input', 'br', 'img', 'hr', 'meta', 'link', 'source'];
const TAG_RE = /<(\/?)([a-zA-Z][\w-]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>`]+))?)*)\s*(\/?)>/g;
const ATTR_RE = /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>`]+)))?/g;
const COMPOUND_RE = /^([a-zA-Z][\w-]*)|^#([\w-]+)|^\.([\w-]+)|^\[([\w-]+)(?:=["']?([^\]"']*)["']?)?\]/;

function parseCompound(text) {
  const out = { tag: null, id: null, classes: [], attrs: [] };
  let rest = text;
  while (rest) {
    const m = COMPOUND_RE.exec(rest);
    if (!m) break;
    if (m[1]) out.tag = m[1].toUpperCase();
    else if (m[2]) out.id = m[2];
    else if (m[3]) out.classes.push(m[3]);
    else out.attrs.push({ name: m[4], value: m[5] === undefined ? null : m[5] });
    rest = rest.slice(m[0].length);
  }
  return out;
}
function matchCompound(el, compound) {
  if (!el || !el.tagName) return false;
  if (compound.tag && el.tagName !== compound.tag) return false;
  if (compound.id && el.getAttribute('id') !== compound.id) return false;
  if (compound.classes.some((name) => !el.classList.contains(name))) return false;
  return compound.attrs.every((attr) => {
    const value = el.getAttribute(attr.name);
    if (value === null) return false;
    return attr.value === null || value === attr.value;
  });
}
function matchesSelector(el, selector) {
  return String(selector).split(',').some((part) => {
    const compounds = part.trim().split(/\s+/).filter(Boolean).map(parseCompound);
    if (!compounds.length) return false;
    if (!matchCompound(el, compounds[compounds.length - 1])) return false;
    let node = el.parentNode;
    let i = compounds.length - 2;
    while (i >= 0) {
      if (!node) return false;
      if (matchCompound(node, compounds[i])) i -= 1;
      node = node.parentNode;
    }
    return true;
  });
}
function walk(node, visit) {
  node.children.forEach((child) => {
    if (!child.tagName) return;
    visit(child);
    walk(child, visit);
  });
}

function makeCtx() {
  const store = {};
  return new Proxy(store, {
    get(target, key) {
      if (Object.prototype.hasOwnProperty.call(target, key)) return target[key];
      target[key] = () => {};
      return target[key];
    },
    set(target, key, value) { target[key] = value; return true; },
  });
}
const sharedCtx = makeCtx();

function makeDoc() {
  const doc = { hidden: false, activeElement: null };
  function makeEl(tag) {
    const classes = [];
    const attrs = {};
    const listeners = {};
    const style = { cssText: '', setProperty(name, value) { style[name] = value; }, removeProperty() {} };
    const el = {
      tagName: String(tag).toUpperCase(), ownerDocument: doc, children: [], parentNode: null,
      hidden: false, disabled: false, width: 0, height: 0, dataset: {}, style, htmlWrites: 0,
      _text: '', _html: '', _listeners: listeners,
      classList: {
        add(...names) { names.forEach((name) => { if (name && classes.indexOf(name) === -1) classes.push(name); }); },
        remove(...names) { names.forEach((name) => { const at = classes.indexOf(name); if (at !== -1) classes.splice(at, 1); }); },
        contains(name) { return classes.indexOf(name) !== -1; },
      },
      get className() { return classes.join(' '); },
      set className(value) {
        classes.length = 0;
        String(value).split(/\s+/).forEach((name) => { if (name) classes.push(name); });
        attrs.class = String(value);
      },
      get id() { return attrs.id || ''; },
      set id(value) { el.setAttribute('id', value); },
      setAttribute(name, value) {
        const text = String(value);
        attrs[name] = text;
        if (name === 'class') el.className = text;
        else if (name === 'disabled') el.disabled = true;
        else if (name.indexOf('data-') === 0) {
          el.dataset[name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = text;
        }
      },
      getAttribute(name) {
        if (name === 'class') return classes.length ? classes.join(' ') : (Object.prototype.hasOwnProperty.call(attrs, 'class') ? attrs.class : null);
        return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : null;
      },
      removeAttribute(name) { delete attrs[name]; if (name === 'disabled') el.disabled = false; },
      appendChild(child) { if (child.parentNode) child.parentNode.removeChild(child); child.parentNode = el; el.children.push(child); return child; },
      append(...items) { items.forEach((item) => el.appendChild(item)); },
      removeChild(child) {
        const at = el.children.indexOf(child);
        if (at !== -1) { el.children.splice(at, 1); child.parentNode = null; }
        return child;
      },
      remove() { if (el.parentNode) el.parentNode.removeChild(el); },
      contains(node) { let walker = node; while (walker) { if (walker === el) return true; walker = walker.parentNode; } return false; },
      closest(selector) { let walker = el; while (walker && walker.tagName) { if (matchesSelector(walker, selector)) return walker; walker = walker.parentNode; } return null; },
      querySelectorAll(selector) { const out = []; walk(el, (node) => { if (matchesSelector(node, selector)) out.push(node); }); return out; },
      querySelector(selector) { const found = el.querySelectorAll(selector); return found.length ? found[0] : null; },
      focus() { doc.activeElement = el; },
      blur() { if (doc.activeElement === el) doc.activeElement = null; },
      click() {
        let walker = el;
        while (walker) {
          if (walker._listeners && walker._listeners.click) walker._listeners.click.forEach((fn) => fn({ target: el }));
          walker = walker.parentNode;
        }
      },
      addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
      removeEventListener(type, fn) { if (listeners[type]) listeners[type] = listeners[type].filter((one) => one !== fn); },
      dispatchEvent() {},
      getContext() { return sharedCtx; },
      get innerHTML() { return el._html; },
      set innerHTML(value) {
        el._html = String(value);
        el.htmlWrites += 1;
        el.children.forEach((child) => { child.parentNode = null; });
        el.children = [];
        parseInto(el, el._html);
      },
      get textContent() {
        let out = el._text;
        el.children.forEach((child) => { out += child.tagName ? child.textContent : child.data; });
        return out;
      },
      set textContent(value) {
        el.children.forEach((child) => { child.parentNode = null; });
        el.children = [];
        el._text = String(value);
      },
    };
    return el;
  }

  function parseInto(root, html) {
    const stack = [root];
    let last = 0;
    const addText = (text) => {
      if (!text) return;
      const top = stack[stack.length - 1];
      top.children.push({ data: text, parentNode: top });
    };
    TAG_RE.lastIndex = 0;
    let match = TAG_RE.exec(html);
    while (match) {
      addText(html.slice(last, match.index));
      last = match.index + match[0].length;
      const closing = match[1] === '/';
      const tag = match[2].toLowerCase();
      if (closing) {
        for (let i = stack.length - 1; i > 0; i -= 1) {
          if (stack[i].tagName === tag.toUpperCase()) { stack.length = i; break; }
        }
      } else {
        const node = makeEl(tag);
        ATTR_RE.lastIndex = 0;
        let attr = ATTR_RE.exec(match[3] || '');
        while (attr) {
          const value = attr[2] !== undefined ? attr[2] : attr[3] !== undefined ? attr[3] : attr[4] !== undefined ? attr[4] : '';
          node.setAttribute(attr[1], value);
          attr = ATTR_RE.exec(match[3] || '');
        }
        stack[stack.length - 1].appendChild(node);
        if (!match[4] && VOID_TAGS.indexOf(tag) === -1) stack.push(node);
      }
      match = TAG_RE.exec(html);
    }
    addText(html.slice(last));
  }

  doc.createElement = (tag) => makeEl(tag);
  doc.head = makeEl('head');
  doc.body = makeEl('body');
  doc.addEventListener = (type, fn) => doc.body.addEventListener(type, fn);
  doc.removeEventListener = (type, fn) => doc.body.removeEventListener(type, fn);
  doc.getElementById = (id) => doc.head.querySelector(`#${id}`) || doc.body.querySelector(`#${id}`);
  doc._listeners = doc.body._listeners;
  return doc;
}

// ---------- harness ----------
const passed = (extra) => ({
  ...emptyLessonState(), startedAt: '2026-09-16T09:00:00.000Z', quizPassedAt: '2026-09-16T09:10:00.000Z',
  passedAt: '2026-09-16T09:20:00.000Z', phase: 'key', ...extra,
});
const atMissionStep = (index) => ({ ...emptyLessonState(), startedAt: '2026-09-16T10:00:00.000Z', phase: 'mission', index });

function harness({ track, lessons, lessonId }) {
  const doc = makeDoc();
  const rafs = new Map();
  let nextRaf = 1;
  let rafCalls = 0;
  const winListeners = {};
  const win = {
    document: doc, devicePixelRatio: 1, innerWidth: 900, innerHeight: 700,
    matchMedia: () => ({ matches: false }),
    scrollTo() {},
    requestAnimationFrame(cb) { rafCalls += 1; const id = nextRaf++; rafs.set(id, cb); return id; },
    cancelAnimationFrame(id) { rafs.delete(id); },
    addEventListener(type, fn) { (winListeners[type] = winListeners[type] || []).push(fn); },
    removeEventListener(type, fn) { if (winListeners[type]) winListeners[type] = winListeners[type].filter((one) => one !== fn); },
  };
  doc.defaultView = win;

  let clock = 0;
  let nextTimer = 1;
  const timers = new Map();
  const real = {
    setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout,
    setInterval: globalThis.setInterval, clearInterval: globalThis.clearInterval,
    document: globalThis.document, window: globalThis.window,
    storage: Object.getOwnPropertyDescriptor(globalThis, 'localStorage'),
  };
  globalThis.setTimeout = (fn, ms) => { const id = nextTimer++; timers.set(id, { fn, at: clock + (ms || 0), every: 0 }); return id; };
  globalThis.setInterval = (fn, ms) => { const id = nextTimer++; timers.set(id, { fn, at: clock + (ms || 0), every: ms || 0 }); return id; };
  globalThis.clearTimeout = (id) => { timers.delete(id); };
  globalThis.clearInterval = (id) => { timers.delete(id); };
  globalThis.document = doc;
  globalThis.window = win;
  Object.defineProperty(globalThis, 'localStorage', { value: { getItem: () => null, setItem() {} }, configurable: true, writable: true });

  let cq = normalizeCq({ track, lessons });
  const sounds = [];
  const app = doc.createElement('div');
  doc.body.appendChild(app);
  const lesson = mountLesson({
    app, route: 'lesson', lessonId, nickname: 'Kid',
    getCq: () => cq, save: (change) => { cq = change(cq); return cq; },
    sound: (name) => sounds.push(name), onExit() {},
  });
  const view = app.children[0].children[0]; // root -> view

  const api = {
    doc, win, view, sounds, lesson,
    get cq() { return cq; },
    setCq(next) { cq = next; },
    state() { return cq.lessons[lessonId]; },
    keydownListeners() { return (winListeners.keydown || []).length; },
    rafCalls() { return rafCalls; },
    runFrames(count) {
      for (let i = 0; i < count; i += 1) {
        const pending = Array.from(rafs.entries());
        rafs.clear();
        pending.forEach(([, cb]) => cb(16 * (i + 1)));
      }
    },
    advance(ms) {
      clock += ms;
      let guard = 0;
      let due = Array.from(timers.entries()).filter(([, t]) => t.at <= clock);
      while (due.length && guard < 50) {
        due.sort((a, b) => a[1].at - b[1].at).forEach(([id, t]) => {
          if (!timers.has(id)) return;
          if (t.every) t.at = clock + t.every; else timers.delete(id);
          t.fn();
        });
        guard += 1;
        due = Array.from(timers.entries()).filter(([, t]) => t.at <= clock && !t.every);
      }
    },
    press(key, extra) {
      const options = extra || {};
      const target = doc.activeElement || doc.body;
      const event = {
        key, code: options.code || '', shiftKey: Boolean(options.shiftKey), ctrlKey: false, altKey: false,
        metaKey: false, repeat: Boolean(options.repeat), target, defaultPrevented: false,
        preventDefault() { event.defaultPrevented = true; },
      };
      (doc.body._listeners.keydown || []).slice().forEach((fn) => fn(event));
      (winListeners.keydown || []).slice().forEach((fn) => fn(event));
      return event;
    },
    clickAction(action) {
      const button = view.querySelector(`[data-action="${action}"]`);
      assert.ok(button, `button ${action} exists`);
      assert.ok(!button.disabled, `button ${action} is enabled`);
      button.click();
      return button;
    },
    done() {
      lesson.destroy();
      globalThis.setTimeout = real.setTimeout;
      globalThis.clearTimeout = real.clearTimeout;
      globalThis.setInterval = real.setInterval;
      globalThis.clearInterval = real.clearInterval;
      globalThis.document = real.document;
      globalThis.window = real.window;
      if (real.storage) Object.defineProperty(globalThis, 'localStorage', real.storage);
      else delete globalThis.localStorage;
    },
  };
  return api;
}

const guidedThroughG4 = { g1: passed(), g2: passed(), g3: passed(), g4: passed() };

// ---------- 1. a practice step: the drill replaces the tick and ticks the same flag ----------
{
  const t = harness({ track: 'guided', lessonId: 'g5', lessons: { ...guidedThroughG4, g5: atMissionStep(1) } });
  try {
    const baseKeydown = t.keydownListeners();
    assert.ok(baseKeydown >= 1, 'the drill registered its window keydown listener');
    assert.equal(t.view.querySelector('[data-action="tick"]'), null, 'a practice step has no manual "I did it" toggle');
    const host = t.view.querySelector('.cq-kp-host');
    assert.ok(host, 'the drill host div is in the mission body');
    assert.equal(host.dataset.step, '1');
    assert.ok(host.querySelector('.cq-kp'), 'the real drill is mounted inside the host');
    assert.ok(host.querySelector('.cq-kp-instruction').textContent.includes('Hold Shift, then press I 3 times'));
    assert.equal(t.view.querySelector('[data-action="mission-next"]').disabled, true, 'Next is disabled until the reps land');

    t.press('I', { shiftKey: true });
    t.press('I', { shiftKey: true });
    assert.notEqual(t.state().mission[1], true, 'two of three reps saves nothing');
    t.press('i'); // a wrong key never counts against him
    t.press('I', { shiftKey: true });
    assert.notEqual(t.state().mission[1], true, 'the tick waits for the drill\'s done beat');

    t.advance(DONE_MS);
    assert.equal(t.state().mission[1], true, 'the third rep ticks the same mission[] flag tickMission writes');
    assert.equal(t.view.querySelector('.cq-kp-host'), null, 'the drill host is gone once the step is done');
    assert.equal(t.view.querySelector('[data-action="tick"]'), null, 'and no manual toggle appears either');
    const doneCard = t.view.querySelector('.cq-done-static');
    assert.ok(doneCard, 'a static done card replaces the drill');
    assert.ok(doneCard.textContent.includes('You did it'));
    assert.equal(doneCard.getAttribute('data-action'), null, 'the done card is not a control');
    assert.equal(t.view.querySelector('[data-action="mission-next"]').disabled, false, 'Next is unlocked');
    assert.equal(t.keydownListeners(), baseKeydown - 1, 'the finished drill was destroyed (listener dropped)');
    assert.ok(t.sounds.indexOf('win') !== -1, 'the drill played its own win cue');
    assert.equal(t.sounds.filter((name) => name === 'win').length, 1, 'and the step did not double up on it');

    // ---------- 2. revisiting a done practice step never re-demands the keys ----------
    t.clickAction('mission-back');
    assert.equal(t.keydownListeners(), baseKeydown - 1, 'leaving the step leaves no drill behind');
    assert.ok(t.view.querySelector('[data-action="tick"]'), 'step 1 of g5 has no key moment: the normal toggle is back');
    t.clickAction('tick');
    t.clickAction('mission-next');
    assert.equal(t.state().index, 1, 'back on the practice step');
    assert.equal(t.state().mission[1], true, 'still done');
    assert.ok(t.view.querySelector('.cq-done-static'), 'it shows the static done state');
    assert.equal(t.view.querySelector('.cq-kp-host'), null, 'with no fresh drill to satisfy');
    assert.equal(t.view.querySelector('.cq-kp'), null, 'and nothing mounted');
    assert.equal(t.keydownListeners(), baseKeydown - 1, 'no drill listener on a done step');
  } finally { t.done(); }
}

// ---------- 3. a mounted drill is unsaved input: a storage event must not rebuild it away ----------
{
  const t = harness({ track: 'guided', lessonId: 'g5', lessons: { ...guidedThroughG4, g5: atMissionStep(1) } });
  try {
    const writes = t.view.htmlWrites;
    t.press('I', { shiftKey: true }); // mid-drill: one rep in, nothing saved
    // Another tab saved a real change to this lesson.
    t.setCq({ ...t.cq, lessons: { ...t.cq.lessons, g5: { ...t.cq.lessons.g5, mission: [true] } } });
    t.lesson.refreshFromStorage();
    assert.equal(t.view.htmlWrites, writes, 'the screen was not rebuilt while the drill was mid-progress');
    assert.ok(t.view.querySelector('.cq-kp'), 'the drill is still mounted');

    // Finish it, then a later storage change is free to rebuild.
    t.press('I', { shiftKey: true });
    t.press('I', { shiftKey: true });
    t.advance(DONE_MS);
    assert.equal(t.state().mission[1], true);
    const after = t.view.htmlWrites;
    t.setCq({ ...t.cq, lessons: { ...t.cq.lessons, g5: { ...t.cq.lessons.g5, index: 2 } } });
    t.lesson.refreshFromStorage();
    assert.ok(t.view.htmlWrites > after, 'with no drill mounted, a storage change rebuilds normally');
  } finally { t.done(); }
}

// ---------- 4. leaving the lesson entirely destroys a mounted drill ----------
{
  const t = harness({ track: 'guided', lessonId: 'g5', lessons: { ...guidedThroughG4, g5: atMissionStep(1) } });
  const mounted = t.keydownListeners();
  t.done(); // destroy()
  assert.equal(t.keydownListeners(), mounted - 1, 'destroy() unmounts the drill and drops its listener');
}

// ---------- 5. a diagram step: the existing toggle still gates, the card only explains ----------
{
  const t = harness({ track: 'guided', lessonId: 'g1', lessons: { g1: atMissionStep(5) } });
  try {
    const toggle = t.view.querySelector('[data-action="tick"]');
    assert.ok(toggle, 'the diagram step keeps the manual "I did it" toggle');
    assert.ok(toggle.textContent.includes('I did it'));
    assert.equal(toggle.getAttribute('aria-pressed'), 'false');
    const host = t.view.querySelector('.cq-kd-host');
    assert.ok(host, 'and also shows the diagram host');
    assert.equal(host.dataset.step, '5');
    const card = host.querySelector('.cq-keydiag');
    assert.ok(card, 'with the real diagram card mounted inside');
    assert.equal(card.dataset.moments, '1');
    assert.ok(card.querySelector('.cq-keydiag-result').textContent.includes('The Start menu opens.'));
    assert.equal(t.keydownListeners(), 0, 'a diagram never listens for keys');
    assert.equal(t.view.querySelector('[data-action="mission-next"]').disabled, true, 'the diagram does not unlock Next by itself');
    assert.ok(t.rafCalls() > 0, 'the diagram loop is running');

    t.clickAction('tick');
    assert.equal(t.state().mission[5], true, 'the toggle works exactly as before');
    const ticked = t.view.querySelector('[data-action="tick"]');
    assert.equal(ticked.getAttribute('aria-pressed'), 'true');
    assert.ok(ticked.textContent.includes('Tap to undo'));
    assert.ok(t.view.querySelector('.cq-keydiag'), 'the diagram is unaffected by the toggle state');
    assert.equal(t.view.querySelector('[data-action="mission-next"]').disabled, false);

    t.clickAction('tick'); // undo still works
    assert.notEqual(t.state().mission[5], true);
    assert.ok(t.view.querySelector('.cq-keydiag'), 'and is still there after undoing');

    const before = t.rafCalls();
    t.runFrames(2);
    assert.ok(t.rafCalls() > before, 'the mounted diagram keeps asking for frames');
    t.lesson.destroy();
    const stopped = t.rafCalls();
    t.runFrames(2);
    assert.equal(t.rafCalls(), stopped, 'the destroyed diagram stops its rAF loop');
  } finally { t.done(); }
}

// ---------- 6. a two-moment diagram step (s1.4: Win+← then Win+→) renders both cards ----------
{
  const t = harness({ track: 'standard', lessonId: 's1', lessons: { s1: atMissionStep(4) } });
  try {
    const card = t.view.querySelector('.cq-kd-host .cq-keydiag');
    assert.ok(card);
    assert.equal(card.dataset.moments, '2', 'a sequence moment renders one card per step');
    assert.ok(t.view.querySelector('[data-action="tick"]'), 'and the toggle is still the gate');
  } finally { t.done(); }
}

// ---------- 7. regression: a step with no key moment renders exactly as before ----------
{
  const t = harness({ track: 'standard', lessonId: 's2', lessons: { s1: passed(), s2: atMissionStep(1) } });
  try {
    const toggle = t.view.querySelector('[data-action="tick"]');
    assert.ok(toggle, 'the original "I did it ✓" button');
    assert.ok(toggle.textContent.includes('I did it ✓'));
    assert.equal(t.view.querySelector('.cq-kp-host'), null, 'no drill host anywhere');
    assert.equal(t.view.querySelector('.cq-kd-host'), null, 'no diagram host anywhere');
    assert.equal(t.keydownListeners(), 0, 'nothing is listening for keys');
    assert.equal(t.rafCalls(), 0, 'nothing is animating');
    t.clickAction('tick');
    assert.equal(t.state().mission[1], true);
    assert.equal(t.view.querySelector('[data-action="mission-next"]').disabled, false);
  } finally { t.done(); }
}

// ---------- 8. a sequence practice step (g5.4: ← ×2 then → ×2) walks both drills in order ----------
{
  const t = harness({ track: 'guided', lessonId: 'g5', lessons: { ...guidedThroughG4, g5: atMissionStep(4) } });
  try {
    const instruction = () => t.view.querySelector('.cq-kp-instruction').textContent;
    assert.ok(instruction().includes('Press ← 2 times'), `first drill step: ${instruction()}`);
    t.press('ArrowLeft');
    t.press('ArrowLeft');
    assert.ok(instruction().includes('Press → 2 times'), `second drill step: ${instruction()}`);
    assert.notEqual(t.state().mission[4], true, 'the step is not done until the whole sequence is');
    t.press('ArrowRight');
    t.press('ArrowRight');
    t.advance(DONE_MS);
    assert.equal(t.state().mission[4], true, 'both halves done ticks the step');
    assert.ok(t.view.querySelector('.cq-done-static'));
  } finally { t.done(); }
}

console.log('ok — Computer Quest mission steps drive the real key-practice drill and shortcut diagram (docs §6)');
