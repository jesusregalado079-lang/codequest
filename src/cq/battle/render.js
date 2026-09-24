// Computer Quest horde battle: canvas drawing. Pure canvas (only the ctx passed in), fillRect-only
// original pixel art, no random calls (all variation is hashed from ids and simulation time).
import { drawCharacter } from '../sprite.js';
import { ARENA, ENEMIES } from './content.js';
import { ENEMY_FLASH, HERO_RADIUS, SWING_TIME } from './engine.js';

const INK = '#101c2e';
const GRASS_A = '#4e9a47';
const GRASS_B = '#57a650';
const TUFT = '#3f843a';
const STONE = '#737f87';
const STONE_HI = '#a3b0b6';
const STONE_LO = '#4f5a61';
const MORTAR = '#606c73';
const BLOCK = '#83919a';
const BLOCK_SHADOW = '#3c7438';
// P9 ambient palette. Deliberately distinct from the sprite colors tooling keys on (hero shirt
// #e8833a, hero skin #eebc98, slime body #2fc6b6/#34c9a0) so decoration never reads as a character.
const GRASS_C = '#4a9341';
const GRASS_D = '#5cab55';
const TUFT_B = '#46903f';
const TUFT_C = '#65b257';
const STEM = '#44913d';
const PETALS = ['#f6d867', '#e796c6', '#f2efe2'];
const PETAL_EYE = '#fff6d2';
const PEBBLE = '#9aa79c';
const PEBBLE_HI = '#b6c0b6';
const MOSS = '#55823f';
const MOSS_HI = '#6d9e4b';
const CRACK = '#414c53';
const TORCH_GLOW = '#8d8076';
const TORCH_POST = '#4a3320';
const TORCH_IRON = '#39424a';
const FLAME = '#ff9d2e';
const FLAME_CORE = '#ffe07a';
const FIREFLY_GLOW = '#9bd64a';
const FIREFLY = '#dcff7d';
const GLINT = '#fff3c4';
const DUST = '#c6b79a';
const DUST_LO = '#a7987e';
const SPARK_A = '#fffbe0';
const SPARK_B = '#ffd2e2';
// Every rect painted by the walkable-tile / wall-tile decoration passes uses one of these, so a test can
// prove decoration never strays onto the wrong kind of tile.
export const WALK_DECOR_COLORS = [GRASS_C, GRASS_D, TUFT, TUFT_B, TUFT_C, STEM, PETALS[0], PETALS[1], PETALS[2], PETAL_EYE, PEBBLE, PEBBLE_HI];
export const WALL_DECOR_COLORS = [MOSS, MOSS_HI, CRACK, TORCH_GLOW, TORCH_POST, TORCH_IRON, FLAME, FLAME_CORE];
// Fireflies drift rather than belonging to one tile, so they get their own list: they may straddle two
// grass tiles, but never touch a solid one.
export const FIREFLY_COLORS = [FIREFLY, FIREFLY_GLOW];
export const PUFF_LIFE = 0.5;
export const PUFF_LIFE_REDUCED = 0.25;
export const PARTICLE_LIFE = 0.9;
export const FX_LIFE = { swing: 0.07, hit: 0.17, poof: 0.42, hurt: 0.25, block: 0.18, pickup: 0.32, drop: 0.36, special: 0.5 };
export const MAX_FX = 16;
export const SHAKE_LIFE = 0.15;

// ---------- tiny drawing kernel (module state avoids per-rect closures) ----------
let C = null;
let OX = 0;
let OY = 0;
let U = 1;
let MIRROR = false;
let FLASH = null;
let FX_SHIFT_X = 0;
let FX_SHIFT_Y = 0;

function setOrigin(x, y, unit, mirror) {
  OX = x; OY = y; U = unit; MIRROR = Boolean(mirror);
}
// Rect on the current 16-unit sprite grid.
function r(ax, ay, aw, ah, color) {
  const gx = MIRROR ? 16 - ax - aw : ax;
  const left = Math.round(OX + gx * U);
  const top = Math.round(OY + ay * U);
  C.fillStyle = FLASH || color;
  C.fillRect(left, top, Math.max(1, Math.round(OX + (gx + aw) * U) - left), Math.max(1, Math.round(OY + (ay + ah) * U) - top));
}
// Rect in device pixels.
function box(x, y, w, h, color) {
  const left = Math.round(x);
  const top = Math.round(y);
  C.fillStyle = color;
  C.fillRect(left, top, Math.max(1, Math.round(x + w) - left), Math.max(1, Math.round(y + h) - top));
}
// Effect pixels stay on the canvas even when an event happens against the arena wall.
function fxBox(view, x, y, w, h, color) {
  const left = Math.max(-FX_SHIFT_X, Math.round(x));
  const top = Math.max(-FX_SHIFT_Y, Math.round(y));
  const right = Math.min(view.widthPx - FX_SHIFT_X, Math.round(x + w));
  const bottom = Math.min(view.heightPx - FX_SHIFT_Y, Math.round(y + h));
  if (right <= left || bottom <= top) return;
  C.fillStyle = color;
  C.fillRect(left, top, right - left, bottom - top);
}
// Deterministic 0..1 hash.
export function hash01(a, b) {
  const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

// ---------- arena ----------
// A torch bracket with a small blocky flame, drawn entirely inside its own wall tile so the tile still
// reads as solid. The flame only changes height by a couple of pixels, a few times a second: a tiny area,
// never a large patch of the screen changing brightness.
function drawTorch(x, y, T, t, ph) {
  const f = Math.floor(t * 4 + ph * 7) % 3;
  const h = T * (0.15 + f * 0.03);
  box(x + T * 0.28, y + T * 0.3, T * 0.44, T * 0.36, TORCH_GLOW); // warm light on the stone behind it
  box(x + T * 0.44, y + T * 0.58, T * 0.12, T * 0.12, TORCH_POST);
  box(x + T * 0.38, y + T * 0.5, T * 0.24, T * 0.1, TORCH_IRON);
  box(x + T * 0.4, y + T * 0.42, T * 0.2, T * 0.1, FLAME);
  box(x + T * 0.42, y + T * 0.46 - h, T * 0.16, h, FLAME);
  box(x + T * 0.45, y + T * 0.48 - h * 0.8, T * 0.1, h * 0.7, FLAME_CORE);
  box(x + T * 0.47, y + T * 0.42 - h, T * 0.06, T * 0.06, f === 2 ? FLAME_CORE : FLAME);
}

// Fireflies drift over the grass only: any that would cross a wall or a block simply sit this frame out,
// so the drifting light never sits on a solid tile. Drawn with the background, always behind every sprite.
const FIREFLY_N = 8;
function drawFireflies(view, t) {
  const T = view.tile;
  for (let k = 0; k < FIREFLY_N; k += 1) {
    const sp = 0.22 + hash01(k + 1, 17) * 0.26;
    const fx = 2.5 + hash01(k + 1, 3) * 15 + Math.sin(t * sp + k) * 1.1;
    const fy = 2 + hash01(k + 1, 9) * 8 + Math.sin(t * sp * 0.73 + k * 2.1) * 0.6;
    if (Math.sin(t * 0.9 + k * 1.7) < -0.3) continue; // slow fade in and out, not a blink
    const s = Math.max(1, T * 0.07);
    const half = s * 0.9;
    const halfTiles = half / T;
    let blocked = false;
    for (let c = 0; c < 4; c += 1) {
      const cx = Math.floor(fx + (c % 2 ? halfTiles : -halfTiles));
      const cy = Math.floor(fy + (c < 2 ? -halfTiles : halfTiles));
      const row = ARENA.grid[cy];
      if (!row || row[cx] !== 0) { blocked = true; break; }
    }
    if (blocked) continue;
    const X = view.offsetX + fx * T;
    const Y = view.offsetY + fy * T;
    box(X - half, Y - half, half * 2, half * 2, FIREFLY_GLOW);
    box(X - s / 2, Y - s / 2, s, s, FIREFLY);
  }
}

function drawArena(view, time) {
  const T = view.tile;
  const t = view.reducedMotion ? 0 : time;
  for (let ty = 0; ty < ARENA.height; ty += 1) {
    for (let tx = 0; tx < ARENA.width; tx += 1) {
      const x = view.offsetX + tx * T;
      const y = view.offsetY + ty * T;
      if (ARENA.grid[ty][tx] === 1) continue;
      box(x, y, T, T, (tx + ty) % 2 === 0 ? GRASS_A : GRASS_B);
      const h5 = (tx * 7 + ty * 13) % 5;
      const h7 = (tx * 5 + ty * 11) % 7;
      const ph = hash01(tx + 1, ty + 1);
      // Patches of a third and fourth green, offset inside the tile, break the checkerboard rhythm so the
      // field reads as a meadow instead of a game board.
      const patch = (tx * 11 + ty * 7) % 6;
      if (patch === 0) box(x, y + T * 0.42, T, T * 0.58, GRASS_C);
      else if (patch === 3) box(x + T * 0.3, y, T * 0.7, T * 0.62, GRASS_D);
      else if (patch === 5) box(x, y, T * 0.55, T * 0.45, GRASS_C);
      // Per-tile phase keeps the whole field from swaying in lockstep; the throw stays inside the tile.
      const sway = view.reducedMotion ? 0 : Math.sin(t * 1.1 + ph * 6.283) * T * 0.03;
      if (h5 === 0) {
        box(x + T * 0.25 + sway, y + T * 0.55, T * 0.08, T * 0.18, TUFT);
        box(x + T * 0.36 + sway * 1.4, y + T * 0.48, T * 0.08, T * 0.25, h7 % 3 === 0 ? TUFT_B : TUFT);
        box(x + T * 0.46 + sway * 0.7, y + T * 0.58, T * 0.07, T * 0.15, h7 % 2 === 0 ? TUFT_C : TUFT_B);
      } else if (h7 === 3 && ph > 0.35) {
        const fx = x + T * 0.55 + sway;
        const petal = PETALS[(tx + ty) % PETALS.length];
        box(fx + T * 0.03, y + T * 0.4, Math.max(1, T * 0.05), T * 0.28, STEM);
        box(fx - T * 0.02, y + T * 0.34, T * 0.15, T * 0.1, petal);
        box(fx + T * 0.03, y + T * 0.29, T * 0.05, T * 0.06, PETAL_EYE);
      } else if (h5 === 3 && ph > 0.6) {
        box(x + T * 0.66, y + T * 0.7, T * 0.14, T * 0.1, PEBBLE);
        box(x + T * 0.69, y + T * 0.68, T * 0.08, T * 0.05, PEBBLE_HI);
      }
    }
  }
  for (let ty = 0; ty < ARENA.height; ty += 1) {
    for (let tx = 0; tx < ARENA.width; tx += 1) {
      if (ARENA.grid[ty][tx] !== 1) continue;
      const x = view.offsetX + tx * T;
      const y = view.offsetY + ty * T;
      const border = tx === 0 || ty === 0 || tx === ARENA.width - 1 || ty === ARENA.height - 1;
      if (border) {
        box(x, y, T, T, STONE);
        box(x, y, T, T * 0.16, STONE_HI);
        box(x, y + T * 0.84, T, T * 0.16, STONE_LO);
        box(x, y + T * 0.48, T, Math.max(1, T * 0.06), MORTAR);
        box(x + (ty % 2 === 0 ? T * 0.45 : T * 0.15), y + T * 0.16, Math.max(1, T * 0.06), T * 0.32, MORTAR);
      } else {
        box(x, y + T * 0.85, T, T * 0.2, BLOCK_SHADOW);
        box(x, y, T, T, BLOCK);
        box(x, y, T, T * 0.2, STONE_HI);
        box(x + T * 0.86, y, T * 0.14, T, STONE_LO);
        box(x, y + T * 0.82, T, T * 0.18, STONE_LO);
        box(x + T * 0.2, y + T * 0.38, T * 0.3, T * 0.1, MORTAR);
      }
      // Age: moss creeping up from the grass line, a hairline crack or two.
      if ((tx * 3 + ty * 5) % 3 === 0) {
        box(x + T * 0.04, y + T * 0.7, T * 0.22, T * 0.1, MOSS);
        box(x + T * 0.3, y + T * 0.74, T * 0.18, T * 0.06, MOSS);
        box(x + T * 0.08, y + T * 0.65, T * 0.1, T * 0.06, MOSS_HI);
        box(x + T * 0.33, y + T * 0.7, T * 0.08, T * 0.05, MOSS_HI);
      }
      if ((tx * 5 + ty * 3) % 6 === 1) {
        box(x + T * 0.62, y + T * 0.22, Math.max(1, T * 0.05), T * 0.2, CRACK);
        box(x + T * 0.68, y + T * 0.4, Math.max(1, T * 0.05), T * 0.14, CRACK);
      }
      const topTorch = ty === 0 && tx % 5 === 2;
      const sideTorch = (tx === 0 || tx === ARENA.width - 1) && ty === 5;
      if (topTorch || sideTorch) drawTorch(x, y, T, t, hash01(tx + 2, ty + 3));
    }
  }
  drawFireflies(view, t);
}

const CHEST_GLINTS = [[3, 4], [11, 9], [4, 9]];
function drawChestProp(view, time) {
  const T = view.tile;
  const t = view.reducedMotion ? 0 : time;
  setOrigin(view.offsetX + ARENA.chest.x * T - T / 2, view.offsetY + ARENA.chest.y * T - T / 2, T / 16, false);
  r(1, 14, 14, 2, '#2f6e2c');
  r(2, 3, 12, 1, '#c28a45'); r(1, 4, 14, 4, '#a0692f'); r(1, 7, 14, 1, '#5e3a1a');
  r(3, 3, 2, 5, '#f2b631'); r(11, 3, 2, 5, '#f2b631');
  r(1, 8, 14, 6, '#8a5a2b'); r(14, 8, 1, 6, '#6b4422'); r(1, 13, 14, 1, '#5e3a1a');
  r(3, 8, 2, 6, '#f2b631'); r(11, 8, 2, 6, '#f2b631');
  // Goal object: the lock breathes between two golds and one small glint walks the brass, slowly.
  r(6, 7, 4, 3, view.reducedMotion || Math.sin(t * 1.8) < 0.4 ? '#ffd76a' : '#ffeaa8');
  r(7, 8, 2, 1, '#3a2410');
  const spot = CHEST_GLINTS[Math.floor(t * 1.2) % (CHEST_GLINTS.length + 2)];
  if (spot) { r(spot[0], spot[1], 1, 1, GLINT); r(spot[0], spot[1] + 1, 1, 1, GLINT); }
}

// ---------- pixel font for the mimic tag ----------
const GLYPHS = {
  C: [7, 4, 4, 4, 7], L: [4, 4, 4, 4, 7], I: [7, 2, 2, 2, 7], K: [5, 5, 6, 5, 5],
  M: [5, 7, 7, 5, 5], E: [7, 4, 6, 4, 7], '!': [2, 2, 2, 0, 2], ' ': [0, 0, 0, 0, 0],
};
const TAG_TEXT = 'CLICK ME!';
function drawTag(cx, bottomY, T) {
  const tu = T / 30;
  const w = TAG_TEXT.length * 4 + 1;
  const left = cx - (w * tu) / 2;
  const top = bottomY - 7 * tu;
  box(left - tu, top - tu, (w + 2) * tu, 9 * tu, '#5e3a1a');
  box(left, top, w * tu, 7 * tu, '#ffe45c');
  if (tu < 1) { // Too small for letters: two scribble lines.
    box(left + tu * 3, top + tu * 2, (w - 6) * tu, Math.max(1, tu * 1.2), '#c0392b');
    box(left + tu * 3, top + tu * 4.5, (w - 12) * tu, Math.max(1, tu * 1.2), '#c0392b');
    return;
  }
  for (let i = 0; i < TAG_TEXT.length; i += 1) {
    const rows = GLYPHS[TAG_TEXT[i]];
    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        if (rows[row] & (4 >> col)) box(left + (1 + i * 4 + col) * tu, top + (1 + row) * tu, tu, tu, '#c0392b');
      }
    }
  }
}

