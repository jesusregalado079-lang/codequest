import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { getItem, normalizeCq } from '../src/cq/character.js';
import { getLesson } from '../src/cq/lessons/pack1.js';
import { boxHitsSolid } from '../src/cq/battle/engine.js';
import {
  ARENA, bossForWave, EARLY_MEGA_SLIME_HP, enemyHp, ENEMIES, isSolid, miniBossFor, MIMIC_MIN_SPAWN_DISTANCE, spawnPoint, WAVE_COUNT, wavePlan, waveSize,
} from '../src/cq/battle/content.js';
import {
  BOSS_MELEE_KNOCKBACK, BOSS_MELEE_STUN, createBattle, HEART_DROP_CHANCE, SECOND_WIND_MAX_LESSON, WAVE_CLEAR_HEAL, heroSpeed, hurtHero, INVULN_TIME,
  MELEE_KNOCKBACK, MELEE_STUN, meleeStats, resultOf, runeTarget, spawnEnemy, step,
} from '../src/cq/battle/engine.js';

const DT = 1 / 60;
const close = (a, b, tol = 1e-6, msg) => assert(Math.abs(a - b) <= tol, `${msg || 'value'}: expected ${b}, got ${a}`);

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

// A battle with a controlled arena: no scheduled spawns (wave 1 never clears), hero at center.
// Lesson 3 by default: no beginner Second Wind, so fall/revive tests see the plain rules.
function quiet(track = 'standard', ids = [], seed = 1, lessonNumber = 3) {
  const state = createBattle({ cq: gearCq(track, ids), lesson: { number: lessonNumber, track }, rng: seeded(seed) });
  state.plan = [[{ type: 'slime', delay: 1e9, edge: 'top', pos: 0 }], [], []];
  return state;
}

function run(state, input, steps) {
  const events = [];
  for (let i = 0; i < steps; i += 1) {
    const out = step(state, input, DT);
    assert.strictEqual(out.state, state, 'step mutates and returns the same state');
    out.events.forEach((e) => events.push({ ...e, t: state.time }));
  }
  return events;
}
const press = (state, key) => { step(state, {}, DT); return step(state, { [key]: true }, DT).events; };
const types = (events) => events.map((e) => e.type);
// Kill an enemy through the real melee path (swing from an adjacent hero position).
function hurtEnemyForTest(s, enemy, events) {
  s.hero.x = enemy.x; s.hero.y = enemy.y - 0.7; s.hero.facing = 'down';
  s.hero.attackCooldownUntil = 0; s.lastInput.attack = false;
  events.push(...step(s, { attack: true }, DT).events);
}


const STANDARD_ALL = ['switch-sword', 'save-stone', 'undo-amulet', 'copy-crystal-staff', 'scam-spotter-helmet'];
const GUIDED_ALL = ['start-blade', 'taskbar-boots', 'folder-backpack', 'rename-rune', 'stop-sign-shield'];

// ---------- source hygiene ----------
for (const file of ['src/cq/battle/content.js', 'src/cq/battle/engine.js']) {
  const src = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  assert(!/Math\.random/.test(src), `${file} must not use Math.random`);
  assert(!/\bDate\b/.test(src), `${file} must not use Date`);
  for (const banned of ['.at(', 'Object.hasOwn', 'structuredClone', 'findLast', 'replaceAll', '??=', '||=', '&&=']) {
    assert(!src.includes(banned), `${file} uses banned builtin ${banned}`);
  }
  assert(!/\b(document|window|canvas)\b/.test(src), `${file} must be DOM-free`);
}

// ---------- arena ----------
assert.strictEqual(ARENA.width, 20);
assert.strictEqual(ARENA.height, 12);
for (let x = 0; x < 20; x += 1) { assert(isSolid(x, 0)); assert(isSolid(x, 11)); }
for (let y = 0; y < 12; y += 1) { assert(isSolid(0, y)); assert(isSolid(19, y)); }
assert.strictEqual(ARENA.blocks.length, 4);
ARENA.blocks.forEach((b) => {
  assert(isSolid(b.x, b.y));
  assert(ARENA.blocks.some((o) => o.x === 19 - b.x && o.y === b.y), 'blocks mirror horizontally');
  assert(ARENA.blocks.some((o) => o.x === b.x && o.y === 11 - b.y), 'blocks mirror vertically');
});
let solidCount = 0;
ARENA.grid.forEach((row) => row.forEach((c) => { solidCount += c; }));
assert.strictEqual(solidCount, 2 * 20 + 2 * 10 + 4);
assert(!isSolid(ARENA.heroSpawn.x, ARENA.heroSpawn.y));
assert(isSolid(-1, 5) && isSolid(20, 5));

// ---------- enemy table ----------
assert.deepStrictEqual(
  Object.keys(ENEMIES).map((k) => [k, ENEMIES[k].hp, ENEMIES[k].speed, ENEMIES[k].dmg]),
  [['slime', 2, 1.6, 1], ['goblin', 3, 2.4, 1], ['mimic', 4, 0, 1], ['mega-slime', 6, 1.2, 1], ['big-glitch', 12, 1.5, 2]],
);
assert.strictEqual(ENEMIES.mimic.lungeSpeed, 6);
// Balance knobs tuned per ticket P4a-fix (hop timings -20%/+20%, goblin 2.4, contact 0.5).
assert.deepStrictEqual([ENEMIES.slime.hopMove, ENEMIES.slime.hopPause], [0.28, 0.42]);
['slime', 'goblin', 'mimic'].forEach((k) => assert.strictEqual(ENEMIES[k].contact, 0.5));
assert.strictEqual(ENEMIES['mega-slime'].contact, 1.1);

// ---------- wave plans ----------
for (let n = 1; n <= 5; n += 1) {
  for (const track of ['standard', 'guided']) {
    for (let seed = 1; seed <= 6; seed += 1) {
      const plan = wavePlan(n, track, seeded(seed * 97 + n));
      assert.strictEqual(plan.length, 5);
      assert.strictEqual(WAVE_COUNT, 5);
      const std = [2 + n, 3 + n, 3 + n, 3 + n, 4 + n];
      const expected = track === 'guided' ? std.map((c) => Math.max(2, c - 1)) : std;
      assert.deepStrictEqual(plan.map((w) => w.filter((e) => !ENEMIES[e.type].boss).length), expected, `counts n=${n} ${track}`);
      const finalBoss = n <= 3 ? 'mega-slime' : 'big-glitch';
      assert.deepStrictEqual(plan.map((w) => w.filter((e) => ENEMIES[e.type].boss).map((e) => e.type)),
        [[], [], ['mega-slime'], [], [finalBoss]], `bosses n=${n} ${track}`);
      assert.strictEqual(plan[2][plan[2].length - 1].type, 'mega-slime', 'mid-boss last in wave 3');
      assert.strictEqual(plan[4][plan[4].length - 1].type, finalBoss, 'final mini-boss last in wave 5');
      assert.strictEqual(plan[2].length, expected[2] + 1);
      assert.strictEqual(plan[4].length, expected[4] + 1);
      [2, 4].forEach((wi) => {
        const bossEntry = plan[wi][plan[wi].length - 1];
        assert(plan[wi].slice(0, -1).every((e) => e.delay < bossEntry.delay), 'boss spawns after the regulars');
      });
      assert.strictEqual(miniBossFor(n), n <= 3 ? 'mega-slime' : 'big-glitch');
      assert.deepStrictEqual([1, 2, 3, 4, 5].map((w) => bossForWave(n, w)), [null, null, 'mega-slime', null, finalBoss]);
      plan.forEach((wave, wi) => {
        const regular = wave.filter((e) => !ENEMIES[e.type].boss);
        assert.strictEqual(waveSize(n, track, wi + 1), regular.length);
        const count = (type) => regular.filter((e) => e.type === type).length;
        if (n <= 2) assert.strictEqual(count('slime'), regular.length, 'slimes only for n<=2');
        else assert.strictEqual(count('goblin'), Math.floor(regular.length / 3), '1 goblin in 3');
        assert.strictEqual(count('mimic'), n === 5 ? (track === 'guided' ? [0, 1, 0, 0, 0] : [0, 1, 0, 1, 1])[wi] : 0, 'mimic placement');
        for (let i = 1; i < wave.length; i += 1) assert(wave[i].delay >= wave[i - 1].delay, 'ordered by delay');
        regular.forEach((e) => assert(e.delay >= 0 && e.delay <= 4 + 1e-9, 'spawn over ~4 s'));
        wave.forEach((e) => {
          if (e.type === 'mimic') {
            assert.strictEqual(e.edge, 'interior');
            assert(!isSolid(e.x, e.y));
            assert(e.x > 1 && e.x < 19 && e.y > 1 && e.y < 11, 'mimic not on the edge');
            assert(Math.hypot(e.x - ARENA.heroSpawn.x, e.y - ARENA.heroSpawn.y) >= MIMIC_MIN_SPAWN_DISTANCE);
          } else {
            assert(['top', 'bottom', 'left', 'right'].includes(e.edge));
            assert(e.pos >= 0 && e.pos <= 1);
            const p = spawnPoint(e, ENEMIES[e.type].size);
            assert(!isSolid(p.x, p.y), 'edge spawn point is open');
          }
        });
        const mimicSpots = wave.filter((e) => e.type === 'mimic').map((e) => `${e.x},${e.y}`);
        assert.strictEqual(new Set(mimicSpots).size, mimicSpots.length, 'mimics do not stack');
      });
    }
  }
}
assert.deepStrictEqual(wavePlan(3, 'guided', seeded(5)), wavePlan(3, 'guided', seeded(5)), 'wavePlan deterministic');
assert.strictEqual(createBattle({ cq: gearCq('guided'), lesson: getLesson('g5'), rng: seeded(3) }).plan[1].filter((e) => e.type === 'mimic').length, 1);

