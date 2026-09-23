// Fresh rendering for the dedicated iPad page's one-sheet-per-page view. Reuses every exported
// pure helper from the existing (still-live, PC-hub-serving) daily-work-ui.js for state reads and
// writes — storedItem, isComplete, ready, updateDailyWork, itemMeta, coin math, etc. — completely
// unchanged. Only the HTML is fresh: the original renderItem/coinItem/coinTray/etc. are private to
// that module (not exported) and built for a stacked all-sheets-at-once scroll, not this page's
// full-page-per-sheet layout, so this file writes its own markup against the same data model.
import { DAILY_WORK } from '../cq/daily-work/content.js';
import { quantityVessel, shadeCells, tallyMarks } from './manipulatives.js';
import { blockView } from './blocks.js';
import {
  OK_STATUS, allItems, coinCounts, coinTotal, displayValue, hasFixes, isComplete, itemMeta,
  itemWithSheet, ready, storedItem, updateDailyWork,
} from '../cq/daily-work/daily-work-ui.js';

const esc = (value) => String(value).replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

const COIN_ORDER = ['penny', 'nickel', 'dime', 'quarter', 'dollar-bill'];
const COIN_CENTS = { penny: 1, nickel: 5, dime: 10, quarter: 25, 'dollar-bill': 100 };
const COIN_NAMES = { penny: 'Penny', nickel: 'Nickel', dime: 'Dime', quarter: 'Quarter', 'dollar-bill': 'Dollar bill' };
const COIN_PLURALS = { penny: 'pennies', nickel: 'nickels', dime: 'dimes', quarter: 'quarters', 'dollar-bill': 'dollar bills' };
const MAX_PER_DENOM = 99;
const money = (cents) => { const whole = Math.max(0, Math.round(cents)); return `$${Math.floor(whole / 100)}.${String(whole % 100).padStart(2, '0')}`; };
const faceValue = (denom) => (COIN_CENTS[denom] < 100 ? `${COIN_CENTS[denom]}¢` : '$1');
const spokenValue = (denom) => (COIN_CENTS[denom] < 100 ? `${COIN_CENTS[denom]} cents` : '1 dollar');
const coinPhrase = (denom, count) => `${count} ${count === 1 ? COIN_NAMES[denom].toLowerCase() : COIN_PLURALS[denom]}`;
function denomsFor(item) {
  const set = Array.isArray(item.coinSet) ? item.coinSet : [];
  const picked = COIN_ORDER.filter((denom) => set.indexOf(denom) >= 0);
  return picked.length ? picked : COIN_ORDER.slice(0, 4);
}

// Day-only sheets — deliberately NOT sheetsFor()'s weekItems+day.sheets union. The memory verse
// (this track's only weekItems sheet) moved out of the daily gated/graded flow entirely (2026-09-22,
// Jesse: it's "something they come back to" for a Friday recitation, not a daily fill-blank chore) —
// it now renders once as an ungraded reference card (see weekVerse() below), and every caller of this
// function (submit-readiness, the pager, parent-mode's check list) correctly stops seeing it as a
// gated item just by this one function excluding it, with no other file needing to know that.
export function sheetsForDay(week, dayKey) {
  const day = (week.days || {})[dayKey];
  if (!day) return [];
  return (day.sheets || []).map((sheet) => ({ ...sheet, items: itemWithSheet(sheet) }));
}

// The week's memory verse, reconstructed as plain correct text (blanks filled with their answers,
// highlighted) for an ungraded reference card — not a quiz anymore, just something to read and
// practice reciting. Generic over however many blanks a verse has, not hardcoded to 2.
export function weekVerse(week) {
  const sheet = (week.weekItems || [])[0];
  const item = sheet && (sheet.items || [])[0];
  if (!sheet || !item || item.kind !== 'fill-blank') return null;
  const answers = Array.isArray(item.answer) ? item.answer : [];
  const parts = item.prompt.split('___');
  let html = esc(parts[0]);
  for (let i = 1; i < parts.length; i += 1) {
    const word = answers[i - 1];
    html += word ? `<strong class="cqd-verse-word">${esc(word)}</strong>` : '___';
    html += esc(parts[i]);
  }
  return { title: sheet.title, citation: sheet.citation || null, html };
}

function dataAttrs(week, dayKey, sheet, item) {
  return `data-week="${esc(week.id)}" data-day="${esc(dayKey)}" data-sheet="${esc(sheet.id)}" data-item="${esc(item.id)}"`;
}

