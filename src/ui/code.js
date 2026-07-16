// World 7: the blocks come off. Same grid engine, same puzzles — but the kid
// types the JavaScript. A plain textarea (not a code editor lib) keeps the
// iPad keyboard native; snippet buttons spare small fingers the ( ) { } ; hunt.
import { WORLDS, findLevel, worldUnlocked, levelUnlocked, levelUrl } from '../levels/index.js';
import { loadLevel, isWin } from '../engine/world.js';
import { runProgram } from '../engine/runner.js';
import { Renderer } from '../engine/renderer.js';
import { getActiveProfile, completeLevel } from '../progress.js';
import { friendlyError } from './errors.js';
import { sounds } from './sounds.js';

const profile = getActiveProfile();
if (!profile) location.replace('index.html');

const levelId = new URLSearchParams(location.search).get('level');
const found = findLevel(levelId) ?? { world: WORLDS[6], level: WORLDS[6].levels[0], index: 0 };
const { world, level, index: levelIndex } = found;

if (profile && !(worldUnlocked(WORLDS.indexOf(world), profile) && levelUnlocked(world, levelIndex, profile))) {
  location.replace('index.html');
}

document.getElementById('level-name').textContent = `${levelIndex + 1}. ${level.name}`;

const canvas = document.getElementById('stage');
const renderer = new Renderer(canvas, level, { theme: world.theme, armor: profile?.armor });
window.addEventListener('resize', () => renderer.resize());

// ---------- editor ----------
const editor = document.getElementById('editor');
const errBox = document.getElementById('err');
const storageKey = `codequest-code-${profile?.id}-${level.id}`;
editor.value = localStorage.getItem(storageKey) ?? level.starter ?? '';
editor.oninput = () => {
  localStorage.setItem(storageKey, editor.value);
  errBox.textContent = '';
};

// Tap-to-insert snippets: the same shapes they dragged as blocks, now as text.
const SNIPPETS = {
  move: { label: '⬆️ move', text: 'moveForward();\n' },
  left: { label: '↪️ left', text: 'turnLeft();\n' },
  right: { label: '↩️ right', text: 'turnRight();\n' },
  collect: { label: '💎 collect', text: 'collectGem();\n' },
  loop: { label: '🔁 loop', text: 'for (var i = 0; i < 4; i++) {\n  \n}\n' },
  if_gem: { label: '🤔 if gem', text: 'if (onGem()) {\n  \n}\n' },
  if_path: { label: '🤔 if path', text: 'if (pathAhead()) {\n  \n} else {\n  \n}\n' },
  func: { label: '🧩 function', text: 'function star() {\n  \n}\n' },
  call: { label: '⭐ star()', text: 'star();\n' },
  vardec: { label: '🎒 var', text: 'var gems = 0;\n' },
  varadd: { label: '🎒 +1', text: 'gems = gems + 1;\n' },
  loopvar: { label: '🔁 gems', text: 'for (var i = 0; i < gems; i++) {\n  \n}\n' },
};

const snipBox = document.getElementById('snippets');
for (const id of level.snippets ?? []) {
  const s = SNIPPETS[id];
  if (!s) continue;
  const b = document.createElement('button');
  b.className = 'snippet';
  b.textContent = s.label;
  b.onclick = () => {
    sounds.tap();
    const start = editor.selectionStart;
    const before = editor.value.slice(0, start);
    const pad = before === '' || before.endsWith('\n') ? '' : '\n';
    editor.setRangeText(pad + s.text, start, editor.selectionEnd, 'end');
    editor.focus();
    editor.dispatchEvent(new Event('input'));
  };
  snipBox.append(b);
}

// ---------- run ----------
const runBtn = document.getElementById('run');
const toast = document.getElementById('toast');
let toastTimer;
let fails = 0;

function showToast(msg, ms = 3000) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), ms);
}

const codeLines = () =>
  editor.value.split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('//')).length;

runBtn.onclick = () => {
  const code = editor.value;
  if (!codeLines()) return showToast('Type some code first! ⌨️');
  sounds.tap();
  errBox.textContent = '';
  runBtn.disabled = true;
  let world_;
  try {
    world_ = runProgram(code, loadLevel(level));
  } catch (e) {
    // syntax + runtime errors are the lesson here, not a crash
    runBtn.disabled = false;
    sounds.bump();
    errBox.textContent = friendlyError(e, code);
    return;
  }
  const speed = Number(document.getElementById('speed').value);
  renderer.play(world_.events, {
    speed,
    onEvent(ev) {
      if (ev.type === 'collect') sounds.collect();
      if (ev.type === 'bump') sounds.bump();
    },
    onDone() {
      runBtn.disabled = false;
      if (isWin(world_)) {
        fails = 0;
        const lines = codeLines();
        const stars = lines <= level.par ? 3 : lines <= level.par + 3 ? 2 : 1;
        completeLevel(level.id, stars);
        sounds.win();
        showWin(stars, lines);
      } else {
        fails++;
        const timedOut = world_.events.some((e) => e.type === 'timeout');
        if (world_.failed) {
          showToast(timedOut
            ? '🌀 That ran forever — check your loop counter!'
            : '🧱 Bonk! The robot hit a wall — retrace your steps');
        } else if (world_.gems.size > 0) {
          showToast(`Almost! ${world_.gems.size} gem${world_.gems.size > 1 ? 's' : ''} left 💎`);
        } else {
          showToast('All gems! Now land on the flag 🏁');
        }
        if (fails >= 2) setTimeout(() => showToast(`💡 ${level.hint}`, 7000), 3200);
      }
    },
  });
};

document.getElementById('reset').onclick = () => {
  sounds.tap();
  renderer.stop();
  renderer.reset();
  runBtn.disabled = false;
  editor.value = level.starter ?? '';
  localStorage.removeItem(storageKey);
  errBox.textContent = '';
};

document.getElementById('hint').onclick = () => { sounds.tap(); showToast(`💡 ${level.hint}`, 7000); };
document.getElementById('back').onclick = () => { location.href = 'index.html'; };

// ---------- win ----------
const winOverlay = document.getElementById('win');
function showWin(stars, lines) {
  document.getElementById('win-stars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
  document.getElementById('win-msg').textContent =
    stars === 3
      ? `Real JavaScript, ${lines} lines, written by you.`
      : `It works — ${lines} lines. A tighter program fits in ${level.par}.`;
  const next = document.getElementById('next');
  const isLast = levelIndex >= world.levels.length - 1;
  next.textContent = isLast ? 'World review 🎓' : 'Next level ▶';
  next.onclick = () => {
    location.href = isLast
      ? `world.html?world=${world.id}&view=recap`
      : levelUrl(world, world.levels[levelIndex + 1]);
  };
  document.getElementById('again').onclick = () => {
    winOverlay.classList.add('hidden');
    renderer.reset();
  };
  winOverlay.classList.remove('hidden');
}

if ('serviceWorker' in navigator && !import.meta.env.DEV) navigator.serviceWorker.register('sw.js');
