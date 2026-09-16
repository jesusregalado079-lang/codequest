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
const GROUND = '#476d78';
const GROUND_EDGE = '#83b6b8';
const GROUND_MARK = '#3b5f6a';
const GROUND_DEEP = '#264b5b';
const STONE = '#737f87';
const STONE_HI = '#a3b0b6';
const STONE_LO = '#4f5a61';
const CRACK = '#3c464d';
const PUFF = ['#e6eef0', '#a3b0b6', '#c9d4d8'];
const SHADOW = '#0d2437';
const POLE = '#d8e8ed';
const FLAG = '#ffd76a';

let C = null;
function rect(x, y, w, h, color) {
  const left = Math.round(x);
  const top = Math.round(y);
  const width = Math.max(1, Math.round(x + w) - left);
  const height = Math.max(1, Math.round(y + h) - top);
  C.fillStyle = color;
  C.fillRect(left, top, width, height);
}
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const finite = (v, fallback) => (Number.isFinite(v) ? v : fallback);
const since = (at, now) => (Number.isFinite(at) && Number.isFinite(now) ? now - at : Infinity);

export function sceneUnit(heightPx) {
  return Math.max(1, Math.floor((finite(heightPx, 0) * 0.6) / 32));
}

// True while a hop, stumble or block puff is still playing (the host keeps its rAF running only then).
export function animating(scene, now) {
  if (!scene) return false;
  if (scene.hop && since(scene.hop.at, now) < HOP_MS) return true;
  if (scene.stumble && since(scene.stumble.at, now) < STUMBLE_MS) return true;
  const smashes = scene.smashes || {};
  return Object.keys(smashes).some((k) => since(smashes[k], now) < PUFF_MS);
}

function background(W, H, groundY, unit) {
  rect(0, 0, W, groundY, SKY);
  rect(0, groundY * 0.55, W, groundY * 0.45, SKY_LOW);
  for (let i = 0; i < 9; i += 1) {
    const sx = ((i * 97 + 31) % 100) / 100 * W;
    const sy = ((i * 53 + 7) % 40) / 100 * groundY + unit;
    rect(sx, sy, unit, unit, STAR);
  }
  for (let i = 0; i < 8; i += 1) {
    const bw = W * 0.09;
    const bh = groundY * (0.22 + ((i * 37) % 5) * 0.07);
    const bx = (i / 8) * W + ((i * 29) % 7) * unit;
    rect(bx, groundY - bh, bw, bh, FAR[i % FAR.length]);
    rect(bx + bw * 0.25, groundY - bh + unit * 2, Math.max(1, unit), Math.max(1, unit), SKY_LOW);
  }
  rect(0, groundY, W, H - groundY, GROUND);
  rect(0, groundY, W, Math.max(1, unit), GROUND_EDGE);
  rect(0, H - Math.max(1, unit * 2), W, Math.max(1, unit * 2), GROUND_DEEP);
  const step = Math.max(6, unit * 8);
  for (let x = unit * 3; x < W; x += step) rect(x, groundY + unit * 3, unit * 3, Math.max(1, unit), GROUND_MARK);
  const flagX = W * (PATH_END + 0.07);
  rect(flagX, groundY - unit * 20, unit, unit * 20, POLE);
  rect(flagX + unit, groundY - unit * 20, unit * 7, unit * 5, FLAG);
}

function block(cx, groundY, size) {
  const left = cx - size / 2;
  const top = groundY - size;
  rect(left, top, size, size, STONE);
  rect(left, top, size, Math.max(1, size / 6), STONE_HI);
  rect(left, top + size - Math.max(1, size / 6), size, Math.max(1, size / 6), STONE_LO);
  rect(left + size - Math.max(1, size / 7), top, Math.max(1, size / 7), size, STONE_LO);
  rect(left + size * 0.3, top + size * 0.35, Math.max(1, size / 7), Math.max(1, size / 3), CRACK);
}

function puff(cx, cy, size, t) {
  const spread = size * (0.3 + 0.9 * t);
  const bit = Math.max(1, size * 0.35 * (1 - t));
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    rect(cx + Math.cos(angle) * spread - bit / 2, cy + Math.sin(angle) * spread * 0.7 - bit / 2, bit, bit, PUFF[i % PUFF.length]);
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
  ctx.imageSmoothingEnabled = false;
  const unit = sceneUnit(H);
  const groundY = Math.round(H * 0.82);
  const items = Array.isArray(scene.items) ? scene.items.map(String) : [];
  const total = items.join(' ').length;
  const index = Math.max(0, Math.min(total, finite(scene.index, 0)));
  const reduced = Boolean(scene.reducedMotion);
  background(W, H, groundY, unit);

  // Blocks: one per item, standing where the hero arrives as that item's last letter is typed.
  const starts = itemStarts(items);
  const size = Math.max(4, unit * 7);
  const reach = unit * 6;
  const smashes = scene.smashes || {};
  const puffMs = reduced ? PUFF_MS / 2 : PUFF_MS;
  for (let k = 0; k < items.length; k += 1) {
    const end = starts[k] + items[k].length;
    const cx = heroX(total > 0 ? end / total : 1, W) + reach;
    if (index < end) block(cx, groundY, size);
    else {
      const age = since(smashes[k], now);
      if (age >= 0 && age < puffMs) puff(cx, groundY - size / 2, size, clamp01(age / puffMs));
    }
  }

  // Hero: eased step + small hop on a correct key, a tiny shake on a wrong one.
  const fraction = total > 0 ? index / total : 0;
  let shown = fraction;
  let lift = 0;
  let walk = 0;
  const hopAge = scene.hop ? since(scene.hop.at, now) : Infinity;
  if (hopAge >= 0 && hopAge < HOP_MS) {
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
  rect(x - unit * 5, groundY, unit * 10, Math.max(1, unit), SHADOW);
  drawCharacter(ctx, Math.round(x + shake), groundY - lift, unit, {
    look: scene.look, equipped: scene.equipped || {}, worn: scene.worn || {}, facing: 'right', walk, glow: Boolean(scene.glow), bob: 0,
  });
}
