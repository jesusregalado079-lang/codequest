// Pro-track progress in localStorage. One key, plain JSON. Mirrors ../progress.js style.
//
// Everything read from storage is normalised field by field (a damaged or hand-edited save can never stop a page
// from rendering), every write goes through one guarded save() that reports failure instead of throwing, and the
// learner can export his progress to a file and import it back (the only copy otherwise lives in this browser).
import { LEGACY_KEYS_V1 } from './legacy-keys.js';
import { emptyExamState, mergeExamState, normalizeExamState, normalizeExams } from './exam/exam-logic.js';

const KEY = 'codequest-pro-v1';
export const EXPORT_FORMAT = 'codequest-pro-progress';
export const EXPORT_VERSION = 1;

const RANKS = [
  [0, 'Newcomer'],
  [50, 'Script Dabbler'],
  [150, 'Loop Artisan'],
  [300, 'Function Smith'],
  [500, 'Data Bender'],
  [750, 'Abstraction Architect'],
  [1000, 'Engineer-in-Training'],
];

export const DEFAULT_HOURS_PER_WEEK = 21; // 3 hours a day
const empty = () => ({ completed: {}, hintsUsed: {}, streak: { count: 0, last: null }, studyDone: {}, doneAt: {}, settings: { hoursPerWeek: DEFAULT_HOURS_PER_WEEK }, migrations: {}, exams: {} });

const plain = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const okKey = (k) => typeof k === 'string' && k.length > 0 && k.length <= 400 && k !== '__proto__' && k !== 'constructor' && k !== 'prototype';
const isDay = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

// A clean state from anything: wrong types are dropped one field at a time, valid parts are kept.
export function normalizeState(raw) {
  const o = plain(raw);
  const out = empty();
  Object.keys(plain(o.completed)).forEach((k) => {
    const xp = o.completed[k];
    if (okKey(k) && typeof xp === 'number' && Number.isFinite(xp) && xp >= 0 && xp <= 10000) out.completed[k] = xp;
  });
  Object.keys(plain(o.hintsUsed)).forEach((k) => {
    const n = o.hintsUsed[k];
    if (okKey(k) && Number.isInteger(n) && n >= 0 && n <= 3) out.hintsUsed[k] = n;
  });
  const st = plain(o.streak);
  out.streak = { count: Number.isInteger(st.count) && st.count >= 0 ? st.count : 0, last: isDay(st.last) ? st.last : null };
  Object.keys(plain(o.studyDone)).forEach((k) => { if (okKey(k) && o.studyDone[k] === true) out.studyDone[k] = true; });
  Object.keys(plain(o.migrations)).forEach((k) => { if (okKey(k) && o.migrations[k] === true) out.migrations[k] = true; });
  // the day each checkmark was made (only for checkmarks that are still set; older ones have no date)
  Object.keys(plain(o.doneAt)).forEach((k) => { if (out.studyDone[k] && isDay(o.doneAt[k])) out.doneAt[k] = o.doneAt[k]; });
  const hpw = plain(o.settings).hoursPerWeek;
  out.settings.hoursPerWeek = Number.isInteger(hpw) && hpw >= 1 && hpw <= 100 ? hpw : DEFAULT_HOURS_PER_WEEK;
  out.exams = normalizeExams(o.exams); // certification practice: answers, mocks, the open session (exam/exam-logic.js)
  return out;
}

function load() {
  try {
    return normalizeState(JSON.parse(localStorage.getItem(KEY)));
  } catch {
    return empty();
  }
}

// Storage can be full, blocked or unavailable. A failed save never throws into a click handler; it is recorded so
// the page can tell the learner his last change was not kept.
let lastSave = { ok: true };
function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    lastSave = { ok: true };
  } catch (error) {
    lastSave = { ok: false, error: String(error && error.name ? error.name : error) };
  }
  return lastSave.ok;
}
export const lastSaveOk = () => lastSave.ok;

const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local
// Local calendar day before today. Uses date arithmetic (not now-24h) so the
// two DST-transition days, which are 23h/25h long, don't skip or repeat a day.
const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('en-CA');
};

export function isComplete(lessonId) {
  return lessonId in load().completed;
}

