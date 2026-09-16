// Computer Quest horde battle: pure view helpers (no DOM, no canvas). Tested in test/cq-battle-ui.test.js.
import { getItem } from '../character.js';
import { ARENA } from './content.js';
import { meleeStats, STONE_COOLDOWN } from './engine.js';

export const MAX_CSS_WIDTH = 960;
export const ASPECT = 3 / 5; // height / width

// Fit the 20 x 12 tile arena into a container. Integer tile size in device pixels whenever the
// canvas is at least 20 device pixels wide; the arena is centered in any leftover pixels.
export function fitView(containerCssWidth, devicePixelRatio) {
  const dpr = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;
  const available = Number.isFinite(containerCssWidth) && containerCssWidth > 0 ? containerCssWidth : MAX_CSS_WIDTH;
  const cssWidth = Math.max(1, Math.floor(Math.min(MAX_CSS_WIDTH, available)));
  const cssHeight = Math.max(1, Math.round(cssWidth * ASPECT));
  const widthPx = Math.max(1, Math.round(cssWidth * dpr));
  const heightPx = Math.max(1, Math.round(cssHeight * dpr));
  const exact = Math.min(widthPx / ARENA.width, heightPx / ARENA.height);
  const tile = exact >= 1 ? Math.floor(exact) : exact;
  const offsetX = Math.floor((widthPx - tile * ARENA.width) / 2);
  const offsetY = Math.floor((heightPx - tile * ARENA.height) / 2);
  return { cssWidth, cssHeight, widthPx, heightPx, tile, offsetX, offsetY };
}

// KeyboardEvent.code -> engine input name. Escape is the pause toggle.
export const KEY_CODES = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  Space: 'attack', ShiftLeft: 'block', ShiftRight: 'block',
  KeyE: 'ability', KeyQ: 'stance', KeyR: 'undo',
  Digit1: 'apple', Numpad1: 'apple', Digit2: 'stone', Numpad2: 'stone',
  Escape: 'pause',
};
// Fallback for browsers that leave `code` empty.
const KEY_NAMES = {
  ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down',
  ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right',
  ' ': 'attack', Spacebar: 'attack', Shift: 'block', e: 'ability', E: 'ability', q: 'stance', Q: 'stance',
  r: 'undo', R: 'undo', 1: 'apple', 2: 'stone', Escape: 'pause', Esc: 'pause',
};
const own = (object, key) => typeof key === 'string' && Object.prototype.hasOwnProperty.call(object, key);

// True when a key event's target is a focusable control OUTSIDE the battle root that handles its
// own activation (e.g. the "← Quests" button), so Space/Enter must reach it instead of the game.
const INTERACTIVE = 'button, a[href], input, select, textarea, summary, [contenteditable=""], [contenteditable="true"], [role="button"], [role="link"]';
export function isInteractiveOutside(target, root) {
  if (!target || typeof target.closest !== 'function') return false;
  if (root && typeof root.contains === 'function' && root.contains(target)) return false;
  return Boolean(target.closest(INTERACTIVE));
}

// The engine input a key event maps to, or null. Ctrl/Alt/Meta combos are never the game's, and
// neither is a key aimed at an interactive control outside the battle (interactiveOutside = true).
export function keyAction(event, interactiveOutside) {
  if (!event || event.ctrlKey || event.altKey || event.metaKey || interactiveOutside) return null;
  if (event.code) return own(KEY_CODES, event.code) ? KEY_CODES[event.code] : null;
  return own(KEY_NAMES, event.key) ? KEY_NAMES[event.key] : null;
}
export const shouldPreventDefault = (event) => keyAction(event) !== null;
// Stable id for the held-keys map (code, or the key name when code is missing).
export const keyId = (event) => (event.code ? event.code : `key:${event.key}`);

export const INPUT_NAMES = ['up', 'down', 'left', 'right', 'attack', 'block', 'ability', 'stance', 'undo', 'apple', 'stone', 'pause'];
export function blankInput() {
  const input = {};
  INPUT_NAMES.forEach((name) => { input[name] = false; });
  return input;
}

// Shown on every how-to card, under the key list.
export const HOWTO_TIP = 'Tip: face a monster, then press Space.';

// How-to card lines: move + attack always, then only keys for equipped gear.
export function howToKeys(gear) {
  const g = gear || {};
  const lines = [
    { keys: 'Arrows / WASD', text: 'Move' },
    { keys: 'Space', text: 'Attack' },
  ];
  if (g.sword) lines.push({ keys: 'Q', text: 'Switch quick / wide swing' });
  if (g.shield) lines.push({ keys: 'Shift', text: 'Hold to block' });
  if (g.staff) lines.push({ keys: 'E', text: 'Fire twin crystal bolts' });
  else if (g.rune) lines.push({ keys: 'E', text: 'Turn a nearby monster into a chicken' });
  if (g.amulet) lines.push({ keys: 'R', text: 'Rewind 3 seconds (once)' });
  if (g.backpack) lines.push({ keys: '1', text: 'Eat your apple: +2 hearts (once)' });
  if (g.stone) lines.push({ keys: '2', text: 'Move your Save Stone here' });
  return lines;
}

