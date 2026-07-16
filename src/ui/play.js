// Game screen: Blockly workspace + canvas stage + run/reset loop.
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import { WORLDS, findLevel, worldUnlocked, levelUnlocked } from '../levels/index.js';
import { loadLevel, isWin } from '../engine/world.js';
import { runProgram } from '../engine/runner.js';
import { Renderer } from '../engine/renderer.js';
import { defineBlocks, toolboxFor, cleanCode } from '../blocks/blocks.js';
import { getActiveProfile, completeLevel } from '../progress.js';
import { sounds } from './sounds.js';

const profile = getActiveProfile();
if (!profile) location.replace('index.html');

const levelId = new URLSearchParams(location.search).get('level');
const found = findLevel(levelId) ?? { world: WORLDS[0], level: WORLDS[0].levels[0], index: 0 };
const { world, level, index: levelIndex } = found;

// no skipping ahead via URL — locked levels bounce back to the map
if (profile && !(worldUnlocked(WORLDS.indexOf(world), profile) && levelUnlocked(world, levelIndex, profile))) {
  location.replace('index.html');
}

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
  maxInstances: level.maxInstances,
});

const canvas = document.getElementById('stage');
const renderer = new Renderer(canvas, level, { theme: world.theme, armor: profile?.armor });
window.addEventListener('resize', () => renderer.resize());

// </> panel: kids see their blocks as the real JavaScript they generate.
// Explorer mode only — sprouts aren't reading yet.
const codeBtn = document.getElementById('code-toggle');
const codePanel = document.getElementById('code-panel');
if (profile.mode === 'sprout') {
  codeBtn.classList.add('hidden');
} else {
  codeBtn.onclick = () => {
    sounds.tap();
    codePanel.classList.toggle('hidden');
    renderer.resize();
  };
  workspace.addChangeListener((e) => {
    if (e.isUiEvent) return;
    codePanel.querySelector('code').textContent =
      cleanCode(workspace).trim() || '// drag blocks to write code!';
  });
}

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
  // shadow blocks (the number inside "repeat 3") don't count against stars
  const blockCount = workspace.getAllBlocks(false).filter((b) => !b.isShadow()).length;
  if (blockCount === 0) {
    showToast('Drag some blocks in first! 👆');
    return;
  }
  sounds.tap();
  runBtn.disabled = true;
  workspace.highlightBlock(null);
  const code = javascriptGenerator.workspaceToCode(workspace);
  let world;
  try {
    world = runProgram(code, loadLevel(level));
  } catch {
    // e.g. a ⭐ call with no matching teach block
    runBtn.disabled = false;
    showToast('🤔 A move isn\'t taught yet — check your 🧩 blocks!');
    return;
  }
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
  const isLast = levelIndex >= world.levels.length - 1;
  next.textContent = isLast ? 'World review 🎓' : 'Next level ▶';
  next.onclick = () => {
    location.href = isLast
      ? `world.html?world=${world.id}&view=recap`
      : `play.html?level=${world.levels[levelIndex + 1].id}`;
  };
  document.getElementById('again').onclick = () => {
    winOverlay.classList.add('hidden');
    renderer.reset();
  };
  winOverlay.classList.remove('hidden');
}

if ('serviceWorker' in navigator && !import.meta.env.DEV) navigator.serviceWorker.register('sw.js');
