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
}
// The near arm itself swings in profile: with a tee there is nothing between the torso box and the head but that arm.
for (const facing of ['left', 'right']) {
  const tee = { ...DEFAULT_LOOK, shirtStyle: 'tee' };
  const nearArm = (walk) => {
    const calls = drawing({ facing, walk, look: tee });
    const torso = calls.findIndex(([c, x, y, w, h]) => c === '#e8833a' && y === -24 && w === 4 && h === 12);
    const head = calls.findIndex(([c, x, y, w, h], i) => i > torso && c === '#eebc98' && y === -32 && w === 8 && h === 8);
    assert.ok(torso >= 0 && head > torso + 3, `${facing}: torso box and head found`);
    return calls.slice(torso + 3, head);
  };
  const still = nearArm(0), swung = nearArm(0.25);
  assert.ok(still.length > 0 && swung.length > 0, `${facing}: near arm has rects`);
  assert.notDeepEqual(swung, still, `${facing}: profile near arm swings`);
}
for (const facing of ['down', 'up']) {
  const calls = drawing({ facing, equipped: { mainHand: 'start-blade', offHand: 'stop-sign-shield' } });
  const sword = calls.find(([c]) => c === '#b78249');
  const shield = calls.find(([c]) => c === '#d94d4d');
  assert.ok(facing === 'down' ? sword[1] < shield[1] : sword[1] > shield[1], 'Hands swap screen sides on back view');
  const torso = calls.findIndex(([c, x, y, w, h]) => c === '#e8833a' && y === -24 && w === 8 && h === 12);
  for (const c of ['#b78249', '#d94d4d']) assert.ok(indexes(calls, c).every((i) => facing === 'up' ? i < torso : i > torso));
}
// Face-down chin check: nothing on head rows 4-7 is darker than 0.8x the skin luminance, except the side-edge
// shade column and hair. Every hairstyle is included so hair rects are excluded by color, not by absence.
const luminance = (hex) => { const [r, g, b] = hex.slice(1).match(/../g).map((v) => parseInt(v, 16)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const shadeHex = (hex, factor) => '#' + hex.slice(1).match(/../g).map((v) => Math.round(parseInt(v, 16) * factor).toString(16).padStart(2, '0')).join('');
for (const skin of LOOK_OPTIONS.skin) for (const hairStyle of LOOK_OPTIONS.hairStyle) {
  const hair = LOOK_OPTIONS.hairColor.find((option) => option.id === DEFAULT_LOOK.hairColor).hex;
  const hairColors = [hair, shadeHex(hair, 0.68)];
  const calls = drawing({ facing: 'down', look: { ...DEFAULT_LOOK, skin: skin.id, hairStyle } });
  // Head grid: columns 4-11 → x -4..3, rows 4-7 → y -28..-25 (unit 1, feet at 0).
  const chin = calls.filter(([c, x, y, w, h]) => x < 4 && x + w > -4 && y < -24 && y + h > -28)
    .filter(([c, x, y, w]) => !(x === 3 && w === 1) && !hairColors.includes(c));
  assert.ok(chin.length > 0, 'Face rects exist on the chin rows');
  chin.forEach(([c, x, y, w, h]) => {
    assert.ok(luminance(c) >= 0.8 * luminance(skin.hex), `${skin.id}/${hairStyle}: dark chin rect ${c} at ${x},${y} ${w}x${h}`);
  });
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
// Sword chop (P8): one overhand strike toward the facing side, never a windmill under or behind the body.
// Blade centroid (area-weighted, both near and far shades) vs the body: unit 1, feet at 0, shoulders at y -24.
{
  const bladeColors = ['#b78249', '#e1b776', '#ce9957'];
  const blade = new Set(bladeColors.concat(bladeColors.map((c) => shadeHex(c, 0.68))));
  const centroid = (facing, attack) => {
    const calls = drawing({ facing, attack, equipped: { mainHand: 'start-blade', offHand: 'stop-sign-shield' } });
    let area = 0, sx = 0, sy = 0;
    calls.forEach(([c, x, y, w, h]) => { if (blade.has(c)) { area += w * h; sx += (x + w / 2) * w * h; sy += (y + h / 2) * w * h; } });
    assert.ok(area > 0, `${facing}@${attack}: blade is visible`);
    return { x: sx / area, y: sy / area };
  };
  // After the strike lands (and through the hold) the blade sits out on the facing side.
  const facingSide = {
    right: ({ x }) => x > 6, left: ({ x }) => x < -6,
    down: ({ y }) => y > -16, up: ({ y }) => y < -28,
  };
  for (const facing of ['right', 'left', 'down', 'up']) for (const attack of [0.3, 0.5, 0.75, 1]) {
    const c = centroid(facing, attack);
    assert.ok(facingSide[facing](c), `${facing}@${attack}: blade ends on the facing side, got ${c.x.toFixed(1)},${c.y.toFixed(1)}`);
  }
  // At no point in the swing does a profile blade drop below the shoulders behind the hero (the old windmill did).
  for (const facing of ['right', 'left']) for (let k = 1; k <= 20; k++) {
    const c = centroid(facing, k / 20);
    const behind = facing === 'right' ? c.x < -2 : c.x > 2;
    assert.ok(!(behind && c.y > -24), `${facing}@${k / 20}: blade never swings low behind the body`);
    assert.ok(c.y < -10, `${facing}@${k / 20}: blade never passes under the body`);
  }
  // Snap, not a sweep: by 40% of the swing the blade is (almost) at its end pose, while the wind-up is far away.
  for (const facing of ['right', 'left', 'down', 'up']) {
    const end = centroid(facing, 1), mid = centroid(facing, 0.4), wind = centroid(facing, 0.1);
    assert.ok(Math.hypot(mid.x - end.x, mid.y - end.y) < 2, `${facing}: most of the chop happens early`);
    assert.ok(Math.hypot(wind.x - end.x, wind.y - end.y) > 10, `${facing}: wind-up is a distinct raised pose`);
  }
  // Bare hands chop too: the arm still moves.
  const bareFist = drawing({ facing: 'right', attack: 1 });
  assert.notDeepEqual(bareFist, drawing({ facing: 'right' }), 'bare-hands arm moves on attack');
}
// attack: 0 (idle, walking, hub preview, Typing Dojo, creator) must stay byte-identical to the pre-chop art.
// Digests recorded from the previous sprite.js (FNV-1a over every draw call, see .foreman/scratch/p8/digest.mjs).
{
  const fnv = (str) => { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };
  const recorded = { down: 'de7f5e22', right: 'a5e8e0f8', up: 'bffc3db4', left: '88422922' };
  const sets = [loadouts[0].equipped, loadouts[1].equipped, loadouts[2].equipped];
  for (const facing of ['down', 'right', 'up', 'left']) {
    let all = '';
    for (const equipped of sets) for (const walk of [0, 0.25]) for (const blocking of [false, true]) {
      const ctx = context();
      drawCharacter(ctx, 40, 90, 3, { look: DEFAULT_LOOK, facing, walk, attack: 0, blocking, equipped, worn: { cape: 'cape-night' }, bob: 0.25 });
      all += JSON.stringify(ctx.calls);
    }
    assert.equal(fnv(all), recorded[facing], `${facing}: attack 0 art is unchanged`);
  }
}
console.log(`CQ sprite: ${frames} character frames + ${2 * (ITEMS.length + COSMETICS.length)} icons passed; colors, finite rectangles, legal loadouts, hair, movement and layer rules verified.`);
