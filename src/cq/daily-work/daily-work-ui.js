import { DAILY_WORK } from './content.js';
import { currentWeek, weekdayKey } from './schedule.js';

// Only setItem() below ever WRITES an item's status, and it only ever writes 'unanswered' or
// 'answered' — 'correct'/'wrong' are read-only here (locking an item, deciding the day's state).
// The kid-tab has no code path that can mark anything right or wrong; that stays parent-only.
export const OK_STATUS = 'correct';
export const FIX_STATUS = 'wrong';
const esc = (value) => String(value).replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
const clone = (value) => JSON.parse(JSON.stringify(value || { weeks: {} }));

// Coins: display order is ascending value (pennies first), regardless of the order a week's
// author listed them in item.coinSet. 99 per denomination matches the clamp in state.js, so a
// tapped count always survives a save/normalize round trip unchanged.
const COIN_ORDER = ['penny', 'nickel', 'dime', 'quarter', 'dollar-bill'];
const COIN_CENTS = { penny: 1, nickel: 5, dime: 10, quarter: 25, 'dollar-bill': 100 };
const COIN_NAMES = { penny: 'Penny', nickel: 'Nickel', dime: 'Dime', quarter: 'Quarter', 'dollar-bill': 'Dollar bill' };
const COIN_PLURALS = { penny: 'pennies', nickel: 'nickels', dime: 'dimes', quarter: 'quarters', 'dollar-bill': 'dollar bills' };
const MAX_PER_DENOM = 99;

const isDenom = (denom) => Object.prototype.hasOwnProperty.call(COIN_CENTS, denom);
const faceValue = (denom) => (COIN_CENTS[denom] < 100 ? `${COIN_CENTS[denom]}¢` : '$1');
// Screen readers say "¢" unpredictably, so aria-labels spell the value out instead.
const spokenValue = (denom) => (COIN_CENTS[denom] < 100 ? `${COIN_CENTS[denom]} cents` : '1 dollar');

export function money(cents) {
  const whole = Math.max(0, Math.round(cents));
  return `$${Math.floor(whole / 100)}.${String(whole % 100).padStart(2, '0')}`;
}

// Reads a stored coin value (or a content-authored pile) into a clean counts object. Only the five
// known denominations are ever read, so a tampered save can never inject keys.
export function coinCounts(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const counts = {};
  COIN_ORDER.forEach((denom) => {
    const count = source[denom];
    if (typeof count === 'number' && Number.isInteger(count) && count > 0) counts[denom] = Math.min(MAX_PER_DENOM, count);
  });
  return counts;
}

export function coinTotal(counts) {
  return COIN_ORDER.reduce((sum, denom) => sum + (counts[denom] || 0) * COIN_CENTS[denom], 0);
}

function coinPhrase(denom, count) {
  return `${count} ${count === 1 ? COIN_NAMES[denom].toLowerCase() : COIN_PLURALS[denom]}`;
}

export function coinSummary(counts) {
  const parts = COIN_ORDER.filter((denom) => counts[denom]).map((denom) => coinPhrase(denom, counts[denom]));
  return parts.length ? `${parts.join(', ')} · ${money(coinTotal(counts))}` : 'No coins yet';
}

function denomsFor(item) {
  const set = Array.isArray(item.coinSet) ? item.coinSet : [];
  const picked = COIN_ORDER.filter((denom) => set.indexOf(denom) >= 0);
  return picked.length ? picked : COIN_ORDER.slice(0, 4);
}

function localToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function sheetsFor(week, day) {
  return [...(week.weekItems || []), ...(day.sheets || [])];
}

export function storedDay(cq, weekId, dayKey) {
  return (((cq.dailyWork || {}).weeks || {})[weekId] || {}).days
    ? (((cq.dailyWork || {}).weeks || {})[weekId].days[dayKey] || { sheets: {}, submittedAt: null })
    : { sheets: {}, submittedAt: null };
}

export function storedItem(dayState, sheetId, itemId) {
  return (((dayState.sheets || {})[sheetId] || {}).items || {})[itemId]
    || { value: null, status: 'unanswered', checkedAt: null };
}