// ---------- enemies ----------
// How hard a hit reads, 1 at the moment of impact down to 0 at the end of the flash. Reduced motion holds
// one fixed value so the reaction is a still pose, not a movement.
function hitAmount(e, time, reduced) {
  if (!(e.flashUntil > time)) return 0;
  if (reduced) return 0.6;
  return Math.max(0, Math.min(1, (e.flashUntil - time) / ENEMY_FLASH));
}

function drawSlime(e, time, crown, reduced) {
  const hop = e.state === 'move';
  const t = reduced ? 0 : time;
  const hit = hitAmount(e, time, reduced);
  // One continuous squash-and-stretch cycle around a single resting shape: hopping only makes the cycle
  // faster and deeper, so moving <-> idle never snaps between two fixed silhouettes.
  const wob = Math.sin(t * (hop ? 7.2 : 2.3) + e.id * 2.1) * (hop ? 1.35 : 0.55);
  const w = 13 + wob + hit * 2.4;
  const h = 11 - wob * 0.85 - hit * 2.2;
  const left = 8 - w / 2;
  const top = 15 - h;
  const body = crown ? '#34c9a0' : '#2fc6b6';
  const dark = crown ? '#1d8a6c' : '#1b8f86';
  r(left + 1, top, w - 2, 1, body);
  r(left, top + 1, w, h - 1, body);
  r(left + w - 1, top + 1, 1, h - 2, dark);
  r(left, top + h - 2, w, 2, dark);
  r(left + 2, top + 2, 2, 1, '#aaf7ec');
  r(left + 2, top + 3, 1, 1, '#aaf7ec');
  // Slow blink: about every three seconds the eyes flatten to a line for a fraction of a second.
  const blink = !reduced && (t * 0.33 + hash01(e.id + 1, 5)) % 1 < 0.05;
  if (blink) {
    r(left + 3, top + 5, 2, 1, INK); r(left + w - 5, top + 5, 2, 1, INK);
  } else {
    r(left + 3, top + 4, 2, 2, '#ffffff'); r(left + w - 5, top + 4, 2, 2, '#ffffff');
    r(left + 4, top + 5, 1, 1, INK); r(left + w - 4, top + 5, 1, 1, INK);
  }
  const flick = Math.floor(t * 9 + e.id * 3) % 4;
  if (flick !== 3) r(left + flick - 1, top + h - 5, w, 1, flick === 0 ? '#ff4fd8' : '#7ffcff');
  if (crown) {
    r(4, top - 3, 8, 3, '#f2b631');
    r(4, top - 5, 2, 2, '#f2b631'); r(7, top - 6, 2, 3, '#f2b631'); r(10, top - 5, 2, 2, '#f2b631');
    r(7, top - 2, 2, 1, '#e04f5f'); r(4, top - 1, 8, 1, '#b8862a');
  }
}

function drawGoblin(e, time, reduced) {
  const t = reduced ? 0 : time;
  const hit = hitAmount(e, time, reduced);
  // The engine keeps goblins in 'chase', so the legs step whenever they are not stunned; a stunned goblin
  // stops stepping and just sways on the spot.
  const stepping = e.state === 'chase' && !(e.stunUntil > time);
  const stepA = stepping ? Math.floor(t * 8 + e.id) % 2 : 0;
  // Body bounce on the step, a slow sway when it is not stepping, and a recoil away from its heading on a hit.
  const bob = stepping ? (reduced ? 0 : -Math.abs(Math.sin(t * 8 + e.id)) * 0.5) : -Math.abs(Math.sin(t * 2.5 + e.id * 1.9)) * 0.45;
  const lean = (stepping ? 0 : Math.sin(t * 1.25 + e.id) * 0.3) - hit * 1.7 * (e.dirX > 0 ? 1 : -1);
  const dy = bob + hit * 0.9;
  const g = (ax, ay, aw, ah, c) => r(ax + lean, ay + dy, aw, ah, c);
  g(6, -2, 7, 2, '#ffffff'); g(3, 0, 9, 2, '#f4f1e6'); g(5, 2, 8, 1, '#dcd6c3');
  g(7, -1, 4, 1, '#9aa4ad'); g(4, 1, 5, 1, '#9aa4ad');
  g(4, 3, 8, 6, '#5dbb4a'); g(11, 3, 1, 6, '#3f8f35');
  g(2, 4, 2, 2, '#5dbb4a'); g(12, 4, 2, 2, '#5dbb4a');
  g(5, 5, 2, 1, '#fff1a6'); g(9, 5, 2, 1, '#fff1a6');
  g(6, 5, 1, 1, INK); g(10, 5, 1, 1, INK);
  g(6, 7, 4, 1 + hit, '#2f6b2a');
  g(5, 9, 6, 4, '#8a5a2b'); g(5, 11, 6, 1, '#5e3a1a');
  g(3, 9, 2, 3, '#5dbb4a'); g(11, 9, 2, 3, '#5dbb4a');
  // Feet stay planted: they take only a fraction of the lean so the recoil reads as the body rocking back.
  r(5 + lean * 0.35, 13, 2, stepA ? 3 : 2, '#3f8f35');
  r(9 + lean * 0.35, 13, 2, stepA ? 2 : 3, '#3f8f35');
}

function drawMimic(e, time, T, X, Y) {
  const open = e.state === 'lunge';
  if (open) {
    r(2, 0, 12, 3, '#c28a45'); r(4, 0, 2, 3, '#f2b631'); r(10, 0, 2, 3, '#f2b631');
    r(2, 3, 12, 6, '#3a1020');
    for (let i = 0; i < 6; i += 1) r(3 + i * 2, 3, 1, 2, '#ffffff');
    for (let i = 0; i < 5; i += 1) r(4 + i * 2, 7, 1, 2, '#ffffff');
    r(6, 6, 4, 1, '#e06aa8');
    r(2, 9, 12, 5, '#8a5a2b'); r(4, 9, 2, 5, '#f2b631'); r(10, 9, 2, 5, '#f2b631');
    r(2, 13, 12, 1, '#5e3a1a');
  } else {
    r(2, 5, 12, 3, '#c28a45'); r(2, 8, 12, 6, '#a0692f'); r(2, 7, 12, 1, '#5e3a1a');
    r(4, 5, 2, 9, '#f2b631'); r(10, 5, 2, 9, '#f2b631');
    r(7, 8, 2, 2, '#ffd76a'); r(2, 13, 12, 1, '#5e3a1a');
  }
  if (e.revealed) {
    const pulse = Math.floor(time * 6) % 2 === 0 ? '#ff3b3b' : '#ff7a7a';
    const top = open ? -1 : 4;
    r(1, top, 14, 1, pulse); r(1, 14, 14, 1, pulse); r(1, top, 1, 15 - top, pulse); r(14, top, 1, 15 - top, pulse);
    r(7, top - 7, 2, 4, '#ff3b3b'); r(7, top - 2, 2, 1, '#ff3b3b');
  } else if (!open && !FLASH) {
    drawTag(X, Y - T * 0.25, T);
  }
}

