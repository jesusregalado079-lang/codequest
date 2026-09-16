// Computer Quest horde battle: enemy definitions, arena layout, and wave plans.
// Pure data + helpers. All randomness comes from the injected rng() (0..1).

export const WAVE_COUNT = 5;
export const WAVE_SPAWN_SPREAD = 4; // seconds a wave's regular enemies spawn over
export const BOSS_DELAY = 5; // seconds after a boss wave starts that its boss spawns (after the regulars)
export const MID_BOSS_WAVE = 3; // wave 3 ends with a mid-boss Mega Slime (all lessons)
export const MID_BOSS = 'mega-slime';
// Regular enemies per wave on the standard track: base + n.
const WAVE_BASE = [2, 3, 3, 3, 4];
// n = 5 mimics per wave (index = wave - 1). Mimics count toward the wave size.
const MIMICS_N5 = { standard: [0, 1, 0, 1, 1], guided: [0, 1, 0, 0, 0] };

// size: tiles wide/tall. radius: collision half-size. contact: hero hit distance (center to center).
export const ENEMIES = {
  slime: {
    id: 'slime', name: 'Glitch Slime', hp: 2, speed: 1.6, dmg: 1, size: 1, boss: false,
    radius: 0.35, contact: 0.5, hopMove: 0.28, hopPause: 0.42,
  },
  goblin: {
    id: 'goblin', name: 'Clutter Goblin', hp: 3, speed: 2.4, dmg: 1, size: 1, boss: false,
    radius: 0.35, contact: 0.5, scrapEvery: 3,
  },
  mimic: {
    id: 'mimic', name: 'Pop-up Mimic', hp: 4, speed: 0, lungeSpeed: 6, dmg: 1, size: 1, boss: false,
    radius: 0.35, contact: 0.5, triggerRange: 2.5, lungeTime: 0.4, restTime: 1.2,
  },
  'mega-slime': {
    id: 'mega-slime', name: 'Mega Slime', hp: 6, speed: 1.2, dmg: 1, size: 2, boss: true,
    radius: 0.9, contact: 1.1, splitInto: 'slime', splitCount: 2,
  },
  'big-glitch': {
    id: 'big-glitch', name: 'Big Glitch', hp: 12, speed: 1.5, dmg: 2, size: 2, boss: true,
    radius: 0.9, contact: 1.1, teleportEvery: 4, teleportDistance: 3, teleportWarning: 0.5,
  },
};

const ARENA_W = 20;
const ARENA_H = 12;
// Four 1x1 blocks, mirror-symmetric around the arena center (tile x <-> 19-x, tile y <-> 11-y).
const BLOCKS = [{ x: 5, y: 3 }, { x: 14, y: 3 }, { x: 5, y: 8 }, { x: 14, y: 8 }];

function buildGrid() {
  const grid = [];
  for (let y = 0; y < ARENA_H; y += 1) {
    const row = [];
    for (let x = 0; x < ARENA_W; x += 1) {
      row.push(x === 0 || y === 0 || x === ARENA_W - 1 || y === ARENA_H - 1 ? 1 : 0);
    }
    grid.push(row);
  }
  BLOCKS.forEach((b) => { grid[b.y][b.x] = 1; });
  return grid;
}

// grid[y][x]: 1 = solid (wall or block), 0 = grass. Tile (x, y) covers [x, x+1) x [y, y+1).
export const ARENA = {
  width: ARENA_W,
  height: ARENA_H,
  blocks: BLOCKS,
  grid: buildGrid(),
  heroSpawn: { x: ARENA_W / 2, y: ARENA_H / 2 },
  chest: { x: ARENA_W / 2, y: ARENA_H - 1.5 },
};

// Accepts tile coordinates or any real coordinates (floored). Outside the arena is solid.
export function isSolid(x, y) {
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  if (tx < 0 || ty < 0 || tx >= ARENA_W || ty >= ARENA_H) return true;
  return ARENA.grid[ty][tx] === 1;
}

function roll(rng) {
  const value = rng();
  if (typeof value !== 'number' || !(value >= 0)) return 0;
  return Math.min(1 - Number.EPSILON, value);
}

const pick = (rng, length) => Math.min(length - 1, Math.floor(roll(rng) * length));
const round3 = (v) => Math.round(v * 1000) / 1000;
const EDGES = ['top', 'bottom', 'left', 'right'];

