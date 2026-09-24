// Computer Quest Typing Dojo: the side-view run. Pure canvas (only the ctx passed in), fillRect-only
// original pixel art, no random calls; every animation is a function of `now` and the scene.
import { drawCharacter } from '../sprite.js';
import { heroX, itemStarts, PATH_END } from './view.js';

export const HOP_MS = 140;
export const STUMBLE_MS = 260;
export const PUFF_MS = 450;

const SKY = '#16354d';
const SKY_LOW = '#1b3e57';
const FAR = ['#1f4861', '#234f69', '#1c435b'];
const STAR = '#8ec4c5';
const STAR_DIM = '#47798a';
const STAR_BRIGHT = '#e6f4d5';
const MIST = ['#244a61', '#284e64'];
const WINDOW_DARK = '#34576b';
const WINDOW_LIT = '#f5cf77';
const TUFT = '#345f68';
const PEBBLE = '#72949a';
const FLY_RING = '#658c79';
const FLY = '#ffe49a';
const GROUND = '#476d78';
const GROUND_EDGE = '#83b6b8';
const GROUND_MARK = '#3b5f6a';
const GROUND_DEEP = '#264b5b';
const STONE = '#737f87';
const STONE_HI = '#a3b0b6';
const STONE_LO = '#4f5a61';
const CRACK = '#3c464d';
const PUFF = ['#e6eef0', '#b9c9cf', '#f1f6e8'];
const SHADOW = '#0d2437';
const POLE = '#d8e8ed';
const FLAG = '#ffd76a';
const FLAG_SHADE = '#d9ad55';
const MOSS = '#557b70';
const SPARK = '#fff0ad';
const CHIP_FADE = '#607781';
const CHIP_EDGE_FADE = '#405b69';

let C = null;
let boundsW = 0;
let boundsH = 0;
function rect(x, y, w, h, color) {
  const rawLeft = Math.round(x);
  const rawTop = Math.round(y);
  const left = Math.max(0, rawLeft);
  const top = Math.max(0, rawTop);
  const right = Math.min(boundsW, Math.max(rawLeft + 1, Math.round(x + w)));
  const bottom = Math.min(boundsH, Math.max(rawTop + 1, Math.round(y + h)));
  if (left >= right || top >= bottom) return;
  C.fillStyle = color;
  C.fillRect(left, top, right - left, bottom - top);
}
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const finite = (v, fallback) => (Number.isFinite(v) ? v : fallback);
const since = (at, now) => (Number.isFinite(at) && Number.isFinite(now) ? now - at : Infinity);

export function sceneUnit(heightPx) {
  return Math.max(1, Math.floor((finite(heightPx, 0) * 0.6) / 32));
}

// True while a hop, stumble or block puff is still playing.
export function animating(scene, now) {
  if (!scene || scene.reducedMotion) return false;
  if (scene.hop && since(scene.hop.at, now) < HOP_MS) return true;
  if (scene.stumble && since(scene.stumble.at, now) < STUMBLE_MS) return true;
  const smashes = scene.smashes || {};
  return Object.keys(smashes).some((k) => since(smashes[k], now) < PUFF_MS);
}