// Bottom HUD slots, only for gear actually equipped. icon: item id, or 'fist' / 'apple' (drawn in render.js).
export function hudSlots(gear) {
  const g = gear || {};
  const slots = [];
  const weapon = g.melee ? getItem(g.melee) : null;
  slots.push({ id: 'weapon', key: 'Space', icon: weapon ? weapon.id : 'fist', label: weapon ? weapon.name : 'Fist' });
  if (g.sword) slots.push({ id: 'stance', key: 'Q', icon: null, label: 'Stance' });
  if (g.shield) slots.push({ id: 'shield', key: 'Shift', icon: 'stop-sign-shield', label: 'Shield' });
  if (g.staff) slots.push({ id: 'staff', key: 'E', icon: 'copy-crystal-staff', label: 'Crystal bolts' });
  else if (g.rune) slots.push({ id: 'rune', key: 'E', icon: 'rename-rune', label: 'Rename Rune' });
  if (g.amulet) slots.push({ id: 'amulet', key: 'R', icon: 'undo-amulet', label: 'Undo Amulet' });
  if (g.backpack) slots.push({ id: 'apple', key: '1', icon: 'apple', label: 'Apple' });
  if (g.stone) slots.push({ id: 'stone', key: '2', icon: 'save-stone', label: 'Save Stone' });
  return slots;
}

// Share of a cooldown still to wait, 0 (ready) .. 1 (just used).
export function cooldownFraction(readyAt, total, time) {
  if (!(total > 0) || !Number.isFinite(readyAt) || !Number.isFinite(time)) return 0;
  return Math.max(0, Math.min(1, (readyAt - time) / total));
}

const RUNE_COOLDOWN = getItem('rename-rune').battle.cooldown;
const STAFF_COOLDOWN = getItem('copy-crystal-staff').battle.cooldown;

// Live status of one HUD slot: { fraction, used, active, text }.
export function slotStatus(state, slotId) {
  const hero = state.hero;
  const time = state.time;
  const out = { fraction: 0, used: false, active: false, text: '' };
  if (slotId === 'weapon') out.fraction = cooldownFraction(hero.attackCooldownUntil, meleeStats(state.gear, hero.stance).cooldown, time);
  else if (slotId === 'stance') out.text = hero.stance === 'wide' ? 'WIDE' : 'QUICK';
  else if (slotId === 'shield') out.active = Boolean(hero.blocking);
  else if (slotId === 'staff') out.fraction = cooldownFraction(state.cooldowns.staff, STAFF_COOLDOWN, time);
  else if (slotId === 'rune') out.fraction = cooldownFraction(state.cooldowns.rune, RUNE_COOLDOWN, time);
  else if (slotId === 'amulet') out.used = Boolean(hero.amuletUsed);
  else if (slotId === 'apple') out.used = !hero.apple;
  else if (slotId === 'stone') {
    out.used = !hero.stone || Boolean(hero.stone.used);
    out.fraction = out.used ? 0 : cooldownFraction(state.cooldowns.stone, STONE_COOLDOWN, time);
  }
  return out;
}

// HUD / banner wave label, e.g. "Wave 2 / 5". The total comes from the battle's plan.
export function waveLabel(wave, total) {
  const t = Math.max(1, Math.floor(Number(total)) || 1);
  const w = Math.max(1, Math.min(t, Math.floor(Number(wave)) || 1));
  return `Wave ${w} / ${t}`;
}

// Wave banner. Waves 2..N start with the wave-clear bonus (healed = hearts actually gained).
export function waveBanner(wave, total, healed) {
  const label = waveLabel(wave, total);
  if (!(Number(wave) > 1)) return label;
  return `Wave cleared!${healed > 0 ? ' +❤️' : ''} · ${label}`;
}

// How long the end banner ("Victory!" etc.) stays before the results screen. Purely visual:
// the result is handed over (and recorded) the moment the engine ends.
export function endBannerMs(reducedMotion) {
  return reducedMotion ? 700 : 1300;
}

// Wraps onDone so it runs at most once, whichever path gets there first (end, skip, ...).
export function doneOnce(onDone) {
  let called = false;
  return {
    call(result) {
      if (called) return false;
      called = true;
      if (typeof onDone === 'function') onDone(result);
      return true;
    },
    get called() { return called; },
  };
}

// Countdown clock: whole seconds rounded up, so 0:00 only shows at the very end.
export function formatClock(seconds) {
  const s = Math.max(0, Math.ceil(Number(seconds) - 1e-9) || 0);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
export function formatPlayed(ms) {
  const s = Math.max(0, Math.round((Number(ms) || 0) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export const RESULT_HEADLINES = {
  victory: 'Victory!',
  time: 'Time! The chest is safe.',
  fell: 'The monsters ran off! Your chest is still safe.',
};

// Results card text for a finished (not skipped) battle.
export function resultsView(result, gems) {
  const r = result || {};
  const n = Number.isFinite(gems) ? Math.max(0, Math.floor(gems)) : 0;
  return {
    headline: own(RESULT_HEADLINES, r.outcome) ? RESULT_HEADLINES[r.outcome] : RESULT_HEADLINES.time,
    gemsText: `+${n} 💎`,
    poofs: Number.isFinite(r.poofs) ? r.poofs : 0,
    played: formatPlayed(r.ms),
    hearts: Number.isFinite(r.hearts) ? r.hearts : null,
    maxHearts: Number.isFinite(r.maxHearts) ? r.maxHearts : null,
  };
}
