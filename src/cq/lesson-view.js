// Pure presentation helpers shared by the lesson screens and the grown-ups report. No DOM access.
export const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// Escape first, then allow only **bold**; the nickname is substituted last so its own text stays literal.
export function lessonText(text, nickname) {
  return esc(text).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[your folder\]/g, () => `<span class="cq-folder">${esc(nickname)}</span>`);
}

export const plainText = (text) => String(text == null ? '' : text).replace(/\*\*/g, '');

const roll = (rng, size) => {
  const value = Number(rng());
  const safe = Number.isFinite(value) ? Math.min(Math.max(value, 0), 1 - Number.EPSILON) : 0;
  return Math.floor(safe * size);
};

// Fisher-Yates. Each entry keeps its ORIGINAL index so answers are stored in data terms.
export function shuffled(values, rng = Math.random) {
  const result = values.map((value, index) => ({ value, index }));
  for (let i = result.length - 1; i > 0; i--) {
    const j = roll(rng, i + 1);
    const swap = result[i]; result[i] = result[j]; result[j] = swap;
  }
  return result;
}

const isIdentity = (entries) => entries.every((entry, position) => entry.index === position);

// Answer choices: with 3+ choices the authored (answer-first) order is never shown. A couple of fresh
// draws keep the result uniform over the other orders; a stuck rng falls back to a rotation.
// Two choices stay a fair coin flip: forcing a swap would always put the (usually first) answer second.
export function shuffledChoices(choices, rng = Math.random) {
  let result = shuffled(choices, rng);
  if (choices.length < 3) return result;
  for (let tries = 0; tries < 4 && isIdentity(result); tries++) result = shuffled(choices, rng);
  if (isIdentity(result)) result.push(result.shift());
  return result;
}

export const PHASES = ['warmup', 'learn', 'mission', 'quiz', 'parent', 'key', 'chest'];
const PHASE_LABELS = { warmup: 'Warm-up', learn: 'Learn', mission: 'Mission', quiz: 'Quiz', parent: 'Grown-up', key: 'Key', chest: 'Chest', done: 'Loot' };
export function phaseLabel(phase) {
  return Object.prototype.hasOwnProperty.call(PHASE_LABELS, phase) ? PHASE_LABELS[phase] : 'Lesson';
}

const PARENT_WORDS = { locked: 'Locked', ready: 'Ready', 'not-yet': 'Not yet', passed: 'Passed', done: 'Chest opened' };
export function parentStatus(status, phase) {
  if (status === 'in-progress') return `In progress (${phaseLabel(phase)})`;
  return Object.prototype.hasOwnProperty.call(PARENT_WORDS, status) ? PARENT_WORDS[status] : 'Unknown';
}

// Hub quest card: what the kid sees and which screen the button opens.
export function questCard(status, lesson, phase) {
  const previous = lesson.number - 1;
  switch (status) {
    case 'locked': return { state: `🔒 Pass Lesson ${previous} first`, button: null, route: null };
    case 'ready': return { state: '⭐ Ready', button: 'Start ▶', route: 'lesson' };
    case 'in-progress': return { state: `▶ ${phaseLabel(phase)}`, button: 'Continue ▶', route: 'lesson' };
    case 'not-yet': return { state: '🔁 Almost there', button: 'Call a grown-up again ▶', route: 'lesson' };
    case 'passed': return { state: '🗝️ Key earned', button: 'Open your chest 🗝️ ▶', route: 'lesson' };
    case 'done': return { state: '✅ Passed', button: 'Practice Mission ▶', route: 'practice' };
    default: return { state: '', button: null, route: null };
  }
}

// Mission options for the known Windows version plus "both"; unknown → every option, labeled.
export function visibleOptions(options, windows) {
  const list = Array.isArray(options) ? options : [];
  const known = windows === '10' || windows === '11';
  return list.filter((option) => !known || option.win === 'both' || option.win === windows)
    .map((option) => ({ text: option.text, label: !known && option.win !== 'both' ? `Windows ${option.win}:` : null }));
}

// Learn card Windows variants: the line for his version, otherwise both labeled.
export function windowsLines(win, windows) {
  if (!win || typeof win !== 'object') return [];
  if ((windows === '10' || windows === '11') && typeof win[windows] === 'string') return [{ label: null, text: win[windows] }];
  return ['11', '10'].filter((key) => typeof win[key] === 'string').map((key) => ({ label: `Windows ${key}:`, text: win[key] }));
}

export function windowsFromPlatformVersion(version) {
  if (typeof version !== 'string' || !/^\d+(?:\.\d+)*$/.test(version)) return null;
  const major = Number(version.split('.')[0]);
  if (!Number.isSafeInteger(major) || major < 1) return null;
  return major >= 13 ? '11' : '10';
}

export function todayYmd(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseLessonHash(hash) {
  const match = /^#?(lesson|practice)\/([gs][1-5])$/.exec(String(hash || ''));
  return match ? { route: match[1], id: match[2] } : null;
}

// Chest resume position: the next unanswered question, or the last one when progress is already
// complete (a reload right before openChest commits must not strand the kid past the end).
export function chestResumeIndex(progressLength, chestLength) {
  const length = Number.isInteger(chestLength) && chestLength > 0 ? chestLength : 1;
  const at = Number.isInteger(progressLength) && progressLength > 0 ? progressLength : 0;
  return Math.min(at, length - 1);
}

// Whether a fresh lesson-state JSON differs from the last one we recorded, ignoring activeMs: a
// periodic active-time save (ours or another tab's) must never by itself look like "this lesson changed".
export function lessonStateChanged(freshJson, lastJson) {
  if (freshJson === lastJson) return false;
  const strip = (json) => {
    try {
      const state = JSON.parse(json);
      return JSON.stringify(state && typeof state === 'object' ? { ...state, activeMs: 0 } : state);
    } catch { return json; }
  };
  return strip(freshJson) !== strip(lastJson);
}

// Pure decision behind the storage-refresh rebuild: only true when this lesson's state actually
// changed (ignoring activeMs) AND the kid has no unsaved in-screen input that a rebuild would wipe.
export function shouldRefreshFromStorage(freshJson, lastJson, hasUnsavedInput) {
  return !hasUnsavedInput && lessonStateChanged(freshJson, lastJson);
}

// In-screen progress that isn't saved yet, expressed as plain signals so it's testable without a DOM.
// quiz: an attempt in progress. parent-checks: ticks or a note not yet saved. chest: a wrong pick shown.
// parent-pin: digits already typed into the PIN box.
export function hasUnsavedLessonInput({ kind, quizPos = 0, quizSelected = null, noteValue = '', checksTicked = false, chestWrongCount = 0, pinValue = '' } = {}) {
  if (kind === 'quiz') return quizPos > 0 || quizSelected !== null;
  if (kind === 'parent-checks') return Boolean(String(noteValue || '').trim()) || checksTicked;
  if (kind === 'chest') return chestWrongCount > 0;
  if (kind === 'parent-pin') return Boolean(pinValue);
  return false;
}
