// Computer Quest horde battle: pure deterministic simulation (no DOM, no drawing, no clock).
//
// State ownership: step(state, input, dt) MUTATES the state object it is given and returns
// { state, events } with that same object plus a fresh events array. The state is plain JSON
// data (no functions); in-battle randomness uses a seeded generator whose seed lives in
// state.seed and is drawn once from the injected rng() in createBattle.
import { BARE_HANDS, ITEMS } from '../items.js';
import { maxHearts, normalizeCq } from '../character.js';
import { ARENA, enemyHp, ENEMIES, isSolid, spawnPoint, wavePlan } from './content.js';
import { POWER_GAIN, SPECIAL_MAX, specialFor } from './specials.js';

export const BATTLE_SECONDS = 300;
export const HERO_SPEED = 4.5;
export const HERO_RADIUS = 0.35;
export const SWING_TIME = 0.15;
export const INVULN_TIME = 1.3;
export const HERO_KNOCKBACK = 0.6;
export const BLOCK_ENEMY_KNOCKBACK = 0.8; // a blocked hit knocks the ENEMY back; the hero is not pushed
export const BLOCK_GRACE = 0.4; // further blocked hits during this grace are absorbed silently
export const BLOCK_FRONTAL_DIST = 0.05; // a source this close to the hero's center counts as frontal
export const BLOCK_ARC = 60; // degrees either side of facing
export const CONTACT_STOP_MARGIN = 0.05; // chasers stop this far inside their contact distance
export const ENEMY_MIN_SEPARATION = 0.4; // no enemy center gets closer than this to the hero's center
export const ENEMY_FLASH = 0.1;
export const ENEMY_KNOCKBACK = 0.3; // bolt hits
export const MELEE_KNOCKBACK = 0.9; // melee "bonk" on regular enemies
export const MELEE_STUN = 0.25;
export const BOSS_MELEE_KNOCKBACK = 0.5;
export const BOSS_MELEE_STUN = 0.15;
export const WAVE_CLEAR_HEAL = 1; // hearts healed at the start of waves 2..N
export const HEART_DROP_CHANCE = 1 / 8; // per regular-enemy poof, via the seeded generator
export const HEART_PICKUP_LIFE = 8;
export const HEART_PICKUP_RANGE = 0.6;
export const WAVE_GAP = 2.5;
export const HISTORY_SECONDS = 3.0;
export const STONE_COOLDOWN = 1;
export const REVIVE_INVULN = 1.5;
export const SECOND_WIND_MAX_LESSON = 2; // lessons n <= 2 get one Second Wind revive
export const BOLT_SPEED = 10;
export const TWIN_OFFSET = 0.35;
export const PUFF_TIME = 0.5;
export const CHICKEN_SPEED = 1.2;
export const CHICKEN_TURN = 0.5;
export const MAX_DT = 0.1;
const CLEAR_DAMAGE = 999; // Pop-up Blocker: more than any regular monster's HP

const EPS = 1e-9;
const itemById = {};
ITEMS.forEach((item) => { itemById[item.id] = item; });

export const FACING_VECTORS = {
  up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
};

const EDGE_KEYS = ['attack', 'ability', 'stance', 'undo', 'apple', 'stone', 'special', 'pause'];
const INPUT_KEYS = ['up', 'down', 'left', 'right', 'attack', 'block', 'ability', 'stance', 'undo', 'apple', 'stone', 'special', 'pause'];

function blankInput() {
  const input = {};
  INPUT_KEYS.forEach((key) => { input[key] = false; });
  return input;
}

// mulberry32 over state.seed
export function nextRandom(state) {
  state.seed = (state.seed + 0x6D2B79F5) | 0;
  let t = state.seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// Gear summary from equipped item ids. Plain data only.
export function gearFrom(equipped) {
  const ids = [];
  Object.keys(equipped || {}).forEach((slot) => { if (equipped[slot]) ids.push(equipped[slot]); });
  const has = (id) => ids.indexOf(id) !== -1;
  const main = equipped && equipped.mainHand ? itemById[equipped.mainHand] : null;
  const melee = main && main.battle && main.battle.kind === 'melee' ? main.id : null;
  const boots = has('taskbar-boots') ? itemById['taskbar-boots'].battle.moveSpeed : 0;
  return {
    melee, // item id or null (bare hands)
    sword: melee === 'switch-sword',
    shield: has('stop-sign-shield'),
    rune: has('rename-rune'),
    staff: has('copy-crystal-staff'),
    backpack: has('folder-backpack'),
    stone: has('save-stone'),
    amulet: has('undo-amulet'),
    helmet: has('scam-spotter-helmet'),
    boots,
  };
}

// { dmg, reach, cooldown, arc } for the hero's current weapon + stance.
export function meleeStats(gear, stance) {
  const item = gear.melee ? itemById[gear.melee] : null;
  if (!item) return { dmg: BARE_HANDS.dmg, reach: BARE_HANDS.reach, cooldown: BARE_HANDS.cooldown, arc: 90 };
  const b = item.battle;
  if (b.quick && b.wide) {
    const s = stance === 'wide' ? b.wide : b.quick;
    return { dmg: s.dmg, reach: s.reach, cooldown: s.cooldown, arc: s.arc || 90 };
  }
  return { dmg: b.dmg, reach: b.reach, cooldown: b.cooldown, arc: b.arc || 90 };
}

export function heroSpeed(state) {
  const hero = state.hero;
  return HERO_SPEED * (1 + state.gear.boots) * (hero.blocking ? 0.5 : 1);
}

export function boxHitsSolid(x, y, r) {
  const x0 = Math.floor(x - r);
  const x1 = Math.floor(x + r - EPS);
  const y0 = Math.floor(y - r);
  const y1 = Math.floor(y + r - EPS);
  for (let ty = y0; ty <= y1; ty += 1) {
    for (let tx = x0; tx <= x1; tx += 1) {
      if (isSolid(tx, ty)) return true;
    }
  }
  return false;
}

// Axis-separated slide, subdivided so big pushes can't tunnel through a block.
export function moveBody(body, dx, dy, r) {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 0.2));
  const sx = dx / steps;
  const sy = dy / steps;
  for (let i = 0; i < steps; i += 1) {
    if (sx) body.x = slideAxis(body.x, sx, r, (v) => boxHitsSolid(v, body.y, r));
    if (sy) body.y = slideAxis(body.y, sy, r, (v) => boxHitsSolid(body.x, v, r));
  }
}