// ---------- determinism ----------
{
  const script = (i) => ({
    up: i % 120 < 30, down: i % 120 >= 60 && i % 120 < 90, left: i % 200 < 70, right: i % 200 >= 100 && i % 200 < 170,
    attack: i % 12 < 2, block: i % 90 > 80, ability: i % 40 < 2, stance: i % 150 === 3, undo: i === 400,
    apple: i === 300, stone: i % 100 === 50, pause: i === 500 || i === 520,
  });
  const make = () => createBattle({ cq: gearCq('standard', STANDARD_ALL), lesson: getLesson('s5'), rng: seeded(42) });
  const a = make();
  const b = make();
  const ea = [];
  const eb = [];
  for (let i = 0; i < 600; i += 1) {
    ea.push(step(a, script(i), DT).events);
    eb.push(step(b, script(i), DT).events);
  }
  assert.deepStrictEqual(a, b, 'same seed + inputs => identical state');
  assert.deepStrictEqual(ea, eb, 'same seed + inputs => identical events');
  assert(a.enemies.length + a.poofs > 0, 'determinism run actually spawned enemies');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(a)), a, 'state is plain JSON data');
  const c = createBattle({ cq: gearCq('standard', STANDARD_ALL), lesson: getLesson('s5'), rng: seeded(43) });
  for (let i = 0; i < 600; i += 1) step(c, script(i), DT);
  assert.notDeepStrictEqual(c, a, 'different seed diverges');
}

// ---------- initial state ----------
{
  const s = createBattle({ cq: gearCq('guided'), lesson: getLesson('g1'), rng: seeded(9) });
  assert.strictEqual(s.time, 0);
  assert.strictEqual(s.timeLeft, 300);
  assert.strictEqual(s.phase, 'playing');
  assert.strictEqual(s.outcome, null);
  assert.strictEqual(s.wave, 1);
  assert.deepStrictEqual([s.hero.x, s.hero.y], [10, 6]);
  assert.strictEqual(s.hero.hearts, 5);
  assert.strictEqual(s.hero.stance, null);
  assert.strictEqual(s.hero.stone, null);
  assert.deepStrictEqual(s.cooldowns, { rune: 0, staff: 0, stone: 0 });
  assert(!('firstBattleHint' in s));
  const first = step(s, {}, DT).events;
  assert.deepStrictEqual(first[0], { type: 'wave', wave: 1 });
  const setHero = createBattle({ cq: gearCq('standard', STANDARD_ALL), lesson: getLesson('s5'), rng: seeded(9) });
  assert.strictEqual(setHero.hero.maxHearts, 6, 'set bonus => 6 hearts');
  assert.strictEqual(setHero.hero.hearts, 6);
  assert.strictEqual(createBattle({ cq: gearCq('guided', GUIDED_ALL), lesson: getLesson('g5'), rng: seeded(9) }).hero.maxHearts, 6);
  assert.strictEqual(createBattle({ cq: gearCq('standard', STANDARD_ALL.slice(1)), lesson: getLesson('s5'), rng: seeded(9) }).hero.maxHearts, 5);
}

// ---------- movement ----------
{
  const s = quiet();
  s.hero.invulnUntil = 1e9;
  run(s, { left: true }, 300);
  close(s.hero.x, 1.35, 1e-6, 'wall stops hero');
  assert.strictEqual(s.hero.facing, 'left');
  const b = quiet();
  b.hero.x = 3.5; b.hero.y = 3.5;
  run(b, { right: true }, 120);
  close(b.hero.x, 5 - 0.35, 1e-6, 'block stops hero');
  close(b.hero.y, 3.5, 1e-9, 'axis-separated');
  const d = quiet();
  run(d, { up: true, right: true }, 30);
  close(Math.hypot(d.hero.x - 10, d.hero.y - 6), 4.5 * 0.5, 1e-6, 'diagonal normalized');
  close(d.hero.x - 10, 6 - d.hero.y, 1e-9);
  const plain = quiet();
  run(plain, { right: true }, 30);
  close(plain.hero.x - 10, 2.25, 1e-6, 'base speed 4.5');
  const boots = quiet('guided', ['taskbar-boots']);
  run(boots, { right: true }, 30);
  close(boots.hero.x - 10, 4.5 * 1.25 * 0.5, 1e-6, 'boots +25%');
  close(heroSpeed(boots), 5.625);
  const blocker = quiet('guided', ['stop-sign-shield']);
  run(blocker, { right: true, block: true }, 30);
  assert.strictEqual(blocker.hero.blocking, true);
  close(blocker.hero.x - 10, 2.25 * 0.5, 1e-6, 'blocking halves speed');
  const noShield = quiet();
  run(noShield, { right: true, block: true }, 30);
  assert.strictEqual(noShield.hero.blocking, false, 'block without shield does nothing');
}

// ---------- melee ----------
{
  assert.deepStrictEqual(meleeStats({ melee: null }, null), { dmg: 1, reach: 1.0, cooldown: 0.45, arc: 90 });
  assert.deepStrictEqual(meleeStats({ melee: 'start-blade' }, null), { dmg: 2, reach: 1.2, cooldown: 0.4, arc: 90 });
  assert.deepStrictEqual(meleeStats({ melee: 'switch-sword' }, 'quick'), { dmg: 2, reach: 1.1, cooldown: 0.3, arc: 90 });
  assert.deepStrictEqual(meleeStats({ melee: 'switch-sword' }, 'wide'), { dmg: 2, reach: 1.5, cooldown: 0.6, arc: 120 });

  const bare = quiet();
  bare.hero.invulnUntil = 1e9;
  const slime = spawnEnemy(bare, 'slime', 10, 6.9);
  let ev = press(bare, 'attack');
  assert(types(ev).includes('swing'));
  assert.strictEqual(slime.hp, 1, 'bare hands dmg 1');
  close(bare.hero.attackCooldownUntil - bare.time, 0.45, 1e-9, 'bare cooldown');
  close(slime.flashUntil - bare.time, 0.1, 1e-9, 'flash 0.1 s');
  ev = press(bare, 'attack');
  assert(!types(ev).includes('swing'), 'cooldown blocks swing');

  const blade = quiet('guided', ['start-blade']);
  blade.hero.invulnUntil = 1e9;
  spawnEnemy(blade, 'slime', 10, 7.1);
  ev = press(blade, 'attack');
  assert(types(ev).includes('poof'), 'start blade dmg 2 poofs a slime at reach 1.2');
  assert.strictEqual(blade.poofs, 1);
  close(blade.hero.attackCooldownUntil - blade.time, 0.4, 1e-9, 'blade cooldown');

  const once = quiet();
  once.hero.invulnUntil = 1e9;
  const goblin = spawnEnemy(once, 'goblin', 10, 6.8);
  press(once, 'attack');
  run(once, { attack: true }, 9);
  assert.strictEqual(goblin.hp, 2, 'hit once per swing');
  assert.strictEqual(once.hero.swing, null, 'swing ends after 0.15 s');

  const sword = quiet('standard', ['switch-sword']);
  sword.hero.invulnUntil = 1e9;
  assert.strictEqual(sword.hero.stance, 'quick');
  const side = { x: 10 + Math.sin(55 * Math.PI / 180), y: 6 + Math.cos(55 * Math.PI / 180) };
  const g1 = spawnEnemy(sword, 'goblin', side.x, side.y);
  press(sword, 'attack');
  assert.strictEqual(g1.hp, 3, 'quick 90 deg arc misses at 55 deg');
  run(sword, {}, 30);
  g1.x = side.x; g1.y = side.y;
  press(sword, 'stance');
  assert.strictEqual(sword.hero.stance, 'wide');
  press(sword, 'attack');
  assert.strictEqual(g1.hp, 1, 'wide 120 deg arc hits at 55 deg');
  close(sword.hero.attackCooldownUntil - sword.time, 0.6, 1e-9, 'wide cooldown');
  run(sword, {}, 40);
  press(sword, 'stance');
  assert.strictEqual(sword.hero.stance, 'quick');
  const noSword = quiet();
  press(noSword, 'stance');
  assert.strictEqual(noSword.hero.stance, null, 'Q without sword does nothing');
}

