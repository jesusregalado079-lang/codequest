import assert from 'node:assert';
import { normalizeCq } from '../src/cq/character.js';
import { getLesson } from '../src/cq/lessons/pack1.js';
import { createBattle, spawnEnemy, ENEMY_FLASH } from '../src/cq/battle/engine.js';
import { recordBattleEffects } from '../src/cq/battle/battle-ui.js';
import { FX_LIFE, MAX_FX, SHAKE_LIFE, renderBattle, shakeOffset } from '../src/cq/battle/render.js';
import { fitView } from '../src/cq/battle/view.js';

function scene(reducedMotion = false) {
  const cq = normalizeCq({ track: 'guided' });
  const state = createBattle({ cq, lesson: getLesson('g1'), rng: () => 0.7 });
  state.time = 20;
  state.enemies.length = 0;
  state.puffs.length = 0;
  state.pickups.length = 0;
  state.hero.x = 8;
  state.hero.y = 6;
  state.hero.invulnUntil = 0;
  const view = { ...fitView(960, 1), look: cq.look, equipped: cq.equipped, worn: cq.worn,
    reducedMotion, glow: false, particles: [], effects: [], shake: null, nextShakeAt: 0 };
  return { state, view };
}
function capture(state, view) {
  const calls = [];
  const ctx = { fillStyle: '', imageSmoothingEnabled: false, x: 0, y: 0, stack: [],
    fillRect(x, y, w, h) { calls.push([this.fillStyle, x + this.x, y + this.y, w, h]); },
    save() { this.stack.push([this.x, this.y]); },
    restore() { [this.x, this.y] = this.stack.pop(); },
    translate(x, y) { this.x += x; this.y += y; } };
  renderBattle(ctx, state, view, 0);
  return calls;
}
const colors = {
  hit: '#ffe17b', poof: '#8ae3d5', hurt: '#df5e69', block: '#8cdded',
  pickup: '#ffb6bd', drop: '#ffb6bd',
};

// Every transient comes from its event, draws the same pixels twice, and ends on its lifetime boundary.
for (const type of Object.keys(FX_LIFE).filter((name) => name !== 'swing')) {
  const { state, view } = scene();
  const event = { type, id: 42, x: 10, y: 6, enemy: 'slime', source: 'melee' };
  assert.equal(capture(state, view).some(([c]) => c === colors[type]), false, `${type}: absent before event`);
  recordBattleEffects(view, [event], state.time, state.hero);
  state.time += type === 'block' ? 0.1 : 0.03;
  const one = capture(state, view);
  assert.ok(one.some(([c]) => c === colors[type]), `${type}: visible after event`);
  assert.deepEqual(capture(state, view), one, `${type}: deterministic frame`);
  state.time = 20 + FX_LIFE[type];
  assert.equal(capture(state, view).some(([c]) => c === colors[type]), false, `${type}: gone at life boundary`);
}

{
  const { state, view } = scene();
  state.hero.attackStartedAt = 20;
  state.hero.attackUntil = 20.3;
  state.hero.swing = { reach: 1.5, arc: 100, hit: [] };
  const without = capture(state, view);
  recordBattleEffects(view, [{ type: 'swing', x: state.hero.x, y: state.hero.y, facing: 'right' }], 20, state.hero);
  assert.equal(capture(state, view).length, without.length + 2, 'swing event adds its two-rect start bead');
  state.time += FX_LIFE.swing;
  const expired = capture(state, view);
  const saved = view.effects;
  view.effects = [];
  assert.deepEqual(expired, capture(state, view), 'start bead ends with its event');
  view.effects = saved;
}