function blankValues(item, value) {
  const count = Array.isArray(item.answer) ? item.answer.length : 1;
  const saved = Array.isArray(value) ? value : [];
  return Array.from({ length: count }, (_, index) => typeof saved[index] === 'string' ? saved[index] : null);
}

function lockedRow(item, state) {
  const text = item.kind === 'coin-total' && state.value && typeof state.value === 'object'
    ? `${coinTotal(coinCounts(state.value)) ? money(coinTotal(coinCounts(state.value))) : 'No coins yet'}` : displayValue(state.value);
  return `<p class="cqd-item-prompt">${esc(item.prompt)}</p><div class="cqd-locked" aria-label="Locked, already correct"><span>${esc(text)}</span></div>`;
}

function coinTray(data, idBase, item, counts) {
  return denomsFor(item).map((denom) => {
    const count = counts[denom] || 0;
    const name = COIN_NAMES[denom];
    const addLabel = `${name}, ${spokenValue(denom)}, tap to add one${count ? `, ${coinPhrase(denom, count)} so far` : ''}`;
    const add = `<button type="button" class="cqd-coin-add" data-token-key="${denom}" data-token-count="${count}" data-action="daily-coin-add" data-denom="${denom}" aria-label="${esc(addLabel)}" ${data}><span class="cqd-coin-face" data-token-face data-denom="${denom}" aria-hidden="true">${faceValue(denom)}</span><span class="cqd-coin-name">${esc(name)}</span><span class="cqd-coin-count" data-token-readout>${count ? `×${count}` : ''}</span></button>`;
    const remove = count > 0
      ? `<button type="button" class="cqd-coin-minus" data-action="daily-coin-remove" data-denom="${denom}" aria-label="${esc(`Take one ${name.toLowerCase()} back, ${coinPhrase(denom, count)} so far`)}" ${data}>−</button>`
      : '';
    return `<div class="cqd-coin-row">${add}${remove}</div>`;
  }).join('');
}

function coinPile(data, item, state) {
  const pile = coinCounts(item.pile);
  const value = state.value === null || state.value === undefined ? '' : String(state.value);
  const rows = COIN_ORDER.filter((denom) => pile[denom]).map((denom) => `<li><span class="cqd-coin-face" data-denom="${denom}" aria-hidden="true">${faceValue(denom)}</span><span>${esc(coinPhrase(denom, pile[denom]))}</span></li>`).join('');
  return `<p class="cqd-item-prompt">${esc(item.prompt)}</p><ul class="cqd-pile" aria-label="The coins you have">${rows}</ul><label class="cqd-field"><span>How much is that in all?</span><input class="cqd-input" type="text" inputmode="decimal" value="${esc(value)}" data-action="daily-input" data-kind="coin-total" ${data}></label>`;
}

// The jar's fill level is a function of coin COUNT only, against a fixed visual cap — deliberately
// never money-in-vs-target. A fill gauge tied to the target would be exactly the kind of live
// correctness comparison this interactive was built to avoid (see coinItem's own total, which is
// likewise never measured against targetCents anywhere). The jar just shows "coins were added,"
// nothing about whether they're the right ones.
const JAR_VISUAL_CAP = 12;
function coinJar(counts) {
  const coinCount = COIN_ORDER.reduce((sum, denom) => sum + (counts[denom] || 0), 0);
  return `<div class="cqd-jar-wrap">
    ${quantityVessel({ count: coinCount, cap: JAR_VISUAL_CAP, label: `A jar with ${coinCount} coin${coinCount === 1 ? '' : 's'} in it`, skin: 'cqd-jar' })}
    <div class="cqd-tally-row">
      <div class="cqd-tally" aria-hidden="true">${tallyMarks(coinCount, 'No coins yet')}</div>
      <p class="cqd-tally-label">${coinCount} coin${coinCount === 1 ? '' : 's'} in the jar</p>
    </div>
  </div>`;
}

