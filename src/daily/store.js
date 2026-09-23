// Storage for the dedicated Daily Work page — its own localStorage key, deliberately separate from
// codequest-v1 (the PC hub's profile store). Not because the two could ever collide (this page lives
// on a different device entirely) but so opening the PC app's own pages on the same iPad browser,
// if that ever happens, never reads or writes the wrong blob. This is a small, standalone store: no
// profiles, no gear, no lessons — just which boy's content this iPad shows, the parent PIN, the
// dailyWork answer state (reusing state.js unchanged), and each sheet's saved drawing.
import { emptyDailyWorkState, normalizeDailyWork } from '../cq/daily-work/state.js';
import { isValidDay, isValidIso } from '../cq/iso.js';

const KEY = 'codequest-daily-v1';
// Drawings live under their own key. Answers (KEY) are small and must ALWAYS save; ink is big scratch
// work and best-effort. localStorage's ~5MB is shared per origin (Safari counts UTF-16, so roughly half
// that in characters), so ink is budgeted and is the first thing dropped when space runs out.
const INK_KEY = 'codequest-daily-ink-v1';
const TRACKS = ['guided', 'standard'];
const MAX_DRAWING_CHARS = 900000; // hard ceiling when reading a saved drawing back
const INK_BUDGET = 1000000; // total characters of drawings kept on disk, across every sheet

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
  // Copies only blockFills: cloning the whole store would also copy every saved drawing on each tap.
  const next = { ...store, blockFills: JSON.parse(JSON.stringify(object(store.blockFills))) };
  const weeks = next.blockFills;
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

function normalize(value, { ink = true } = {}) {
  const s = object(value);
  return {
    track: TRACKS.includes(s.track) ? s.track : null,
    parent: normalizeParent(s.parent),
    dailyWork: normalizeDailyWork(s.dailyWork),
    drawings: ink ? normalizeDrawings(s.drawings) : {},
    history: normalizeHistory(s.history),
    blockFills: normalizeBlockFills(s.blockFills),
  };
}

function coreJson(store) {
  const { drawings, ...core } = normalize(store, { ink: false });
  return JSON.stringify(core);
}

// localStorage writes can throw (storage full, blocked, private mode). Nothing in here lets that escape:
// callers get { ok } instead, so a failed save can be shown to the user instead of silently losing work.
function trySet(key, json) {
  try { localStorage.setItem(key, json); return true; } catch { return false; }
}

function readCore() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    return raw === null ? null : normalize(raw, { ink: false });
  } catch {
    return null;
  }
}

function readInk() {
  try { return normalizeDrawings(JSON.parse(localStorage.getItem(INK_KEY))); } catch { return {}; }
}

function mergeDrawings(base, top) {
  const out = {};
  [base, top].forEach((source) => Object.keys(source).forEach((weekId) => {
    out[weekId] = out[weekId] || {};
    Object.keys(source[weekId]).forEach((dayKey) => {
      out[weekId][dayKey] = { ...(out[weekId][dayKey] || {}), ...source[weekId][dayKey] };
    });
  }));
  return out;
}

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const weekNumber = (weekId) => Number((String(weekId).match(/\d+$/) || [0])[0]);

// Oldest sheets first (by week, then weekday), so trimming to the budget forgets old work before new.
function inkEntries(drawings) {
  const entries = [];
  Object.keys(drawings).forEach((weekId) => Object.keys(drawings[weekId]).forEach((dayKey) => Object.keys(drawings[weekId][dayKey]).forEach((sheetId) => {
    entries.push({ weekId, dayKey, sheetId, url: drawings[weekId][dayKey][sheetId] });
  })));
  return entries.sort((a, b) => weekNumber(a.weekId) - weekNumber(b.weekId)
    || DAY_ORDER.indexOf(a.dayKey) - DAY_ORDER.indexOf(b.dayKey) || (a.sheetId < b.sheetId ? -1 : 1));
}

// Drawings trimmed to INK_BUDGET, oldest first, never dropping the sheet named by `keep`.
function fitInk(drawings, keep) {
  const entries = inkEntries(drawings);
  let total = entries.reduce((sum, entry) => sum + entry.url.length, 0);
  const isKept = (entry) => keep && entry.weekId === keep[0] && entry.dayKey === keep[1] && entry.sheetId === keep[2];
  const dropped = new Set();
  for (const entry of entries) {
    if (total <= INK_BUDGET) break;
    if (isKept(entry)) continue;
    dropped.add(entry);
    total -= entry.url.length;
  }
  const fitted = {};
  entries.forEach((entry) => {
    if (dropped.has(entry)) return;
    fitted[entry.weekId] = fitted[entry.weekId] || {};
    fitted[entry.weekId][entry.dayKey] = fitted[entry.weekId][entry.dayKey] || {};
    fitted[entry.weekId][entry.dayKey][entry.sheetId] = entry.url;
  });
  return fitted;
}

