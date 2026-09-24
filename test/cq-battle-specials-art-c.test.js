import assert from 'node:assert/strict';
import { normalizeCq } from '../src/cq/character.js';
import { getLesson } from '../src/cq/lessons/pack1.js';
import { createBattle, spawnEnemy } from '../src/cq/battle/engine.js';
import { recordBattleEffects } from '../src/cq/battle/battle-ui.js';
import { FX_LIFE, MAX_FX, renderBattle } from '../src/cq/battle/render.js';
import { fitView } from '../src/cq/battle/view.js';

function scene(width = 850, reducedMotion = false) {
  const cq = normalizeCq({ track: 'standard' });
  const state = createBattle({ cq, lesson: getLesson('s3'), rng: () => 0.7 });
  state.time = 20;
  state.enemies.length = 0; state.puffs.length = 0; state.pickups.length = 0;
  state.hero.x = 8; state.hero.y = 6; state.hero.invulnUntil = 0;
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
function cast(id, targets = [], x = 8, y = 6) {
  return { type: 'special', id, x, y, fromX: x, fromY: y, targets };
}
const colors = { 'copy-paste-volley': '#9465db', 'select-all': '#d783fa', 'popup-blocker': '#384a70' };

for (const width of [850, 360]) for (const id of Object.keys(colors)) {
  const { state, view } = scene(width);
  const enemy = spawnEnemy(state, 'slime', 11, 6, []);
  const boss = spawnEnemy(state, 'mega-slime', 13, 5, []);
  const targets = [enemy, boss].map((e) => ({ id: e.id, type: e.type, x: e.x, y: e.y, boss: e === boss }));
  const baseline = capture(state, view);
  assert.equal(has(baseline, colors[id]), false, `${id}: no cast art without event`);
  if (id === 'copy-paste-volley') state.bolts = [{ x: 9, y: 6, dx: 1, dy: 0, special: true, twin: false, wait: 0 }];
  recordBattleEffects(view, [cast(id, targets)], state.time, state.hero);
  for (const age of [0, 0.1, 0.25]) {
    state.time = 20 + age;
    const calls = capture(state, view);
    assert.ok(has(calls, colors[id]) || (id === 'copy-paste-volley' && has(calls, '#9b67df'))
      || (id === 'popup-blocker' && age === 0.25 && has(calls, '#ed5263')),
      `${id}: visible at ${age}s`);
    assert.deepEqual(calls, capture(state, view), `${id}: deterministic frame`);
    assert.ok(has(calls, '#e8833a'), 'hero visible');
    assert.ok(has(calls, '#2fc6b6'), 'monster visible');
    assert.ok(calls.length - baseline.length <= 500, `${id}: bounded rectangles`);
  }
  state.time = 20 + FX_LIFE.special;
  const saved = view.effects;
  const expired = capture(state, view);
  view.effects = [];
  assert.deepEqual(expired, capture(state, view), `${id}: event cue expires`);
  view.effects = saved;
}

{
  const { state, view } = scene();
  const target = spawnEnemy(state, 'slime', 11, 6, []);
  recordBattleEffects(view, [cast('select-all', [{ id: target.id, x: 11, y: 6 }])], 20, state.hero);
  state.enemies.length = 0;
  assert.ok(has(capture(state, view), '#d783fa'), 'dead target retains brief cast selection');
  state.time = 20.28;
  assert.equal(has(capture(state, view), '#d783fa'), false, 'dead target box clears promptly');
}
{
  const { state, view } = scene();
  recordBattleEffects(view, [cast('copy-paste-volley')], 20, state.hero);
  state.bolts = [{ x: 8, y: 6, dx: 1, dy: 0, special: true, twin: false, wait: 0 },
    { x: 8, y: 6, dx: 0, dy: 1, special: true, twin: true, wait: 0.3 }];
  const waiting = capture(state, view);
  assert.ok(has(waiting, '#9b67df'), 'first ring has a purple crystal bolt');
  assert.ok(has(waiting, '#8168d899'), 'waiting twin has ghost-ring marker');
  state.bolts[1].wait = 0;
  state.time = 20.32;
  const pasted = capture(state, view);
  assert.ok(has(pasted, '#7298ef'), 'pasted bolt changes tint');
  assert.ok(has(pasted, '#6c91e7'), 'paste flash appears');
  assert.ok(has(pasted, '#e8833a'), 'bolts do not obscure hero');
  view.effects = [];
  assert.ok(has(capture(state, view), '#7298ef'), 'bolt art follows bolt state');
}
{
  const { state, view } = scene();
  recordBattleEffects(view, [cast('copy-paste-volley')], 20, state.hero);
  state.time = 20.65;
  recordBattleEffects(view, [{ type: 'hit', id: 41, x: 11, y: 6, source: 'bolt' }], state.time, state.hero);
  assert.ok(has(capture(state, view), '#aa7be9'), 'late volley hit has its own crystal impact');
  state.time = 20.83;
  recordBattleEffects(view, [], state.time, state.hero);
  assert.equal(has(capture(state, view), '#aa7be9'), false, 'impact expires with hit effect');
}

for (const id of Object.keys(colors)) {
  const { state, view } = scene(360, true);
  const target = { id: 4, x: 11, y: 6, boss: false };
  recordBattleEffects(view, [cast(id, [target])], 20, state.hero);
  const first = capture(state, view);
  const cue = id === 'copy-paste-volley' ? '#9b78e8' : colors[id];
  assert.ok(has(first, cue), `${id}: reduced-motion still cue`);
  state.time = 20.3;
  assert.deepEqual(capture(state, view).filter(([c]) => c === cue), first.filter(([c]) => c === cue),
    `${id}: still cue holds`);
  state.time = 20.4;
  assert.equal(has(capture(state, view), cue), false, `${id}: reduced cue ends`);
}
{
  const { state, view } = scene(360);
  state.hero.x = 1.1; state.hero.y = 1.1;
  for (const id of Object.keys(colors)) recordBattleEffects(view,
    [cast(id, [{ id: 7, x: 0.2, y: 0.2, boss: false }], 1.1, 1.1)], 20, state.hero);
  const effectColors = new Set(['#9465db', '#d783fa', '#384a70', '#ba435ecc']);
  for (const [color, x, y, w, h] of capture(state, view)) if (effectColors.has(color)) {
    assert.ok(x >= 0 && y >= 0 && x + w <= view.widthPx && y + h <= view.heightPx, 'effect clipped');
  }
  recordBattleEffects(view, Array.from({ length: 100 }, () => cast('popup-blocker')), 20, state.hero);
  assert.equal(view.effects.length, MAX_FX, 'queue capped');
}
console.log('ok — P22c volley, select, popup art');
