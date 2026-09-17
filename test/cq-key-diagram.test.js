// Computer Quest shortcut diagrams: the scene library rendered against a recording 2D context, and
// mountKeyDiagram driven on a stub DOM with a manual rAF (docs/computer-quest/key-practice.md §2-§4).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { drawScene, hasScene, SCENE_GRID, SCENE_IDS, SCENES } from '../src/cq/lessons/scenes.js';
import { CYCLE_MS, momentList, mountKeyDiagram, SCENE_CSS_H, SCENE_CSS_W } from '../src/cq/lessons/diagram-ui.js';

// ---------- the scene library covers every id the doc's §4 table / §5 list names ----------
const EXPECTED = [
  'start-open', 'file-explorer-open', 'alt-tab-preview', 'snap-left', 'snap-right',
  'desktop-toggle', 'undo-arrow', 'copy-twin', 'paste-drop', 'save-dot-gone', 'rename-box',
];
assert.deepEqual(SCENE_IDS.slice().sort(), EXPECTED.slice().sort(), 'every scene id in §4/§5 has a draw function');
assert.deepEqual(SCENE_GRID, { w: 40, h: 30 }, 'the doc\'s ~40x30 grid');
EXPECTED.forEach((id) => {
  assert.equal(typeof SCENES[id].draw, 'function', `${id}.draw`);
  assert.equal(hasScene(id), true, id);
});
['', 'nope', '__proto__', 'constructor', 'toString', null, undefined, 7].forEach((id) => {
  assert.equal(hasScene(id), false, `unknown scene id: ${String(id)}`);
});

