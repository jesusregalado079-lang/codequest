// Computer Quest key-practice drill: the live replacement for a mission step's blind "I did it ✓"
// tick, for the keys a web page can honestly watch. Contract: docs/computer-quest/key-practice.md
// §1 (behaviour) and §3 (the `keyMoment` schema this reads).
//
// Standalone on purpose: it owns its markup, its stylesheet and its one window listener, and it is
// mounted/destroyed by whoever renders the step (the lesson screen wiring is a separate ticket).
// It reuses the Typing Dojo's keyboard data (KEYBOARD_ROWS/FINGER_FOR_KEY) and its `cq-kb-*` class
// names so the art, the finger colors and the gold "next key" glow come from the existing cq.css.
//
// The hard rule from the contract: this module only ever watches letters, Space, Enter, Backspace,
// Escape and the four arrows. Ctrl/Alt/Meta combos, Tab and F-keys are real OS/browser shortcuts —
// it never listens for them, never preventDefaults them, and silently ignores a moment that names
// one (those steps are diagram steps, not practice steps).
import { FINGER_FOR_KEY, KEYBOARD_ROWS } from '../typing/content.js';
import { FINGER_NAMES } from '../typing/view.js';
import { isActivationKey, isInteractiveOutside } from '../battle/view.js';

export const POP_MS = 220; // happy hop on a correct press
export const FLASH_MS = 320; // red flash on a wrong key (matches the Typing Dojo's WRONG_FLASH_MS)
export const DONE_MS = 500; // beat between the ✓ and onDone()
export const DONE_MS_REDUCED = 200; // …shorter with prefers-reduced-motion

const own = (object, key) => typeof key === 'string' && Object.prototype.hasOwnProperty.call(object, key);

