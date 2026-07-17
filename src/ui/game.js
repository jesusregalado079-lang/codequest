// World 6 game page: kids wire event handlers, ▶ Test grades the game with a
// scripted player, 🎮 Play hands them the controls of the game they just built.
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import { WORLDS, findLevel, worldUnlocked, levelUnlocked, levelUrl } from '../levels/index.js';
import { runGame, createLiveGame } from '../engine/arcade-runner.js';
import { COLS, ROWS } from '../engine/arcade.js';
import { defineBlocks, toolboxFor, cleanCode } from '../blocks/blocks.js';
import { getActiveProfile, completeLevel } from '../progress.js';
import { drawHero, getArmor } from './hero.js';
import { sounds } from './sounds.js';

const profile = getActiveProfile();
if (!profile) location.replace('index.html');

const missionId = new URLSearchParams(location.search).get('mission');
const found = findLevel(missionId) ?? { world: WORLDS[5], level: WORLDS[5].levels[0], index: 0 };
const { world, level: mission, index: missionIndex } = found;

if (profile && !(worldUnlocked(WORLDS.indexOf(world), profile) && levelUnlocked(world, missionIndex, profile))) {
  location.replace('index.html');
}

document.getElementById('level-name').textContent = `${missionIndex + 1}. ${mission.name}`;

defineBlocks(profile.mode === 'sprout');
const workspace = Blockly.inject('blockly', {
  toolbox: toolboxFor(mission.allowedBlocks),
  renderer: 'zelos',
  media: 'media/', // ship Blockly's icons ourselves — no third-party fetch
  trashcan: true,
  scrollbars: true,
  sounds: false,
  zoom: { startScale: profile.mode === 'sprout' ? 1.0 : 0.8 },
  maxInstances: mission.maxInstances,
});

// ---------- rendering ----------
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const armor = getArmor(profile?.armor);
const theme = world.theme;
let tile = 40;

function resize() {
  const box = canvas.parentElement.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  tile = Math.max(20, Math.floor(Math.min(box.width / COLS, box.height / ROWS)));
  canvas.width = COLS * tile * dpr;
  canvas.height = ROWS * tile * dpr;
  canvas.style.width = `${COLS * tile}px`;
  canvas.style.height = `${ROWS * tile}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw(current);
}
window.addEventListener('resize', resize);

function draw(frame) {
  if (!frame) return;
  ctx.fillStyle = theme.wallDark;
  ctx.fillRect(0, 0, COLS * tile, ROWS * tile);
  for (let x = 0; x < COLS; x++) {
    ctx.fillStyle = x % 2 ? theme.floorA : theme.floorB;
    ctx.fillRect(x * tile, 0, tile, ROWS * tile);
  }
  // ground line
  ctx.fillStyle = theme.wallLight;
  ctx.fillRect(0, (ROWS - 1) * tile + tile * 0.75, COLS * tile, tile * 0.25);
  ctx.font = `${tile * 0.62}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const gem of frame.gems) {
    ctx.fillText('💎', gem.lane * tile + tile / 2, gem.row * tile + tile / 2);
  }
  drawHero(ctx, frame.lane * tile + tile / 2, (ROWS - 1) * tile + tile * 0.62, tile * 0.95, armor);
  hudScore.textContent = `🏆 ${frame.score}`;
  hudLives.textContent = '❤️'.repeat(frame.lives) + '🖤'.repeat(Math.max(0, 3 - frame.lives));
  hudMsg.textContent = frame.message;
}

const hudScore = document.getElementById('hud-score');
const hudLives = document.getElementById('hud-lives');
const hudMsg = document.getElementById('hud-msg');
const blankFrame = { lane: mission.startLane ?? 3, gems: [], score: 0, lives: mission.lives ?? 3, message: '', over: false };
let current = blankFrame;
resize();

// ---------- code panel ----------
const codeBtn = document.getElementById('code-toggle');
const codePanel = document.getElementById('code-panel');
if (profile.mode === 'sprout') {
  codeBtn.classList.add('hidden');
} else {
  codeBtn.onclick = () => { sounds.tap(); codePanel.classList.toggle('hidden'); resize(); };
  workspace.addChangeListener((e) => {
    if (e.isUiEvent) return;
    codePanel.querySelector('code').textContent =
      cleanCode(workspace).trim() || '// wire up an event to start!';
  });
}

// ---------- toast ----------
const toast = document.getElementById('toast');
let toastTimer;
function showToast(msg, ms = 3200) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), ms);
}

