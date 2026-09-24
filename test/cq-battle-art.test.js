// P9 "living arena": the ambient background, the creature idle/hit motion, the hero's idle breathing and
// run dust, and the pickup glints. Everything here is checked against a recording 2D context, the same
// pattern test/cq-battle-ui.test.js uses, so the renderer stays pure-canvas and deterministic.
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { getItem, normalizeCq } from '../src/cq/character.js';
import { getLesson } from '../src/cq/lessons/pack1.js';
import { ARENA } from '../src/cq/battle/content.js';
import { createBattle, ENEMY_FLASH, spawnEnemy } from '../src/cq/battle/engine.js';
import { FIREFLY_COLORS, renderBattle, WALK_DECOR_COLORS, WALL_DECOR_COLORS } from '../src/cq/battle/render.js';
import { fitView } from '../src/cq/battle/view.js';

function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gearCq(track, ids = []) {
  const equipped = {};
  let magic = 1;
  ids.forEach((id) => {
    const item = getItem(id);
    if (item.slot === 'magic') { equipped[`magic${magic}`] = id; magic += 1; } else equipped[item.slot] = id;
  });
  return normalizeCq({ track, owned: ids, equipped });
}
function capture() {
  const calls = [];
  const ctx = {
    _fill: '#000000', imageSmoothingEnabled: true, globalAlpha: 1,
    get fillStyle() { return this._fill; }, set fillStyle(v) { this._fill = v; },
    fillRect(x, y, w, h) { calls.push([this._fill, x, y, w, h]); },
    clearRect() {}, save() {}, restore() {},
  };
  return { ctx, calls };
}
// A quiet arena: no enemies, no swing, no invulnerability blink, nothing transient.
function scene({ css = 960, reducedMotion = false, gear = ['start-blade'] } = {}) {
  const cq = gearCq('guided', gear);
  const s = createBattle({ cq, lesson: getLesson('g1'), rng: seeded(3) });
  s.enemies.length = 0;
  s.time = 20;
  const hero = s.hero;
  hero.x = 10; hero.y = 6; hero.facing = 'right';
  hero.moving = false; hero.blocking = false;
  hero.invulnUntil = 0; hero.attackUntil = 0; hero.attackStartedAt = -1; hero.swing = null;
  hero.history = [{ t: 20, x: 10, y: 6, hearts: hero.hearts }];
  const view = { ...fitView(css, 1), look: cq.look, equipped: cq.equipped, worn: cq.worn, glow: false, reducedMotion, particles: [] };
  return { s, view };
}
function frame(s, view, now = 0) {
  const c = capture();
  renderBattle(c.ctx, s, view, now);
  return c.calls;
}
const geometry = (calls) => calls.map((c) => c.slice(1));

// ---------- determinism ----------
{
  const { s, view } = scene();
  spawnEnemy(s, 'slime', 8, 5, []);
  spawnEnemy(s, 'goblin', 12, 7, []);
  s.pickups = [{ id: 7, type: 'heart', x: 11, y: 9, until: 999 }];
  const a = frame(s, view, 1234.5);
  const b = frame(s, view, 1234.5);
  assert.deepEqual(a, b, 'the same state, view and now always draw the same rects');
  assert.ok(a.length > 800, `a real frame draws a real arena (${a.length} rects)`);
  const src = readFileSync(new URL('../src/cq/battle/render.js', import.meta.url), 'utf8');
  assert.ok(!/Math\.random|Date\.now|new Date/.test(src), 'render.js never reaches for a clock or a random number');
}