// ---------- renderer smoke run ----------
const COLOR = /^(#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8}|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*(0|1|0?\.\d+)\s*)?\))$/i;
function recordingContext() {
  return {
    rects: 0, badRects: [], badStyles: [], ops: [], _fill: '#000000', imageSmoothingEnabled: true,
    get fillStyle() { return this._fill; },
    set fillStyle(value) { if (typeof value !== 'string' || !COLOR.test(value)) this.badStyles.push(value); this._fill = value; },
    fillRect(x, y, w, h) {
      this.rects += 1;
      if (![x, y, w, h].every(Number.isFinite)) this.badRects.push([x, y, w, h]);
      if (!(w > 0) || !(h > 0)) this.badRects.push(['empty', x, y, w, h]);
      this.ops.push(`${this._fill}|${x},${y},${w},${h}`);
    },
    clearRect(x, y, w, h) { if (![x, y, w, h].every(Number.isFinite)) this.badRects.push(['clear', x, y, w, h]); },
    save() {}, restore() {},
  };
}

const TIMES = [0, 0.01, 0.12, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9, 0.99, 1];
const VIEWS = [
  { x: 0, y: 0, w: 160, h: 120 },
  { x: 0, y: 0, w: 320, h: 240 },
  { x: 12, y: 7, w: 200, h: 120 },
  undefined,
];
{
  const ctx = recordingContext();
  EXPECTED.forEach((id) => {
    VIEWS.forEach((view) => {
      TIMES.forEach((t) => {
        const before = ctx.rects;
        assert.doesNotThrow(() => SCENES[id].draw(ctx, t, view), `${id} @ t=${t}`);
        assert.ok(ctx.rects > before + 8, `${id} @ t=${t} actually draws something (${ctx.rects - before} rects)`);
      });
    });
  });
  assert.deepEqual(ctx.badRects.slice(0, 4), [], 'fillRect only ever gets finite, positive-sized boxes');
  assert.deepEqual(ctx.badStyles.slice(0, 4), [], 'fillStyle is always a valid color string');

  // Junk t / junk view never throws and never leaks a bad rect.
  [NaN, Infinity, -Infinity, -3, 4, null, undefined, '0.5', {}].forEach((t) => {
    EXPECTED.forEach((id) => assert.doesNotThrow(() => SCENES[id].draw(ctx, t, { x: 0, y: 0, w: 160, h: 120 }), `${id} @ t=${String(t)}`));
  });
  [{ w: 0, h: 0 }, { w: -5, h: 10 }, { w: NaN, h: NaN }, {}, null].forEach((view) => {
    EXPECTED.forEach((id) => assert.doesNotThrow(() => SCENES[id].draw(ctx, 0.5, view), `${id} @ view=${JSON.stringify(view)}`));
  });
  assert.deepEqual(ctx.badRects.slice(0, 4), [], 'junk input still produces only valid rects');
  assert.deepEqual(ctx.badStyles.slice(0, 4), []);
}

// Deterministic: the same scene at the same t draws exactly the same rects (no Math.random anywhere).
{
  EXPECTED.forEach((id) => {
    const a = recordingContext();
    const b = recordingContext();
    [0, 0.33, 0.77, 1].forEach((t) => {
      SCENES[id].draw(a, t, { x: 0, y: 0, w: 160, h: 120 });
      SCENES[id].draw(b, t, { x: 0, y: 0, w: 160, h: 120 });
    });
    assert.deepEqual(a.ops, b.ops, `${id} is deterministic`);
  });
  // Scenes move: the "before" frame and the "after" frame are not the same picture.
  EXPECTED.forEach((id) => {
    const a = recordingContext();
    const b = recordingContext();
    SCENES[id].draw(a, 0, { x: 0, y: 0, w: 160, h: 120 });
    SCENES[id].draw(b, 1, { x: 0, y: 0, w: 160, h: 120 });
    assert.notDeepEqual(a.ops, b.ops, `${id} animates between t=0 and t=1`);
  });
}

// drawScene(): a safe lookup that never throws on a bad id or a missing ctx.
{
  const ctx = recordingContext();
  assert.equal(drawScene('snap-left', ctx, 0.5, { x: 0, y: 0, w: 160, h: 120 }), true);
  assert.ok(ctx.rects > 0);
  assert.equal(drawScene('nope', ctx, 0.5), false);
  assert.equal(drawScene('__proto__', ctx, 0.5), false);
  assert.equal(drawScene('snap-left', null, 0.5), false);
  assert.equal(drawScene(null, ctx, 0.5), false);
}

// ---------- moment shape ----------
{
  const single = { hold: ['Ctrl'], tap: 'S', result: 'Your work is saved.', scene: 'save-dot-gone' };
  assert.deepEqual(momentList(single), [{ hold: ['Ctrl'], tap: 'S', taps: 1, result: 'Your work is saved.', scene: 'save-dot-gone' }]);
  assert.equal(momentList({ sequence: [single, { hold: ['Ctrl'], tap: 'V', result: 'It appears.', scene: 'paste-drop' }] }).length, 2);
  assert.deepEqual(momentList(null), []);
  assert.deepEqual(momentList('x'), []);
  assert.deepEqual(momentList({ sequence: [] }), []);
  assert.equal(momentList({ hold: 'Ctrl', tap: 5, taps: 'x', result: 7, scene: 'nope' })[0].hold.length, 0, 'a non-array hold is dropped, not spread');
  assert.deepEqual(momentList({ hold: null, tap: null, result: null, scene: null })[0], { hold: [], tap: '', taps: 1, result: '', scene: '' });
  assert.equal(momentList({ hold: ['Alt'], tap: 'Tab', taps: 2, result: 'x', scene: 'alt-tab-preview' })[0].taps, 2);
  assert.equal(momentList({ hold: ['Alt'], tap: 'Tab', taps: 999, result: 'x', scene: 'alt-tab-preview' })[0].taps, 6, 'taps are capped');
  assert.equal(momentList({ hold: ['Alt'], tap: 'Tab', taps: 0.5, result: 'x', scene: 'alt-tab-preview' })[0].taps, 1);
  assert.equal(momentList({ hold: ['Ctrl'], tap: 'S', result: 'x', scene: 'made-up' })[0].scene, '', 'an unknown scene id is blanked, never rendered');
}

// ---------- stub DOM ----------
function makeDom(reducedMotion) {
  const parsed = [];        // every tag name that an innerHTML assignment would have created
  const rafs = [];
  const cancelled = [];
  const ctxs = [];
  const style = () => {
    const s = { cssText: '', props: {} };
    Object.defineProperty(s, 'setProperty', { value(k, v) { this.props[k] = String(v); }, enumerable: false });
    return s;
  };
  const doc = {
    defaultView: null,
    createElement(tag) {
      const node = {
        tagName: String(tag).toUpperCase(), ownerDocument: doc, className: '', dataset: {},
        style: style(), children: [], parentNode: null, textContent: '', hidden: false,
        attrs: {}, htmlWrites: 0, _html: '',
        get innerHTML() { return this._html; },
        set innerHTML(value) {
          this._html = String(value);
          this.htmlWrites += 1;
          const re = /<([a-zA-Z][\w-]*)/g;
          let m = re.exec(this._html);
          while (m) { parsed.push(m[1].toLowerCase()); m = re.exec(this._html); }
        },
        setAttribute(k, v) { this.attrs[k] = String(v); },
        appendChild(kid) { kid.parentNode = this; this.children.push(kid); return kid; },
        append(...kids) { kids.forEach((k) => { k.parentNode = this; this.children.push(k); }); },
        removeChild(kid) { this.children = this.children.filter((c) => c !== kid); kid.parentNode = null; return kid; },
      };
      if (String(tag) === 'canvas') {
        node.width = 0; node.height = 0;
        node.getContext = () => { const c = recordingContext(); ctxs.push(c); return c; };
      }
      return node;
    },
  };
  const win = {
    devicePixelRatio: 2,
    requestAnimationFrame(cb) { rafs.push(cb); return rafs.length; },
    cancelAnimationFrame(id) { cancelled.push(id); },
    matchMedia: (query) => ({ matches: Boolean(reducedMotion) && /reduced-motion/.test(query) }),
  };
  doc.defaultView = win;
  const container = doc.createElement('div');
  return { doc, win, container, rafs, cancelled, ctxs, parsed };
}

function walk(node, out) {
  const acc = out || [];
  if (!node) return acc;
  acc.push(node);
  node.children.forEach((kid) => walk(kid, acc));
  return acc;
}
const capsOf = (root) => walk(root).filter((n) => n.dataset && n.dataset.state);
// The stub's getContext hands out a fresh ctx each call, so drive frames and read the live ones.
const frames = (dom, count, step) => {
  let ts = 0;
  for (let i = 0; i < count; i += 1) {
    ts += step;
    const pending = rafsDrain(dom);
    pending.forEach((cb) => cb(ts));
  }
  return ts;
};
const rafsDrain = (dom) => dom.rafs.splice(0);

// ---------- a single moment ----------
{
  const dom = makeDom(false);
  const view = mountKeyDiagram(dom.container, {
    moment: { hold: ['Ctrl'], tap: 'S', result: 'The little dot next to the name goes away.', scene: 'save-dot-gone' },
  });
  assert.equal(typeof view.destroy, 'function');
  assert.equal(dom.container.children.length, 1, 'one root appended');
  const root = dom.container.children[0];
  assert.equal(root.className, 'cq-keydiag');
  assert.equal(root.dataset.moments, '1');
  assert.equal(root.children.length, 1, 'one card');

  const caps = capsOf(root);
  assert.equal(caps.length, 2, 'one held cap + one tap cap');
  const held = caps.filter((c) => c.dataset.state === 'held');
  const tapped = caps.filter((c) => c.dataset.state === 'tap');
  assert.equal(held.length, 1);
  assert.equal(tapped.length, 1);
  assert.equal(held[0].dataset.key, 'Ctrl');
  assert.equal(held[0].textContent, 'Ctrl');
  assert.equal(tapped[0].dataset.key, 'S');
  assert.notEqual(held[0].className, tapped[0].className, 'held and tapped keycaps are distinguishable by class');
  assert.ok(/cq-keydiag-key-held/.test(held[0].className));
  assert.ok(/cq-keydiag-key-tap/.test(tapped[0].className));
  assert.equal(held[0].dataset.pulse, undefined, 'a held key never carries a pulse state');
  assert.equal(tapped[0].dataset.pulse, 'on', 'the cycle opens on the tap beat');
  assert.equal(held[0].style.opacity, '1', 'held is lit from the first frame');

  const rows = walk(root).filter((n) => n.dataset && n.dataset.row).map((n) => n.dataset.row);
  assert.deepEqual(rows, ['hold', 'tap', 'letgo', 'result'], 'HOLD DOWN / THEN TAP / LET GO / WHAT HAPPENS, in order');
  const letGo = walk(root).find((n) => n.dataset.row === 'letgo');
  assert.equal(letGo.textContent, 'LET GO OF BOTH');
  const result = walk(root).find((n) => n.dataset.row === 'result');
  assert.ok(result.innerHTML.includes('The little dot next to the name goes away.'));

  const canvas = walk(root).find((n) => n.tagName === 'CANVAS');
  assert.equal(canvas.width, SCENE_CSS_W * 2, 'canvas is sized for devicePixelRatio');
  assert.equal(canvas.height, SCENE_CSS_H * 2);
  assert.equal(canvas.hidden, false);
  assert.equal(canvas.attrs['aria-hidden'], 'true');

  // The first paint happens at mount, before any frame.
  const ctx = dom.ctxs[0];
  assert.ok(ctx.rects > 8, 'the scene is painted at mount');
  assert.deepEqual(ctx.badRects.slice(0, 3), []);
  assert.deepEqual(ctx.badStyles.slice(0, 3), []);

  // Non-interactive: nothing to press, nothing to finish.
  assert.equal(view.onDone, undefined);
  assert.equal(typeof view.root, 'object');
  view.destroy();
}

// ---------- a two-moment sequence (Ctrl+C then Ctrl+V), and the ×2 badge ----------
{
  const dom = makeDom(false);
  const view = mountKeyDiagram(dom.container, {
    moment: {
      sequence: [
        { hold: ['Ctrl'], tap: 'C', result: 'The sentence is copied.', scene: 'copy-twin' },
        { hold: ['Ctrl'], tap: 'V', result: 'The sentence appears again.', scene: 'paste-drop' },
      ],
    },
  });
  const root = dom.container.children[0];
  assert.equal(root.dataset.moments, '2');
  assert.equal(root.children.length, 2, 'a row of two cards');
  assert.deepEqual(root.children.map((c) => c.dataset.scene), ['copy-twin', 'paste-drop']);
  const caps = capsOf(root);
  assert.equal(caps.filter((c) => c.dataset.state === 'held').length, 2);
  assert.deepEqual(caps.filter((c) => c.dataset.state === 'tap').map((c) => c.dataset.key), ['C', 'V']);
  assert.equal(dom.ctxs.length, 2, 'one canvas context per card');
  dom.ctxs.forEach((c) => assert.ok(c.rects > 8));
  view.destroy();

  const dom2 = makeDom(false);
  const twice = mountKeyDiagram(dom2.container, {
    moment: { hold: ['Alt'], tap: 'Tab', taps: 2, result: 'A row of little windows shows up.', scene: 'alt-tab-preview' },
  });
  const badge = walk(dom2.container.children[0]).find((n) => n.dataset && n.dataset.taps);
  assert.ok(badge, 'taps > 1 gets a badge');
  assert.equal(badge.dataset.taps, '2');
  assert.equal(badge.textContent, '×2');
  twice.destroy();

  const dom3 = makeDom(false);
  const once = mountKeyDiagram(dom3.container, {
    moment: { hold: [], tap: '⊞', result: 'The Start menu pops open.', scene: 'start-open' },
  });
  const root3 = dom3.container.children[0];
  assert.equal(walk(root3).some((n) => n.dataset && n.dataset.taps), false, 'taps of 1 gets no badge');
  assert.equal(capsOf(root3).filter((c) => c.dataset.state === 'held').length, 0, 'no hold keys, no held caps');
  assert.ok(walk(root3).some((n) => n.className === 'cq-keydiag-none'), 'a hold-nothing moment says so in words');
  once.destroy();
}

// ---------- the result sentence is escaped ----------
{
  const dom = makeDom(false);
  const nasty = '<img src=x onerror="alert(1)"> & <b>bold</b> \'quote\'';
  const view = mountKeyDiagram(dom.container, {
    moment: { hold: ['Ctrl'], tap: 'Z', result: nasty, scene: 'undo-arrow' },
  });
  const result = walk(dom.container.children[0]).find((n) => n.dataset.row === 'result');
  assert.equal(dom.parsed.filter((tag) => tag !== 'span').length, 0, 'no element is ever created from the result text');
  assert.equal(dom.parsed.indexOf('img'), -1, 'no <img> from the result text');
  const body = result.innerHTML.slice(result.innerHTML.indexOf('</span>') + '</span>'.length);
  assert.equal(/[<>"']/.test(body), false, `no raw markup survives, only entities (${body})`);
  assert.ok(result.innerHTML.includes('&#60;img'), 'the angle bracket is entity-escaped');
  assert.ok(result.innerHTML.includes('&#38;') && result.innerHTML.includes('&#34;') && result.innerHTML.includes('&#39;'));
  view.destroy();
}

// ---------- the loop: the tap key pulses, the held key never moves ----------
{
  const dom = makeDom(false);
  const view = mountKeyDiagram(dom.container, {
    moment: { hold: ['⊞'], tap: '←', result: 'The window jumps to the left half.', scene: 'snap-left' },
  });
  const root = dom.container.children[0];
  const held = capsOf(root).find((c) => c.dataset.state === 'held');
  const tapped = capsOf(root).find((c) => c.dataset.state === 'tap');
  const ctx = dom.ctxs[0];
  const heldBefore = JSON.stringify([held.style.opacity, held.style.background, held.style.boxShadow]);
  const resultNode = walk(root).find((n) => n.dataset.row === 'result');
  const resultBefore = resultNode.innerHTML;
  const resultWrites = resultNode.htmlWrites;

  assert.equal(dom.rafs.length, 1, 'mount schedules exactly one frame');
  const pulses = {};
  let ts = 0;
  for (let i = 0; i < 40; i += 1) {
    ts += CYCLE_MS / 20;
    const pending = rafsDrain(dom);
    assert.equal(pending.length, 1, 'exactly one frame is in flight at a time');
    const rectsBefore = ctx.rects;
    pending.forEach((cb) => cb(ts));
    assert.ok(ctx.rects > rectsBefore, 'the canvas repaints every frame');
    pulses[tapped.dataset.pulse] = (pulses[tapped.dataset.pulse] || 0) + 1;
  }
  assert.ok(pulses.on > 3 && pulses.off > 3, `the tap key flashes on and off (${JSON.stringify(pulses)})`);
  assert.equal(JSON.stringify([held.style.opacity, held.style.background, held.style.boxShadow]), heldBefore, 'the held key stays lit, unchanged');
  assert.equal(resultNode.innerHTML, resultBefore, 'text is never rewritten by the loop');
  assert.equal(resultNode.htmlWrites, resultWrites, 'innerHTML is written exactly once, at mount');
  assert.deepEqual(ctx.badRects.slice(0, 3), [], 'every frame draws valid rects');
  assert.deepEqual(ctx.badStyles.slice(0, 3), []);

  // ---------- destroy stops the loop ----------
  const rectsAtDestroy = ctx.rects;
  view.destroy();
  assert.equal(dom.cancelled.length, 1, 'the pending frame is cancelled');
  const leftover = rafsDrain(dom);
  leftover.forEach((cb) => cb(ts + 1000));
  assert.equal(dom.rafs.length, 0, 'a late frame never re-arms the loop');
  assert.equal(ctx.rects, rectsAtDestroy, 'nothing repaints after destroy');
  assert.equal(dom.container.children.length, 0, 'the block is removed from the step');
  view.destroy();
  view.destroy();
  assert.equal(dom.cancelled.length, 1, 'destroy is idempotent');
  assert.equal(ctx.rects, rectsAtDestroy);
}

// ---------- reduced motion freezes on the "after" frame ----------
{
  const dom = makeDom(true);
  const view = mountKeyDiagram(dom.container, {
    moment: { hold: ['⊞'], tap: 'D', result: 'Every window hides and you see the desktop.', scene: 'desktop-toggle' },
  });
  assert.equal(dom.rafs.length, 0, 'reduced motion never starts a rAF loop');
  const ctx = dom.ctxs[0];
  assert.ok(ctx.rects > 8, 'it still paints, once');
  const tapped = capsOf(dom.container.children[0]).find((c) => c.dataset.state === 'tap');
  assert.equal(tapped.dataset.pulse, 'on', 'the tap key rests lit instead of flashing');

  // The frozen frame is the t=1 "after" frame.
  const after = recordingContext();
  SCENES['desktop-toggle'].draw(after, 1, { x: 0, y: 0, w: SCENE_CSS_W * 2, h: SCENE_CSS_H * 2 });
  assert.deepEqual(ctx.ops, after.ops, 'frozen on the after frame, not the before frame');
  view.destroy();
  assert.equal(dom.cancelled.length, 0, 'nothing to cancel');
}

// ---------- bad input never throws ----------
{
  assert.doesNotThrow(() => mountKeyDiagram(null, { moment: { hold: [], tap: 'S', result: 'x', scene: 'start-open' } }));
  assert.deepEqual(Object.keys(mountKeyDiagram(null, {})).sort(), ['destroy', 'root']);
  assert.equal(mountKeyDiagram(null, {}).root, null);
  assert.doesNotThrow(() => mountKeyDiagram(null, {}).destroy());
  const dom = makeDom(false);
  assert.equal(mountKeyDiagram(dom.container, {}).root, null, 'no moment, no block');
  assert.equal(mountKeyDiagram(dom.container).root, null);
  assert.equal(mountKeyDiagram(dom.container, { moment: { sequence: [] } }).root, null);
  assert.equal(dom.container.children.length, 0, 'an empty moment appends nothing');

  // A moment whose scene id is unknown still renders the words; the canvas just stays hidden.
  const view = mountKeyDiagram(dom.container, { moment: { hold: ['Ctrl'], tap: 'Q', result: 'Nothing to show.', scene: 'made-up' } });
  const canvas = walk(dom.container.children[0]).find((n) => n.tagName === 'CANVAS');
  assert.equal(canvas.hidden, true, 'no scene, no canvas');
  assert.equal(dom.rafs.length, 1, 'the loop still runs (it drives the key pulse)');
  view.destroy();

  // A window with no matchMedia / no rAF at all.
  const bare = makeDom(false);
  delete bare.win.matchMedia;
  delete bare.win.requestAnimationFrame;
  const plain = mountKeyDiagram(bare.container, { moment: { hold: ['Ctrl'], tap: 'C', result: 'Copied.', scene: 'copy-twin' } });
  assert.ok(bare.ctxs[0].rects > 8, 'still paints the first frame without rAF');
  assert.doesNotThrow(() => plain.destroy());
}

// ---------- source rules ----------
// Comments in these files talk ABOUT the banned patterns, so scan the code with the `//` tails cut.
const stripComments = (src) => src.split('\n').map((line) => {
  const at = line.indexOf('//');
  return at === -1 ? line : line.slice(0, at);
}).join('\n');
const read = (path) => stripComments(readFileSync(new URL(path, import.meta.url), 'utf8'));

['../src/cq/lessons/scenes.js', '../src/cq/lessons/diagram-ui.js'].forEach((path) => {
  const source = read(path);
  assert.equal(/\.at\(|Object\.hasOwn|structuredClone|\.findLast(Index)?\(|\.replaceAll\(|\?\?=|\|\|=|&&=/.test(source), false, `${path}: no ES2021+ builtins`);
  assert.equal(/\b\d[\d_]*_\d[\d_]*\b/.test(source), false, `${path}: no numeric separators`);
  assert.equal(/\balert\(|\bconfirm\(|\bprompt\(/.test(source), false, `${path}: no alert/confirm/prompt`);
  assert.equal(/<[a-z][^>]*\son[a-z]+=/i.test(source), false, `${path}: no inline event handlers (CSP)`);
  assert.equal(/Math\.random/.test(source), false, `${path}: no Math.random`);
});
{
  const scenes = read('../src/cq/lessons/scenes.js');
  assert.equal(/document\.|window\.|localStorage/.test(scenes), false, 'scenes.js: canvas only, no DOM');
  assert.equal(/drawImage|createImageBitmap|new Image|\.src\s*=/.test(scenes), false, 'scenes.js: original fillRect art, no image assets');
  assert.equal(/\bstroke|\bfillText|\barc\(/.test(scenes), false, 'scenes.js: fillRect only, in the app\'s blocky style');
  const ui = read('../src/cq/lessons/diagram-ui.js');
  assert.equal(/addEventListener|onDone|keydown/.test(ui), false, 'diagram-ui.js: explanatory only — no listeners, no completion callback');
  assert.equal((ui.match(/innerHTML/g) || []).length, 1, 'exactly one innerHTML write');
  assert.ok(/innerHTML = `[^`]*\$\{esc\(moment\.result\)\}/.test(ui), 'the result is escaped before it reaches innerHTML');
  const destroySrc = ui.slice(ui.indexOf('destroy() {'));
  assert.ok(/cancelAnimationFrame\(raf\)/.test(destroySrc), 'rAF cancelled on destroy');
}

console.log(`ok — Computer Quest shortcut diagrams: ${SCENE_IDS.length} scenes render deterministically at every t, held vs tapped keycaps stay distinct, the result sentence is escaped, the rAF loop stops on destroy, and reduced motion freezes on the after frame`);
