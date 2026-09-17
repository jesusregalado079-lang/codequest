// Computer Quest shortcut diagrams (docs/computer-quest/key-practice.md §2).
//
// A Ctrl/Alt/Windows-key/Tab/F2 combo is the one thing this app must never try to capture, so the
// step gets EXPLAINED instead: hold these keys, tap that one, let go, here is what happens — plus a
// blocky-pixel scene from scenes.js so "what happens" has a picture, not just a sentence.
//
// This block is deliberately dumb: no keyboard listener, no onDone, no gate. It never blocks the
// step's existing "I did it ✓" tick. All it owns is one rAF loop repainting the scene canvases.
//
//   mountKeyDiagram(container, { moment, sound }) -> { destroy, root }
//
// `moment` is one { hold, tap, taps?, result, scene } or { sequence: [ ...those ] } (a step with two
// moments, e.g. Ctrl+C then Ctrl+V, renders as a row of cards). `sound` is accepted for API symmetry
// with the other mounts and is intentionally never called: this card loops forever next to the step
// text, and a noise on every pulse would nag rather than teach.
import { drawScene, hasScene } from './scenes.js';

const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export const CYCLE_MS = 1500;      // one hold → tap → result beat
export const SCENE_CSS_W = 160;
export const SCENE_CSS_H = 120;
const PULSE_ON = 0.42;             // share of each tap beat the key spends lit

// Keycap sizing: the wide modifier labels need more room than a single letter.
const capWidth = (label) => (String(label).length > 3 ? 2.6 : String(label).length > 1 ? 1.8 : 1.2);

function one(value) {
  if (!value || typeof value !== 'object') return null;
  const hold = Array.isArray(value.hold)
    ? value.hold.filter((k) => typeof k === 'string' && k.length > 0).slice(0, 3)
    : [];
  const tap = typeof value.tap === 'string' ? value.tap : '';
  const taps = Number.isFinite(value.taps) && value.taps > 1 ? Math.min(6, Math.floor(value.taps)) : 1;
  return {
    hold,
    tap,
    taps,
    result: typeof value.result === 'string' ? value.result : '',
    scene: typeof value.scene === 'string' && hasScene(value.scene) ? value.scene : '',
  };
}

// One moment, or the `sequence` of a two-moment step, as a flat list. Always returns an array.
// A sequence step (e.g. Ctrl+C then Ctrl+V) often carries one shared `result` describing the combined
// action at the TOP level of the moment rather than repeated on each item — fall back to that when an
// individual sequence entry has no `result` of its own, so neither card renders a blank sentence.
export function momentList(moment) {
  if (!moment || typeof moment !== 'object') return [];
  if (Array.isArray(moment.sequence)) {
    const sharedResult = typeof moment.result === 'string' ? moment.result : '';
    return moment.sequence
      .map((item) => (item && typeof item === 'object' && typeof item.result !== 'string' && sharedResult
        ? { ...item, result: sharedResult } : item))
      .map(one).filter(Boolean).slice(0, 3);
  }
  const single = one(moment);
  return single ? [single] : [];
}

function el(doc, tag, className, cssText) {
  const node = doc.createElement(tag);
  if (className) node.className = className;
  if (cssText && node.style) node.style.cssText = cssText;
  return node;
}

// Keycaps are styled inline so this module stands on its own (it adds no rules to cq.css); the
// cq-kb-key class is kept so the lesson screen can theme it later without a rebuild.
const CAP_BASE = 'display:inline-grid;place-items:center;box-sizing:border-box;min-width:34px;'
  + 'height:34px;padding:0 8px;margin:0 6px 0 0;border:1px solid #0c2034;border-bottom-width:3px;'
  + 'border-radius:4px;font:700 14px/1 ui-monospace,SFMono-Regular,Consolas,monospace;color:#10263d;';

