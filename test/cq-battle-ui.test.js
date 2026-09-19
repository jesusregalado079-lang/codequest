// Computer Quest horde battle: pure view helpers + renderer smoke run against a recording 2D context.
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { getItem, normalizeCq, setProgress } from '../src/cq/character.js';
import { getLesson } from '../src/cq/lessons/pack1.js';
import { TRACK_LESSONS, LESSON_AWARDS } from '../src/cq/items.js';
import { ARENA, spawnPoint, WAVE_COUNT } from '../src/cq/battle/content.js';
import { createBattle, ENEMY_FLASH, gearFrom, meleeStats, resultOf, spawnEnemy, step, SWING_TIME, waveTotal } from '../src/cq/battle/engine.js';
import { drawSlotIcon, renderBattle, SLASH_LIFT } from '../src/cq/battle/render.js';
import {
  blankInput, cooldownFraction, doneOnce, endBannerMs, fitView, HOWTO_TIP, isActivationKey, isInteractiveOutside, formatClock, formatPlayed, howToKeys, hudSlots, keyAction, keyId,
  MAX_CSS_WIDTH, RESULT_HEADLINES, resultsView, shouldPreventDefault, slotStatus, waveBanner, waveLabel,
} from '../src/cq/battle/view.js';

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
function gearCq(track, ids = [], extra = {}) {
  const equipped = {};
  let magic = 1;
  ids.forEach((id) => {
    const item = getItem(id);
    if (item.slot === 'magic') { equipped[`magic${magic}`] = id; magic += 1; } else equipped[item.slot] = id;
  });
  return normalizeCq({ track, owned: ids, equipped, ...extra });
}
const fullSet = (track) => TRACK_LESSONS[track].map((id) => LESSON_AWARDS[id].item);

// ---------- view fitting ----------
[
  [960, 1], [880, 1], [848, 2], [360, 1], [336, 3], [320, 1.5], [1400, 1], [37, 1], [0, 1], [500, 2.625],
].forEach(([width, dpr]) => {
  const v = fitView(width, dpr);
  assert.ok(v.cssWidth <= MAX_CSS_WIDTH, `css width capped (${width})`);
  assert.equal(v.cssHeight, Math.max(1, Math.round(v.cssWidth * 3 / 5)), `5:3 aspect (${width})`);
  if (width > 0) assert.ok(v.cssWidth <= width, `fits the container (${width})`);
  assert.ok(Number.isInteger(v.tile), `integer tile (${width}@${dpr})`);
  assert.ok(v.tile * ARENA.width <= v.widthPx && v.tile * ARENA.height <= v.heightPx, 'arena fits the canvas');
  assert.ok(v.offsetX >= 0 && v.offsetY >= 0, 'offsets are non-negative');
  assert.ok(Number.isInteger(v.offsetX) && Number.isInteger(v.offsetY), 'integer offsets');
  assert.ok(Math.abs((v.widthPx - v.tile * ARENA.width) / 2 - v.offsetX) <= 0.5, 'centered horizontally');
});
assert.deepEqual(fitView(960, 1), { cssWidth: 960, cssHeight: 576, widthPx: 960, heightPx: 576, tile: 48, offsetX: 0, offsetY: 0 });
assert.deepEqual(fitView(1400, 2), { cssWidth: 960, cssHeight: 576, widthPx: 1920, heightPx: 1152, tile: 96, offsetX: 0, offsetY: 0 });
assert.deepEqual(fitView(360, 1), { cssWidth: 360, cssHeight: 216, widthPx: 360, heightPx: 216, tile: 18, offsetX: 0, offsetY: 0 });
assert.deepEqual(fitView(350, 1), { cssWidth: 350, cssHeight: 210, widthPx: 350, heightPx: 210, tile: 17, offsetX: 5, offsetY: 3 });
assert.equal(fitView(10, 1).tile, 0.5, 'below 20 device px the tile may be fractional');
assert.equal(fitView(NaN, NaN).cssWidth, 960, 'bad input falls back to the max width');

// ---------- key mapping ----------
const key = (code, mods = {}) => ({ code, key: '', ctrlKey: false, altKey: false, metaKey: false, shiftKey: false, ...mods });
const expected = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  Space: 'attack', ShiftLeft: 'block', ShiftRight: 'block', KeyE: 'ability', KeyQ: 'stance', KeyR: 'undo',
  Digit1: 'apple', Numpad1: 'apple', Digit2: 'stone', Numpad2: 'stone', Escape: 'pause',
};
Object.keys(expected).forEach((code) => {
  assert.equal(keyAction(key(code)), expected[code], code);
  assert.equal(shouldPreventDefault(key(code)), true, `${code} is prevented`);
  ['ctrlKey', 'altKey', 'metaKey'].forEach((mod) => {
    assert.equal(keyAction(key(code, { [mod]: true })), null, `${mod}+${code} is not the game's`);
    assert.equal(shouldPreventDefault(key(code, { [mod]: true })), false, `${mod}+${code} is never prevented`);
  });
});
assert.equal(keyAction(key('Digit1', { shiftKey: true })), 'apple', 'Shift held (blocking) still lets 1 eat the apple');
['Tab', 'F5', 'F12', 'Enter', 'KeyZ', 'Digit3', 'ControlLeft', 'AltLeft', 'MetaLeft', 'Backspace', 'KeyT'].forEach((code) => {
  assert.equal(keyAction(key(code)), null, `${code} unbound`);
  assert.equal(shouldPreventDefault(key(code)), false, `${code} not prevented`);
});
assert.equal(keyAction({ code: '', key: ' ' }), 'attack', 'key-name fallback when code is missing');
assert.equal(keyAction({ code: '', key: 'Tab' }), null);
assert.equal(keyAction(null), null);
assert.equal(keyId(key('KeyW')), 'KeyW');
assert.equal(keyId({ code: '', key: 'w' }), 'key:w');
assert.deepEqual(Object.keys(blankInput()), ['up', 'down', 'left', 'right', 'attack', 'block', 'ability', 'stance', 'undo', 'apple', 'stone', 'pause']);