// ---------- hero damage ----------
{
  const s = quiet();
  step(s, {}, DT);
  let ev = [];
  assert.strictEqual(hurtHero(s, 1, 10.5, 6, ev), 'hurt');
  assert.strictEqual(s.hero.hearts, 4);
  close(s.hero.x, 10 - 0.6, 1e-9, 'knockback 0.6 away from source');
  assert.deepStrictEqual(types(ev), ['hurt']);
  assert.strictEqual(hurtHero(s, 1, 10.5, 6, []), 'ignored', 'invulnerable');
  assert.strictEqual(INVULN_TIME, 1.3, 'invulnerability knob (ticket P4a-fix, max 1.3 s)');
  run(s, {}, 77);
  assert.strictEqual(hurtHero(s, 1, 10.5, 6, []), 'ignored', 'still invulnerable just under 1.3 s');
  run(s, {}, 1);
  assert.strictEqual(hurtHero(s, 1, s.hero.x + 0.5, 6, []), 'hurt', 'vulnerable after 1.3 s');
  assert.strictEqual(s.hero.hearts, 3);

  const contact = quiet();
  spawnEnemy(contact, 'goblin', 10, 6.45);
  const cev = run(contact, {}, 1);
  assert(types(cev).includes('hurt'), 'contact within 0.5');
  const far = quiet();
  const farGoblin = spawnEnemy(far, 'goblin', 10, 6.9);
  farGoblin.chickenUntil = 1e9;
  assert(!types(run(far, {}, 1)).includes('hurt'));

  const sh = quiet('guided', ['stop-sign-shield']);
  run(sh, { block: true }, 1);
  assert.strictEqual(sh.hero.facing, 'down');
  ev = [];
  const shGob = spawnEnemy(sh, 'goblin', 10, 6.5);
  assert.strictEqual(hurtHero(sh, 1, shGob.x, shGob.y, ev, shGob), 'blocked', 'frontal blocked');
  assert.strictEqual(sh.hero.hearts, 5);
  assert.strictEqual(sh.hero.invulnUntil, 0, 'blocked hit gives no invulnerability');
  assert.deepStrictEqual([sh.hero.x, sh.hero.y], [10, 6], 'blocking hero is not pushed');
  close(shGob.y, 6.5 + 0.8, 1e-9, 'blocked hit knocks the enemy back 0.8');
  close(sh.hero.blockGraceUntil - sh.time, 0.4, 1e-9, 'block grace 0.4 s');
  assert.deepStrictEqual(types(ev), ['block']);
  const graceEv = [];
  assert.strictEqual(hurtHero(sh, 1, shGob.x, shGob.y, graceEv, shGob), 'blocked', 'blocked during grace');
  close(shGob.y, 7.3, 1e-9, 'no re-push during grace');
  assert.deepStrictEqual(graceEv, [], 'grace hits are silent');
  assert.strictEqual(hurtHero(sh, 1, 10 + Math.sin(55 * Math.PI / 180), sh.hero.y + Math.cos(55 * Math.PI / 180), []), 'blocked', '55 deg blocked');
  assert.strictEqual(hurtHero(sh, 1, 10, sh.hero.y - 0.5, []), 'hurt', 'rear hit not blocked');
  assert.strictEqual(sh.hero.hearts, 4);
  sh.hero.invulnUntil = 0;
  assert.strictEqual(hurtHero(sh, 1, 10.5, sh.hero.y, []), 'hurt', '90 deg side hit not blocked');

  const helm = quiet('standard', ['scam-spotter-helmet']);
  step(helm, {}, DT);
  hurtHero(helm, 2, 10.5, 6, []);
  assert.strictEqual(helm.hero.hearts, 4, 'helmet -1');
  helm.hero.invulnUntil = 0;
  hurtHero(helm, 2, 10.5, 6, []);
  assert.strictEqual(helm.hero.hearts, 2, 'helmet gated 5 s');
  helm.hero.hearts = 5;
  helm.hero.invulnUntil = 0;
  hurtHero(helm, 1, 10.5, 6, []);
  assert.strictEqual(helm.hero.hearts, 4, 'min 1');
  run(helm, {}, 301);
  helm.hero.invulnUntil = 0;
  hurtHero(helm, 2, helm.hero.x + 0.5, 6, []);
  assert.strictEqual(helm.hero.hearts, 3, 'helmet ready again after 5 s');
  assert.strictEqual(spawnEnemy(helm, 'mimic', 3, 3).revealed, true, 'helmet reveals mimics from spawn');
  assert.strictEqual(spawnEnemy(quiet(), 'mimic', 3, 3).revealed, false, 'mimic hidden without helmet');
}

// ---------- rune ----------
{
  const s = quiet('guided', ['rename-rune']);
  s.hero.invulnUntil = 1e9;
  const boss = spawnEnemy(s, 'mega-slime', 10, 7.5);
  const nearGoblin = spawnEnemy(s, 'goblin', 12, 6);
  spawnEnemy(s, 'slime', 13, 6);
  spawnEnemy(s, 'slime', 10, 9.5);
  boss.chickenUntil = 0;
  assert.strictEqual(runeTarget(s), nearGoblin, 'nearest non-boss');
  const ev = press(s, 'ability');
  assert(types(ev).includes('chicken'));
  close(nearGoblin.chickenUntil - s.time, 3, 1e-9, 'chicken 3 s');
  close(s.cooldowns.rune - s.time, 8, 1e-9, 'rune cooldown 8');

  const empty = quiet('guided', ['rename-rune']);
  spawnEnemy(empty, 'slime', 10, 10.5);
  spawnEnemy(empty, 'mega-slime', 10, 8);
  const ev2 = press(empty, 'ability');
  assert(!types(ev2).includes('chicken'), 'no target in range 4 (boss excluded)');
  assert.strictEqual(empty.cooldowns.rune, 0, 'cooldown not consumed on miss');

  const safe = quiet('guided', ['rename-rune', 'start-blade']);
  const g = spawnEnemy(safe, 'goblin', 10, 6.3);
  assert(types(step(safe, { ability: true }, DT).events).includes('chicken'));
  run(safe, {}, 90);
  assert.strictEqual(safe.hero.hearts, 5, 'chicken deals no damage');
  g.x = 10; g.y = 7;
  press(safe, 'attack');
  assert.strictEqual(g.hp, 1, 'chicken takes damage normally');
  run(safe, {}, 120);
  assert(g.chickenUntil <= safe.time, 'chicken expires');
}

// ---------- staff ----------
{
  const s = quiet('standard', ['copy-crystal-staff']);
  s.hero.facing = 'right';
  const target = spawnEnemy(s, 'mimic', 13, 6);
  const ev = press(s, 'ability');
  const boltEvent = ev.find((e) => e.type === 'bolt');
  assert(boltEvent && boltEvent.ids.length === 2, 'twin bolts');
  close(s.bolts[1].y - s.bolts[0].y, 0.35, 1e-9, 'twin offset 0.35');
  close(s.cooldowns.staff - s.time, 0.5, 1e-9, 'staff cooldown');
  assert(!types(press(s, 'ability')).includes('bolt'), 'staff cooldown respected');
  run(s, {}, 30);
  assert.strictEqual(target.hp, 2, 'both bolts hit for 1 each');
  assert.strictEqual(s.bolts.length, 0);

  const wall = quiet('standard', ['copy-crystal-staff']);
  wall.hero.x = 11; wall.hero.y = 3.5; wall.hero.facing = 'right';
  const hidden = spawnEnemy(wall, 'mimic', 16, 3.5);
  press(wall, 'ability');
  run(wall, {}, 60);
  assert.strictEqual(hidden.hp, 4, 'bolts stop at a block');
  assert.strictEqual(wall.bolts.length, 0);

  const range = quiet('standard', ['copy-crystal-staff']);
  range.hero.facing = 'right';
  range.hero.x = 3;
  const distant = spawnEnemy(range, 'mimic', 9.8, 6);
  press(range, 'ability');
  run(range, {}, 60);
  assert.strictEqual(distant.hp, 4, 'range 6');

  const both = quiet('standard', ['copy-crystal-staff']);
  both.gear.rune = true;
  spawnEnemy(both, 'slime', 11, 6);
  const bev = press(both, 'ability');
  assert(types(bev).includes('bolt') && !types(bev).includes('chicken'), 'E uses the staff when both');
}