function coinItem(week, dayKey, sheet, item, state) {
  const data = dataAttrs(week, dayKey, sheet, item);
  if (item.pile) return `<li class="cqd-item cqd-item-coin" data-item="${esc(item.id)}">${coinPile(data, item, state)}</li>`;
  const idBase = `${sheet.id}-${item.id}`;
  const counts = coinCounts(state.value);
  const tapped = COIN_ORDER.some((denom) => counts[denom]);
  const target = typeof item.targetCents === 'number' ? `<p class="cqd-coin-target">Try to make: ${money(item.targetCents)}</p>` : '';
  return `<li class="cqd-item cqd-item-coin" data-item="${esc(item.id)}" data-manipulative="${esc(idBase)}">
    <p class="cqd-item-prompt">${esc(item.prompt)}</p>${target}
    <div class="cqd-tray">${coinTray(data, idBase, item, counts)}</div>
    ${coinJar(counts)}
    <p class="cqd-coin-total" aria-live="polite">Your total: <strong>${money(coinTotal(counts))}</strong></p>
    <button type="button" class="cqd-button cqd-coin-clear" data-action="daily-coin-clear" ${data} ${tapped ? '' : 'disabled'}>Clear coins</button>
  </li>`;
}

// A 10x10 shading grid standing in for a typed percent. It is ONE interactive surface (not 100
// individual 44px buttons — a hundred separately-tappable targets would be both physically
// impossible at a legible grid size and pointless to distinguish), handled by app.js's own
// dedicated click listener on `.cqd-percent-grid`, which works out row/col from the tap position
// and writes the resulting count 1-100 via the existing daily-percent-set action — the same plain
// numeric write as a scale chip, still compared to item.answer by ordinary numeric equality.
function percentGridItem(data, item, state) {
  const shaded = typeof state.value === 'number' && Number.isInteger(state.value) && state.value >= 0 && state.value <= 100
    ? state.value : 0;
  const cells = shadeCells(shaded);
  return `<li class="cqd-item cqd-item-percent">
    <p class="cqd-item-prompt">${esc(item.prompt)}</p>
    <div class="cqd-shade-grid cqd-percent-grid" data-shade-key="${esc(item.id)}" data-action="daily-percent-set" role="group" aria-label="Shade squares to show your percent, currently ${shaded} percent" ${data}>${cells}</div>
    <p class="cqd-percent-readout" aria-live="polite"><strong>${shaded}</strong>%</p>
  </li>`;
}

// The adaptive block bar for a percent problem (see blocks.js): equal blocks sized to the question,
// tapped to fill left to right, with as much labelling as the sheet's `help` level allows. The graded
// answer is still the percent he TYPES below — the blocks are working-out only and never say whether
// anything is right. Each block is a real button (a max of 10 per row, so every one is a big target).
function blockBarItem(data, item, state, view) {
  const value = state.value === null || state.value === undefined ? '' : String(state.value);
  const blocks = Array.from({ length: view.count }, (_, i) => {
    const block = i + 1;
    const label = view.labels[i];
    const name = `Block ${block} of ${view.count}${label ? `, ${label}` : ''}`;
    return `<button type="button" class="cqd-block ${block <= view.filled ? 'is-filled' : ''} ${label ? 'has-label' : ''}" data-action="daily-block-fill" data-block="${block}" data-count="${view.count}" aria-pressed="${block <= view.filled}" aria-label="${esc(name)}" ${data}><span class="cqd-block-label" aria-hidden="true">${label ? esc(label) : ''}</span></button>`;
  }).join('');
  return `<li class="cqd-item cqd-item-blocks" data-help="${esc(view.help)}">
    <p class="cqd-item-prompt">${esc(item.prompt)}</p>
    <div class="cqd-block-bar" role="group" aria-label="${view.count} equal blocks make the whole" style="--cqd-block-count:${view.count};--cqd-block-cols:${view.cols}">${blocks}</div>
    <p class="cqd-block-caption">${esc(view.caption)}</p>
    ${view.readout ? `<p class="cqd-block-readout" aria-live="polite">${esc(view.readout)}</p>` : ''}
    <label class="cqd-field cqd-block-answer"><span>What percent?</span><span class="cqd-block-input"><input class="cqd-input" type="text" inputmode="decimal" value="${esc(value)}" data-action="daily-input" data-kind="numeric" ${data}><b aria-hidden="true">%</b></span></label>
  </li>`;
}

