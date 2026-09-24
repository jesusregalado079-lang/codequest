// Computer Quest horde battle screen: canvas + DOM HUD, fixed-step rAF loop, keyboard, pause,
// how-to card, no-keyboard fallback and WebAudio tones. Mounted by lesson-ui.js on the key screen.
import { normalizeCq, setProgress } from '../character.js';
import { drawIcon } from '../sprite.js';
import { createBattle, resultOf, spawnEnemy, step, waveTotal } from './engine.js';
import { drawSlotIcon, FX_LIFE, MAX_FX, PARTICLE_LIFE, renderBattle } from './render.js';
import { SPECIAL_MAX } from './specials.js';
import { advanceTraining, startTraining, TRAINING_MARKER, trainingStep } from './tutorial.js';
import {
  blankInput, doneOnce, fitView, formatClock, HOWTO_TIP, howToKeys, hudSlots, isActivationKey, isInteractiveOutside, keyAction, keyId,
  slotStatus, waveBanner, waveLabel,
} from './view.js';

const DT = 1 / 60;
const MAX_STEPS = 5;
const NO_KEYBOARD_MS = 3000;
const HOWTO_MS = 8000;
const MAX_PARTICLES = 24;
const SHAKE_GAP = 0.25;
const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function howToKey(profileId) {
  return `codequest-cq-howto-${profileId || 'unknown'}`;
}
function howToSeen(profileId) {
  try { return localStorage.getItem(howToKey(profileId)) === '1'; } catch { return false; }
}
function markHowToSeen(profileId) {
  try { localStorage.setItem(howToKey(profileId), '1'); } catch { /* Shown again next time; no gameplay change. */ }
}

// Record only event data. Rendering derives every chip position from the id and simulation time.
export function recordBattleEffects(view, events, time, hero) {
  if (!view.effects) view.effects = [];
  const list = view.effects;
  let write = 0;
  for (let i = 0; i < list.length; i += 1) {
    if (time - list[i].born < FX_LIFE[list[i].type] - 1e-9) list[write++] = list[i];
  }
  list.length = write;
  for (let i = 0; i < events.length; i += 1) {
    const ev = events[i];
    if (ev.type === 'special' && ev.id === 'copy-paste-volley') view.volleyUntil = time + 1.05;
    if (!FX_LIFE[ev.type]) continue;
    const x = ev.type === 'pickup' ? hero.x : ev.x;
    const y = ev.type === 'pickup' ? hero.y : ev.y;
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    if (list.length >= MAX_FX) list.shift();
    list.push({ type: ev.type, id: ev.id == null ? i : ev.id, x, y, born: time,
      kind: ev.kind, radius: ev.radius, fromX: ev.fromX, fromY: ev.fromY,
      targets: ev.type === 'special' ? (ev.targets || []).slice(0, 16).map((target) => ({ ...target })) : undefined,
      converted: ev.type === 'special' && ev.id === 'mass-rename'
        ? events.filter((event) => event.type === 'chicken').slice(0, 16).map((event) => ({ id: event.id, x: event.x, y: event.y })) : undefined,
      enemy: ev.enemy, source: ev.source, facing: ev.facing || hero.facing,
      volley: ev.type === 'hit' && ev.source === 'bolt' && time < (view.volleyUntil || 0),
      dx: x === hero.x && y === hero.y ? 1 : (x - hero.x) / (Math.hypot(x - hero.x, y - hero.y) || 1),
      dy: (y - hero.y) / (Math.hypot(x - hero.x, y - hero.y) || 1) });
    const strength = ev.type === 'hurt' ? 2 : ev.type === 'poof' && ev.enemy === 'mega-slime' ? 3 : 0;
    if (!view.reducedMotion && strength && !(time < (view.nextShakeAt || 0))) {
      view.shake = { born: time, strength, id: ev.id == null ? i : ev.id };
      view.nextShakeAt = time + SHAKE_GAP;
    }
  }
}

