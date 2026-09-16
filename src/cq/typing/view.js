// Computer Quest Typing Dojo: pure view helpers (no DOM, no canvas). Tested in test/cq-typing-ui.test.js.
// Contract: docs/computer-quest/typing.md §1, §2, §6.
import { FINGER_FOR_KEY, KEYBOARD_ROWS, sentencesUnlocked } from './content.js';
import { normalizeTyping } from './state.js';

export const MODES = ['homeRow', 'lessonWords', 'sentences'];
export const MODE_TITLES = { homeRow: 'Home Row', lessonWords: 'Lesson Words', sentences: 'Sentences' };
export const MODE_BLURBS = {
  homeRow: 'Letters and words from the home row.',
  lessonWords: 'Words from your quests.',
  sentences: 'Short sentences, one key at a time.',
};
export const SPACE_MARK = '␣';
export const MAX_CSS_WIDTH = 960;
export const RUN_ASPECT = 1 / 4; // height / width
export const MIN_CSS_HEIGHT = 96;
export const ACCURACY_GOAL = 90;

export const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const own = (object, key) => typeof key === 'string' && Object.prototype.hasOwnProperty.call(object, key);
export const isMode = (mode) => MODES.indexOf(mode) !== -1;
export const showChar = (char) => (char === ' ' ? SPACE_MARK : char);
const showText = (text) => String(text).split('').map(showChar).join('');

// '#typing' -> { mode: null } (the picker), '#typing/<mode>' -> { mode }, anything else -> null.
export function parseTypingHash(hash) {
  const match = /^#?typing(?:\/([A-Za-z]+))?$/.exec(String(hash || ''));
  if (!match) return null;
  return { mode: match[1] && isMode(match[1]) ? match[1] : null };
}

// Whether a run can be mounted for this mode right now (Sentences waits for lesson 2).
export function modeLocked(mode, cq) {
  return mode === 'sentences' && !sentencesUnlocked(cq);
}
export const LOCK_LABEL = 'Pass Lesson 2 to unlock';

// ---------- personal bests + recent dots ----------
export function bestLabel(best) {
  if (!best || !Number.isFinite(best.wpm) || !Number.isFinite(best.accuracy)) return '— ';
  return `${Math.round(best.wpm * 10) / 10} WPM @ ${Math.round(best.accuracy)}%`;
}
export function dotColor(accuracy) {
  if (!Number.isFinite(accuracy)) return 'gray';
  if (accuracy >= 95) return 'gold';
  if (accuracy >= 90) return 'green';
  return 'gray';
}
// Always 5 slots, oldest first; missing sessions are 'empty'.
export function recentDots(typing, count = 5) {
  const sessions = normalizeTyping(typing).sessions.slice(-count);
  const dots = sessions.map((s) => ({ color: dotColor(s.accuracy), accuracy: s.accuracy, mode: s.mode }));
  while (dots.length < count) dots.unshift({ color: 'empty', accuracy: null, mode: null });
  return dots;
}
export function modeCards(cq) {
  const typing = normalizeTyping(cq && cq.typing);
  return MODES.map((mode) => {
    const locked = modeLocked(mode, cq);
    return {
      mode, title: MODE_TITLES[mode], blurb: MODE_BLURBS[mode], best: bestLabel(typing.best[mode]),
      locked, lockLabel: locked ? LOCK_LABEL : '',
    };
  });
}

// The Typing tab body inside the hub (mode picker). No comparison with other profiles.
export function pickerHtml(cq) {
  const cards = modeCards(cq).map((card) => `<article class="cq-ty-mode${card.locked ? ' cq-ty-locked' : ''}">
      <h3>${card.locked ? '<span aria-hidden="true">🔒 </span>' : ''}${esc(card.title)}</h3>
      <p class="cq-muted">${esc(card.blurb)}</p>
      <p class="cq-ty-best"><span>Your best</span> <strong>${esc(card.best)}</strong></p>
      ${card.locked
    ? `<button type="button" class="cq-button" data-action="typing-mode" data-mode="${esc(card.mode)}" aria-disabled="true" aria-label="${esc(`${card.title}: locked. ${card.lockLabel}`)}">🔒 ${esc(card.lockLabel)}</button>`
    : `<button type="button" class="cq-button cq-primary" data-action="typing-mode" data-mode="${esc(card.mode)}" aria-label="${esc(`Start ${card.title}`)}">▶ Start</button>`}
    </article>`).join('');
  const dots = recentDots(cq && cq.typing);
  const played = dots.filter((d) => d.color !== 'empty');
  const dotsLabel = played.length ? `Last ${played.length} sessions accuracy: ${played.map((d) => `${d.accuracy}%`).join(', ')}` : 'No sessions yet';
  return `<div class="cq-section-head"><div><span class="cq-eyebrow">TYPING DOJO · ACCURACY FIRST</span><h2>Typing practice</h2></div></div>
    <p class="cq-muted">Your hero runs on every correct key. Get 90% right to set a best.</p>
    <div class="cq-ty-modes">${cards}</div>
    <div class="cq-ty-recent"><span class="cq-eyebrow">LAST 5 SESSIONS</span><ol class="cq-ty-dots" role="img" aria-label="${esc(dotsLabel)}">${dots.map((d) => `<li class="cq-ty-dot cq-ty-dot-${d.color}"${d.accuracy === null ? '' : ` title="${esc(`${d.accuracy}%`)}"`}></li>`).join('')}</ol>
      <span class="cq-muted cq-ty-legend-dots">Gold 95%+ · Green 90%+</span></div>`;
}