function renderItem(week, dayKey, sheet, item, state, locked, fillOf) {
  const data = dataAttrs(week, dayKey, sheet, item);
  if (locked) return `<li class="cqd-item cqd-item-locked">${lockedRow(item, state)}</li>`;
  if (item.kind === 'coin-total') return coinItem(week, dayKey, sheet, item, state);
  if (item.kind === 'fill-blank') {
    const blanks = blankValues(item, state.value);
    return `<li class="cqd-item">
      <p class="cqd-item-prompt">${esc(item.prompt)}</p>
      <div class="cqd-blanks" aria-label="Your word choices">${blanks.map((word, index) => `<button type="button" class="cqd-blank ${word ? 'is-filled' : ''}" data-action="daily-blank" data-index="${index}" ${data}>${word ? esc(word) : 'Blank'}</button>`).join('')}</div>
      <div class="cqd-bank" aria-label="Word bank">${(item.wordBank || []).map((word) => `<button type="button" class="cqd-chip" data-action="daily-word" data-word="${esc(word)}" ${data}>${esc(word)}</button>`).join('')}</div>
    </li>`;
  }
  if (item.kind === 'scale') {
    return `<li class="cqd-item">
      <p class="cqd-item-prompt">${esc(item.prompt)}</p>
      <div class="cqd-scale" aria-label="Choose a number">${Array.from({ length: item.scaleMax || 0 }, (_, index) => { const value = index + 1; return `<button type="button" class="cqd-chip" data-action="daily-scale" data-value="${value}" aria-pressed="${state.value === value}" ${data}>${value}</button>`; }).join('')}</div>
    </li>`;
  }
  if (item.kind === 'numeric' && item.help) {
    const view = blockView(item, fillOf ? fillOf(item) : 0);
    if (view) return blockBarItem(data, item, state, view);
  }
  if (item.kind === 'numeric' && item.unit === 'percent' && Number.isInteger(item.answer)) {
    return percentGridItem(data, item, state);
  }
  const value = state.value === null || state.value === undefined ? '' : String(state.value);
  const long = item.kind === 'long-text';
  const control = long
    ? `<textarea class="cqd-input cqd-textarea" rows="4" data-action="daily-input" data-kind="${item.kind}" ${data}>${esc(value)}</textarea>`
    : `<input class="cqd-input" type="text" ${item.kind === 'numeric' ? 'inputmode="decimal"' : ''} value="${esc(value)}" data-action="daily-input" data-kind="${item.kind}" ${data}>`;
  return `<li class="cqd-item"><label class="cqd-field"><span>${esc(item.prompt)}</span>${control}</label></li>`;
}

// One sheet's worked-example header plus its items — the page chrome (subject bar, prev/next,
// submit) is added by app.js, which also knows the sheet's position among the day's other sheets.
export function renderSheetArticle(week, dayKey, sheet, dayState, reopened, fillOf) {
  return `<article class="cqd-sheet" data-subject="${esc(sheet.subject)}">
    <header class="cqd-sheet-head">
      <span class="cqd-subject-icon" aria-hidden="true"></span>
      <span class="cqd-sheet-heading"><span class="cqd-subject">${esc(sheet.subject.replace(/-/g, ' '))}</span><h2>${esc(sheet.title)}</h2></span>
      <span class="cqd-day-badge">${esc(dayKey)}</span>
    </header>
    ${sheet.intro ? `<p class="cqd-intro">${esc(sheet.intro)}</p>` : ''}
    ${sheet.example ? `<p class="cqd-example"><strong>Worked example:</strong> ${esc(sheet.example)}</p>` : ''}
    ${sheet.citation ? `<p class="cqd-citation">${esc(sheet.citation)}</p>` : ''}
    <ol class="cqd-items">${(sheet.items || []).map((item) => {
      const state = storedItem(dayState, sheet.id, item.id);
      return renderItem(week, dayKey, sheet, item, state, state.status === OK_STATUS && reopened, fillOf);
    }).join('')}</ol>
    <footer class="cqd-sheet-foot" aria-hidden="true"><span class="cqd-sheet-foot-dot"></span><span class="cqd-sheet-foot-rule"></span></footer>
  </article>`;
}

export function dayReopened(dayState, sheets) {
  return hasFixes(dayState, sheets);
}

export function dayReady(dayState, sheets) {
  return ready(dayState, sheets);
}

export function dayComplete(dayState, sheets) {
  return isComplete(dayState, sheets);
}

// Mirrors ui.js's onAction/onInput daily-* handling exactly (itemMeta enrichment, then
// updateDailyWork) so this page's writes are byte-for-byte the same shape the hub tab already
// produces and the parent grading view already expects — just called from this page's own wiring.
export function applyDailyAction(store, action, rawData, value, nowIso) {
  const data = { ...rawData };
  const item = itemMeta(DAILY_WORK, store.track, data);
  if (item) { data.kind = item.kind; data.answer = item.answer; }
  return updateDailyWork(store, action, data, value, nowIso);
}

export { allItems };
