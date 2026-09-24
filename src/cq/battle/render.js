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

// ---------- tiny drawing kernel (module state avoids per-rect closures) ----------
let C = null;
let OX = 0;
let OY = 0;
let U = 1;
let MIRROR = false;
let FLASH = null;

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
  const reduced = Boolean(view.reducedMotion);
  if (chicken) drawChicken(e, time);
  else if (e.type === 'slime') drawSlime(e, time, false, reduced);
  else if (e.type === 'mega-slime') drawSlime(e, time, true, reduced);
  else if (e.type === 'goblin') drawGoblin(e, time, reduced);
  else if (e.type === 'mimic') drawMimic(e, time, T, X, Y - (T * size) / 2);
  else if (e.type === 'big-glitch') drawBigGlitch(e, time, view.reducedMotion);
  FLASH = null;
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
    // Two little cross-shaped glints that twinkle in and out beside the heart, each in its own fixed spot,
    // so a dropped heart catches the eye without anything flashing.
    const gt = view.reducedMotion ? 0 : state.time;
    const s = Math.max(1, T * 0.055);
    for (let k = 0; k < 2; k += 1) {
      const ph = (gt * 0.9 + k * 0.5 + hash01(p.id + 1, 4)) % 1;
      if (ph > 0.45) continue;
      const grow = ph < 0.22 ? ph / 0.22 : (0.45 - ph) / 0.23;
      const a = hash01(p.id + 1, 6 + k) * 6.283 + k * Math.PI;
      const gx = X + Math.cos(a) * T * 0.3;
      const gy = Y + bob + Math.sin(a) * T * 0.22;
      const len = s * (0.8 + grow * 1.8);
      box(gx - len / 2, gy - s / 2, len, s, k ? SPARK_B : SPARK_A);
      box(gx - s / 2, gy - len / 2, s, len, k ? SPARK_B : SPARK_A);
    }
  }
}

function drawBolts(state, view) {
  const T = view.tile;
  for (let i = 0; i < state.bolts.length; i += 1) {
    const b = state.bolts[i];
    const X = view.offsetX + b.x * T;
    const Y = view.offsetY + b.y * T;
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

function heroBlinkedOut(state) {
  const hero = state.hero;
  return state.time < hero.invulnUntil && Math.floor((hero.invulnUntil - state.time) / 0.1) % 2 === 1;
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
  if (heroBlinkedOut(state)) return;
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
  drawCharacter(C, X, feet, T / 16, {
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
  });
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
  box(X - s * 0.6, Y - s * 0.6, s * 1.2, s * 1.2, '#f2b631');
  box(X - s * 0.3, Y - s * 0.3, s * 0.6, s * 0.6, '#ffffff');
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
// view: { widthPx, heightPx, tile, offsetX, offsetY, look, equipped, worn, glow, reducedMotion, particles? }
export function renderBattle(ctx, state, view, now) {
  if (!ctx || !state || !view || !(view.tile > 0)) return;
  C = ctx;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#0c2034';
  ctx.fillRect(0, 0, view.widthPx, view.heightPx);
  drawArena(view, state.time);
  drawChestProp(view, state.time);
  drawStone(state, view);
  drawPickups(state, view);
  drawTrail(state, view);
  const hero = state.hero;
  const heroY = hero.y;
  const slashing = Boolean(hero.swing) && state.time < hero.attackUntil && hero.attackStartedAt >= 0;
  const attack = slashing ? Math.max(0.01, Math.min(1, (state.time - hero.attackStartedAt) / SWING_TIME)) : 0;
  const blinkedOut = heroBlinkedOut(state);
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
  drawParticles(state, view);
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
