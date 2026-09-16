// Profiles + progress in localStorage. One key, plain JSON, export/import.
import { normalizeCq } from './cq/character.js';
const KEY = 'codequest-v1';
const UNLOCKED_KEY = 'codequest-unlocked';

export const PICTURES = [
  { id: 'dragon', emoji: '🐉' }, { id: 'rocket', emoji: '🚀' },
  { id: 'pizza', emoji: '🍕' }, { id: 'ball', emoji: '⚽' },
  { id: 'shark', emoji: '🦈' }, { id: 'volcano', emoji: '🌋' },
  { id: 'guitar', emoji: '🎸' }, { id: 'crown', emoji: '👑' },
  { id: 'cactus', emoji: '🌵' },
];

const pictureIds = new Set(PICTURES.map((picture) => picture.id));
const defaultParent = () => ({ pinHash: null, pinSalt: null, failCount: 0, lockUntil: 0, resets: [] });

function normalizePictureCode(code) {
  return Array.isArray(code) && code.length === 3 && code.every((id) => typeof id === 'string' && pictureIds.has(id))
    ? [...code]
    : null;
}

function normalizeParent(parent) {
  return {
    pinHash: typeof parent?.pinHash === 'string' ? parent.pinHash : null,
    pinSalt: typeof parent?.pinSalt === 'string' ? parent.pinSalt : null,
    failCount: Number.isInteger(parent?.failCount) && parent.failCount >= 0 ? parent.failCount : 0,
    lockUntil: Number.isFinite(parent?.lockUntil) && parent.lockUntil > 0 ? parent.lockUntil : 0,
    resets: Array.isArray(parent?.resets) ? parent.resets.filter((time) => typeof time === 'string') : [],
  };
}

function normalizeProfileExtras(profile) {
  return {
    ...profile,
    pictureCode: normalizePictureCode(profile?.pictureCode),
    cq: normalizeCq(profile?.cq),
  };
}

export function load() {
  try {
    const state = JSON.parse(localStorage.getItem(KEY));
    const profiles = Array.isArray(state?.profiles) ? state.profiles.map(normalizeProfileExtras) : [];
    return { ...state, profiles, active: typeof state?.active === 'string' ? state.active : null, parent: normalizeParent(state?.parent) };
  } catch {
    return { profiles: [], active: null, parent: defaultParent() };
  }
}

function save(state) {
  localStorage.setItem(KEY, JSON.stringify({ ...state, parent: normalizeParent(state.parent) }));
}

const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local

export function getProfiles() {
  return load().profiles;
}

export function getActiveProfile() {
  const s = load();
  return s.profiles.find((p) => p.id === s.active) ?? null;
}

export function setActiveProfile(id) {
  const s = load();
  s.active = id;
  save(s);
}

function validPictureCode(code) {
  const valid = normalizePictureCode(code);
  if (!valid) throw new Error('picture code must contain three known pictures');
  return valid;
}

export function createProfile(name, avatar, mode, pictureCode = null) {
  const code = pictureCode === null ? null : validPictureCode(pictureCode);
  const s = load();
  const p = {
    id: globalThis.crypto.randomUUID(),
    name,
    avatar,
    mode, // 'sprout' (5-7) or 'explorer' (8-10)
    expert: false, // type every level instead of dragging blocks
    armor: 'starter', // equipped outfit id (see ui/hero.js)
    stars: {}, // levelId -> 1..3
    streak: { count: 0, last: null },
    pictureCode: code,
    cq: normalizeCq({ track: null }),
  };
  s.profiles.push(p);
  s.active = p.id;
  save(s);
  return p;
}

export function deleteProfile(id) {
  const s = load();
  s.profiles = s.profiles.filter((p) => p.id !== id);
  if (s.active === id) s.active = s.profiles[0]?.id ?? null;
  save(s);
}

export function setExpert(on) {
  const s = load();
  const p = s.profiles.find((x) => x.id === s.active);
  if (!p) return;
  p.expert = Boolean(on);
  save(s);
}

export function setArmor(id) {
  const s = load();
  const p = s.profiles.find((x) => x.id === s.active);
  if (!p) return;
  p.armor = id;
  save(s);
}

export function completeLevel(levelId, stars) {
  const s = load();
  const p = s.profiles.find((x) => x.id === s.active);
  if (!p) return;
  p.stars[levelId] = Math.max(p.stars[levelId] ?? 0, stars);
  const t = today();
  if (p.streak.last !== t) {
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
    p.streak.count = p.streak.last === yesterday ? p.streak.count + 1 : 1;
    p.streak.last = t;
  }
  save(s);
}

export function streakToday(p) {
  return p.streak.last === today();
}

export function setPictureCode(profileId, code) {
  const s = load();
  const p = s.profiles.find((profile) => profile.id === profileId);
  if (!p) throw new Error('profile not found');
  p.pictureCode = validPictureCode(code);
  save(s);
}

export function checkPictureCode(profileId, code) {
  const p = getProfiles().find((profile) => profile.id === profileId);
  const candidate = normalizePictureCode(code);
  return Boolean(p?.pictureCode && candidate && p.pictureCode.every((id, index) => id === candidate[index]));
}

export function clearPictureCode(profileId) {
  const s = load();
  const p = s.profiles.find((profile) => profile.id === profileId);
  if (!p) throw new Error('profile not found');
  p.pictureCode = null;
  save(s);
}