// ---------- apple ----------
{
  const s = quiet('guided', ['folder-backpack']);
  assert.strictEqual(s.hero.apple, true);
  s.hero.hearts = 2;
  assert(types(press(s, 'apple')).includes('heal'));
  assert.strictEqual(s.hero.hearts, 4);
  assert.strictEqual(s.hero.apple, false);
  s.hero.hearts = 1;
  press(s, 'apple');
  assert.strictEqual(s.hero.hearts, 1, 'apple once');
  const cap = quiet('guided', ['folder-backpack']);
  cap.hero.hearts = 4;
  press(cap, 'apple');
  assert.strictEqual(cap.hero.hearts, 5, 'capped at max');
  const none = quiet();
  none.hero.hearts = 2;
  press(none, 'apple');
  assert.strictEqual(none.hero.hearts, 2, 'no backpack no apple');
}

// ---------- save stone ----------
{
  const s = quiet('standard', ['save-stone']);
  assert.deepStrictEqual(s.hero.stone, { x: 10, y: 6, used: false });
  run(s, { right: true }, 30);
  press(s, 'stone');
  close(s.hero.stone.x, 12.25, 1e-6, 'stone moved');
  run(s, { left: true }, 30);
  press(s, 'stone');
  close(s.hero.stone.x, 12.25, 1e-6, 'stone cooldown 1 s');
  s.hero.hearts = 1;
  const ev = [];
  hurtHero(s, 2, s.hero.x + 0.5, s.hero.y, ev);
  assert(types(ev).includes('revive'));
  assert.strictEqual(s.hero.hearts, 3);
  close(s.hero.x, 12.25, 1e-6, 'revive at stone');
  close(s.hero.invulnUntil - s.time, 1.5, 1e-9);
  assert.strictEqual(s.phase, 'playing');
  s.hero.hearts = 1;
  s.hero.invulnUntil = 0;
  const ev2 = [];
  hurtHero(s, 1, s.hero.x + 0.5, s.hero.y, ev2);
  assert.deepStrictEqual(types(ev2), ['hurt', 'end'], 'revive once');
  assert.strictEqual(s.outcome, 'fell');
}

// ---------- undo amulet ----------
{
  const s = quiet('standard', ['undo-amulet']);
  s.hero.invulnUntil = 1e9;
  run(s, {}, 60);
  run(s, { left: true }, 60);
  s.hero.hearts = 2;
  run(s, { left: true }, 120);
  assert(s.hero.x < 3);
  const ev = press(s, 'undo');
  assert(types(ev).includes('undo'));
  assert(Math.abs(s.hero.x - 10) < 0.2, `undo restores position from ~3 s ago (x=${s.hero.x})`);
  assert.strictEqual(s.hero.hearts, 5, 'undo restores hearts');
  assert.strictEqual(s.hero.amuletUsed, true);
  run(s, { left: true }, 60);
  const x = s.hero.x;
  press(s, 'undo');
  assert.strictEqual(s.hero.x, x, 'undo once');
  const noAmulet = quiet();
  run(noAmulet, { left: true }, 60);
  const nx = noAmulet.hero.x;
  press(noAmulet, 'undo');
  close(noAmulet.hero.x, nx, 1e-9, 'no amulet no undo');
}

// ---------- enemies ----------
{
  const s = quiet();
  s.hero.invulnUntil = 1e9;
  const mega = spawnEnemy(s, 'mega-slime', 10, 7.5);
  mega.hp = 1;
  const ev = press(s, 'attack');
  assert(types(ev).includes('poof'));
  assert.strictEqual(s.enemies.filter((e) => e.type === 'slime').length, 2, 'mega slime splits into 2 slimes');
  assert.strictEqual(s.poofs, 1);

  const g = quiet();
  g.hero.invulnUntil = 1e9;
  const glitch = spawnEnemy(g, 'big-glitch', 3, 6);
  const gev = run(g, {}, 300);
  const warn = gev.find((e) => e.type === 'warn');
  const tele = gev.find((e) => e.type === 'teleport');
  assert(warn && tele, 'warn + teleport');
  assert(warn.t < tele.t);
  close(tele.t - warn.t, 0.5, DT + 1e-9, 'warning 0.5 s before teleport');
  close(tele.t, 4, DT + 1e-9, 'teleports every 4 s');
  assert(glitch.x > 3);

  const m = quiet();
  const mimic = spawnEnemy(m, 'mimic', 13, 6);
  run(m, {}, 60);
  assert.strictEqual(mimic.state, 'idle');
  assert.deepStrictEqual([mimic.x, mimic.y], [13, 6], 'idle mimic stays put outside 2.5');
  mimic.x = 12.4;
  run(m, {}, 1);
  assert.strictEqual(mimic.state, 'lunge', 'lunges within 2.5');
  const m2 = quiet();
  const biter = spawnEnemy(m2, 'mimic', 10, 6.4);
  step(m2, {}, DT);
  biter.state = 'rest';
  biter.stateUntil = m2.time + 0.5;
  m2.hero.hearts = 5; m2.hero.invulnUntil = 0;
  run(m2, {}, 25);
  assert.strictEqual(m2.hero.hearts, 5, 'no bite outside lunge');
  const bev = run(m2, {}, 30);
  const hurt = bev.find((e) => e.type === 'hurt');
  assert(hurt && hurt.dmg === 1, 'bite dmg 1 during lunge');

  const slimeState = quiet();
  slimeState.hero.invulnUntil = 1e9;
  const hop = spawnEnemy(slimeState, 'slime', 3, 6);
  run(slimeState, {}, 18);
  const moved = hop.x;
  assert(moved > 3, 'slime hops first');
  run(slimeState, {}, 22);
  close(hop.x, moved, 1e-9, 'slime pauses between hops');
  run(slimeState, {}, 20);
  assert(hop.x > moved, 'slime hops again');
}