// Move along one axis; when blocked, snap flush against the solid tile edge.
function slideAxis(pos, delta, r, hits) {
  const next = pos + delta;
  if (!hits(next)) return next;
  const flush = delta > 0 ? Math.floor(next + r - EPS) - r : Math.floor(next - r) + 1 + r;
  if ((delta > 0 ? flush > pos : flush < pos) && !hits(flush)) return flush;
  return pos;
}

const angleBetween = (ax, ay, bx, by) => {
  const la = Math.hypot(ax, ay);
  const lb = Math.hypot(bx, by);
  if (la < EPS || lb < EPS) return 180;
  const c = Math.max(-1, Math.min(1, (ax * bx + ay * by) / (la * lb)));
  return (Math.acos(c) * 180) / Math.PI;
};

export function createBattle({ cq, lesson, rng }) {
  const normalized = normalizeCq(cq);
  const random = typeof rng === 'function' ? rng : () => 0;
  const number = lesson && Number.isFinite(lesson.number) ? lesson.number : 1;
  const track = (lesson && lesson.track) || normalized.track || 'standard';
  const plan = wavePlan(number, track, random);
  const gear = gearFrom(normalized.equipped);
  const hearts = maxHearts(normalized);
  const seedRoll = Number(random());
  const seed = Math.floor((Number.isFinite(seedRoll) ? Math.max(0, Math.min(1, seedRoll)) : 0) * 4294967295) | 0;
  const spawn = ARENA.heroSpawn;
  return {
    time: 0,
    timeLeft: BATTLE_SECONDS,
    phase: 'playing',
    outcome: null,
    wave: 1,
    waveStartedAt: 0,
    waveClearedAt: null,
    spawnIndex: 0,
    waveAnnounced: false,
    plan,
    lessonNumber: number,
    track,
    gear,
    special: specialFor(track, number), // this battle's spell (plain data): see specials.js
    casting: false, // true only while a special resolves, so its own poofs add no power
    seed,
    nextId: 1,
    hero: {
      x: spawn.x,
      y: spawn.y,
      facing: 'down',
      hearts,
      maxHearts: hearts,
      invulnUntil: 0,
      speed: HERO_SPEED * (1 + gear.boots),
      moving: false,
      blocking: false,
      attackUntil: 0,
      attackCooldownUntil: 0,
      attackStartedAt: -1,
      swing: null, // { dmg, reach, arc, hit: [enemy ids] } while a swing is active
      stance: gear.sword ? 'quick' : null,
      apple: gear.backpack,
      stone: gear.stone ? { x: spawn.x, y: spawn.y, used: false } : null,
      amuletUsed: false,
      secondWindUsed: false, // beginner safety net (lessons n <= 2), once per battle
      history: [{ t: 0, x: spawn.x, y: spawn.y, hearts }],
      shieldReduceReadyAt: 0, // helmet damage-reduction gate (name kept from the ticket)
      blockGraceUntil: 0, // shield: blocked hits before this time are absorbed without re-pushing
      power: 0, // special-move meter, 0..SPECIAL_MAX; filled by poofs, spent by the F key
      fortUntil: 0, // Folder Fort: hero cannot be hurt and enemies inside fortRadius are shoved out until then
      fortRadius: 0,
      fortPush: 0,
      shieldUntil: 0, // Quick Save: the shield bubble the renderer draws until then (invulnUntil does the protecting)
    },
    enemies: [],
    bolts: [],
    puffs: [],
    pickups: [], // { id, type: 'heart', x, y, until }
    poofs: 0,
    cooldowns: { rune: 0, staff: 0, stone: 0 },
    lastInput: blankInput(),
  };
}

function end(state, outcome, events) {
  if (state.phase === 'ended') return;
  state.phase = 'ended';
  state.outcome = outcome;
  events.push({ type: 'end', outcome });
}

function addPuff(state, x, y) {
  const squares = 6 + Math.floor(nextRandom(state) * 5);
  state.puffs.push({ id: state.nextId++, x, y, bornAt: state.time, until: state.time + PUFF_TIME, squares });
}

export function spawnEnemy(state, type, x, y, events) {
  const def = ENEMIES[type];
  const hp = enemyHp(type, state.lessonNumber);
  const enemy = {
    id: state.nextId++,
    type,
    x,
    y,
    hp,
    maxHp: hp,
    boss: def.boss,
    state: type === 'mimic' ? 'idle' : type === 'slime' ? 'move' : 'chase',
    stateUntil: 0,
    spawnedAt: state.time,
    chickenUntil: 0,
    flashUntil: 0,
    revealed: type === 'mimic' ? state.gear.helmet : true,
    dirX: 0,
    dirY: 0,
    nextTeleportAt: type === 'big-glitch' ? state.time + def.teleportEvery : 0,
    warned: false,
    nextScrapAt: def.scrapEvery ? state.time + def.scrapEvery : 0,
    stunUntil: 0, // melee bonk: no movement or contact damage before this time
    frozenUntil: 0, // STOP!: like a stun, but drawn frozen
    slideDir: 0, // obstacle slide direction (-1/+1) along the free axis while a straight chase is blocked
  };
  state.enemies.push(enemy);
  if (events) events.push({ type: 'spawn', id: enemy.id, enemy: type, x, y });
  return enemy;
}