export function setTrack(profileId, track) {
  if (!['guided', 'standard', null].includes(track)) throw new Error('invalid Computer Quest track');
  const s = load();
  const p = s.profiles.find((profile) => profile.id === profileId);
  if (!p) throw new Error('profile not found');
  p.cq = normalizeCq({ ...p.cq, track });
  save(s);
}

export function getCq(profileId) {
  const p = getProfiles().find((profile) => profile.id === profileId);
  return p ? normalizeCq(p.cq) : null;
}

export function updateCq(profileId, mutator) {
  const s = load();
  const p = s.profiles.find((profile) => profile.id === profileId);
  if (!p) throw new Error('profile not found');
  const result = mutator(normalizeCq(p.cq));
  if (!result || typeof result !== 'object' || Array.isArray(result)
    || (Object.getPrototypeOf(result) !== Object.prototype && Object.getPrototypeOf(result) !== null)) {
    throw new Error('updateCq mutator must return a cq object');
  }
  const cq = normalizeCq(result);
  p.cq = cq;
  save(s);
  return cq;
}

function salt() {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hashPin(pin, pinSalt) {
  const data = new TextEncoder().encode(pinSalt + pin);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function validPin(pin) {
  if (!/^\d{4}$/.test(pin)) throw new Error('PIN must be exactly four digits');
}

export function hasParentPin() {
  const { pinHash, pinSalt } = load().parent;
  return Boolean(pinHash && pinSalt);
}

export async function setParentPin(pin) {
  validPin(pin);
  const s = load();
  const pinSalt = salt();
  s.parent = { ...s.parent, pinSalt, pinHash: await hashPin(pin, pinSalt), failCount: 0, lockUntil: 0 };
  save(s);
}

export async function checkParentPin(pin, now = Date.now()) {
  const s = load();
  const parent = s.parent;
  if (now < parent.lockUntil) return { ok: false, lockedMs: parent.lockUntil - now, triesLeft: 0 };
  if (!parent.pinHash || !parent.pinSalt) return { ok: false, lockedMs: 0, triesLeft: 5 - parent.failCount };
  const ok = /^\d{4}$/.test(pin) && await hashPin(pin, parent.pinSalt) === parent.pinHash;
  if (ok) {
    parent.failCount = 0;
    parent.lockUntil = 0;
  } else {
    parent.failCount += 1;
    if (parent.failCount >= 5) {
      parent.lockUntil = now + 60000;
      parent.failCount = 0;
    }
  }
  save(s);
  const lockedMs = ok ? 0 : Math.max(0, parent.lockUntil - now);
  return { ok, lockedMs, triesLeft: lockedMs ? 0 : 5 - parent.failCount };
}

export function resetParentPin(now = Date.now()) {
  const s = load();
  s.parent = { ...s.parent, pinHash: null, pinSalt: null, failCount: 0, lockUntil: 0,
    resets: [...s.parent.resets, new Date(now).toISOString()].slice(-10) };
  save(s);
}

export function recentPinResets(now = Date.now()) {
  const cutoff = now - 30 * 86400000;
  return load().parent.resets.filter((time) => {
    const resetAt = Date.parse(time);
    return Number.isFinite(resetAt) && resetAt >= cutoff && resetAt <= now;
  });
}

export function markUnlocked(id) {
  try { sessionStorage.setItem(UNLOCKED_KEY, id); } catch { /* unavailable storage */ }
}

export function isUnlocked(id) {
  try { return sessionStorage.getItem(UNLOCKED_KEY) === id; } catch { return false; }
}

export function clearUnlocked() {
  try { sessionStorage.removeItem(UNLOCKED_KEY); } catch { /* unavailable storage */ }
}

export function exportData() {
  return localStorage.getItem(KEY) ?? '{"profiles":[],"active":null}';
}

export function importData(json) {
  const parsed = JSON.parse(json); // throws on garbage — caller shows message
  if (!Array.isArray(parsed.profiles)) throw new Error('not a CodeQuest backup');
  const parent = load().parent; // PIN state belongs to this device, never a backup file.
  const profiles = parsed.profiles.map((p) => ({
    id: typeof p?.id === 'string' ? p.id : globalThis.crypto.randomUUID(),
    name: String(p?.name ?? 'Explorer').slice(0, 14),
    avatar: String(p?.avatar ?? '🦊').slice(0, 4),
    mode: p?.mode === 'sprout' ? 'sprout' : 'explorer',
    expert: Boolean(p?.expert),
    armor: typeof p?.armor === 'string' ? p.armor.slice(0, 20) : 'starter',
    stars: Object.fromEntries(
      Object.entries(p?.stars ?? {}).filter(([, value]) => Number.isInteger(value) && value >= 1 && value <= 3)
    ),
    streak: {
      count: Number.isInteger(p?.streak?.count) ? p.streak.count : 0,
      last: typeof p?.streak?.last === 'string' ? p.streak.last : null,
    },
    pictureCode: normalizePictureCode(p?.pictureCode),
    cq: normalizeCq(p?.cq),
  }));
  const active = profiles.some((p) => p.id === parsed.active) ? parsed.active : profiles[0]?.id ?? null;
  save({ profiles, active, parent });
}
