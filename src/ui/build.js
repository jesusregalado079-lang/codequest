// Level Maker: tap a tool, tap the grid. Reuses the game's own Renderer so
// what you paint is exactly what you'll play.
import { getWorld } from '../levels/index.js';
import { Renderer } from '../engine/renderer.js';
import { getActiveProfile, completeLevel } from '../progress.js';
import {
  blankGrid, setCell, saveLevel, getLevel, findProblems, toPlayable, W, H,
} from '../custom-levels.js';
import { sounds } from './sounds.js';

const profile = getActiveProfile();
if (!profile) location.replace('index.html');

const world = getWorld('world8');
const editId = new URLSearchParams(location.search).get('edit');
const existing = editId ? getLevel(editId) : null;

const level = existing ?? {
  id: crypto.randomUUID(),
  name: '',
  author: profile?.name ?? 'someone',
  grid: blankGrid(),
  startDir: 1,
};

const canvas = document.getElementById('stage');
const renderer = new Renderer(canvas, level, { theme: world.theme, armor: profile?.armor });
window.addEventListener('resize', () => renderer.resize());
document.getElementById('name').value = level.name;

// ---------- tools ----------
const TOOLS = [
  { ch: '#', label: '🧱 wall' },
  { ch: '.', label: '⬜ floor' },
  { ch: 'G', label: '💎 gem' },
  { ch: 'E', label: '🏁 flag' },
  { ch: 'S', label: '🦸 hero' },
];
let tool = '#';
const toolBox = document.getElementById('tools');
TOOLS.forEach((t) => {
  const b = document.createElement('button');
  b.className = `snippet ${t.ch === tool ? 'selected' : ''}`;
  b.textContent = t.label;
  b.onclick = () => {
    sounds.tap();
    tool = t.ch;
    toolBox.querySelectorAll('button').forEach((x) => x.classList.remove('selected'));
    b.classList.add('selected');
  };
  toolBox.append(b);
});

// ---------- painting ----------
function redraw() {
  renderer.level = level;
  renderer.reset(); // re-reads the grid, keeps the hero where 'S' is
  showProblems();
}

function paint(x, y) {
  // the border stays solid so the hero can never walk into nothing
  if (x <= 0 || y <= 0 || x >= W - 1 || y >= H - 1) return;
  const current = level.grid[y][x];
  if (tool === 'S') {
    level.grid = level.grid.map((row) => row.replace('S', '.'));
  }
  if (tool === 'E') {
    level.grid = level.grid.map((row) => row.replace('E', '.'));
  }
  if (current === 'S' && tool !== 'S') return; // don't paint over the hero
  level.grid[y] = setCell(level.grid[y], x, tool);
  sounds.tap();
  redraw();
}

const cellFromEvent = (e) => {
  const r = canvas.getBoundingClientRect();
  const p = e.touches?.[0] ?? e;
  return {
    x: Math.floor(((p.clientX - r.left) / r.width) * W),
    y: Math.floor(((p.clientY - r.top) / r.height) * H),
  };
};

let painting = false;
const start = (e) => { painting = true; const c = cellFromEvent(e); paint(c.x, c.y); e.preventDefault(); };
const move = (e) => { if (!painting) return; const c = cellFromEvent(e); paint(c.x, c.y); e.preventDefault(); };
const end = () => { painting = false; };
canvas.addEventListener('pointerdown', start);
canvas.addEventListener('pointermove', move);
window.addEventListener('pointerup', end);

document.getElementById('spin').onclick = () => {
  sounds.tap();
  level.startDir = (level.startDir + 1) % 4;
  redraw();
};

// ---------- feedback ----------
const errBox = document.getElementById('err');
function showProblems() {
  const problems = findProblems(level.grid);
  errBox.textContent = problems.join(' · ');
  return problems;
}

const toast = document.getElementById('toast');
let toastTimer;
function showToast(msg, ms = 2600) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), ms);
}

// ---------- save / test ----------
function commit() {
  const name = document.getElementById('name').value.trim();
  level.name = name || 'Untitled level';
  level.author = profile?.name ?? 'someone';
  saveLevel(level);
  // first save earns the Builder's Kit — reuses the star system, no new state
  completeLevel('world8-built', 3);
  return level;
}

document.getElementById('save').onclick = () => {
  if (findProblems(level.grid).some((p) => p.includes('needs exactly one hero') || p.includes('something to do'))) {
    sounds.bump();
    return showToast('Your level needs a hero and something to collect first!');
  }
  commit();
  sounds.win();
  showToast('💾 Saved to the Workshop!');
  setTimeout(() => { location.href = 'index.html'; }, 900);
};

document.getElementById('test').onclick = () => {
  if (findProblems(level.grid).some((p) => p.includes('needs exactly one hero') || p.includes('something to do'))) {
    sounds.bump();
    return showToast('Add a hero and a gem before testing!');
  }
  commit();
  location.href = `play.html?custom=${level.id}`;
};

document.getElementById('back').onclick = () => { location.href = 'index.html'; };

redraw();
if ('serviceWorker' in navigator && !import.meta.env.DEV) navigator.serviceWorker.register('sw.js');