// ---------- session geometry ----------
// Item k spans [start, start + length); the separating space after it belongs to item k too.
export function itemStarts(items) {
  const starts = [];
  let at = 0;
  (Array.isArray(items) ? items : []).forEach((item) => { starts.push(at); at += String(item).length + 1; });
  return starts;
}
export function itemAt(items, index) {
  const list = Array.isArray(items) ? items : [];
  const starts = itemStarts(list);
  for (let k = list.length - 1; k >= 0; k -= 1) if (index >= starts[k]) return k;
  return 0;
}
// Items whose last character has been typed.
export function finishedCount(items, index) {
  const list = Array.isArray(items) ? items : [];
  const starts = itemStarts(list);
  let n = 0;
  for (let k = 0; k < list.length; k += 1) if (index >= starts[k] + String(list[k]).length) n += 1;
  return n;
}
export function progressFraction(index, total) {
  if (!(total > 0) || !Number.isFinite(index)) return 0;
  return Math.max(0, Math.min(1, index / total));
}

// ---------- text strip ----------
// { typed, next, rest, upcoming } for the current item (spaces as ␣). `next` is '' once the text is done.
export function stripModel(items, index) {
  const list = Array.isArray(items) ? items.map(String) : [];
  if (!list.length) return { typed: '', next: '', rest: '', upcoming: '', item: 0 };
  const total = list.join(' ').length;
  const at = Math.max(0, Math.min(total, Number.isFinite(index) ? index : 0));
  const k = at >= total ? list.length - 1 : itemAt(list, at);
  const start = itemStarts(list)[k];
  const shown = list[k] + (k < list.length - 1 ? ' ' : '');
  const offset = Math.min(shown.length, at - start);
  return {
    typed: showText(shown.slice(0, offset)),
    next: offset < shown.length ? showChar(shown[offset]) : '',
    rest: offset < shown.length ? showText(shown.slice(offset + 1)) : '',
    upcoming: k + 1 < list.length ? showText(list[k + 1]) : '',
    item: k,
  };
}
export function stripHtml(model, wrong) {
  const m = model || {};
  return `<span class="cq-ty-current"><span class="cq-ty-typed">${esc(m.typed)}</span>${m.next ? `<span class="cq-ty-next${wrong ? ' cq-ty-wrong' : ''}">${esc(m.next)}</span>` : ''}<span class="cq-ty-rest">${esc(m.rest)}</span></span>${m.upcoming ? `<span class="cq-ty-upcoming">${esc(m.upcoming)}</span>` : ''}`;
}