// ---------- waves and outcomes ----------
{
  const s = createBattle({ cq: gearCq('standard'), lesson: getLesson('s1'), rng: seeded(7) });
  s.hero.invulnUntil = 1e9;
  const one = (delay) => [{ type: 'slime', delay, edge: 'top', pos: 0 }];
  s.plan = [one(0), one(0.5), one(0), one(0), one(0)];
  run(s, {}, 1);
  assert.strictEqual(s.enemies.length, 1);
  s.enemies.length = 0;
  run(s, {}, 1);
  const cleared = s.waveClearedAt;
  assert(cleared !== null);
  const ev = run(s, {}, 200);
  const wave2 = ev.find((e) => e.type === 'wave');
  assert.strictEqual(wave2.wave, 2);
  close(wave2.t - cleared, 2.5, DT + 1e-9, 'next wave 2.5 s after clear');
  assert.strictEqual(s.enemies.length, 1, 'wave 2 spawned over its delays');
  s.enemies.length = 0;
  for (let w = 3; w <= 5; w += 1) {
    const evw = run(s, {}, 200);
    assert(evw.some((e) => e.type === 'wave' && e.wave === w), `wave ${w} starts`);
    assert.strictEqual(s.phase, 'playing', `no victory before wave 5 is cleared (wave ${w})`);
    s.enemies.length = 0;
  }
  const end = run(s, {}, 2);
  assert.strictEqual(s.wave, 5);
  assert.deepStrictEqual(end.filter((e) => e.type === 'end').map((e) => e.outcome), ['victory']);
  assert.strictEqual(s.phase, 'ended');
  const r = resultOf(s);
  assert.strictEqual(r.outcome, 'victory');
  assert.strictEqual(r.ms, Math.round(s.time * 1000));
  const t = s.time;
  run(s, { right: true }, 10);
  assert.strictEqual(s.time, t, 'ended battle is frozen');

  // Full 5:00 timer: an untouchable idle hero in a never-ending wave ends as 'time' at step 18000.
  const full = quiet();
  assert.strictEqual(full.timeLeft, 300);
  full.hero.invulnUntil = 1e9;
  for (let i = 1; i < 18000; i += 1) step(full, {}, DT);
  assert.strictEqual(full.phase, 'playing', 'still playing at step 17999');
  const last = step(full, {}, DT).events;
  assert(last.some((e) => e.type === 'end' && e.outcome === 'time'), "'time' at step 18000");
  assert.strictEqual(resultOf(full).ms, 300000);

  const timer = quiet();
  timer.timeLeft = 0.01;
  const tev = run(timer, {}, 1);
  assert(tev.some((e) => e.type === 'end' && e.outcome === 'time'));
  assert.strictEqual(timer.timeLeft, 0);

  const fell = quiet();
  step(fell, {}, DT);
  fell.hero.hearts = 1;
  hurtHero(fell, 1, 10.5, 6, []);
  assert.deepStrictEqual(resultOf(fell), { outcome: 'fell', ms: 17, poofs: 0 });
  assert.deepStrictEqual(resultOf(quiet()), { outcome: null, ms: 0, poofs: 0 });

  const p = quiet();
  run(p, {}, 10);
  const before = p.time;
  const pev = run(p, { pause: true }, 60);
  assert.strictEqual(p.phase, 'paused');
  assert.strictEqual(p.time, before, 'pause freezes time');
  assert.deepStrictEqual(types(pev), ['pause']);
  run(p, { pause: false }, 1);
  run(p, { pause: true }, 1);
  assert.strictEqual(p.phase, 'playing');
  run(p, {}, 1);
  assert(p.time > before);

  // Full real run: an idle hero eventually ends the battle one way or another, deterministically.
  const real = createBattle({ cq: gearCq('guided'), lesson: getLesson('g5'), rng: seeded(11) });
  let guard = 0;
  while (real.phase !== 'ended' && guard < 20000) { step(real, {}, DT); guard += 1; }
  assert.strictEqual(real.phase, 'ended');
  assert(['fell', 'time', 'victory'].includes(real.outcome));
}


// ---------- P4a-fix: shield vs its intended enemies ----------
{
  // Reviewer repro: seed 1, shield, hero (10,6) facing down, goblin at (10,9), hold block 600 steps.
  const s = quiet('guided', ['stop-sign-shield'], 1);
  step(s, { down: true }, DT);
  s.hero.x = 10; s.hero.y = 6;
  assert.strictEqual(s.hero.facing, 'down');
  spawnEnemy(s, 'goblin', 10, 9);
  let blocks = 0;
  let maxMove = 0;
  for (let i = 0; i < 600; i += 1) {
    const ev = step(s, { block: true }, DT).events;
    blocks += ev.filter((e) => e.type === 'block').length;
    assert(!ev.some((e) => e.type === 'hurt'), 'blocking hero never hurt by a frontal goblin');
    maxMove = Math.max(maxMove, Math.hypot(s.hero.x - 10, s.hero.y - 6));
  }
  assert.strictEqual(s.hero.hearts, 5, 'hero keeps 5 hearts over 600 steps');
  assert(maxMove <= 0.05, `blocking hero never moves more than 0.05 tiles (moved ${maxMove})`);
  assert(blocks > 0, 'goblin attacks were blocked');

  for (const type of ['slime', 'mega-slime']) {
    const t = quiet('guided', ['stop-sign-shield'], 1);
    step(t, { down: true }, DT);
    t.hero.x = 10; t.hero.y = 6;
    spawnEnemy(t, type, 10, 9);
    run(t, { block: true }, 600);
    assert.strictEqual(t.hero.hearts, 5, `blocking holds vs ${type}`);
    close(t.hero.y, 6, 0.05, `no push vs ${type}`);
  }

  // A source at ~zero distance counts as frontal; the enemy is knocked back along facing.
  const z = quiet('guided', ['stop-sign-shield']);
  run(z, { block: true }, 1);
  const zg = spawnEnemy(z, 'goblin', 10, 6);
  const zev = [];
  assert.strictEqual(hurtHero(z, 1, z.hero.x, z.hero.y, zev, zg), 'blocked', 'zero-distance source is frontal');
  assert.deepStrictEqual([z.hero.x, z.hero.y], [10, 6]);
  close(zg.y, 6.8, 1e-9, 'zero-distance enemy knocked back along facing');
  // Enemy knockback respects solids.
  const w = quiet('guided', ['stop-sign-shield']);
  run(w, { block: true }, 1);
  w.hero.x = 10; w.hero.y = 10.2;
  const wg = spawnEnemy(w, 'goblin', 10, 10.6);
  assert.strictEqual(hurtHero(w, 1, wg.x, wg.y, [], wg), 'blocked');
  close(wg.y, 11 - 0.35, 1e-9, 'enemy knockback stops at the wall');
}

// ---------- P4a-fix: spacing ----------
{
  const s = quiet();
  s.hero.invulnUntil = 1e9;
  [['slime', 3, 3], ['goblin', 17, 9], ['mimic', 11.5, 6], ['mega-slime', 3, 9], ['big-glitch', 17, 3], ['goblin', 10, 6]]
    .forEach(([type, x, y]) => spawnEnemy(s, type, x, y));
  let minD = Infinity;
  for (let i = 0; i < 600; i += 1) {
    step(s, {}, DT);
    s.enemies.forEach((e) => { minD = Math.min(minD, Math.hypot(e.x - s.hero.x, e.y - s.hero.y)); });
  }
  assert(minD >= 0.3, `no enemy center within 0.3 tiles of an idle hero (min ${minD})`);
  assert.strictEqual(s.enemies.length, 6);
  // Real battle, idle invulnerable hero.
  const r = createBattle({ cq: gearCq('guided'), lesson: getLesson('g5'), rng: seeded(4) });
  r.hero.invulnUntil = 1e9;
  let rMin = Infinity;
  for (let i = 0; i < 600; i += 1) {
    step(r, {}, DT);
    r.enemies.forEach((e) => { rMin = Math.min(rMin, Math.hypot(e.x - r.hero.x, e.y - r.hero.y)); });
  }
  assert(rMin >= 0.3, `real battle spacing (min ${rMin})`);
  // Contact damage still applies at the stop distance.
  const c = quiet();
  spawnEnemy(c, 'slime', 10, 8);
  const cev = run(c, {}, 300);
  assert(types(cev).includes('hurt'), 'chaser that stops at contact distance still hurts');
}

// ---------- P4a-fix: obstacle sliding ----------
{
  // [type, enemy x, y, hero x, y, seconds]. The spec'd 5 s bound uses goblins; slow hoppers and the
  // 2x2 boss get a longer budget matching their average speed but must still get around the block.
  for (const [type, ex, ey, hx, hy, secs] of [
    ['goblin', 3.5, 3.5, 7.5, 3.5, 5], ['goblin', 5.5, 1.5, 5.5, 5.5, 5], ['goblin', 16.5, 8.5, 12.5, 8.5, 5],
    ['goblin', 14.5, 10.5, 14.5, 6.5, 5], ['slime', 3.5, 3.5, 7.5, 3.5, 10], ['mega-slime', 2.2, 3.5, 8.5, 3.5, 12],
  ]) {
    const s = quiet();
    s.hero.invulnUntil = 1e9;
    s.hero.x = hx; s.hero.y = hy;
    const e = spawnEnemy(s, type, ex, ey);
    let reached = false;
    for (let i = 0; i < secs * 60 && !reached; i += 1) {
      step(s, {}, DT);
      reached = Math.hypot(e.x - s.hero.x, e.y - s.hero.y) <= ENEMIES[type].contact + 1e-6;
    }
    assert(reached, `${type} behind a block reaches contact range within ${secs} s (at ${e.x.toFixed(2)},${e.y.toFixed(2)})`);
    assert(Math.abs(s.hero.x - hx) < 1e-9 && Math.abs(s.hero.y - hy) < 1e-9, 'hero stayed still');
  }
}