function drawBigGlitch(e, time, reduced) {
  const frame = Math.floor(time * (reduced ? 3 : 12));
  const warn = e.state === 'warn';
  if (warn && Math.floor(time * 20) % 2 === 0) {
    r(0, 0, 16, 1, '#ffffff'); r(0, 15, 16, 1, '#ffffff'); r(0, 0, 1, 16, '#ffffff'); r(15, 0, 1, 16, '#ffffff');
    r(3, 3, 10, 10, '#2a0f3f');
    return;
  }
  r(0, 0, 16, 16, '#2a0f3f');
  for (let j = 0; j < 7; j += 1) {
    for (let i = 0; i < 7; i += 1) {
      const v = hash01(i * 7 + j + e.id * 31, frame);
      r(1 + i * 2, 1 + j * 2, 2, 2, v < 0.4 ? '#5b2a86' : v < 0.75 ? '#120a1c' : v < 0.93 ? '#7d3cc0' : '#c9a6ff');
    }
  }
  r(3, 5, 3, 2, '#ff4f6d'); r(10, 5, 3, 2, '#ff4f6d');
  r(4, 5, 1, 1, '#ffffff'); r(11, 5, 1, 1, '#ffffff');
  r(5, 10, 6, 1, '#ff4f6d');
}

function drawChicken(e, time) {
  const peck = Math.floor(time * 6 + e.id) % 2;
  r(4, 6, 9, 6, '#ffffff'); r(12, 5, 2, 3, '#e8e8e8'); r(4, 11, 9, 1, '#d8d8d8');
  r(3, 3 + peck, 4, 4, '#ffffff'); r(4, 1 + peck, 2, 2, '#d64545');
  r(1, 4 + peck, 2, 1, '#f2b631'); r(4, 4 + peck, 1, 1, INK); r(3, 6 + peck, 1, 1, '#d64545');
  r(7, 8, 4, 2, '#dcdcdc');
  r(6, 12, 1, 3, '#f2b631'); r(9, 12, 1, 3, '#f2b631'); r(5, 14, 2, 1, '#f2b631'); r(8, 14, 2, 1, '#f2b631');
}

function drawStunStars(X, topY, T, time, size) {
  for (let k = 0; k < 3; k += 1) {
    const a = time * 6 + k * 2.094;
    const sx = X + Math.cos(a) * T * 0.3 * size;
    const sy = topY + Math.sin(a) * T * 0.08;
    const s = Math.max(1, T / 16);
    box(sx - s, sy, s * 3, s, '#ffe066');
    box(sx, sy - s, s, s * 3, '#ffe066');
  }
}

function drawEnemy(e, state, view) {
  const T = view.tile;
  const time = state.time;
  const def = ENEMIES[e.type];
  const size = def && def.size >= 2 ? 2 : 1;
  const X = view.offsetX + e.x * T;
  const Y = view.offsetY + e.y * T;
  const unit = (T * size) / 16;
  const chicken = e.chickenUntil > time;
  // Soft shadow on the grass.
  box(X - T * 0.35 * size, Y + T * 0.38 * size, T * 0.7 * size, T * 0.1 * size, '#00000030');
  FLASH = e.flashUntil > time ? '#ffffff' : null;
  setOrigin(X - (T * size) / 2, Y - (T * size) / 2, unit, chicken ? e.dirX > 0 : false);
  const frozen = e.frozenUntil > time;
  const reduced = Boolean(view.reducedMotion || frozen);
  if (chicken) drawChicken(e, frozen ? 0 : time);
  else if (e.type === 'slime') drawSlime(e, time, false, reduced);
  else if (e.type === 'mega-slime') drawSlime(e, time, true, reduced);
  else if (e.type === 'goblin') drawGoblin(e, time, reduced);
  else if (e.type === 'mimic') drawMimic(e, time, T, X, Y - (T * size) / 2);
  else if (e.type === 'big-glitch') drawBigGlitch(e, frozen ? 0 : time, reduced);
  FLASH = null;
  if (frozen || (e.frozenUntil > 0 && time - e.frozenUntil < 0.18 && !view.reducedMotion)) {
    const px = Math.max(2, Math.round(T / 16) * 2);
    const x = X - T * size * 0.48;
    const y = Y - T * size * 0.48;
    const side = T * size * 0.96;
    if (frozen) {
      // Frost sits on the edges. The original sprite remains fully visible.
      for (const [ax, ay, w, h] of [[x, y, side, px], [x, y + side - px, side, px],
        [x, y, px, side], [x + side - px, y, px, side]]) fxBox(view, ax, ay, w, h, '#b5f4ff');
      for (let k = 0; k < 4; k += 1) {
        const cx = x + (k % 2 ? side : 0);
        const cy = y + (k < 2 ? side * 0.22 : side * 0.75);
        fxBox(view, cx - px * 1.5, cy - px * 0.5, px * 3, px, '#e9ffff');
        fxBox(view, cx - px * 0.5, cy - px * 1.5, px, px * 3, '#d2f9ff');
      }
    } else {
      specialStar(view, X + T * 0.42, Y - T * size * 0.38, px * 0.55, '#96e6f1', '#ffffff');
    }
  }
  drawHitSmear(e, state, view);
  const topY = Y - (T * size) / 2 - T * 0.15;
  if (e.stunUntil && e.stunUntil > time) drawStunStars(X, topY, T, time, size);
  if (e.boss) {
    const w = T * 1.6;
    const h = Math.max(2, T / 9);
    const y = topY - T * 0.45;
    const frac = Math.max(0, Math.min(1, e.hp / (e.maxHp || 1)));
    box(X - w / 2 - 1, y - 1, w + 2, h + 2, INK);
    box(X - w / 2, y, w, h, '#3a2530');
    box(X - w / 2, y, w * frac, h, '#e04f5f');
  }
}

// ---------- effects ----------
export function shakeOffset(view, time) {
  const shake = view && view.shake;
  if (!shake || view.reducedMotion) return { x: 0, y: 0 };
  const age = time - shake.born;
  if (!(age >= 0 && age < SHAKE_LIFE - 1e-9)) return { x: 0, y: 0 };
  const unit = Math.max(1, Math.round(view.tile / 16));
  const amount = Math.min(3, shake.strength) * unit * (1 - age / SHAKE_LIFE);
  const sign = hash01(shake.id || 0, 23) < 0.5 ? -1 : 1;
  return { x: sign * Math.round(amount), y: -sign * Math.round(amount * 0.5) };
}

function activeFx(view, state, type, id) {
  const list = view.effects || [];
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const fx = list[i];
    if (fx.type === type && fx.id === id && state.time >= fx.born && state.time - fx.born < FX_LIFE[type] - 1e-9) return fx;
  }
  return null;
}

// A two-frame streak on the struck edge, after the sprite flash. It stays narrower than the target.
function drawHitSmear(e, state, view) {
  if (view.reducedMotion) return;
  const fx = activeFx(view, state, 'hit', e.id);
  if (!fx || state.time - fx.born >= 0.04) return;
  const T = view.tile;
  const size = ENEMIES[e.type] && ENEMIES[e.type].size >= 2 ? 2 : 1;
  const X = view.offsetX + e.x * T;
  const Y = view.offsetY + e.y * T;
  const px = Math.max(1, Math.round(T / 16));
  const color = fx.source === 'bolt' ? '#b8f7ff' : '#fff5b8';
  const sx = fx.dx || 1;
  const sy = fx.dy || 0;
  box(X - sx * T * size * 0.24 - px * 2, Y - sy * T * size * 0.24 - px, px * 5, px, color);
  box(X - sx * T * size * 0.12 - px, Y - sy * T * size * 0.12 + px, px * 4, px, '#ffffff');
}

// Each spell owns one small draw function. Later lessons extend only this dispatcher.
function drawSpecialStartBurst(fx, state, view, age) {
  const T = view.tile;
  const unit = Math.max(2, Math.round(T / 16));
  const p = view.reducedMotion ? 0.48 : Math.min(1, age / 0.45);
  const X = view.offsetX + fx.x * T;
  const Y = view.offsetY + fx.y * T + T * 0.18;
  const limit = (fx.radius || 3.6) * T;
  const rim = Math.min(limit - unit * 2.2, T * (0.78 + 2.82 * p));
  const ring = (radius, count, outer, core, width) => {
    for (let i = 0; i < count; i += 1) {
      const a = i * Math.PI * 2 / count;
      const x = X + Math.cos(a) * radius;
      const y = Y + Math.sin(a) * radius * 0.76;
      fxBox(view, x - width * 2, y - width * 2, width * 4, width * 4, outer);
      fxBox(view, x - width, y - width, width * 2, width * 2, core);
    }
  };
  ring(rim, 72, '#7865d8', '#fff2bd', unit);
  if (!view.reducedMotion && age >= 0.08 && age < 0.39) {
    ring(Math.max(T * 0.42, rim - T * 0.55), 56, '#8062c9bb', '#c5a8f2dd', unit * 0.75);
  }
  if (view.reducedMotion) return;
  if (age < 0.2) {
    // A small filled flash stays under the hero, while four solid panes read around his feet.
    if (age < 0.065) {
      fxBox(view, X - unit * 4, Y - unit * 3, unit * 8, unit * 6, '#fff8d2cc');
      fxBox(view, X - unit * 3, Y - unit * 4, unit * 6, unit * 8, '#fff8d2cc');
    }
    const colors = ['#a994ef', '#f3cd73', '#8ed3ef', '#e8a3ce'];
    const drift = age / 0.2 * unit * 1.5;
    for (let i = 0; i < 4; i += 1) {
      const dx = (i % 2 ? 1 : -1) * (unit * 12 + drift);
      const dy = (i < 2 ? -1 : 1) * (unit * 5 + drift * 0.35);
      fxBox(view, X + dx - unit * 3.5, Y + dy - unit * 3.5, unit * 7, unit * 7, colors[i]);
      fxBox(view, X + dx - unit * 3.5, Y + dy - unit * 3.5, unit * 7, unit, '#fff9da');
    }
  }
  for (let i = 0; i < 16; i += 1) {
    const a = i * Math.PI * 2 / 16 + 0.13;
    const d = Math.min(limit - unit * 1.5, rim * (0.74 + (i % 3) * 0.1));
    const s = unit * (i % 4 ? 2.5 : 3.2);
    fxBox(view, X + Math.cos(a) * d - s / 2, Y + Math.sin(a) * d * 0.76 - s / 2 - T * 0.12 * Math.sin(p * Math.PI), s, s,
      i % 3 ? '#d5b5f1' : '#fff7cd');
  }
}

