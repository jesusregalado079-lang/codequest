// The iPad page's "Forgot PIN?" used to tell the grown-up to reset the PIN from the iPad's Settings, which does not
// exist, so a forgotten PIN could not be reset. Now: Forgot PIN? -> type RESET MY PIN -> choose a new PIN. Only the
// PIN and any lockout are cleared (answers are untouched) and the reset is shown at the top of Parent Mode.
import assert from 'node:assert/strict';
import fs from 'node:fs';

const memory = new Map();
globalThis.localStorage = {
  getItem: (key) => (memory.has(key) ? memory.get(key) : null),
  setItem: (key, value) => { memory.set(key, String(value)); },
  removeItem: (key) => { memory.delete(key); },
};
const pin = await import('../src/daily/pin.js');
const { emptyStore } = await import('../src/daily/store.js');
const { renderParent, createParentState, RESET_PHRASE } = await import('../src/daily/parent-view.js');

const NOW = Date.parse('2026-10-06T18:00:00Z');
let store = { ...emptyStore(), track: 'guided' };
store.dailyWork = { weeks: { 'week-13': { days: { monday: { sheets: { 'tithe-stories': { items: { owen: { value: 2.79, status: 'answered', checkedAt: null } } } }, submittedAt: null } } } } };
store = await pin.setParentPin(store, '1234', NOW - 7200000);
assert.equal(pin.hasParentPin(store), true);
// a kid mashes wrong PINs until the 1-minute lockout
for (let i = 0; i < 5; i += 1) store = (await pin.checkParentPin(store, '0000', NOW)).store;
assert.ok(store.parent.lockUntil > NOW, 'locked out');
assert.equal((await pin.checkParentPin(store, '1234', NOW + 1000)).ok, false, 'even the right PIN waits out the lockout');

// the reset
const reset = pin.resetParentPin(store, NOW);
assert.equal(pin.hasParentPin(reset), false, 'the PIN is cleared');
assert.equal(reset.parent.lockUntil, 0, 'and so is the lockout');
assert.equal(reset.parent.failCount, 0);
assert.equal(reset.parent.unlockedUntil, 0, 'and the grown-up must choose a new PIN to get in');
assert.deepEqual(reset.dailyWork, store.dailyWork, 'answers are untouched');
assert.deepEqual(reset.parent.resets, [new Date(NOW).toISOString()], 'the reset is logged');
assert.equal(pin.recentPinResets(reset, NOW + 3600000).length, 1);
assert.equal(pin.recentPinResets(reset, NOW + 31 * 86400000).length, 0, 'the notice fades after 30 days');
assert.equal(pin.resetParentPin(pin.resetParentPin(reset, NOW + 1), NOW + 2).parent.resets.length, 3);
let fresh = await pin.setParentPin(reset, '5678', NOW + 5000);
assert.equal(pin.parentUnlocked(fresh, NOW + 6000), true, 'choosing a new PIN opens Parent Mode');
assert.equal((await pin.checkParentPin(fresh, '1234', NOW + 7000)).ok, false, 'the old PIN no longer works');
assert.equal((await pin.checkParentPin(fresh, '5678', NOW + 7000)).ok, true);

// the screens
const state = createParentState();
assert.equal(state.resetting, false);
let html = renderParent(store, state, '2026-10-06', NOW);
assert.ok(html.includes('data-action="daily-parent-forgot"') && html.includes('Grown-ups only'), 'the PIN screen offers Forgot PIN?');
state.resetting = true;
html = renderParent(store, state, '2026-10-06', NOW);
assert.ok(html.includes('Reset grown-up PIN') && html.includes(RESET_PHRASE), 'the reset screen names the phrase');
assert.equal(RESET_PHRASE, 'RESET MY PIN');
assert.ok(html.includes('data-action="daily-parent-reset"') && html.includes('data-action="daily-parent-reset-back"') && html.includes('data-parent-pin="phrase"'));
assert.ok(html.includes('Nothing the boys did is lost') && html.includes('shown at the top of Parent Mode'));
assert.ok(!html.includes('Settings'), 'no more advice that points at a Settings screen that does not exist');
// after the reset the gate asks for a NEW pin, and once chosen the page tells the grown-up the PIN was reset
state.resetting = false;
html = renderParent(reset, state, '2026-10-06', NOW + 60000);
assert.ok(html.includes('Set a grown-up PIN'), 'no PIN yet: choose one');
const inside = renderParent(fresh, createParentState(), '2026-10-06', NOW + 6000);
assert.ok(inside.includes('cqd-pin-notice') && inside.includes('The grown-up PIN was reset on'), 'Parent Mode shows the reset');
const clean = JSON.parse(JSON.stringify({ ...emptyStore(), track: 'guided' }));
clean.parent.unlockedUntil = NOW + 3600000;
assert.ok(!renderParent(clean, createParentState(), '2026-10-06', NOW).includes('cqd-pin-notice'), 'no notice when nothing was reset');

// the app wires every action the screens draw
const app = fs.readFileSync(new URL('../src/daily/app.js', import.meta.url), 'utf8');
['daily-parent-forgot', 'daily-parent-reset', 'daily-parent-reset-back'].forEach((action) => assert.ok(app.includes(`'${action}'`), `app.js handles ${action}`));
assert.ok(!app.includes('from this iPad’s Settings'), 'the old dead-end message is gone');

// the PC hub: the lock screen and the player picker each have a way to the grown-ups
const menu = fs.readFileSync(new URL('../src/ui/menu.js', import.meta.url), 'utf8');
assert.ok(menu.includes('id="forgot-code"') && menu.includes('showCodeReset'), 'the picture-code screen has a grown-up path');
assert.ok(menu.includes('id="grownups-picker"'), 'the player picker has a For grown-ups button');
assert.ok(menu.includes('clearPictureCode(profile.id)'), 'resetting a code clears only that player\'s code');

console.log('ok — pin reset: Forgot PIN? works on the iPad page (typed phrase, logged, shown in Parent Mode, answers untouched), and the PC hub lock screen has a grown-up reset');
