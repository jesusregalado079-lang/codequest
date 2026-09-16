import { isValidIso, isValidDay } from '../iso.js';

const MODES = ['homeRow', 'lessonWords', 'sentences'];

const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const object = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {});
const finiteNumber = (value) => typeof value === 'number' && Number.isFinite(value);
// Fix P5a-fix #5: Date.parse alone is too lenient (engine-dependent loose parsing of non-ISO
// strings like "1"), so require a real ISO timestamp shape before trusting Date.parse's result.
// Fix P6b: shape alone still let impossible dates like "2026-02-30" through (Date.parse rolls
// them over) — isValidIso also checks the Y-M-D/H:M:S components are in range.
const iso = (value) => (isValidIso(value) ? value : null);
const clampInt = (value, min, max) => Math.min(max, Math.max(min, Math.round(value)));
const clamp1 = (value, min, max) => Math.round(Math.min(max, Math.max(min, value)) * 10) / 10;
const day = (value) => (isValidDay(value) ? value : null);

export function emptyTyping() {
  return { best: { homeRow: null, lessonWords: null, sentences: null }, sessions: [], bestGemDays: [] };
}

function normalizeBest(value) {
  const source = object(value);
  if (!finiteNumber(source.wpm) || !finiteNumber(source.accuracy) || !iso(source.at)) return null;
  return { wpm: clamp1(source.wpm, 0, 200), accuracy: clampInt(source.accuracy, 0, 100), at: source.at };
}

function normalizeSession(value) {
  const source = object(value);
  if (!iso(source.at) || !MODES.includes(source.mode) || !finiteNumber(source.wpm) || !finiteNumber(source.accuracy)
    || !finiteNumber(source.ms) || !finiteNumber(source.chars)) return null;
  return {
    at: source.at,
    mode: source.mode,
    wpm: clamp1(source.wpm, 0, 200),
    accuracy: clampInt(source.accuracy, 0, 100),
    ms: clampInt(source.ms, 0, 3600000),
    chars: clampInt(source.chars, 0, 10000),
  };
}

// Normalizes cq.typing. Only known modes/fields are ever read (via hasOwnProperty checks
// against a fixed list), so a hostile __proto__ key can neither add data nor pollute output.
export function normalizeTyping(value) {
  const source = object(value);
  const bestSource = object(has(source, 'best') ? source.best : null);
  const best = {};
  MODES.forEach((mode) => { best[mode] = has(bestSource, mode) ? normalizeBest(bestSource[mode]) : null; });

  const sessionsSource = has(source, 'sessions') && Array.isArray(source.sessions) ? source.sessions : [];
  const sessions = sessionsSource.map(normalizeSession).filter(Boolean).slice(-20); // most recent 20, newest last

  const daysSource = has(source, 'bestGemDays') && Array.isArray(source.bestGemDays) ? source.bestGemDays : [];
  const days = [];
  daysSource.forEach((entry) => {
    const valid = day(entry);
    if (valid && !days.includes(valid)) days.push(valid);
  });
  days.sort();

  return { best, sessions, bestGemDays: days.slice(-30) };
}