function specialWindowFrame(view, x, y, w, h, unit, border, fill, title) {
  fxBox(view, x + unit, y + unit, w - 2 * unit, h - 2 * unit, fill);
  fxBox(view, x, y, w, unit, border);
  fxBox(view, x, y + unit, unit, h - unit, border);
  fxBox(view, x + w - unit, y + unit, unit, h - unit, border);
  fxBox(view, x, y + h - unit, w, unit, border);
  fxBox(view, x + unit, y + unit, w - 2 * unit, unit * 2, title);
  fxBox(view, x + w - unit * 3, y + unit * 1.4, unit * 1.3, unit, '#fffdf0');
}

function specialStar(view, X, Y, unit, outer, core) {
  fxBox(view, X - unit * 6, Y - unit * 1.3, unit * 12, unit * 2.6, outer);
  fxBox(view, X - unit * 1.3, Y - unit * 6, unit * 2.6, unit * 12, outer);
  fxBox(view, X - unit * 3.5, Y - unit, unit * 7, unit * 2, core);
  fxBox(view, X - unit, Y - unit * 3.5, unit * 2, unit * 7, core);
}

function drawSpecialWindowDash(fx, state, view, age) {
  const T = view.tile;
  const unit = Math.max(2, Math.round(T / 16));
  const sx = view.offsetX + fx.fromX * T;
  const sy = view.offsetY + fx.fromY * T;
  const ex = view.offsetX + fx.x * T;
  const ey = view.offsetY + fx.y * T;
  const p = view.reducedMotion ? 0 : Math.min(1, age / 0.45);
  const count = view.reducedMotion ? 2 : 4;
  for (let i = 0; i < count; i += 1) {
    const f = (i + 1) / (count + 1) + (view.reducedMotion ? 0 : p * 0.07);
    const x = sx + (ex - sx) * f;
    const y = sy + (ey - sy) * f - T * 0.4;
    const w = T * 1.22;
    const h = T * 0.92;
    const faded = !view.reducedMotion && age > 0.16 + i * 0.055;
    specialWindowFrame(view, x - w / 2, y - h / 2, w, h, unit * 2,
      faded ? '#a9d8ebb0' : '#d5f3ff', faded ? '#c8eff04d' : '#d9f6f08c',
      faded ? '#4e7898a8' : '#3f6989dd');
  }
  if (view.reducedMotion) return;
  const horizontal = Math.abs(ex - sx) >= Math.abs(ey - sy);
  for (let i = 0; i < 9; i += 1) {
    const f = (i + 0.5) / 10;
    const x = sx + (ex - sx) * f;
    const y = sy + (ey - sy) * f;
    const offset = (i % 2 ? -1 : 1) * T * 0.32;
    fxBox(view, x - (horizontal ? unit * 5 : unit * 1.25) + (horizontal ? 0 : offset),
      y - (horizontal ? unit * 1.25 : unit * 5) + (horizontal ? offset : 0),
      horizontal ? unit * 10 : unit * 2.5, horizontal ? unit * 2.5 : unit * 10,
      i % 3 ? '#acd7e6dd' : '#fff3bd');
  }
  specialStar(view, sx, sy, unit, '#83b8d2', '#fff2c3');
  specialStar(view, ex, ey, unit * 0.8, '#b0e5ee', '#fff9d7');
  for (let i = 0; i < 8; i += 1) {
    const a = i * Math.PI * 2 / 8;
    const d = T * (0.35 + p * 0.38);
    const s = unit * 2.4;
    fxBox(view, ex + Math.cos(a) * d - s / 2, ey + Math.sin(a) * d * 0.78 - s / 2,
      s, s, i % 2 ? '#fff3bd' : '#bceaf3');
  }
}

function drawSpecialAltTabDash(fx, state, view, age) {
  const T = view.tile;
  const unit = Math.max(2, Math.round(T / 16));
  const sx = view.offsetX + fx.fromX * T;
  const sy = view.offsetY + fx.fromY * T;
  const ex = view.offsetX + fx.x * T;
  const ey = view.offsetY + fx.y * T;
  const p = view.reducedMotion ? 0.5 : Math.min(1, age / 0.45);
  const horizontal = Math.abs(ex - sx) >= Math.abs(ey - sy);
  if (!view.reducedMotion) {
    // A solid two-tone rail makes the whole six-tile crossing visible at first glance.
    for (let i = 0; i < 19; i += 1) {
      const f = i / 18;
      const x = sx + (ex - sx) * f;
      const y = sy + (ey - sy) * f;
      fxBox(view, x - unit * 2.5, y - unit * 2.5, unit * 5, unit * 5, '#4c91b9dd');
      fxBox(view, x - unit * 1.5, y - unit * 1.5, unit * 3, unit * 3, '#c9ffff');
    }
  }
  for (let i = 0; i < (view.reducedMotion ? 1 : 3); i += 1) {
    const f = (i + 1) / (view.reducedMotion ? 2 : 4);
    const X = sx + (ex - sx) * f;
    const Y = sy + (ey - sy) * f;
    for (let card = 0; card < 2; card += 1) {
      const side = card ? 1 : -1;
      const shift = side * T * (view.reducedMotion ? 0.22 : 0.22 + 0.18 * Math.sin((p + f) * Math.PI));
      const w = T * (view.reducedMotion ? 1.08 : 1.0 + 0.3 * Math.abs(Math.cos((p + f + card * 0.5) * Math.PI)));
      const h = T * 0.94;
      specialWindowFrame(view, X - w / 2 + (horizontal ? 0 : shift), Y - h / 2 + (horizontal ? shift : 0),
        w, h, unit * 2, card ? '#6ed8e4' : '#eefaff', card ? '#5ca7c29c' : '#c9f7f4c4',
        card ? '#315d83d9' : '#6bbacbdd');
    }
  }
  if (view.reducedMotion) return;
  for (const [X, Y] of [[sx, sy], [ex, ey]]) {
    specialStar(view, X, Y, unit, '#5bc5dd', '#f5ffff');
    for (let i = 0; i < 4; i += 1) {
      const a = i * Math.PI / 2;
      const s = unit * 2.5;
      fxBox(view, X + Math.cos(a) * T * (0.4 + p * 0.35) - s / 2, Y + Math.sin(a) * T * (0.4 + p * 0.35) - s / 2,
        s, s, '#d6f9ff');
    }
  }
}

function specialRing(view, X, Y, rx, ry, count, width, outer, inner) {
  for (let i = 0; i < count; i += 1) {
    const a = i * Math.PI * 2 / count;
    const x = X + Math.cos(a) * rx;
    const y = Y + Math.sin(a) * ry;
    fxBox(view, x - width * 2, y - width * 2, width * 4, width * 4, outer);
    fxBox(view, x - width, y - width, width * 2, width * 2, inner);
  }
}

function drawFortRing(state, view) {
  const hero = state.hero;
  if (!(state.time < hero.fortUntil) || !hero.fortRadius) return;
  const T = view.tile;
  const u = Math.max(2, Math.round(T / 16));
  const X = view.offsetX + hero.x * T;
  const Y = view.offsetY + hero.y * T;
  const remaining = hero.fortUntil - state.time;
  const elapsed = 3 - remaining;
  specialRing(view, X, Y + T * 0.18, T * hero.fortRadius * 0.83, T * hero.fortRadius * 0.56,
    44, u * 0.6, '#a9e5ef52', '#d8f9ff42');
  for (let i = 0; i < 10; i += 1) {
    if (!view.reducedMotion && remaining <= 0.5 && i >= Math.ceil(remaining / 0.05)) continue;
    const a = i * Math.PI * 2 / 10 - Math.PI / 2;
    const settle = view.reducedMotion ? 1 : Math.max(0.65, Math.min(1, (elapsed - i * 0.015) / 0.15));
    if (settle <= 0) continue;
    const scale = view.reducedMotion ? 1 : 0.6 + settle * 0.4;
    const bob = view.reducedMotion ? 0 : Math.sin(state.time * 3 + i) * u * 0.22;
    const x = X + Math.cos(a) * hero.fortRadius * T - u * 4.5 * scale;
    const y = Y + Math.sin(a) * hero.fortRadius * T * 0.72 - u * 3 * scale
      - (1 - settle) * T * 0.38 + bob;
    const w = u * 9 * scale;
    const h = u * 6 * scale;
    fxBox(view, x, y + u * scale, w, h, '#805220');
    fxBox(view, x + u * scale, y, u * 3 * scale, u * 2 * scale, '#ffe39a');
    fxBox(view, x + u * scale, y + u * 2 * scale, w - u * 2 * scale, h - u * scale, '#e9af4a');
    fxBox(view, x + u * scale, y + u * 2 * scale, w - u * 3 * scale, u * scale, '#ffe7a4');
    fxBox(view, x + w - u * 2 * scale, y + u * 3 * scale, u * scale, u * 3 * scale, '#af722d');
  }
}

function drawSpecialFolderFort(fx, state, view, age) {
  if (view.reducedMotion || age >= 0.32) return;
  const T = view.tile;
  const u = Math.max(2, Math.round(T / 16));
  for (const target of fx.targets || []) {
    const d = Math.hypot(target.x - fx.x, target.y - fx.y);
    const radius = fx.radius || 2.4;
    if (d >= radius + (target.boss ? 0.5 : 0)) continue;
    const X = view.offsetX + (fx.x + (target.x - fx.x) / (d || 1) * radius) * T;
    const Y = view.offsetY + (fx.y + (target.y - fx.y) / (d || 1) * radius) * T;
    for (let k = 0; k < 3; k += 1) {
      const a = k * Math.PI * 2 / 3 + target.id;
      fxBox(view, X + Math.cos(a) * (u * 3 + age * T * 0.5),
        Y + Math.sin(a) * u * 2 - age * T * 0.3, u * 3, u * 2,
        k ? '#e7dbc0' : '#fff5d6');
    }
  }
}

function drawSpecialMassRename(fx, state, view, age) {
  const T = view.tile;
  const u = Math.max(2, Math.round(T / 16));
  const X = view.offsetX + fx.x * T;
  const Y = view.offsetY + fx.y * T;
  const p = view.reducedMotion ? 0.56 : Math.min(1, age / 0.42);
  specialRing(view, X, Y + T * 0.12, T * (0.7 + p * 7.8), T * (0.5 + p * 5.2),
    64, u * 0.8, '#ad52c8cc', '#f4b6e9');
  for (const target of age < 0.4 ? (fx.converted || []) : []) {
    const x = view.offsetX + target.x * T;
    const y = view.offsetY + target.y * T - T * 0.88;
    // Empty name box and a block cursor. No canvas text glyphs.
    const w = u * 11;
    const h = u * 5;
    fxBox(view, x - w / 2, y, w, h, '#4f3874');
    fxBox(view, x - w / 2 + u, y + u, w - u * 2, h - u * 2, '#f7ebff');
    if (view.reducedMotion || Math.floor(age / 0.2) % 2 === 0)
      fxBox(view, x + u * 2, y + u * 1.5, u * 2, u * 2, '#8846b0');
    if (!view.reducedMotion) for (let k = 0; k < 6; k += 1) {
      const a = k * Math.PI / 3 + target.id * 0.7;
      const d = T * (0.22 + p * 0.52);
      fxBox(view, x + Math.cos(a) * d - u, y + T * 0.45 + Math.sin(a) * d * 0.55 - u,
        u * (k % 2 ? 3 : 2), u * 2, k % 2 ? '#f0a1dc' : '#d4b4ff');
    }
  }
  if (!view.reducedMotion) for (const target of fx.targets || []) {
    if (!target.boss) continue;
    const x = view.offsetX + target.x * T;
    const y = view.offsetY + target.y * T - T * 1.2;
    for (let k = 0; k < 3; k += 1) {
      const a = k * Math.PI * 2 / 3 + age * 5;
      fxBox(view, x + Math.cos(a) * T * 0.55 - u, y + Math.sin(a) * T * 0.18 - u,
        u * 3, u * 3, '#ffe68b');
    }
  }
}

