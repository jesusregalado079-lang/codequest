// Battle specials: the power meter (fills from poofs) and each lesson's F-key spell. Deterministic engine
// tests, one controlled arena per spell (see quiet()), plus the key mapping and the how-to line.
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { normalizeCq } from '../src/cq/character.js';
import { ENEMIES } from '../src/cq/battle/content.js';
import { createBattle, hurtHero, isChicken, spawnEnemy, step } from '../src/cq/battle/engine.js';
import { POWER_GAIN, SPECIAL_MAX, SPECIALS, specialFor } from '../src/cq/battle/specials.js';
import { howToKeys, keyAction } from '../src/cq/battle/view.js';

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

// A battle with a controlled arena: no scheduled spawns (wave 1 never clears), hero at the arena
// center (10, 6), and a full power meter unless told otherwise.
function quiet(track, lessonNumber, { power = SPECIAL_MAX, hearts = null } = {}) {
  const state = createBattle({ cq: normalizeCq({ track }), lesson: { number: lessonNumber, track }, rng: seeded(7) });
  state.plan = [[{ type: 'slime', delay: 1e9, edge: 'top', pos: 0 }], [], []];
  state.hero.power = power;
  if (hearts !== null) state.hero.hearts = hearts;
  return state;
}
const run = (state, input, steps) => {
  const events = [];
  for (let i = 0; i < steps; i += 1) events.push(...step(state, input, DT).events);
  return events;
};
const press = (state, key) => { step(state, {}, DT); return step(state, { [key]: true }, DT).events; };
const types = (events) => events.map((e) => e.type);
const cast = (state) => press(state, 'special');
const at = (state, type, x, y) => spawnEnemy(state, type, x, y);
const still = (enemy) => { enemy.stunUntil = 1e9; return enemy; }; // hold a target in place so distances stay exact

// ---------- source hygiene ----------
{
  const src = readFileSync(new URL('../src/cq/battle/specials.js', import.meta.url), 'utf8');
  assert(!/Math\.random/.test(src) && !/\bDate\b/.test(src), 'specials.js is pure data: no Math.random, no Date');
}

// ---------- data: ten spells, equal tiers, plain copies ----------
{
  const kinds = ['burst', 'dash', 'fort', 'rename', 'freeze', 'save', 'volley', 'blast', 'clear'];
  const ids = new Set();
  ['guided', 'standard'].forEach((track) => {
    assert.strictEqual(SPECIALS[track].length, 5, `${track}: one spell per lesson`);
    for (let n = 1; n <= 5; n += 1) {
      const sp = specialFor(track, n);
      assert(sp.name && sp.id && kinds.includes(sp.kind), `${track} ${n}: named spell with a known kind`);
      assert(!ids.has(sp.id), `${sp.id} is unique`);
      ids.add(sp.id);
    }
  });
  assert.strictEqual(ids.size, 10, 'ten different spells');
  assert.strictEqual(specialFor('standard', 0).id, specialFor('standard', 1).id, 'lesson clamps low');
  assert.strictEqual(specialFor('guided', 99).id, specialFor('guided', 5).id, 'lesson clamps high');
  assert.strictEqual(specialFor('guided', 'x').id, specialFor('guided', 1).id, 'a junk lesson number reads as lesson 1');
  assert.strictEqual(specialFor('nope', 1).id, specialFor('standard', 1).id, 'an unknown track reads as standard');
  const copy = specialFor('guided', 1);
  copy.name = 'changed';
  assert.notStrictEqual(SPECIALS.guided[0].name, 'changed', 'specialFor returns a copy');
  const s = createBattle({ cq: normalizeCq({ track: 'guided' }), lesson: { number: 3, track: 'guided' }, rng: seeded(1) });
  assert.strictEqual(s.special.id, 'folder-fort', 'battle 3 on the guided track casts Folder Fort');
  assert.strictEqual(s.hero.power, 0, 'a battle starts with an empty meter');
}

