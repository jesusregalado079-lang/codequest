// Computer Quest key-moment scenes: the little "what actually happens on Windows" mockups that sit
// under a shortcut-diagram card (docs/computer-quest/key-practice.md §4).
//
// Pure canvas: a scene only ever touches the ctx handed to it. fillRect-only original blocky-pixel
// art in the same voice as src/cq/sprite.js and src/cq/battle/render.js — no images, no real Windows
// screenshots, no DOM, no Math.random (every frame is a function of `t` alone, so a test can render
// any scene at any `t` and get the same rects back).
//
// Each scene draws on a 40x30 grid of units, letterboxed into whatever box the caller gives it, and
// reads `t` as 0..1 animation progress (the caller loops it). t=1 is always the "after" frame — the
// state the kid should end up looking at — so a reduced-motion caller can simply draw t=1 once.

export const SCENE_GRID = { w: 40, h: 30 };

// ---------- palette ----------
const INK = '#101c2e';
const FRAME = '#1b2a42';
const DESK = '#2a4a72';
const DESK_LO = '#22406a';
const BAR = '#16233a';
const BAR_HI = '#22354f';
const START = '#4f8fd6';
const START_HI = '#8fc4f2';
const WIN = '#e8eef6';
const WIN_LO = '#c3cfdd';
const TITLE = '#3f77b8';
const TITLE_LO = '#5d7794';
const TEXTLINE = '#9fb0c4';
const FOLDER = '#f2c14e';
const FOLDER_HI = '#ffdc86';
const FOLDER_LO = '#c99a2f';
const PAPER = '#f7f9fc';
const PAPER_LO = '#cfd8e4';
const GHOST = '#aebcce';
const GHOST_LO = '#8e9cb0';
const GLOW = '#ffd76a';
const HILITE = '#ffffff';
const GREEN = '#57a650';
const CHANGED = '#e0574b';
const SELECT = '#3f77b8';

// ---------- tiny drawing kernel (module state, like battle/render.js) ----------
let C = null;
let OX = 0;
let OY = 0;
let U = 1;

const finite = (value, fallback) => (Number.isFinite(value) ? value : fallback);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = (p) => 1 - (1 - p) * (1 - p);
// Progress of the slice [a..b] of the whole 0..1 cycle.
const seg = (t, a, b) => clamp01((t - a) / (b - a || 1));

// Rect in device pixels (used for the backdrop only).
function px(x, y, w, h, color) {
  if (!C) return;
  if (![x, y, w, h].every(Number.isFinite)) return;
  const left = Math.round(x);
  const top = Math.round(y);
  C.fillStyle = color;
  C.fillRect(left, top, Math.max(1, Math.round(x + w) - left), Math.max(1, Math.round(y + h) - top));
}

// Rect on the 40x30 scene grid.
function g(gx, gy, gw, gh, color) {
  if (!C) return;
  if (![gx, gy, gw, gh].every(Number.isFinite)) return;
  if (gw <= 0 || gh <= 0) return;
  const left = Math.round(OX + gx * U);
  const top = Math.round(OY + gy * U);
  C.fillStyle = color;
  C.fillRect(left, top, Math.max(1, Math.round(OX + (gx + gw) * U) - left), Math.max(1, Math.round(OY + (gy + gh) * U) - top));
}

// A 1-unit-ish outline, drawn as four rects (no strokes anywhere in this app).
function frame(gx, gy, gw, gh, color, thick) {
  const k = finite(thick, 0.5);
  g(gx, gy, gw, k, color);
  g(gx, gy + gh - k, gw, k, color);
  g(gx, gy, k, gh, color);
  g(gx + gw - k, gy, k, gh, color);
}

function begin(ctx, view) {
  const v = view || {};
  const w = finite(v.w, 0) > 0 ? v.w : 160;
  const h = finite(v.h, 0) > 0 ? v.h : 120;
  const x = finite(v.x, 0);
  const y = finite(v.y, 0);
  C = ctx || null;
  if (C && 'imageSmoothingEnabled' in C) C.imageSmoothingEnabled = false;
  U = Math.max(1, Math.min(w / SCENE_GRID.w, h / SCENE_GRID.h));
  OX = x + Math.round((w - U * SCENE_GRID.w) / 2);
  OY = y + Math.round((h - U * SCENE_GRID.h) / 2);
  px(x, y, w, h, FRAME); // letterbox bars
}

