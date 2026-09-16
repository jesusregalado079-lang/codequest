import { normalizeCq } from '../character.js';

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.keys(value).forEach((key) => deepFreeze(value[key]));
  return Object.freeze(value);
}

// Standard 10-finger QWERTY chart: each letter's home key, plus the punctuation this
// pack actually uses (space, comma, period, semicolon). Uppercase entries reuse the
// same finger as their lowercase letter and are marked shift: true.
const BASE_FINGER = {
  q: 'L5', w: 'L4', e: 'L3', r: 'L2', t: 'L2',
  a: 'L5', s: 'L4', d: 'L3', f: 'L2', g: 'L2',
  z: 'L5', x: 'L4', c: 'L3', v: 'L2', b: 'L2',
  y: 'R2', u: 'R2', i: 'R3', o: 'R4', p: 'R5',
  h: 'R2', j: 'R2', k: 'R3', l: 'R4', ';': 'R5',
  n: 'R2', m: 'R2', ',': 'R3', '.': 'R4',
};

export const FINGER_FOR_KEY = (() => {
  const map = {};
  Object.keys(BASE_FINGER).forEach((char) => {
    map[char] = { finger: BASE_FINGER[char], shift: false };
    if (/[a-z]/.test(char)) map[char.toUpperCase()] = { finger: BASE_FINGER[char], shift: true };
  });
  map[' '] = { finger: 'thumb', shift: false };
  return deepFreeze(map);
})();

const key = (k, label, finger, extra) => ({ key: k, label: label || k, finger, ...(extra || {}) });

export const KEYBOARD_ROWS = deepFreeze([
  [
    key('q', 'Q', 'L5'), key('w', 'W', 'L4'), key('e', 'E', 'L3'), key('r', 'R', 'L2'), key('t', 'T', 'L2'),
    key('y', 'Y', 'R2'), key('u', 'U', 'R2'), key('i', 'I', 'R3'), key('o', 'O', 'R4'), key('p', 'P', 'R5'),
  ],
  [
    key('a', 'A', 'L5'), key('s', 'S', 'L4'), key('d', 'D', 'L3'), key('f', 'F', 'L2', { bump: true }), key('g', 'G', 'L2'),
    key('h', 'H', 'R2'), key('j', 'J', 'R2', { bump: true }), key('k', 'K', 'R3'), key('l', 'L', 'R4'), key(';', ';', 'R5'),
  ],
  [
    key('Shift', 'Shift', 'L5', { width: 2 }), key('z', 'Z', 'L5'), key('x', 'X', 'L4'), key('c', 'C', 'L3'),
    key('v', 'V', 'L2'), key('b', 'B', 'L2'), key('n', 'N', 'R2'), key('m', 'M', 'R2'), key(',', ',', 'R3'),
    key('.', '.', 'R4'), key('Shift', 'Shift', 'R5', { width: 2 }),
  ],
  [key(' ', 'Space', 'thumb', { width: 6 })],
]);

// Fixed ordered drills: home-row letter groups, then home-row-only words (deterministic, no rng).
export const HOME_ROW_ITEMS = deepFreeze([
  'asdf', 'jkl;', 'fjfj', 'dkdk',
  'ask', 'dad', 'sad', 'fall', 'flask', 'glad', 'half', 'hall', 'shall', 'lads',
]);

// 9yo: lowercase except a capital I; no punctuation beyond a final period; each <= 30 chars.
export const GUIDED_SENTENCES = deepFreeze([
  'i can type.',
  'a folder holds files.',
  'stop and ask a grownup.',
  'the taskbar is at the bottom.',
  'rocks are cool.',
  'the mouse moves the pointer.',
  'click start to open apps.',
  'close the window with x.',
  'save your file in a folder.',
  'the search box finds files.',
]);

// 10yo: normal capitals and punctuation; each <= 40 chars.
export const STANDARD_SENTENCES = deepFreeze([
  'Alt and Tab switch windows.',
  'Save your work with Ctrl and S.',
  'A file lives inside a folder.',
  'Check the address before you click.',
  'Accuracy first, speed later.',
  'Windows key plus D shows the desktop.',
  'Press Ctrl and S to save your file.',
  'Copy makes a twin of the file.',
  'Undo brings back your last change.',
  'Rest your fingers on the home row.',
  'Search results can be ads or sponsored.',
  'Keep passwords private and safe.',
]);

const LESSON_WORDS_COUNT = { guided: 12, standard: 15 };
const SENTENCES_COUNT = { guided: 4, standard: 6 };

function rngRoll(rng) {
  const value = typeof rng === 'function' ? rng() : NaN;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.min(1 - Number.EPSILON, value) : 0;
}

function shuffle(list, rng) {
  const result = list.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rngRoll(rng) * (i + 1));
    const tmp = result[i];
    result[i] = result[j];
    result[j] = tmp;
  }
  return result;
}

function fillToCount(pool, count, rng) {
  if (!pool.length || count <= 0) return [];
  const items = [];
  while (items.length < count) {
    const batch = shuffle(pool, rng);
    const take = Math.min(batch.length, count - items.length);
    for (let i = 0; i < take; i += 1) items.push(batch[i]);
  }
  return items;
}

// Fix P5a-fix #1: unlocks on passedAt directly (not cq.lessonsPassed, which is only written when
// the chest opens) so sentences unlock the moment the parent check passes, before the chest/battle.
export function sentencesUnlocked(cq) {
  const normalized = normalizeCq(cq);
  if (!normalized.track) return false;
  const lesson2 = normalized.track === 'guided' ? 'g2' : 's2';
  const state = normalized.lessons[lesson2];
  return Boolean(state && state.passedAt);
}

function lessonWordsPool(normalized, lessons) {
  const track = normalized.track;
  if (!track) return [];
  const trackLessons = (Array.isArray(lessons) ? lessons : [])
    .filter((lesson) => lesson && lesson.track === track && typeof lesson.id === 'string' && Array.isArray(lesson.typingWords))
    .sort((a, b) => (Number.isFinite(a.number) ? a.number : 0) - (Number.isFinite(b.number) ? b.number : 0));
  if (!trackLessons.length) return [];
  const seen = new Set();
  const words = [];
  const addWords = (lesson) => lesson.typingWords.forEach((word) => {
    if (typeof word === 'string' && !seen.has(word)) { seen.add(word); words.push(word); }
  });
  addWords(trackLessons[0]); // at least lesson 1's words, always
  // Fix P5a-fix #1: any lesson with startedAt set counts (in-progress, not-yet, passed, done),
  // not just "passed || in-progress" — a passed-but-chest-unopened lesson was wrongly excluded.
  trackLessons.forEach((lesson) => {
    const state = normalized.lessons[lesson.id];
    if (state && state.startedAt) addWords(lesson);
  });
  return words;
}

export function itemsFor(mode, cq, lessons, rng) {
  const normalized = normalizeCq(cq);
  if (mode === 'homeRow') return HOME_ROW_ITEMS.slice(0, 12);
  if (!normalized.track) return [];
  if (mode === 'lessonWords') {
    const count = LESSON_WORDS_COUNT[normalized.track];
    return fillToCount(lessonWordsPool(normalized, lessons), count, rng);
  }
  if (mode === 'sentences') {
    if (!sentencesUnlocked(normalized)) return [];
    const bank = normalized.track === 'guided' ? GUIDED_SENTENCES : STANDARD_SENTENCES;
    const count = SENTENCES_COUNT[normalized.track];
    return shuffle(bank, rng).slice(0, count);
  }
  return [];
}

export const sessionText = (items) => (Array.isArray(items) ? items : []).join(' ');