function poof(state, enemy, events) {
  const index = state.enemies.indexOf(enemy);
  if (index === -1) return;
  state.enemies.splice(index, 1);
  state.poofs += 1;
  addPuff(state, enemy.x, enemy.y);
  events.push({ type: 'poof', id: enemy.id, enemy: enemy.type, x: enemy.x, y: enemy.y });
  const def = ENEMIES[enemy.type];
  if (!state.casting) {
    const hero = state.hero;
    const before = hero.power;
    hero.power = Math.min(SPECIAL_MAX, hero.power + (POWER_GAIN[enemy.type] || 0));
    if (before < SPECIAL_MAX && hero.power >= SPECIAL_MAX) events.push({ type: 'power', ready: true });
  }
  if (!def.boss && nextRandom(state) < HEART_DROP_CHANCE) {
    const pickup = { id: state.nextId++, type: 'heart', x: enemy.x, y: enemy.y, until: state.time + HEART_PICKUP_LIFE };
    state.pickups.push(pickup);
    events.push({ type: 'drop', id: pickup.id, x: pickup.x, y: pickup.y });
  }
  if (def.splitInto) {
    for (let i = 0; i < def.splitCount; i += 1) {
      const off = i === 0 ? -0.5 : 0.5;
      const r = ENEMIES[def.splitInto].radius;
      const x = boxHitsSolid(enemy.x + off, enemy.y, r) ? enemy.x : enemy.x + off;
      spawnEnemy(state, def.splitInto, x, enemy.y, events);
    }
  }
}

function damageEnemy(state, enemy, dmg, fromX, fromY, source, events) {
  enemy.hp -= dmg;
  enemy.flashUntil = state.time + ENEMY_FLASH;
  events.push({ type: 'hit', id: enemy.id, dmg, source, x: enemy.x, y: enemy.y });
  if (enemy.hp <= 0) {
    poof(state, enemy, events);
    return;
  }
  const def = ENEMIES[enemy.type];
  let knock = ENEMY_KNOCKBACK;
  if (source === 'melee') {
    knock = def.boss ? BOSS_MELEE_KNOCKBACK : MELEE_KNOCKBACK;
    enemy.stunUntil = Math.max(enemy.stunUntil || 0, state.time + (def.boss ? BOSS_MELEE_STUN : MELEE_STUN));
  }
  const dx = enemy.x - fromX;
  const dy = enemy.y - fromY;
  const len = Math.hypot(dx, dy);
  if (len > EPS) moveBody(enemy, (dx / len) * knock, (dy / len) * knock, def.radius);
}

export function isChicken(state, enemy) {
  return enemy.chickenUntil > state.time;
}

// Damage to the hero from a source at (sx, sy). Returns 'blocked' | 'hurt' | 'ignored'.
// `source` (optional) is the attacking enemy; a blocked hit knocks it back.
export function hurtHero(state, amount, sx, sy, events, source) {
  const hero = state.hero;
  if (state.phase !== 'playing' || state.time < hero.invulnUntil) return 'ignored';
  const dx = sx - hero.x;
  const dy = sy - hero.y;
  if (hero.blocking) {
    const f = FACING_VECTORS[hero.facing];
    const len = Math.hypot(dx, dy);
    if (len <= BLOCK_FRONTAL_DIST || angleBetween(f.x, f.y, dx, dy) <= BLOCK_ARC + EPS) {
      if (state.time < hero.blockGraceUntil) return 'blocked';
      hero.blockGraceUntil = state.time + BLOCK_GRACE;
      if (source && state.enemies.indexOf(source) !== -1) {
        const ux = len > BLOCK_FRONTAL_DIST ? dx / len : f.x;
        const uy = len > BLOCK_FRONTAL_DIST ? dy / len : f.y;
        moveBody(source, ux * BLOCK_ENEMY_KNOCKBACK, uy * BLOCK_ENEMY_KNOCKBACK, ENEMIES[source.type].radius);
      }
      events.push({ type: 'block', x: hero.x, y: hero.y, id: source ? source.id : null });
      return 'blocked';
    }
  }
  let dmg = amount;
  if (state.gear.helmet && dmg > 1 && state.time >= hero.shieldReduceReadyAt) {
    dmg = Math.max(1, dmg - 1);
    hero.shieldReduceReadyAt = state.time + 5;
  }
  hero.hearts = Math.max(0, hero.hearts - dmg);
  hero.invulnUntil = state.time + INVULN_TIME;
  const hitLen = Math.hypot(dx, dy);
  if (hitLen > EPS) moveBody(hero, (-dx / hitLen) * HERO_KNOCKBACK, (-dy / hitLen) * HERO_KNOCKBACK, HERO_RADIUS);
  events.push({ type: 'hurt', dmg, hearts: hero.hearts, x: hero.x, y: hero.y });
  if (hero.hearts <= 0) {
    if (hero.stone && !hero.stone.used) {
      hero.stone.used = true;
      hero.hearts = Math.min(3, hero.maxHearts);
      hero.x = hero.stone.x;
      hero.y = hero.stone.y;
      hero.invulnUntil = state.time + REVIVE_INVULN;
      events.push({ type: 'revive', source: 'stone', x: hero.x, y: hero.y, hearts: hero.hearts });
    } else if (state.lessonNumber <= SECOND_WIND_MAX_LESSON && !hero.secondWindUsed) {
      // Beginner safety net: one in-place revive to full hearts (after the stone, if any).
      hero.secondWindUsed = true;
      hero.hearts = hero.maxHearts;
      hero.invulnUntil = state.time + REVIVE_INVULN;
      events.push({ type: 'revive', source: 'second-wind', x: hero.x, y: hero.y, hearts: hero.hearts });
    } else {
      end(state, 'fell', events);
    }
  }
  return 'hurt';
}

