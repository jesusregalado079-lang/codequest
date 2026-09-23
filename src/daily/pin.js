// Parent PIN gate for the dedicated Daily Work page — same hashing/lockout logic as src/progress.js
// (salted SHA-256, 5-try lockout, 60s cooldown, last-10-resets log), copied rather than imported
// since progress.js is hardwired to the shared codequest-v1 store. Kept in lockstep with that file
// on purpose: any future change to the lockout rules there should be mirrored here by hand.
import { load } from './store.js';

const UNLOCK_MS = 60 * 60 * 1000;

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

export function hasParentPin(store = load()) {
  const { pinHash, pinSalt } = store.parent;
  return Boolean(pinHash && pinSalt);
}

export function parentUnlocked(store, now = Date.now()) {
  const until = store.parent.unlockedUntil;
  return Number.isFinite(until) && until > 0 && now < until;
}

export function lockParent(store) {
  return { ...store, parent: { ...store.parent, unlockedUntil: 0 } };
}

export async function setParentPin(store, pin, now = Date.now()) {
  validPin(pin);
  const pinSalt = salt();
  return { ...store, parent: { ...store.parent, pinSalt, pinHash: await hashPin(pin, pinSalt), failCount: 0, lockUntil: 0, unlockedUntil: now + UNLOCK_MS } };
}

export async function checkParentPin(store, pin, now = Date.now()) {
  const parent = store.parent;
  if (now < parent.lockUntil) return { store, ok: false, lockedMs: parent.lockUntil - now, triesLeft: 0 };
  if (!parent.pinHash || !parent.pinSalt) return { store, ok: false, lockedMs: 0, triesLeft: 5 - parent.failCount };
  const ok = /^\d{4}$/.test(pin) && await hashPin(pin, parent.pinSalt) === parent.pinHash;
  const nextParent = { ...parent };
  if (ok) {
    nextParent.failCount = 0;
    nextParent.lockUntil = 0;
    nextParent.unlockedUntil = now + UNLOCK_MS;
  } else {
    nextParent.failCount += 1;
    if (nextParent.failCount >= 5) {
      nextParent.lockUntil = now + 60000;
      nextParent.failCount = 0;
    }
  }
  const lockedMs = ok ? 0 : Math.max(0, nextParent.lockUntil - now);
  return { store: { ...store, parent: nextParent }, ok, lockedMs, triesLeft: lockedMs ? 0 : 5 - nextParent.failCount };
}

export function resetParentPin(store, now = Date.now()) {
  return { ...store, parent: { ...store.parent, pinHash: null, pinSalt: null, failCount: 0, lockUntil: 0, unlockedUntil: 0,
    resets: [...store.parent.resets, new Date(now).toISOString()].slice(-10) } };
}

export function recentPinResets(store, now = Date.now()) {
  const cutoff = now - 30 * 86400000;
  return store.parent.resets.filter((time) => {
    const resetAt = Date.parse(time);
    return Number.isFinite(resetAt) && resetAt >= cutoff && resetAt <= now;
  });
}