function drawSpecialStop(fx, state, view, age) {
  const T = view.tile;
  const u = Math.max(2, Math.round(T / 16));
  const scale = view.reducedMotion ? 1 : age < 0.1 ? 1.3 - age * 3 : age > 0.38 ? Math.max(0.25, 1 - (age - 0.38) * 6) : 1;
  const step = T * 0.28 * scale;
  const X = view.offsetX + fx.x * T;
  const Y = view.offsetY + fx.y * T - T * 1.05;
  const left = X - step * 5;
  const top = Y - step * 5;
  for (let row = 0; row < 10; row += 1) {
    const cut = row < 3 ? 3 - row : row > 6 ? row - 6 : 0;
    const x = left + cut * step;
    const w = (10 - cut * 2) * step;
    fxBox(view, x, top + row * step, w, step, '#fff5ed');
    if (row > 0 && row < 9) fxBox(view, x + step * 0.55, top + row * step,
      w - step * 1.1, step + 1, '#d94e54');
  }
  fxBox(view, X - step * 2.6, Y - step * 2.8, step * 5.2, step * 1.4, '#fffaf0');
}

function drawSpecialQuickSave(fx, state, view, age) {
  if (view.reducedMotion) return; // The persistent bubble is the single still cue.
  const T = view.tile;
  const u = Math.max(2, Math.round(T / 16));
  const X = view.offsetX + fx.x * T;
  const Y = view.offsetY + fx.y * T;
  const p = Math.min(1, age / 0.46);
  specialRing(view, X, Y + T * 0.18, T * (0.65 + p * 1.55), T * (0.4 + p * 1.02),
    52, u * 0.8, '#b5c968c4', '#fff2a2');
  const rise = p * T * 1.35;
  const w = u * 18 * (1 - p * 0.3);
  const h = u * 18 * (1 - p * 0.3);
  const x = X - w / 2;
  const y = Y - T * 2.3 - rise - h / 2;
  if (age < 0.36) {
    fxBox(view, x, y, w, h, '#345f63');
    fxBox(view, x + u, y + u, w - u * 2, h - u * 2, '#d3f5db');
    fxBox(view, x + u * 3, y + u, w - u * 6, u * 4, '#6c8990');
    fxBox(view, x + u * 4, y + u * 2, w - u * 8, u, '#ecf8e8');
    fxBox(view, x + u * 3, y + h - u * 5, w - u * 6, u * 4, '#fff8cf');
  }
}

function drawSaveHearts(fx, view, age) {
  const T = view.tile;
  const u = Math.max(2, Math.round(T / 16));
  const X = view.offsetX + fx.x * T;
  const Y = view.offsetY + fx.y * T;
  const p = Math.min(1, age / 0.46);
  for (let i = 0; i < 5; i += 1) {
    const sx = X + (i - 2) * T * 0.42 + Math.sin(i * 4) * u * 2;
    const sy = Y - T * (0.46 + p * (0.8 + i * 0.08));
    const color = i % 2 ? '#fff1a2' : '#c5f6c1';
    fxBox(view, sx - u * 2, sy - u, u * 2, u * 2, color);
    fxBox(view, sx + u, sy - u, u * 2, u * 2, color);
    fxBox(view, sx - u * 2, sy + u, u * 5, u * 2, color);
    fxBox(view, sx - u, sy + u * 3, u * 3, u, color);
  }
}

function drawSaveBubble(state, view, upper) {
  const until = state.hero.shieldUntil;
  const time = state.time;
  if (!(time < until) && !(until > 0 && time - until < 0.18 && !view.reducedMotion)) return;
  const T = view.tile;
  const u = Math.max(2, Math.round(T / 16));
  const X = view.offsetX + state.hero.x * T;
  const Y = view.offsetY + state.hero.y * T - T * 0.43;
  if (time < until) {
    if (!upper) fxBox(view, X - T * 0.63, Y - T * 0.7, T * 1.26, T * 1.4, '#e7ffff16');
    else {
      specialRing(view, X, Y, T * 0.68, T * 0.9, 48, u * 0.7, '#a7e5f1b8', '#f3ffff');
      fxBox(view, X - T * 0.42, Y - T * 0.68, u * 4, u * 2, '#ffffffb8');
    }
  } else if (upper) for (let i = 0; i < 8; i += 1) {
    const a = i * Math.PI / 4;
    fxBox(view, X + Math.cos(a) * T * 0.78, Y + Math.sin(a) * T * 0.95,
      u * 3, u * 3, '#d6faff');
  }
}

function drawSpecialCopyPaste(fx, state, view, age) {
  const T = view.tile;
  const u = Math.max(2, Math.round(T / 16));
  const X = view.offsetX + fx.x * T;
  const Y = view.offsetY + fx.y * T;
  if (view.reducedMotion) {
    specialRing(view, X, Y + T * 0.12, T * 0.8, T * 0.57, 24, u * 0.65, '#9b78e8', '#fff0c9');
    return;
  }
  if (age < 0.15) {
    const p = age / 0.15;
    specialStar(view, X, Y - T * 0.5, u * (1.1 - p * 0.25), '#9465db', '#fff7d7');
    for (let i = 0; i < 8; i += 1) {
      const a = i * Math.PI / 4;
      const d = T * (0.75 - p * 0.45);
      fxBox(view, X + Math.cos(a) * d - u * 1.5, Y - T * 0.45 + Math.sin(a) * d * 0.7 - u * 1.5,
        u * 3, u * 3, i % 2 ? '#e7c4ff' : '#fff4c8');
    }
  }
  if (age >= 0.3 && age < 0.47) {
    const p = (age - 0.3) / 0.17;
    specialRing(view, X, Y + T * 0.1, T * (0.65 + p * 1.28), T * (0.48 + p * 0.84),
      36, u * 0.75, '#6c91e7', '#f3ddff');
    if (age < 0.36) specialStar(view, X, Y - T * 0.46, u, '#7c78e1', '#fff9e6');
  }
}

function selectionBox(view, target, age, reduced) {
  const T = view.tile;
  const u = Math.max(2, Math.round(T / 16));
  const size = target.boss ? 2 : 1;
  const collapse = reduced ? 0 : age > 0.2 ? Math.min(1, (age - 0.2) / 0.23) : 0;
  const pop = reduced ? 1 : age < 0.08 ? 1.16 - age * 2 : 1;
  const halfW = T * (size * 0.58 + 0.22) * pop * (1 - collapse * 0.65);
  const halfH = T * (size * 0.58 + 0.2) * pop * (1 - collapse * 0.65);
  const X = view.offsetX + target.x * T;
  const Y = view.offsetY + target.y * T - T * 0.32;
  const left = X - halfW;
  const top = Y - halfH;
  const w = halfW * 2;
  const h = halfH * 2;
  const phase = reduced ? 0 : Math.floor(age * 3) % 2;
  // Filled tint and broad marching dashes; the slow phase advances at most three times a second.
  fxBox(view, left + u, top + u, w - u * 2, h - u * 2, '#e8d5ff30');
  for (let k = 0; k < 8; k += 1) {
    const f = (k + phase * 0.5) / 8;
    fxBox(view, left + f * w, top, Math.max(u * 2, w / 13), u * 2, '#d783fa');
    fxBox(view, left + f * w, top + h - u * 2, Math.max(u * 2, w / 13), u * 2, '#fff2c8');
    fxBox(view, left, top + f * h, u * 2, Math.max(u * 2, h / 13), '#d783fa');
    fxBox(view, left + w - u * 2, top + f * h, u * 2, Math.max(u * 2, h / 13), '#fff2c8');
  }
  for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    fxBox(view, left + dx * w - u * 2, top + dy * h - u * 2, u * 4, u * 4, '#8948bd');
    fxBox(view, left + dx * w - u, top + dy * h - u, u * 2, u * 2, '#fff9e4');
  }
}

function drawSpecialSelectAll(fx, state, view, age, upper) {
  const T = view.tile;
  const u = Math.max(2, Math.round(T / 16));
  if (!upper) {
    if (!view.reducedMotion) {
      const p = Math.min(1, age / 0.39);
      specialRing(view, view.offsetX + fx.x * T, view.offsetY + fx.y * T,
        T * (0.5 + p * 10.2), T * (0.34 + p * 6.5), 72, u * 0.55, '#9b62d1a8', '#f3c6ff');
    }
    return;
  }
  for (const target of fx.targets || []) {
    const alive = state.enemies.some((enemy) => enemy.id === target.id);
    if (!alive && age >= 0.27 && !view.reducedMotion) continue;
    selectionBox(view, target, age, view.reducedMotion);
  }
}

function popupWindow(view, target) {
  const T = view.tile;
  const u = Math.max(2, Math.round(T / 16));
  const X = view.offsetX + target.x * T;
  const Y = view.offsetY + target.y * T - T * (target.boss ? 1.24 : 0.82);
  const w = T * (target.boss ? 1.65 : 1.32);
  const h = T * (target.boss ? 1.22 : 1.02);
  const x = X - w / 2;
  const y = Y - h / 2;
  fxBox(view, x, y, w, h, '#384a70');
  fxBox(view, x + u * 2, y + u * 6, w - u * 4, h - u * 8, '#f7f1df');
  fxBox(view, x + u * 2, y + u * 2, w - u * 4, u * 4, '#aacde6');
  fxBox(view, x + w - u * 6, y + u * 2, u * 4, u * 4, '#df5264');
  fxBox(view, x + w - u * 5, y + u * 3, u * 2, u * 2, '#fff7e6');
  return { X, Y, w, h };
}

function popupX(view, X, Y, u, scale) {
  // Pixel-stepped diagonals, with a dark landing shadow behind the red stamp.
  for (let i = -4; i <= 4; i += 1) {
    const s = u * scale;
    fxBox(view, X + i * s - s * 1.4, Y + i * s - s * 1.4, s * 2.8, s * 2.8, '#8b2e4a');
    fxBox(view, X + i * s - s * 1.4, Y - i * s - s * 1.4, s * 2.8, s * 2.8, '#8b2e4a');
    fxBox(view, X + i * s - s, Y + i * s - s, s * 2, s * 2, '#ed5263');
    fxBox(view, X + i * s - s, Y - i * s - s, s * 2, s * 2, '#ed5263');
  }
}

