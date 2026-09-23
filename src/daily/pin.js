// Parent PIN gate for the dedicated Daily Work page — same hashing/lockout logic as src/progress.js
// (salted SHA-256, 5-try lockout, 60s cooldown, last-10-resets log), copied rather than imported
// since progress.js is hardwired to the shared codequest-v1 store. Kept in lockstep with that file
// on purpose: any future change to the lockout rules there should be mirrored here by hand.
import { load, save } from './store.js';

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