function updateHero(state, input, pressed, dt, events) {
  const hero = state.hero;
  const gear = state.gear;
  if (pressed.stance && gear.sword) hero.stance = hero.stance === 'wide' ? 'quick' : 'wide';
  hero.blocking = Boolean(input.block && gear.shield);

  let mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  hero.moving = mx !== 0 || my !== 0;
  if (hero.moving) {
    if (Math.abs(mx) > Math.abs(my)) hero.facing = mx > 0 ? 'right' : 'left';
    else if (Math.abs(my) > Math.abs(mx)) hero.facing = my > 0 ? 'down' : 'up';
    else {
      const horizontal = mx > 0 ? 'right' : 'left';
      const vertical = my > 0 ? 'down' : 'up';
      if (hero.facing !== horizontal && hero.facing !== vertical) hero.facing = vertical;
    }
    const len = Math.hypot(mx, my);
    mx /= len;
    my /= len;
    hero.speed = heroSpeed(state);
    moveBody(hero, mx * hero.speed * dt, my * hero.speed * dt, HERO_RADIUS);
  } else {
    hero.speed = heroSpeed(state);
  }

  // Apple
  if (pressed.apple && gear.backpack && hero.apple && hero.hearts < hero.maxHearts) {
    const before = hero.hearts;
    hero.hearts = Math.min(hero.maxHearts, hero.hearts + 2);
    hero.apple = false;
    events.push({ type: 'heal', amount: hero.hearts - before, hearts: hero.hearts });
  }
  // Save Stone move
  if (pressed.stone && hero.stone && !hero.stone.used && state.time >= state.cooldowns.stone) {
    hero.stone.x = hero.x;
    hero.stone.y = hero.y;
    state.cooldowns.stone = state.time + STONE_COOLDOWN;
    events.push({ type: 'stone', x: hero.x, y: hero.y });
  }
  // Undo Amulet: oldest sample in the 3 s history ring
  if (pressed.undo && gear.amulet && !hero.amuletUsed && hero.history.length) {
    const sample = hero.history[0];
    hero.x = sample.x;
    hero.y = sample.y;
    hero.hearts = Math.min(hero.maxHearts, sample.hearts);
    hero.amuletUsed = true;
    events.push({ type: 'undo', x: hero.x, y: hero.y, hearts: hero.hearts });
  }
  // E: staff wins over rune
  if (pressed.ability) {
    if (gear.staff) fireStaff(state, events);
    else if (gear.rune) castRune(state, events);
  }
  // F: the special move (needs a full power meter)
  if (pressed.special) castSpecial(state, events);
  // Attack
  if (pressed.attack && state.time >= hero.attackCooldownUntil) {
    const stats = meleeStats(gear, hero.stance);
    hero.attackStartedAt = state.time;
    hero.attackUntil = state.time + SWING_TIME;
    hero.attackCooldownUntil = state.time + stats.cooldown;
    hero.swing = { dmg: stats.dmg, reach: stats.reach, arc: stats.arc, hit: [] };
    events.push({ type: 'swing', stance: hero.stance, x: hero.x, y: hero.y, facing: hero.facing });
  }
}

function fireStaff(state, events) {
  if (state.time < state.cooldowns.staff) return;
  const staff = itemById['copy-crystal-staff'].battle;
  const hero = state.hero;
  const f = FACING_VECTORS[hero.facing];
  const px = -f.y;
  const py = f.x;
  const ids = [];
  // Twin runs parallel on the +perpendicular side, or the other side if that spawn point is solid.
  const twinOff = isSolid(hero.x + px * TWIN_OFFSET, hero.y + py * TWIN_OFFSET) ? -TWIN_OFFSET : TWIN_OFFSET;
  [{ off: 0, dmg: staff.dmg, twin: false }, { off: twinOff, dmg: staff.twinDmg, twin: true }].forEach((b) => {
    const bolt = {
      id: state.nextId++, x: hero.x + px * b.off, y: hero.y + py * b.off, dx: f.x, dy: f.y,
      travelled: 0, range: staff.range, dmg: b.dmg, twin: b.twin,
    };
    state.bolts.push(bolt);
    ids.push(bolt.id);
  });
  state.cooldowns.staff = state.time + staff.cooldown;
  events.push({ type: 'bolt', ids, x: hero.x, y: hero.y, facing: hero.facing });
}

export function runeTarget(state) {
  const rune = itemById['rename-rune'].battle;
  const hero = state.hero;
  let best = null;
  let bestDist = Infinity;
  state.enemies.forEach((enemy) => {
    if (enemy.boss || isChicken(state, enemy)) return;
    const d = Math.hypot(enemy.x - hero.x, enemy.y - hero.y);
    if (d <= rune.range + EPS && d < bestDist) { best = enemy; bestDist = d; }
  });
  return best;
}

function castRune(state, events) {
  if (state.time < state.cooldowns.rune) return;
  const rune = itemById['rename-rune'].battle;
  const target = runeTarget(state);
  if (!target) return;
  target.chickenUntil = state.time + rune.duration;
  target.stateUntil = 0;
  state.cooldowns.rune = state.time + rune.cooldown;
  events.push({ type: 'chicken', id: target.id, x: target.x, y: target.y });
}

// ---------- special moves (specials.js has the data; the meter fills in poof()) ----------

function stunEnemy(state, enemy, seconds) {
  enemy.stunUntil = Math.max(enemy.stunUntil || 0, state.time + seconds);
}

