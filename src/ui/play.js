// Game screen: Blockly workspace + canvas stage + run/reset loop.
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import world1 from '../levels/world1.json';
import { loadLevel, isWin } from '../engine/world.js';
import { runProgram } from '../engine/runner.js';
import { Renderer } from '../engine/renderer.js';
import { defineBlocks, toolboxFor } from '../blocks/blocks.js';
import { getActiveProfile, completeLevel } from '../progress.js';
import { sounds } from './sounds.js';

const profile = getActiveProfile();
if (!profile) location.replace('index.html');

const levelId = new URLSearchParams(location.search).get('level');
const levelIndex = world1.levels.findIndex((l) => l.id === levelId);
const level = world1.levels[levelIndex] ?? world1.levels[0];

document.getElementById('level-name').textContent =
  `${levelIndex + 1}. ${level.name}`;

defineBlocks(profile.mode === 'sprout');
const workspace = Blockly.inject('blockly', {
  toolbox: toolboxFor(level.allowedBlocks),
  renderer: 'zelos', // Scratch-style big blocks, best for touch
  trashcan: true,
  scrollbars: true,
  sounds: false,
  zoom: { startScale: profile.mode === 'sprout' ? 1.1 : 0.9 },
});

const canvas = document.getElementById('stage');
const renderer = new Renderer(canvas, level);
window.addEventListener('resize', () => renderer.resize());

const runBtn = document.getElementById('run');
const toast = document.getElementById('toast');
let toastTimer;
let fails = 0;

function showToast(msg, ms = 2600) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), ms);
}

function starsFor(blockCount) {
  if (blockCount <= level.par) return 3;
  if (blockCount <= level.par + 2) return 2;
  return 1;
}

runBtn.onclick = () => {
  const blockCount = workspace.getAllBlocks(false).length;
  if (blockCount === 0) {
    showToast('Drag some blocks in first! 👆');
    return;
  }
  sounds.tap();
  runBtn.disabled = true;
  workspace.highlightBlock(null);
  const code = javascriptGenerator.workspaceToCode(workspace);
  const world = runProgram(code, loadLevel(level));
  const speed = Number(document.getElementById('speed').value);
  renderer.play(world.events, {
    speed,
    onEvent(ev) {
      if (ev.blockId) workspace.highlightBlock(ev.blockId);
      if (ev.type === 'collect') sounds.collect();
      if (ev.type === 'bump') sounds.bump();
    },
    onDone() {
      runBtn.disabled = false;
      workspace.highlightBlock(null);
      if (isWin(world)) {
        fails = 0;
        const stars = starsFor(blockCount);
        completeLevel(level.id, stars);
        sounds.win();
        showWin(stars, blockCount);
      } else {
        fails++;
        if (world.failed) {
          const timedOut = world.events.some((e) => e.type === 'timeout');
          showToast(timedOut ? 'Whoa, that ran forever! Let’s stop and rethink 🌀' : 'Bonk! A wall. Try a different path 💪');
        } else if (world.gems.size > 0) {
          showToast(`Almost! ${world.gems.size} gem${world.gems.size > 1 ? 's' : ''} left 💎`);
        } else {
          showToast('All gems! Now reach the flag 🏁');
        }
        if (fails >= 2) setTimeout(() => showToast(`💡 ${level.hint}`, 5000), 2800);
      }
    },
  });
};

document.getElementById('reset').onclick = () => {
  sounds.tap();
  renderer.stop();
  renderer.reset();
  workspace.highlightBlock(null);
  runBtn.disabled = false;
};

document.getElementById('hint').onclick = () => {
  sounds.tap();
  showToast(`💡 ${level.hint}`, 5000);
};

document.getElementById('back').onclick = () => { location.href = 'index.html'; };

// ---------- win overlay ----------
const winOverlay = document.getElementById('win');
function showWin(stars, blockCount) {
  document.getElementById('win-stars').textContent =
    '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
  document.getElementById('win-msg').textContent =
    stars === 3
      ? `Perfect — solved in ${blockCount} blocks!`
      : `Solved in ${blockCount} blocks. Can you do it in ${level.par}?`;
  const next = document.getElementById('next');
  const isLast = levelIndex >= world1.levels.length - 1;
  next.textContent = isLast ? 'Back to map 🗺️' : 'Next level ▶';
  next.onclick = () => {
    location.href = isLast
      ? 'index.html'
      : `play.html?level=${world1.levels[levelIndex + 1].id}`;
  };
  document.getElementById('again').onclick = () => {
    winOverlay.classList.add('hidden');
    renderer.reset();
  };
  winOverlay.classList.remove('hidden');
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