// ---------- how-to keys ----------
const keysOf = (gear) => howToKeys(gear).map((line) => line.keys);
assert.deepEqual(keysOf(gearFrom({})), ['Arrows / WASD', 'Space'], 'first battle: bare hands, move + attack only');
assert.deepEqual(keysOf(gearFrom(gearCq('guided', fullSet('guided')).equipped)), ['Arrows / WASD', 'Space', 'Shift', 'E', '1']);
assert.deepEqual(keysOf(gearFrom(gearCq('standard', fullSet('standard')).equipped)), ['Arrows / WASD', 'Space', 'Q', 'E', 'R', '2']);
assert.deepEqual(keysOf({ rune: true, staff: true }), ['Arrows / WASD', 'Space', 'E'], 'E listed once when both are equipped');
assert.ok(howToKeys({ staff: true }).some((line) => /bolt/i.test(line.text)), 'staff wins E');
assert.ok(howToKeys(gearFrom({})).every((line) => !/Esc|Tab|Ctrl/.test(line.keys)));

// ---------- HUD slots ----------
const slotIds = (gear) => hudSlots(gear).map((slot) => `${slot.id}:${slot.key}:${slot.icon}`);
assert.deepEqual(slotIds(gearFrom({})), ['weapon:Space:fist']);
assert.deepEqual(slotIds(gearFrom(gearCq('guided', fullSet('guided')).equipped)), [
  'weapon:Space:start-blade', 'shield:Shift:stop-sign-shield', 'rune:E:rename-rune', 'apple:1:apple',
]);
assert.deepEqual(slotIds(gearFrom(gearCq('standard', fullSet('standard')).equipped)), [
  'weapon:Space:switch-sword', 'stance:Q:null', 'staff:E:copy-crystal-staff', 'amulet:R:undo-amulet', 'stone:2:save-stone',
]);
assert.deepEqual(slotIds({ rune: true, staff: true }), ['weapon:Space:fist', 'staff:E:copy-crystal-staff']);
assert.deepEqual(slotIds(gearFrom(gearCq('guided', ['taskbar-boots']).equipped)), ['weapon:Space:fist'], 'passives get no slot');

// ---------- cooldown ring ----------
assert.equal(cooldownFraction(10, 8, 10), 0);
assert.equal(cooldownFraction(10, 8, 6), 0.5);
assert.equal(cooldownFraction(10, 8, 2), 1);
assert.equal(cooldownFraction(10, 8, 0), 1, 'clamped to 1');
assert.equal(cooldownFraction(0, 8, 5), 0, 'ready');
assert.equal(cooldownFraction(10, 0, 5), 0, 'no total');
assert.equal(cooldownFraction(NaN, 8, 5), 0);
{
  const cq = gearCq('standard', fullSet('standard'));
  const state = createBattle({ cq, lesson: { number: 5, track: 'standard' }, rng: seeded(3) });
  state.plan = [[{ type: 'slime', delay: 1e9, edge: 'top', pos: 0 }], [], []];
  assert.equal(slotStatus(state, 'stance').text, 'QUICK');
  const input = blankInput();
  input.attack = true; input.ability = true; input.stance = true;
  step(state, input, 1 / 60);
  assert.equal(slotStatus(state, 'weapon').fraction, 1, 'swing just started');
  assert.equal(slotStatus(state, 'staff').fraction, 1, 'bolt just fired');
  assert.equal(slotStatus(state, 'stance').text, 'WIDE');
  for (let i = 0; i < 20; i += 1) step(state, blankInput(), 1 / 60);
  const staff = slotStatus(state, 'staff').fraction;
  assert.ok(staff > 0.2 && staff < 0.4, `staff cooling (${staff})`);
  assert.equal(slotStatus(state, 'amulet').used, false);
  const undo = blankInput(); undo.undo = true;
  step(state, undo, 1 / 60);
  assert.equal(slotStatus(state, 'amulet').used, true);
  assert.equal(slotStatus(state, 'stone').used, false);
  state.hero.stone.used = true;
  assert.equal(slotStatus(state, 'stone').used, true);
  assert.equal(slotStatus(state, 'stone').fraction, 0);
}
{
  const cq = gearCq('guided', fullSet('guided'));
  const state = createBattle({ cq, lesson: { number: 5, track: 'guided' }, rng: seeded(4) });
  assert.equal(slotStatus(state, 'apple').used, false);
  state.hero.apple = false;
  assert.equal(slotStatus(state, 'apple').used, true);
  state.hero.blocking = true;
  assert.equal(slotStatus(state, 'shield').active, true);
  state.cooldowns.rune = state.time + 4;
  assert.equal(slotStatus(state, 'rune').fraction, 0.5);
}

// ---------- clock + results ----------
assert.equal(formatClock(300), '5:00', 'battle starts at 5:00');
assert.equal(formatClock(299.5), '5:00');
assert.equal(formatClock(298.99), '4:59');
assert.equal(formatClock(240), '4:00');
assert.equal(formatClock(239.01), '4:00');
assert.equal(formatClock(59.5), '1:00');
assert.equal(formatClock(9), '0:09');
assert.equal(formatClock(0), '0:00');
assert.equal(formatClock(-3), '0:00');
assert.equal(formatPlayed(0), '0:00');
assert.equal(formatPlayed(83400), '1:23');
assert.equal(formatPlayed(240000), '4:00');
assert.equal(formatPlayed(300000), '5:00');
assert.equal(RESULT_HEADLINES.victory, 'Victory!');
assert.deepEqual(resultsView({ outcome: 'victory', ms: 150000, poofs: 23, hearts: 4, maxHearts: 6 }, 4), {
  headline: 'Victory!', gemsText: '+4 💎', poofs: 23, played: '2:30', hearts: 4, maxHearts: 6,
});
assert.equal(resultsView({ outcome: 'time', ms: 240000, poofs: 9 }, 1).headline, 'Time! The chest is safe.');
assert.equal(resultsView({ outcome: 'time', ms: 240000, poofs: 9 }, 1).gemsText, '+1 💎');
assert.equal(resultsView({ outcome: 'fell', ms: 60000, poofs: 3, hearts: 0 }, 0).headline, 'The monsters ran off! Your chest is still safe.');
assert.equal(resultsView({ outcome: 'fell', ms: 60000, poofs: 3, hearts: 0 }, 0).gemsText, '+0 💎');
assert.equal(resultsView({ outcome: 'fell' }, 0).hearts, null);
assert.equal(resultsView({ outcome: 'victory' }, NaN).gemsText, '+0 💎');

// ---------- how-to tip ----------
assert.equal(HOWTO_TIP, 'Tip: face a monster, then press Space.');