// ---------- the meter ----------
{
  const s = quiet('standard', 3, { power: 0 });
  const kill = (type, x, y) => {
    const e = at(s, type, x, y);
    e.hp = 1; e.stunUntil = 0;
    s.hero.x = x - 0.7; s.hero.y = y; s.hero.facing = 'right';
    s.hero.attackCooldownUntil = 0; s.lastInput.attack = false;
    return run(s, { attack: true }, 3);
  };
  s.hero.invulnUntil = 1e9;
  kill('slime', 6.5, 4.5);
  close(s.hero.power, POWER_GAIN.slime, 1e-9, 'a slime adds its points');
  kill('goblin', 6.5, 4.5);
  close(s.hero.power, POWER_GAIN.slime + POWER_GAIN.goblin, 1e-9, 'a goblin adds its points');
  kill('mimic', 6.5, 4.5);
  close(s.hero.power, 2 + 2 + POWER_GAIN.mimic, 1e-9, 'a mimic adds more');
  const ev = [];
  for (let i = 0; i < 6; i += 1) ev.push(...kill('slime', 6.5, 4.5));
  assert.strictEqual(s.hero.power, SPECIAL_MAX, 'the meter is capped at full');
  assert.strictEqual(ev.filter((e) => e.type === 'power' && e.ready).length, 1, 'one READY event when it fills, not one per poof');
  const more = kill('slime', 6.5, 4.5);
  assert.strictEqual(s.hero.power, SPECIAL_MAX, 'stays capped');
  assert(!types(more).includes('power'), 'no READY event when already full');
  Object.keys(POWER_GAIN).forEach((type) => assert(ENEMIES[type], `${type} in POWER_GAIN is a real monster`));
  // Losing hearts never drains the meter.
  s.hero.invulnUntil = 0;
  hurtHero(s, 1, 3, 3, []);
  assert.strictEqual(s.hero.power, SPECIAL_MAX, 'being hurt does not drain the meter');
}

// ---------- pressing F ----------
{
  const s = quiet('guided', 1, { power: 10 });
  const ev = cast(s);
  assert(types(ev).includes('special-wait') && !types(ev).includes('special'), 'not full: a soft "not ready" event, no spell');
  assert.strictEqual(s.hero.power, 10, 'a failed press spends nothing');
  s.hero.power = SPECIAL_MAX;
  const go = cast(s);
  const sp = go.find((e) => e.type === 'special');
  assert(sp && sp.name === 'Start Burst' && sp.id === 'start-burst', 'the cast event names the spell');
  assert.strictEqual(s.hero.power, 0, 'a cast spends the whole meter');
  assert.strictEqual(s.casting, false, 'the casting flag is cleared afterwards');
  assert(!types(cast(s)).includes('special'), 'an empty meter cannot cast again');
  // Holding F casts once (edge-triggered).
  const held = quiet('guided', 1);
  const heldEv = run(held, { special: true }, 30);
  assert.strictEqual(heldEv.filter((e) => e.type === 'special').length, 1, 'holding F casts once');
  // Not while paused or ended.
  const paused = quiet('guided', 1);
  press(paused, 'pause');
  assert(!types(press(paused, 'special')).includes('special'), 'no cast while paused');
}

// ---------- a spell's own poofs add no power ----------
{
  const s = quiet('standard', 5);
  for (let i = 0; i < 6; i += 1) at(s, 'slime', 4 + i, 3);
  cast(s);
  assert.strictEqual(s.enemies.length, 0, 'Pop-up Blocker clears the small monsters');
  assert.strictEqual(s.hero.power, 0, 'the meter stays empty after a screen-clearing spell');
  assert(s.poofs >= 6, 'they still count as poofs');
}

