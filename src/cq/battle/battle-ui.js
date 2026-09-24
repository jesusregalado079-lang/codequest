// Computer Quest horde battle screen: canvas + DOM HUD, fixed-step rAF loop, keyboard, pause,
// how-to card, no-keyboard fallback and WebAudio tones. Mounted by lesson-ui.js on the key screen.
import { normalizeCq, setProgress } from '../character.js';
import { drawIcon } from '../sprite.js';
import { createBattle, resultOf, step, waveTotal } from './engine.js';
import { drawSlotIcon, FX_LIFE, MAX_FX, PARTICLE_LIFE, renderBattle } from './render.js';
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
    if (!FX_LIFE[ev.type]) continue;
    const x = ev.type === 'pickup' ? hero.x : ev.x;
    const y = ev.type === 'pickup' ? hero.y : ev.y;
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    if (list.length >= MAX_FX) list.shift();
    list.push({ type: ev.type, id: ev.id == null ? i : ev.id, x, y, born: time,
      enemy: ev.enemy, source: ev.source, facing: ev.facing || hero.facing,
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
  victory: [[523, 0.1, 'square', 0.025], [659, 0.1, 'square', 0.025, null, 0.1], [784, 0.2, 'square', 0.025, null, 0.2]],
  end: [[392, 0.12, 'triangle', 0.03], [330, 0.2, 'triangle', 0.03, null, 0.12]],
};

export function mountBattle(container, {
  cq, lesson, nickname, reducedMotion = false, profileId = null, onDone, rng = Math.random,
} = {}) {
  const normalized = normalizeCq(cq);
  const set = setProgress(normalized);
  const state = createBattle({ cq: normalized, lesson, rng });
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
      <span class="cq-battle-wave">${esc(waveLabel(state.wave, waveTotal(state)))}</span>
      <span class="cq-battle-clock" aria-label="Time left">${formatClock(state.timeLeft)}</span>
      <span class="cq-battle-poofs" aria-label="Poofs">💨 0</span>
      <span class="cq-battle-esc">Esc: pause</span>
    </div>
    <div class="cq-battle-stage">
      <canvas class="cq-battle-canvas" role="img" aria-label="Battle arena: defend the chest from the monsters"></canvas>
      <p class="cq-battle-banner" role="status" aria-live="polite"></p>
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
  const banner = root.querySelector('.cq-battle-banner');
  const overlay = root.querySelector('.cq-battle-overlay');
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
  const hud = { hearts: -1, wave: -1, clock: '', poofs: -1 };

  // ---------- sizing ----------
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
  function showOverlay(mode) {
    overlayMode = mode;
    if (mode === 'howto') {
      const lines = howToKeys(state.gear).map((line) => `<li><kbd>${esc(line.keys)}</kbd><span>${esc(line.text)}</span></li>`).join('');
      overlay.innerHTML = `<div class="cq-battle-card" role="dialog" aria-labelledby="cq-battle-howto-title">
        <h3 id="cq-battle-howto-title">How to play${nickname ? `, ${esc(nickname)}` : ''}</h3>
        <p>Monsters are coming for the chest. Poof them all!</p>
        <ul class="cq-battle-keys">${lines}</ul>
        <p class="cq-battle-tip">${esc(HOWTO_TIP)}</p>
        <div class="cq-actions"><button type="button" class="cq-button cq-battle-go" data-battle="start">Let’s go! ▶</button></div></div>`;
    } else if (mode === 'pause') {
      overlay.innerHTML = `<div class="cq-battle-card" role="dialog" aria-labelledby="cq-battle-pause-title">
        <h3 id="cq-battle-pause-title">Paused</h3>
        <div class="cq-actions"><button type="button" class="cq-button" data-battle="skip">Skip to the chest</button><button type="button" class="cq-button cq-battle-go" data-battle="resume">Resume ▶</button></div></div>`;
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
    if (mounted) root.focus({ preventScroll: true });
  }
  const holding = () => finished || overlayMode === 'howto' || overlayMode === 'nokeyboard';

  function dismissHowTo() {
    if (overlayMode !== 'howto') return;
    clearTimeout(howToTimer);
    markHowToSeen(profileId);
    hideOverlay();
    lastFrame = null;
  }
  function showBanner(text, ms) {
    banner.textContent = text;
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
    for (let i = 0; i < events.length; i += 1) {
      const ev = events[i];
      switch (ev.type) {
        case 'swing': once('swing'); break;
        case 'hit': once('hit'); break;
        case 'poof': once('poof'); break;
        case 'hurt': once('hurt'); break;
        case 'heal':
          if (ev.source === 'wave') { waveHeal = ev.amount || 0; if (waveHeal > 0) once('heal'); } else once('heal');
          break;
        case 'pickup': once('heal'); break;
        case 'wave': once('wave'); showBanner(waveBanner(ev.wave, waveTotal(state), waveHeal), 1600); break;
        case 'revive': once('revive'); showBanner(ev.source === 'second-wind' ? 'Second Wind! Keep going!' : 'Save Stone! Back up!', 1400); break;
        case 'undo': once('undo'); break;
        case 'chicken': once('chicken'); break;
        case 'bolt': once('bolt'); break;
        case 'block': once('block'); break;
        case 'scrap': addParticle(ev.x, ev.y); break;
        case 'pause': showOverlay('pause'); break;
        case 'resume': if (overlayMode === 'pause') hideOverlay(); break;
        case 'end': finish(ev.outcome); break;
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
    finished = true;
    done.call({ outcome: 'skipped', ms: Math.round(state.time * 1000), poofs: state.poofs });
  }

  // ---------- loop ----------
  function stepOnce() {
    for (let i = 0; i < 12; i += 1) input[INPUTS[i]] = latched[INPUTS[i]];
    held.forEach(markHeld);
    if (pendingPause && !state.lastInput.pause) { input.pause = true; pendingPause = false; }
    handleEvents(step(state, input, DT).events);
    for (let i = 0; i < 12; i += 1) latched[INPUTS[i]] = false;
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
    if (hud.wave !== state.wave) { hud.wave = state.wave; waveEl.textContent = waveLabel(state.wave, waveTotal(state)); }
    const clock = formatClock(state.timeLeft);
    if (hud.clock !== clock) { hud.clock = clock; clockEl.textContent = `⏱ ${clock}`; }
    if (hud.poofs !== state.poofs) { hud.poofs = state.poofs; poofsEl.textContent = `💨 ${state.poofs}`; }
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
    draw(ts);
    updateHud();
  }

  // ---------- input ----------
  function onKeyDown(event) {
    if (!mounted || doc.hidden) return;
    if (event.ctrlKey || event.altKey || event.metaKey) return;
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
    if (overlayMode === 'pause') {
      // Enter/Space activate the focused overlay button natively; Esc resumes.
      if (action === 'pause') { event.preventDefault(); if (!event.repeat) togglePause(); }
      return;
    }
    if (finished || overlayMode) return;
    event.preventDefault();
    if (action === 'pause') { if (!event.repeat) togglePause(); return; }
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
  }

  win.addEventListener('keydown', onKeyDown);
  win.addEventListener('keyup', onKeyUp);
  win.addEventListener('blur', onBlur);
  win.addEventListener('resize', onResize);
  doc.addEventListener('visibilitychange', onVisibility);
  overlay.addEventListener('click', onOverlayClick);

  paintSlotIcons();
  fit();
  updateHud();
  if (!howToSeen(profileId)) {
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
      win.removeEventListener('keydown', onKeyDown);
      win.removeEventListener('keyup', onKeyUp);
      win.removeEventListener('blur', onBlur);
      win.removeEventListener('resize', onResize);
      doc.removeEventListener('visibilitychange', onVisibility);
      overlay.removeEventListener('click', onOverlayClick);
      held.clear();
      if (audio) { try { audio.close(); } catch { /* Already closed. */ } audio = null; }
      if (root.parentNode) root.parentNode.removeChild(root);
    },
  };
}