// ---------- tiny WebAudio tones ----------
const TONES = {
  swing: [[520, 0.05, 'triangle', 0.025, 360]],
  hit: [[220, 0.06, 'square', 0.03, 140]],
  poof: [[660, 0.05, 'triangle', 0.03, 990], [990, 0.06, 'triangle', 0.02, 1320, 0.04]],
  hurt: [[180, 0.14, 'sawtooth', 0.035, 90]],
  heal: [[523, 0.07, 'triangle', 0.03], [784, 0.1, 'triangle', 0.03, null, 0.07]],
  wave: [[392, 0.09, 'square', 0.025], [523, 0.12, 'square', 0.025, null, 0.1]],
  revive: [[330, 0.08, 'triangle', 0.03], [494, 0.08, 'triangle', 0.03, null, 0.08], [659, 0.14, 'triangle', 0.03, null, 0.16]],
  undo: [[880, 0.16, 'sine', 0.03, 440]],
  chicken: [[900, 0.05, 'square', 0.02, 1200], [1100, 0.05, 'square', 0.02, 800, 0.06]],
  bolt: [[1200, 0.07, 'sine', 0.02, 700]],
  block: [[140, 0.06, 'square', 0.03, 110]],
  ready: [[784, 0.06, 'triangle', 0.03], [1047, 0.1, 'triangle', 0.03, null, 0.07]],
  special: [[392, 0.08, 'sawtooth', 0.03, 784], [659, 0.1, 'square', 0.03, 1319, 0.06], [988, 0.22, 'triangle', 0.035, 1568, 0.14]],
  'start-burst': [[180, 0.16, 'sine', 0.028, 105], [262, 0.22, 'triangle', 0.025, 392, 0.08], [392, 0.18, 'sine', 0.018, 523, 0.19]],
  'window-dash': [[310, 0.13, 'sine', 0.02, 520], [470, 0.14, 'triangle', 0.019, 690, 0.1], [260, 0.1, 'sine', 0.015, 190, 0.24]],
  'alt-tab-dash': [[380, 0.12, 'sine', 0.019, 670], [550, 0.16, 'triangle', 0.019, 820, 0.08], [780, 0.13, 'sine', 0.013, 590, 0.21]],
  'folder-fort': [[185, 0.09, 'triangle', 0.026, 130], [392, 0.16, 'sine', 0.018, 523, 0.09], [659, 0.14, 'sine', 0.012, 784, 0.21]],
  'mass-rename': [[360, 0.13, 'sine', 0.019, 670], [520, 0.12, 'triangle', 0.019, 820, 0.11], [740, 0.09, 'square', 0.011, 550, 0.24]],
  stop: [[165, 0.15, 'triangle', 0.026, 105], [120, 0.11, 'sine', 0.018, 95, 0.15]],
  'quick-save': [[392, 0.14, 'sine', 0.022, 440], [587, 0.22, 'triangle', 0.019, 659, 0.14]],
  'copy-paste-volley': [[470, 0.11, 'triangle', 0.022, 840], [680, 0.12, 'sine', 0.02, 1047, 0.07], [784, 0.1, 'triangle', 0.016, 988, 0.3]],
  'select-all': [[520, 0.07, 'triangle', 0.024, 700], [784, 0.12, 'sine', 0.019, 1047, 0.11]],
  'popup-blocker': [[190, 0.11, 'triangle', 0.027, 115], [560, 0.09, 'sine', 0.015, 760, 0.2]],
  notready: [[196, 0.05, 'square', 0.02, 170]],
  victory: [[523, 0.1, 'square', 0.025], [659, 0.1, 'square', 0.025, null, 0.1], [784, 0.2, 'square', 0.025, null, 0.2]],
  end: [[392, 0.12, 'triangle', 0.03], [330, 0.2, 'triangle', 0.03, null, 0.12]],
};

export function specialSkillCaption(skill) {
  if (!skill) return '';
  return skill === 'Alt+Tab' ? 'Inspired by: Alt+Tab' : `Like ${skill}`;
}