// Shove an enemy `dist` tiles straight away from (fromX, fromY), walls and blocks respected.
function pushEnemy(state, enemy, fromX, fromY, dist) {
  const dx = enemy.x - fromX;
  const dy = enemy.y - fromY;
  const len = Math.hypot(dx, dy);
  const f = FACING_VECTORS[state.hero.facing];
  const ux = len > EPS ? dx / len : f.x;
  const uy = len > EPS ? dy / len : f.y;
  moveBody(enemy, ux * dist, uy * dist, ENEMIES[enemy.type].radius);
}

const inReach = (state, enemy, radius) => {
  const hero = state.hero;
  return Math.hypot(enemy.x - hero.x, enemy.y - hero.y) <= radius + (ENEMIES[enemy.type].size >= 2 ? 0.5 : 0) + EPS;
};

// Folder Fort: while it lasts (hero.fortUntil) every enemy inside the ring is shoved back out.
function applyFort(state, dt) {
  const hero = state.hero;
  if (!(state.time < hero.fortUntil) || state.phase !== 'playing') return;
  for (let i = 0; i < state.enemies.length; i += 1) {
    const enemy = state.enemies[i];
    const gap = hero.fortRadius + (ENEMIES[enemy.type].size >= 2 ? 0.5 : 0) - Math.hypot(enemy.x - hero.x, enemy.y - hero.y);
    if (gap > EPS) pushEnemy(state, enemy, hero.x, hero.y, Math.min(gap, hero.fortPush * dt));
  }
}

// F pressed. Returns true when the spell was cast. A full meter is spent whole. Poofs the spell itself
// causes add no power (state.casting), so a screen-clearing spell can't instantly refill the meter.
function castSpecial(state, events) {
  const hero = state.hero;
  const sp = state.special;
  if (!sp || state.phase !== 'playing') return false;
  if (hero.power < SPECIAL_MAX) {
    events.push({ type: 'special-wait', power: hero.power, max: SPECIAL_MAX });
    return false;
  }
  hero.power = 0;
  state.casting = true;
  const cast = { type: 'special', id: sp.id, name: sp.name, skill: sp.skill, kind: sp.kind, x: hero.x, y: hero.y, fromX: hero.x, fromY: hero.y, facing: hero.facing };
  events.push(cast);
  const list = state.enemies.slice();
  // Where every monster stood at the moment of the cast (some are gone by the end of the step).
  cast.targets = list.map((enemy) => ({ id: enemy.id, type: enemy.type, x: enemy.x, y: enemy.y, boss: ENEMIES[enemy.type].boss }));
  const alive = (enemy) => state.enemies.indexOf(enemy) !== -1;
  if (sp.kind === 'burst') {
    list.forEach((enemy) => {
      if (!inReach(state, enemy, sp.radius)) return;
      const boss = ENEMIES[enemy.type].boss;
      damageEnemy(state, enemy, sp.dmg, hero.x, hero.y, 'special', events);
      if (!alive(enemy)) return;
      pushEnemy(state, enemy, hero.x, hero.y, boss ? sp.knock / 2 : sp.knock);
      stunEnemy(state, enemy, boss ? sp.stun / 2 : sp.stun);
    });
    cast.radius = sp.radius;
  } else if (sp.kind === 'dash') {
    const f = FACING_VECTORS[hero.facing];
    const struck = {};
    let travelled = 0;
    while (travelled < sp.distance - EPS) {
      const len = Math.min(0.2, sp.distance - travelled);
      const bx = hero.x;
      const by = hero.y;
      moveBody(hero, f.x * len, f.y * len, HERO_RADIUS);
      travelled += len;
      state.enemies.slice().forEach((enemy) => {
        if (struck[enemy.id]) return;
        const reach = sp.width / 2 + ENEMIES[enemy.type].radius + 0.2;
        if (Math.hypot(enemy.x - hero.x, enemy.y - hero.y) > reach) return;
        struck[enemy.id] = true;
        damageEnemy(state, enemy, sp.dmg, hero.x - f.x, hero.y - f.y, 'special', events);
        if (alive(enemy)) stunEnemy(state, enemy, sp.stun);
      });
      if (Math.abs(hero.x - bx) + Math.abs(hero.y - by) < EPS) break; // a wall stops the dash
    }
    hero.invulnUntil = Math.max(hero.invulnUntil, state.time + sp.invuln);
    cast.x = hero.x; // fromX/fromY keep where the dash began; x/y are where it ended
    cast.y = hero.y;
    cast.width = sp.width;
  } else if (sp.kind === 'fort') {
    hero.fortUntil = state.time + sp.duration;
    hero.fortRadius = sp.radius;
    hero.fortPush = sp.push;
    hero.invulnUntil = Math.max(hero.invulnUntil, hero.fortUntil);
    list.forEach((enemy) => {
      if (!inReach(state, enemy, sp.radius)) return;
      damageEnemy(state, enemy, sp.dmg, hero.x, hero.y, 'special', events);
    });
    cast.radius = sp.radius;
    cast.duration = sp.duration;
  } else if (sp.kind === 'rename') {
    list.forEach((enemy) => {
      if (ENEMIES[enemy.type].boss) { stunEnemy(state, enemy, sp.bossStun); return; }
      if (isChicken(state, enemy)) return;
      enemy.chickenUntil = state.time + sp.duration;
      enemy.stateUntil = 0;
      events.push({ type: 'chicken', id: enemy.id, x: enemy.x, y: enemy.y });
    });
    cast.duration = sp.duration;
  } else if (sp.kind === 'freeze') {
    list.forEach((enemy) => {
      const seconds = ENEMIES[enemy.type].boss ? sp.bossDuration : sp.duration;
      stunEnemy(state, enemy, seconds);
      enemy.frozenUntil = state.time + seconds; // renderer: frozen look (a melee stun alone is not frozen)
      if (enemy.type === 'big-glitch') { enemy.nextTeleportAt += seconds; enemy.warned = false; enemy.state = 'chase'; }
    });
    cast.duration = sp.duration;
  } else if (sp.kind === 'save') {
    const before = hero.hearts;
    hero.hearts = Math.min(hero.maxHearts, hero.hearts + sp.heal);
    events.push({ type: 'heal', source: 'special', amount: hero.hearts - before, hearts: hero.hearts });
    hero.invulnUntil = Math.max(hero.invulnUntil, state.time + sp.invuln);
    hero.shieldUntil = state.time + sp.invuln;
    list.forEach((enemy) => {
      if (!inReach(state, enemy, sp.radius)) return;
      const boss = ENEMIES[enemy.type].boss;
      pushEnemy(state, enemy, hero.x, hero.y, boss ? sp.knock / 2 : sp.knock);
      stunEnemy(state, enemy, boss ? sp.stun / 2 : sp.stun);
    });
    cast.radius = sp.radius;
  } else if (sp.kind === 'volley') {
    const ids = [];
    for (let ring = 0; ring < 2; ring += 1) {
      for (let i = 0; i < sp.dirs; i += 1) {
        const angle = (i * Math.PI * 2) / sp.dirs;
        const bolt = {
          id: state.nextId++, x: hero.x, y: hero.y, dx: Math.cos(angle), dy: Math.sin(angle),
          travelled: 0, range: sp.range, dmg: sp.dmg, twin: ring === 1, special: true, wait: ring === 1 ? sp.pasteDelay : 0,
        };
        state.bolts.push(bolt);
        ids.push(bolt.id);
      }
    }
    cast.ids = ids;
  } else if (sp.kind === 'blast') {
    list.forEach((enemy) => {
      damageEnemy(state, enemy, sp.dmg, hero.x, hero.y, 'special', events);
      if (alive(enemy)) stunEnemy(state, enemy, sp.stun);
    });
  } else if (sp.kind === 'clear') {
    list.forEach((enemy) => {
      damageEnemy(state, enemy, ENEMIES[enemy.type].boss ? sp.bossDmg : CLEAR_DAMAGE, hero.x, hero.y, 'special', events);
    });
  }
  state.casting = false;
  return true;
}