// ---------- test run (graded) ----------
const runBtn = document.getElementById('run');
const playBtn = document.getElementById('play');
let animTimer = null;
let live = null;
let fails = 0;

function stopEverything() {
  clearTimeout(animTimer);
  animTimer = null;
  if (live) { cancelAnimationFrame(live.raf); live = null; }
  document.querySelectorAll('.arrow').forEach((b) => b.classList.add('hidden'));
}

runBtn.onclick = () => {
  const blockCount = workspace.getAllBlocks(false).filter((b) => !b.isShadow()).length;
  if (blockCount === 0) return showToast('Drag an event block in first! 👆');
  sounds.tap();
  stopEverything();
  runBtn.disabled = true;
  const result = runGame(javascriptGenerator.workspaceToCode(workspace), mission);
  let i = 0;
  const nextFrame = () => {
    if (i >= result.frames.length) {
      runBtn.disabled = false;
      if (result.passed) {
        fails = 0;
        const stars = blockCount <= mission.par ? 3 : blockCount <= mission.par + 2 ? 2 : 1;
        completeLevel(mission.id, stars);
        sounds.win();
        showWin(stars, blockCount);
      } else {
        fails++;
        sounds.bump();
        showToast(`Not yet — ${result.fails[0]}`);
        if (fails >= 2) setTimeout(() => showToast(`💡 ${mission.hint}`, 6000), 3400);
      }
      return;
    }
    current = result.frames[i++];
    draw(current);
    if (current.event === 'catch') sounds.collect();
    if (current.event === 'miss') sounds.bump();
    animTimer = setTimeout(nextFrame, 170);
  };
  nextFrame();
};

document.getElementById('reset').onclick = () => {
  sounds.tap();
  stopEverything();
  runBtn.disabled = false;
  playBtn.classList.add('hidden');
  current = blankFrame;
  draw(current);
};

document.getElementById('hint').onclick = () => { sounds.tap(); showToast(`💡 ${mission.hint}`, 6000); };
document.getElementById('back').onclick = () => { location.href = 'index.html'; };

// ---------- free play (their game, their hands) ----------
function startPlay() {
  stopEverything();
  winOverlay.classList.add('hidden');
  playBtn.classList.remove('hidden');
  document.querySelectorAll('.arrow').forEach((b) => b.classList.remove('hidden'));
  const game = createLiveGame(javascriptGenerator.workspaceToCode(workspace), mission);
  const spawner = (t) => (t % 3 === 0 ? [{ tick: t, lane: Math.floor(Math.random() * COLS) }] : []);
  let last = performance.now();
  live = { game, raf: 0 };
  const loop = (now) => {
    if (!live) return;
    if (now - last > 420) {
      last = now;
      const before = game.state.score;
      const lives = game.state.lives;
      game.tick(spawner);
      if (game.state.score > before) sounds.collect();
      if (game.state.lives < lives) sounds.bump();
    }
    current = { ...game.state, gems: game.state.gems.map((g) => ({ ...g })) };
    draw(current);
    if (game.state.over) {
      showToast('Game over! Press 🎮 to play again');
      live = null;
      return;
    }
    live.raf = requestAnimationFrame(loop);
  };
  live.raf = requestAnimationFrame(loop);
}

playBtn.onclick = () => { sounds.tap(); startPlay(); };
const press = (key) => { if (live) live.game.press(key); };
document.getElementById('go-left').onclick = () => press('left');
document.getElementById('go-right').onclick = () => press('right');
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') press('left');
  if (e.key === 'ArrowRight') press('right');
});

// ---------- win overlay ----------
const winOverlay = document.getElementById('win');
function showWin(stars, blockCount) {
  document.getElementById('win-stars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
  document.getElementById('win-msg').textContent =
    stars === 3
      ? `Your game works — wired in ${blockCount} blocks!`
      : `It works! Built with ${blockCount} blocks. Can you do it in ${mission.par}?`;
  const next = document.getElementById('next');
  const isLast = missionIndex >= world.levels.length - 1;
  next.textContent = isLast ? 'World review 🎓' : 'Next mission ▶';
  next.onclick = () => {
    location.href = isLast
      ? `world.html?world=${world.id}&view=recap`
      : levelUrl(world, world.levels[missionIndex + 1], profile);
  };
  document.getElementById('again').onclick = startPlay;
  winOverlay.classList.remove('hidden');
}

if ('serviceWorker' in navigator && !import.meta.env.DEV) navigator.serviceWorker.register('sw.js');
