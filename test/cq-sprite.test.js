import assert from 'node:assert/strict';
import { COSMETICS, DEFAULT_LOOK, ITEMS, LOOK_OPTIONS } from '../src/cq/items.js';
import { equip, normalizeCq, randomLook, trackItems, wear } from '../src/cq/character.js';
import { drawCharacter, drawIcon } from '../src/cq/sprite.js';

// No browser globals: core drawing must stay usable in a headless battle/test loop.
const cssColor = /^(#[\da-f]{3}|#[\da-f]{6}|#[\da-f]{8}|rgba?\(\s*[\d.,%\s]+\))$/i;
function context() {
  let fill = '#000000';
  const calls = [], colors = [], stack = [];
  return {
    calls, colors,
    set fillStyle(value) { assert.equal(typeof value, 'string'); assert.match(value, cssColor); fill = value; colors.push(value); },
    get fillStyle() { return fill; },
    fillRect(...rect) {
      assert.equal(rect.length, 4);
      assert.ok(rect.every(Number.isFinite), `Non-finite rectangle: ${rect}`);
      assert.ok(rect[2] > 0 && rect[3] > 0, `Non-positive rectangle: ${rect}`);
      calls.push([fill, ...rect]);
    },
    save() { stack.push(fill); }, restore() { assert.ok(stack.length); fill = stack.pop(); },
    translate() {}, rotate() {}, scale() {}, beginPath() {}, closePath() {}, fill() {}, stroke() {},
    moveTo() {}, lineTo() {}, arc() {}, clearRect() {},
    balanced() { assert.equal(stack.length, 0); },
  };
}
let seed = 20260916;
const rng = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const looks = [DEFAULT_LOOK, ...Array.from({ length: 25 }, () => randomLook(rng))];
const bare = normalizeCq({ track: 'guided', look: DEFAULT_LOOK, owned: ITEMS.map((i) => i.id), cosmetics: COSMETICS.map((c) => c.id) });
const loadouts = [bare];
// A single legal loadout cannot contain all ten items (two swords, two off-hands).
// Both complete track sets cover every item while honoring the actual equip API.
for (const track of ['guided', 'standard']) {
  let state = { ...bare, track };
  trackItems(track).forEach((item) => { state = equip(state, item.id); });
  loadouts.push(state);
}
// Cycle each layer until every cosmetic is worn, with and without head gear.
const layers = ['hat', 'cape', 'face', 'hairFx', 'title', 'trail'];
for (let i = 0; i < 6; i++) {
  let state = bare;
  layers.forEach((layer) => {
    const options = COSMETICS.filter((c) => c.layer === layer);
    state = wear(state, options[i % options.length].id);
  });
  loadouts.push(state, { ...loadouts[2], worn: state.worn });
}
const coveredGear = new Set(loadouts.reduce((ids, state) => ids.concat(Object.values(state.equipped)), []));
const coveredCosmetics = new Set(loadouts.reduce((ids, state) => ids.concat(Object.values(state.worn)), []));
ITEMS.forEach((i) => assert.ok(coveredGear.has(i.id), `Missing gear coverage: ${i.id}`));
COSMETICS.forEach((c) => assert.ok(coveredCosmetics.has(c.id), `Missing cosmetic coverage: ${c.id}`));
const original = JSON.stringify({ ITEMS, COSMETICS, DEFAULT_LOOK });
let frames = 0;
for (const facing of ['down', 'right', 'up', 'left']) {
  for (const walk of [0, 0.5]) for (const attack of [0, 0.5]) for (const look of looks) {
    for (const state of loadouts) for (const blocking of [false, true]) {
      const ctx = context();
      assert.doesNotThrow(() => drawCharacter(ctx, 160, 280, 6, { look, facing, walk, attack, blocking,
        equipped: state.equipped, worn: state.worn, glow: true, bob: 0.25 }));
      assert.ok(ctx.calls.length >= 20, `Too little character art: ${ctx.calls.length}`);
      ctx.balanced(); frames++;
    }
  }
}
for (const entry of [...ITEMS, ...COSMETICS]) for (const silhouette of [false, true]) {
  const ctx = context();
  assert.doesNotThrow(() => drawIcon(ctx, 0, 0, 72, entry, { silhouette }));
  assert.ok(ctx.calls.length >= 3, `Missing icon: ${entry.id}`);
  if (silhouette) assert.equal(new Set(ctx.colors).size, 1);
  const byId = context(); drawIcon(byId, 0, 0, 72, entry.id, { silhouette });
  assert.deepEqual(byId.calls, ctx.calls); ctx.balanced();
}
function drawing(options) { const ctx = context(); drawCharacter(ctx, 0, 0, 1, { look: DEFAULT_LOOK, ...options }); return ctx.calls; }
function pixelAt(calls, x, y) {
  let color;
  calls.forEach(([c, left, top, w, h]) => {
    if (x >= left && x < left + w && y >= top && y < top + h) color = c;
  });
  return color;
}
const frontFace = drawing({});
for (const x of [-3, 1]) {
  assert.equal(pixelAt(frontFace, x, -29), '#5b3a1e', 'Default fringe leaves both irises visible');
  assert.equal(pixelAt(frontFace, x + 1, -29), '#fff5e7', 'Each eye has a visible white');
}
const farSword = drawing({ facing: 'right', equipped: { mainHand: 'start-blade' } });
assert.equal(pixelAt(farSword, -4, -23), '#b78249', 'Far sword remains partially visible beside the body');
// Draw order and exposed pixels must agree for opposite profile views.
const indexes = (calls, color) => calls.reduce((found, call, i) => call[0] === color ? found.concat(i) : found, []);
for (const facing of ['left', 'right']) for (const blocking of [false, true]) for (const walk of [0, 0.25]) {
  const calls = drawing({ facing, blocking, walk, equipped: { mainHand: 'start-blade', offHand: 'stop-sign-shield' } });
  const torso = calls.findIndex(([c, x, y, w, h]) => c === '#e8833a' && y === -24 && w === 4 && h === 12);
  assert.ok(torso >= 0, 'Torso rectangle exists');
  const shield = indexes(calls, '#d94d4d');
  const sword = indexes(calls, '#b78249');
  assert.ok(shield.length && sword.length, 'Both hand items have art');
  assert.ok(shield.every((i) => facing === 'right' ? i > torso : i < torso), `${facing}: shield must use left-hand depth`);
  assert.ok(sword.every((i) => facing === 'left' ? i > torso : i < torso), `${facing}: sword must use right-hand depth`);
  assert.notDeepEqual(drawing({ facing, walk: 0.25 }), drawing({ facing }), 'Profile limbs swing');
}
for (const facing of ['down', 'up']) {
  const calls = drawing({ facing, equipped: { mainHand: 'start-blade', offHand: 'stop-sign-shield' } });
  const sword = calls.find(([c]) => c === '#b78249');
  const shield = calls.find(([c]) => c === '#d94d4d');
  assert.ok(facing === 'down' ? sword[1] < shield[1] : sword[1] > shield[1], 'Hands swap screen sides on back view');
  const torso = calls.findIndex(([c, x, y, w, h]) => c === '#e8833a' && y === -24 && w === 8 && h === 12);
  for (const c of ['#b78249', '#d94d4d']) assert.ok(indexes(calls, c).every((i) => facing === 'up' ? i < torso : i > torso));
}
// Every skin tone keeps its chin clear; the only dark skin on the head is its side edge.
for (const skin of LOOK_OPTIONS.skin) for (const facing of ['down', 'left', 'right']) {
  const calls = drawing({ facing, look: { ...DEFAULT_LOOK, skin: skin.id, hairStyle: 'none' } });
  const dark = '#' + skin.hex.slice(1).match(/../g).map((v) => Math.round(parseInt(v, 16) * 0.68).toString(16).padStart(2, '0')).join('');
  const headShading = calls.filter(([c, x, y]) => c === dark && y < -24);
  assert.equal(headShading.length, 1);
  assert.equal(headShading[0][3], 1, 'Only a one-unit side edge, never a chin band');
  assert.equal(calls.filter(([c]) => c === '#fff5e7').length, facing === 'down' ? 2 : 1, 'Front has two eyes, profile one');
  const smile = '#' + skin.hex.slice(1).match(/../g).map((v) => Math.round(parseInt(v, 16) * 0.85).toString(16).padStart(2, '0')).join('');
  const mouth = calls.filter(([c]) => c === smile);
  assert.equal(mouth.length, facing === 'down' ? 3 : 2, 'Small smile plus upturned corners');
  assert.ok(mouth.some(([, , y, w, h]) => y === -26 && w === 2 && h === 1));
}
for (const facing of ['down', 'up', 'left', 'right']) {
  for (const slot of ['head', 'feet', 'mainHand', 'offHand', 'back', 'magic1', 'magic2']) {
    assert.deepEqual(drawing({ facing, equipped: { [slot]: 'future-item' } }), drawing({ facing }), `${slot}: unknown item draws nothing`);
  }
}
for (const id of ['future-item', 'toString', '__proto__']) {
  const ctx = context();
  drawIcon(ctx, 0, 0, 72, { id });
  assert.equal(ctx.calls.length, 0, 'Unknown icons draw nothing');
  ctx.balanced();
}
const hairstyles = LOOK_OPTIONS.hairStyle.map((option) => JSON.stringify(drawing({ look: { ...DEFAULT_LOOK, hairStyle: option.id } })));
assert.equal(new Set(hairstyles).size, LOOK_OPTIONS.hairStyle.length, 'Hair silhouettes must differ');
assert.notDeepEqual(drawing({ facing: 'up' }), drawing({ facing: 'down' }));
assert.notDeepEqual(drawing({ walk: 0.25 }), drawing({ walk: 0 }));
assert.notDeepEqual(drawing({ attack: 0.5 }), drawing({ attack: 0 }));
assert.deepEqual(drawing({ worn: { trail: 'trail-leaf', title: 'title-champion' } }), drawing({}), 'Titles and trails are not body art');
assert.deepEqual(drawing({ equipped: { head: 'scam-spotter-helmet' }, worn: { hat: 'wizard-hat' } }), drawing({ equipped: { head: 'scam-spotter-helmet' } }), 'Helmet hides hat');
assert.equal(JSON.stringify({ ITEMS, COSMETICS, DEFAULT_LOOK }), original, 'Frozen catalog remains unchanged');
console.log(`CQ sprite: ${frames} character frames + ${2 * (ITEMS.length + COSMETICS.length)} icons passed; colors, finite rectangles, legal loadouts, hair, movement and layer rules verified.`);
