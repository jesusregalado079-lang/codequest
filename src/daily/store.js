// Storage for the dedicated Daily Work page — its own localStorage key, deliberately separate from
// codequest-v1 (the PC hub's profile store). Not because the two could ever collide (this page lives
// on a different device entirely) but so opening the PC app's own pages on the same iPad browser,
// if that ever happens, never reads or writes the wrong blob. This is a small, standalone store: no
// profiles, no gear, no lessons — just which boy's content this iPad shows, the parent PIN, the
// dailyWork answer state (reusing state.js unchanged), and each sheet's saved drawing.
import { emptyDailyWorkState, normalizeDailyWork } from '../cq/daily-work/state.js';
import { isValidDay, isValidIso } from '../cq/iso.js';

const KEY = 'codequest-daily-v1';
const TRACKS = ['guided', 'standard'];
const MAX_DRAWING_CHARS = 900000; // a capped-resolution WebP data URL comfortably fits well under this

const object = (value) => value && typeof value === 'object' && !Array.isArray(value)
  && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null) ? value : {};
const safeKey = (value) => typeof value === 'string' && value.length > 0 && value.length <= 100
  && value !== '__proto__' && value !== 'constructor' && value !== 'prototype';

function defaultParent() {
  return { pinHash: null, pinSalt: null, failCount: 0, lockUntil: 0, unlockedUntil: 0, resets: [] };
}

function normalizeParent(value) {
  const p = object(value);
  return {
    pinHash: typeof p.pinHash === 'string' ? p.pinHash : null,
    pinSalt: typeof p.pinSalt === 'string' ? p.pinSalt : null,
    failCount: Number.isInteger(p.failCount) && p.failCount >= 0 ? p.failCount : 0,
    lockUntil: Number.isFinite(p.lockUntil) && p.lockUntil > 0 ? p.lockUntil : 0,
    unlockedUntil: Number.isFinite(p.unlockedUntil) && p.unlockedUntil > 0 ? p.unlockedUntil : 0,
    resets: Array.isArray(p.resets) ? p.resets.filter((t) => typeof t === 'string').slice(-10) : [],
  };
}

// One drawing per (week, day, sheet): a data: URL string, or null once cleared. Same defensive
// shape-rebuilding as state.js's own normalizer — never trust nested localStorage content blindly.
function normalizeDrawings(value) {
  const source = object(value);
  const weeks = {};
  Object.keys(source).forEach((weekId) => {
    if (!safeKey(weekId)) return;
    const days = {};
    const sourceDays = object(source[weekId]);
    Object.keys(sourceDays).forEach((dayKey) => {
      if (!safeKey(dayKey)) return;
      const sheets = {};
      const sourceSheets = object(sourceDays[dayKey]);
      Object.keys(sourceSheets).forEach((sheetId) => {
        if (!safeKey(sheetId)) return;
        const v = sourceSheets[sheetId];
        if (typeof v === 'string' && v.startsWith('data:image/') && v.length <= MAX_DRAWING_CHARS) sheets[sheetId] = v;
      });
      if (Object.keys(sheets).length) days[dayKey] = sheets;
    });
    if (Object.keys(days).length) weeks[weekId] = days;
  });
  return weeks;
}

// A day's status, snapshotted under its real calendar date the moment it was last computed from
// LIVE content — independent of `dailyWork`, and deliberately not read through state.js's
// normalizeDailyWork(), which drops any stored week whose id isn't in the CURRENT content.js
// (content genuinely gets replaced month to month, see doc §0a "Calendar history"). Without this
// separate snapshot, "go back and see what they did" would silently break the moment a month's
// content rotates out, since the underlying per-item answers for that week get garbage-collected
// by design. This only ever stores a coarse status + which week/day produced it, never item-level
// answers — plenty for a calendar to color a past day in, not a way to review the actual work.
const HISTORY_STATUSES = ['not-started', 'in-progress', 'awaiting-check', 'needs-fixes', 'complete'];
const MAX_HISTORY_ENTRIES = 400; // ~18 months of weekdays; oldest entries drop first past this

function normalizeHistory(value) {
  const source = object(value);
  const entries = Object.keys(source).filter(isValidDay).map((iso) => {
    const entry = object(source[iso]);
    return {
      iso,
      status: HISTORY_STATUSES.includes(entry.status) ? entry.status : null,
      weekId: safeKey(entry.weekId) ? entry.weekId : null,
      dayKey: safeKey(entry.dayKey) ? entry.dayKey : null,
      updatedAt: isValidIsoStamp(entry.updatedAt) ? entry.updatedAt : iso,
    };
  }).filter((entry) => entry.status && entry.weekId && entry.dayKey);
  entries.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  const history = {};
  entries.slice(0, MAX_HISTORY_ENTRIES).forEach((entry) => { history[entry.iso] = entry; });
  return history;
}