function drawSpecialPopupBlocker(fx, state, view, age, upper) {
  const T = view.tile;
  const u = Math.max(2, Math.round(T / 16));
  const X = view.offsetX + fx.x * T;
  const Y = view.offsetY + fx.y * T;
  if (!upper) {
    if (view.reducedMotion) return;
    const p = Math.min(1, age / 0.43);
    specialRing(view, X, Y + T * 0.1, T * (0.62 + p * 10), T * (0.42 + p * 6.3),
      72, u * 0.8, '#ba435ecc', '#ffe3be');
    if (age < 0.4) {
      specialRing(view, X, Y + T * 0.37, T * 0.54, T * 0.34, 28, u * 0.55, '#b43c59', '#fff0d1');
      for (let i = -3; i <= 3; i += 1) fxBox(view, X + i * u * 2 - u, Y + T * 0.37 - i * u - u,
        u * 2, u * 2, '#f8e6d1');
    }
    return;
  }
  for (const target of fx.targets || []) {
    const center = age < 0.31 || view.reducedMotion ? popupWindow(view, target) : {
      X: view.offsetX + target.x * T,
      Y: view.offsetY + target.y * T - T * (target.boss ? 1.24 : 0.82),
    };
    if (view.reducedMotion) continue;
    if (age >= 0.17) {
      if (age < 0.33) popupX(view, center.X, center.Y, u, target.boss ? 2.45 : 2.05);
      if (age >= 0.31) {
        const p = (age - 0.31) / 0.19;
        const n = target.boss ? 12 : 8;
        for (let i = 0; i < n; i += 1) {
          const a = i * Math.PI * 2 / n + target.id * 0.27;
          const d = T * (0.4 + p * (target.boss ? 1.15 : 0.8));
          const size = u * (i % 3 ? 2.5 : 3.5);
          fxBox(view, center.X + Math.cos(a) * d - size / 2,
            center.Y + Math.sin(a) * d * 0.7 - size / 2, size, size,
            i % 2 ? '#f6dfb5' : '#afc5e3');
        }
        specialRing(view, center.X, center.Y, T * (0.42 + p * 0.55), T * (0.34 + p * 0.42),
          20, u * 0.45, '#bb435d', '#fff0ca');
      }
    }
  }
}

function drawSpecialEffect(fx, state, view, age) {
  if (view.reducedMotion && age >= 0.4 - 1e-9) return;
  switch (fx.id) {
    case 'start-burst': drawSpecialStartBurst(fx, state, view, age); break;
    case 'window-dash': drawSpecialWindowDash(fx, state, view, age); break;
    case 'alt-tab-dash': drawSpecialAltTabDash(fx, state, view, age); break;
    case 'folder-fort': drawSpecialFolderFort(fx, state, view, age); break;
    case 'mass-rename': drawSpecialMassRename(fx, state, view, age); break;
    case 'stop': drawSpecialStop(fx, state, view, age); break;
    case 'quick-save': drawSpecialQuickSave(fx, state, view, age); break;
    case 'copy-paste-volley': drawSpecialCopyPaste(fx, state, view, age); break;
    case 'select-all': drawSpecialSelectAll(fx, state, view, age, false); break;
    case 'popup-blocker': drawSpecialPopupBlocker(fx, state, view, age, false); break;
    default: break;
  }
}

function drawEventFx(state, view, upper) {
  if (!view.effects) return;
  const T = view.tile;
  const px = Math.max(1, Math.round(T / 16));
  for (let i = 0; i < view.effects.length; i += 1) {
    const fx = view.effects[i];
    const life = FX_LIFE[fx.type];
    const age = state.time - fx.born;
    if (!(age >= 0 && age < life - 1e-9)) continue;
    if (fx.type === 'special') {
      if (view.reducedMotion && age >= 0.4 - 1e-9) continue;
      if (!upper) drawSpecialEffect(fx, state, view, age);
      else if (fx.id === 'quick-save' && !view.reducedMotion) drawSaveHearts(fx, view, age);
      else if (fx.id === 'select-all') drawSpecialSelectAll(fx, state, view, age, true);
      else if (fx.id === 'popup-blocker') drawSpecialPopupBlocker(fx, state, view, age, true);
      continue;
    }
    if (view.reducedMotion) continue;
    const top = fx.type === 'hurt' || fx.type === 'block' || fx.type === 'pickup';
    if (top !== upper) continue;
    const p = age / life;
    const X = view.offsetX + fx.x * T;
    const Y = view.offsetY + fx.y * T;
    if (fx.type === 'poof') {
      const mega = fx.enemy === 'mega-slime';
      const goblin = fx.enemy === 'goblin';
      const n = mega ? 12 : 8;
      const colors = goblin ? ['#7cc66c', '#a7773b', '#cf9a52'] : ['#8ae3d5', '#4caeab', '#b6f1dc'];
      for (let k = 0; k < n; k += 1) {
        const a = hash01(fx.id, k + 11) * 6.283;
        const distance = T * (mega ? 1.2 : 0.8) * p;
        const arc = -T * (0.3 + hash01(k, fx.id) * 0.3) * 4 * p * (1 - p);
        const s = px * (mega ? 4 : 3) * (p > 0.7 ? 0.5 : 1);
        box(X + Math.cos(a) * distance - s / 2, Y + Math.sin(a) * distance * 0.6 + arc - s / 2, s, s, colors[k % 3]);
      }
      if (mega && p < 0.65) {
        const gy = Y - T * (0.7 + p * 0.5);
        box(X - px * 3, gy, px * 6, px, '#ffeaa0');
        box(X - px / 2, gy - px * 3, px, px * 7, '#fff9dc');
        box(X - px, gy - px * 4, px * 2, px, '#ffeaa0');
      }
    } else if (fx.type === 'hit') {
      const bolt = fx.source === 'bolt';
      if (bolt && fx.volley && p < 0.65) {
        const impact = T * (0.2 + p * 0.42);
        specialRing(view, X, Y, impact, impact * 0.7, 12, px * 0.5, '#aa7be9', '#fff1d8');
        for (let k = 0; k < 4; k += 1) {
          const a = k * Math.PI / 2;
          fxBox(view, X + Math.cos(a) * impact * 1.45 - px, Y + Math.sin(a) * impact - px,
            px * 3, px * 3, '#e9c2ff');
        }
      }
      for (let k = 0; k < 2; k += 1) {
        const side = k ? 1 : -1;
        const d = T * (0.38 + p * 0.55);
        const x = X + fx.dx * d - fx.dy * side * T * 0.13;
        const y = Y + fx.dy * d + fx.dx * side * T * 0.13;
        box(x - px, y - px / 2, px * (p > 0.6 ? 1 : 2), px, bolt ? '#c6f7ff' : '#ffe17b');
      }
    } else if (fx.type === 'pickup' || fx.type === 'drop') {
      const collected = fx.type === 'pickup';
      const n = collected ? 6 : 3;
      for (let k = 0; k < n; k += 1) {
        const a = -Math.PI + (k + 0.5) * Math.PI / (collected ? 3 : 1.5);
        const d = T * (collected ? 0.48 + p * 0.58 : 0.24 + p * 0.28);
        const x = X + Math.cos(a) * d;
        const y = Y - (collected ? T * 0.48 : 0) + Math.sin(a) * d * 0.48 - p * T * (collected ? 0.55 : 0.12);
        const color = k % 2 ? '#fff6da' : '#ffb6bd';
        const size = px * 2;
        fxBox(view, x - size / 2, y - size / 2, size, size, color);
        if (collected && p < 0.65) {
          fxBox(view, x - px / 2, y - px * 2, px, px, color);
          fxBox(view, x - px / 2, y + px, px, px, color);
        }
      }
    } else if (fx.type === 'block') {
      const side = fx.facing === 'left' ? 1 : fx.facing === 'right' || fx.facing === 'up' ? -1 : 1;
      const cx = X + side * T * 0.31;
      const cy = Y - T * 0.48;
      const d = T * (0.27 + p * 0.32);
      for (let k = 0; k < 8; k += 1) {
        const a = k * Math.PI / 4;
        const x = cx + Math.cos(a) * d;
        const y = cy + Math.sin(a) * d;
        const color = k % 2 ? '#8cdded' : '#e8ffff';
        fxBox(view, x - px * 1.5, y - px * 1.5, px * 3, px * 3, color);
      }
      for (let k = 0; k < 2; k += 1) {
        const x = cx + side * (d + px * (2 + k));
        const y = cy + (k ? -1 : 1) * d * 0.6;
        fxBox(view, x - px, y - px, px * 2, px * 2, '#baf4f8');
      }
    } else if (fx.type === 'hurt') {
      const vectors = [[-0.8, -0.45], [-1, 0.12], [-0.55, 0.82], [0.9, -0.35], [1, 0.3], [0.55, 0.9]];
      for (let k = 0; k < vectors.length; k += 1) {
        const [vx, vy] = vectors[k];
        const d = T * (0.37 + p * 0.67);
        const x = X + vx * d;
        const y = Y - T * 0.48 + vy * d + p * p * T * 0.25;
        const size = px * (p > 0.74 ? 2 : 3);
        fxBox(view, x - size / 2, y - size / 2, size, size, k % 3 === 1 ? '#fff2ec' : '#df5e69');
      }
    }
  }
}
function drawHeart(cx, cy, s) {
  const left = cx - s * 3.5;
  const top = cy - s * 3;
  box(left + s, top, s * 2, s, '#e04f5f'); box(left + s * 4, top, s * 2, s, '#e04f5f');
  box(left, top + s, s * 7, s * 2, '#e04f5f');
  box(left + s, top + s * 3, s * 5, s, '#e04f5f');
  box(left + s * 2, top + s * 4, s * 3, s, '#c0392b');
  box(left + s * 3, top + s * 5, s, s, '#c0392b');
  box(left + s, top + s, s, s, '#ffb3b8');
}

function drawPuffs(state, view) {
  const T = view.tile;
  const life = view.reducedMotion ? PUFF_LIFE_REDUCED : PUFF_LIFE;
  for (let i = 0; i < state.puffs.length; i += 1) {
    const puff = state.puffs[i];
    const p = (state.time - puff.bornAt) / life;
    if (!(p >= 0 && p < 1)) continue;
    const X = view.offsetX + puff.x * T;
    const Y = view.offsetY + puff.y * T;
    const n = Math.max(6, Math.min(10, puff.squares || 8));
    for (let k = 0; k < n; k += 1) {
      const a = hash01(puff.id, k) * Math.PI * 2;
      const dist = T * (0.15 + 0.55 * p) * (0.6 + 0.4 * hash01(k, puff.id));
      const s = T * 0.2 * (1 - p * 0.7);
      box(X + Math.cos(a) * dist - s / 2, Y + Math.sin(a) * dist - s / 2, s, s, k % 3 === 0 ? '#ffffff' : k % 3 === 1 ? '#d9dee3' : '#9aa4ad');
    }
  }
}