// ---------- Start Burst (guided 1) ----------
{
  const s = quiet('guided', 1);
  const near = still(at(s, 'slime', 12, 6)); near.hp = 2;
  const goblin = still(at(s, 'goblin', 10, 8.5)); // 2.5 tiles: inside the ring, survives (3 hp - 2)
  const far = still(at(s, 'slime', 17, 6)); // 7 tiles: outside
  const ev = cast(s);
  assert(!s.enemies.includes(near), 'a slime inside the ring is defeated (2 damage)');
  assert.strictEqual(goblin.hp, 1, 'a goblin inside the ring takes 2');
  assert(goblin.y > 8.5 + 1, 'and is shoved away from the hero');
  assert(goblin.stunUntil > s.time, 'and stunned');
  assert.strictEqual(far.hp, 2, 'a monster outside the ring is untouched');
  assert(ev.some((e) => e.type === 'special' && e.radius === 3.6), 'the cast event carries the ring radius');
  const boss = still(at(s, 'mega-slime', 10, 8)); boss.stunUntil = 0;
  s.hero.power = SPECIAL_MAX;
  const before = boss.y;
  cast(s);
  assert(boss.y - before < 1.6, 'a boss is shoved less than a small monster');
}

// ---------- Window Dash / Alt-Tab Dash ----------
for (const [track, n, distance] of [['guided', 2, 5], ['standard', 1, 6]]) {
  const s = quiet(track, n);
  s.hero.x = 3.5; s.hero.y = 6.5; s.hero.facing = 'right';
  const inPath = still(at(s, 'slime', 7.5, 6.5));
  const beside = still(at(s, 'slime', 7.5, 9)); // 2.5 tiles off the line: not on the path
  const ev = cast(s);
  close(s.hero.x, 3.5 + distance, 0.25, `${track}: the dash covers its distance`);
  close(s.hero.y, 6.5, 1e-6, `${track}: and stays on its line`);
  assert(!s.enemies.includes(inPath), `${track}: a monster on the path is defeated`);
  assert.strictEqual(beside.hp, 2, `${track}: a monster off the path is untouched`);
  assert(s.hero.invulnUntil >= s.time + 0.5, `${track}: the hero cannot be hurt mid-dash`);
  const c = ev.find((e) => e.type === 'special');
  assert(c.fromX === 3.5 && c.x === s.hero.x, `${track}: the cast event has where he started and ended`);
}
{
  const s = quiet('standard', 1);
  s.hero.x = 17.2; s.hero.y = 6.5; s.hero.facing = 'right';
  cast(s);
  assert(s.hero.x < 18.7 && s.hero.x > 17.2, 'a wall stops the dash');
}

// ---------- Folder Fort ----------
{
  const s = quiet('guided', 3);
  const inside = still(at(s, 'slime', 11.2, 6)); inside.stunUntil = 0;
  cast(s);
  assert(s.hero.invulnUntil >= s.time + 2.9, 'the fort protects the hero for its duration');
  assert.strictEqual(hurtHero(s, 1, 10.5, 6, []), 'ignored', 'and damage is ignored');
  run(s, {}, 30);
  const d = Math.hypot(inside.x - s.hero.x, inside.y - s.hero.y);
  assert(d >= 2.3 || !s.enemies.includes(inside), `monsters are shoved out of the ring (distance ${d.toFixed(2)})`);
  run(s, {}, 200); // fort over after 3 s
  assert(s.time > s.hero.fortUntil, 'the fort ends');
  assert(s.hero.hearts === s.hero.maxHearts, 'no hearts were lost');
}