function background(W, H, groundY, unit, time, reduced, progress, quietX, nextX) {
  rect(0, 0, W, groundY, SKY);
  rect(0, groundY * 0.55, W, groundY * 0.45, SKY_LOW);
  // Two small mist banks move behind the skyline, well above the typing path.
  for (let i = 0; i < 2; i += 1) {
    const drift = reduced ? 0 : Math.floor((time / 220 + i * 17) % 18) * unit;
    const x = Math.min(W - unit * 15, Math.max(0, W * (i ? 0.58 : 0.13) + drift));
    const y = groundY * (i ? 0.57 : 0.48);
    rect(x, y, unit * 15, unit * 2, MIST[i]);
    rect(x + unit * 3, y - unit, unit * 9, unit, MIST[i]);
  }
  for (let i = 0; i < 9; i += 1) {
    const sx = ((i * 97 + 31) % 100) / 100 * W;
    const sy = ((i * 53 + 7) % 40) / 100 * groundY + unit;
    const phase = reduced ? 1 : (Math.floor((time + i * 610) / 1800) + i) % 4;
    rect(sx, sy, unit, unit, phase === 0 ? STAR_BRIGHT : phase === 2 ? STAR_DIM : STAR);
    if (!reduced && phase === 0 && i % 3 === 1) {
      rect(sx - unit, sy, unit, unit, STAR);
      rect(sx + unit, sy, unit, unit, STAR);
      rect(sx, sy - unit, unit, unit, STAR);
      rect(sx, sy + unit, unit, unit, STAR);
    }
  }
  for (let i = 0; i < 8; i += 1) {
    const bw = W * 0.09;
    const bh = groundY * (0.22 + ((i * 37) % 5) * 0.07);
    const bx = Math.min(W - bw, (i / 8) * W + ((i * 29) % 7) * unit - (i > 0 ? Math.floor(progress * unit * 2) : 0));
    rect(bx, groundY - bh, bw, bh, FAR[i % FAR.length]);
    rect(bx + bw * 0.25, groundY - bh + unit * 2, Math.max(1, unit), Math.max(1, unit), SKY_LOW);
    // Four of the eight warm windows glow at a time; paired phases keep the skyline calm.
    const windowPhase = reduced ? 0 : (Math.floor((time + (i % 4) * 475) / 1900) + (i >= 4 ? 2 : 0)) % 4;
    rect(bx + bw * 0.64, groundY - bh + unit * 4, unit, unit,
      windowPhase < 2 ? WINDOW_LIT : WINDOW_DARK);
  }
  rect(0, groundY, W, H - groundY, GROUND);
  rect(0, groundY, W, Math.max(1, unit), GROUND_EDGE);
  rect(0, H - Math.max(1, unit * 2), W, Math.max(1, unit * 2), GROUND_DEEP);
  const step = Math.max(6, unit * 8);
  for (let x = unit * 3; x < W; x += step) rect(x, groundY + unit * 3, unit * 3, Math.max(1, unit), GROUND_MARK);
  for (let i = 0; i < 12; i += 1) {
    const x = (i + 0.5) * W / 12;
    if (i % 3 === 0) {
      rect(x, groundY + unit * 5, unit * 2, unit, PEBBLE);
      rect(x + unit, groundY + unit * 4, unit, unit, STONE_LO);
    } else {
      rect(x, groundY + unit * 6, unit, unit * 2, TUFT);
      rect(x + unit, groundY + unit * 5, unit, unit * 3, TUFT);
    }
  }
  // Warm ground lights drift in the distance, outside the hero and next-stone band.
  for (let i = 0; i < 4; i += 1) {
    const x = W * (0.30 + i * 0.17) + (reduced ? 0 : Math.round(Math.sin(time / 2300 + i * 2) * unit * 2));
    if (Math.abs(x - quietX) < unit * 13 || Math.abs(x - nextX) < unit * 11) continue;
    const y = groundY - unit * (5 + i % 2) + (reduced ? 0 : Math.round(Math.sin(time / 1900 + i) * unit));
    rect(x - unit, y, unit * 3, unit, FLY_RING);
    rect(x, y - unit, unit, unit * 3, FLY_RING);
    rect(x, y, unit, unit, FLY);
  }
  const flagX = W * (PATH_END + 0.07);
  rect(flagX, groundY - unit * 20, unit, unit * 20, POLE);
  const wave = reduced ? 0 : Math.floor(time / 1300) % 3;
  rect(flagX + unit, groundY - unit * 20, unit * (8 - wave), unit * 3, FLAG);
  rect(flagX + unit, groundY - unit * 17, unit * (6 + wave), unit, FLAG_SHADE);
  rect(flagX + unit * (7 - wave), groundY - unit * (19 - wave), unit * 2, unit, FLAG);
  const glint = reduced ? 0 : Math.floor(time / 1800) % 3;
  rect(flagX + unit * (7 - wave), groundY - unit * (19 - wave), unit, unit,
    glint === 0 ? SPARK : FLAG);
}