function updateSwing(state, events) {
  const hero = state.hero;
  if (!hero.swing) return;
  if (state.time >= hero.attackUntil - EPS) { hero.swing = null; return; }
  const swing = hero.swing;
  const f = FACING_VECTORS[hero.facing];
  const targets = state.enemies.slice();
  for (let i = 0; i < targets.length; i += 1) {
    const enemy = targets[i];
    if (swing.hit.indexOf(enemy.id) !== -1 || state.enemies.indexOf(enemy) === -1) continue;
    const dx = enemy.x - hero.x;
    const dy = enemy.y - hero.y;
    const d = Math.hypot(dx, dy);
    const extra = ENEMIES[enemy.type].size >= 2 ? 0.5 : 0;
    if (d > swing.reach + extra + EPS) continue;
    if (d > 0.3 && angleBetween(f.x, f.y, dx, dy) > swing.arc / 2 + EPS) continue;
    swing.hit.push(enemy.id);
    damageEnemy(state, enemy, swing.dmg, hero.x, hero.y, 'melee', events);
  }
}

function updateBolts(state, dt, events) {
  let write = 0;
  for (let i = 0; i < state.bolts.length; i += 1) {
    const bolt = state.bolts[i];
    if (bolt.wait > 0) { bolt.wait = Math.max(0, bolt.wait - dt); state.bolts[write++] = bolt; continue; } // a pasted copy waits at its start
    let alive = true;
    const total = Math.min(BOLT_SPEED * dt, bolt.range - bolt.travelled);
    const steps = Math.max(1, Math.ceil(total / 0.1));
    const stepLen = total / steps;
    for (let s = 0; s < steps && alive; s += 1) {
      bolt.x += bolt.dx * stepLen;
      bolt.y += bolt.dy * stepLen;
      bolt.travelled += stepLen;
      if (isSolid(bolt.x, bolt.y)) { alive = false; break; }
      for (let e = 0; e < state.enemies.length; e += 1) {
        const enemy = state.enemies[e];
        const r = ENEMIES[enemy.type].size >= 2 ? 1.0 : 0.5;
        if (Math.hypot(enemy.x - bolt.x, enemy.y - bolt.y) <= r) {
          state.casting = Boolean(bolt.special); // kills by a special's own bolts add no power either
          damageEnemy(state, enemy, bolt.dmg, bolt.x - bolt.dx, bolt.y - bolt.dy, 'bolt', events);
          state.casting = false;
          alive = false;
          break;
        }
      }
    }
    if (alive && bolt.travelled >= bolt.range - EPS) alive = false;
    if (alive) state.bolts[write++] = bolt;
  }
  state.bolts.length = write;
}

function spawnDue(state, events) {
  const entries = state.plan[state.wave - 1] || [];
  while (state.spawnIndex < entries.length && state.time - state.waveStartedAt >= entries[state.spawnIndex].delay - EPS) {
    const entry = entries[state.spawnIndex];
    const p = spawnPoint(entry, ENEMIES[entry.type].size);
    spawnEnemy(state, entry.type, p.x, p.y, events);
    state.spawnIndex += 1;
  }
}

