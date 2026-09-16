// Computer Quest horde battle: pure view helpers + renderer smoke run against a recording 2D context.
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { getItem, normalizeCq, setProgress } from '../src/cq/character.js';
import { getLesson } from '../src/cq/lessons/pack1.js';
import { TRACK_LESSONS, LESSON_AWARDS } from '../src/cq/items.js';
import { ARENA, spawnPoint, WAVE_COUNT } from '../src/cq/battle/content.js';
import { createBattle, gearFrom, resultOf, spawnEnemy, step, waveTotal } from '../src/cq/battle/engine.js';
import { drawSlotIcon, renderBattle } from '../src/cq/battle/render.js';
import {
  blankInput, cooldownFraction, doneOnce, endBannerMs, fitView, HOWTO_TIP, isInteractiveOutside, formatClock, formatPlayed, howToKeys, hudSlots, keyAction, keyId,
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
  assert.equal(keyAction({ code: 'ArrowUp' }, true), null);
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
  assert.ok(/if \(isInteractiveOutside\(event\.target, root\)\) return;/.test(uiSource), 'keydown ignores keys aimed at outside controls');
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

console.log('ok — Computer Quest battle view fitting, key mapping, how-to keys, HUD slots, cooldowns, results text, and renderer smoke runs pass');