export function allItems(sheets) {
  return sheets.reduce((items, sheet) => items.concat(sheet.items || []), []);
}

export function isComplete(dayState, sheets) {
  // coin-total items are real now (the tap-to-count interactive) and are graded the same as
  // anything else once parent mode marks them — no more exclusion needed here.
  const items = allItems(sheets);
  return items.length > 0 && items.every((item) => storedItem(dayState, item.sheetId, item.id).status === OK_STATUS);
}

export function hasFixes(dayState, sheets) {
  return allItems(sheets).some((item) => storedItem(dayState, item.sheetId, item.id).status === FIX_STATUS);
}

export function itemWithSheet(sheet) {
  return (sheet.items || []).map((item) => ({ ...item, sheetId: sheet.id }));
}

export function ready(dayState, sheets) {
  // Coin items count toward "ready" too: tapping at least one coin sets a non-null value (see
  // updateDailyWork's daily-coin-* handling), same signal as any other item kind.
  return allItems(sheets).every((item) => storedItem(dayState, item.sheetId, item.id).value !== null);
}

export function displayValue(value) {
  if (Array.isArray(value)) return value.filter((entry) => entry !== null).join(' · ');
  if (value === null || value === undefined || value === '') return 'No answer yet';
  return String(value);
}

function itemData(week, dayKey, sheet, item) {
  return `data-week="${esc(week.id)}" data-day="${esc(dayKey)}" data-sheet="${esc(sheet.id)}" data-item="${esc(item.id)}"`;
}

function lockedItem(item, state) {
  const text = item.kind === 'coin-total' && state.value && typeof state.value === 'object'
    ? coinSummary(coinCounts(state.value)) : displayValue(state.value);
  return `<div class="cq-dw-locked"><span>${esc(text)}</span></div>`;
}

function blankValues(item, value) {
  const count = Array.isArray(item.answer) ? item.answer.length : 1;
  const saved = Array.isArray(value) ? value : [];
  return Array.from({ length: count }, (_, index) => typeof saved[index] === 'string' ? saved[index] : null);
}

// The tray: one add button per denomination, plus a "−" beside any denomination already tapped.
// Nothing here looks at item.targetCents — the tray is purely a picture of what the kid has tapped.
function coinTray(data, idBase, item, counts) {
  return denomsFor(item).map((denom) => {
    const count = counts[denom] || 0;
    const name = COIN_NAMES[denom];
    const addLabel = `${name}, ${spokenValue(denom)}, tap to add one${count ? `, ${coinPhrase(denom, count)} so far` : ''}`;
    const add = `<button type="button" class="cq-dw-coin-add" data-action="daily-coin-add" data-denom="${denom}" data-id="${esc(idBase)}-${denom}" aria-label="${esc(addLabel)}" ${data}><span class="cq-dw-coin-face" data-denom="${denom}" aria-hidden="true">${faceValue(denom)}</span><span class="cq-dw-coin-name">${esc(name)}</span><span class="cq-dw-coin-count">${count ? `×${count}` : ''}</span></button>`;
    const remove = count > 0
      ? `<button type="button" class="cq-dw-coin-minus" data-action="daily-coin-remove" data-denom="${denom}" data-id="${esc(idBase)}-${denom}-minus" aria-label="${esc(`Take one ${name.toLowerCase()} back, ${coinPhrase(denom, count)} so far`)}" ${data}>−</button>`
      : '';
    return `<div class="cq-dw-coin-row">${add}${remove}</div>`;
  }).join('');
}