function drawPickups(state, view) {
  const pickups = state.pickups;
  if (!pickups) return;
  const T = view.tile;
  for (let i = 0; i < pickups.length; i += 1) {
    const p = pickups[i];
    const left = p.until - state.time;
    if (left <= 0) continue;
    if (left < 2 && Math.floor(state.time * 8) % 2 === 0) continue;
    const bob = view.reducedMotion ? 0 : Math.sin(state.time * 4 + p.id) * T * 0.06;
    const X = view.offsetX + p.x * T;
    const Y = view.offsetY + p.y * T;
    box(X - T * 0.22, Y + T * 0.25, T * 0.44, T * 0.08, '#00000030');
    drawHeart(X, Y + bob, T / 16);
    // One slow, chunky cross grows and recedes once a second beside a dropped heart.
    const unit = Math.max(1, Math.round(T / 16));
    const phase = view.reducedMotion ? 0.5 : (state.time + hash01(p.id + 1, 4)) % 1;
    const reach = unit * (3 + 2 * (1 - Math.abs(phase * 2 - 1)));
    const gx = X + T * 0.34;
    const gy = Y + bob - T * 0.28;
    fxBox(view, gx - reach / 2, gy - unit / 2, reach, unit, SPARK_A);
    fxBox(view, gx - unit / 2, gy - reach / 2, unit, reach, SPARK_A);
    if (view.reducedMotion || (phase > 0.28 && phase < 0.72))
      fxBox(view, gx - unit, gy - unit, unit * 2, unit * 2, SPARK_B);
  }
}

function drawBolts(state, view) {
  const T = view.tile;
  const u = Math.max(2, Math.round(T / 16));
  for (let i = 0; i < state.bolts.length; i += 1) {
    const b = state.bolts[i];
    const X = view.offsetX + b.x * T;
    const Y = view.offsetY + b.y * T;
    if (b.special) {
      if (view.reducedMotion) continue;
      const twin = Boolean(b.twin);
      const color = twin ? '#7298ef' : '#9b67df';
      const light = twin ? '#e4e1ff' : '#f1c9ff';
      if (b.wait > 0) {
        // The delayed copy is held in a ring around the cast point, never piled at its stored x/y.
        const gx = X + b.dx * T * 0.7;
        const gy = Y + b.dy * T * 0.52;
        fxBox(view, gx - u * 2.5, gy - u * 2.5, u * 5, u * 5, '#8168d899');
        fxBox(view, gx - u * 1.4, gy - u * 1.4, u * 2.8, u * 2.8, '#e9d8ff');
        continue;
      }
      const lead = T * 0.62 * (1 - Math.min(1, (b.travelled || 0) / 1.4));
      const bx = X + b.dx * lead;
      const by = Y + b.dy * lead;
      // Long stepped crystal with a bright core and three trailing chips.
      for (let k = 0; k < 6; k += 1) {
        const d = k * u * 1.9;
        const width = k === 0 || k === 5 ? u * 3 : u * 4;
        fxBox(view, bx - b.dx * d - width / 2, by - b.dy * d - width / 2,
          width, width, k % 2 ? color : light);
      }
      fxBox(view, bx - u * 2, by - u * 2, u * 4, u * 4, '#fff9e4');
      for (let k = 1; k <= 3 && (b.travelled || 0) > 0.35; k += 1) {
        const d = u * (12 + k * 4);
        const side = k % 2 ? 1 : -1;
        fxBox(view, bx - b.dx * d - b.dy * side * u * 2, by - b.dy * d + b.dx * side * u * 2,
          u * (k === 3 ? 2 : 3), u * (k === 3 ? 2 : 3), k % 2 ? light : color);
      }
      continue;
    }
    const s = T * 0.24;
    box(X - b.dx * T * 0.42 - s * 0.25, Y - b.dy * T * 0.42 - s * 0.25, s * 0.5, s * 0.5, '#4a9df0');
    box(X - b.dx * T * 0.24 - s * 0.35, Y - b.dy * T * 0.24 - s * 0.35, s * 0.7, s * 0.7, '#66dbe0');
    box(X - s / 2, Y - s / 2, s, s, '#66dbe0');
    box(X - s / 4, Y - s / 4, s / 2, s / 2, '#e3fdff');
  }
}

function drawStone(state, view) {
  const stone = state.hero.stone;
  if (!stone || stone.used) return;
  const T = view.tile;
  const X = view.offsetX + stone.x * T;
  const Y = view.offsetY + stone.y * T;
  const s = T / 16;
  box(X - s * 3, Y + s * 2, s * 6, s, '#00000030');
  box(X - s, Y - s * 4, s * 2, s, '#9affdd');
  box(X - s * 2, Y - s * 3, s * 4, s * 2, '#42c6be');
  box(X - s * 3, Y - s, s * 6, s * 2, '#42c6be');
  box(X - s * 2, Y + s, s * 4, s, '#227e89');
  box(X - s, Y - s * 3, s, s * 2, '#d3fff0');
}

function drawParticles(state, view) {
  const list = view.particles;
  if (!list) return;
  const T = view.tile;
  for (let i = 0; i < list.length; i += 1) {
    const q = list[i];
    const p = (state.time - q.born) / PARTICLE_LIFE;
    if (!(p >= 0 && p < 1)) continue;
    const drift = (hash01(q.id, 3) - 0.5) * 0.8;
    const X = view.offsetX + (q.x + drift * p) * T;
    const Y = view.offsetY + (q.y - 0.35 - 0.3 * p + 0.5 * p * p) * T;
    const s = T * 0.16;
    box(X - s / 2, Y - s / 2, s, s * 0.8, '#f4f1e6');
    box(X - s / 3, Y - s / 6, s * 0.66, Math.max(1, s * 0.12), '#9aa4ad');
  }
}

function drawTrail(state, view) {
  const hero = state.hero;
  const trail = view.worn && view.worn.trail;
  if (!trail || !hero.moving || !hero.history) return;
  const T = view.tile;
  const n = hero.history.length;
  const leaf = trail === 'trail-leaf';
  for (let k = 1; k <= 5; k += 1) {
    const idx = n - 1 - k * 6;
    if (idx < 0) break;
    const s = hero.history[idx];
    if (Math.abs(s.x - hero.x) + Math.abs(s.y - hero.y) < 0.15) continue;
    const X = view.offsetX + (s.x + (hash01(k, Math.floor(s.t * 10)) - 0.5) * 0.3) * T;
    const Y = view.offsetY + (s.y + HERO_RADIUS * 0.6) * T;
    const size = T * 0.14 * (1 - k / 7);
    if (leaf) {
      box(X - size / 2, Y - size / 2, size, size, k % 2 ? '#4caf50' : '#7bd06a');
    } else if ((Math.floor(state.time * 10) + k) % 2 === 0) {
      const color = k % 2 ? '#fff6c2' : '#f2b631';
      box(X - size * 1.5, Y - size / 4, size * 3, size / 2, color);
      box(X - size / 4, Y - size * 1.5, size / 2, size * 3, color);
    } else {
      box(X - size / 3, Y - size / 3, size * 0.66, size * 0.66, '#ffffff');
    }
  }
}

const FACE_ANGLE = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };

function heroBlinkedOut(state, view) {
  const hero = state.hero;
  if (view && !view.reducedMotion) {
    const hurt = view.effects && view.effects.some((fx) => fx.type === 'hurt' && state.time >= fx.born && state.time - fx.born < FX_LIFE.hurt);
    if (hurt) return false;
  }
  return state.time < hero.invulnUntil && Math.floor((hero.invulnUntil - state.time) / 0.1) % 2 === 1;
}

function heroHurtAge(state, view) {
  if (view.reducedMotion || !view.effects) return -1;
  for (let i = view.effects.length - 1; i >= 0; i -= 1) {
    const fx = view.effects[i];
    const age = state.time - fx.born;
    if (fx.type === 'hurt' && age >= 0 && age < 0.12) return age;
  }
  return -1;
}

// Repaint the actual character rectangles as a white silhouette for three frames, then put a red
// one-unit rim behind the normal sprite. The source sprite and its equipment remain untouched.
function drawHurtHero(ctx, view, x, feet, unit, options, age) {
  const white = age < 0.05;
  const rim = Math.max(1, Math.round(unit));
  const paint = {
    save() {}, restore() {}, set fillStyle(_color) {},
    fillRect(left, top, width, height) {
      if (white) fxBox(view, left, top, width, height, '#ffffff');
      else {
        fxBox(view, left - rim, top, width + rim * 2, height, '#df5e69');
        fxBox(view, left, top - rim, width, height + rim * 2, '#df5e69');
      }
    },
  };
  drawCharacter(paint, x, feet, unit, options);
  if (!white) drawCharacter(ctx, x, feet, unit, options);
}

// Light run dust kicked up behind the hero, independent of the worn 'trail' cosmetic (which stays a
// fancier effect layered on top for players who own it). Reduced motion gets one still puff instead.
const DUST_BACK = { right: [-1, 0], left: [1, 0], up: [0, 1], down: [0, -1] };
function drawHeroDust(state, view) {
  const hero = state.hero;
  if (!hero.moving) return;
  const T = view.tile;
  if (view.reducedMotion) {
    const back = DUST_BACK[hero.facing] || DUST_BACK.down;
    const X = view.offsetX + hero.x * T;
    const Y = view.offsetY + (hero.y + HERO_RADIUS * 0.85) * T;
    for (let k = 1; k <= 2; k += 1) {
      const s = T * 0.11 * (1 - k * 0.22);
      box(X + back[0] * T * 0.26 * k - s / 2, Y + back[1] * T * 0.14 * k - s / 2, s, s, k % 2 ? DUST : DUST_LO);
    }
    return;
  }
  const hist = hero.history;
  if (!hist || hist.length < 2) return;
  const n = hist.length;
  for (let k = 1; k <= 3; k += 1) {
    const idx = n - 1 - k * 4;
    if (idx < 0) break;
    const sample = hist[idx];
    if (Math.abs(sample.x - hero.x) + Math.abs(sample.y - hero.y) < 0.1) continue;
    const jitter = (hash01(k, Math.floor(sample.t * 8)) - 0.5) * 0.2;
    const X = view.offsetX + (sample.x + jitter) * T;
    const Y = view.offsetY + (sample.y + HERO_RADIUS * 0.8) * T;
    const s = Math.max(1, T * 0.15 * (1 - k * 0.2));
    box(X - s / 2, Y - s / 2, s, s, k % 2 ? DUST : DUST_LO);
    if (k === 1) box(X - s * 0.2, Y - s * 0.7, s * 0.4, s * 0.35, DUST);
  }
}

function drawHero(state, view, now) {
  const hero = state.hero;
  const time = state.time;
  const T = view.tile;
  const X = view.offsetX + hero.x * T;
  const feet = view.offsetY + (hero.y + HERO_RADIUS) * T;
  box(X - T * 0.35, feet - T * 0.08, T * 0.7, T * 0.14, '#00000038');
  if (heroBlinkedOut(state, view)) return;
  drawHeroDust(state, view);
  const attacking = time < hero.attackUntil && hero.attackStartedAt >= 0;
  const attack = attacking ? Math.max(0.01, Math.min(1, (time - hero.attackStartedAt) / SWING_TIME)) : 0;
  if (view.glow) {
    const spin = view.reducedMotion ? 0 : (Number(now) || 0) / 400;
    for (let k = 0; k < 3; k += 1) {
      const a = spin + k * 2.094;
      const s = Math.max(1, T / 14);
      box(X + Math.cos(a) * T * 0.62 - s / 2, feet - T + Math.sin(a) * T * 0.7 - s / 2, s, s, k === 1 ? '#fff1a6' : '#f2b631');
    }
  }
  const character = {
    look: view.look,
    equipped: view.equipped,
    worn: view.worn,
    facing: hero.facing,
    walk: hero.moving && !view.reducedMotion ? (time * 2.5) % 1 : 0,
    attack,
    blocking: Boolean(hero.blocking),
    glow: Boolean(view.glow),
    // Standing still: a slow breath. drawCharacter snaps bob to whole grid units, so this reads as one
    // pixel-art unit rising and settling roughly every three and a half seconds.
    bob: !hero.moving && !attacking && !hero.blocking && !view.reducedMotion ? (time * 0.28) % 1 : 0,
  };
  const hurtAge = heroHurtAge(state, view);
  if (hurtAge >= 0) drawHurtHero(C, view, X, feet, T / 16, character, hurtAge);
  else drawCharacter(C, X, feet, T / 16, character);
}