// ---------- keys aimed at controls outside the battle ----------
{
  const root = { contains: (el) => Boolean(el && el.insideBattle) };
  const el = (matches, insideBattle) => ({ insideBattle, closest: () => (matches ? {} : null) });
  const quests = el(true, false); // "← Quests" button in the lesson top bar
  const body = el(false, false); // page body / non-interactive element
  const canvas = el(false, true); // battle canvas or container
  const overlayButton = el(true, true); // "Let's go!" inside the battle overlay
  assert.equal(isInteractiveOutside(quests, root), true);
  assert.equal(isInteractiveOutside(body, root), false);
  assert.equal(isInteractiveOutside(canvas, root), false);
  assert.equal(isInteractiveOutside(overlayButton, root), false, 'battle overlay buttons stay in the battle');
  assert.equal(isInteractiveOutside(null, root), false);
  assert.equal(isInteractiveOutside({}, root), false, 'targets without closest() (window/document) are not controls');
  const space = { code: 'Space', key: ' ' };
  assert.equal(keyAction(space, isInteractiveOutside(quests, root)), null, 'Space on ← Quests activates the button, not the game');
  assert.equal(keyAction(space, isInteractiveOutside(body, root)), 'attack', 'Space on the page body still attacks');
  assert.equal(keyAction(space, isInteractiveOutside(canvas, root)), 'attack');
  assert.equal(keyAction({ code: 'ArrowUp' }, false), 'up');
  // b12: with focus on an outside control only Space and Enter are handed to that control.
  assert.equal(keyAction({ code: 'ArrowUp' }, true), 'up', 'arrows still move with ← Quests focused');
  [['KeyW', 'up'], ['KeyA', 'left'], ['KeyS', 'down'], ['KeyD', 'right'], ['Escape', 'pause'], ['KeyE', 'ability'], ['KeyQ', 'stance'],
    ['KeyR', 'undo'], ['Digit1', 'apple'], ['Digit2', 'stone'], ['ShiftLeft', 'block']].forEach(([code, action]) => {
    assert.equal(keyAction({ code, key: '' }, true), action, `${code} still plays with an outside control focused`);
    assert.equal(keyAction({ code, key: '', ctrlKey: true }, true), null, `Ctrl+${code} is never the game's`);
  });
  assert.equal(keyAction({ code: 'Space', key: ' ' }, true), null);
  assert.equal(keyAction({ code: '', key: ' ' }, true), null, 'Space by key name is handed over too');
  assert.equal(keyAction({ code: 'Enter', key: 'Enter' }, true), null);
  assert.equal(keyAction({ code: '', key: 'Escape' }, true), 'pause', 'key-name fallback also keeps Esc');
  assert.equal(isActivationKey({ code: 'Space', key: ' ' }), true);
  assert.equal(isActivationKey({ code: 'NumpadEnter', key: 'Enter' }), true);
  assert.equal(isActivationKey({ code: 'ArrowUp', key: 'ArrowUp' }), false);
  assert.equal(isActivationKey(null), false);
  // Real selector check with a closest() that tests the selector string.
  const byTag = (tag) => ({ closest: (sel) => (sel.split(',').map((x) => x.trim()).indexOf(tag) !== -1 ? {} : null) });
  ['button', 'input', 'select', 'textarea', 'summary', 'a[href]'].forEach((tag) => assert.equal(isInteractiveOutside(byTag(tag), root), true, tag));
  ['canvas', 'div', 'body'].forEach((tag) => assert.equal(isInteractiveOutside(byTag(tag), root), false, tag));
}

// ---------- end sequencing: record on end, exactly once ----------
{
  const calls = [];
  const once = doneOnce((r) => calls.push(r));
  assert.equal(once.called, false);
  assert.equal(once.call({ outcome: 'victory', ms: 1, poofs: 2 }), true);
  assert.equal(once.call({ outcome: 'skipped', ms: 1, poofs: 2 }), false, 'a later skip cannot re-record');
  assert.equal(once.called, true);
  assert.deepEqual(calls, [{ outcome: 'victory', ms: 1, poofs: 2 }]);
  assert.doesNotThrow(() => doneOnce(null).call({}));
  assert.equal(endBannerMs(false), 1300);
  assert.equal(endBannerMs(true), 700);
}

// ---------- wave label ----------
assert.equal(waveLabel(1, 5), 'Wave 1 / 5');
assert.equal(waveBanner(1, 5, 0), 'Wave 1 / 5', 'first wave has no cleared banner');
assert.equal(waveBanner(2, 5, 1), 'Wave cleared! +❤️ · Wave 2 / 5');
assert.equal(waveBanner(5, 5, 0), 'Wave cleared! · Wave 5 / 5', 'no heart shown when already full');
assert.equal(waveLabel(5, 5), 'Wave 5 / 5');
assert.equal(waveLabel(2, 3), 'Wave 2 / 3', 'total comes from the caller, not a constant');
assert.equal(waveLabel(9, 5), 'Wave 5 / 5', 'clamped');
assert.equal(waveLabel(0, NaN), 'Wave 1 / 1');
{
  const s = createBattle({ cq: gearCq('guided'), lesson: getLesson('g1'), rng: seeded(2) });
  assert.equal(WAVE_COUNT, 5);
  assert.equal(waveTotal(s), 5);
  assert.equal(s.timeLeft, 300);
  assert.equal(waveLabel(s.wave, waveTotal(s)), 'Wave 1 / 5', 'HUD label for a real battle');
  assert.equal(formatClock(s.timeLeft), '5:00');
}