// Center point for an edge spawn, just inside the border wall.
export function spawnPoint(entry, size) {
  if (entry.edge === 'interior') return { x: entry.x, y: entry.y };
  const m = size >= 2 ? 2 : 1.5;
  const pos = Math.max(0, Math.min(1, Number(entry.pos) || 0));
  if (entry.edge === 'top') return { x: m + pos * (ARENA_W - 2 * m), y: m };
  if (entry.edge === 'bottom') return { x: m + pos * (ARENA_W - 2 * m), y: ARENA_H - m };
  if (entry.edge === 'left') return { x: m, y: m + pos * (ARENA_H - 2 * m) };
  return { x: ARENA_W - m, y: m + pos * (ARENA_H - 2 * m) };
}

export const MIMIC_MIN_SPAWN_DISTANCE = 3;

function interiorCandidates() {
  const list = [];
  for (let ty = 2; ty < ARENA_H - 2; ty += 1) {
    for (let tx = 2; tx < ARENA_W - 2; tx += 1) {
      if (isSolid(tx, ty)) continue;
      const x = tx + 0.5;
      const y = ty + 0.5;
      if (Math.hypot(x - ARENA.heroSpawn.x, y - ARENA.heroSpawn.y) >= MIMIC_MIN_SPAWN_DISTANCE) list.push({ x, y });
    }
  }
  return list;
}

export const waveSize = (lessonNumber, track, wave) => {
  const n = clampLesson(lessonNumber);
  const w = Math.max(1, Math.min(WAVE_COUNT, Math.floor(Number(wave)) || 1));
  const base = WAVE_BASE[w - 1] + n;
  return track === 'guided' ? Math.max(2, base - 1) : base;
};

function clampLesson(lessonNumber) {
  const n = Math.floor(Number(lessonNumber));
  return Number.isFinite(n) ? Math.max(1, Math.min(5, n)) : 1;
}

// Enemy HP for a lesson: Mega Slime has 4 HP for lessons 1-2 (both mid- and final boss), else ENEMIES data.
export const EARLY_MEGA_SLIME_HP = 4;
export function enemyHp(type, lessonNumber) {
  if (type === 'mega-slime' && clampLesson(lessonNumber) <= 2) return EARLY_MEGA_SLIME_HP;
  return ENEMIES[type].hp;
}

export const miniBossFor = (lessonNumber) => (clampLesson(lessonNumber) <= 3 ? 'mega-slime' : 'big-glitch');

// Boss appended after the regulars of a wave, or null: mid-boss in wave 3, final mini-boss in wave 5.
export function bossForWave(lessonNumber, wave) {
  if (wave === MID_BOSS_WAVE) return MID_BOSS;
  if (wave === WAVE_COUNT) return miniBossFor(lessonNumber);
  return null;
}

// Returns WAVE_COUNT (5) waves; each is an ordered (by delay) array of spawn entries:
// { type, delay, edge: 'top'|'bottom'|'left'|'right'|'interior', pos: 0..1|null, x?, y? }
// Mimics use edge 'interior' with x/y tile-center coordinates and pos null.
// Bosses (see bossForWave) are appended last and are not part of the table count.
export function wavePlan(lessonNumber, track, rng) {
  const n = clampLesson(lessonNumber);
  const waves = [];
  for (let wave = 1; wave <= WAVE_COUNT; wave += 1) {
    const count = waveSize(n, track, wave);
    const mimics = n === 5 ? MIMICS_N5[track === 'guided' ? 'guided' : 'standard'][wave - 1] : 0;
    const goblins = n >= 3 ? Math.floor(count / 3) : 0;
    const types = [];
    for (let i = 0; i < mimics; i += 1) types.push('mimic');
    for (let i = 0; i < goblins; i += 1) types.push('goblin');
    while (types.length < count) types.push('slime');
    for (let i = types.length - 1; i > 0; i -= 1) {
      const j = pick(rng, i + 1);
      const tmp = types[i]; types[i] = types[j]; types[j] = tmp;
    }
    const candidates = mimics ? interiorCandidates() : [];
    const entries = types.map((type, i) => {
      const delay = count > 1 ? round3((WAVE_SPAWN_SPREAD * i) / (count - 1)) : 0;
      if (type === 'mimic') {
        const spot = candidates.splice(pick(rng, candidates.length), 1)[0];
        return { type, delay, edge: 'interior', pos: null, x: spot.x, y: spot.y };
      }
      return { type, delay, edge: EDGES[pick(rng, 4)], pos: round3(roll(rng)) };
    });
    const boss = bossForWave(n, wave);
    if (boss) entries.push({ type: boss, delay: BOSS_DELAY, edge: EDGES[pick(rng, 4)], pos: round3(roll(rng)) });
    waves.push(entries);
  }
  return waves;
}