// ---------- P4a-fix: twin bolt against walls ----------
{
  for (const [hx, hy, facing] of [[10, 10.65, 'right'], [18.65, 6, 'up']]) {
    const s = quiet('standard', ['copy-crystal-staff']);
    s.hero.x = hx; s.hero.y = hy; s.hero.facing = facing;
    const ev = press(s, 'ability');
    assert(types(ev).includes('bolt'));
    assert.strictEqual(s.bolts.length, 2, `2 bolts alive after one frame at (${hx},${hy}) facing ${facing}`);
    const twin = s.bolts.find((b) => b.twin);
    const main = s.bolts.find((b) => !b.twin);
    close(Math.hypot(twin.x - main.x, twin.y - main.y), 0.35, 1e-9, 'twin still offset 0.35');
    assert(!isSolid(twin.x, twin.y));
  }
}

// ---------- P4a-fix: goblin scrap ----------
{
  const s = quiet();
  s.hero.invulnUntil = 1e9;
  const g = spawnEnemy(s, 'goblin', 3, 3);
  spawnEnemy(s, 'slime', 17, 3);
  const ev = run(s, {}, 600).filter((e) => e.type === 'scrap');
  assert.deepStrictEqual(ev.map((e) => Math.round(e.t * 10) / 10), [3, 6, 9], 'scrap every 3 s');
  ev.forEach((e) => {
    assert.strictEqual(e.id, g.id);
    assert(Number.isFinite(e.x) && Number.isFinite(e.y));
    assert.deepStrictEqual(Object.keys(e).sort(), ['id', 't', 'type', 'x', 'y']);
  });
}

// ---------- P4a-fix2: melee bonk + stun ----------
{
  assert.deepStrictEqual([MELEE_KNOCKBACK, MELEE_STUN, BOSS_MELEE_KNOCKBACK, BOSS_MELEE_STUN], [0.9, 0.25, 0.5, 0.15]);
  const s = quiet('guided', ['start-blade']);
  const g = spawnEnemy(s, 'goblin', 10, 6.9);
  step(s, {}, DT);
  g.x = 10; g.y = 6.9;
  const yBefore = g.y;
  s.hero.hearts = 5; s.hero.invulnUntil = 1e9;
  step(s, { attack: true }, DT);
  s.hero.invulnUntil = 0;
  assert.strictEqual(g.hp, 1);
  close(g.stunUntil - s.time, 0.25, 1e-9, 'melee stun 0.25 s');
  const knockedY = g.y;
  assert(knockedY - yBefore >= 0.9 - 1e-6, `melee knockback 0.9 (moved ${knockedY - yBefore})`);
  // Stunned: no movement and no contact damage even when on top of the hero.
  g.x = s.hero.x; g.y = s.hero.y + 0.45;
  const stunEv = run(s, {}, 12);
  assert(!types(stunEv).includes('hurt'), 'stunned enemy deals no contact damage');
  close(g.y, s.hero.y + 0.45, 1e-9, 'stunned enemy does not move');
  const after = run(s, {}, 8);
  assert(s.time > g.stunUntil);
  const resumed = after.find((e) => e.type === 'hurt');
  assert(resumed && resumed.t >= g.stunUntil - 1e-9, 'contact damage resumes after the stun');

  // Knockback respects solids.
  const w = quiet('guided', ['start-blade']);
  w.hero.x = 10; w.hero.y = 9.5;
  const wg = spawnEnemy(w, 'goblin', 10, 10.3);
  wg.chickenUntil = 0;
  press(w, 'attack');
  close(wg.y, 11 - 0.35, 1e-9, 'bonk stops at the wall');

  // Bosses: knockback 0.3, stun 0.1.
  const b = quiet();
  b.hero.invulnUntil = 1e9;
  const mega = spawnEnemy(b, 'mega-slime', 10, 7.2);
  step(b, {}, DT);
  mega.y = 7.2;
  const my = mega.y;
  step(b, { attack: true }, DT);
  close(mega.stunUntil - b.time, 0.15, 1e-9, 'boss stun 0.15 s');
  close(mega.y - my, 0.5, 1e-9, 'boss knockback 0.5');
  // Stunned boss: no movement and no contact damage for 0.15 s.
  const bossY = mega.y;
  b.hero.invulnUntil = 0;
  mega.y = b.hero.y + 1.0;
  const stunnedEv = run(b, {}, 8);
  assert(!types(stunnedEv).includes('hurt'), 'stunned boss deals no contact damage');
  close(mega.y, b.hero.y + 1.0, 1e-9, 'stunned boss does not move');
  assert(bossY > my);

  // Bolts: 0.3 knockback, no stun.
  const st = quiet('standard', ['copy-crystal-staff']);
  st.hero.facing = 'right';
  const tgt = spawnEnemy(st, 'mimic', 12.5, 6);
  press(st, 'ability');
  run(st, {}, 20);
  assert.strictEqual(tgt.hp, 2);
  assert.strictEqual(tgt.stunUntil, 0, 'bolts do not stun');

  // A stunned lunging mimic cancels into rest.
  const m = quiet();
  m.hero.invulnUntil = 1e9;
  const mim = spawnEnemy(m, 'mimic', 12, 6);
  run(m, {}, 2);
  assert.strictEqual(mim.state, 'lunge');
  mim.stunUntil = m.time + 0.25;
  run(m, {}, 1);
  assert.strictEqual(mim.state, 'rest', 'stun cancels a lunge into rest');
  assert.strictEqual(ENEMIES.mimic.dmg, 1, 'mimic bite 1');
}

// ---------- length round 2: wave-clear heal + early Mega Slime HP ----------
{
  assert.strictEqual(WAVE_CLEAR_HEAL, 1);
  const one = () => [{ type: 'slime', delay: 0, edge: 'top', pos: 0 }];
  const s = createBattle({ cq: gearCq('standard'), lesson: getLesson('s1'), rng: seeded(3) });
  s.hero.invulnUntil = 1e9;
  s.plan = [one(), one(), one(), one(), one()];
  run(s, {}, 1);
  const heals = [];
  s.hero.hearts = 2;
  for (let w = 2; w <= 5; w += 1) {
    s.enemies.length = 0;
    const before = s.hero.hearts;
    const ev = run(s, {}, 200);
    const waveIdx = ev.findIndex((e) => e.type === 'wave' && e.wave === w);
    const healIdx = ev.findIndex((e) => e.type === 'heal' && e.source === 'wave');
    assert(waveIdx !== -1 && healIdx !== -1 && healIdx < waveIdx, `wave ${w}: heal event with the wave start`);
    heals.push(ev[healIdx].amount);
    assert.strictEqual(s.hero.hearts, Math.min(5, before + 1), `wave ${w}: +1 heart`);
    assert.strictEqual(ev.filter((e) => e.type === 'heal').length, 1, 'one heal per wave start');
  }
  assert.deepStrictEqual(heals, [1, 1, 1, 0], '2 -> 3 -> 4 -> 5, then capped at max');
  assert.strictEqual(s.hero.hearts, 5, 'capped at max hearts');
  s.enemies.length = 0;
  const endEv = run(s, {}, 5);
  assert(!endEv.some((e) => e.type === 'heal'), 'no heal on victory');
  assert.strictEqual(s.outcome, 'victory');
  const first = createBattle({ cq: gearCq('guided'), lesson: getLesson('g1'), rng: seeded(3) });
  first.hero.hearts = 3;
  assert(!run(first, {}, 5).some((e) => e.type === 'heal'), 'wave 1 start gives no heal');

  // Early Mega Slime HP: 4 for n <= 2 (mid-boss and final boss), 6 otherwise; ENEMIES data stays 6.
  assert.strictEqual(ENEMIES['mega-slime'].hp, 6);
  assert.strictEqual(EARLY_MEGA_SLIME_HP, 4);
  assert.deepStrictEqual([1, 2, 3, 4, 5].map((n) => enemyHp('mega-slime', n)), [4, 4, 6, 6, 6]);
  assert.deepStrictEqual([1, 5].map((n) => enemyHp('big-glitch', n)), [12, 12]);
  assert.strictEqual(enemyHp('slime', 1), 2);
  for (const [lessonId, hp] of [['g1', 4], ['s2', 4], ['g3', 6], ['s3', 6]]) {
    const b = createBattle({ cq: gearCq(getLesson(lessonId).track), lesson: getLesson(lessonId), rng: seeded(8) });
    [2, 4].forEach((wi) => {
      const entry = b.plan[wi][b.plan[wi].length - 1];
      if (entry.type !== 'mega-slime') return;
      const e = spawnEnemy(b, entry.type, 10, 3);
      assert.deepStrictEqual([e.hp, e.maxHp], [hp, hp], `${lessonId} wave ${wi + 1} Mega Slime HP ${hp}`);
    });
    // Real spawn path: jump to wave 3 and let the plan spawn the mid-boss.
    b.hero.invulnUntil = 1e9;
    b.wave = 3; b.waveStartedAt = b.time; b.spawnIndex = 0;
    run(b, {}, 6 * 60);
    const mid = b.enemies.find((e) => e.type === 'mega-slime');
    assert(mid, `${lessonId}: mid-boss spawned`);
    assert.strictEqual(mid.maxHp, hp, `${lessonId}: spawned mid-boss HP ${hp}`);
  }
}

