// Pure game state + actions. No DOM, no Blockly — runs in node for tests.
// Grid chars: '#' wall, '.' floor, ' ' void, 'S' start, 'G' gem, 'E' exit.
// dir: 0=N 1=E 2=S 3=W

const DELTA = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
];

export function loadLevel(def) {
  const grid = def.grid.map((row) => row.split(''));
  let pos = null;
  const gems = new Set();
  grid.forEach((row, y) =>
    row.forEach((c, x) => {
      if (c === 'S') { pos = { x, y }; grid[y][x] = '.'; }
      if (c === 'G') { gems.add(`${x},${y}`); grid[y][x] = '.'; }
    })
  );
  if (!pos) throw new Error(`level ${def.id}: no start tile`);
  return {
    grid,
    pos,
    dir: def.startDir ?? 1,
    gems,
    totalGems: gems.size,
    events: [],
    failed: false,
  };
}

export function tile(w, x, y) {
  return w.grid[y]?.[x] ?? ' ';
}

export class Bump extends Error {}

export function moveForward(w, blockId) {
  const d = DELTA[w.dir];
  const nx = w.pos.x + d.x;
  const ny = w.pos.y + d.y;
  const t = tile(w, nx, ny);
  if (t === '#' || t === ' ') {
    w.events.push({ type: 'bump', dir: w.dir, at: { ...w.pos }, blockId });
    w.failed = true;
    throw new Bump('bump');
  }
  w.events.push({ type: 'move', from: { ...w.pos }, to: { x: nx, y: ny }, blockId });
  w.pos = { x: nx, y: ny };
}

export function turn(w, delta, blockId) {
  w.dir = (w.dir + delta + 4) % 4;
  w.events.push({ type: 'turn', dir: w.dir, blockId });
}

export function collect(w, blockId) {
  const key = `${w.pos.x},${w.pos.y}`;
  if (w.gems.has(key)) {
    w.gems.delete(key);
    w.events.push({ type: 'collect', at: { ...w.pos }, blockId });
  } else {
    w.events.push({ type: 'nogem', at: { ...w.pos }, blockId });
  }
}

export function isWin(w) {
  if (w.failed || w.gems.size > 0) return false;
  const hasExit = w.grid.some((row) => row.includes('E'));
  return hasExit ? tile(w, w.pos.x, w.pos.y) === 'E' : true;
}
