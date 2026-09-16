// Computer Quest Typing Dojo run screen: canvas run, text strip, on-screen keyboard, results.
// Mounted by ui.js on #typing/<mode>. Contract: docs/computer-quest/typing.md §6.
import { setProgress } from '../character.js';
import { LESSONS } from '../lessons/pack1.js';
import { todayYmd } from '../lesson-view.js';
import { isInteractiveOutside } from '../battle/view.js';
import { itemsFor } from './content.js';
import { createSession, metrics, pressKey } from './engine.js';
import { recordTypingSession } from './record.js';
import { animating, renderRun } from './render.js';
import {
  accuracyLabel, esc, finishedCount, fitRun, keyboardHtml, keyboardPrefKey, keyHighlight, MODE_TITLES, progressFraction,
  resultsMessages, soundPrefKey, stripHtml, stripModel, typingKey,
} from './view.js';

const WRONG_FLASH_MS = 320;
const TONES = {
  tick: [1400, 0.025, 'triangle', 0.018],
  thud: [120, 0.09, 'sine', 0.05],
};

function readPref(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function writePref(key, value) {
  try { localStorage.setItem(key, value); } catch { /* Remembered only for this visit. */ }
}

// mountTyping({ app, mode, profileId, getCq, save, sound, onExit }) -> { destroy, inProgress, refresh }
// save(change) persists a cq change (throws on failure); onExit('hub' | 'picker') leaves the screen.
export function mountTyping({ app, mode, profileId = null, getCq, save, sound, onExit, rng = Math.random } = {}) {
  const doc = app.ownerDocument || document;
  const win = doc.defaultView || window;
  const title = MODE_TITLES[mode] || 'Typing';
  let reducedMotion = false;
  try { reducedMotion = Boolean(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch { reducedMotion = false; }

  const root = doc.createElement('div');
  root.className = 'cq-lesson cq-typing';
  root.innerHTML = `
    <header class="cq-top cq-lesson-top">
      <button type="button" class="cq-map" data-ty="hub">← Hub</button>
      <div class="cq-identity"><span class="cq-eyebrow">TYPING DOJO</span><h1>${esc(title)}</h1></div>
    </header>
    <div class="cq-ty-screen"></div>`;
  app.innerHTML = '';
  app.append(root);
  const screenEl = root.querySelector('.cq-ty-screen');

  let mounted = true;
  let phase = 'run'; // 'run' | 'ending' | 'results'
  let items = [];
  let session = null;
  let scene = null;
  let raf = 0;
  let flashTimer = 0;
  let resultsTimer = 0;
  let recorded = false;
  let outcome = null;
  let audio = null;
  let soundOn = readPref(soundPrefKey(profileId)) !== '0';
  let keyboardHidden = false;
  let els = {};
  let lastKey = { key: null, shift: null };
  let showing = { accuracy: '', streak: -1, progress: -1, strip: '' };

  // ---------- sound ----------
  function tone(name) {
    if (!soundOn || !TONES[name]) return;
    if (!audio) {
      const Ctor = win.AudioContext || win.webkitAudioContext;
      if (!Ctor) return;
      try { audio = new Ctor(); } catch { audio = null; return; }
    }
    try {
      const [freq, dur, type, vol] = TONES[name];
      const t0 = audio.currentTime;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(vol, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    } catch { /* Sound is optional. */ }
  }
  function chime(name) {
    if (!soundOn || typeof sound !== 'function') return;
    try { sound(name); } catch { /* Sound is optional. */ }
  }

  // ---------- run ----------
  function cqNow() { return getCq(); }
  function startRun() {
    clearTimeout(resultsTimer); resultsTimer = 0;
    clearTimeout(flashTimer); flashTimer = 0;
    win.cancelAnimationFrame(raf); raf = 0;
    const cq = cqNow();
    items = itemsFor(mode, cq, LESSONS, rng);
    session = createSession({ mode, items });
    phase = 'run';
    recorded = false;
    outcome = null;
    const set = setProgress(cq);
    scene = {
      widthPx: 0, heightPx: 0, items, index: 0, look: cq.look, equipped: cq.equipped, worn: cq.worn,
      glow: Boolean(set && set.active), reducedMotion, hop: null, stumble: null, smashes: {},
    };
    const standard = cq.track === 'standard';
    keyboardHidden = standard && readPref(keyboardPrefKey(profileId)) === '1';
    screenEl.innerHTML = `
      <div class="cq-ty-bar">
        <div class="cq-ty-stat cq-ty-acc"><span class="cq-eyebrow">ACCURACY</span><strong class="cq-ty-acc-value">—</strong></div>
        <div class="cq-ty-progress"><span class="cq-eyebrow">PROGRESS</span><div class="cq-ty-track" role="progressbar" aria-label="Characters typed" aria-valuemin="0" aria-valuemax="${session.text.length}" aria-valuenow="0"><div class="cq-ty-fill"></div></div></div>
        <div class="cq-ty-stat cq-ty-streak"><span class="cq-eyebrow">STREAK</span><strong><span aria-hidden="true">🔥</span> <span class="cq-ty-streak-value">0</span></strong></div>
      </div>
      <div class="cq-ty-play" tabindex="-1" aria-label="${esc(`${title} typing run`)}">
        <div class="cq-ty-stage"><canvas class="cq-ty-canvas" role="img" aria-label="Your hero runs along the path and smashes a stone block for every finished word"></canvas></div>
        <p class="cq-ty-start" aria-live="polite">Press any letter to start</p>
        <p class="cq-ty-strip" aria-hidden="true"></p>
        <p class="cq-sr cq-ty-sr" aria-live="polite"></p>
        <div class="cq-kb" aria-hidden="true"${keyboardHidden ? ' hidden' : ''}>${keyboardHtml()}</div>
      </div>
      <div class="cq-actions cq-ty-tools">
        ${standard ? `<button type="button" class="cq-button" data-ty="kbd" aria-pressed="${keyboardHidden}">${keyboardHidden ? 'Show keyboard' : 'Hide keyboard'}</button>` : ''}
        <button type="button" class="cq-button" data-ty="sound" aria-pressed="${!soundOn}"><span aria-hidden="true">${soundOn ? '🔊' : '🔇'}</span> Sound</button>
      </div>`;
    const kb = screenEl.querySelector('.cq-kb');
    const keys = {};
    kb.querySelectorAll('[data-k]').forEach((node) => { keys[node.dataset.k] = node; });
    els = {
      play: screenEl.querySelector('.cq-ty-play'),
      canvas: screenEl.querySelector('canvas'),
      acc: screenEl.querySelector('.cq-ty-acc-value'),
      streak: screenEl.querySelector('.cq-ty-streak-value'),
      track: screenEl.querySelector('.cq-ty-track'),
      fill: screenEl.querySelector('.cq-ty-fill'),
      start: screenEl.querySelector('.cq-ty-start'),
      strip: screenEl.querySelector('.cq-ty-strip'),
      sr: screenEl.querySelector('.cq-ty-sr'),
      kb, keys,
    };
    els.ctx = els.canvas.getContext ? els.canvas.getContext('2d') : null;
    lastKey = { key: null, shift: null };
    showing = { accuracy: '', streak: -1, progress: -1, strip: '' };
    fit();
    updateHud(false);
    els.play.focus({ preventScroll: true });
  }

  function fit() {
    if (!mounted || !els.canvas) return;
    const stage = els.canvas.parentNode;
    const fitted = fitRun(stage.clientWidth || 960, win.devicePixelRatio || 1);
    if (els.canvas.width !== fitted.widthPx) els.canvas.width = fitted.widthPx;
    if (els.canvas.height !== fitted.heightPx) els.canvas.height = fitted.heightPx;
    els.canvas.style.width = `${fitted.cssWidth}px`;
    els.canvas.style.height = `${fitted.cssHeight}px`;
    scene.widthPx = fitted.widthPx;
    scene.heightPx = fitted.heightPx;
    draw();
  }
  function now() { return win.performance ? win.performance.now() : Date.now(); }
  function draw() {
    if (!els.ctx || !scene) return;
    renderRun(els.ctx, scene, now());
  }
  function frame() {
    raf = 0;
    if (!mounted) return;
    draw();
    if (animating(scene, now())) raf = win.requestAnimationFrame(frame);
  }
  function kick() {
    if (!raf && mounted) raf = win.requestAnimationFrame(frame);
  }

  function updateHud(wrong) {
    const s = session;
    const acc = accuracyLabel(s);
    if (acc !== showing.accuracy) { showing.accuracy = acc; els.acc.textContent = acc; }
    if (s.streak !== showing.streak) { showing.streak = s.streak; els.streak.textContent = String(s.streak); }
    if (s.index !== showing.progress) {
      showing.progress = s.index;
      els.fill.style.width = `${Math.round(progressFraction(s.index, s.text.length) * 1000) / 10}%`;
      els.track.setAttribute('aria-valuenow', String(s.index));
    }
    const html = stripHtml(stripModel(items, s.index), wrong);
    if (html !== showing.strip) { showing.strip = html; els.strip.innerHTML = html; }
    const next = s.index < s.text.length ? s.text[s.index] : '';
    els.sr.textContent = next ? `Next: ${next === ' ' ? 'space' : next}` : '';
    const hl = keyHighlight(next);
    const key = hl ? hl.key : null;
    const shift = hl && hl.shift ? `Shift-${hl.shiftKey}` : null;
    if (key !== lastKey.key) {
      if (lastKey.key !== null && els.keys[lastKey.key]) els.keys[lastKey.key].classList.remove('cq-kb-next');
      if (key !== null && els.keys[key]) els.keys[key].classList.add('cq-kb-next');
    }
    if (shift !== lastKey.shift) {
      if (lastKey.shift && els.keys[lastKey.shift]) els.keys[lastKey.shift].classList.remove('cq-kb-next');
      if (shift && els.keys[shift]) els.keys[shift].classList.add('cq-kb-next');
    }
    lastKey = { key, shift };
  }

  // ---------- finishing ----------
  // Records exactly once, the moment the text is done; the results card follows a short beat so the
  // last block's puff can play. Leaving during that beat keeps the record.
  function finish() {
    if (recorded) return;
    recorded = true;
    phase = 'ending';
    const m = metrics(session);
    outcome = { m, newBest: false, gems: 0, saved: true };
    try {
      save((cq) => {
        const result = recordTypingSession(cq, { ...m, mode }, new Date().toISOString(), todayYmd());
        outcome.newBest = result.newBest;
        outcome.gems = result.gems;
        return result.cq;
      });
    } catch {
      outcome.saved = false;
      outcome.newBest = false;
      outcome.gems = 0;
    }
    if (outcome.gems > 0 || outcome.newBest) chime('collect');
    resultsTimer = setTimeout(showResults, reducedMotion ? 250 : 650);
  }
  function showResults() {
    resultsTimer = 0;
    if (!mounted || !outcome) return;
    phase = 'results';
    win.cancelAnimationFrame(raf); raf = 0;
    const { m } = outcome;
    const msg = resultsMessages({ accuracy: m.accuracy, newBest: outcome.newBest, gems: outcome.gems, missedKeys: m.missedKeys });
    const seconds = Math.round(m.ms / 1000);
    screenEl.innerHTML = `
      <section class="cq-lesson-card cq-ty-results" aria-labelledby="cq-ty-results-title">
        <div role="status" aria-live="polite">
          <h2 id="cq-ty-results-title" tabindex="-1">${msg.banner ? esc(msg.banner) : 'Run complete!'}</h2>
          ${msg.gemsText ? `<p class="cq-ty-gems">${esc(msg.gemsText)}</p>` : ''}
          <ul class="cq-battle-stats cq-ty-stats">
            <li><span>Speed</span><strong>${esc(m.wpm)} WPM</strong></li>
            <li><span>Accuracy</span><strong>${esc(m.accuracy)}%</strong></li>
            <li><span>Best streak</span><strong>🔥 ${esc(m.bestStreak)}</strong></li>
            <li><span>Time</span><strong>${esc(`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`)}</strong></li>
          </ul>
          ${msg.tip ? `<p class="cq-feedback cq-miss">${esc(msg.tip)}</p>` : ''}
          ${msg.practice ? `<p class="cq-ty-practice">${esc(msg.practice)}</p>` : ''}
          ${outcome.saved ? '' : '<p class="cq-feedback cq-miss">Could not save this run. Please try again.</p>'}
        </div>
        <div class="cq-actions">
          <button type="button" class="cq-button cq-primary" data-ty="again">↻ Again</button>
          <button type="button" class="cq-button" data-ty="picker">Pick a mode</button>
          <button type="button" class="cq-button" data-ty="hub">Back to hub</button>
        </div>
      </section>`;
    els = {};
    const again = screenEl.querySelector('[data-ty="again"]');
    if (again) again.focus({ preventScroll: true });
  }

  // ---------- input ----------
  function onKeyDown(event) {
    if (!mounted || phase !== 'run' || !session) return;
    const key = typingKey(event, isInteractiveOutside(event.target, els.play));
    if (key === null) return;
    event.preventDefault();
    if (event.repeat) return; // a held key never counts twice
    const before = session;
    const { state, result } = pressKey(before, key, Date.now());
    if (result === 'ignored') return;
    session = state;
    const t = now();
    scene.index = state.index;
    if (before.startedAt === null && els.start) { els.start.hidden = true; }
    if (result === 'correct') {
      tone('tick');
      scene.hop = { at: t, from: before.text.length ? before.index / before.text.length : 0 };
      const done = finishedCount(items, state.index);
      if (done > finishedCount(items, before.index)) scene.smashes[done - 1] = t;
      clearTimeout(flashTimer); flashTimer = 0;
      updateHud(false);
    } else {
      tone('thud');
      scene.stumble = { at: t };
      updateHud(true);
      clearTimeout(flashTimer);
      flashTimer = setTimeout(() => { flashTimer = 0; if (mounted && phase === 'run') { showing.strip = ''; updateHud(false); } }, WRONG_FLASH_MS);
    }
    kick();
    if (state.endedAt !== null) finish();
  }
  function onResize() { if (phase !== 'results') fit(); }
  function onClick(event) {
    const button = event.target.closest ? event.target.closest('button[data-ty]') : null;
    if (!button || !mounted) return;
    const what = button.dataset.ty;
    if (what === 'hub' || what === 'picker') { onExit(what); return; }
    if (what === 'again') { chime('tap'); startRun(); return; }
    if (what === 'sound') {
      soundOn = !soundOn;
      writePref(soundPrefKey(profileId), soundOn ? '1' : '0');
      button.setAttribute('aria-pressed', String(!soundOn));
      button.innerHTML = `<span aria-hidden="true">${soundOn ? '🔊' : '🔇'}</span> Sound`;
    } else if (what === 'kbd' && els.kb) {
      keyboardHidden = !keyboardHidden;
      writePref(keyboardPrefKey(profileId), keyboardHidden ? '1' : '0');
      els.kb.hidden = keyboardHidden;
      button.setAttribute('aria-pressed', String(keyboardHidden));
      button.textContent = keyboardHidden ? 'Show keyboard' : 'Hide keyboard';
    }
    // Back to the run so Space types again.
    if (phase === 'run' && els.play) els.play.focus({ preventScroll: true });
  }

  win.addEventListener('keydown', onKeyDown);
  win.addEventListener('resize', onResize);
  root.addEventListener('click', onClick);
  startRun();

  return {
    mode,
    // Started and not finished: a storage event must not disturb the kid.
    inProgress() { return mounted && phase === 'run' && Boolean(session && session.startedAt !== null); },
    // Another tab changed the hero: repaint the look without touching the session.
    refresh() {
      if (!mounted || !scene || phase === 'results') return;
      const cq = cqNow();
      const set = setProgress(cq);
      scene.look = cq.look; scene.equipped = cq.equipped; scene.worn = cq.worn; scene.glow = Boolean(set && set.active);
      draw();
    },
    destroy() {
      if (!mounted) return;
      mounted = false;
      win.cancelAnimationFrame(raf);
      clearTimeout(flashTimer);
      clearTimeout(resultsTimer);
      win.removeEventListener('keydown', onKeyDown);
      win.removeEventListener('resize', onResize);
      root.removeEventListener('click', onClick);
      if (audio) { try { audio.close(); } catch { /* Already closed. */ } audio = null; }
      if (root.parentNode) root.parentNode.removeChild(root);
    },
  };
}