// ---------- reduced motion freezes every new motion; normal motion really moves ----------
// Times are spread over four seconds so slow cycles (sway, torch flicker, firefly drift, breathing,
// chest glint, pickup twinkle, slime squash) all get a chance to advance.
const TIMES = [20, 20.4, 21.3, 22.7, 23.9];
function ambientScene(reducedMotion) {
  const { s, view } = scene({ reducedMotion });
  const a = spawnEnemy(s, 'slime', 8, 5, []);
  const b = spawnEnemy(s, 'slime', 13.5, 4, []);
  const g = spawnEnemy(s, 'goblin', 11, 7.5, []);
  b.state = 'pause';
  g.dirX = -1;
  [a, b, g].forEach((e) => { e.flashUntil = 0; e.stunUntil = 0; });
  s.pickups = [{ id: 7, type: 'heart', x: 15, y: 9, until: 999 }];
  return { s, view };
}
{
  const { s, view } = ambientScene(true);
  const frames = TIMES.map((t) => { s.time = t; return JSON.stringify(frame(s, view, t * 1000)); });
  frames.forEach((f, i) => assert.equal(f, frames[0], `reduced motion: t=${TIMES[i]} draws exactly the frame from t=${TIMES[0]}`));
}
{
  const { s, view } = ambientScene(false);
  const frames = TIMES.map((t) => { s.time = t; return JSON.stringify(frame(s, view, t * 1000)); });
  const distinct = new Set(frames).size;
  assert.ok(distinct >= 4, `normal motion: the scene actually moves over four seconds (${distinct}/${TIMES.length} distinct frames)`);
}
{
  // The background on its own has to move too: empty arena, hero blinked out by the invulnerability
  // flicker, so the only thing left that can change is the ambient life (sway, torches, fireflies, chest).
  const { s, view } = scene();
  const frames = TIMES.map((t) => {
    s.time = t;
    s.hero.invulnUntil = t + 0.15;
    return JSON.stringify(frame(s, view, t * 1000));
  });
  const distinct = new Set(frames).size;
  assert.ok(distinct >= 4, `the arena background itself is alive (${distinct}/${TIMES.length} distinct frames)`);
  const still = scene({ reducedMotion: true });
  const stillFrames = TIMES.map((t) => {
    still.s.time = t;
    still.s.hero.invulnUntil = t + 0.15;
    return JSON.stringify(frame(still.s, still.view, t * 1000));
  });
  stillFrames.forEach((f, i) => assert.equal(f, stillFrames[0], `reduced motion: the background holds still at t=${TIMES[i]}`));
}

// ---------- decoration stays on the right kind of tile ----------
{
  const walk = new Set(WALK_DECOR_COLORS);
  const wall = new Set(WALL_DECOR_COLORS);
  const fly = new Set(FIREFLY_COLORS);
  assert.ok(walk.size >= 10 && wall.size >= 6 && fly.size === 2, 'the decoration palettes are populated');
  WALK_DECOR_COLORS.concat(FIREFLY_COLORS).forEach((c) => assert.equal(wall.has(c), false, `${c} belongs to exactly one pass`));
  FIREFLY_COLORS.forEach((c) => assert.equal(walk.has(c), false, `${c} is only a firefly`));
  const { s, view } = scene();
  const T = view.tile;
  assert.equal(view.offsetX, 0);
  assert.equal(view.offsetY, 0);
  assert.equal(T, 48);
  const solidAt = (tx, ty) => {
    const row = ARENA.grid[ty];
    assert.ok(row && row[tx] !== undefined, `decoration is inside the arena grid (tile ${tx},${ty})`);
    return row[tx] === 1;
  };
  let onGrass = 0;
  let onStone = 0;
  let flies = 0;
  [20, 21.6, 23.1].forEach((t) => {
    s.time = t;
    frame(s, view, t * 1000).forEach(([color, x, y, w, h]) => {
      if (fly.has(color)) {
        // A firefly may straddle two tiles, but every tile it touches must be grass.
        for (let ty = Math.floor((y + 1) / T); ty <= Math.floor((y + h - 1) / T); ty += 1) {
          for (let tx = Math.floor((x + 1) / T); tx <= Math.floor((x + w - 1) / T); tx += 1) {
            assert.equal(solidAt(tx, ty), false, `a firefly never touches solid tile ${tx},${ty}`);
          }
        }
        flies += 1;
        return;
      }
      const solid = wall.has(color);
      if (!solid && !walk.has(color)) return;
      const tx = Math.floor(x / T);
      const ty = Math.floor(y / T);
      assert.equal(solidAt(tx, ty), solid, `${color} at tile ${tx},${ty} decorates the right kind of tile`);
      // Tile decoration also stays inside its own tile, so a tile never half-reads as the other kind.
      assert.ok(x >= tx * T - 1 && y >= ty * T - 1 && x + w <= (tx + 1) * T + 1 && y + h <= (ty + 1) * T + 1,
        `${color} rect ${[x, y, w, h]} stays inside tile ${tx},${ty}`);
      if (solid) onStone += 1; else onGrass += 1;
    });
  });
  assert.ok(onGrass > 150, `the grass really is decorated (${onGrass} rects over three frames)`);
  assert.ok(onStone > 100, `the walls really are decorated (${onStone} rects over three frames)`);
  assert.ok(flies > 5, `fireflies really are out there (${flies} rects over three frames)`);
}