function end() {
  C = null;
}

// ---------- shared furniture ----------
// Desktop wallpaper + taskbar. Rows 0..25 are the desktop, 26..29 the bar.
function desktop(litStart) {
  g(0, 0, 40, 26, DESK);
  g(0, 14, 40, 12, DESK_LO);
  g(0, 26, 40, 4, BAR);
  g(0, 26, 40, 0.6, BAR_HI);
  g(1.4, 26.8, 4.2, 2.6, litStart ? START_HI : START);
  if (litStart) frame(0.6, 26.2, 5.8, 3.6, GLOW, 0.7);
}

function taskbarChip(gx, lit) {
  g(gx, 27, 5, 2, lit ? START : BAR_HI);
  g(gx, 28.6, 5, 0.4, lit ? START_HI : BAR_HI);
}

// A window: ink outline, title bar, body. `active` gives it the bright blue bar.
function windowBox(gx, gy, gw, gh, opts) {
  const o = opts || {};
  if (!(gw > 2) || !(gh > 2)) return;
  g(gx - 0.4, gy - 0.4, gw + 0.8, gh + 0.8, INK);
  g(gx, gy, gw, gh, o.dim ? WIN_LO : WIN);
  const bar = Math.min(gh, 2.4);
  g(gx, gy, gw, bar, o.active ? TITLE : TITLE_LO);
  if (o.active) g(gx, gy, gw, 0.5, START_HI);
  if (gw >= 9) {
    for (let i = 0; i < 3; i += 1) g(gx + gw - 1.9 - i * 1.5, gy + 0.8, 0.9, 0.8, HILITE);
  }
  if (gw >= 6) g(gx + 1, gy + 0.8, Math.min(6, gw * 0.35), 0.8, HILITE);
}

function textLines(gx, gy, gw, rows, color) {
  for (let i = 0; i < rows; i += 1) {
    const shrink = (i % 3) * (gw * 0.18);
    g(gx, gy + i * 2, Math.max(1, gw - shrink), 0.8, color);
  }
}

function paper(gx, gy, gw, gh, opts) {
  const o = opts || {};
  if (!(gw > 1) || !(gh > 1)) return;
  g(gx - 0.4, gy - 0.4, gw + 0.8, gh + 0.8, INK);
  g(gx, gy, gw, gh, o.ghost ? GHOST : PAPER);
  g(gx + gw - 2, gy, 2, 2, o.ghost ? GHOST_LO : PAPER_LO);
  const line = o.ghost ? GHOST_LO : TEXTLINE;
  for (let i = 0; i < 3; i += 1) g(gx + 1, gy + 3 + i * 2, Math.max(1, gw - 2 - (i === 2 ? 2 : 0)), 0.8, line);
}

function folder(gx, gy, gw, gh, opts) {
  const o = opts || {};
  if (!(gw > 2) || !(gh > 2)) return;
  g(gx - 0.4, gy - 0.4, gw + 0.8, gh + 0.8, INK);
  g(gx, gy, gw * 0.45, 1.6, FOLDER_LO);
  g(gx, gy + 1.2, gw, gh - 1.2, FOLDER_LO);
  g(gx, gy + 2.6, gw, gh - 2.6, o.open ? FOLDER_HI : FOLDER);
  g(gx, gy + 2.6, gw, 0.7, FOLDER_HI);
}

function checkMark(gx, gy, size, color) {
  const u = finite(size, 1);
  g(gx, gy + u, u, u, color);
  g(gx + u, gy + u * 2, u, u, color);
  g(gx + u * 2, gy + u, u, u, color);
  g(gx + u * 3, gy, u, u, color);
}

// ---------- scenes ----------
// start-open: the Start menu grows up out of the taskbar over the left edge of the desktop.
function startOpen(t) {
  desktop(true);
  const p = ease(seg(t, 0.05, 0.6));
  const h = 18 * p;
  if (h < 2) return;
  const top = 26 - h;
  g(1, top, 17, h, '#1e2d45');
  frame(1, top, 17, h, START, 0.4);
  g(1, top, 17, Math.min(1.2, h), START);
  const tiles = ['#4f8fd6', '#57a650', '#f2c14e', '#e0574b', '#8fc4f2', '#a9b8f2'];
  for (let i = 0; i < tiles.length; i += 1) {
    const tx = 2.5 + (i % 2) * 7.5;
    const ty = top + 2.5 + Math.floor(i / 2) * 5.2;
    if (ty + 4 <= 25.5) g(tx, ty, 6.5, 4, tiles[i]);
  }
}

