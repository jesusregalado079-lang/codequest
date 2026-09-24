import assert from 'node:assert/strict';
import { normalizeCq } from '../src/cq/character.js';
import { getLesson } from '../src/cq/lessons/pack1.js';
import { createBattle, spawnEnemy } from '../src/cq/battle/engine.js';
import { recordBattleEffects } from '../src/cq/battle/battle-ui.js';
import { FX_LIFE, MAX_FX, renderBattle } from '../src/cq/battle/render.js';
import { fitView } from '../src/cq/battle/view.js';

function scene(width = 850, reducedMotion = false) {
  const cq = normalizeCq({ track: 'guided' });
  const state = createBattle({ cq, lesson: getLesson('g3'), rng: () => 0.7 });
  state.time = 20;
  state.enemies.length = 0;
  state.puffs.length = 0;
  state.pickups.length = 0;
  state.hero.x = 8;
  state.hero.y = 6;
  state.hero.invulnUntil = 0;
  const view = { ...fitView(width, 1), look: cq.look, equipped: cq.equipped, worn: cq.worn,
    reducedMotion, glow: false, particles: [], effects: [], shake: null, nextShakeAt: 0 };
  return { state, view };
}
function capture(state, view) {
  const calls = [];
  const ctx = { fillStyle: '', imageSmoothingEnabled: false,
    fillRect(x, y, w, h) { calls.push([this.fillStyle, x, y, w, h]); },
    save() {}, restore() {}, translate() {} };
  renderBattle(ctx, state, view, 0);
  return calls;
}
const has = (calls, color) => calls.some(([c]) => c === color);
const event = (id, targets = []) => ({ type: 'special', id, x: 8, y: 6, fromX: 8, fromY: 6,
  radius: id === 'folder-fort' ? 2.4 : 2.6, targets });
const spellColor = {
  'folder-fort': '#e9af4a', 'mass-rename': '#ad52c8cc', stop: '#d94e54', 'quick-save': '#345f63',
};

for (const width of [850, 360]) {
  for (const id of Object.keys(spellColor)) {
    const { state, view } = scene(width);
    const enemy = spawnEnemy(state, 'slime', 11, 6, []);
    const baseline = capture(state, view);
    assert.equal(has(baseline, spellColor[id]), false, `${id}: no cast art without event`);
    const targets = [{ id: enemy.id, type: 'slime', x: 11, y: 6, boss: false }];
    if (id === 'folder-fort') { state.hero.fortUntil = 23; state.hero.fortRadius = 2.4; }
    if (id === 'quick-save') state.hero.shieldUntil = 22;
    if (id === 'stop') enemy.frozenUntil = 23;
    const events = [event(id, targets)];
    if (id === 'mass-rename') events.push({ type: 'chicken', id: enemy.id, x: 11, y: 6 });
    recordBattleEffects(view, events, state.time, state.hero);
    for (const age of [0, 0.1, 0.25]) {
      state.time = 20 + age;
      const calls = capture(state, view);
      assert.ok(has(calls, spellColor[id]), `${id}: cast art at ${age}s, ${width}px`);
      assert.deepEqual(capture(state, view), calls, `${id}: deterministic frame`);
      assert.ok(has(calls, '#e8833a'), `${id}: hero visible`);
      assert.ok(has(calls, '#2fc6b6'), `${id}: monster visible`);
      assert.ok(calls.length - baseline.length <= 400, `${id}: bounded rectangle growth`);
    }
    state.time = 20 + FX_LIFE.special;
    const expired = capture(state, view);
    const saved = view.effects;
    view.effects = [];
    assert.deepEqual(expired, capture(state, view), `${id}: brief cast cue ends at 500ms`);
    view.effects = saved;
    assert.equal(enemy.type, 'slime', 'renderer does not mutate gameplay state');
  }
}