function block(cx, groundY, size, index, unit) {
  const left = cx - size / 2;
  const top = groundY - size;
  rect(left, top, size, size, STONE);
  rect(left, top, size, Math.max(1, size / 6), STONE_HI);
  rect(left, top + size - Math.max(1, size / 6), size, Math.max(1, size / 6), STONE_LO);
  rect(left + size - Math.max(1, size / 7), top, Math.max(1, size / 7), size, STONE_LO);
  rect(left + size * 0.3, top + size * 0.35, Math.max(1, size / 7), Math.max(1, size / 3), CRACK);
  rect(left + unit * (1 + index % 3), top + unit, unit * 2, unit, MOSS);
  if (index % 2) rect(left + size * 0.65, top + size * 0.52, unit, unit * 2, CRACK);
  if (index % 3 === 0) rect(left + unit, top + size * 0.63, unit * 2, unit, STONE_HI);
}

function puff(cx, cy, unit, t, reachLimit) {
  const cloud = unit * (3.8 - t * 1.8);
  const spread = unit * (0.6 + t * 5.2);
  const puffColors = t > 2 / 3 ? [CHIP_FADE, GROUND_EDGE, CHIP_EDGE_FADE] : PUFF;
  rect(cx - cloud * 0.65, cy - cloud * 0.45, cloud * 1.3, cloud * 0.9, puffColors[0]);
  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * Math.PI * 2;
    const bit = cloud * (i % 3 === 0 ? 0.8 : 0.65);
    rect(cx + Math.cos(angle) * spread - bit / 2,
      cy + Math.sin(angle) * spread * 0.55 - bit / 2,
      bit, bit, puffColors[i % puffColors.length]);
  }
  // Eight two-tone chips spread six units, peak five to seven units high, then fall.
  for (let i = 0; i < 8; i += 1) {
    const side = i % 2 ? 1 : -1;
    const lane = Math.floor(i / 2);
    const start = unit * (0.5 + lane * 0.2);
    const reach = start + (Math.min(unit * (3 + lane), reachLimit) - start) * Math.sqrt(t);
    const arc = unit * [5, 7, 6, 5][lane] * 4 * t * (1 - t);
    const chip = unit * (i % 3 === 0 ? 3 : 2);
    const x = cx + side * reach - chip / 2;
    const y = cy - arc + unit * (i % 2 ? 1 : 2) * t * t - chip / 2;
    rect(x, y, chip, chip, t > 2 / 3 ? CHIP_EDGE_FADE : STONE_LO);
    rect(x, y, chip - unit, chip - unit, t > 2 / 3 ? CHIP_FADE : i % 2 ? STONE_HI : STONE);
  }
  // A brief four-unit gold-white burst marks the instant the word finishes.
  if (t < 120 / PUFF_MS) {
    const starX = cx + unit * 3;
    const starY = cy - unit * 7;
    rect(starX - unit * 2, starY - unit / 2, unit * 4, unit, SPARK);
    rect(starX - unit / 2, starY - unit * 2, unit, unit * 4, SPARK);
    rect(starX - unit, starY - unit, unit * 2, unit * 2, '#fff8df');
    rect(starX - unit * 2, starY - unit * 2, unit, unit, FLAG);
    rect(starX + unit, starY + unit, unit, unit, FLAG);
  }
}