// file-explorer-open: a File Explorer window grows out of nothing in the middle of the desktop.
function fileExplorerOpen(t) {
  desktop(false);
  taskbarChip(8, true);
  const p = ease(seg(t, 0.05, 0.6));
  const w = 6 + 26 * p;
  const h = 4 + 15 * p;
  const x = 20 - w / 2;
  const y = 12 - h / 2;
  windowBox(x, y, w, h, { active: true });
  if (p < 0.8) return;
  g(x + 0.6, y + 3, 6.5, h - 3.6, WIN_LO); // sidebar
  for (let i = 0; i < 3; i += 1) g(x + 1.4, y + 4 + i * 2.6, 5, 1, TEXTLINE);
  for (let i = 0; i < 3; i += 1) folder(x + 8.5 + i * 7, y + 5, 5.5, 5, {});
}

// alt-tab-preview: the row of app-preview tiles, with the pick box stepping to the next tile.
function altTabPreview(t) {
  desktop(false);
  g(0, 0, 40, 26, '#16283f'); // the dim-out Alt+Tab draws over everything
  g(3, 8, 34, 12, '#1e2d45');
  frame(3, 8, 34, 12, '#3a5273', 0.5);
  const tints = [TITLE, GREEN, FOLDER_LO, '#a9b8f2'];
  for (let i = 0; i < 4; i += 1) {
    const tx = 5 + i * 8;
    g(tx, 10, 6.5, 6, WIN);
    g(tx, 10, 6.5, 1.6, tints[i]);
    textLines(tx + 0.8, 12.6, 5, 2, TEXTLINE);
  }
  const at = 5 + ease(seg(t, 0.15, 0.55)) * 8; // the box walks from tile 1 to tile 2
  frame(at - 0.8, 9.2, 8.1, 7.6, GLOW, 0.6);
  g(at - 0.8, 17.6, 8.1, 0.8, GLOW);
}

// snap-left / snap-right: the front window flies into one half; the other half offers a second window.
function snapScene(side, t) {
  desktop(false);
  g(19.7, 0, 0.6, 26, '#1c3556'); // the half-way line
  const p = ease(seg(t, 0.05, 0.6));
  const startX = 10;
  const endX = side === 'right' ? 20 : 0;
  const x = startX + (endX - startX) * p;
  const y = 4 - 4 * p;
  const w = 19 + 1 * p;
  const h = 17 + 9 * p;
  if (p > 0.72) {
    const otherX = side === 'right' ? 0.6 : 20.6;
    windowBox(otherX, 0.6, 18.8, 24.8, { dim: true });
    textLines(otherX + 1.5, 5, 15, 4, TEXTLINE);
  }
  windowBox(x, y, w, h, { active: true });
  textLines(x + 1.5, y + 4, w - 3, 4, TEXTLINE);
  if (p >= 1) frame(x - 0.4, y - 0.4, w + 0.8, h + 0.8, GLOW, 0.5);
  taskbarChip(8, true);
  taskbarChip(15, true);
}

// desktop-toggle: both windows shrink away into the taskbar, leaving the bare desktop.
function desktopToggle(t) {
  desktop(false);
  paper(2, 2, 5, 6, {});           // the desktop icons the windows were covering
  folder(2, 11, 6, 5, {});
  const p = ease(seg(t, 0.05, 0.62));
  const wins = [{ x: 9, y: 3, w: 16, h: 14, chip: 8 }, { x: 17, y: 8, w: 17, h: 15, chip: 15 }];
  wins.forEach((wdw, i) => {
    const k = 1 - p;
    if (k <= 0.02) return;
    const cx = wdw.chip + 2.5;
    const w = wdw.w * k;
    const h = wdw.h * k;
    const x = wdw.x + (cx - wdw.x) * p;
    const y = wdw.y + (27 - wdw.y) * p;
    windowBox(x, y, w, h, { active: i === 1 });
  });
  taskbarChip(8, p < 1);
  taskbarChip(15, p < 1);
}