// ---------- hit reaction is more than the white flash ----------
// The flash replaces every sprite color with white, so compare GEOMETRY only: on HEAD the hit frame and
// the calm frame drew the identical rectangles. The impact burst is appended after the whole frame, so
// slicing the hit frame to the calm frame's length keeps the comparison on the creatures themselves.
['slime', 'goblin'].forEach((type) => {
  const { s, view } = scene();
  const e = spawnEnemy(s, type, 12, 6, []);
  e.dirX = -1;
  const calm = frame(s, view, 0);
  e.flashUntil = s.time + ENEMY_FLASH * 0.6;
  const hit = frame(s, view, 0);
  assert.ok(hit.length >= calm.length, `${type}: the hit frame also carries the impact burst`);
  assert.notDeepEqual(geometry(hit.slice(0, calm.length)), geometry(calm),
    `${type}: a hit moves the sprite, not just its color`);
  assert.ok(hit.filter(([c]) => c === '#ffffff').length > 5, `${type}: the white flash still happens`);
});

// ---------- hero: idle breathing and run dust are new motion ----------
// Pull the hero's own rects out of the frame by rendering the same frame with him blinked out (the
// invulnerability blink), the way test/cq-battle-ui.test.js isolates the slash block.
function heroRects(s, view) {
  const full = frame(s, view, 0);
  const saved = s.hero.invulnUntil;
  s.hero.invulnUntil = s.time + 0.15; // odd 0.1 s bucket: heroBlinkedOut() is true, so only his shadow draws
  const without = frame(s, view, 0);
  s.hero.invulnUntil = saved;
  const n = full.length - without.length;
  assert.ok(n > 0, 'the hero draws something');
  let i = 0;
  while (i < without.length && JSON.stringify(full[i]) === JSON.stringify(without[i])) i += 1;
  assert.deepEqual(full.slice(i + n), without.slice(i), 'the hero is one contiguous block of draw calls');
  return full.slice(i, i + n);
}
{
  // (time * 2.5) % 1 === 0 at both of these, so the pre-existing walk cycle contributes a swing of 0 —
  // anything that differs here is the new idle motion, not the old walk.
  assert.equal((20 * 2.5) % 1, 0);
  assert.equal((21.2 * 2.5) % 1, 0);
  const { s, view } = scene();
  const idleA = heroRects(s, view);
  s.time = 21.2;
  const idleB = heroRects(s, view);
  assert.notDeepEqual(idleB, idleA, 'standing still, the hero breathes: his rects change over time');

  s.time = 20;
  s.hero.moving = true;
  s.hero.history = [];
  for (let i = 0; i < 20; i += 1) s.hero.history.push({ t: 20 - (20 - i) * 0.05, x: 10 - (20 - i) * 0.06, y: 6, hearts: 3 });
  const moving = heroRects(s, view);
  assert.notDeepEqual(moving, idleA, 'moving at the same time draws differently from standing still');
  assert.ok(moving.length > idleA.length, 'moving adds dust rects behind him');

  const { s: rm, view: rmView } = scene({ reducedMotion: true });
  const stillA = heroRects(rm, rmView);
  rm.time = 21.2;
  const stillB = heroRects(rm, rmView);
  assert.deepEqual(stillB, stillA, 'reduced motion: the hero holds one pose');
}

// ---------- pickups keep their glints, small and deterministic ----------
{
  const { s, view } = scene();
  s.pickups = [{ id: 7, type: 'heart', x: 11, y: 9, until: 999 }];
  const bare = scene();
  const counts = [20, 20.3, 20.7, 21.1, 21.6].map((t) => {
    s.time = t; bare.s.time = t;
    return frame(s, view, 0).length - frame(bare.s, bare.view, 0).length;
  });
  assert.ok(Math.max(...counts) > Math.min(...counts), 'the heart glints twinkle in and out over time');
  assert.ok(Math.max(...counts) <= 12, `the heart stays a heart, not a firework (${Math.max(...counts)} rects)`);
}

console.log('ok — P9 living arena: deterministic draws, reduced-motion stillness, tile-safe decoration, hit reactions, hero idle breathing and run dust');
