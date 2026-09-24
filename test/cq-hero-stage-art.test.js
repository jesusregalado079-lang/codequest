import assert from 'node:assert/strict';
import { drawHeroStage, drawHeroStageStone, makeHeroStageLayer } from '../src/cq/hero-stage.js';

function capture(width = 320, height = 320, options = {}) {
  const calls = [];
  const ctx = {
    fillStyle: '',
    fillRect(x, y, w, h) { calls.push([this.fillStyle, x, y, w, h]); },
  };
  drawHeroStage(ctx, { width, height, ...options });
  return calls;
}

const base = { time: 1.3, reduced: false, glow: false, bob: 0.19, facing: 'down' };
assert.deepEqual(capture(320, 320, base), capture(320, 320, base), 'same inputs produce identical art');
assert.deepEqual(capture(320, 320, { ...base, facing: 'left' }), capture(320, 320, base), 'the room does not rotate');

const times = [0, 0.7, 1.4, 2.1, 3.3];
const moving = times.map((time) => JSON.stringify(capture(320, 320, { ...base, time, bob: time / 3.2 })));
assert.ok(new Set(moving).size >= 4, 'torches, dust, and pedestal change over time');
const still = times.map((time) => capture(320, 320, { ...base, time, bob: time / 3.2, reduced: true }));
still.forEach((frame) => assert.deepEqual(frame, still[0], 'reduced motion freezes every ambient element'));

const unlit = capture(320, 320, base);
const lit = capture(320, 320, { ...base, glow: true });
assert.notDeepEqual(lit, unlit, 'completed gear set lights the pedestal');
assert.ok(lit.length > unlit.length, 'set bonus adds carved runes');

for (const [width, height] of [[320, 320], [340, 340], [640, 640]]) {
  for (const frame of [capture(width, height, base), capture(width, height, { ...base, glow: true })]) {
    assert.ok(frame.length < 260, `stage stays below 260 fillRect calls (${frame.length} at ${width}px)`);
    frame.forEach(([color, x, y, w, h]) => {
      assert.ok(w > 0 && h > 0 && x >= 0 && y >= 0 && x + w <= width && y + h <= height,
        `${color} ${[x, y, w, h]} stays inside ${width}x${height}`);
    });
  }
}

// The middle of the alcove is reserved for the sprite. Broad wall and arch fills
// may cross it, but there are no small decorative pixels over its torso or face.
const archIndex = unlit.findIndex(([color]) => color === '#152f40');
const decorationInHero = unlit.slice(archIndex + 1).filter(([, x, y, w, h]) =>
  w <= 40 && h <= 40 && x < 211 && x + w > 109 && y < 251 && y + h > 54);
assert.equal(decorationInHero.length, 0, 'small props and motes stay clear of the hero');

let stonePaints = 0;
const stone = { width: 320, height: 320, getContext() { return { set fillStyle(value) { void value; }, fillRect() { stonePaints += 1; } }; } };
const layer = makeHeroStageLayer({ width: 320, height: 320, makeCanvas: () => stone });
assert.equal(layer, stone);
assert.ok(stonePaints > 100, 'stone cache is painted once');
let copies = 0, dynamicPaints = 0;
drawHeroStage({ drawImage() { copies += 1; }, set fillStyle(value) { void value; }, fillRect() { dynamicPaints += 1; } },
  { width: 320, height: 320, ...base, stoneLayer: layer });
assert.equal(copies, 1, 'cached stone is copied once per stage update');
assert.ok(dynamicPaints < 45, `ambient update uses ${dynamicPaints} rectangles`);
assert.ok(stonePaints + dynamicPaints === unlit.length, 'cache and direct rendering draw the same number of rectangles');

const directStone = [];
drawHeroStageStone({ set fillStyle(value) { void value; }, fillRect(...args) { directStone.push(args); } }, { width: 320, height: 320 });
assert.equal(directStone.length, stonePaints);
console.log('cq hero stage art tests passed');