export function completeLesson(lessonId, xp) {
  const s = load();
  if (lessonId in s.completed) return; // no double XP
  s.completed[lessonId] = xp;
  const t = today();
  if (s.streak.last !== t) {
    s.streak.count = s.streak.last === yesterday() ? s.streak.count + 1 : 1;
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
  return last === today() || last === yesterday() ? count : 0;
}

// Study/roadmap checkmarks. `key` is an item's permanent id (or `out:`/`gate:`/`quiz:` keys built from one).
export function isStudyDone(key) {
  return load().studyDone[key] === true;
}

// Every saved checkmark at once, for pages that read many (one storage read instead of one per item).
export function studyDoneMap() {
  return { ...load().studyDone };
}

// Returns { ok, done }: `done` is the new state, `ok` false when it could not be saved.
export function toggleStudyDone(key) {
  const s = load();
  if (s.studyDone[key]) { delete s.studyDone[key]; delete s.doneAt[key]; } else { s.studyDone[key] = true; s.doneAt[key] = today(); }
  const ok = save(s);
  return { ok, done: s.studyDone[key] === true };
}

export function setStudyDone(key, value) {
  const s = load();
  if (value) { if (!s.studyDone[key]) s.doneAt[key] = today(); s.studyDone[key] = true; } else { delete s.studyDone[key]; delete s.doneAt[key]; }
  return { ok: save(s), done: value === true };
}

// The day each checkmark was made ({ key: 'YYYY-MM-DD' }); checkmarks from before dates were kept have none.
export function doneDates() {
  return { ...load().doneAt };
}

export function getSettings() {
  return { ...load().settings };
}

export function setHoursPerWeek(hours) {
  const s = load();
  const n = Math.round(Number(hours));
  if (!Number.isFinite(n) || n < 1 || n > 100) return { ok: false };
  s.settings.hoursPerWeek = n;
  return { ok: save(s) };
}

// Certification practice for one exam ('secplus-801'): { hist, attempts, session }.
export function getExamState(examId) {
  return load().exams[examId] || emptyExamState();
}
export function saveExamState(examId, state) {
  const s = load();
  s.exams[examId] = normalizeExamState(state);
  return { ok: save(s) };
}

// One-time move of checkmarks saved under old keys to the permanent ids. Runs once per name, never undoes anything,
// and leaves the old keys in place (harmless, and a way back if ever needed).
export function applyKeyMigration(name, pairs) {
  const s = load();
  if (s.migrations[name]) return { ran: false, moved: 0 };
  let moved = 0;
  pairs.forEach(([from, to]) => {
    if (s.studyDone[from] === true && s.studyDone[to] !== true) { s.studyDone[to] = true; moved += 1; }
  });
  s.migrations[name] = true;
  save(s);
  return { ran: true, moved };
}

export function ensureMigrated() {
  return applyKeyMigration('ids-2026-10-08', LEGACY_KEYS_V1);
}

// ---------- backup ----------
export function exportProgress(now = new Date()) {
  return JSON.stringify({ format: EXPORT_FORMAT, version: EXPORT_VERSION, exportedAt: now.toISOString(), progress: load() }, null, 2);
}

// mode 'merge' (default): keep everything already here and add what the file has (a checkmark is never removed,
// XP keeps the higher value). mode 'replace': the file becomes the progress. Returns { ok, error?, items }.
export function importProgress(text, mode = 'merge') {
  let parsed;
  try { parsed = JSON.parse(text); } catch { return { ok: false, error: 'That file is not a CodeQuest Pro backup (it is not valid JSON).' }; }
  const o = plain(parsed);
  if (o.format !== EXPORT_FORMAT || !Number.isInteger(o.version) || o.version < 1) return { ok: false, error: 'That file is not a CodeQuest Pro backup.' };
  if (o.version > EXPORT_VERSION) return { ok: false, error: 'That backup was made by a newer version of the app.' };
  const incoming = normalizeState(o.progress);
  let next;
  if (mode === 'replace') next = incoming;
  else {
    const here = load();
    next = normalizeState(here);
    Object.keys(incoming.studyDone).forEach((k) => { next.studyDone[k] = true; });
    Object.keys(incoming.completed).forEach((k) => { next.completed[k] = Math.max(next.completed[k] ?? 0, incoming.completed[k]); });
    Object.keys(incoming.hintsUsed).forEach((k) => { next.hintsUsed[k] = Math.max(next.hintsUsed[k] ?? 0, incoming.hintsUsed[k]); });
    Object.keys(incoming.migrations).forEach((k) => { next.migrations[k] = true; });
    Object.keys(incoming.doneAt).forEach((k) => { if (!next.doneAt[k] || incoming.doneAt[k] < next.doneAt[k]) next.doneAt[k] = incoming.doneAt[k]; });
    if (incoming.streak.last && (!next.streak.last || incoming.streak.last > next.streak.last)) next.streak = incoming.streak;
    Object.keys(incoming.exams).forEach((k) => { next.exams[k] = mergeExamState(next.exams[k], incoming.exams[k]); });
  }
  if (!save(next)) return { ok: false, error: 'This browser could not save the imported progress (storage is full or blocked).' };
  return { ok: true, items: Object.keys(next.studyDone).length };
}

// Ask the browser not to clear this site's data when space is short (best effort; some browsers ignore it).
export function requestPersistentStorage() {
  try {
    if (globalThis.navigator && navigator.storage && navigator.storage.persist) return navigator.storage.persist().catch(() => false);
  } catch { /* optional */ }
  return Promise.resolve(false);
}

export function chapterProgress(chapter) {
  const done = chapter.lessons.filter((l) => isComplete(l.id)).length;
  return { done, total: chapter.lessons.length };
}

export function badgeEarned(chapter) {
  return chapter.lessons.every((l) => isComplete(l.id));
}
