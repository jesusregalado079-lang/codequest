// Game screen: Blockly workspace + canvas stage + run/reset loop.
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import { WORLDS, findLevel, worldUnlocked, levelUnlocked, getWorld, levelUrl } from '../levels/index.js';
import { getLevel, decodeLevel, toPlayable } from '../custom-levels.js';
import { loadLevel, isWin } from '../engine/world.js';
import { runProgram } from '../engine/runner.js';
import { Renderer } from '../engine/renderer.js';
import { defineBlocks, toolboxFor, cleanCode } from '../blocks/blocks.js';
import { getActiveProfile, completeLevel } from '../progress.js';
import { sounds } from './sounds.js';
import { startCoach } from './coach.js';

const profile = getActiveProfile();
if (!profile) location.replace('index.html');

const params = new URLSearchParams(location.search);
const customId = params.get('custom');
const shared = params.get('shared');

// Kid-made levels: play them with every block unlocked, and don't let a
// homemade level touch the curriculum's stars or unlocks.
let custom = null;
if (customId) custom = getLevel(customId);
else if (shared) { try { custom = decodeLevel(shared); } catch { custom = null; } }

const found = custom
  ? { world: getWorld('world8'), level: toPlayable(custom), index: 0 }
  : findLevel(params.get('level')) ?? { world: WORLDS[0], level: WORLDS[0].levels[0], index: 0 };
const { world, level, index: levelIndex } = found;

// no skipping ahead via URL — locked levels bounce back to the map
if (!custom && profile
  && !(worldUnlocked(WORLDS.indexOf(world), profile) && levelUnlocked(world, levelIndex, profile))) {
  location.replace('index.html');
}

// expert kids type everything — never hand them blocks for a curriculum level
if (!custom && profile?.expert) location.replace(`code.html?level=${level.id}`);

document.getElementById('level-name').textContent =
  custom ? `${level.name} — by ${custom.author}` : `${levelIndex + 1}. ${level.name}`;

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
        const stars = custom ? 3 : starsFor(blockCount);
        if (!custom) completeLevel(level.id, stars);
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
  document.getElementById('win-msg').textContent = custom
    ? `You beat ${custom.author}'s level in ${blockCount} blocks!`
    : stars === 3
      ? `Perfect — solved in ${blockCount} blocks!`
      : `Solved in ${blockCount} blocks. Can you do it in ${level.par}?`;
  const next = document.getElementById('next');
  const isLast = !custom && levelIndex >= world.levels.length - 1;
  next.textContent = custom ? 'Back to the Workshop 🏗️' : isLast ? 'World review 🎓' : 'Next level ▶';
  next.onclick = () => {
    if (custom) return void (location.href = 'index.html');
    location.href = isLast
      ? `world.html?world=${world.id}&view=recap`
      : levelUrl(world, world.levels[levelIndex + 1], profile);
  };
  document.getElementById('again').onclick = () => {
    winOverlay.classList.add('hidden');
    renderer.reset();
  };
  winOverlay.classList.remove('hidden');
}

// ---------- level 1 tutorial ----------
// Only the very first level, only once. It teaches the game itself: drag,
// snap, peek at the real code, run.
const tutorialKey = `codequest-tutorial-${profile?.id}`;
if (level.id === 'world1-1' && !localStorage.getItem(tutorialKey)) {
  const blocks = (type) =>
    workspace.getAllBlocks(false).filter((b) => !b.isShadow() && (!type || b.type === type));
  let ran = false;
  runBtn.addEventListener('click', () => { ran = true; });

  const steps = [
    {
      text: '👋 Hi! This is your robot. Your job: tell it how to reach the 💎.<br>' +
        'First, <b>drag the ⬆️ move forward block</b> out of the grey strip into the big white space →',
      spot: () => document.querySelector('.blockly-panel'),
      done: () => blocks('move_forward').length >= 1,
    },
    {
      text: '🎉 That\'s a program! Now drag <b>another ⬆️ move forward</b> and drop it just under the first one — ' +
        'they snap together like LEGO 🧱',
      done: () => blocks('move_forward').length >= 2,
    },
    {
      text: 'Last block: drag <b>💎 collect gem</b> onto the bottom of your stack. ' +
        'Walk, walk, grab — that\'s the plan!',
      done: () => blocks('collect_gem').length >= 1,
    },
    ...(profile?.mode === 'sprout' ? [] : [{
      text: '🤯 Secret: tap the <b>&lt;/&gt;</b> button up there. Those blocks ARE real JavaScript — ' +
        'the same code grown-up programmers write. Tap it any time!',
      spot: () => document.getElementById('code-toggle'),
      done: () => !codePanel.classList.contains('hidden'),
    }]),
    {
      text: 'Now the fun part — press <b>▶ Run</b> and watch your robot follow your orders!',
      spot: () => document.getElementById('run'),
      done: () => ran,
    },
  ];

  startCoach(steps, { onDone: () => localStorage.setItem(tutorialKey, '1') });
}

if ('serviceWorker' in navigator && !import.meta.env.DEV) navigator.serviceWorker.register('sw.js');