// Chase the hero, stopping just inside contact distance. When a solid blocks the straight
// line, slide along the free (perpendicular) axis in a direction kept in enemy.slideDir until
// the chase is unblocked again.
export function chase(enemy, hero, speed, dt) {
  const def = ENEMIES[enemy.type];
  const dx = hero.x - enemy.x;
  const dy = hero.y - enemy.y;
  const d = Math.hypot(dx, dy);
  const stop = Math.max(ENEMY_MIN_SEPARATION, def.contact - CONTACT_STOP_MARGIN);
  if (d <= stop) { enemy.slideDir = 0; return; }
  const s = Math.min(d - stop, speed * dt);
  const x0 = enemy.x;
  const y0 = enemy.y;
  moveBody(enemy, (dx / d) * s, (dy / d) * s, def.radius);
  if (Math.hypot(enemy.x - x0, enemy.y - y0) >= s * 0.5 - EPS) { enemy.slideDir = 0; return; }
  const alongX = Math.abs(dx) >= Math.abs(dy); // dominant axis is blocked; slide on the other one
  if (!enemy.slideDir) {
    const minor = alongX ? dy : dx;
    const toCenter = alongX ? ARENA.heroSpawn.y - enemy.y : ARENA.heroSpawn.x - enemy.x;
    if (Math.abs(minor) > 0.05 * d) enemy.slideDir = minor > 0 ? 1 : -1;
    else enemy.slideDir = toCenter < 0 ? -1 : 1;
  }
  const bx = enemy.x;
  const by = enemy.y;
  if (alongX) moveBody(enemy, 0, enemy.slideDir * s, def.radius);
  else moveBody(enemy, enemy.slideDir * s, 0, def.radius);
  if (Math.abs(enemy.x - bx) + Math.abs(enemy.y - by) < EPS) enemy.slideDir = -enemy.slideDir;
}

// separate() for every enemy: run at the end of each step so spawns, hero knockback, revives and
// undo never leave an enemy center on top of the hero (unless it is pinned against a solid).
export function separateAll(state) {
  for (let i = 0; i < state.enemies.length; i += 1) separate(state, state.enemies[i]);
}

// Keep an enemy's center at least ENEMY_MIN_SEPARATION from the hero's center (solids respected).
// A few passes, because an axis blocked at a block corner can free up once the other axis moved.
function separate(state, enemy) {
  const hero = state.hero;
  for (let pass = 0; pass < 3; pass += 1) {
    const dx = enemy.x - hero.x;
    const dy = enemy.y - hero.y;
    const d = Math.hypot(dx, dy);
    if (d >= ENEMY_MIN_SEPARATION - EPS) return;
    const f = FACING_VECTORS[hero.facing];
    const ux = d > EPS ? dx / d : f.x;
    const uy = d > EPS ? dy / d : f.y;
    const push = ENEMY_MIN_SEPARATION - d;
    const x0 = enemy.x;
    const y0 = enemy.y;
    moveBody(enemy, ux * push, uy * push, ENEMIES[enemy.type].radius);
    if (enemy.x === x0 && enemy.y === y0) return; // pinned against a solid
  }
}

function updateEnemies(state, dt, events) {
  const hero = state.hero;
  const list = state.enemies.slice();
  for (let i = 0; i < list.length; i += 1) {
    if (state.phase !== 'playing') return;
    const enemy = list[i];
    if (state.enemies.indexOf(enemy) === -1) continue;
    const def = ENEMIES[enemy.type];
    if (def.scrapEvery && state.time >= enemy.nextScrapAt - EPS) {
      enemy.nextScrapAt += def.scrapEvery;
      if (!isChicken(state, enemy)) events.push({ type: 'scrap', id: enemy.id, x: enemy.x, y: enemy.y });
    }
    const stunned = state.time < enemy.stunUntil - EPS;
    if (stunned && enemy.type !== 'big-glitch') {
      if (enemy.type === 'mimic' && enemy.state === 'lunge') {
        enemy.state = 'rest';
        enemy.stateUntil = state.time + def.restTime;
      }
      separate(state, enemy);
      continue;
    }
    if (isChicken(state, enemy)) {
      if (state.time >= enemy.stateUntil) {
        const a = nextRandom(state) * Math.PI * 2;
        enemy.dirX = Math.cos(a);
        enemy.dirY = Math.sin(a);
        enemy.stateUntil = state.time + CHICKEN_TURN;
      }
      moveBody(enemy, enemy.dirX * CHICKEN_SPEED * dt, enemy.dirY * CHICKEN_SPEED * dt, def.radius);
      separate(state, enemy);
      continue;
    }
    const dist = Math.hypot(hero.x - enemy.x, hero.y - enemy.y);
    let canDamage = true;
    if (enemy.type === 'slime') {
      const cycle = def.hopMove + def.hopPause;
      const phase = (state.time - enemy.spawnedAt) % cycle;
      enemy.state = phase < def.hopMove ? 'move' : 'pause';
      if (enemy.state === 'move') chase(enemy, hero, def.speed, dt);
    } else if (enemy.type === 'mimic') {
      if (enemy.state === 'idle' || (enemy.state !== 'lunge' && enemy.state !== 'rest')) {
        enemy.state = 'idle';
        if (dist <= def.triggerRange + EPS) {
          enemy.state = 'lunge';
          enemy.stateUntil = state.time + def.lungeTime;
          enemy.dirX = dist > EPS ? (hero.x - enemy.x) / dist : 0;
          enemy.dirY = dist > EPS ? (hero.y - enemy.y) / dist : 0;
        }
      } else if (enemy.state === 'lunge' && state.time >= enemy.stateUntil - EPS) {
        enemy.state = 'rest';
        enemy.stateUntil = state.time + def.restTime;
      } else if (enemy.state === 'rest' && state.time >= enemy.stateUntil - EPS) {
        enemy.state = 'idle';
      }
      if (enemy.state === 'lunge') moveBody(enemy, enemy.dirX * def.lungeSpeed * dt, enemy.dirY * def.lungeSpeed * dt, def.radius);
      canDamage = enemy.state === 'lunge';
    } else if (enemy.type === 'big-glitch') {
      if (!enemy.warned && state.time >= enemy.nextTeleportAt - def.teleportWarning - EPS) {
        enemy.warned = true;
        enemy.state = 'warn';
        events.push({ type: 'warn', id: enemy.id, x: enemy.x, y: enemy.y });
      }
      if (state.time >= enemy.nextTeleportAt - EPS) {
        teleportToward(enemy, hero, def);
        enemy.warned = false;
        enemy.state = 'chase';
        enemy.nextTeleportAt += def.teleportEvery;
        events.push({ type: 'teleport', id: enemy.id, x: enemy.x, y: enemy.y });
      } else if (!stunned) {
        chase(enemy, hero, def.speed, dt);
      }
      canDamage = !stunned;
    } else {
      chase(enemy, hero, def.speed, dt);
    }
    separate(state, enemy);
    if (canDamage) {
      const d = Math.hypot(hero.x - enemy.x, hero.y - enemy.y);
      if (d <= def.contact + EPS) hurtHero(state, def.dmg, enemy.x, enemy.y, events, enemy);
    }
  }
}

