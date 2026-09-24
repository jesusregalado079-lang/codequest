import assert from 'node:assert/strict';
import { normalizeCq } from '../src/cq/character.js';
import { getLesson } from '../src/cq/lessons/pack1.js';
import { createBattle, spawnEnemy } from '../src/cq/battle/engine.js';
import { recordBattleEffects, specialSkillCaption } from '../src/cq/battle/battle-ui.js';
import { FX_LIFE, MAX_FX, renderBattle } from '../src/cq/battle/render.js';
import { fitView } from '../src/cq/battle/view.js';

function scene(width = 850, reducedMotion = false) {
  const cq = normalizeCq({ track: 'guided' });
  const state = createBattle({ cq, lesson: getLesson('g1'), rng: () => 0.7 });
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
const spells = [
  { id: 'start-burst', kind: 'burst', x: 8, y: 6, fromX: 8, fromY: 6, radius: 3.6, color: '#7865d8', reducedColor: '#7865d8' },
  { id: 'window-dash', kind: 'dash', x: 11, y: 6, fromX: 6, fromY: 6, color: '#d5f3ff', reducedColor: '#d5f3ff' },
  { id: 'alt-tab-dash', kind: 'dash', x: 12, y: 6, fromX: 6, fromY: 6, color: '#c9ffff', reducedColor: '#6ed8e4' },
];

assert.equal(specialSkillCaption('the Start button'), 'Like the Start button');
assert.equal(specialSkillCaption('switching windows'), 'Like switching windows');
assert.equal(specialSkillCaption('saving your work'), 'Like saving your work');
assert.equal(specialSkillCaption('Alt+Tab'), 'Inspired by: Alt+Tab');
assert.equal(specialSkillCaption(''), '');

for (const spell of spells) {
  for (const width of [850, 360]) {
    const { state, view } = scene(width);
    state.hero.x = spell.x;
    state.hero.y = spell.y;
    const enemy = spawnEnemy(state, 'slime', 14, 7, []);
    const before = capture(state, view);
    assert.equal(before.some(([c]) => c === spell.color), false, `${spell.id}: no art without cast`);
    recordBattleEffects(view, [{ type: 'special', ...spell }], state.time, state.hero);
    assert.equal(view.effects.length, 1);
    assert.equal(view.effects[0].fromX, spell.fromX, 'cast keeps the source point');
    assert.equal(view.effects[0].radius, spell.radius, 'cast keeps the radius when present');
    for (const age of [0, 0.1, 0.25]) {
      state.time = 20 + age;
      const calls = capture(state, view);
      assert.ok(calls.some(([c]) => c === spell.color), `${spell.id}: art at ${age}s, width ${width}`);
      assert.deepEqual(capture(state, view), calls, 'same frame paints deterministically');
      assert.ok(calls.some(([c]) => c === '#e8833a'), 'hero stays visible');
      assert.ok(calls.some(([c]) => c === '#2fc6b6' || c === '#34c9a0'), 'monster stays visible');
      assert.ok(calls.length - before.length <= 290, 'special adds at most 290 rectangles');
    }
    state.time = 20 + FX_LIFE.special;
    const expired = capture(state, view);
    const saved = view.effects;
    view.effects = [];
    assert.deepEqual(expired, capture(state, view), 'effect ends on lifetime boundary');
    view.effects = saved;
    assert.equal(enemy.type, 'slime', 'drawing does not change gameplay state');
  }
  const { state, view } = scene(360, true);
  state.hero.x = spell.x;
  recordBattleEffects(view, [{ type: 'special', ...spell }], state.time, state.hero);
  const first = capture(state, view).filter(([c]) => c === spell.reducedColor);
  assert.ok(first.length > 0, `${spell.id}: still reduced-motion cue`);
  state.time = 20.3;
  assert.deepEqual(capture(state, view).filter(([c]) => c === spell.reducedColor), first,
    'reduced-motion cue stays still');
  state.time = 20.4;
  assert.equal(capture(state, view).some(([c]) => c === spell.reducedColor), false,
    'reduced-motion cue ends at 400 ms');
}

{
  const { state, view } = scene();
  recordBattleEffects(view, [{ type: 'special', ...spells[0] }], state.time, state.hero);
  const center = view.offsetX + 8 * view.tile;
  const ringExtent = () => Math.max(...capture(state, view).filter(([c]) => c === '#fff2bd').map(([, x]) => Math.abs(x - center)));
  const near = ringExtent();
  state.time = 20.35;
  assert.ok(ringExtent() > near + view.tile, 'Start Burst ring expands across the grass');
  const rim = capture(state, view).filter(([c]) => c === '#7865d8');
  assert.ok(rim.length >= 70 && rim.every(([, , , w, h]) => w >= 4 * 2 && h >= 4 * 2),
    'Start Burst has a continuous, four-unit saturated band');
  assert.ok(rim.every(([, x, y, w, h]) => {
    const cy = view.offsetY + 6 * view.tile + view.tile * 0.18;
    return Math.hypot(x + w / 2 - center, y + h / 2 - cy) <= 3.6 * view.tile;
  }), 'burst band stays within hit radius');
  state.time = 20;
  const cast = capture(state, view);
  for (const color of ['#a994ef', '#f3cd73', '#8ed3ef', '#e8a3ce']) {
    const pane = cast.filter(([c]) => c === color);
    assert.equal(pane.length, 1, 'each of four solid bloom panes appears on the first frame');
    assert.ok(pane[0][3] >= view.tile * 0.35 && pane[0][4] >= view.tile * 0.35,
      'bloom panes have chunky dimensions');
    assert.ok(Math.abs(pane[0][1] + pane[0][3] / 2 - center) > view.tile * 0.7,
      'bloom panes sit outside the hero silhouette');
  }
  assert.ok(cast.some(([c, , , w]) => c === '#fff8d2cc' && w >= view.tile * 0.5),
    'first frame has a compact filled centre flash');
  state.time = 20.21;
  assert.equal(capture(state, view).some(([c]) => c === '#a994ef'), false,
    'four-pane bloom shatters by 200 ms');
}
{
  const { state, view } = scene();
  recordBattleEffects(view, [{ type: 'special', ...spells[1] }], state.time, state.hero);
  const early = capture(state, view).filter(([c]) => c === '#d5f3ff');
  const fills = capture(state, view).filter(([c]) => c === '#d9f6f08c');
  assert.equal(fills.length, 4, 'Window Dash fills four full-size window panes along the path');
  assert.ok(fills.every(([, , , w, h]) => w >= view.tile * 0.6 && h >= view.tile * 0.4));
  assert.ok(early.some(([, , , , h]) => h >= Math.round(view.tile / 16) * 2),
    'Window Dash frame border is two arena units thick');
  assert.ok(capture(state, view).some(([c, , , , h]) => c === '#acd7e6dd' && h >= Math.round(view.tile / 16) * 2),
    'Window Dash speed lines are thick');
  assert.ok(capture(state, view).some(([c, , , w]) => c === '#83b8d2' && w >= view.tile * 0.7),
    'Window Dash has a large source flare');
  state.time = 20.25;
  const late = capture(state, view).filter(([c]) => c === '#a9d8ebb0');
  assert.ok(early.length && late.length, 'Window Dash frames fade to a lighter outline');
  assert.ok(late[0][1] > early[0][1], 'Window Dash frames slide toward the destination');
  assert.ok(capture(state, view).some(([c]) => c === '#bceaf3'), 'Window Dash lands in a separate burst');
}
{
  const { state, view } = scene();
  recordBattleEffects(view, [{ type: 'special', ...spells[2] }], state.time, state.hero);
  const calls = capture(state, view);
  assert.equal(calls.filter(([c]) => c === '#6ed8e4').length, 12,
    'Alt-Tab Dash draws three overlapping dark cards with two-unit borders');
  assert.equal(calls.filter(([c]) => c === '#eefaff').length, 12,
    'Alt-Tab Dash draws three overlapping bright cards');
  assert.equal(calls.filter(([c]) => c === '#5ca7c29c').length, 3,
    'Alt-Tab Dash fills the darker card at each stop');
  assert.equal(calls.filter(([c]) => c === '#c9f7f4c4').length, 3,
    'Alt-Tab Dash fills the brighter card at each stop');
  assert.ok(calls.filter(([c, , , w, h]) => c === '#c9ffff' && w >= 3 * Math.round(view.tile / 16) && h >= 3 * Math.round(view.tile / 16)).length >= 19,
    'Alt-Tab Dash has a three-unit cyan-white rail across the path');
  assert.ok(calls.some(([c, , , w]) => c === '#5bc5dd' && w >= view.tile * 0.7),
    'Alt-Tab Dash has bold endpoint flares distinct from Window Dash');
}

{
  const { state, view } = scene(360);
  for (const spell of spells) {
    recordBattleEffects(view, [{ type: 'special', ...spell, x: 1.1, y: 1.1, fromX: 1.1, fromY: 1.1 }], state.time, state.hero);
  }
  const colors = new Set(['#7865d8', '#fff2bd', '#a994ef', '#f3cd73', '#8ed3ef', '#e8a3ce',
    '#d5f3ff', '#d9f6f08c', '#acd7e6dd', '#83b8d2', '#6ed8e4', '#eefaff', '#c9ffff', '#5bc5dd']);
  let checked = 0;
  for (const [color, x, y, w, h] of capture(state, view)) {
    if (!colors.has(color)) continue;
    assert.ok(x >= 0 && y >= 0 && x + w <= view.widthPx && y + h <= view.heightPx,
      'spell pixels stay within the canvas at an edge');
    checked += 1;
  }
  assert.ok(checked > 20, 'edge test inspected real spell pixels');
  recordBattleEffects(view, Array.from({ length: 100 }, () => ({ type: 'special', ...spells[0] })), state.time, state.hero);
  assert.equal(view.effects.length, MAX_FX, 'specials share the bounded effect queue');
  state.time = 21;
  recordBattleEffects(view, [], state.time, state.hero);
  assert.equal(view.effects.length, 0, 'expired special records are pruned');
}
console.log('ok — P22a special art: captions, event lifetimes, deterministic and bounded paints, sprites, reduced motion, edges and cap');