// ---------- beginner safety net: Second Wind ----------
{
  assert.strictEqual(SECOND_WIND_MAX_LESSON, 2);
  const fallOnce = (s) => {
    s.hero.invulnUntil = 0;
    s.hero.hearts = 1;
    const ev = [];
    hurtHero(s, 1, s.hero.x + 0.5, s.hero.y, ev);
    return ev;
  };
  for (const n of [1, 2]) {
    const s = quiet('guided', [], 1, n);
    step(s, {}, DT);
    s.hero.x = 7.25; s.hero.y = 4.5;
    assert.strictEqual(s.hero.secondWindUsed, false);
    const ev = fallOnce(s);
    const revive = ev.find((e) => e.type === 'revive');
    assert(revive && revive.source === 'second-wind', `n=${n}: Second Wind fires`);
    assert.strictEqual(s.hero.hearts, s.hero.maxHearts, 'revives to full hearts');
    assert.strictEqual(revive.hearts, 5);
    close(s.hero.invulnUntil - s.time, 1.5, 1e-9, '1.5 s invulnerability');
    close(s.hero.x, 7.25 - 0.6, 1e-9, 'in place (after the hit knockback), no teleport');
    assert.strictEqual(s.phase, 'playing');
    assert.strictEqual(s.hero.secondWindUsed, true);
    const ev2 = fallOnce(s);
    assert.deepStrictEqual(types(ev2), ['hurt', 'end'], `n=${n}: Second Wind only once`);
    assert.strictEqual(s.outcome, 'fell');
  }
  const three = quiet('guided', [], 1, 3);
  step(three, {}, DT);
  assert.deepStrictEqual(types(fallOnce(three)), ['hurt', 'end'], 'n=3: no Second Wind');
  // Save Stone first, then Second Wind, then fell.
  const both = quiet('standard', ['save-stone'], 1, 1);
  step(both, {}, DT);
  both.hero.x = 12; both.hero.y = 8;
  const first = fallOnce(both).find((e) => e.type === 'revive');
  assert.strictEqual(first.source, 'stone', 'stone revive takes priority');
  assert.deepStrictEqual([both.hero.x, both.hero.y, both.hero.hearts, both.hero.secondWindUsed], [10, 6, 3, false]);
  both.hero.x = 13;
  const second = fallOnce(both).find((e) => e.type === 'revive');
  assert.strictEqual(second.source, 'second-wind', 'then Second Wind');
  assert.strictEqual(both.hero.hearts, 5);
  close(both.hero.x, 13 - 0.6, 1e-9, 'Second Wind in place');
  assert.deepStrictEqual(types(fallOnce(both)), ['hurt', 'end'], 'third fall ends the battle');
  assert.strictEqual(resultOf(both).outcome, 'fell');
}

// ---------- separation after knockback / spawn / revive (review repro) ----------
{
  const KEYS = ['up', 'down', 'left', 'right', 'attack', 'block', 'ability', 'stance', 'undo', 'apple', 'stone', 'pause'];
  // Reviewer harness: random held keys re-rolled every 8 steps; counts enemy centers within 0.3 of the
  // hero that are NOT pinned against a solid (a 0.05 probe away from the hero is free).
  const freeOverlaps = (n, track, runIndex, stopAt) => {
    const rin = seeded(runIndex * 7919 + n * 31 + (track === 'guided' ? 1 : 2) + 12345);
    const all = track === 'guided' ? GUIDED_ALL : STANDARD_ALL;
    const ids = runIndex % 4 === 0 ? all : all.filter(() => rin() < 0.5);
    const st = createBattle({ cq: gearCq(track, ids), lesson: { number: n, track }, rng: seeded(runIndex + 1000 * n + 77) });
    let input = {};
    let free = 0;
    for (let i = 0; i < stopAt && st.phase !== 'ended'; i += 1) {
      if (i % 8 === 0) { input = {}; KEYS.forEach((k) => { input[k] = k === 'pause' ? false : rin() < 0.35; }); }
      step(st, input, DT);
      if (st.phase !== 'playing') continue;
      const h = st.hero;
      st.enemies.forEach((e) => {
        const d = Math.hypot(e.x - h.x, e.y - h.y);
        if (d >= 0.3) return;
        const ux = d > 1e-9 ? (e.x - h.x) / d : 0;
        const uy = d > 1e-9 ? (e.y - h.y) / d : 0;
        const pinned = d < 1e-9 || boxHitsSolid(e.x + ux * 0.05, e.y + uy * 0.05, ENEMIES[e.type].radius);
        if (!pinned) free += 1;
      });
    }
    return free;
  };
  // s1, rng seed 1077 (run 0), through the reported step 6860.
  assert.strictEqual(freeOverlaps(1, 'standard', 0, 6861), 0, 'review repro s1 seed 1077 step 6860: no free overlap');
  let total = 0;
  let battles = 0;
  for (let n = 1; n <= 5; n += 1) {
    for (const track of ['guided', 'standard']) {
      for (let r = 0; r < 20; r += 1) { total += freeOverlaps(n, track, r, 18000); battles += 1; }
    }
  }
  assert.strictEqual(battles, 200);
  assert.strictEqual(total, 0, `non-pinned overlaps within 0.3 across 200 battles: ${total}`);
}

// ---------- P4a-fix2: guided lesson 5 mimic plan ----------
for (let seed = 1; seed <= 20; seed += 1) {
  const g = wavePlan(5, 'guided', seeded(seed)).map((w) => w.filter((e) => e.type === 'mimic').length);
  assert.deepStrictEqual(g, [0, 1, 0, 0, 0], 'guided n=5: exactly 1 mimic, in wave 2');
  const sp = wavePlan(5, 'standard', seeded(seed)).map((w) => w.filter((e) => e.type === 'mimic').length);
  assert.deepStrictEqual(sp, [0, 1, 0, 1, 1], 'standard n=5: 1 mimic in waves 2, 4 and 5');
}

// ---------- P4a-fix2: heart drops ----------
{
  assert.strictEqual(HEART_DROP_CHANCE, 1 / 8);
  // Determinism: same seed => identical drops; over many poofs roughly 1 in 8 drop, bosses never.
  const dropRun = (seed) => {
    const s = quiet('standard', [], seed);
    s.hero.invulnUntil = 1e9;
    const drops = [];
    for (let i = 0; i < 400; i += 1) {
      const e = spawnEnemy(s, i % 50 === 0 ? 'big-glitch' : 'slime', 3, 3);
      const ev = [];
      e.hp = 1;
      // eslint-disable-next-line no-loop-func
      s.enemies.splice(s.enemies.indexOf(e), 1);
      s.enemies.push(e);
      hurtEnemyForTest(s, e, ev);
      ev.filter((x) => x.type === 'drop').forEach((x) => drops.push([i, x.x, x.y]));
    }
    return { drops, pickups: s.pickups.length };
  };
  const a = dropRun(21);
  const b = dropRun(21);
  assert.deepStrictEqual(a, b, 'heart drops are deterministic for a seed');
  assert.notDeepStrictEqual(dropRun(22).drops, a.drops, 'different seed, different drops');
  assert(a.drops.length >= 25 && a.drops.length <= 80, `about 1 in 8 poofs drop a heart (${a.drops.length}/400)`);
  assert(a.drops.every(([i]) => i % 50 !== 0), 'bosses never drop hearts');

  // Pickup heals +1, capped, and emits pickup { id, heal }.
  const p = quiet();
  p.hero.hearts = 3;
  p.pickups.push({ id: 900, type: 'heart', x: 10.4, y: 6, until: 5 });
  const ev = run(p, {}, 1);
  const pick = ev.find((e) => e.type === 'pickup');
  assert(pick && pick.id === 900 && pick.heal === 1, 'pickup event');
  assert.strictEqual(p.hero.hearts, 4);
  assert.strictEqual(p.pickups.length, 0);
  p.hero.hearts = 5;
  p.pickups.push({ id: 901, type: 'heart', x: 10, y: 6.5, until: 5 });
  const capEv = run(p, {}, 1).find((e) => e.type === 'pickup');
  assert.strictEqual(p.hero.hearts, 5, 'no heal above max');
  assert.strictEqual(capEv, undefined, 'full hearts: pickup not consumed, no event');
  assert.deepStrictEqual(p.pickups.map((x) => x.id), [901], 'full hearts: heart stays on the ground');
  p.hero.hearts = 4;
  const laterEv = run(p, {}, 1).find((e) => e.type === 'pickup');
  assert(laterEv && laterEv.id === 901 && laterEv.heal === 1, 'picked up once hearts are missing');
  assert.strictEqual(p.hero.hearts, 5);
  // Out of range stays; expires after its time.
  p.pickups.push({ id: 902, type: 'heart', x: 3, y: 3, until: p.time + 8 });
  run(p, {}, 60);
  assert.strictEqual(p.pickups.length, 1, 'pickup out of range stays');
  run(p, {}, 8 * 60);
  assert.strictEqual(p.pickups.length, 0, 'pickup despawns after 8 s');
  // Real poof path: a melee kill can drop (seeded) and a createBattle state starts with no pickups.
  assert.deepStrictEqual(createBattle({ cq: gearCq('guided'), lesson: getLesson('g1'), rng: seeded(1) }).pickups, []);
}