function keycap(doc, label, state) {
  const cap = el(doc, 'span', `cq-kb-key cq-keydiag-key cq-keydiag-key-${state}`, CAP_BASE);
  cap.dataset.state = state;                       // 'held' | 'tap' — the inspectable difference
  cap.dataset.key = String(label);
  if (cap.style && cap.style.setProperty) {
    cap.style.setProperty('--w', String(capWidth(label)));
    cap.style.setProperty('--f', state === 'held' ? '#ffd76a' : '#c9d4d8');
  }
  cap.style.background = state === 'held' ? '#ffd76a' : '#c9d4d8';
  if (state === 'held') {
    // Held stays lit, always, for as long as the card is on screen.
    cap.style.opacity = '1';
    cap.style.boxShadow = '0 0 0 3px #fff, 0 0 0 7px rgba(255,215,106,0.55)';
  } else {
    cap.dataset.pulse = 'off';
    cap.style.opacity = '0.72';
    cap.style.boxShadow = 'none';
  }
  cap.textContent = String(label);
  return cap;
}

function row(doc, label, labelId) {
  const line = el(doc, 'p', `cq-keydiag-row cq-keydiag-row-${labelId}`,
    'display:flex;align-items:center;gap:10px;margin:0 0 8px;min-height:36px;');
  line.dataset.row = labelId;
  const tag = el(doc, 'span', 'cq-keydiag-step',
    'flex:0 0 118px;font:700 12px/1.2 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.06em;');
  tag.textContent = label;
  line.appendChild(tag);
  const keys = el(doc, 'span', 'cq-keydiag-keys', 'display:flex;align-items:center;flex-wrap:wrap;');
  line.appendChild(keys);
  return { line, keys };
}

function card(doc, moment, dpr) {
  const node = el(doc, 'div', 'cq-keydiag-card',
    'display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap;padding:12px;'
    + 'border:2px solid #0c2034;border-radius:8px;background:#f2f6fb;');
  node.dataset.scene = moment.scene;

  const canvas = el(doc, 'canvas', 'cq-keydiag-scene',
    `width:${SCENE_CSS_W}px;height:${SCENE_CSS_H}px;flex:0 0 auto;border:2px solid #0c2034;`
    + 'border-radius:4px;image-rendering:pixelated;');
  canvas.width = Math.max(1, Math.round(SCENE_CSS_W * dpr));
  canvas.height = Math.max(1, Math.round(SCENE_CSS_H * dpr));
  canvas.setAttribute('aria-hidden', 'true');
  if (!moment.scene) canvas.hidden = true;
  node.appendChild(canvas);

  const steps = el(doc, 'div', 'cq-keydiag-steps', 'flex:1 1 220px;min-width:200px;');
  node.appendChild(steps);

  const holdRow = row(doc, 'HOLD DOWN', 'hold');
  const heldCaps = [];
  if (moment.hold.length === 0) {
    const none = el(doc, 'span', 'cq-keydiag-none', 'font:700 13px/1.2 system-ui,sans-serif;opacity:.7;');
    none.textContent = 'nothing — just tap it';
    holdRow.keys.appendChild(none);
  } else {
    moment.hold.forEach((label) => {
      const cap = keycap(doc, label, 'held');
      heldCaps.push(cap);
      holdRow.keys.appendChild(cap);
    });
  }
  steps.appendChild(holdRow.line);

  const tapRow = row(doc, 'THEN TAP', 'tap');
  const tapCap = moment.tap ? keycap(doc, moment.tap, 'tap') : null;
  if (tapCap) tapRow.keys.appendChild(tapCap);
  if (moment.taps > 1) {
    const badge = el(doc, 'span', 'cq-keydiag-times',
      'font:700 13px/1 ui-monospace,SFMono-Regular,Consolas,monospace;padding:3px 6px;'
      + 'border-radius:4px;background:#0c2034;color:#ffd76a;');
    badge.dataset.taps = String(moment.taps);
    badge.textContent = `×${moment.taps}`;
    tapRow.keys.appendChild(badge);
  }
  steps.appendChild(tapRow.line);

  const letGo = el(doc, 'p', 'cq-keydiag-letgo',
    'margin:0 0 8px;font:700 12px/1.2 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.06em;');
  letGo.dataset.row = 'letgo';
  letGo.textContent = 'LET GO OF BOTH';
  steps.appendChild(letGo);

  // The one place untrusted-shaped data meets innerHTML: escape it, per the app's esc() convention.
  const what = el(doc, 'p', 'cq-keydiag-result', 'margin:0;font:400 15px/1.4 system-ui,sans-serif;');
  what.dataset.row = 'result';
  what.innerHTML = `<span class="cq-keydiag-what">WHAT HAPPENS:</span> ${esc(moment.result)}`;
  steps.appendChild(what);

  const ctx = typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
  return {
    node,
    ctx: moment.scene ? ctx : null,
    scene: moment.scene,
    view: { x: 0, y: 0, w: canvas.width, h: canvas.height },
    tapCap,
    heldCaps,
    taps: moment.taps,
    lit: null,
  };
}