// undo-arrow: a big blocky "back" arrow sweeps over a changed file and its old name comes back.
function undoArrow(t) {
  windowBox(1, 1, 38, 28, { active: true });
  g(1.6, 4, 36.8, 24.4, WIN);
  paper(16, 7, 8, 10, {});
  const p = ease(seg(t, 0.1, 0.7));
  const reverted = p >= 0.9;
  g(12, 19, 16, 3, reverted ? WIN_LO : CHANGED); // the name row: red while changed
  for (let i = 0; i < 4; i += 1) g(13 + i * 3.6, 20.1, 2.6, 0.9, reverted ? TEXTLINE : HILITE);
  const STEPS = 18;
  for (let i = 0; i <= STEPS; i += 1) {
    const f = i / STEPS;
    if (f > p) break;
    const ang = Math.PI * (0.06 + 0.88 * f);
    g(20 + Math.cos(ang) * 12 - 0.9, 13 - Math.sin(ang) * 6.5 - 0.9, 1.8, 1.8, GLOW);
  }
  if (p > 0.92) { // arrowhead landing on the left
    g(6.2, 11.6, 3.4, 1.2, GLOW);
    g(6.9, 12.8, 2.2, 1.2, GLOW);
    g(7.5, 14, 1.2, 1.2, GLOW);
  }
  if (reverted) checkMark(29, 19, 1.1, GREEN);
}

// A Notepad-ish text window: both Ctrl+C/Ctrl+V scenes are about TEXT, never files.
function notepad() {
  windowBox(1, 1, 38, 28, { active: true });
  g(1.6, 4, 36.8, 24.4, WIN);
  g(1.6, 4, 36.8, 2.2, WIN_LO); // menu strip
  for (let i = 0; i < 3; i += 1) g(3 + i * 5, 4.6, 3.4, 0.9, TEXTLINE);
}

// One line of "text": word-shaped bars, same blocky text-strip look the rest of the app uses.
const WORD_W = [6.5, 4.5, 8];
function textRow(gx, gy, color, scale) {
  const k = finite(scale, 1);
  let x = gx;
  for (let i = 0; i < WORD_W.length; i += 1) {
    g(x, gy, WORD_W[i] * k, 1.6, color);
    x += WORD_W[i] * k + 1.6;
  }
}
const ROW_W = (WORD_W[0] + WORD_W[1] + WORD_W[2]) + 3.2;

// copy-twin: the selected line of text duplicates into two identical stacked lines.
function copyTwin(t) {
  notepad();
  const p = ease(seg(t, 0.1, 0.62));
  if (p < 0.6) g(4.4, 8.3, ROW_W + 1.6, 3, SELECT); // still selected while he copies
  textRow(5.2, 9, p < 0.6 ? HILITE : TEXTLINE, 1);
  if (p > 0.08) {
    const y = 11 + 1.6 * p; // the copy settles onto the very next line
    if (p < 1) frame(4.4, y - 0.7, ROW_W + 1.6, 3, GLOW, 0.5); // brief highlight
    textRow(5.2, y, p < 0.5 ? GHOST_LO : TEXTLINE, 1);
  }
}

// paste-drop: the copied line drops onto the blinking cursor and settles into the text.
function pasteDrop(t) {
  notepad();
  textRow(5.2, 11.5, TEXTLINE, 1);
  textRow(5.2, 15, TEXTLINE, 0.62);
  const p = ease(seg(t, 0.08, 0.7));
  const land = 18.5;
  const blink = Math.floor(t * 8) % 2 === 0; // deterministic caret blink, no timers
  if (p < 1) {
    const y = 7.2 + (land - 7.2) * p;
    frame(4.4, y - 0.7, ROW_W + 1.6, 3, GLOW, 0.5);
    textRow(5.2, y, GHOST_LO, 1);
    if (blink) g(5, land - 0.4, 0.9, 2.6, INK); // the cursor waiting where it will land
  } else {
    textRow(5.2, land, TEXTLINE, 1);
    if (blink) g(5.4 + ROW_W, land - 0.4, 0.9, 2.6, INK); // cursor now sits after the pasted text
  }
}