// Count-the-pile mode: the coins are fixed by the author, so there is nothing to tap — just show
// them and take a typed total through the same numeric input path every other number item uses.
function coinPile(data, item, state) {
  const pile = coinCounts(item.pile);
  const value = state.value === null || state.value === undefined ? '' : String(state.value);
  const rows = COIN_ORDER.filter((denom) => pile[denom]).map((denom) => `<li><span class="cq-dw-coin-face" data-denom="${denom}" aria-hidden="true">${faceValue(denom)}</span><span>${esc(coinPhrase(denom, pile[denom]))}</span></li>`).join('');
  return `<li class="cq-dw-item cq-dw-coin"><p>${esc(item.prompt)}</p><ul class="cq-dw-pile" aria-label="The coins you have">${rows}</ul><label><span>How much is that in all?</span><input class="cq-dw-input" type="text" inputmode="decimal" value="${esc(value)}" data-action="daily-input" ${data}></label></li>`;
}

function coinItem(week, dayKey, sheet, item, state) {
  const data = itemData(week, dayKey, sheet, item);
  if (item.pile) return coinPile(data, item, state);
  const idBase = `${sheet.id}-${item.id}`;
  const counts = coinCounts(state.value);
  const tapped = COIN_ORDER.some((denom) => counts[denom]);
  // The running total is a mirror of the kid's own taps. It is never measured against
  // item.targetCents here or anywhere else in this file: nothing in the markup below changes
  // shape, class, colour or wording when the two happen to be equal. Deciding whether an answer
  // is right stays a parent job (§5).
  const target = typeof item.targetCents === 'number'
    ? `<p class="cq-dw-coin-target">Try to make: ${money(item.targetCents)}</p>` : '';
  // data-item on the <li> itself (every other item kind only puts it on interactive controls) so a
  // post-render lookup can find *this* item's total after a coin tap — the tapped button and every
  // element from before the render are gone once render() replaces the DOM, so nothing at click
  // time can be held onto; only an attribute that survives into the fresh markup works.
  return `<li class="cq-dw-item cq-dw-coin" data-item="${esc(item.id)}"><p>${esc(item.prompt)}</p>${target}<div class="cq-dw-tray">${coinTray(data, idBase, item, counts)}</div><p class="cq-dw-coin-total" aria-live="polite">Your total: <strong>${money(coinTotal(counts))}</strong></p><div class="cq-dw-coin-tools"><button type="button" class="cq-button cq-dw-coin-clear" data-action="daily-coin-clear" data-id="${esc(idBase)}-clear" ${data} ${tapped ? '' : 'disabled'}>Clear coins</button></div></li>`;
}

function renderItem(week, dayKey, sheet, item, state, locked) {
  const data = itemData(week, dayKey, sheet, item);
  if (locked) return `<li class="cq-dw-item cq-dw-item-locked"><p>${esc(item.prompt)}</p>${lockedItem(item, state)}</li>`;
  if (item.kind === 'coin-total') return coinItem(week, dayKey, sheet, item, state);
  if (item.kind === 'fill-blank') {
    const blanks = blankValues(item, state.value);
    return `<li class="cq-dw-item"><p>${esc(item.prompt)}</p><div class="cq-dw-blanks" aria-label="Your word choices">${blanks.map((word, index) => `<button type="button" class="cq-dw-blank" data-action="daily-blank" data-index="${index}" ${data}>${word ? esc(word) : 'Blank'}</button>`).join('')}</div><div class="cq-options cq-dw-bank" aria-label="Word bank">${(item.wordBank || []).map((word) => `<button type="button" class="cq-chip" data-action="daily-word" data-word="${esc(word)}" ${data}>${esc(word)}</button>`).join('')}</div></li>`;
  }
  if (item.kind === 'scale') {
    return `<li class="cq-dw-item"><p>${esc(item.prompt)}</p><div class="cq-options cq-dw-scale" aria-label="Choose a number">${Array.from({ length: item.scaleMax || 0 }, (_, index) => { const value = index + 1; return `<button type="button" class="cq-chip" data-action="daily-scale" data-value="${value}" aria-pressed="${state.value === value}" ${data}>${value}</button>`; }).join('')}</div></li>`;
  }
  const value = state.value === null || state.value === undefined ? '' : String(state.value);
  const long = item.kind === 'long-text';
  const control = long
    ? `<textarea class="cq-dw-input" rows="4" data-action="daily-input" ${data}>${esc(value)}</textarea>`
    : `<input class="cq-dw-input" type="text" ${item.kind === 'numeric' ? 'inputmode="decimal"' : ''} value="${esc(value)}" data-action="daily-input" ${data}>`;
  return `<li class="cq-dw-item"><label><span>${esc(item.prompt)}</span>${control}</label></li>`;
}