// scene: { widthPx, heightPx, items, index, look, equipped, worn, glow, reducedMotion,
//          hop: { at, from } | null, stumble: { at } | null, smashes: { [itemIndex]: at } }
export function renderRun(ctx, scene, now) {
  if (!ctx || !scene) return;
  const W = finite(scene.widthPx, 0);
  const H = finite(scene.heightPx, 0);
  if (!(W > 0) || !(H > 0)) return;
  C = ctx;
  boundsW = W; boundsH = H;
  ctx.imageSmoothingEnabled = false;
  const unit = sceneUnit(H);
  const groundY = Math.round(H * 0.82);
  const items = Array.isArray(scene.items) ? scene.items.map(String) : [];
  const total = items.join(' ').length;
  const index = Math.max(0, Math.min(total, finite(scene.index, 0)));
  const reduced = Boolean(scene.reducedMotion);
  const starts = itemStarts(items);
  const gap = items.length ? (heroX(1, W) - heroX(0, W)) / items.length : unit * 7;
  const size = Math.max(4, Math.min(unit * 7, gap * 0.82));
  const reach = unit * 6;
  const smashes = scene.smashes || {};
  const puffMs = PUFF_MS;
  const fraction = total > 0 ? index / total : 0;
  const next = starts.findIndex((start, k) => index < start + items[k].length);
  const nextX = next < 0 ? -W : heroX((starts[next] + items[next].length) / total, W) + reach;
  const time = reduced ? 0 : finite(now, 0);
  background(W, H, groundY, unit, time, reduced, fraction, heroX(fraction, W), nextX);

  // Blocks: one per item, standing where the hero arrives as that item's last letter is typed.
  for (let k = 0; k < items.length; k += 1) {
    const end = starts[k] + items[k].length;
    const cx = heroX(total > 0 ? end / total : 1, W) + reach;
    if (index < end) block(cx, groundY, size, k, unit);
    else {
      const age = since(smashes[k], now);
      if (!reduced && age >= 0 && age < puffMs) puff(cx + unit * 3, groundY - size / 2, unit,
        clamp01(age / puffMs), Math.max(unit, Math.min(unit * 6, gap * 0.42)));
    }
  }

  const finalAge = since(smashes[items.length - 1], now);
  if (!reduced && index === total && finalAge >= 0 && finalAge < PUFF_MS) {
    const flagX = W * (PATH_END + 0.07);
    const glintY = groundY - unit * 18;
    const glint = finalAge < PUFF_MS / 2 ? unit * 2 : unit;
    rect(flagX - glint, glintY, glint, unit, SPARK);
    rect(flagX + unit * 8, glintY - unit * 2, glint, unit, SPARK);
    rect(flagX + unit * 6, glintY + unit * 4, unit, glint, SPARK);
  }

  // Hero: eased step + small hop on a correct key, a tiny shake on a wrong one.
  let shown = fraction;
  let lift = 0;
  let walk = 0;
  const hopAge = scene.hop ? since(scene.hop.at, now) : Infinity;
  if (!reduced && hopAge >= 0 && hopAge < HOP_MS) {
    const t = clamp01(hopAge / HOP_MS);
    const from = finite(scene.hop.from, fraction);
    shown = from + (fraction - from) * (1 - (1 - t) * (1 - t));
    walk = t;
    if (!reduced) lift = Math.round(Math.sin(Math.PI * t) * unit * 3);
  }
  let shake = 0;
  const stumbleAge = scene.stumble ? since(scene.stumble.at, now) : Infinity;
  if (!reduced && stumbleAge >= 0 && stumbleAge < STUMBLE_MS) {
    shake = Math.round(Math.sin((stumbleAge / STUMBLE_MS) * Math.PI * 6) * unit * 1.5);
  }
  const x = heroX(shown, W);
  if (!reduced && hopAge >= HOP_MS * 0.7 && hopAge < HOP_MS) {
    const landing = (hopAge - HOP_MS * 0.7) / (HOP_MS * 0.3);
    const dustX = x - unit * (3 + landing * 2);
    rect(dustX, groundY - unit, unit * 2, unit, GROUND_EDGE);
    rect(dustX - unit * 2, groundY - unit * (1 + landing), unit, unit, PEBBLE);
  }
  rect(x - unit * 5, groundY, unit * 10, Math.max(1, unit), SHADOW);
  drawCharacter(ctx, Math.round(x + shake), groundY - lift, unit, {
    look: scene.look, equipped: scene.equipped || {}, worn: scene.worn || {}, facing: 'right', walk, glow: Boolean(scene.glow),
    bob: reduced || hopAge < HOP_MS || stumbleAge < STUMBLE_MS ? 0 : time / 1800 + 0.25,
  });
}
