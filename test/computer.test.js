import assert from 'node:assert';

class MemoryStorage {
  #data = new Map();
  getItem(key) { return this.#data.has(key) ? this.#data.get(key) : null; }
  setItem(key, value) { this.#data.set(key, String(value)); }
  removeItem(key) { this.#data.delete(key); }
  clear() { this.#data.clear(); }
}

globalThis.localStorage = new MemoryStorage();
globalThis.sessionStorage = new MemoryStorage();

const progress = await import('../src/progress.js');
const {
  load, getProfiles, createProfile, setPictureCode, checkPictureCode, setTrack,
  setParentPin, hasParentPin, checkParentPin, resetParentPin, importData,
  recentPinResets, markUnlocked, isUnlocked, clearUnlocked,
} = progress;

// Legacy saves gain every new field without losing their original profile data.
localStorage.setItem('codequest-v1', JSON.stringify({
  profiles: [{ id: 'legacy', name: 'Old', avatar: '🦊', mode: 'explorer', stars: {}, streak: { count: 0, last: null } }],
  active: 'legacy',
}));
let state = load();
assert.deepStrictEqual(state.profiles[0].pictureCode, null);
assert.deepStrictEqual(state.profiles[0].cq, { track: null });
assert.deepStrictEqual(state.parent, { pinHash: null, pinSalt: null, failCount: 0, lockUntil: 0, resets: [] });

const kid = createProfile('Kid', '🤖', 'explorer', ['dragon', 'rocket', 'pizza']);
assert.deepStrictEqual(getProfiles().find((p) => p.id === kid.id).pictureCode, ['dragon', 'rocket', 'pizza']);
assert(checkPictureCode(kid.id, ['dragon', 'rocket', 'pizza']));
assert(!checkPictureCode(kid.id, ['pizza', 'rocket', 'dragon']));
assert(!checkPictureCode(kid.id, ['dragon', 'rocket', 'pizza', 'dragon']));
assert.throws(() => setPictureCode(kid.id, ['dragon', 'rocket']), /three known pictures/);
assert.throws(() => setPictureCode(kid.id, ['dragon', 'rocket', 'unicorn']), /three known pictures/);
assert.throws(() => setPictureCode(kid.id, 'dragon,rocket,pizza'), /three known pictures/);

setTrack(kid.id, 'guided');
assert.strictEqual(getProfiles().find((p) => p.id === kid.id).cq.track, 'guided');
setTrack(kid.id, null);
assert.strictEqual(getProfiles().find((p) => p.id === kid.id).cq.track, null);
assert.throws(() => setTrack(kid.id, 'fast'), /invalid Computer Quest track/);

for (const pin of ['123', 'abcd', '12345']) {
  await assert.rejects(() => setParentPin(pin), /exactly four digits/);
}
await setParentPin('2468');
assert(hasParentPin());
let result = await checkParentPin('0000', 1000);
assert.deepStrictEqual(result, { ok: false, lockedMs: 0, triesLeft: 4 });
assert.deepStrictEqual(await checkParentPin('2468', 1001), { ok: true, lockedMs: 0, triesLeft: 5 });

await setParentPin('2468');
const lockStart = 5000;
for (let attempt = 0; attempt < 3; attempt += 1) {
  assert.strictEqual((await checkParentPin('0000', lockStart + attempt)).ok, false);
}
result = await checkParentPin('0000', lockStart + 3);
assert.deepStrictEqual(result, { ok: false, lockedMs: 0, triesLeft: 1 });
assert.strictEqual((await checkParentPin('2468', lockStart + 4)).ok, true);

await setParentPin('2468');
for (let attempt = 0; attempt < 4; attempt += 1) {
  assert.strictEqual((await checkParentPin('0000', lockStart + 10 + attempt)).ok, false);
}
const locked = await checkParentPin('0000', lockStart + 14);
assert.strictEqual(locked.ok, false);
assert(locked.lockedMs >= 59999 && locked.lockedMs <= 60000);
assert.strictEqual(locked.triesLeft, 0);
assert.deepStrictEqual(await checkParentPin('2468', lockStart + 15), { ok: false, lockedMs: 59999, triesLeft: 0 });
assert.strictEqual((await checkParentPin('2468', lockStart + 60014)).ok, true);

await setParentPin('2468');
for (let attempt = 0; attempt < 3; attempt += 1) {
  await checkParentPin('0000', 8000 + attempt);
}
assert.strictEqual((await checkParentPin('2468', 8003)).ok, true);
assert.strictEqual(load().parent.failCount, 0);
for (let attempt = 0; attempt < 4; attempt += 1) {
  result = await checkParentPin('0000', 8004 + attempt);
}
assert.deepStrictEqual(result, { ok: false, lockedMs: 0, triesLeft: 1 });

resetParentPin(1234567890000);
state = load();
assert.strictEqual(state.parent.pinHash, null);
assert.deepStrictEqual(state.parent.resets, ['2009-02-13T23:31:30.000Z']);

const day = 86400000;
const resetBase = Date.UTC(2026, 0, 1);
for (let offset = 0; offset < 12; offset += 1) resetParentPin(resetBase + offset);
assert.strictEqual(load().parent.resets.length, 10);
assert.deepStrictEqual(load().parent.resets[0], new Date(resetBase + 2).toISOString());
const recentNow = Date.UTC(2026, 5, 30);
resetParentPin(recentNow - 31 * day);
resetParentPin(recentNow - day);
assert.deepStrictEqual(recentPinResets(recentNow), [new Date(recentNow - day).toISOString()]);

await setParentPin('1357');
importData(JSON.stringify({
  profiles: [{ id: 'imported', name: 'Imported', avatar: '🦊', pictureCode: ['nope'], cq: { track: 'wrong' } }],
  active: 'imported',
  parent: { pinHash: null },
}));
state = load();
assert.strictEqual(state.profiles[0].pictureCode, null);
assert.deepStrictEqual(state.profiles[0].cq, { track: null });
assert.strictEqual((await checkParentPin('1357')).ok, true);

markUnlocked('imported');
assert(isUnlocked('imported'));
assert(!isUnlocked('other'));
clearUnlocked();
assert(!isUnlocked('imported'));

console.log('ok — Computer Quest storage migration, picture codes, parent PIN, tracks, import, and session unlock pass');
