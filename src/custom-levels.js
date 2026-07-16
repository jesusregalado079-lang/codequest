// Kid-made levels. Stored per device, not per profile — both kids share the
// iPad, so a level one builds is a level the other can be dared to beat.
import { tile } from './engine/world.js';

const KEY = 'codequest-levels-v1';
export const W = 9;
export const H = 7;

export function blankGrid() {
  return Array.from({ length: H }, (_, y) =>
    Array.from({ length: W }, (_, x) =>
      (y === 0 || y === H - 1 || x === 0 || x === W - 1) ? '#' : '.'
    ).join('')
  ).map((row, y) => (y === Math.floor(H / 2) ? setCell(row, 1, 'S') : row));
}

export function setCell(row, x, ch) {
  return row.slice(0, x) + ch + row.slice(x + 1);
}

export function listLevels() {
  try {
    const all = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(all) ? all : [];
  } catch {
    return [];
  }
}

export function saveLevel(level) {
  const all = listLevels().filter((l) => l.id !== level.id);
  all.unshift(level);
  localStorage.setItem(KEY, JSON.stringify(all.slice(0, 60)));
}

export function deleteLevel(id) {
  localStorage.setItem(KEY, JSON.stringify(listLevels().filter((l) => l.id !== id)));
}

export function getLevel(id) {
  return listLevels().find((l) => l.id === id) ?? null;
}

// Levels travel as base64 in a URL so a level can leave the device if a
// grown-up wants to send one. Kid-facing sharing is just the Workshop list.
export function encodeLevel(level) {
  const slim = { name: level.name, author: level.author, grid: level.grid, startDir: level.startDir };
  return btoa(unescape(encodeURIComponent(JSON.stringify(slim))));
}

export function decodeLevel(text) {
  const raw = JSON.parse(decodeURIComponent(escape(atob(text))));
  if (!Array.isArray(raw.grid) || !raw.grid.every((r) => typeof r === 'string')) {
    throw new Error('not a level');
  }
  return {
    id: 'shared',
    name: String(raw.name ?? 'Shared level').slice(0, 24),
    author: String(raw.author ?? 'a friend').slice(0, 14),
    grid: raw.grid.slice(0, 20).map((r) => r.slice(0, 30)),
    startDir: [0, 1, 2, 3].includes(raw.startDir) ? raw.startDir : 1,
    snippets: [],
    allowedBlocks: ALL_BLOCKS,
    par: 999,
    hint: 'Someone built this one. Good luck! 😈',
  };
}

export const ALL_BLOCKS = [
  'move_forward', 'turn_left', 'turn_right', 'collect_gem',
  'repeat', 'if_do', 'if_else', 'def_star', 'call_star', 'def_moon', 'call_moon',
  'backpack_add', 'repeat_count',
];

// A custom level dressed up as a normal level object the play page understands.
export function toPlayable(level) {
  return {
    id: `custom-${level.id}`,
    name: level.name,
    grid: level.grid,
    startDir: level.startDir,
    allowedBlocks: ALL_BLOCKS,
    par: 999, // kid-made: always 3 stars for beating it, no par shaming
    hint: `${level.author} built this one. Look for the path! 🗺️`,
  };
}

// Warns the builder about a level nobody can finish. Not a blocker — a kid is
// allowed to build something evil on purpose.
export function findProblems(grid) {
  const problems = [];
  const cells = grid.map((r) => [...r]);
  const starts = [];
  let gems = 0;
  let exits = 0;
  cells.forEach((row, y) => row.forEach((c, x) => {
    if (c === 'S') starts.push({ x, y });
    if (c === 'G') gems++;
    if (c === 'E') exits++;
  }));
  if (starts.length !== 1) return ['Your level needs exactly one hero 🦸'];
  if (!gems && !exits) problems.push('Add a gem 💎 or a flag 🏁 — there has to be something to do!');

  const world = { grid: cells, gems: new Set() };
  const seen = new Set([`${starts[0].x},${starts[0].y}`]);
  const queue = [starts[0]];
  while (queue.length) {
    const { x, y } = queue.pop();
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const nx = x + dx;
      const ny = y + dy;
      const t = tile(world, nx, ny);
      if (t === '#' || t === ' ' || seen.has(`${nx},${ny}`)) continue;
      seen.add(`${nx},${ny}`);
      queue.push({ x: nx, y: ny });
    }
  }
  const stranded = [];
  cells.forEach((row, y) => row.forEach((c, x) => {
    if ((c === 'G' || c === 'E') && !seen.has(`${x},${y}`)) stranded.push(c);
  }));
  if (stranded.length) {
    problems.push(`${stranded.length} thing${stranded.length > 1 ? 's' : ''} can't be reached — walled off! (fine if you meant it 😈)`);
  }
  return problems;
}