// ---------- Mass Rename ----------
{
  const s = quiet('guided', 4);
  const a = at(s, 'slime', 6, 3); const b = at(s, 'goblin', 14, 9); const m = at(s, 'mimic', 16, 3);
  const boss = at(s, 'mega-slime', 4, 9);
  const ev = cast(s);
  [a, b, m].forEach((e) => assert(isChicken(s, e), 'every regular monster becomes a chicken'));
  assert(!isChicken(s, boss), 'a boss does not');
  assert(boss.stunUntil > s.time, 'but a boss is stunned');
  assert.strictEqual(ev.filter((e) => e.type === 'chicken').length, 3, 'one chicken event per monster');
  const castEv = ev.find((e) => e.type === 'special');
  assert.strictEqual(castEv.targets.length, 4, 'the cast event lists where every monster stood');
  assert(castEv.targets.every((t) => Number.isFinite(t.x) && Number.isFinite(t.y) && t.id && t.type), 'with id, type and position');
  assert.strictEqual(castEv.skill, 'renaming', 'and names the skill it echoes');
  close(a.chickenUntil - s.time, 4, 0.05, 'for four seconds');
  run(s, {}, 250);
  assert(!isChicken(s, a), 'and they turn back afterwards');
}

// ---------- STOP! ----------
{
  const s = quiet('guided', 5);
  const a = at(s, 'slime', 6, 6); const boss = at(s, 'big-glitch', 15, 6);
  const tele = boss.nextTeleportAt;
  cast(s);
  close(a.stunUntil - s.time, 3, 0.05, 'monsters freeze for three seconds');
  close(a.frozenUntil - s.time, 3, 0.05, 'and are marked frozen for the renderer');
  close(boss.frozenUntil - s.time, 1.5, 0.05, 'a boss for half that');
  close(boss.stunUntil - s.time, 1.5, 0.05, 'a boss for half that');
  assert(boss.nextTeleportAt > tele + 1, 'a frozen Big Glitch does not teleport during the freeze');
  const ax = a.x; const ay = a.y;
  run(s, {}, 170);
  assert.strictEqual(a.x, ax, 'a frozen monster does not move');
  assert.strictEqual(a.y, ay);
  run(s, {}, 60);
  assert(a.x !== ax || a.y !== ay, 'and moves again afterwards');
}

// ---------- Quick Save ----------
{
  const s = quiet('standard', 2, { hearts: 1 });
  const near = still(at(s, 'slime', 11.5, 6)); near.stunUntil = 0;
  const ev = cast(s);
  assert.strictEqual(s.hero.hearts, 3, 'heals two hearts');
  assert(ev.some((e) => e.type === 'heal' && e.source === 'special' && e.amount === 2), 'and says so');
  assert(s.hero.invulnUntil >= s.time + 1.9, 'and shields him for two seconds');
  close(s.hero.shieldUntil - s.time, 2, 0.05, 'the shield bubble lasts as long');
  assert(near.x > 11.5 + 0.5 && near.stunUntil > s.time, 'nearby monsters are pushed back and stunned');
  const full = quiet('standard', 2);
  cast(full);
  assert.strictEqual(full.hero.hearts, full.hero.maxHearts, 'healing is capped at max hearts');
}

// ---------- Copy-Paste Volley ----------
{
  const s = quiet('standard', 3);
  const east = at(s, 'slime', 14, 6); east.stunUntil = 1e9;
  const ev = cast(s);
  assert.strictEqual(s.bolts.length, 16, 'two rings of eight bolts');
  assert.strictEqual(s.bolts.filter((b) => b.wait > 0).length, 8, 'the pasted copy waits');
  assert(s.bolts.every((b) => b.dmg === 2 && b.range === 7), 'each bolt hits for two');
  assert.strictEqual(ev.find((e) => e.type === 'special').ids.length, 16);
  const waiting = s.bolts.filter((b) => b.twin && b.wait > 0).length;
  assert.strictEqual(waiting, 8);
  run(s, {}, 8);
  assert(s.bolts.filter((b) => !b.twin).every((b) => b.travelled > 0), 'the first ring is already flying');
  assert(s.bolts.filter((b) => b.twin).every((b) => b.travelled === 0), 'the pasted ring is still waiting at the start');
  run(s, {}, 32);
  assert(!s.enemies.includes(east), 'a monster in a bolt line is defeated');
  assert(s.bolts.filter((b) => b.twin).every((b) => b.wait === 0), 'the pasted ring has launched');
  run(s, {}, 90);
  assert.strictEqual(s.bolts.length, 0, 'all bolts finish');
  assert.strictEqual(s.hero.power, 0, 'monsters the volley defeats add no power');
}

