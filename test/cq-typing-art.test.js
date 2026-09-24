// P19: the run scene is deterministic, quiet under reduced motion, and bounded.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { animating, HOP_MS, PUFF_MS, renderRun, STUMBLE_MS } from '../src/cq/typing/render.js';

const items = ['asdf', 'jkl;', 'asdf', 'jkl;', 'asdf', 'jkl;', 'asdf', 'jkl;', 'asdf', 'jkl;', 'asdf', 'jkl;'];
const total = items.join(' ').length;
function scene(widthPx = 960, extra = {}) {
  return { widthPx, heightPx: 240, items, index: 0, reducedMotion: false, hop: null, stumble: null, smashes: {}, ...extra };
}
function frame(s, now) {
  const calls = [];
  const ctx = {
    _fill: '#000000', imageSmoothingEnabled: true,
    get fillStyle() { return this._fill; }, set fillStyle(v) { this._fill = v; },
    fillRect(x, y, w, h) { calls.push([this._fill, x, y, w, h]); },
    save() {}, restore() {},
  };
  renderRun(ctx, s, now);
  return calls;
}
const geometry = (calls, color) => calls.filter(([c]) => c === color).map((call) => call.slice(1));

{
  const s = scene(960, { index: 14, smashes: { 2: 1000 }, hop: { at: 1000, from: 13 / total } });
  assert.deepEqual(frame(s, 1080), frame(s, 1080), 'same scene and time draw identical rects');
  const src = readFileSync(new URL('../src/cq/typing/render.js', import.meta.url), 'utf8');
  assert.equal(/Math\.random|Date\.now|new Date|document\.|window\./.test(src), false, 'renderer owns no clock, randomness or DOM');
  assert.equal(/\.drawImage\(|\.fillText\(|\.stroke/.test(src), false, 'renderer stays fillRect-only');
}

{
  const s = scene(960, { index: 12 });
  const times = [0, 900, 1800, 2700, 3600];
  const frames = times.map((t) => JSON.stringify(frame(s, t)));
  assert.ok(new Set(frames).size >= 4, 'ambient stars, mist, flag and breathing change slowly');
  const idle = frame(s, 0);
  for (const color of ['#47798a', '#8ec4c5', '#e6f4d5']) {
    assert.ok(geometry(idle, color).length > 0, `star tone ${color} is visible`);
  }
  assert.equal(geometry(idle, '#f5cf77').length, 4, 'four staggered skyline windows glow');
  assert.ok(geometry(idle, '#ffe49a').length >= 3, 'several warm fireflies remain in the clear ground band');
  s.reducedMotion = true;
  const still = times.map((t) => frame(s, t));
  still.forEach((calls) => assert.deepEqual(calls, still[0], 'reduced motion holds one still frame'));
  s.smashes = { 2: 0 };
  s.index = 14;
  assert.deepEqual(frame(s, 0), frame(s, 300), 'a reduced-motion smash has no moving chips');
  assert.equal(animating(s, 10), false, 'reduced motion needs no animation loop');
}

{
  // Capture every paint, including the sprite's direct fillRect calls, at both supported widths.
  for (const width of [360, 960]) {
    for (const [index, now, effects] of [[0, 0, {}], [12, 1200, {}], [14, 1100, { smashes: { 2: 1000 } }],
      [total, 1100, { smashes: { 11: 1000 } }], [12, 1100, { stumble: { at: 1000 } }]]) {
      const calls = frame(scene(width, { index, ...effects }), now);
      assert.ok(calls.length > 100 && calls.length <= 350, `${width}px frame stays within the rect budget (${calls.length})`);
      calls.forEach(([color, x, y, w, h]) => {
        assert.ok(typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color), 'every paint has a color');
        assert.ok([x, y, w, h].every(Number.isFinite) && x >= 0 && y >= 0 && w > 0 && h > 0
          && x + w <= width && y + h <= 240, `paint stays in ${width}x240: ${[color, x, y, w, h]}`);
      });
    }
  }
}

{
  const s = scene(960, { index: 12 });
  const calm = frame(s, 1030);
  const shirt = '#e8833a';
  const skin = '#eebc98';
  const stone = '#737f87';
  for (const color of [shirt, skin, stone]) assert.ok(geometry(calm, color).length > 0, `${color} remains visible`);
  const renderSource = readFileSync(new URL('../src/cq/typing/render.js', import.meta.url), 'utf8');
  const environment = renderSource.slice(renderSource.indexOf('const SKY ='), renderSource.indexOf('let C ='));
  for (const color of [shirt, skin, '#2fc6b6', '#34c9a0']) {
    assert.equal(environment.includes(color), false, `${color} is reserved for sprites`);
  }
  s.stumble = { at: 1000 };
  const wrong = frame(s, 1030);
  assert.notDeepEqual(geometry(wrong, shirt), geometry(calm, shirt), 'wrong key shifts the hero');
  assert.deepEqual(geometry(wrong, stone), geometry(calm, stone), 'wrong key leaves the next block steady');
  assert.equal(animating(s, 1000 + STUMBLE_MS - 1), true);
  assert.equal(animating(s, 1000 + STUMBLE_MS), false);
}

{
  const s = scene(960, { index: 14, smashes: { 2: 1000 } });
  const impact = frame(s, 1100);
  const settled = frame(s, 1000 + PUFF_MS);
  assert.ok(impact.length >= settled.length + 10, 'smash adds chips, puff and sparkle for a short beat');
  const activeChipEdges = geometry(impact, '#4f5a61').length - geometry(settled, '#4f5a61').length;
  assert.equal(activeChipEdges, 8, 'smash sends eight chunky stone chips');
  assert.ok(geometry(impact, '#4f5a61').some(([, , w, h]) => w >= 8 && h >= 8), 'chips read at two sprite units or more');
  assert.ok(geometry(frame(s, 1119), '#fff8df').length > 0, 'gold-white burst lasts through 119ms');
  assert.equal(geometry(frame(s, 1120), '#fff8df').length, 0, 'burst ends at 120ms');
  assert.ok(geometry(frame(s, 1335), '#405b69').length >= 8, 'chips fade during the last third');
  assert.equal(animating(s, 1000 + PUFF_MS - 1), true);
  assert.equal(animating(s, 1000 + PUFF_MS), false);
  s.hop = { at: 2000, from: 13 / total };
  assert.equal(animating(s, 2000 + HOP_MS - 1), true);
  assert.equal(animating(s, 2000 + HOP_MS), false);
}

console.log('ok — P19 typing art: deterministic ambient, reduced-motion stillness, rect bounds and budget, sprite identity, stumble, smash');