function teleportToward(enemy, hero, def) {
  const dx = hero.x - enemy.x;
  const dy = hero.y - enemy.y;
  const d = Math.hypot(dx, dy);
  if (d < EPS) return;
  let s = Math.min(def.teleportDistance, d - (def.contact - CONTACT_STOP_MARGIN));
  while (s > 0) {
    const nx = enemy.x + (dx / d) * s;
    const ny = enemy.y + (dy / d) * s;
    if (!boxHitsSolid(nx, ny, def.radius)) { enemy.x = nx; enemy.y = ny; return; }
    s -= 0.25;
  }
}

function updatePickups(state, events) {
  const hero = state.hero;
  let write = 0;
  for (let i = 0; i < state.pickups.length; i += 1) {
    const p = state.pickups[i];
    if (p.until <= state.time) continue;
    // At full hearts the pickup stays on the ground for later.
    if (hero.hearts < hero.maxHearts && Math.hypot(p.x - hero.x, p.y - hero.y) <= HEART_PICKUP_RANGE + EPS) {
      const before = hero.hearts;
      hero.hearts = Math.min(hero.maxHearts, hero.hearts + 1);
      events.push({ type: 'pickup', id: p.id, heal: hero.hearts - before, hearts: hero.hearts });
      continue;
    }
    state.pickups[write++] = p;
  }
  state.pickups.length = write;
}

function updatePuffs(state) {
  let write = 0;
  for (let i = 0; i < state.puffs.length; i += 1) {
    if (state.puffs[i].until > state.time) state.puffs[write++] = state.puffs[i];
  }
  state.puffs.length = write;
}

function recordHistory(state) {
  const hero = state.hero;
  hero.history.push({ t: state.time, x: hero.x, y: hero.y, hearts: hero.hearts });
  while (hero.history.length > 1 && hero.history[1].t <= state.time - HISTORY_SECONDS + EPS) hero.history.shift();
}

// Number of waves in this battle (5 for real plans; derived so custom plans work too).
export function waveTotal(state) {
  return state && state.plan && state.plan.length ? state.plan.length : 1;
}

function updateWaves(state, events) {
  const entries = state.plan[state.wave - 1] || [];
  const done = state.spawnIndex >= entries.length && state.enemies.length === 0;
  if (!done) { state.waveClearedAt = null; return; }
  if (state.waveClearedAt === null) state.waveClearedAt = state.time;
  if (state.wave >= waveTotal(state)) { end(state, 'victory', events); return; }
  if (state.time - state.waveClearedAt >= WAVE_GAP - EPS) {
    state.wave += 1;
    state.waveStartedAt = state.time;
    state.waveClearedAt = null;
    state.spawnIndex = 0;
    const hero = state.hero;
    const before = hero.hearts;
    hero.hearts = Math.min(hero.maxHearts, hero.hearts + WAVE_CLEAR_HEAL);
    events.push({ type: 'heal', source: 'wave', amount: hero.hearts - before, hearts: hero.hearts });
    events.push({ type: 'wave', wave: state.wave });
    spawnDue(state, events);
  }
}

export function step(state, input, dt) {
  const events = [];
  const now = blankInput();
  if (input) INPUT_KEYS.forEach((key) => { now[key] = Boolean(input[key]); });
  const pressed = {};
  EDGE_KEYS.forEach((key) => { pressed[key] = now[key] && !state.lastInput[key]; });
  state.lastInput = now;
  if (state.phase === 'ended') return { state, events };
  if (pressed.pause) {
    state.phase = state.phase === 'paused' ? 'playing' : 'paused';
    events.push({ type: state.phase === 'paused' ? 'pause' : 'resume' });
    return { state, events };
  }
  if (state.phase === 'paused') return { state, events };

  const d = Math.max(0, Math.min(MAX_DT, Number(dt) || 0));
  state.time += d;
  state.timeLeft = Math.max(0, state.timeLeft - d);

  if (!state.waveAnnounced) {
    state.waveAnnounced = true;
    events.push({ type: 'wave', wave: state.wave });
  }

  updateHero(state, now, pressed, d, events);
  updateSwing(state, events);
  updateBolts(state, d, events);
  spawnDue(state, events);
  updateEnemies(state, d, events);
  applyFort(state, d);
  updateSwing(state, events);
  if (state.phase === 'playing') updatePickups(state, events);
  updatePuffs(state);
  if (state.phase === 'playing') recordHistory(state);
  if (state.phase === 'playing') updateWaves(state, events);
  if (state.phase === 'playing') separateAll(state);
  if (state.phase === 'playing' && state.timeLeft <= EPS) end(state, 'time', events);
  return { state, events };
}

export function resultOf(state) {
  return { outcome: state.outcome, ms: Math.round(state.time * 1000), poofs: state.poofs };
}