// ---------- renderer smoke run ----------
const COLOR = /^(#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8}|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*(0|1|0?\.\d+)\s*)?\))$/i;
function recordingContext() {
  const ctx = {
    rects: 0, badRects: [], badStyles: [], saves: 0, restores: 0, _fill: '#000000',
    imageSmoothingEnabled: true, globalAlpha: 1,
    get fillStyle() { return this._fill; },
    set fillStyle(value) { if (typeof value !== 'string' || !COLOR.test(value)) this.badStyles.push(value); this._fill = value; },
    fillRect(x, y, w, h) {
      this.rects += 1;
      if (![x, y, w, h].every(Number.isFinite)) this.badRects.push([x, y, w, h]);
    },
    clearRect(x, y, w, h) { if (![x, y, w, h].every(Number.isFinite)) this.badRects.push(['clear', x, y, w, h]); },
    save() { this.saves += 1; },
    restore() { this.restores += 1; },
  };
  return ctx;
}
function bot(state, t) {
  const input = blankInput();
  const hero = state.hero;
  let best = null;
  let bestD = Infinity;
  state.enemies.forEach((e) => { const d = Math.hypot(e.x - hero.x, e.y - hero.y); if (d < bestD) { best = e; bestD = d; } });
  if (best) {
    const dx = best.x - hero.x;
    const dy = best.y - hero.y;
    if (bestD > 0.9) {
      if (Math.abs(dx) > 0.2) input[dx > 0 ? 'right' : 'left'] = true;
      if (Math.abs(dy) > 0.2) input[dy > 0 ? 'down' : 'up'] = true;
    } else if (Math.abs(dx) > Math.abs(dy)) input[dx > 0 ? 'right' : 'left'] = true;
    else input[dy > 0 ? 'down' : 'up'] = true;
  } else if (t % 120 < 60) input.left = true;
  input.attack = t % 10 < 5;
  input.ability = t % 40 === 0;
  input.stance = t === 90;
  input.block = t % 90 > 70;
  input.apple = t === 150;
  input.stone = t === 60;
  input.undo = t === 200;
  return input;
}

const views = [fitView(960, 1), fitView(360, 1), fitView(880, 2), fitView(10, 1)];
const runs = [
  { lesson: 'g1', track: 'guided', extra: { worn: { trail: 'trail-leaf' }, cosmetics: ['trail-leaf'] } },
  { lesson: 'g5', track: 'guided', extra: { worn: { trail: 'trail-sparkle', cape: 'cape-night' }, cosmetics: ['trail-sparkle', 'cape-night'] } },
  { lesson: 's5', track: 'standard', extra: { worn: { trail: 'trail-sparkle', hat: 'wizard-hat' }, cosmetics: ['trail-sparkle', 'wizard-hat'] } },
];
runs.forEach(({ lesson: lessonId, track, extra }, runIndex) => {
  const lesson = getLesson(lessonId);
  assert.ok(lesson, lessonId);
  const cq = gearCq(track, fullSet(track), extra);
  assert.equal(setProgress(cq).active, true, `${lessonId}: full set equipped`);
  const state = createBattle({ cq, lesson, rng: seeded(11 + runIndex) });
  const ctx = recordingContext();
  const particles = [];
  let lastRects = 0;
  let sawEnemy = false;
  for (let t = 0; t < 300; t += 1) {
    const { events } = step(state, bot(state, t), 1 / 60);
    events.forEach((ev) => { if (ev.type === 'scrap') particles.push({ id: t, x: ev.x, y: ev.y, born: state.time }); });
    if (state.enemies.length) sawEnemy = true;
    const base = views[t % views.length];
    const view = {
      ...base, look: cq.look, equipped: cq.equipped, worn: cq.worn, glow: true, reducedMotion: t % 2 === 0, particles,
    };
    assert.doesNotThrow(() => renderBattle(ctx, state, view, t * 16.7), `${lessonId} step ${t}`);
    if (base.tile >= 1 && t === 299) lastRects = ctx.rects;
  }
  // Force every sprite state onto the arena and render once more.
  const forced = ['slime', 'goblin', 'mimic', 'mimic', 'mega-slime', 'big-glitch'].map((type, i) => spawnEnemy(state, type, 3 + i * 2.5, 4 + (i % 3) * 2, []));
  forced[1].chickenUntil = state.time + 3;
  forced[1].dirX = 1;
  forced[2].state = 'lunge';
  forced[3].revealed = true;
  forced[0].stunUntil = state.time + 1;
  forced[0].flashUntil = state.time + 0.1;
  forced[5].state = 'warn';
  forced[4].hp = 2;
  if (!state.pickups) state.pickups = [];
  state.pickups.push({ id: 9001, type: 'heart', x: 8.5, y: 8.5, until: state.time + 1 }, { id: 9002, type: 'heart', x: 11.5, y: 8.5, until: state.time + 6 });
  state.puffs.push({ id: 9003, x: 9, y: 9, bornAt: state.time - 0.1, until: state.time + 0.4, squares: 9 });
  state.bolts.push({ id: 9004, x: 12, y: 6, dx: 1, dy: 0, travelled: 1, range: 6, dmg: 1, twin: false });
  particles.push({ id: 9005, x: 6, y: 6, born: state.time - 0.2 });
  state.hero.moving = true;
  state.hero.attackStartedAt = state.time;
  state.hero.attackUntil = state.time + 0.15;
  state.hero.swing = { dmg: 1, reach: 1.2, arc: 90, hit: [] };
  state.hero.invulnUntil = 0;
  [0, 0.05, 1.05].forEach((dt, i) => {
    state.time += dt;
    views.forEach((base) => {
      const before = ctx.rects;
      renderBattle(ctx, state, { ...base, look: cq.look, equipped: cq.equipped, worn: cq.worn, glow: i === 0, reducedMotion: i === 2, particles }, 1000 + i);
      assert.ok(ctx.rects > before + 200, 'the arena and sprites draw something');
    });
  });
  // Missing optional engine fields must not break drawing.
  const bare = createBattle({ cq, lesson, rng: seeded(99) });
  delete bare.pickups;
  bare.enemies.push({ id: 1, type: 'slime', x: 5, y: 5, hp: 2, maxHp: 2, boss: false, state: 'move', spawnedAt: 0, chickenUntil: 0, flashUntil: 0, revealed: true });
  assert.doesNotThrow(() => renderBattle(ctx, bare, { ...views[0], look: null, equipped: {}, worn: {}, glow: false, reducedMotion: false }, 0));
  assert.ok(sawEnemy, `${lessonId}: enemies spawned during the run`);
  assert.ok(lastRects > 0 || ctx.rects > 0, 'drawing happened');
  assert.deepEqual(ctx.badRects.slice(0, 3), [], `${lessonId}: fillRect only gets finite numbers`);
  assert.deepEqual(ctx.badStyles.slice(0, 3), [], `${lessonId}: fillStyle is always a valid color string`);
  assert.equal(ctx.saves, ctx.restores, 'save/restore balanced');
  assert.equal(resultOf(state).poofs, state.poofs);
});
{
  const ctx = recordingContext();
  ['fist', 'apple'].forEach((id) => drawSlotIcon(ctx, 34, id));
  assert.ok(ctx.rects > 10);
  assert.deepEqual(ctx.badRects, []);
  assert.deepEqual(ctx.badStyles, []);
}
assert.doesNotThrow(() => renderBattle(null, null, null, 0));
// Boss HP bar draws for the wave-3 mid-boss (from the real plan), not only the final mini-boss.
{
  const cq = gearCq('standard');
  const s = createBattle({ cq, lesson: getLesson('s5'), rng: seeded(5) });
  const midEntry = s.plan[2][s.plan[2].length - 1];
  assert.equal(midEntry.type, 'mega-slime');
  const p = spawnPoint(midEntry, 2);
  const mid = spawnEnemy(s, midEntry.type, p.x, p.y, []);
  mid.hp = 3;
  const view = { ...fitView(960, 1), look: cq.look, equipped: cq.equipped, worn: cq.worn, glow: false, reducedMotion: true, particles: [] };
  const withBar = recordingContext();
  renderBattle(withBar, s, view, 0);
  mid.boss = false;
  const withoutBar = recordingContext();
  renderBattle(withoutBar, s, view, 0);
  assert.equal(withBar.rects - withoutBar.rects, 3, 'mid-boss gets the 3-rect HP bar');
}

// ---------- P8: slash streak + impact burst ----------
// The slash is one contiguous block in the draw list: after every sprite for right/left/down, and between the
// enemies behind the hero and the hero himself for up. Compare a frame with hero.swing set against the same frame
// with swing cleared (the arm pose follows attackUntil either way) and cut the inserted block out.
{
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
  function arena({ track = 'guided', main = 'start-blade', facing = 'right', stance = null, attack = 0.3, css = 960 } = {}) {
    const cq = gearCq(track, main ? [main] : []);
    const s = createBattle({ cq, lesson: getLesson(track === 'guided' ? 'g1' : 's1'), rng: seeded(3) });
    s.enemies.length = 0;
    s.time = 20;
    const hero = s.hero;
    hero.x = 10; hero.y = 6; hero.facing = facing; hero.invulnUntil = 0; hero.moving = false;
    if (stance) hero.stance = stance;
    const stats = meleeStats(s.gear, hero.stance);
    hero.attackStartedAt = s.time - attack * SWING_TIME;
    hero.attackUntil = hero.attackStartedAt + SWING_TIME;
    hero.swing = { dmg: stats.dmg, reach: stats.reach, arc: stats.arc, hit: [] };
    const view = { ...fitView(css, 1), look: cq.look, equipped: cq.equipped, worn: cq.worn, glow: false, reducedMotion: false, particles: [] };
    return { s, view, stats };
  }
  let lastInsert = -1;
  function extra(s, view) {
    const a = capture();
    renderBattle(a.ctx, s, view, 0);
    const saved = s.hero.swing;
    s.hero.swing = null;
    const b = capture();
    renderBattle(b.ctx, s, view, 0);
    s.hero.swing = saved;
    let i = 0;
    while (i < b.calls.length && JSON.stringify(a.calls[i]) === JSON.stringify(b.calls[i])) i += 1;
    const n = a.calls.length - b.calls.length;
    assert.deepEqual(a.calls.slice(i + n), b.calls.slice(i), 'the streak is one inserted block; everything else is unchanged');
    lastInsert = i;
    return { rects: a.calls.slice(i, i + n), without: b.calls };
  }
  const FACE = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
  const polar = (rects, s, view) => rects.map(([c, x, y, w, h]) => {
    const dx = x + w / 2 - (view.offsetX + s.hero.x * view.tile);
    const dy = y + h / 2 - (view.offsetY + (s.hero.y - SLASH_LIFT[s.hero.facing]) * view.tile); // lifted centre
    return { c, r: Math.hypot(dx, dy), a: Math.atan2(dy, dx), area: w * h };
  });
  const offBase = (a, facing) => { let d = a - FACE[facing]; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
  const centroidY = (rects) => {
    const area = rects.reduce((sum, [, , , w, h]) => sum + w * h, 0);
    return rects.reduce((sum, [, , y, w, h]) => sum + (y + h / 2) * w * h, 0) / area;
  };

  // Only while swinging: before the start and after attackUntil there is no streak.
  for (const attack of [1, 1.4, 3]) {
    const { s, view } = arena({ attack });
    assert.equal(extra(s, view).rects.length, 0, `no streak outside the swing window (attack ${attack})`);
  }
  // Inside the real hitbox: angular sector (facing +- arc/2) and radius (<= reach), every facing, stance and size.
  const cases = [
    { track: 'guided', main: 'start-blade' },
    { track: 'standard', main: 'switch-sword', stance: 'quick' },
    { track: 'standard', main: 'switch-sword', stance: 'wide' },
    { track: 'guided', main: null },
  ];
  const spread = {};
  cases.forEach((c) => ['right', 'down', 'left', 'up'].forEach((facing) => [360, 960].forEach((css) => {
    let maxR = 0; let area = 0; let lo = Infinity; let hi = -Infinity;
    [0.05, 0.2, 0.35, 0.5, 0.7, 0.9].forEach((attack) => {
      const { s, view, stats } = arena({ ...c, facing, attack, css });
      const T = view.tile;
      const rects = extra(s, view).rects;
      assert.ok(rects.length > 0 && rects.length <= 48, `${c.main}/${c.stance}/${facing}@${attack}: a streak of a few dozen rects (${rects.length})`);
      polar(rects, s, view).forEach((p) => {
        // Pixel snapping and block size allow a small margin past the exact hitbox edge.
        const margin = Math.atan2(T * 0.25, p.r);
        const off = offBase(p.a, facing);
        assert.ok(Math.abs(off) <= (stats.arc * Math.PI) / 360 + margin, `${facing}: streak rect at ${(off * 180 / Math.PI).toFixed(0)} deg is inside the ${stats.arc} deg arc`);
        assert.ok(p.r <= stats.reach * T + T * 0.1, `${facing}: streak stays within reach`);
        assert.ok(p.r >= stats.reach * T * 0.3, `${facing}: streak is a crescent, not a disc (r ${p.r.toFixed(1)} T ${T} ${c.main})`);
        maxR = Math.max(maxR, p.r); area += p.area; lo = Math.min(lo, off); hi = Math.max(hi, off);
      });
    });
    spread[`${c.main}/${c.stance || null}/${facing}/${css}`] = { maxR, area, span: hi - lo };
  })));
  ['right', 'down', 'left', 'up'].forEach((facing) => [360, 960].forEach((css) => {
    const sword = spread[`start-blade/null/${facing}/${css}`];
    const fist = spread[`null/null/${facing}/${css}`];
    assert.ok(fist.maxR < sword.maxR && fist.area < sword.area * 0.6, `${facing}@${css}: bare-hands punch is smaller than the sword streak`);
    const quick = spread[`switch-sword/quick/${facing}/${css}`];
    const wide = spread[`switch-sword/wide/${facing}/${css}`];
    assert.ok(wide.span > quick.span + 0.3 && wide.maxR > quick.maxR, `${facing}@${css}: wide stance streak is wider and longer`);
  }));
  // Pin the swoosh to blade height from the foot-level centre without consulting its lift constant.
  // Mid-swing only: later the crescent has swept low (wide stance ends well below the blade).
  [
    { track: 'guided', main: 'start-blade' },
    { track: 'standard', main: 'switch-sword', stance: 'quick' },
    { track: 'standard', main: 'switch-sword', stance: 'wide' },
  ].forEach((c) => ['right', 'left', 'up'].forEach((facing) => [360, 960].forEach((css) => [0.3].forEach((attack) => {
    const { s, view } = arena({ ...c, facing, css, attack });
    const y0 = view.offsetY + s.hero.y * view.tile;
    const y = centroidY(extra(s, view).rects);
    const above = (y0 - y) / view.tile;
    const threshold = facing === 'up' ? 1.3 : 0.15;
    assert.ok(above > threshold, `${c.main}/${c.stance || 'blade'}/${facing}@${css}/${attack}: swoosh is ${above.toFixed(3)} tiles above feet (>${threshold})`);
  }))));
  // The leading edge (the white tip) travels across the arc in the arm's turning direction.
  const DIR = { right: 1, left: -1, down: -1, up: -1 };
  ['right', 'down', 'left', 'up'].forEach((facing) => {
    const tip = (attack) => {
      const { s, view } = arena({ facing, attack });
      const p = polar(extra(s, view).rects, s, view).filter((q) => q.c === '#ffffff');
      assert.ok(p.length > 0, `${facing}@${attack}: leading edge drawn`);
      return offBase(p[p.length - 1].a, facing);
    };
    assert.ok(tip(0.05) * DIR[facing] < 0 && tip(0.5) * DIR[facing] > 0, `${facing}: leading edge sweeps with the arm`);
  });
  // During the invisible half of hurt blink, hide the streak with the body; show both on the visible half.
  ['right', 'down', 'left', 'up'].forEach((facing) => {
    const off = arena({ attack: 0.3, facing });
    off.s.hero.invulnUntil = off.s.time + 0.15;
    assert.equal(extra(off.s, off.view).rects.length, 0, `${facing} blink-off: no swoosh`);
    const offCapture = capture();
    renderBattle(offCapture.ctx, off.s, off.view, 0);
    assert.equal(offCapture.calls.filter(([color]) => color === '#e8833a').length, 0, `${facing} blink-off: no hero body`);
    const on = arena({ attack: 0.3, facing });
    on.s.hero.invulnUntil = on.s.time + 0.05;
    assert.ok(extra(on.s, on.view).rects.length > 0, `${facing} blink-on: swoosh drawn`);
    const onCapture = capture();
    renderBattle(onCapture.ctx, on.s, on.view, 0);
    assert.ok(onCapture.calls.filter(([color]) => color === '#e8833a').length > 0, `${facing} blink-on: hero body drawn`);
  });
  // Reduced motion: the whole arc, still (identical rects across the swing); normal motion: it moves.
  {
    const frame = (attack, reducedMotion) => { const { s, view } = arena({ attack }); return extra(s, { ...view, reducedMotion }).rects; };
    assert.ok(frame(0.2, true).length > 0, 'reduced motion still shows the streak');
    assert.deepEqual(frame(0.2, true), frame(0.7, true), 'reduced motion streak does not travel');
    assert.notDeepEqual(frame(0.2, false), frame(0.7, false), 'normal streak travels');
  }
  // Impact burst: only while flashUntil > time, on the hero's side of the enemy, radiating (still in reduced motion).
  {
    const withSlime = (flashLeft, reducedMotion, dt = 0) => {
      const { s, view } = arena({ attack: 2 });
      s.hero.swing = null;
      const e = spawnEnemy(s, 'slime', 11.2, 6, []);
      e.flashUntil = s.time + flashLeft;
      s.time += dt;
      const on = capture();
      renderBattle(on.ctx, s, { ...view, reducedMotion }, 0);
      e.flashUntil = 0;
      const off = capture();
      renderBattle(off.ctx, s, { ...view, reducedMotion }, 0);
      return { on: on.calls, off: off.calls, s, view };
    };
    const burstRects = (r) => r.on.slice(r.off.length);
    const early = withSlime(0.1, false);
    const burst = burstRects(early);
    assert.ok(burst.length >= 5 && burst.length <= 12, `burst is a handful of squares (${burst.length})`);
    const T = early.view.tile;
    const heroSide = burst.filter(([, x, , w]) => x + w / 2 < early.view.offsetX + 11.2 * T).length;
    assert.ok(heroSide > burst.length / 2, 'burst sits on the side facing the hero');
    assert.equal(withSlime(0, false).on.length, withSlime(0, false).off.length, 'no burst once flashUntil <= time');
    assert.equal(withSlime(0.05, false, 0.06).on.length, withSlime(0.05, false, 0.06).off.length, 'no burst after the flash ends');
    const late = burstRects(withSlime(0.1, false, 0.07));
    assert.equal(late.length, burst.length);
    assert.notDeepEqual(late, burst, 'burst radiates over the flash window');
    const spreadOf = (rects) => Math.max(...rects.map(([, x]) => x)) - Math.min(...rects.map(([, x]) => x));
    assert.ok(spreadOf(late) > spreadOf(burst), 'burst grows outward');
    const stillA = burstRects(withSlime(0.1, true));
    const stillB = burstRects(withSlime(0.1, true, 0.07));
    assert.ok(stillA.length > 0, 'reduced motion keeps the burst');
    assert.deepEqual(stillA, stillB, 'reduced motion burst does not radiate');
  }
  // P8b draw order: facing up the slash is behind the hero (before any of his sprite rects); otherwise after him.
  ['right', 'down', 'left', 'up'].forEach((facing) => {
    const { s, view } = arena({ facing, attack: 0.35 });
    const { rects, without } = extra(s, view);
    assert.ok(rects.length > 0, `${facing}: slash drawn`);
    const shirt = without.map((c, i) => (c[0] === '#e8833a' ? i : -1)).filter((i) => i >= 0);
    assert.ok(shirt.length > 0, 'hero shirt rects found');
    if (facing === 'up') assert.ok(lastInsert < shirt[0], 'up: slash is drawn before (behind) the hero');
    else assert.ok(lastInsert > shirt[shirt.length - 1], `${facing}: slash is drawn after (in front of) the hero`);
  });
  // P8b guard: lifted to blade height, the swoosh still visibly touches a slime just inside reach straight ahead.
  cases.forEach((c) => ['right', 'down', 'left'].forEach((facing) => [360, 960].forEach((css) => {
    const probe = arena({ ...c, facing, css });
    const d = { right: [1, 0], left: [-1, 0], down: [0, 1] }[facing];
    const dist = probe.stats.reach - 0.1;
    let touched = false;
    [0.2, 0.35, 0.5, 0.7, 0.9].forEach((attack) => {
      const { s, view } = arena({ ...c, facing, css, attack });
      const e = spawnEnemy(s, 'slime', s.hero.x + d[0] * dist, s.hero.y + d[1] * dist, []);
      e.state = 'idle';
      const { rects, without } = extra(s, view);
      const body = without.filter(([col]) => col === '#2fc6b6' || col === '#1b8f86');
      assert.ok(body.length > 0, 'slime body drawn');
      const bx0 = Math.min(...body.map((r) => r[1])); const bx1 = Math.max(...body.map((r) => r[1] + r[3]));
      const by0 = Math.min(...body.map((r) => r[2])); const by1 = Math.max(...body.map((r) => r[2] + r[4]));
      if (rects.some(([, x, y, w, h]) => x < bx1 && x + w > bx0 && y < by1 && y + h > by0)) touched = true;
    });
    assert.ok(touched, `${c.main}/${c.stance}/${facing}@${css}: the swoosh touches a slime just inside reach`);
  })));
  // P8b kill spark: every puff is a kill (addPuff's only caller is poof), so a fresh puff gets the burst for
  // ENEMY_FLASH seconds, with no flashing enemy anywhere.
  {
    const withPuff = (age, reducedMotion) => {
      const { s, view } = arena({ attack: 2 });
      s.hero.swing = null;
      s.puffs.push({ id: 4242, x: 11, y: 6, bornAt: s.time - age, until: s.time - age + 0.5, squares: 8 });
      const c = capture();
      renderBattle(c.ctx, s, { ...view, reducedMotion }, 0);
      assert.equal(s.enemies.length, 0, 'no enemy on the field');
      return c.calls;
    };
    const fresh = withPuff(0.01, false);
    const later = withPuff(ENEMY_FLASH + 0.01, false);
    assert.equal(fresh.length - later.length, 10, 'a fresh kill puff gets the 10-rect spark');
    assert.equal(withPuff(ENEMY_FLASH, false).length, later.length, 'spark ends at ENEMY_FLASH');
    const spark = fresh.slice(-10);
    assert.ok(spark.some(([c]) => c === '#ffe066') && spark.some(([c]) => c === '#ffffff'), 'spark colors');
    const T = fitView(960, 1).tile;
    assert.ok(spark.filter(([, x, , w]) => x + w / 2 < 11 * T).length > 5, 'spark sits on the hero side of the puff');
    assert.notDeepEqual(withPuff(0.01, false).slice(-10), withPuff(0.07, false).slice(-10), 'kill spark radiates');
    const r1 = withPuff(0.01, true); const r2 = withPuff(0.07, true);
    assert.equal(r1.length - withPuff(ENEMY_FLASH + 0.01, true).length, 10, 'reduced motion keeps the kill spark');
    assert.deepEqual(r1.slice(-10), r2.slice(-10), 'reduced-motion kill spark is still');
  }
  // Deterministic: same state, same pixels.
  {
    const { s, view } = arena({ attack: 0.4 });
    const a = capture(); const b = capture();
    renderBattle(a.ctx, s, view, 0); renderBattle(b.ctx, s, view, 5000);
    assert.deepEqual(a.calls, b.calls, 'renderer is a pure function of state');
  }
}

// ---------- source rules ----------
['../src/cq/battle/render.js', '../src/cq/battle/view.js', '../src/cq/battle/battle-ui.js'].forEach((path) => {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  assert.equal(/\.at\(|Object\.hasOwn|structuredClone|findLast|replaceAll|\?\?=|\|\|=|&&=/.test(source), false, `${path}: no ES2021+ builtins`);
  assert.equal(/\balert\(|\bconfirm\(|\bprompt\(/.test(source), false, `${path}: no alert/confirm/prompt`);
  assert.equal(/<[a-z][^>]*\son[a-z]+=/i.test(source), false, `${path}: no inline event handlers (CSP)`);
});
const renderSource = readFileSync(new URL('../src/cq/battle/render.js', import.meta.url), 'utf8');
assert.equal(/Math\.random|document\.|window\./.test(renderSource), false, 'render.js: no Math.random and no DOM');
const uiSource = readFileSync(new URL('../src/cq/battle/battle-ui.js', import.meta.url), 'utf8');
assert.ok(!/['"](Tab|F\d{1,2})['"]/.test(uiSource), 'battle-ui never binds Tab or F-keys');
assert.ok(uiSource.includes('webkitAudioContext'));
{
  const finishSrc = uiSource.slice(uiSource.indexOf('function finish('), uiSource.indexOf('function skip('));
  assert.ok(/done\.call\(result\);\s*\}\s*$/.test(finishSrc), 'finish() hands the result over immediately (last statement)');
  assert.ok(!/setTimeout/.test(finishSrc), 'no delay before the result is handed over');
  const destroySrc = uiSource.slice(uiSource.indexOf('destroy() {'));
  assert.ok(!/done\.call|onDone/.test(destroySrc), 'destroy() never calls onDone (no double record, no late record)');
  assert.ok(uiSource.includes('esc(HOWTO_TIP)'), 'how-to card shows the tip');
  assert.ok(uiSource.includes("ev.source === 'second-wind' ? 'Second Wind! Keep going!'"), 'Second Wind banner');
  assert.ok(/const outside = isInteractiveOutside\(event\.target, root\);\s*if \(outside && isActivationKey\(event\)\) return;/.test(uiSource), 'keydown hands only Space/Enter to outside controls');
  assert.ok(/keyAction\(event, outside\)/.test(uiSource), 'keydown maps the rest with the outside flag');
  assert.ok(/waveHeal = ev\.amount \|\| 0; if \(waveHeal > 0\) once\('heal'\);/.test(uiSource), 'no heal sound for a 0-amount wave heal');
  // lesson-ui: commit at end, results after the visual banner, timer cleared on navigation/destroy.
  const lessonSource = readFileSync(new URL('../src/cq/lesson-ui.js', import.meta.url), 'utf8');
  const fin = lessonSource.slice(lessonSource.indexOf('function finishBattle('), lessonSource.indexOf('function skipToChest('));
  assert.ok(fin.indexOf('recordBattle(') !== -1 && fin.indexOf('recordBattle(') < fin.indexOf('setTimeout('), 'lesson-ui records before the banner delay');
  assert.ok(fin.includes('endBannerMs(battleReducedMotion)'));
  assert.ok(fin.includes('screen.recorded = next'));
  assert.ok(/screen\.kind === 'battle' && screen\.recorded\) screen = screen\.recorded/.test(lessonSource), 'a recorded battle is never re-mounted');
  const lessonDestroy = lessonSource.slice(lessonSource.indexOf('    destroy() {'));
  assert.ok(lessonDestroy.includes('clearResultsTimer();'), 'lesson destroy clears the results timer');
}
assert.ok(!/WAVE_COUNT|\/ 3\b/.test(uiSource), 'battle-ui derives the wave total instead of hardcoding 3');
assert.equal((uiSource.match(/wave(Label|Banner)\(/g) || []).length, 3, 'initial HUD, banner and HUD update all use waveLabel/waveBanner');
assert.ok(/case 'wave':[^\n]*waveBanner\(ev\.wave, waveTotal\(state\), waveHeal\)/.test(uiSource), 'wave banner reuses the wave event with the wave-clear heal');
// Modules load without a DOM.
const battleUi = await import('../src/cq/battle/battle-ui.js');
assert.equal(typeof battleUi.mountBattle, 'function');

// ---------- b11: end sequencing, driven for real ----------
// Mount the real battle screen on a stub DOM with fake timers and a manual rAF. The host's onDone
// mirrors lesson-ui's finishBattle (commit the record, then schedule results after the end banner).
// The record must be committed the moment the battle ends, before the results timer can fire, and
// leaving during the banner must neither drop nor repeat it.
{
  const noop = () => {};
  const ctx2d = { fillRect: noop, clearRect: noop, save: noop, restore: noop, fillStyle: '#000', globalAlpha: 1, imageSmoothingEnabled: false };
  const stub = () => new Proxy(function stubFn() {}, {
    get(_t, prop) {
      if (prop === 'getContext') return () => ctx2d;
      if (prop === Symbol.toPrimitive) return () => '';
      if (prop === 'hidden' || prop === 'repeat') return false;
      return stub();
    },
    set() { return true; },
    apply() { return stub(); },
  });
  const rafs = [];
  const win = {
    devicePixelRatio: 1, performance: { now: () => 0 },
    requestAnimationFrame(cb) { rafs.push(cb); return rafs.length; }, cancelAnimationFrame: noop,
    addEventListener: noop, removeEventListener: noop, matchMedia: () => ({ matches: false }),
  };
  const doc = { hidden: false, defaultView: win, createElement: () => stub(), addEventListener: noop, removeEventListener: noop };
  const container = { ownerDocument: doc, clientWidth: 960, append: noop };

  let clock = 0;
  let nextTimer = 1;
  const timers = new Map();
  const realSetTimeout = globalThis.setTimeout;
  const realClearTimeout = globalThis.clearTimeout;
  const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  globalThis.setTimeout = (fn, ms) => { const id = nextTimer; nextTimer += 1; timers.set(id, { fn, at: clock + (ms || 0) }); return id; };
  globalThis.clearTimeout = (id) => { timers.delete(id); };
  Object.defineProperty(globalThis, 'localStorage', { value: { getItem: () => null, setItem: noop }, configurable: true, writable: true });
  const advance = (ms) => {
    clock += ms;
    Array.from(timers.entries()).sort((a, b) => a[1].at - b[1].at).forEach(([id, t]) => {
      if (t.at <= clock && timers.has(id)) { timers.delete(id); t.fn(); }
    });
  };

  const log = [];
  let store = { battles: 0 };
  let resultsTimer = 0;
  let battle = null;
  try {
    battle = battleUi.mountBattle(container, {
      cq: gearCq('guided'), lesson: getLesson('g1'), nickname: 'Kid', reducedMotion: false, profileId: 'p1', rng: seeded(8),
      onDone(result) {
        // lesson-ui finishBattle: commit, then the results screen after the end banner.
        store = { battles: store.battles + 1, last: result.outcome };
        log.push(`record:${result.outcome}`);
        resultsTimer = setTimeout(() => { log.push(`results:battles=${store.battles}`); }, endBannerMs(false));
      },
    });
    advance(8000); // the how-to card times out on its own
    let ts = 0;
    let frames = 0;
    while (!log.length && frames < 20000) {
      const pending = rafs.splice(0);
      ts += 250;
      pending.forEach((cb) => cb(ts));
      frames += 1;
    }
    assert.equal(log.length, 1, `battle ended and recorded (${frames} frames)`);
    assert.ok(/^record:(victory|time|fell)$/.test(log[0]), log[0]);
    assert.equal(store.battles, 1, 'the record is committed synchronously as the battle ends');
    assert.ok(timers.has(resultsTimer), 'results are still waiting on the banner timer');
    // More frames during the banner never re-record.
    for (let i = 0; i < 10; i += 1) rafs.splice(0).forEach((cb) => cb((ts += 250)));
    assert.equal(store.battles, 1, 'frames after the end do not record again');
    advance(endBannerMs(false) - 1);
    assert.equal(log.length, 1, 'results wait for the full banner');
    advance(1);
    assert.deepEqual(log, [log[0], 'results:battles=1'], 'record commit happens before the results timer fires');
    battle.destroy();
    battle.destroy();
    assert.equal(store.battles, 1, 'destroy never records');

    // Leaving during the banner keeps the single record (host clears its timer on navigation).
    log.length = 0; store = { battles: 0 }; rafs.length = 0;
    const second = battleUi.mountBattle(container, {
      cq: gearCq('guided'), lesson: getLesson('g1'), nickname: 'Kid', profileId: 'p1', rng: seeded(9),
      onDone(result) {
        store = { battles: store.battles + 1, last: result.outcome };
        log.push(`record:${result.outcome}`);
        resultsTimer = setTimeout(() => { log.push('results'); }, endBannerMs(true));
      },
    });
    advance(8000);
    for (let f = 0; f < 20000 && !log.length; f += 1) rafs.splice(0).forEach((cb) => cb((ts += 250)));
    assert.equal(store.battles, 1);
    second.destroy();
    clearTimeout(resultsTimer);
    advance(5000);
    assert.deepEqual(log, [log[0]], 'left during the banner: recorded once, no results');
    assert.equal(store.battles, 1);
  } finally {
    globalThis.setTimeout = realSetTimeout;
    globalThis.clearTimeout = realClearTimeout;
    if (storageDescriptor) Object.defineProperty(globalThis, 'localStorage', storageDescriptor);
    else delete globalThis.localStorage;
  }
}

console.log('ok — Computer Quest battle view fitting, key mapping, how-to keys, HUD slots, cooldowns, results text, and renderer smoke runs pass');