// Slash streak: a chunky crescent on the ground in front of the hero, spanning the real hitbox (the
// swing's arc around the facing direction, out to its reach). The leading edge travels across the arc in
// the same turning direction as the sword arm (eased, most of it in the first half), with a fading tail.
// Bare hands get a short, thin "punch" crescent. Reduced motion shows the whole arc, still.
const SWEEP_DIR = { right: 1, left: -1, down: -1, up: -1 };
// The crescent keeps the hitbox's angles and reach but is lifted (in tiles) from the feet plane toward the
// blade so it reads as the sword's trail. Facing down stays low so a slime right in front still touches it;
// facing up is drawn behind the hero and lifted so the arc rises over and beside his head.
export const SLASH_LIFT = { right: 0.7, left: 0.7, down: 0.15, up: 0.9 };
const SLASH_EDGE = '#e8a93a';
const SLASH_CORE = '#fff7d6';
const SLASH_TIP = '#ffffff';
const SLASH_INNER = '#ffe27a';
function drawSlash(state, view, attack) {
  const hero = state.hero;
  const T = view.tile;
  const bare = !(state.gear && state.gear.melee);
  const base = FACE_ANGLE[hero.facing] || 0;
  const dir = SWEEP_DIR[hero.facing] || 1;
  const arc = ((hero.swing.arc || 90) * Math.PI) / 180;
  const X = view.offsetX + hero.x * T;
  const Y = view.offsetY + (hero.y - (SLASH_LIFT[hero.facing] || 0)) * T;
  // Blocks snap to a coarse pixel grid so the streak reads as pixel art at every tile size.
  const px = Math.max(1, Math.round(T / 12));
  const s = px * 3;
  const outer = (hero.swing.reach || 1) * T - s / 2;
  const layers = bare ? 2 : 4;
  const start = base - (dir * arc) / 2;
  let lead;
  let tail;
  if (view.reducedMotion) {
    lead = arc;
    tail = arc;
  } else {
    const t = Math.min(1, attack / 0.6);
    lead = arc * (1 - (1 - t) * (1 - t) * (1 - t));
    // Tail trails ~60% of the arc (a third for a punch), then collapses into the end over the hold.
    tail = arc * (bare ? 0.45 : 0.6) * (attack < 0.6 ? 1 : Math.max(0, (1 - attack) / 0.4));
  }
  const gap = Math.min(s * 0.6, outer * 0.16); // Layer spacing: the band stays a crescent at small tiles.
  const from = Math.max(0, lead - tail);
  const span = lead - from;
  if (!(span > 0) && !view.reducedMotion) return;
  const steps = Math.max(3, Math.min(bare ? 6 : 12, Math.ceil((outer * span) / (s * 0.7))));
  for (let k = 0; k <= steps; k += 1) {
    const f = k / steps; // 0 = tail end, 1 = leading edge
    const a = start + dir * (from + span * f);
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    // Taper: the tail keeps only the core layer, the leading edge carries every layer.
    const depth = view.reducedMotion ? layers : Math.max(1, Math.ceil(layers * (0.35 + 0.65 * f)));
    for (let j = 0; j < depth; j += 1) {
      const rad = outer - j * gap;
      const size = j === 0 && f > 0.4 ? s : Math.max(px, s - px);
      const color = k === steps && !view.reducedMotion ? SLASH_TIP : j === 0 ? SLASH_EDGE : j === layers - 1 ? SLASH_INNER : SLASH_CORE;
      const cx = Math.round((X + cos * rad) / px) * px;
      const cy = Math.round((Y + sin * rad) / px) * px;
      box(cx - size / 2, cy - size / 2, size, size, color);
    }
  }
  // A single bright start bead; it disappears before the crescent has swept across the target.
  const started = view.effects && view.effects.some((fx) => fx.type === 'swing' && state.time >= fx.born && state.time - fx.born < FX_LIFE.swing - 1e-9);
  if (!view.reducedMotion && started && attack < 0.11) {
    const x = X + Math.cos(start) * outer;
    const y = Y + Math.sin(start) * outer;
    box(x - px * 2, y - px * 2, px * 4, px * 4, '#fff7d6');
    box(x - px, y - px, px * 2, px * 2, '#ffffff');
  }
}

// Impact burst: bright squares radiating from the side of the target that faces the hero, shrinking over
// ENEMY_FLASH; reduced motion keeps the same star still. Used for hits (enemy.flashUntil) and for kills (the
// first ENEMY_FLASH of every puff: puffs only come from poofs), so a one-hit kill shows spark, then poof.
const BURST_RAYS = 4;
function drawImpact(x, y, id, left, size, state, view) {
  if (!(left > 0)) return;
  const T = view.tile;
  const hero = state.hero;
  const q = view.reducedMotion ? 0.3 : Math.max(0, Math.min(1, 1 - left / ENEMY_FLASH));
  const toHero = Math.atan2(hero.y - y, hero.x - x);
  const X = view.offsetX + (x + Math.cos(toHero) * 0.45 * size) * T;
  const Y = view.offsetY + (y + Math.sin(toHero) * 0.45 * size) * T;
  const px = Math.max(1, Math.round(T / 16));
  const s = Math.max(px, Math.round((T * 0.24 * (1 - 0.45 * q)) / px) * px);
  const dist = T * (0.3 + 0.4 * q);
  const spin = Math.PI / 4 + (hash01(id, 7) - 0.5) * 0.6; // Roughly an X, tilted per target.
  const small = Math.max(px, Math.round((s * 0.6) / px) * px);
  // Four rays, each a gold spark with a bright yellow head (8 radiating squares), around a gold/white core.
  for (let k = 0; k < BURST_RAYS; k += 1) {
    const a = spin + (k * Math.PI * 2) / BURST_RAYS;
    const ix = Math.round((X + Math.cos(a) * dist * 0.55) / px) * px;
    const iy = Math.round((Y + Math.sin(a) * dist * 0.55) / px) * px;
    const bx = Math.round((X + Math.cos(a) * dist) / px) * px;
    const by = Math.round((Y + Math.sin(a) * dist) / px) * px;
    box(ix - small / 2, iy - small / 2, small, small, '#f2b631');
    box(bx - s / 2, by - s / 2, s, s, '#ffe066');
  }
  box(X - s * 0.65, Y - s * 0.65, s * 1.3, s * 1.3, '#f2b631');
  box(X - s * 0.35, Y - s * 0.35, s * 0.7, s * 0.7, '#ffffff');
}
function drawEnemyImpact(e, state, view) {
  const def = ENEMIES[e.type];
  drawImpact(e.x, e.y, e.id, e.flashUntil - state.time, def && def.size >= 2 ? 2 : 1, state, view);
}
function drawKillSparks(state, view) {
  for (let i = 0; i < state.puffs.length; i += 1) {
    const puff = state.puffs[i];
    const age = state.time - puff.bornAt;
    if (age >= 0) drawImpact(puff.x, puff.y, puff.id, ENEMY_FLASH - age, 1, state, view);
  }
}

// ---------- entry points ----------
// view: { widthPx, heightPx, tile, offsetX, offsetY, look, equipped, worn, glow, reducedMotion, particles?, effects?, shake? }
export function renderBattle(ctx, state, view, now) {
  if (!ctx || !state || !view || !(view.tile > 0)) return;
  C = ctx;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#0c2034';
  ctx.fillRect(0, 0, view.widthPx, view.heightPx);
  const shake = shakeOffset(view, state.time);
  const shifted = (shake.x !== 0 || shake.y !== 0) && typeof ctx.translate === 'function';
  if (shifted) { ctx.save(); ctx.translate(shake.x, shake.y); }
  FX_SHIFT_X = shifted ? shake.x : 0;
  FX_SHIFT_Y = shifted ? shake.y : 0;
  drawArena(view, state.time);
  drawEventFx(state, view, false);
  drawFortRing(state, view);
  drawSaveBubble(state, view, false);
  drawChestProp(view, state.time);
  drawStone(state, view);
  drawPickups(state, view);
  drawTrail(state, view);
  const hero = state.hero;
  const heroY = hero.y;
  const slashing = Boolean(hero.swing) && state.time < hero.attackUntil && hero.attackStartedAt >= 0;
  const attack = slashing ? Math.max(0.01, Math.min(1, (state.time - hero.attackStartedAt) / SWING_TIME)) : 0;
  const blinkedOut = heroBlinkedOut(state, view);
  // Facing up the slash is behind the hero (after the enemies behind him); every other facing is in front
  // of all sprites so a hit enemy never hides the streak.
  const behind = hero.facing === 'up';
  for (let i = 0; i < state.enemies.length; i += 1) if (state.enemies[i].y < heroY) drawEnemy(state.enemies[i], state, view);
  if (slashing && behind && !blinkedOut) drawSlash(state, view, attack);
  drawHero(state, view, now);
  for (let i = 0; i < state.enemies.length; i += 1) if (state.enemies[i].y >= heroY) drawEnemy(state.enemies[i], state, view);
  if (slashing && !behind && !blinkedOut) drawSlash(state, view, attack);
  for (let i = 0; i < state.enemies.length; i += 1) drawEnemyImpact(state.enemies[i], state, view);
  drawBolts(state, view);
  drawPuffs(state, view);
  drawKillSparks(state, view);
  drawEventFx(state, view, true);
  drawSaveBubble(state, view, true);
  drawParticles(state, view);
  if (shifted) ctx.restore();
  FX_SHIFT_X = 0;
  FX_SHIFT_Y = 0;
  C = null;
}

// HUD slot icons that aren't items: 'fist' (bare hands) and 'apple'.
export function drawSlotIcon(ctx, size, id) {
  if (!ctx || !(size > 0)) return;
  C = ctx;
  setOrigin(0, 0, size / 16, false);
  FLASH = null;
  if (id === 'fist') {
    r(4, 4, 8, 7, '#eebc98'); r(4, 4, 8, 1, '#f6d7c3');
    r(6, 4, 1, 4, '#b97a56'); r(9, 4, 1, 4, '#b97a56');
    r(11, 5, 1, 6, '#b97a56'); r(4, 10, 8, 1, '#b97a56');
    r(5, 11, 6, 3, '#e8833a'); r(5, 13, 6, 1, '#b25f24');
  } else if (id === 'apple') {
    r(7, 1, 2, 3, '#6b4226'); r(9, 2, 3, 2, '#4caf50');
    r(3, 4, 10, 9, '#d64545'); r(4, 13, 8, 1, '#a83232'); r(2, 6, 1, 5, '#d64545'); r(13, 6, 1, 5, '#a83232');
    r(5, 5, 2, 2, '#ff9a8a');
  }
  C = null;
}