// Which blocks a kid has tapped on a percent problem's block bar — visual working-out only, never
// the graded answer (that's the number he types, kept in dailyWork). Its own bucket so a re-render or
// reload doesn't lose his picture, without touching the shared per-item answer shape. Keyed
// week -> day -> sheet -> item -> how many blocks (0..MAX_BLOCK_FILL) are filled, left to right.
const MAX_BLOCK_FILL = 50;

function normalizeBlockFills(value) {
  const weeks = {};
  const source = object(value);
  Object.keys(source).forEach((weekId) => {
    if (!safeKey(weekId)) return;
    const days = {};
    const sourceDays = object(source[weekId]);
    Object.keys(sourceDays).forEach((dayKey) => {
      if (!safeKey(dayKey)) return;
      const sheets = {};
      const sourceSheets = object(sourceDays[dayKey]);
      Object.keys(sourceSheets).forEach((sheetId) => {
        if (!safeKey(sheetId)) return;
        const items = {};
        const sourceItems = object(sourceSheets[sheetId]);
        Object.keys(sourceItems).forEach((itemId) => {
          const n = sourceItems[itemId];
          if (safeKey(itemId) && Number.isInteger(n) && n > 0 && n <= MAX_BLOCK_FILL) items[itemId] = n;
        });
        if (Object.keys(items).length) sheets[sheetId] = items;
      });
      if (Object.keys(sheets).length) days[dayKey] = sheets;
    });
    if (Object.keys(days).length) weeks[weekId] = days;
  });
  return weeks;
}

export function blockFillFor(store, weekId, dayKey, sheetId, itemId) {
  const n = ((((object(store.blockFills)[weekId] || {})[dayKey] || {})[sheetId] || {})[itemId]);
  return Number.isInteger(n) && n > 0 ? n : 0;
}

// Returns a new store with one item's filled-block count set (0 removes it).
export function setBlockFill(store, weekId, dayKey, sheetId, itemId, count) {
  const next = JSON.parse(JSON.stringify(store));
  const weeks = next.blockFills || (next.blockFills = {});
  const days = weeks[weekId] || (weeks[weekId] = {});
  const sheets = days[dayKey] || (days[dayKey] = {});
  const items = sheets[sheetId] || (sheets[sheetId] = {});
  if (Number.isInteger(count) && count > 0) items[itemId] = Math.min(count, MAX_BLOCK_FILL);
  else delete items[itemId];
  return next;
}

export function emptyStore() {
  return { track: null, parent: defaultParent(), dailyWork: emptyDailyWorkState(), drawings: {}, history: {}, blockFills: {} };
}

function normalize(value) {
  const s = object(value);
  return {
    track: TRACKS.includes(s.track) ? s.track : null,
    parent: normalizeParent(s.parent),
    dailyWork: normalizeDailyWork(s.dailyWork),
    drawings: normalizeDrawings(s.drawings),
    history: normalizeHistory(s.history),
    blockFills: normalizeBlockFills(s.blockFills),
  };
}

// Records (or overwrites) one day's status snapshot. Call this whenever a day's status is computed
// from live content — safe to call every time the calendar renders; it's just an upsert keyed by
// the real date, not an append log.
export function snapshotHistory(store, iso, weekId, dayKey, status) {
  if (!isValidDay(iso) || !HISTORY_STATUSES.includes(status)) return store;
  const next = JSON.parse(JSON.stringify(store));
  next.history = next.history || {};
  next.history[iso] = { iso, status, weekId, dayKey, updatedAt: new Date().toISOString() };
  return next;
}

export function historyFor(store, iso) {
  return object(store.history)[iso] || null;
}

export function load() {
  try {
    return normalize(JSON.parse(localStorage.getItem(KEY)));
  } catch {
    return emptyStore();
  }
}

export function save(store) {
  localStorage.setItem(KEY, JSON.stringify(normalize(store)));
}

export function setTrack(track) {
  if (!TRACKS.includes(track)) throw new Error('unknown track');
  const s = load();
  s.track = track;
  save(s);
  return s;
}

export function drawingFor(store, weekId, dayKey, sheetId) {
  return ((object(store.drawings)[weekId] || {})[dayKey] || {})[sheetId] || null;
}

// Saves (or, with dataUrl === null, clears) one sheet's drawing without touching anything else —
// mirrors the same narrow-write discipline daily-work-ui.js's setItem() already uses for answers.
export function saveDrawing(store, weekId, dayKey, sheetId, dataUrl) {
  const next = JSON.parse(JSON.stringify(store));
  const weeks = next.drawings || (next.drawings = {});
  const days = weeks[weekId] || (weeks[weekId] = {});
  const sheets = days[dayKey] || (days[dayKey] = {});
  if (dataUrl) sheets[sheetId] = dataUrl;
  else delete sheets[sheetId];
  return next;
}

export function isValidIsoStamp(value) {
  return isValidIso(value);
}