// ---------- on-screen keyboard ----------
export const FINGER_NAMES = {
  L5: 'left pinky', L4: 'left ring', L3: 'left middle', L2: 'left index',
  R2: 'right index', R3: 'right middle', R4: 'right ring', R5: 'right pinky', thumb: 'thumb',
};
const KEY_IDS = (() => {
  const ids = {};
  KEYBOARD_ROWS.forEach((row) => row.forEach((k) => { if (k.key !== 'Shift') ids[k.key] = true; }));
  return ids;
})();
// Next char -> { key, shift, shiftKey, finger } or null. key is the on-screen key id (lowercase letter,
// punctuation, ' '); shiftKey names the Shift to press (the other hand's pinky: 'L5' or 'R5').
export function keyHighlight(char) {
  if (typeof char !== 'string' || char.length !== 1 || !own(FINGER_FOR_KEY, char)) return null;
  const entry = FINGER_FOR_KEY[char];
  const key = char === ' ' ? ' ' : char.toLowerCase();
  if (!own(KEY_IDS, key)) return null;
  const shift = Boolean(entry.shift);
  return {
    key, shift, finger: entry.finger,
    shiftKey: shift ? (entry.finger.charAt(0) === 'L' ? 'R5' : 'L5') : null,
  };
}
export function keyboardHtml() {
  const rows = KEYBOARD_ROWS.map((row, r) => `<div class="cq-kb-row cq-kb-row-${r}">${row.map((k) => {
    const width = Number.isFinite(k.width) ? k.width : 1;
    const id = k.key === 'Shift' ? `Shift-${k.finger}` : k.key;
    return `<span class="cq-kb-key${k.bump ? ' cq-kb-bump' : ''}" data-k="${esc(id)}" data-finger="${esc(k.finger)}" style="--w:${width}">${esc(k.label)}</span>`;
  }).join('')}</div>`).join('');
  const legend = [['Pinky', 'L5', 'R5'], ['Ring', 'L4', 'R4'], ['Middle', 'L3', 'R3'], ['Index', 'L2', 'R2'], ['Thumb', 'thumb']]
    .map(([name, ...fingers]) => `<span class="cq-kb-legend-item">${fingers.map((f) => `<i data-finger="${f}"></i>`).join('')}${name}</span>`).join('<span aria-hidden="true"> · </span>');
  return `<div class="cq-kb-rows">${rows}</div><p class="cq-kb-legend">${legend}</p>`;
}

// ---------- canvas fit + hero position ----------
export function fitRun(containerCssWidth, devicePixelRatio) {
  const dpr = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;
  const available = Number.isFinite(containerCssWidth) && containerCssWidth > 0 ? containerCssWidth : MAX_CSS_WIDTH;
  const cssWidth = Math.max(1, Math.floor(Math.min(MAX_CSS_WIDTH, available)));
  const cssHeight = Math.max(Math.min(MIN_CSS_HEIGHT, cssWidth), Math.round(cssWidth * RUN_ASPECT));
  return { cssWidth, cssHeight, widthPx: Math.max(1, Math.round(cssWidth * dpr)), heightPx: Math.max(1, Math.round(cssHeight * dpr)) };
}
// The run path spans 8%..84% of the canvas; the finish flag stands just past the end.
export const PATH_START = 0.08;
export const PATH_END = 0.84;
export function heroX(fraction, widthPx) {
  const f = Number.isFinite(fraction) ? Math.max(0, Math.min(1, fraction)) : 0;
  const w = Number.isFinite(widthPx) && widthPx > 0 ? widthPx : 0;
  return w * (PATH_START + (PATH_END - PATH_START) * f);
}

// ---------- key filter ----------
// The character a keydown should feed to pressKey, or null. Ctrl/Alt/Meta combos are never typing.
// Space/Enter aimed at a focused control outside the run (interactiveOutside) belong to that control;
// letters still type.
export function typingKey(event, interactiveOutside) {
  if (!event || event.ctrlKey || event.altKey || event.metaKey) return null;
  const key = event.key;
  if (interactiveOutside && (key === ' ' || key === 'Spacebar' || key === 'Enter' || event.code === 'Space')) return null;
  return typeof key === 'string' && key.length === 1 ? key : null;
}

// ---------- live top bar ----------
export function accuracyLabel(state) {
  const total = state ? state.correct + state.errors : 0;
  return total > 0 ? `${Math.round((state.correct / total) * 100)}%` : '—';
}

// ---------- results ----------
// { banner, gemsText, tip, practice } — each null when it doesn't apply.
export function resultsMessages({ accuracy, newBest, gems, missedKeys } = {}) {
  const n = Number.isFinite(gems) ? Math.max(0, Math.floor(gems)) : 0;
  let banner = null;
  if (newBest && n > 0) banner = 'Personal best!';
  else if (newBest) banner = 'New best! (gems once a day)';
  const keys = Array.isArray(missedKeys) ? missedKeys.filter((k) => typeof k === 'string' && k.length) : [];
  return {
    banner,
    gemsText: newBest && n > 0 ? `+${n} 💎` : null,
    tip: Number.isFinite(accuracy) && accuracy < ACCURACY_GOAL ? 'Accuracy first! Get to 90% to set a best.' : null,
    practice: keys.length ? `Practice these: ${keys.map(showChar).join(', ')}` : null,
  };
}

// localStorage keys (per profile).
export const keyboardPrefKey = (profileId) => `codequest-cq-kbd-${profileId || 'unknown'}`;
export const soundPrefKey = (profileId) => `codequest-cq-typing-sound-${profileId || 'unknown'}`;