{
  const { state, view } = scene();
  state.hero.fortUntil = 23;
  state.hero.fortRadius = 2.4;
  const initial = capture(state, view);
  assert.ok(has(initial, '#e9af4a'), 'fort appears on its first frame from state alone');
  assert.ok(initial.filter(([c]) => c === '#e9af4a').length >= 10, 'ten solid folder faces ring the hero');
  view.effects = [];
  state.time = 22;
  assert.ok(has(capture(state, view), '#e9af4a'), 'fort survives effect queue expiry');
  state.time = 22.7;
  const firstFade = capture(state, view).filter(([c]) => c === '#e9af4a').length;
  state.time = 22.85;
  const laterFade = capture(state, view).filter(([c]) => c === '#e9af4a').length;
  assert.ok(laterFade < firstFade, 'folders disappear one by one');
  state.time = 23;
  assert.equal(has(capture(state, view), '#e9af4a'), false, 'fort ends with state timer');
}
{
  const { state, view } = scene();
  const chicken = spawnEnemy(state, 'slime', 11, 6, []);
  const boss = spawnEnemy(state, 'mega-slime', 13, 6, []);
  chicken.chickenUntil = 24;
  boss.stunUntil = 21;
  recordBattleEffects(view, [event('mass-rename', [
    { id: chicken.id, x: 11, y: 6, boss: false }, { id: boss.id, x: 13, y: 6, boss: true },
  ]), { type: 'chicken', id: chicken.id, x: 11, y: 6 }], state.time, state.hero);
  const calls = capture(state, view);
  assert.ok(has(calls, '#f7ebff'), 'converted target gets an empty name box');
  assert.ok(has(calls, '#8846b0'), 'name box has a block cursor');
  assert.ok(has(calls, '#ffe68b'), 'boss gets dizzy stars');
  assert.ok(has(calls, '#ffffff'), 'converted chicken remains visible');
  assert.equal(view.effects[0].converted.length, 1, 'per-monster chicken event identifies the converted target');
  state.time = 20.41;
  assert.equal(has(capture(state, view), '#f7ebff'), false, 'name box ends by 400ms');
}
{
  const { state, view } = scene();
  const regular = spawnEnemy(state, 'slime', 11, 6, []);
  const boss = spawnEnemy(state, 'mega-slime', 13, 6, []);
  regular.frozenUntil = 23;
  boss.frozenUntil = 21.5;
  recordBattleEffects(view, [event('stop')], state.time, state.hero);
  const cast = capture(state, view);
  assert.ok(cast.filter(([c]) => c === '#d94e54').length >= 8, 'large solid octagon slams down');
  assert.ok(has(cast, '#fffaf0'), 'STOP sign has a blank white bar');
  assert.ok(has(cast, '#b5f4ff'), 'freeze rims monster sprites');
  state.time = 21.6;
  const half = capture(state, view);
  assert.ok(has(half, '#b5f4ff'), 'regular monster stays frozen');
  assert.ok(has(half, '#96e6f1'), 'boss thaws after its shorter freeze');
  state.time = 23.2;
  assert.equal(has(capture(state, view), '#b5f4ff'), false, 'frost clears after state timer');
}
{
  const { state, view } = scene();
  state.hero.shieldUntil = 22;
  recordBattleEffects(view, [event('quick-save')], state.time, state.hero);
  const cast = capture(state, view);
  assert.ok(has(cast, '#345f63') && has(cast, '#fff8cf'), 'floppy disk has body and label');
  assert.ok(has(cast, '#f3ffff'), 'shield bubble has a bright rim');
  assert.ok(has(cast, '#e8833a'), 'hero remains visible inside shield');
  view.effects = [];
  state.time = 21.7;
  assert.ok(has(capture(state, view), '#f3ffff'), 'bubble survives effect queue expiry');
  state.time = 22.05;
  assert.ok(has(capture(state, view), '#d6faff'), 'bubble pops into a small burst');
  state.time = 22.2;
  assert.equal(has(capture(state, view), '#f3ffff'), false, 'bubble rim ends');
}

for (const id of Object.keys(spellColor)) {
  const { state, view } = scene(360, true);
  if (id === 'folder-fort') { state.hero.fortUntil = 23; state.hero.fortRadius = 2.4; }
  if (id === 'quick-save') state.hero.shieldUntil = 22;
  recordBattleEffects(view, [event(id)], state.time, state.hero);
  const color = id === 'quick-save' ? '#f3ffff' : spellColor[id];
  const first = capture(state, view).filter(([c]) => c === color);
  assert.ok(first.length, `${id}: still reduced-motion cue`);
  state.time = 20.3;
  assert.deepEqual(capture(state, view).filter(([c]) => c === color), first, `${id}: still cue does not move`);
  if (id === 'folder-fort' || id === 'quick-save') {
    state.time = 21;
    assert.ok(has(capture(state, view), color), `${id}: persistent still cue lasts with state`);
  } else {
    state.time = 20.4;
    assert.equal(has(capture(state, view), color), false, `${id}: still cue ends at 400ms`);
  }
}

{
  const { state, view } = scene(360);
  state.hero.x = 1.1; state.hero.y = 1.1;
  state.hero.fortRadius = 2.4; state.hero.fortUntil = 23; state.hero.shieldUntil = 22;
  for (const id of Object.keys(spellColor)) recordBattleEffects(view,
    [{ ...event(id), x: 1.1, y: 1.1 }], state.time, state.hero);
  const colors = new Set(['#e9af4a', '#ad52c8cc', '#d94e54', '#345f63', '#f3ffff']);
  for (const [color, x, y, w, h] of capture(state, view)) {
    if (!colors.has(color)) continue;
    assert.ok(x >= 0 && y >= 0 && x + w <= view.widthPx && y + h <= view.heightPx,
      'new effect pixels clip at arena edges');
  }
  recordBattleEffects(view, Array.from({ length: 100 }, () => event('stop')), state.time, state.hero);
  assert.equal(view.effects.length, MAX_FX, 'effect queue remains capped');
}
console.log('ok — P22b special art: four spells, state timers, freeze, reduced motion, deterministic bounded paints');