// ---------- the safe key set ----------
// Pack 1 writes arrows as '←'/'→' and Escape as 'Esc' (docs §3/§5); normalize to real event.key names.
const ARROW_KEYS = { '←': 'ArrowLeft', '→': 'ArrowRight', '↑': 'ArrowUp', '↓': 'ArrowDown' };
const SPECIAL_KEYS = ['Enter', 'Backspace', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '];
// What a key is called on the keycap, and how it reads in a sentence.
const KEY_LABELS = { Enter: 'Enter', Backspace: 'Backspace', Escape: 'Esc', ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', ' ': 'Space' };
const KEY_WORDS = { Enter: 'Enter', Backspace: 'Backspace', Escape: 'Esc', ArrowLeft: 'the left arrow', ArrowRight: 'the right arrow', ArrowUp: 'the up arrow', ArrowDown: 'the down arrow', ' ': 'Space' };
// Older browsers report these older names; accept both.
const KEY_ALIASES = { Escape: ['Escape', 'Esc'], ' ': [' ', 'Spacebar'] };
// Fingers for the keys the 10-finger chart doesn't cover. Arrows get the neutral tint on purpose —
// they are not part of the home-row chart and we don't want to teach a finger for them.
const EXTRA_FINGERS = { Escape: 'L5', Backspace: 'R5', Enter: 'R5', ArrowLeft: 'thumb', ArrowRight: 'thumb', ArrowUp: 'thumb', ArrowDown: 'thumb' };
const isLetter = (value) => typeof value === 'string' && /^[A-Za-z]$/.test(value);

// 'I' + shift -> 'I'; 'i' + shift -> 'I'; '←' -> 'ArrowLeft'; 'Tab'/'F2'/'⊞'/'5' -> null (never ours).
export function canonicalKey(tap, shift) {
  if (typeof tap !== 'string') return null;
  let raw = tap.trim();
  if (!raw) return null;
  if (own(ARROW_KEYS, raw)) raw = ARROW_KEYS[raw];
  else if (raw === 'Esc') raw = 'Escape';
  else if (raw === 'Space' || raw === 'Spacebar' || raw === '␣') raw = ' ';
  if (isLetter(raw)) return shift ? raw.toUpperCase() : raw.toLowerCase();
  return SPECIAL_KEYS.indexOf(raw) === -1 ? null : raw;
}

const labelFor = (key) => (own(KEY_LABELS, key) ? KEY_LABELS[key] : key.toUpperCase());
const wordFor = (key) => (own(KEY_WORDS, key) ? KEY_WORDS[key] : key.toUpperCase());
// The on-screen keyboard id: KEYBOARD_ROWS uses lowercase letters and ' ' for Space.
const boardIdFor = (key) => (isLetter(key) ? key.toLowerCase() : key);

function buildStep(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const shift = Boolean(entry.shift);
  const key = canonicalKey(entry.tap, shift);
  if (key === null) return null;
  const reps = Number.isFinite(entry.reps) && entry.reps >= 1 ? Math.floor(entry.reps) : 1;
  return {
    key,
    shift,
    reps,
    accepts: own(KEY_ALIASES, key) ? KEY_ALIASES[key].slice() : [key],
    label: labelFor(key),
    word: wordFor(key),
    boardId: boardIdFor(key),
  };
}

// A `keyMoment` -> the ordered list of drill steps. `{ tap, shift?, reps? }` is one step;
// `{ sequence: [...] }` is several, done in order. Entries naming a key we must not capture are
// dropped silently (by design the pack only ever hands us safe keys — this is the guard, not a path).
export function keyPracticePlan(moment) {
  if (!moment || typeof moment !== 'object') return [];
  if (typeof moment.kind === 'string' && moment.kind !== 'practice') return [];
  const entries = Array.isArray(moment.sequence) ? moment.sequence : [moment];
  const steps = [];
  entries.forEach((entry) => {
    const step = buildStep(entry);
    if (step) steps.push(step);
  });
  return steps;
}

// "Press Enter" / "Press Backspace 3 times" / "Hold Shift, then press I 3 times" — built from the
// data, never from a per-key string table.
export function instructionFor(step) {
  if (!step) return '';
  const base = step.shift ? `Hold Shift, then press ${step.label}` : `Press ${step.label}`;
  return step.reps > 1 ? `${base} ${step.reps} times` : base;
}
export function spokenFor(step) {
  if (!step) return '';
  const base = step.shift ? `Hold Shift and press ${step.word}` : `Press ${step.word}`;
  return step.reps > 1 ? `${base}, ${step.reps} times` : base;
}
// The finger the Typing Dojo's chart teaches for this key, as a sentence — or '' when it isn't charted.
export function fingerHintFor(step) {
  if (!step || !own(FINGER_FOR_KEY, step.key)) return '';
  const finger = FINGER_FOR_KEY[step.key].finger;
  const name = own(FINGER_NAMES, finger) ? FINGER_NAMES[finger] : '';
  if (!name) return '';
  return finger === 'thumb' ? 'Use your thumb.' : `Use your ${name} finger.`;
}

// Does this keydown satisfy `step`? Case-sensitive for letters, and Shift must match exactly, so a
// plain `i` never passes a `Shift+I` step. Ctrl/Alt/Meta combos are never a practice press.
export function matchesStep(event, step) {
  if (!event || !step) return false;
  if (event.ctrlKey || event.altKey || event.metaKey) return false;
  if (Boolean(event.shiftKey) !== step.shift) return false;
  const key = typeof event.key === 'string' ? event.key : '';
  if (step.accepts.indexOf(key) !== -1) return true;
  return step.key === ' ' && event.code === 'Space';
}

// Only these may ever be preventDefault()ed, and never with a modifier held.
export function isSafeEventKey(event) {
  if (!event || event.ctrlKey || event.altKey || event.metaKey) return false;
  const key = typeof event.key === 'string' ? event.key : '';
  if (isLetter(key)) return true;
  if (key === 'Esc' || key === 'Spacebar') return true;
  return SPECIAL_KEYS.indexOf(key) !== -1;
}

// ---------- styles ----------
// One <style> per document (CSP here allows style-src 'unsafe-inline'; no inline scripts/handlers).
// Everything else — key shape, finger tints, the gold glow — is reused from cq.css's `.cq-kb-*`.
const STYLE_ID = 'cq-kp-style';
const STYLE_TEXT = `
.cq-kp { margin:12px 0 0; }
.cq-kp-instruction { margin:0 0 4px; font:700 clamp(15px,3.4vw,19px)/1.35 inherit; color:#f4e3b1; }
.cq-kp[data-phase="done"] .cq-kp-instruction { color:#a8e0a0; }
.cq-kp-hint { margin:0 0 8px; }
.cq-kp-reps { display:flex; gap:6px; margin:0 0 8px; padding:0; list-style:none; font-size:20px; line-height:1; color:#b0c9d2; }
.cq-kp-reps[hidden] { display:none; }
.cq-kp-dot-on { color:var(--gold,#ffd76a); }
.cq-kp-dot.cq-kp-pop { animation:cq-kp-pop 220ms ease-out; }
.cq-kp-kb { margin-top:4px; }
.cq-kp-key.cq-kp-target { animation:cq-kp-pulse 1.2s ease-in-out infinite; }
.cq-kp-key.cq-kp-pop { animation:cq-kp-pop 220ms ease-out; z-index:2; }
.cq-kp-miss { animation:cq-kp-miss 320ms ease-out; }
@keyframes cq-kp-pop { 0%,100% { transform:translateY(0) scale(1); } 40% { transform:translateY(-4px) scale(1.12); } }
@keyframes cq-kp-pulse { 0%,100% { box-shadow:0 0 0 6px var(--gold,#ffd76a); } 50% { box-shadow:0 0 0 11px rgba(255,215,106,.4); } }
@keyframes cq-kp-miss { 0%,100% { box-shadow:none; } 25%,75% { box-shadow:0 0 0 5px rgba(232,110,110,.9); } }
@media(prefers-reduced-motion:reduce) {
  .cq-kp-key.cq-kp-target,.cq-kp-key.cq-kp-pop,.cq-kp-dot.cq-kp-pop,.cq-kp-miss { animation:none; }
  .cq-kp-key.cq-kp-target { box-shadow:0 0 0 6px var(--gold,#ffd76a); }
}`;

function ensureStyles(doc) {
  try {
    if (!doc || !doc.head || typeof doc.head.appendChild !== 'function') return;
    if (typeof doc.getElementById === 'function' && doc.getElementById(STYLE_ID)) return;
    const style = doc.createElement('style');
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  } catch { /* Styling is a nicety; the drill still works without it. */ }
}

// ---------- mount ----------
// mountKeyPractice(container, { moment, onDone, sound }) -> { destroy }
//   moment  a `keyMoment` with kind:'practice' — `{ tap, shift?, reps? }` or `{ sequence: [...] }`
//   onDone  called once, ~500ms after the last rep (never after destroy())
//   sound   optional `{ tap(), win() }`; both calls are optional and never allowed to throw upward
// Appends its own root to `container` (it does not clear it — the step's text stays put).
export function mountKeyPractice(container, opts) {
  const options = opts || {};
  const doc = (container && container.ownerDocument) || (typeof document === 'undefined' ? null : document);
  const win = (doc && doc.defaultView) || (typeof window === 'undefined' ? null : window);
  const noop = { destroy() {} };
  if (!container || !doc || !win || typeof doc.createElement !== 'function') return noop;

  const onDone = typeof options.onDone === 'function' ? options.onDone : null;
  const sound = options.sound;
  const plan = keyPracticePlan(options.moment);
  let reduced = false;
  try { reduced = Boolean(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch { reduced = false; }

  let mounted = true;
  let phase = plan.length ? 'run' : 'idle'; // 'run' | 'done' | 'idle' (nothing safe to drill)
  let stepIndex = 0;
  let repsDone = 0;
  let calledDone = false;
  let popTimer = 0;
  let missTimer = 0;
  let doneTimer = 0;
  let popped = [];
  let missed = [];
  let glowing = [];
  let dotNodes = [];

  ensureStyles(doc);

  const el = (tag, className) => {
    const node = doc.createElement(tag);
    if (className) node.className = className;
    return node;
  };

  const root = el('div', 'cq-kp');
  root.setAttribute('data-phase', phase);
  const instructionEl = el('p', 'cq-kp-instruction');
  const hintEl = el('p', 'cq-kp-hint cq-muted');
  const dotsEl = el('ol', 'cq-kp-reps');
  dotsEl.setAttribute('aria-hidden', 'true');
  const boardEl = el('div', 'cq-kb cq-kp-kb');
  boardEl.setAttribute('aria-hidden', 'true');
  const rowsEl = el('div', 'cq-kb-rows');
  boardEl.appendChild(rowsEl);
  const srEl = el('p', 'cq-sr cq-kp-sr');
  srEl.setAttribute('role', 'status');
  srEl.setAttribute('aria-live', 'polite');

  // ---------- the on-screen keyboard ----------
  const keyNodes = {};
  function addKey(row, id, label, finger, width, bump) {
    const node = el('span', `cq-kb-key cq-kp-key${bump ? ' cq-kb-bump' : ''}`);
    node.setAttribute('data-k', id);
    node.setAttribute('data-finger', finger);
    node.setAttribute('style', `--w:${width}`);
    node.textContent = label;
    row.appendChild(node);
    if (!own(keyNodes, id)) keyNodes[id] = node;
    return node;
  }
  function addRow(index) {
    const row = el('div', `cq-kb-row cq-kb-row-${index}`);
    rowsEl.appendChild(row);
    return row;
  }
  const keyNode = (id) => (own(keyNodes, id) ? keyNodes[id] : null);

  function buildBoard() {
    const needed = {};
    plan.forEach((step) => { needed[step.boardId] = true; });
    const wantsArrow = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].some((id) => own(needed, id));
    // Row 0: only the editing keys this moment actually asks for, so the board stays compact.
    const extras = ['Escape', 'Backspace', 'Enter'].filter((id) => own(needed, id));
    let rowIndex = 0;
    if (extras.length) {
      const row = addRow(rowIndex);
      extras.forEach((id) => addKey(row, id, KEY_LABELS[id], EXTRA_FINGERS[id], id === 'Escape' ? 1 : 2, false));
      rowIndex += 1;
    }
    // The Typing Dojo's own rows, ids and finger tints.
    KEYBOARD_ROWS.forEach((keys) => {
      const row = addRow(rowIndex);
      rowIndex += 1;
      keys.forEach((k) => {
        const id = k.key === 'Shift' ? `Shift-${k.finger}` : k.key;
        addKey(row, id, k.label, k.finger, Number.isFinite(k.width) ? k.width : 1, Boolean(k.bump));
      });
    });
    // Last row: the arrow cluster, all four together so left/right read in context.
    if (wantsArrow) {
      const row = addRow(rowIndex);
      ['ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowRight'].forEach((id) => addKey(row, id, KEY_LABELS[id], EXTRA_FINGERS[id], 1, false));
    }
  }

  // ---------- glow / pop / flash (no full rebuilds: only these nodes change per keystroke) ----------
  function clearGlow() {
    glowing.forEach((node) => { node.classList.remove('cq-kb-next'); node.classList.remove('cq-kp-target'); });
    glowing = [];
  }
  function shiftNodesFor(step) {
    // Charted letters glow the OTHER hand's Shift (correct technique, same rule as keyHighlight);
    // anything not on the chart (e.g. Shift+→) glows both, which is honest rather than wrong.
    const chart = own(FINGER_FOR_KEY, step.key) ? FINGER_FOR_KEY[step.key] : null;
    if (chart && typeof chart.finger === 'string') {
      const node = keyNode(chart.finger.charAt(0) === 'L' ? 'Shift-R5' : 'Shift-L5');
      if (node) return [node];
    }
    const both = [];
    ['Shift-L5', 'Shift-R5'].forEach((id) => { const node = keyNode(id); if (node) both.push(node); });
    return both;
  }
  function targetNodes(step) {
    const nodes = [];
    const main = keyNode(step.boardId);
    if (main) nodes.push(main);
    if (step.shift) shiftNodesFor(step).forEach((node) => nodes.push(node));
    return nodes;
  }
  function applyGlow(step) {
    clearGlow();
    if (!step) return;
    glowing = targetNodes(step);
    glowing.forEach((node) => { node.classList.add('cq-kb-next'); node.classList.add('cq-kp-target'); });
  }
  function unpop() {
    if (popTimer) { clearTimeout(popTimer); popTimer = 0; }
    popped.forEach((node) => node.classList.remove('cq-kp-pop'));
    popped = [];
  }
  function pop(nodes) {
    unpop();
    nodes.forEach((node) => { if (node) { node.classList.add('cq-kp-pop'); popped.push(node); } });
    if (popped.length) popTimer = setTimeout(() => { popTimer = 0; unpop(); }, POP_MS);
  }
  function unflash() {
    if (missTimer) { clearTimeout(missTimer); missTimer = 0; }
    missed.forEach((node) => node.classList.remove('cq-kp-miss'));
    missed = [];
  }
  // A wrong key is never a penalty (docs §1): it flashes its own keycap red and nothing else happens.
  function flashWrong(key) {
    unflash();
    const node = keyNode(boardIdFor(key)) || boardEl;
    node.classList.add('cq-kp-miss');
    missed.push(node);
    missTimer = setTimeout(() => { missTimer = 0; unflash(); }, FLASH_MS);
  }

  // ---------- rep counter ----------
  function renderDots(step) {
    while (dotNodes.length) dotsEl.removeChild(dotNodes.pop());
    const show = Boolean(step) && step.reps > 1;
    dotsEl.hidden = !show;
    if (show) dotsEl.removeAttribute('hidden'); else dotsEl.setAttribute('hidden', '');
    if (!show) return;
    for (let i = 0; i < step.reps; i += 1) {
      const dot = el('li', 'cq-kp-dot');
      dot.textContent = '○';
      dotsEl.appendChild(dot);
      dotNodes.push(dot);
    }
  }
  function fillDot(index) {
    const dot = index >= 0 && index < dotNodes.length ? dotNodes[index] : null;
    if (!dot) return null;
    dot.classList.add('cq-kp-dot-on');
    dot.textContent = '●';
    return dot;
  }

  // ---------- steps ----------
  function showStep() {
    const step = plan[stepIndex];
    instructionEl.textContent = instructionFor(step);
    hintEl.textContent = fingerHintFor(step);
    hintEl.hidden = !hintEl.textContent;
    renderDots(step);
    applyGlow(step);
    srEl.textContent = spokenFor(step);
  }

  function ping(name) {
    try { if (sound && typeof sound[name] === 'function') sound[name](); } catch { /* Sound is optional. */ }
  }

  function finish() {
    phase = 'done';
    clearGlow();
    root.setAttribute('data-phase', 'done');
    instructionEl.textContent = '✓ Got it!';
    hintEl.textContent = '';
    hintEl.hidden = true;
    srEl.textContent = 'Done!';
    ping('win');
    doneTimer = setTimeout(() => {
      doneTimer = 0;
      if (!mounted || calledDone) return;
      calledDone = true;
      if (onDone) onDone();
    }, reduced ? DONE_MS_REDUCED : DONE_MS);
  }

  function registerHit() {
    const step = plan[stepIndex];
    ping('tap');
    const dot = fillDot(repsDone);
    const nodes = targetNodes(step);
    if (dot) nodes.push(dot);
    pop(nodes);
    repsDone += 1;
    if (repsDone < step.reps) {
      srEl.textContent = `${repsDone} of ${step.reps}`;
      return;
    }
    stepIndex += 1;
    repsDone = 0;
    if (stepIndex >= plan.length) { finish(); return; }
    showStep();
  }

  // ---------- input ----------
  function onKeyDown(event) {
    if (!mounted || phase !== 'run' || !event) return;
    // Ctrl/Alt/Meta combos belong to Windows and the browser — never to this drill.
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    // b12 (battle/view.js): a focused control outside this drill — a "Next ▶" button the kid tabbed
    // onto — only gets Space and Enter. Every other key still drills.
    const target = event.target && typeof event.target.closest === 'function' ? event.target : doc.activeElement;
    if (isInteractiveOutside(target, container) && isActivationKey(event)) return;
    const step = plan[stepIndex];
    if (!step) return;
    if (matchesStep(event, step)) {
      if (isSafeEventKey(event) && typeof event.preventDefault === 'function') event.preventDefault();
      if (event.repeat) return; // holding a key down is not three presses
      unflash();
      registerHit();
      return;
    }
    // Wrong key: no preventDefault (it may be the kid's browser shortcut), no penalty, just a flash.
    if (typeof event.key === 'string' && event.key.length === 1) flashWrong(event.key);
  }

  buildBoard();
  root.appendChild(instructionEl);
  root.appendChild(hintEl);
  root.appendChild(dotsEl);
  root.appendChild(boardEl);
  root.appendChild(srEl);
  if (plan.length) showStep();
  else { hintEl.hidden = true; dotsEl.hidden = true; dotsEl.setAttribute('hidden', ''); }
  container.appendChild(root);
  win.addEventListener('keydown', onKeyDown);

  return {
    // Safe at any time, including mid-drill and twice: drops the listener, kills every timer, and
    // guarantees onDone() is never called afterwards.
    destroy() {
      if (!mounted) return;
      mounted = false;
      phase = 'idle';
      win.removeEventListener('keydown', onKeyDown);
      if (popTimer) { clearTimeout(popTimer); popTimer = 0; }
      if (missTimer) { clearTimeout(missTimer); missTimer = 0; }
      if (doneTimer) { clearTimeout(doneTimer); doneTimer = 0; }
      if (root.parentNode && typeof root.parentNode.removeChild === 'function') root.parentNode.removeChild(root);
    },
  };
}