// ---------- Select All ----------
{
  const s = quiet('standard', 4);
  const slime = at(s, 'slime', 2, 2); const goblin = at(s, 'goblin', 18, 10); const mimic = at(s, 'mimic', 3, 10);
  const boss = at(s, 'mega-slime', 17, 3);
  cast(s);
  assert(!s.enemies.includes(slime) && !s.enemies.includes(goblin), 'small monsters anywhere in the arena are defeated');
  assert.strictEqual(mimic.hp, 1, 'a mimic (4 hp) takes 3');
  assert.strictEqual(boss.hp, 3, 'a Mega Slime (6 hp) takes 3');
  assert(mimic.stunUntil > s.time && boss.stunUntil > s.time, 'survivors are stunned');
}

// ---------- Pop-up Blocker ----------
{
  const s = quiet('standard', 5);
  const mimic = at(s, 'mimic', 4, 4); const goblin = at(s, 'goblin', 16, 9); const boss = at(s, 'big-glitch', 15, 3);
  cast(s);
  assert(!s.enemies.includes(mimic) && !s.enemies.includes(goblin), 'every regular monster is blocked, mimics included');
  assert.strictEqual(boss.hp, ENEMIES['big-glitch'].hp - 4, 'a boss takes a big hit');
}

// ---------- determinism ----------
{
  const play = () => {
    const s = quiet('standard', 3);
    at(s, 'slime', 12, 6); at(s, 'goblin', 6, 6);
    const ev = [];
    ev.push(...cast(s));
    ev.push(...run(s, { right: true, attack: true }, 90));
    return JSON.stringify({ s, ev });
  };
  assert.strictEqual(play(), play(), 'same setup and inputs give identical results');
}

// ---------- every spell can be cast in a real, running battle ----------
for (const track of ['guided', 'standard']) {
  for (let n = 1; n <= 5; n += 1) {
    const s = createBattle({ cq: normalizeCq({ track }), lesson: { number: n, track }, rng: seeded(11 + n) });
    s.hero.power = SPECIAL_MAX;
    const ev = [];
    for (let i = 0; i < 600 && s.phase !== 'ended'; i += 1) ev.push(...step(s, { special: i === 120 }, DT).events);
    assert(ev.some((e) => e.type === 'special' && e.id === s.special.id), `${track} lesson ${n}: ${s.special.name} casts in a running battle`);
    assert(Number.isFinite(s.hero.x) && Number.isFinite(s.hero.y) && s.enemies.every((e) => Number.isFinite(e.x) && Number.isFinite(e.y)), `${track} ${n}: no NaN positions after the spell`);
  }
}

// ---------- keys and the how-to card ----------
{
  assert.strictEqual(keyAction({ code: 'KeyF', key: 'f' }), 'special');
  assert.strictEqual(keyAction({ key: 'F' }), 'special', 'a browser with no code still maps F');
  assert.strictEqual(keyAction({ code: 'KeyF', key: 'f', ctrlKey: true }), null, 'Ctrl+F is never bound');
  assert.strictEqual(keyAction({ code: 'KeyF', key: 'f', altKey: true }), null);
  assert.strictEqual(keyAction({ code: 'KeyF', key: 'f', metaKey: true }), null);
  const lines = howToKeys({}, specialFor('standard', 1));
  const f = lines.find((l) => l.keys === 'F');
  assert(f && f.text.includes('Alt-Tab Dash') && f.text.includes('POWER'), 'the how-to card explains F with the spell name');
  assert(!howToKeys({}).some((l) => l.keys === 'F'), 'no F line when there is no spell (old callers)');
}

console.log('ok — battle specials: meter, F key, all ten spells, determinism, keys and how-to line');