// Enemy types have distinct debris, and the larger kill gets a crown glint.
for (const [enemy, color] of [['goblin', '#a7773b'], ['mega-slime', '#fff9dc']]) {
  const { state, view } = scene();
  recordBattleEffects(view, [{ type: 'poof', id: 52, enemy, x: 10, y: 6 }], 20, state.hero);
  assert.ok(capture(state, view).some(([c]) => c === color), `${enemy} palette appears`);
}
{
  const { state, view } = scene();
  const slime = spawnEnemy(state, 'slime', 10, 6, []);
  slime.flashUntil = state.time + ENEMY_FLASH;
  const oldStar = capture(state, view);
  recordBattleEffects(view, [{ type: 'hit', id: slime.id, x: slime.x, y: slime.y, source: 'bolt' }], state.time, state.hero);
  const bolt = capture(state, view);
  assert.ok(bolt.some(([c]) => c === '#b8f7ff'), 'bolt adds cyan smear');
  assert.ok(bolt.some(([c]) => c === '#c6f7ff'), 'bolt sends cyan sparks');
  assert.ok(bolt.length > oldStar.length, 'hit adds detail to existing impact star');
}
{
  const { state, view } = scene();
  recordBattleEffects(view, Array.from({ length: 100 }, (_, id) => ({ type: 'poof', id, enemy: 'slime', x: 10, y: 6 })), 20, state.hero);
  assert.equal(view.effects.length, MAX_FX, 'effect queue is capped');
  assert.ok(capture(state, view).length < 1500, 'even a saturated frame stays bounded');
  state.time = 21;
  recordBattleEffects(view, [], state.time, state.hero);
  assert.equal(view.effects.length, 0, 'expired records are pruned');
}
{
  const { state, view } = scene();
  recordBattleEffects(view, [{ type: 'hurt', id: 1, x: 8, y: 6 }], 20, state.hero);
  const first = shakeOffset(view, 20);
  assert.ok(Math.abs(first.x) <= 2 * Math.round(view.tile / 16), 'hurt nudge has tiny amplitude');
  assert.ok(Math.abs(shakeOffset(view, 20.09).x) < Math.abs(first.x), 'shake decays');
  assert.deepEqual(shakeOffset(view, 20 + SHAKE_LIFE), { x: 0, y: 0 }, 'shake ends exactly at life boundary');
  const firstBorn = view.shake.born;
  recordBattleEffects(view, [{ type: 'poof', id: 2, enemy: 'mega-slime', x: 10, y: 6 }], 20.1, state.hero);
  assert.equal(view.shake.born, firstBorn, 'shakes within 250 ms never stack');
  recordBattleEffects(view, [{ type: 'poof', id: 3, enemy: 'mega-slime', x: 10, y: 6 }], 20.3, state.hero);
  assert.equal(view.shake.strength, 3, 'later mega kill gets its larger nudge');
  assert.ok(Math.abs(shakeOffset(view, 20.3).x) <= 3 * Math.round(view.tile / 16));
}
{
  const { state, view } = scene();
  const unit = Math.round(view.tile / 16);
  state.hero.invulnUntil = 21;
  recordBattleEffects(view, [{ type: 'hurt', id: 11, x: 8, y: 6 }], 20, state.hero);
  for (const age of [0, 0.033, 0.067, 0.1, 0.167, 0.233]) {
    state.time = 20 + age;
    const calls = capture(state, view);
    const whiteHero = calls.filter(([color, x, y]) => color === '#ffffff' &&
      Math.abs(x - (view.offsetX + 8 * view.tile)) < view.tile &&
      Math.abs(y - (view.offsetY + 6 * view.tile)) < view.tile * 2);
    const shirt = calls.filter(([color]) => color === '#e8833a');
    assert.ok(age < 0.05 ? whiteHero.length > 12 : shirt.length > 0,
      `hurt hero stays visible at ${age}s`);
    if (age >= 0.05 && age < 0.12) assert.ok(calls.filter(([color]) => color === '#df5e69').length > 20,
      'red rim hugs the visible sprite after the white frame');
  }
  state.time = 20.1;
  const redChips = capture(state, view).filter(([color, , , w, h]) => color === '#df5e69' && w >= unit * 2 && h >= unit * 2);
  assert.ok(redChips.length >= 4, 'hurt throws at least four chunky red chips');
}
{
  const { state, view } = scene();
  const unit = Math.round(view.tile / 16);
  state.hero.facing = 'right';
  recordBattleEffects(view, [{ type: 'block', id: 8, x: 8, y: 6 }], 20, state.hero);
  state.time = 20.08;
  const ring = capture(state, view).filter(([color, , , w, h]) =>
    (color === '#8cdded' || color === '#e8ffff') && w >= unit * 3 && h >= unit * 3);
  assert.equal(ring.length, 8, 'block has eight three-unit cyan-white ring marks');
  assert.ok(ring.filter(([, x]) => x < view.offsetX + 8 * view.tile).length >= 5,
    'block ring sits on the shield side');
  assert.equal(capture(state, view).filter(([color, , , w, h]) => color === '#baf4f8' && w >= unit * 2 && h >= unit * 2).length,
    2, 'block has two bright two-unit sparks');
}
{
  const { state, view } = scene();
  const unit = Math.round(view.tile / 16);
  recordBattleEffects(view, [{ type: 'pickup', id: 5 }], 20, state.hero);
  state.time = 20.04;
  const first = capture(state, view).filter(([color, , , w, h]) => color === '#ffb6bd' && w >= unit * 2 && h >= unit * 2);
  state.time = 20.25;
  const later = capture(state, view).filter(([color, , , w, h]) => color === '#ffb6bd' && w >= unit * 2 && h >= unit * 2);
  assert.equal(first.length, 3, 'collect burst has three pink and three white two-unit diamonds');
  assert.equal(later.length, 3, 'collect diamonds remain visible late in the burst');
  assert.ok(later.reduce((sum, [, , y]) => sum + y, 0) / later.length <
    first.reduce((sum, [, , y]) => sum + y, 0) / first.length, 'collect diamonds rise');
}
{
  const { state, view } = scene();
  const unit = Math.round(view.tile / 16);
  state.pickups.push({ id: 5, type: 'heart', x: 10, y: 6, until: 30 });
  const lengths = [];
  for (let step = 0; step <= 20; step += 1) {
    state.time = 20 + step / 20;
    const glints = capture(state, view).filter(([color]) => color === '#fffbe0');
    assert.equal(glints.length, 2, 'heart has one cross with two bright arms');
    lengths.push(glints[0][3]);
  }
  assert.ok(Math.max(...lengths) - Math.min(...lengths) >= unit, 'heart cross grows visibly over one second');
  state.time = 21;
  const repeated = capture(state, view).filter(([color]) => color === '#fffbe0');
  assert.equal(repeated[0][3], lengths[0], 'heart twinkle repeats once a second');
}
{
  const { state, view } = scene(true);
  const before = capture(state, view);
  recordBattleEffects(view, [
    { type: 'hurt', id: 1, x: 8, y: 6 },
    { type: 'poof', id: 2, enemy: 'mega-slime', x: 10, y: 6 },
    { type: 'pickup', id: 3 },
  ], 20, state.hero);
  assert.deepEqual(shakeOffset(view, 20), { x: 0, y: 0 }, 'reduced motion has no shake');
  assert.deepEqual(capture(state, view), before, 'reduced motion has no new chips or flashes');
  const e = spawnEnemy(state, 'slime', 10, 6, []);
  e.flashUntil = state.time + ENEMY_FLASH;
  assert.ok(capture(state, view).length > before.length, 'existing static impact remains');
}
{
  const { state, view } = scene();
  recordBattleEffects(view, [
    { type: 'poof', id: 6, enemy: 'slime', x: 1.2, y: 1.2 },
    { type: 'poof', id: 7, enemy: 'slime', x: 18.8, y: 10.8 },
  ], 20, state.hero);
  state.time = 20.2;
  const chipColors = new Set(['#8ae3d5', '#4caeab', '#b6f1dc']);
  let checked = 0;
  for (const [color, x, y, w, h] of capture(state, view)) {
    if (!chipColors.has(color)) continue;
    assert.ok(x >= 0 && y >= 0 && x + w <= view.widthPx && y + h <= view.heightPx,
      'edge kill chips stay fully inside the canvas');
    checked += 1;
  }
  assert.ok(checked >= 10, 'the bounds test inspected real chips');
}
{
  const { state, view } = scene();
  state.hero.x = 1.2; state.hero.y = 1.2;
  recordBattleEffects(view, [
    { type: 'hurt', id: 1, x: 1.2, y: 1.2 },
    { type: 'block', id: 2, x: 1.2, y: 1.2 },
    { type: 'pickup', id: 3 },
    { type: 'drop', id: 4, x: 1.2, y: 1.2 },
  ], 20, state.hero);
  const effectColors = new Set(['#df5e69', '#fff2ec', '#8cdded', '#e8ffff', '#baf4f8', '#ffb6bd', '#fff6da']);
  let checked = 0;
  for (const [color, x, y, w, h] of capture(state, view)) {
    if (!effectColors.has(color)) continue;
    assert.ok(x >= 0 && y >= 0 && x + w <= view.widthPx && y + h <= view.heightPx,
      'new hurt, block, and heart pixels stay inside the canvas, including shake');
    checked += 1;
  }
  assert.ok(checked >= 15, 'bounds check inspects real new effect pixels');
}
console.log('ok — P21 hit effects: event lifetime, palettes, deterministic frames, caps, reduced motion, bounded shake and paints');