export function mountBattle(container, {
  cq, lesson, nickname, reducedMotion = false, profileId = null, onDone, rng = Math.random, mode = 'battle',
} = {}) {
  const normalized = normalizeCq(cq);
  const set = setProgress(normalized);
  let state = createBattle({ cq: normalized, lesson, rng });
  const firstTraining = mode === 'battle' && container.nodeType === 1 && !howToSeen(profileId);
  let training = mode === 'practice' || firstTraining ? startTraining(state.gear) : null;
  function quietTraining() { state.plan = [[{ type: 'slime', delay: 1e9, edge: 'top', pos: 0 }]]; }
  if (training) quietTraining();
  // Dev-only (vite dev server, never in the production build): ?power=full starts with a full meter so a
  // spell can be reviewed without playing up to it; ?power=always refills it after every cast.
  const devPower = import.meta.env && import.meta.env.DEV && typeof location !== 'undefined' ? new URLSearchParams(location.search).get('power') : null;
  if (!training && (devPower === 'full' || devPower === 'always')) state.hero.power = SPECIAL_MAX;
  const view = {
    widthPx: 0, heightPx: 0, tile: 0, offsetX: 0, offsetY: 0,
    look: normalized.look, equipped: normalized.equipped, worn: normalized.worn,
    glow: Boolean(set && set.active), reducedMotion: Boolean(reducedMotion), particles: [], effects: [], shake: null, nextShakeAt: 0,
  };
  const slots = hudSlots(state.gear);
  const doc = container.ownerDocument || document;
  const win = doc.defaultView || window;

  // ---------- DOM ----------
  const root = doc.createElement('div');
  root.className = 'cq-battle';
  root.tabIndex = -1;
  root.innerHTML = `
    <div class="cq-battle-top">
      <span class="cq-battle-hearts" role="img" aria-label="Hearts"></span>
      <span class="cq-battle-wave">${training ? 'Training' : esc(waveLabel(state.wave, waveTotal(state)))}</span>
      <span class="cq-battle-clock" aria-label="Time left"${training ? ' hidden' : ''}>${formatClock(state.timeLeft)}</span>
      <span class="cq-battle-poofs" aria-label="Poofs">💨 0</span>
      <span class="cq-battle-power" role="progressbar" aria-label="Power" aria-valuemin="0" aria-valuemax="${SPECIAL_MAX}" aria-valuenow="0" title="${esc(state.special.name)}">
        <span class="cq-bp-label">POWER</span><span class="cq-bp-bar" aria-hidden="true"><span class="cq-bp-fill"></span></span><kbd>F</kbd><span class="cq-bp-name">${esc(state.special.name)}</span>
      </span>
      <button type="button" class="cq-battle-pause" tabindex="-1" data-battle="pause">⏸ Pause <span class="cq-battle-esc">(Esc)</span></button>
    </div>
    <div class="cq-battle-stage">
      <canvas class="cq-battle-canvas" role="img" aria-label="Battle arena: defend the chest from the monsters"></canvas>
      <p class="cq-battle-banner" role="status" aria-live="polite"></p>
      <div class="cq-training-marker" aria-hidden="true" hidden>★</div>
      <div class="cq-training-panel" aria-live="polite" hidden></div>
      <div class="cq-battle-overlay" hidden></div>
    </div>
    <ul class="cq-battle-slots" aria-label="Abilities">${slots.map((slot) => `
      <li class="cq-battle-slot" data-slot="${esc(slot.id)}">
        <span class="cq-battle-slot-art">${slot.icon ? `<canvas data-slot-icon="${esc(slot.icon)}" aria-hidden="true"></canvas>` : '<b class="cq-battle-stance">QUICK</b>'}</span>
        <kbd>${esc(slot.key)}</kbd><span class="cq-sr">${esc(slot.label)}</span>
      </li>`).join('')}</ul>`;
  container.append(root);

  const canvas = root.querySelector('canvas.cq-battle-canvas');
  const ctx = canvas.getContext ? canvas.getContext('2d') : null;
  const heartsEl = root.querySelector('.cq-battle-hearts');
  const waveEl = root.querySelector('.cq-battle-wave');
  const clockEl = root.querySelector('.cq-battle-clock');
  const poofsEl = root.querySelector('.cq-battle-poofs');
  const powerEl = root.querySelector('.cq-battle-power');
  const powerFill = root.querySelector('.cq-bp-fill');
  const banner = root.querySelector('.cq-battle-banner');
  const overlay = root.querySelector('.cq-battle-overlay');
  const trainingPanel = root.querySelector('.cq-training-panel');
  const marker = root.querySelector('.cq-training-marker');
  const pauseButton = root.querySelector('.cq-battle-pause');
  const heartEls = [];
  for (let i = 0; i < state.hero.maxHearts; i += 1) {
    const heart = doc.createElement('span');
    heart.className = 'cq-bh';
    heartsEl.append(heart);
    heartEls.push(heart);
  }
  const slotEls = slots.map((slot) => {
    const el = root.querySelector(`[data-slot="${slot.id}"]`);
    return { id: slot.id, el, stance: el.querySelector('.cq-battle-stance'), last: { fraction: -1, used: null, active: null, text: null } };
  });

  function paintSlotIcons() {
    const ratio = win.devicePixelRatio || 1;
    root.querySelectorAll('canvas[data-slot-icon]').forEach((icon) => {
      const size = Math.round(34 * ratio);
      icon.width = size; icon.height = size;
      const c = icon.getContext('2d');
      if (!c) return;
      c.imageSmoothingEnabled = false;
      c.clearRect(0, 0, size, size);
      const id = icon.dataset.slotIcon;
      if (id === 'fist' || id === 'apple') drawSlotIcon(c, size, id);
      else drawIcon(c, 0, 0, size, id);
    });
  }

  // ---------- state ----------
  let mounted = true;
  let raf = 0;
  let lastFrame = null;
  let acc = 0;
  let finished = false;
  const done = doneOnce(onDone); // the result is handed over exactly once, the moment the battle ends
  let howToTimer = 0;
  let noKeyTimer = 0;
  let bannerTimer = 0;
  let trainingTimer = 0;
  let trainingBeat = false;
  let overlayMode = null; // 'howto' | 'pause' | 'nokeyboard' | null
  let anyKey = false;
  let pendingPause = false;
  let audio = null;
  const held = new Map(); // key id -> input name
  const latched = blankInput(); // taps shorter than a frame still register for one step
  const input = blankInput();
  const quietInput = blankInput();
  const pauseInput = blankInput();
  pauseInput.pause = true;
  const hud = { hearts: -1, wave: -1, clock: '', poofs: -1, power: -1 };

  // ---------- sizing ----------
  function positionTrainingPanel() {
    if (!training || training.status !== 'active') return;
    const onLeft = state.hero.x >= 10;
    trainingPanel.style.left = onLeft ? '6px' : 'auto';
    trainingPanel.style.right = onLeft ? 'auto' : '6px';
  }
  function fit() {
    if (!mounted) return;
    const stage = canvas.parentNode;
    const fitted = fitView(stage.clientWidth || container.clientWidth || 960, win.devicePixelRatio || 1);
    if (canvas.width !== fitted.widthPx) canvas.width = fitted.widthPx;
    if (canvas.height !== fitted.heightPx) canvas.height = fitted.heightPx;
    canvas.style.width = `${fitted.cssWidth}px`;
    canvas.style.height = `${fitted.cssHeight}px`;
    view.widthPx = fitted.widthPx; view.heightPx = fitted.heightPx;
    view.tile = fitted.tile; view.offsetX = fitted.offsetX; view.offsetY = fitted.offsetY;
    marker.style.left = `${(fitted.offsetX + TRAINING_MARKER.x * fitted.tile) / (win.devicePixelRatio || 1)}px`;
    marker.style.top = `${(fitted.offsetY + TRAINING_MARKER.y * fitted.tile) / (win.devicePixelRatio || 1)}px`;
    positionTrainingPanel();
    if (ctx) ctx.imageSmoothingEnabled = false;
    draw(win.performance ? win.performance.now() : 0);
  }

  // ---------- sound ----------
  function ensureAudio() {
    if (audio) return;
    const Ctor = win.AudioContext || win.webkitAudioContext;
    if (!Ctor) return;
    try { audio = new Ctor(); } catch { audio = null; }
  }
  function playSound(name) {
    if (!audio || !TONES[name]) return;
    try {
      const t0 = audio.currentTime;
      TONES[name].forEach(([freq, dur, type, vol, slide, delay]) => {
        const start = t0 + (delay || 0);
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);
        if (slide) osc.frequency.exponentialRampToValueAtTime(slide, start + dur);
        gain.gain.setValueAtTime(vol, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        osc.connect(gain);
        gain.connect(audio.destination);
        osc.start(start);
        osc.stop(start + dur + 0.02);
      });
    } catch { /* Sound is optional. */ }
  }

  // ---------- overlays ----------
  const controlLines = () => howToKeys(state.gear, state.special)
    .map((line) => `<li><kbd>${esc(line.keys)}</kbd><span>${esc(line.text)}</span></li>`).join('');
  function resetTrainingStep() {
    state = createBattle({ cq: normalized, lesson, rng });
    quietTraining();
    held.clear();
    Object.keys(latched).forEach((key) => { latched[key] = false; });
    view.effects = []; view.particles = [];
    hud.hearts = -1; hud.wave = -1; hud.clock = ''; hud.poofs = -1; hud.power = -1;
    const current = trainingStep(training);
    if (current === 'attack') {
      const slime = spawnEnemy(state, 'slime', state.hero.x, state.hero.y + 0.8);
      slime.stunUntil = 1e9;
    } else if (current === 'gear' || current === 'power') {
      [[9, 7], [11, 7], [10, 8]].forEach(([x, y]) => {
        const slime = spawnEnemy(state, 'slime', x, y);
        slime.stunUntil = 1e9;
      });
      if (current === 'power') state.hero.power = SPECIAL_MAX;
    }
    renderTraining();
  }
  function renderTraining() {
    if (!training || training.status !== 'active') { trainingPanel.hidden = true; marker.hidden = true; return; }
    const current = trainingStep(training);
    marker.hidden = current !== 'move' || trainingBeat;
    const gearLines = howToKeys(state.gear, state.special).slice(2, -1)
      .map((line) => `<li><kbd>${esc(line.keys)}</kbd> ${esc(line.text)}</li>`).join('');
    const words = current === 'move' ? 'Use the arrow keys or W A S D to walk to the glowing star.'
      : current === 'attack' ? 'Face the slime and press Space to swing!'
        : current === 'gear' ? 'Try one of your gear keys.'
          : current === 'power' ? `Every monster you poof fills the POWER bar. When it is full, press F for ${state.special.name}!`
            : 'You’re ready! Defend the chest!';
    const keycaps = current === 'move' ? '<div class="cq-training-keycaps"><kbd data-move="up">↑ W</kbd><kbd data-move="left">← A</kbd><kbd data-move="down">↓ S</kbd><kbd data-move="right">→ D</kbd></div>'
      : current === 'attack' ? '<kbd>Space</kbd>' : current === 'power' ? '<kbd>F</kbd>' : '';
    trainingPanel.innerHTML = `<div class="cq-training-card" role="status"><strong>${trainingBeat ? 'Nice!' : `Step ${training.index + 1} of ${training.steps.length}`}</strong><button type="button" class="cq-training-skip" data-training="skip">Skip training</button>
      ${trainingBeat ? '' : `<p>${esc(words)}</p>${keycaps}${current === 'attack' ? '<p>Face it first: the swing hits in front of you.</p>' : ''}${current === 'gear' ? `<ul>${gearLines}</ul>` : ''}`}
      <div class="cq-training-actions">${current === 'gear' && !trainingBeat ? '<button type="button" data-training="got-it">Got it</button>' : ''}
      ${current === 'ready' && !trainingBeat ? '<button type="button" data-training="start" class="cq-primary">Start the battle ▶</button><button type="button" data-training="again">Practice more</button>' : ''}</div></div>`;
    trainingPanel.hidden = false;
    trainingPanel.scrollTop = 0;
  }
  function trainingAction(action) {
    if (!training || training.status !== 'active') return;
    if (trainingBeat && action !== 'skip') return;
    const next = advanceTraining(training, state, [], action);
    if (next === training) return;
    if (action === 'skip' || next.status === 'practice-done') { clearTimeout(trainingTimer); trainingBeat = false; }
    training = next;
    if (training.status === 'practice-skipped') {
      markHowToSeen(profileId);
      renderTraining();
      if (mode === 'practice') { finished = true; done.call({ outcome: 'practice-skipped' }); }
      else { showOverlay('howto'); howToTimer = setTimeout(dismissHowTo, HOWTO_MS); }
    } else if (training.status === 'practice-done') {
      markHowToSeen(profileId);
      renderTraining();
      if (mode === 'practice') { finished = true; done.call({ outcome: 'practice-done' }); }
      else startFreshBattle(true);
    } else if (action === 'again') resetTrainingStep();
    else trainingCompleted();
  }
  function trainingCompleted() {
    trainingBeat = true;
    renderTraining();
    clearTimeout(trainingTimer);
    trainingTimer = setTimeout(() => { trainingBeat = false; resetTrainingStep(); }, reducedMotion ? 300 : 650);
  }
  function startFreshBattle(applyDevPower = false) {
    clearTimeout(trainingTimer);
    trainingBeat = false;
    state = createBattle({ cq: normalized, lesson, rng });
    if (applyDevPower && (devPower === 'full' || devPower === 'always')) state.hero.power = SPECIAL_MAX;
    training = null;
    finished = false;
    held.clear();
    pendingPause = false;
    Object.keys(latched).forEach((key) => { latched[key] = false; });
    view.effects = []; view.particles = [];
    hud.hearts = -1; hud.wave = -1; hud.clock = ''; hud.poofs = -1; hud.power = -1;
    renderTraining();
    hideOverlay();
    lastFrame = null; acc = 0;
    updateHud(); draw(win.performance ? win.performance.now() : 0);
  }
  function showOverlay(mode) {
    overlayMode = mode;
    root.querySelector('.cq-battle-top').inert = true;
    root.querySelector('.cq-battle-slots').inert = true;
    canvas.inert = true;
    banner.inert = true;
    marker.inert = true;
    trainingPanel.inert = true;
    if (mode === 'howto') {
      overlay.innerHTML = `<div class="cq-battle-card" role="dialog" aria-labelledby="cq-battle-howto-title">
        <h3 id="cq-battle-howto-title">How to play${nickname ? `, ${esc(nickname)}` : ''}</h3>
        <p>Monsters are coming for the chest. Poof them all!</p>
        <ul class="cq-battle-keys">${controlLines()}</ul>
        <p class="cq-battle-tip">${esc(HOWTO_TIP)}</p>
        <div class="cq-actions"><button type="button" class="cq-button cq-battle-go" data-battle="start">Let’s go! ▶</button></div></div>`;
    } else if (mode === 'pause') {
      overlay.innerHTML = `<div class="cq-battle-card cq-battle-pause-card" role="dialog" aria-labelledby="cq-battle-pause-title">
        <h3 id="cq-battle-pause-title">Paused</h3>
        <div class="cq-battle-pause-controls"><ul class="cq-battle-keys">${controlLines()}</ul><p class="cq-battle-tip">${esc(HOWTO_TIP)}</p></div>
        <div class="cq-actions"><button type="button" class="cq-button cq-battle-go" data-battle="resume">Resume ▶</button><button type="button" class="cq-button" data-battle="restart">Start over</button><button type="button" class="cq-button" data-battle="skip">${training ? 'Skip training' : 'Skip to the chest'}</button></div></div>`;
    } else if (mode === 'restart') {
      overlay.innerHTML = `<div class="cq-battle-card" role="dialog" aria-labelledby="cq-battle-restart-title"><h3 id="cq-battle-restart-title">Start over? The monsters come back.</h3>
        <div class="cq-actions"><button type="button" class="cq-button" data-battle="restart-yes">Yes, start over</button><button type="button" class="cq-button cq-battle-go" data-battle="restart-no">No, keep playing</button></div></div>`;
    } else if (mode === 'nokeyboard') {
      overlay.innerHTML = `<div class="cq-battle-card" role="dialog" aria-labelledby="cq-battle-nokey-title">
        <h3 id="cq-battle-nokey-title">This battle needs a keyboard</h3>
        <p>Plug in a keyboard and press any arrow key, or skip straight to your chest.</p>
        <div class="cq-actions"><button type="button" class="cq-button cq-battle-go" data-battle="skip">Skip to the chest</button></div></div>`;
    }
    overlay.hidden = false;
    const go = overlay.querySelector('.cq-battle-go');
    if (go) go.focus({ preventScroll: true });
  }
  function hideOverlay() {
    overlayMode = null;
    overlay.hidden = true;
    overlay.innerHTML = '';
    root.querySelector('.cq-battle-top').inert = false;
    root.querySelector('.cq-battle-slots').inert = false;
    canvas.inert = false;
    banner.inert = false;
    marker.inert = false;
    trainingPanel.inert = false;
    if (mounted) root.focus({ preventScroll: true });
  }
  const holding = () => finished || overlayMode === 'howto' || overlayMode === 'nokeyboard' || trainingBeat || (training && trainingStep(training) === 'ready');

  function dismissHowTo() {
    if (overlayMode !== 'howto') return;
    clearTimeout(howToTimer);
    markHowToSeen(profileId);
    hideOverlay();
    if (training && training.status === 'practice-skipped' && mode === 'battle') startFreshBattle(true);
    lastFrame = null;
  }
  function showBanner(text, ms, secondLine = '', variant = '') {
    banner.innerHTML = `<span class="cq-battle-banner-title">${esc(text)}</span>${secondLine ? `<span class="cq-battle-banner-skill">${esc(secondLine)}</span>` : ''}`;
    banner.classList.toggle('cq-battle-banner-special', variant === 'special');
    banner.classList.add('cq-on');
    clearTimeout(bannerTimer);
    if (ms) bannerTimer = setTimeout(() => { banner.classList.remove('cq-on'); }, ms);
  }

  // ---------- pause ----------
  function handleEvents(events) {
    recordBattleEffects(view, events, state.time, state.hero);
    let sounds = 0;
    const played = {};
    const once = (name) => { if (!played[name] && sounds < 4) { played[name] = true; sounds += 1; playSound(name); } };
    let waveHeal = 0;
    // A special's own tone is the star of its step: its hits, chickens and heal don't stack their tones on top.
    const casting = events.some((event) => event.type === 'special');
    for (let i = 0; i < events.length; i += 1) {
      const ev = events[i];
      switch (ev.type) {
        case 'swing': once('swing'); break;
        case 'hit': if (!casting) once('hit'); break;
        case 'poof': once('poof'); break;
        case 'hurt': once('hurt'); break;
        case 'heal':
          if (ev.source === 'wave') { waveHeal = ev.amount || 0; if (waveHeal > 0) once('heal'); } else if (ev.source !== 'special') once('heal');
          break;
        case 'pickup': once('heal'); break;
        case 'wave': if (!training) { once('wave'); showBanner(waveBanner(ev.wave, waveTotal(state), waveHeal), 1600); } break;
        case 'revive': once('revive'); showBanner(ev.source === 'second-wind' ? 'Second Wind! Keep going!' : 'Save Stone! Back up!', 1400); break;
        case 'undo': once('undo'); break;
        case 'chicken': if (!casting) once('chicken'); break;
        case 'bolt': once('bolt'); break;
        case 'block': once('block'); break;
        case 'special': once(TONES[ev.id] ? ev.id : 'special'); showBanner(ev.name.endsWith('!') ? ev.name : `${ev.name}!`, 1400, specialSkillCaption(ev.skill), 'special'); if (devPower === 'always') state.hero.power = SPECIAL_MAX; break;
        case 'power': once('ready'); break;
        case 'special-wait': once('notready'); break;
        case 'scrap': addParticle(ev.x, ev.y); break;
        case 'pause': showOverlay('pause'); break;
        case 'resume': if (overlayMode === 'pause') hideOverlay(); break;
        case 'end': if (training) resetTrainingStep(); else finish(ev.outcome); break;
        default: break;
      }
    }
  }
  function addParticle(x, y) {
    const list = view.particles;
    let write = 0;
    for (let i = 0; i < list.length; i += 1) if (state.time - list[i].born < PARTICLE_LIFE) list[write++] = list[i];
    list.length = write;
    if (list.length >= MAX_PARTICLES) list.shift();
    list.push({ id: state.nextId + list.length * 97 + Math.floor(state.time * 60), x, y, born: state.time });
  }
  function togglePause() {
    if (!mounted || finished || state.phase === 'ended') return;
    if (state.lastInput.pause) {
      if (state.phase !== 'paused') { pendingPause = true; return; }
      step(state, quietInput, 0);
    }
    handleEvents(step(state, pauseInput, 0).events);
  }

  // ---------- finishing ----------
  // The end banner is purely visual: the result goes to onDone (and gets recorded) right away, so
  // leaving during the banner can't drop the record. The host decides when to show results.
  function finish(outcome) {
    if (finished) return;
    finished = true;
    held.clear();
    playSound(outcome === 'victory' ? 'victory' : 'end');
    showBanner(outcome === 'victory' ? 'Victory!' : outcome === 'time' ? 'Time!' : 'The monsters ran off!', 0);
    const result = resultOf(state);
    result.hearts = state.hero.hearts;
    result.maxHearts = state.hero.maxHearts;
    done.call(result);
  }
  function skip() {
    if (done.called) return;
    if (overlayMode === 'nokeyboard') {
      finished = true;
      if (training) markHowToSeen(profileId);
      done.call(mode === 'practice' ? { outcome: 'practice-skipped' }
        : { outcome: 'skipped', ms: Math.round(state.time * 1000), poofs: state.poofs });
      return;
    }
    if (training && training.status === 'active') { trainingAction('skip'); return; }
    finished = true;
    done.call({ outcome: 'skipped', ms: Math.round(state.time * 1000), poofs: state.poofs });
  }

  // ---------- loop ----------
  function stepOnce() {
    for (let i = 0; i < INPUTS.length; i += 1) input[INPUTS[i]] = latched[INPUTS[i]];
    held.forEach(markHeld);
    if (pendingPause && !state.lastInput.pause) { input.pause = true; pendingPause = false; }
    const events = step(state, input, DT).events;
    handleEvents(events);
    if (training && training.status === 'active' && !trainingBeat) {
      const next = advanceTraining(training, state, events);
      if (next !== training) { training = next; trainingCompleted(); }
      if (trainingStep(training) === 'move') trainingPanel.querySelectorAll('[data-move]').forEach((cap) => cap.classList.toggle('cq-lit', Boolean(input[cap.dataset.move])));
    }
    for (let i = 0; i < INPUTS.length; i += 1) latched[INPUTS[i]] = false;
  }
  function markHeld(name) { input[name] = true; }
  const INPUTS = Object.keys(input);

  function draw(now) {
    if (!ctx || !(view.tile > 0)) return;
    renderBattle(ctx, state, view, now);
  }
  function updateHud() {
    const hero = state.hero;
    if (hud.hearts !== hero.hearts) {
      hud.hearts = hero.hearts;
      for (let i = 0; i < heartEls.length; i += 1) heartEls[i].classList.toggle('cq-bh-empty', i >= hero.hearts);
      heartsEl.setAttribute('aria-label', `Hearts: ${hero.hearts} of ${hero.maxHearts}`);
    }
    if (hud.wave !== state.wave) { hud.wave = state.wave; waveEl.textContent = training ? 'Training' : waveLabel(state.wave, waveTotal(state)); }
    clockEl.hidden = Boolean(training);
    if (!training) {
      const clock = formatClock(state.timeLeft);
      if (hud.clock !== clock) { hud.clock = clock; clockEl.textContent = `⏱ ${clock}`; }
    }
    if (hud.poofs !== state.poofs) { hud.poofs = state.poofs; poofsEl.textContent = `💨 ${state.poofs}`; }
    if (hud.power !== hero.power) {
      hud.power = hero.power;
      powerFill.style.width = `${Math.round((hero.power / SPECIAL_MAX) * 100)}%`;
      powerEl.setAttribute('aria-valuenow', String(Math.round(hero.power)));
      powerEl.classList.toggle('cq-ready', hero.power >= SPECIAL_MAX);
    }
    for (let i = 0; i < slotEls.length; i += 1) {
      const slot = slotEls[i];
      const s = slotStatus(state, slot.id);
      const fraction = Math.round(s.fraction * 24) / 24;
      if (slot.last.fraction !== fraction) { slot.last.fraction = fraction; slot.el.style.setProperty('--cd', String(fraction)); }
      if (slot.last.used !== s.used) { slot.last.used = s.used; slot.el.classList.toggle('cq-used', s.used); }
      if (slot.last.active !== s.active) { slot.last.active = s.active; slot.el.classList.toggle('cq-active', s.active); }
      if (slot.stance && slot.last.text !== s.text) { slot.last.text = s.text; slot.stance.textContent = s.text; }
    }
  }
  function frame(ts) {
    if (!mounted) return;
    raf = win.requestAnimationFrame(frame);
    if (lastFrame === null) lastFrame = ts;
    let delta = (ts - lastFrame) / 1000;
    lastFrame = ts;
    if (!(delta > 0)) delta = 0;
    if (delta > 0.25) delta = 0.25;
    if (!holding()) {
      acc += delta;
      let n = 0;
      while (acc >= DT && n < MAX_STEPS && !finished) { stepOnce(); acc -= DT; n += 1; }
      if (n >= MAX_STEPS || finished) acc = 0;
    }
    positionTrainingPanel();
    draw(ts);
    updateHud();
  }

  // ---------- input ----------
  function onKeyDown(event) {
    if (!mounted || doc.hidden) return;
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    if (overlayMode && event.key === 'Tab') {
      const buttons = Array.from(overlay.querySelectorAll('button'));
      if (buttons.length) {
        const index = buttons.indexOf(doc.activeElement);
        const next = event.shiftKey ? (index <= 0 ? buttons[buttons.length - 1] : buttons[index - 1])
          : (index < 0 || index === buttons.length - 1 ? buttons[0] : buttons[index + 1]);
        event.preventDefault(); next.focus({ preventScroll: true });
      }
      return;
    }
    if (trainingPanel.contains(event.target) && event.target.closest && event.target.closest('button')
      && isActivationKey(event)) return;
    if (overlayMode && overlay.contains(event.target) && event.target.closest && event.target.closest('button')
      && isActivationKey(event) && overlayMode !== 'howto') return;
    // Space/Enter on a focused control outside the battle (e.g. "← Quests") belongs to that control;
    // every other battle key still plays.
    const outside = isInteractiveOutside(event.target, root);
    if (outside && isActivationKey(event)) return;
    if (overlayMode === 'howto' && (event.key === 'Enter' || event.code === 'Space' || event.key === ' ')) {
      event.preventDefault();
      ensureAudio();
      dismissHowTo();
      return;
    }
    const action = keyAction(event, outside);
    if (!action) return;
    anyKey = true;
    ensureAudio();
    if (overlayMode === 'nokeyboard') { hideOverlay(); lastFrame = null; }
    if (overlayMode === 'pause' || overlayMode === 'restart') {
      // Enter/Space activate the focused overlay button natively; Esc resumes.
      if (action === 'pause') { event.preventDefault(); if (!event.repeat) { if (overlayMode === 'restart') showOverlay('pause'); togglePause(); } }
      return;
    }
    if (finished || overlayMode) return;
    event.preventDefault();
    if (action === 'pause') { if (!event.repeat) togglePause(); return; }
    if (training && training.status === 'active' && !trainingBeat && trainingStep(training) === 'gear' && !event.repeat
      && ((action === 'stance' && state.gear.sword) || (action === 'block' && state.gear.shield)
        || (action === 'ability' && (state.gear.staff || state.gear.rune)) || (action === 'undo' && state.gear.amulet)
        || (action === 'apple' && state.gear.backpack) || (action === 'stone' && state.gear.stone))) {
      trainingAction('gear-key');
    }
    held.set(keyId(event), action);
    if (!event.repeat) latched[action] = true;
  }
  function onKeyUp(event) {
    if (!mounted) return;
    held.delete(keyId(event));
    if (event.key === 'Shift') { held.delete('ShiftLeft'); held.delete('ShiftRight'); }
    if (!event.ctrlKey && !event.altKey && !event.metaKey && keyAction(event, isInteractiveOutside(event.target, root)) && !overlayMode) event.preventDefault();
  }
  function onBlur() { held.clear(); }
  function onVisibility() {
    if (!mounted) return;
    if (doc.hidden) {
      held.clear();
      if (!finished && state.phase === 'playing' && !overlayMode) togglePause();
    } else {
      lastFrame = null;
    }
  }
  function onResize() { fit(); }
  function onOverlayClick(event) {
    const button = event.target.closest ? event.target.closest('button[data-battle]') : null;
    if (!button || !mounted) return;
    ensureAudio();
    const what = button.dataset.battle;
    if (what === 'start') dismissHowTo();
    else if (what === 'resume') { if (state.phase === 'paused') togglePause(); else hideOverlay(); }
    else if (what === 'skip') skip();
    else if (what === 'restart') showOverlay('restart');
    else if (what === 'restart-no') showOverlay('pause');
    else if (what === 'restart-yes') { if (training && training.status === 'active') { training = startTraining(state.gear); resetTrainingStep(); hideOverlay(); } else startFreshBattle(); }
  }
  function onPauseClick(event) { if (event.target.closest && event.target.closest('[data-battle="pause"]')) { ensureAudio(); togglePause(); } }
  function onTrainingClick(event) {
    const button = event.target.closest ? event.target.closest('button[data-training]') : null;
    if (button) { ensureAudio(); trainingAction(button.dataset.training); }
  }

  win.addEventListener('keydown', onKeyDown);
  win.addEventListener('keyup', onKeyUp);
  win.addEventListener('blur', onBlur);
  win.addEventListener('resize', onResize);
  doc.addEventListener('visibilitychange', onVisibility);
  overlay.addEventListener('click', onOverlayClick);
  pauseButton.addEventListener('click', onPauseClick);
  trainingPanel.addEventListener('click', onTrainingClick);

  paintSlotIcons();
  fit();
  updateHud();
  if (training) { resetTrainingStep(); root.focus({ preventScroll: true }); }
  else if (mode === 'battle' && !howToSeen(profileId)) {
    showOverlay('howto');
    howToTimer = setTimeout(dismissHowTo, HOWTO_MS);
  } else {
    root.focus({ preventScroll: true });
  }
  let coarse = false;
  try { coarse = Boolean(win.matchMedia && win.matchMedia('(pointer: coarse)').matches); } catch { coarse = false; }
  if (coarse) {
    noKeyTimer = setTimeout(() => {
      if (!mounted || anyKey || finished) return;
      clearTimeout(howToTimer);
      showOverlay('nokeyboard');
    }, NO_KEYBOARD_MS);
  }
  raf = win.requestAnimationFrame(frame);

  return {
    destroy() {
      if (!mounted) return;
      mounted = false;
      win.cancelAnimationFrame(raf);
      clearTimeout(howToTimer);
      clearTimeout(noKeyTimer);
      clearTimeout(bannerTimer);
      clearTimeout(trainingTimer);
      win.removeEventListener('keydown', onKeyDown);
      win.removeEventListener('keyup', onKeyUp);
      win.removeEventListener('blur', onBlur);
      win.removeEventListener('resize', onResize);
      doc.removeEventListener('visibilitychange', onVisibility);
      overlay.removeEventListener('click', onOverlayClick);
      pauseButton.removeEventListener('click', onPauseClick);
      trainingPanel.removeEventListener('click', onTrainingClick);
      held.clear();
      if (audio) { try { audio.close(); } catch { /* Already closed. */ } audio = null; }
      if (root.parentNode) root.parentNode.removeChild(root);
    },
  };
}