// Saves everything except drawings: track, PIN state, every answer, grades, history, block fills. Small,
// so it should always fit. If storage is full, the saved drawings are dropped to make room (answers
// matter more than scratch work) and the write is retried once. Never throws.
export function saveCore(store) {
  const json = coreJson(store);
  if (trySet(KEY, json)) return { ok: true, evictedInk: false };
  try { localStorage.removeItem(INK_KEY); } catch { /* nothing more to free */ }
  return { ok: trySet(KEY, json), evictedInk: true };
}

// Saves drawings only, trimmed to a fixed budget. Best-effort: returns { ok:false } rather than throwing.
export function saveInk(store, keep = null) {
  return { ok: trySet(INK_KEY, JSON.stringify(fitInk(normalizeDrawings(store.drawings), keep))) };
}

export function save(store) {
  const core = saveCore(store);
  const ink = saveInk(store);
  return { ok: core.ok, evictedInk: core.evictedInk, inkOk: ink.ok };
}

// Until the last answers-save succeeded, the in-memory copy is the only one holding the newest answers,
// so it must not be replaced by (older) saved data.
let coreSaved = true;

// The one write path for the page. `change` is applied to the LATEST saved answers, not to whatever this
// tab loaded earlier: a second tab (or a restored one) that saved since would otherwise be overwritten by
// this tab's stale copy — that is how answers a boy typed in one tab went missing from another. If the
// saved copy is missing or unreadable, or the last save failed, the in-memory copy is the base instead
// so nothing already typed is lost. Returns { store, core, ink }; nothing here throws.
export function commit(current, change, { core = true, ink = false, keep = null } = {}) {
  const latest = coreSaved ? readCore() : null;
  const next = change({ ...(latest || current), drawings: current.drawings });
  const result = { store: next, core: null, ink: null };
  if (core) { result.core = saveCore(next); coreSaved = result.core.ok; }
  if (ink) result.ink = saveInk(next, keep);
  return result;
}

// The newest saved answers as a full store, keeping this tab's drawings; null if there is nothing newer
// to adopt (nothing saved, unreadable, or this tab holds answers that could not be saved yet).
export function refreshed(current) {
  if (!coreSaved) return null;
  const latest = readCore();
  return latest ? { ...latest, drawings: current.drawings } : null;
}

// Records (or overwrites) one day's status snapshot. Call this whenever a day's status is computed
// from live content — safe to call every time the calendar renders; it's just an upsert keyed by
// the real date, not an append log.
export function snapshotHistory(store, iso, weekId, dayKey, status) {
  if (!isValidDay(iso) || !HISTORY_STATUSES.includes(status)) return store;
  const next = { ...store, history: { ...object(store.history) } };
  next.history[iso] = { iso, status, weekId, dayKey, updatedAt: new Date().toISOString() };
  return next;
}

export function historyFor(store, iso) {
  return object(store.history)[iso] || null;
}

// Reads the saved store. A store saved before drawings got their own key still has them inside the answers
// blob; those are moved across here (drawings first, so a failed copy never costs the only copy).
export function load() {
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(KEY)); } catch { raw = null; }
  const core = normalize(raw);
  const legacy = Object.keys(core.drawings).length > 0;
  const loaded = { ...core, drawings: legacy ? mergeDrawings(core.drawings, readInk()) : readInk() };
  if (legacy && saveInk(loaded).ok) saveCore(loaded);
  return loaded;
}

export function withTrack(store, track) {
  if (!TRACKS.includes(track)) throw new Error('unknown track');
  return { ...store, track };
}

export function setTrack(track) {
  const s = withTrack(load(), track);
  saveCore(s);
  return s;
}

export function drawingFor(store, weekId, dayKey, sheetId) {
  return ((object(store.drawings)[weekId] || {})[dayKey] || {})[sheetId] || null;
}

// Saves (or, with dataUrl === null, clears) one sheet's drawing without touching anything else —
// mirrors the same narrow-write discipline daily-work-ui.js's setItem() already uses for answers.
export function saveDrawing(store, weekId, dayKey, sheetId, dataUrl) {
  if (!safeKey(weekId) || !safeKey(dayKey) || !safeKey(sheetId)) return store;
  const weeks = { ...object(store.drawings) };
  const days = { ...object(weeks[weekId]) };
  const sheets = { ...object(days[dayKey]) };
  if (dataUrl) sheets[sheetId] = dataUrl;
  else delete sheets[sheetId];
  days[dayKey] = sheets;
  weeks[weekId] = days;
  return { ...store, drawings: weeks };
}

export function isValidIsoStamp(value) {
  return isValidIso(value);
}