// ---------- P4a-fix2: balance bot harness ----------
const dominantDir = (dx, dy) => (Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
const KEY_VEC = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };

// Movement toward (tx, ty) with the same obstacle rule as enemy chase(): when the dominant axis
// makes no progress, also hold the perpendicular key in a remembered slide direction (sign of the
// minor offset, else toward the arena center) until the dominant axis moves again.
function botMoveToward(st, mem, tx, ty, inp) {
  const h = st.hero;
  const dx = tx - h.x;
  const dy = ty - h.y;
  const alongX = Math.abs(dx) >= Math.abs(dy);
  if (mem.lastMove && mem.lastAlongX === alongX) {
    const progress = alongX ? Math.abs(h.x - mem.lastX) : Math.abs(h.y - mem.lastY);
    if (progress < mem.lastExpect * 0.3) {
      if (!mem.slideDir) {
        const minor = alongX ? dy : dx;
        const d = Math.hypot(dx, dy);
        const toCenter = alongX ? ARENA.heroSpawn.y - h.y : ARENA.heroSpawn.x - h.x;
        mem.slideDir = Math.abs(minor) > 0.05 * d ? (minor > 0 ? 1 : -1) : (toCenter < 0 ? -1 : 1);
      } else if (Math.abs(alongX ? h.y - mem.lastY : h.x - mem.lastX) < 1e-9) {
        mem.slideDir = -mem.slideDir; // slide axis blocked too: try the other way
      }
    } else {
      mem.slideDir = 0;
    }
  } else if (mem.lastAlongX !== alongX) {
    mem.slideDir = 0;
  }
  const primary = alongX ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  inp[primary] = true;
  if (mem.slideDir) {
    inp[alongX ? (mem.slideDir > 0 ? 'down' : 'up') : (mem.slideDir > 0 ? 'right' : 'left')] = true;
  } else if (alongX ? Math.abs(dy) > 0.1 : Math.abs(dx) > 0.1) {
    inp[alongX ? (dy > 0 ? 'down' : 'up') : (dx > 0 ? 'right' : 'left')] = true;
  }
  let mx = 0; let my = 0;
  Object.keys(KEY_VEC).forEach((k) => { if (inp[k]) { mx += KEY_VEC[k][0]; my += KEY_VEC[k][1]; } });
  const n = Math.hypot(mx, my) || 1;
  mem.lastMove = true;
  mem.lastAlongX = alongX;
  mem.lastX = h.x;
  mem.lastY = h.y;
  mem.lastExpect = heroSpeed(st) * DT * Math.abs(alongX ? mx : my) / n;
}

// Deterministic acceptance bot: face the nearest enemy and swing. Shield never used.
function balanceBot(st, useAbilities, mem) {
  const h = st.hero;
  const inp = {};
  if (h.apple && h.hearts <= 2 && !st.lastInput.apple) inp.apple = true;
  let best = null;
  let bd = Infinity;
  st.enemies.forEach((e) => { const d = Math.hypot(e.x - h.x, e.y - h.y); if (d < bd) { bd = d; best = e; } });
  let moved = false;
  if (h.hearts <= 3 && bd > 1.5) {
    let heart = null;
    let hd = Infinity;
    (st.pickups || []).forEach((p) => { const d = Math.hypot(p.x - h.x, p.y - h.y); if (d <= 3 && d < hd) { hd = d; heart = p; } });
    if (heart) { botMoveToward(st, mem, heart.x, heart.y, inp); moved = true; }
  }
  if (!moved && best) {
    const reach = meleeStats(st.gear, h.stance).reach + (ENEMIES[best.type].size >= 2 ? 0.5 : 0);
    const dx = best.x - h.x;
    const dy = best.y - h.y;
    const want = dominantDir(dx, dy);
    if (bd > reach - 0.1) {
      botMoveToward(st, mem, best.x, best.y, inp);
      moved = true;
    } else if (h.facing !== want) {
      inp[want] = true;
    } else if (st.time >= h.attackCooldownUntil && !st.lastInput.attack) {
      inp.attack = true;
    }
  }
  if (!moved) { mem.lastMove = false; mem.slideDir = 0; }
  if (useAbilities && best) {
    const ready = st.gear.staff ? st.time >= st.cooldowns.staff : st.time >= st.cooldowns.rune;
    if ((st.gear.staff || st.gear.rune) && ready && bd <= 4 && !st.lastInput.ability) inp.ability = true;
    if (st.gear.amulet && !h.amuletUsed && h.hearts <= 2 && !st.lastInput.undo) inp.undo = true;
  }
  return inp;
}

// Bot slides around a block to reach an enemy on the far side.
{
  const s = quiet();
  s.hero.invulnUntil = 1e9;
  s.hero.x = 3.5; s.hero.y = 3.5;
  const target = spawnEnemy(s, 'mimic', 8.5, 3.5);
  target.chickenUntil = 1e9;
  const mem = {};
  let reached = false;
  for (let i = 0; i < 300 && !reached; i += 1) {
    step(s, balanceBot(s, false, mem), DT);
    reached = Math.hypot(target.x - s.hero.x, target.y - s.hero.y) <= 1.0;
  }
  assert(reached, `bot slides around a block (hero at ${s.hero.x.toFixed(2)},${s.hero.y.toFixed(2)})`);
}

const BALANCE_SEEDS = 100;
const balance = [];
const balanceStart = Date.now();
for (const [lessonId, ids, target] of [['g1', [], 0.7], ['s1', [], 0.6], ['g5', GUIDED_ALL, 0.8], ['s5', STANDARD_ALL, 0.8]]) {
  const lesson = getLesson(lessonId);
  let wins = 0;
  const times = [];
  const outcomes = {};
  for (let seed = 1; seed <= BALANCE_SEEDS; seed += 1) {
    const st = createBattle({ cq: gearCq(lesson.track, ids), lesson, rng: seeded(seed) });
    const mem = {};
    for (let i = 0; i < 20000 && st.phase !== 'ended'; i += 1) step(st, balanceBot(st, ids.length > 0, mem), DT);
    const r = resultOf(st);
    outcomes[r.outcome] = (outcomes[r.outcome] || 0) + 1;
    if (r.outcome === 'victory') { wins += 1; times.push(r.ms / 1000); }
  }
  times.sort((a, b) => a - b);
  const median = times.length ? times[Math.floor(times.length / 2)] : null;
  balance.push({ lessonId, gear: ids.length ? 'full set' : 'bare', winRate: wins / BALANCE_SEEDS, target, medianClear: median, outcomes });
}
console.log(`battle balance (bot, ${BALANCE_SEEDS} seeds each, ${((Date.now() - balanceStart) / 1000).toFixed(1)}s):`);
balance.forEach((b) => console.log(`  ${b.lessonId} ${b.gear}: win ${(b.winRate * 100).toFixed(0)}% (target ${Math.round(b.target * 100)}%), median clear ${b.medianClear}s, ${JSON.stringify(b.outcomes)}`));
// §2 targets (round 2 + length round 2), enforced in every run.
balance.forEach((b) => assert(b.winRate >= b.target, `${b.lessonId} win rate ${b.winRate} < ${b.target}`));

console.log('ok — Computer Quest battle content + deterministic engine pass');