// The tap key flashes `taps` times per cycle; held keys never change. Styles are touched only on the
// frame the lit/unlit state actually flips, so nothing rebuilds per frame but the canvas.
function pulse(item, t, forceLit) {
  const cap = item.tapCap;
  if (!cap) return;
  const phase = (t * item.taps) % 1;
  const lit = forceLit ? true : phase < PULSE_ON;
  if (item.lit === lit) return;
  item.lit = lit;
  cap.dataset.pulse = lit ? 'on' : 'off';
  cap.style.opacity = lit ? '1' : '0.72';
  cap.style.background = lit ? '#ffd76a' : '#c9d4d8';
  cap.style.boxShadow = lit ? '0 0 0 3px #fff, 0 0 0 7px rgba(255,215,106,0.55)' : 'none';
  cap.style.transform = lit ? 'translateY(2px)' : 'none';
}

export function mountKeyDiagram(container, opts) {
  const options = opts || {};
  const moments = momentList(options.moment);
  const doc = container && container.ownerDocument ? container.ownerDocument : null;
  if (!doc || moments.length === 0) return { destroy() {}, root: null };
  const win = doc.defaultView || null;

  let reduced = false;
  try {
    reduced = Boolean(win && win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (err) { reduced = false; }
  const dpr = win && Number.isFinite(win.devicePixelRatio) && win.devicePixelRatio > 0 ? win.devicePixelRatio : 1;

  const root = el(doc, 'div', 'cq-keydiag',
    'display:flex;gap:12px;flex-wrap:wrap;margin:12px 0 0;');
  root.dataset.moments = String(moments.length);
  const items = moments.map((moment) => {
    const built = card(doc, moment, dpr);
    root.appendChild(built.node);
    return built;
  });
  if (typeof container.append === 'function') container.append(root);
  else container.appendChild(root);

  const paint = (t) => {
    items.forEach((item) => {
      if (item.ctx) drawScene(item.scene, item.ctx, t, item.view);
      pulse(item, t, reduced);
    });
  };

  let raf = 0;
  let mounted = true;
  let start = null;

  if (reduced) {
    // Frozen on the "after" frame: no loop at all, nothing to cancel.
    paint(1);
  } else {
    const frame = (ts) => {
      if (!mounted) return;
      const now = Number.isFinite(ts) ? ts : 0;
      if (start === null) start = now;
      paint(((now - start) % CYCLE_MS) / CYCLE_MS);
      raf = win && win.requestAnimationFrame ? win.requestAnimationFrame(frame) : 0;
    };
    paint(0);
    raf = win && win.requestAnimationFrame ? win.requestAnimationFrame(frame) : 0;
  }

  return {
    root,
    destroy() {
      if (!mounted) return;
      mounted = false;
      if (raf && win && win.cancelAnimationFrame) win.cancelAnimationFrame(raf);
      raf = 0;
      if (root.parentNode && typeof root.parentNode.removeChild === 'function') root.parentNode.removeChild(root);
    },
  };
}