function renderSheet(week, dayKey, sheet, dayState, reopened) {
  return `<article class="cq-dw-sheet"><h3>${esc(sheet.title)}</h3>${sheet.intro ? `<p class="cq-dw-intro">${esc(sheet.intro)}</p>` : ''}${sheet.example ? `<p class="cq-dw-example"><strong>Worked example:</strong> ${esc(sheet.example)}</p>` : ''}${sheet.citation ? `<p class="cq-muted">${esc(sheet.citation)}</p>` : ''}<ol class="cq-dw-items">${(sheet.items || []).map((item) => { const state = storedItem(dayState, sheet.id, item.id); return renderItem(week, dayKey, sheet, item, state, state.status === OK_STATUS && reopened); }).join('')}</ol></article>`;
}

function view(content, cq, todayIso) {
  const week = currentWeek(content, cq.track, todayIso);
  const dayKey = weekdayKey(todayIso);
  if (!week) return { html: '<section class="cq-dw-empty"><h2>No Daily Work yet</h2><p>Check back with a grown-up when this week is ready.</p></section>', week: null, dayKey: null };
  if (!dayKey || dayKey === 'saturday' || dayKey === 'sunday') return { html: '<section class="cq-dw-empty"><h2>No Daily Work today</h2><p>Enjoy your weekend. We will be ready for you on the next school day.</p></section>', week, dayKey: null };
  const day = week.days[dayKey];
  if (!day) return { html: '<section class="cq-dw-empty"><h2>No Daily Work today</h2><p>You are all set for today.</p></section>', week, dayKey };
  const sheets = sheetsFor(week, day).map((sheet) => ({ ...sheet, items: itemWithSheet(sheet) }));
  const dayState = storedDay(cq, week.id, dayKey);
  const completed = isComplete(dayState, sheets);
  const reopened = hasFixes(dayState, sheets);
  if (dayState.submittedAt && completed) return { html: '<section class="cq-dw-empty cq-dw-finished"><h2>All done, great job!</h2><p>Your parent checked everything for today.</p></section>', week, dayKey };
  if (dayState.submittedAt && !reopened) return { html: '<section class="cq-dw-empty"><h2>Nice work!</h2><p>Waiting for a parent to check it.</p></section>', week, dayKey };
  return { html: `<section class="cq-daily-work"><div class="cq-section-head"><div><span class="cq-eyebrow">${esc(week.label.toUpperCase())} · ${esc(dayKey.toUpperCase())}</span><h2>Daily Work</h2></div></div>${reopened ? '<p class="cq-dw-reopen">A parent sent back a few answers to fix. Your finished answers are locked.</p>' : ''}${sheets.map((sheet) => renderSheet(week, dayKey, sheet, dayState, reopened)).join('')}<div class="cq-actions"><button type="button" class="cq-button cq-primary" data-action="daily-submit" data-week="${esc(week.id)}" data-day="${esc(dayKey)}" ${ready(dayState, sheets) ? '' : 'disabled'}>I’m done — go get a parent!</button></div></section>`, week, dayKey };
}

export function dailyWorkHtml(cq, options = {}) {
  return view(options.content || DAILY_WORK, cq, options.todayIso || localToday()).html;
}

export function dailyWorkReady(cq, options = {}) {
  const result = view(options.content || DAILY_WORK, cq, options.todayIso || localToday());
  if (!result.week || !result.dayKey) return false;
  const day = result.week.days[result.dayKey];
  const sheets = sheetsFor(result.week, day).map((sheet) => ({ ...sheet, items: itemWithSheet(sheet) }));
  return ready(storedDay(cq, result.week.id, result.dayKey), sheets);
}