// save-dot-gone: the "not saved yet" dot on the document tab blinks out and a tick takes its place.
function saveDotGone(t) {
  windowBox(1, 1, 38, 28, { active: true });
  g(1.6, 4, 36.8, 24.4, WIN);
  g(3, 4.4, 16, 3.2, WIN_LO); // the document tab
  g(3, 4.4, 16, 0.5, TITLE);
  for (let i = 0; i < 3; i += 1) g(4.2 + i * 2.8, 5.6, 2.2, 0.9, TEXTLINE);
  const p = seg(t, 0.05, 0.6);
  if (p < 1) {
    const blinkOn = Math.floor(t * 10) % 2 === 0; // deterministic blink, no timers
    const size = 2 - 1.2 * p;
    if (blinkOn && size > 0.4) g(16.4 - size / 2, 6 - size / 2, size, size, CHANGED);
  } else {
    checkMark(15.2, 5.2, 0.8, GREEN);
  }
  textLines(4, 10, 32, 8, p >= 1 ? TEXTLINE : PAPER_LO);
  g(3, 26.4, 36, 1.6, WIN_LO);
  if (p >= 1) g(4, 26.8, 9, 0.9, GREEN);
}

// rename-box: the filename turns into a blue editable box with a blinking caret.
function renameBox(t) {
  windowBox(1, 1, 38, 28, { active: true });
  g(1.6, 4, 36.8, 24.4, WIN);
  paper(16, 6, 8, 10, {});
  const p = ease(seg(t, 0.08, 0.6));
  g(10, 19, 20, 4, WIN_LO);
  g(10, 19, 20 * p, 4, SELECT);
  for (let i = 0; i < 5; i += 1) {
    const cx = 11 + i * 3.6;
    g(cx, 20.4, 2.6, 1.2, cx + 1.3 < 10 + 20 * p ? HILITE : TEXTLINE);
  }
  if (p >= 1) {
    frame(9.4, 18.4, 21.2, 5.2, HILITE, 0.4);
    if (Math.floor(t * 8) % 2 === 0) g(29, 19.6, 0.9, 2.8, INK); // caret
  }
}

// ---------- the library ----------
// Keyed by the scene ids in key-practice.md §4 / §5. `draw(ctx, t)` is the contract; `view`
// ({ x, y, w, h } in device pixels) is optional and defaults to a 160x120 box at the origin.
export const SCENES = {
  'start-open': { draw(ctx, t, view) { begin(ctx, view); startOpen(clamp01(finite(t, 0))); end(); } },
  'file-explorer-open': { draw(ctx, t, view) { begin(ctx, view); fileExplorerOpen(clamp01(finite(t, 0))); end(); } },
  'alt-tab-preview': { draw(ctx, t, view) { begin(ctx, view); altTabPreview(clamp01(finite(t, 0))); end(); } },
  'snap-left': { draw(ctx, t, view) { begin(ctx, view); snapScene('left', clamp01(finite(t, 0))); end(); } },
  'snap-right': { draw(ctx, t, view) { begin(ctx, view); snapScene('right', clamp01(finite(t, 0))); end(); } },
  'desktop-toggle': { draw(ctx, t, view) { begin(ctx, view); desktopToggle(clamp01(finite(t, 0))); end(); } },
  'undo-arrow': { draw(ctx, t, view) { begin(ctx, view); undoArrow(clamp01(finite(t, 0))); end(); } },
  'copy-twin': { draw(ctx, t, view) { begin(ctx, view); copyTwin(clamp01(finite(t, 0))); end(); } },
  'paste-drop': { draw(ctx, t, view) { begin(ctx, view); pasteDrop(clamp01(finite(t, 0))); end(); } },
  'save-dot-gone': { draw(ctx, t, view) { begin(ctx, view); saveDotGone(clamp01(finite(t, 0))); end(); } },
  'rename-box': { draw(ctx, t, view) { begin(ctx, view); renameBox(clamp01(finite(t, 0))); end(); } },
};

export const SCENE_IDS = Object.keys(SCENES);

const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

export const hasScene = (id) => typeof id === 'string' && own(SCENES, id);

// Safe lookup + draw: an unknown id (or a missing ctx) draws nothing instead of throwing.
export function drawScene(id, ctx, t, view) {
  if (!ctx || !hasScene(id)) return false;
  SCENES[id].draw(ctx, t, view);
  return true;
}
