// Pro-track progress in localStorage. One key, plain JSON. Mirrors ../progress.js style.
const KEY = 'codequest-pro-v1';

const RANKS = [
  [0, 'Newcomer'],
  [50, 'Script Dabbler'],
  [150, 'Loop Artisan'],
  [300, 'Function Smith'],
  [500, 'Data Bender'],
  [750, 'Abstraction Architect'],
  [1000, 'Engineer-in-Training'],
];

const empty = () => ({ completed: {}, hintsUsed: {}, streak: { count: 0, last: null } });

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY)) ?? {};
    return { ...empty(), ...s, streak: { ...empty().streak, ...s.streak } };
  } catch {
    return empty();
  }
}

function save(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local

export function isComplete(lessonId) {
  return lessonId in load().completed;
}

export function completeLesson(lessonId, xp) {
  const s = load();
  if (lessonId in s.completed) return; // no double XP
  s.completed[lessonId] = xp;
  const t = today();
  if (s.streak.last !== t) {
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
    s.streak.count = s.streak.last === yesterday ? s.streak.count + 1 : 1;
    s.streak.last = t;
  }
  save(s);
}

export function hintsUsed(lessonId) {
  return load().hintsUsed[lessonId] ?? 0;
}

export function revealHint(lessonId) {
  const s = load();
  const n = Math.min(3, (s.hintsUsed[lessonId] ?? 0) + 1);
  s.hintsUsed[lessonId] = n;
  save(s);
  return n;
}

export function totalXp() {
  return Object.values(load().completed).reduce((a, b) => a + b, 0);
}

// { title, floor, next } — next is the following rank's threshold, or null at the top.
export function rank(xp = totalXp()) {
  let i = 0;
  while (i + 1 < RANKS.length && xp >= RANKS[i + 1][0]) i++;
  return { title: RANKS[i][1], floor: RANKS[i][0], next: RANKS[i + 1]?.[0] ?? null };
}

// Consecutive-day streak; 0 if it lapsed (last completion before yesterday).
export function streakCount() {
  const { count, last } = load().streak;
  if (!last) return 0;
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
  return last === today() || last === yesterday ? count : 0;
}

export function chapterProgress(chapter) {
  const done = chapter.lessons.filter((l) => isComplete(l.id)).length;
  return { done, total: chapter.lessons.length };
}

export function badgeEarned(chapter) {
  return chapter.lessons.every((l) => isComplete(l.id));
}