export function sanitizeNumeric(value) {
  const raw = String(value).trim();
  if (!raw) return null;
  const clean = raw.replace(/^\$/, '').replace(/%$/, '').replace(/¢$/, '').replace(/,/g, '').trim();
  const numeric = Number(clean);
  return clean && Number.isFinite(numeric) ? numeric : raw;
}

function valueForInput(kind, value) {
  // A count-the-pile coin item is answered by typing one total, exactly like a numeric item.
  if (kind === 'numeric' || kind === 'coin-total') return sanitizeNumeric(value);
  const text = String(value);
  return text === '' ? null : text;
}

function setItem(cq, data, value) {
  const next = clone(cq.dailyWork);
  const weeks = next.weeks || (next.weeks = {});
  const week = weeks[data.week] || (weeks[data.week] = { days: {} });
  const day = week.days[data.day] || (week.days[data.day] = { sheets: {}, submittedAt: null });
  const sheet = day.sheets[data.sheet] || (day.sheets[data.sheet] = { items: {} });
  const prior = sheet.items[data.item] || { value: null, status: 'unanswered', checkedAt: null };
  const hadFixes = Object.keys(day.sheets).some((sheetId) => Object.keys(day.sheets[sheetId].items || {}).some((itemId) => day.sheets[sheetId].items[itemId].status === FIX_STATUS));
  sheet.items[data.item] = { ...prior, value, status: value === null ? 'unanswered' : 'answered', checkedAt: null };
  if (hadFixes) day.submittedAt = null;
  return { ...cq, dailyWork: next };
}

export function updateDailyWork(cq, action, data, value, nowIso) {
  if (action === 'daily-input') return setItem(cq, data, valueForInput(data.kind, value));
  if (action === 'daily-scale') return setItem(cq, data, Number(value));
  if (action === 'daily-word' || action === 'daily-blank') {
    const current = storedItem(storedDay(cq, data.week, data.day), data.sheet, data.item).value;
    const blanks = blankValues({ answer: data.answer }, current);
    if (action === 'daily-word') {
      const index = blanks.findIndex((entry) => entry === null);
      if (index < 0) return cq;
      blanks[index] = value;
    } else blanks[Number(data.index)] = null;
    return setItem(cq, data, blanks);
  }
  if (action === 'daily-coin-add' || action === 'daily-coin-remove' || action === 'daily-coin-clear') {
    const counts = action === 'daily-coin-clear'
      ? {} : coinCounts(storedItem(storedDay(cq, data.week, data.day), data.sheet, data.item).value);
    if (action !== 'daily-coin-clear') {
      if (!isDenom(data.denom)) return cq;
      const next = (counts[data.denom] || 0) + (action === 'daily-coin-add' ? 1 : -1);
      if (next < 1) delete counts[data.denom];
      else counts[data.denom] = Math.min(MAX_PER_DENOM, next);
    }
    // No coins left means nothing has been answered yet, so store null and let setItem() put the
    // item back to 'unanswered' — the same shape an untouched item has.
    return setItem(cq, data, COIN_ORDER.some((denom) => counts[denom]) ? counts : null);
  }
  if (action === 'daily-submit') {
    const next = clone(cq.dailyWork);
    const weeks = next.weeks || (next.weeks = {});
    const week = weeks[data.week] || (weeks[data.week] = { days: {} });
    const day = week.days[data.day] || (week.days[data.day] = { sheets: {}, submittedAt: null });
    return { ...cq, dailyWork: { ...next, weeks: { ...weeks, [data.week]: { ...week, days: { ...week.days, [data.day]: { ...day, submittedAt: nowIso } } } } } };
  }
  return cq;
}

export function itemMeta(content, track, data) {
  const week = content[track] && content[track].weeks && content[track].weeks[data.week];
  const sheets = week ? [...(week.weekItems || []), ...((week.days[data.day] || {}).sheets || [])] : [];
  const sheet = sheets.find((entry) => entry.id === data.sheet);
  const item = sheet && (sheet.items || []).find((entry) => entry.id === data.item);
  return item || null;
}
