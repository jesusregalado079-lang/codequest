// What the Payday Helper looks like (HTML strings, like the rest of the iPad page). It only draws the session state from
// session.js; every tap is a data-action that app.js turns into a session action. Kid-facing text rules (spec v2): never
// name a person, never say easy/guided/hard/standard, never show the answer to the question he is on, money in dollars.
import {
  MAX_HANDED, MAX_REPLACEMENT, PIECES, PIECE_IDS, describePieces, formatMoney, pieceCents, pieceName, piecesTotal,
} from './logic.js';
import { COPY, view as derive } from './session.js';

const esc = (value) => String(value).replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
const FACE = { quarter: '25¢', dime: '10¢', nickel: '5¢', penny: '1¢' };
const isBill = (id) => /^b\d+$/.test(id);
const JAR_NAMES = { give: 'Give', save: 'Save', spend: 'Spend' };
const JAR_PERCENT = { give: 10, save: 20, spend: 70 };
const STEP_OF = { earn: 1, handed: 2, recap: 2, jars: 3, add: 4, make: 5, spend: 5, done: 5 };
const STEP_NAMES = ['Earned', 'Handed', 'Jars', 'Add', 'Make'];

// One bill or coin picture. Coins reuse the worksheet's coin faces; bills are drawn in CSS (.pd-bill).
export function pieceArt(id) {
  if (isBill(id)) return `<span class="pd-bill" data-bill="${id.slice(1)}" aria-hidden="true"><b>$${esc(id.slice(1))}</b></span>`;
  return `<span class="cqd-coin-face pd-coin" data-denom="${esc(id)}" aria-hidden="true">${FACE[id]}</span>`;
}

function header(state) {
  const step = STEP_OF[state.screen] || 1;
  const dots = STEP_NAMES.map((name, i) => `<li class="pd-step-dot ${i + 1 === step ? 'is-current' : i + 1 < step ? 'is-done' : ''}" ${i + 1 === step ? 'aria-current="step"' : ''}><span aria-hidden="true">${i + 1}</span><span class="pd-step-name">${name}</span></li>`).join('');
  return `<header class="pd-head"><span class="pd-eyebrow">Payday Helper</span><ol class="pd-steps" aria-label="Step ${step} of 5">${dots}</ol></header>`;
}

function note(feedback) {
  if (!feedback) return '<div class="pd-note-slot" aria-live="polite"></div>';
  if (feedback.kind === 'ok') return `<p class="pd-note pd-ok" role="status">${esc(feedback.text || '')}</p>`;
  if (feedback.kind === 'hint' || feedback.kind === 'diff') return `<p class="pd-note pd-hint" role="status">${esc(feedback.text || '')}</p>`;
  if (feedback.kind === 'example') {
    return `<div class="pd-note pd-example" role="status"><h2>Here is an example with different money</h2>${(feedback.lines || []).map((line) => `<p>${esc(line)}</p>`).join('')}<p class="pd-example-ask">Now try yours again.</p><button type="button" class="cqd-button cqd-primary" data-action="payday-dismiss">Got it. Try again.</button></div>`;
  }
  return '';
}

// A stack of one kind of piece: the picture, "×3", and the name. Tappable when `action` is given.
function stack(id, count, action, label) {
  const name = pieceName(id, count);
  const inner = `${pieceArt(id)}<span class="pd-stack-count">×${count}</span><span class="pd-stack-name">${esc(pieceName(id, 1))}</span>`;
  if (!action) return `<li class="pd-stack is-static" aria-label="${count} ${esc(name)}">${inner}</li>`;
  return `<li><button type="button" class="pd-stack" data-action="${action}" data-piece="${id}" aria-label="${esc(label || `${count} ${name}. Tap to use one`)}">${inner}</button></li>`;
}

function pieces(pieceCounts, action, labelFor) {
  const rows = PIECE_IDS.filter((id) => pieceCounts[id] > 0).map((id) => stack(id, pieceCounts[id], action, labelFor ? labelFor(id, pieceCounts[id]) : undefined)).join('');
  return rows ? `<ul class="pd-hand">${rows}</ul>` : '<p class="pd-empty">Nothing here yet.</p>';
}

// The "+ / −" rows used for what he was handed (Step 2) and for the smaller pieces he asks for (Step 5).
function counters(counts, ids, cap, actionBase) {
  return `<ul class="pd-counters">${ids.map((id) => {
    const n = counts[id] || 0;
    const name = pieceName(id, 1);
    return `<li class="pd-counter">${pieceArt(id)}<span class="pd-counter-name">${esc(name)}</span>
      <button type="button" class="pd-step-btn" data-action="${actionBase}-minus" data-piece="${id}" aria-label="Take one ${esc(name)} back, ${n} so far" ${n === 0 ? 'disabled' : ''}>−</button>
      <output class="pd-count" aria-live="polite">${n}</output>
      <button type="button" class="pd-step-btn" data-action="${actionBase}-plus" data-piece="${id}" aria-label="Add one ${esc(name)}, ${n} so far" ${n >= cap ? 'disabled' : ''}>+</button></li>`;
  }).join('')}</ul>`;
}

const moneyField = (key, label, value = '') => `<label class="cqd-field pd-field"><span>${label}</span><span class="pd-money"><b aria-hidden="true">$</b><input class="cqd-input pd-input" type="text" inputmode="decimal" autocomplete="off" data-payday-input="${key}" value="${esc(value)}" aria-describedby="pd-note"></span></label>`;

function footer(ui) {
  if (ui && ui.confirmRestart) {
    return `<div class="pd-confirm" role="group" aria-label="Start a new payday?"><p>Start a new payday? This one stays saved for a grown-up, but it will not be finished.</p>
      <button type="button" class="cqd-button" data-action="payday-restart-yes">Yes, start a new payday</button>
      <button type="button" class="cqd-button cqd-primary" data-action="payday-restart-no">No, keep going</button></div>`;
  }
  return '<p class="pd-foot"><button type="button" class="cqd-link-button" data-action="payday-restart">Start a new payday</button></p>';
}

function links() {
  return `<p class="pd-links"><button type="button" class="cqd-link-button" data-action="payday-change-amount">Change the amount I earned</button><button type="button" class="cqd-link-button" data-action="payday-pieces-clear">Change my bills and coins</button></p>`;
}

function trayChips(items) {
  if (!items.length) return '<p class="pd-empty">Your tray is empty.</p>';
  return `<ul class="pd-tray-items">${items.map((item) => `<li><button type="button" class="pd-chip" data-action="${item.action}" ${item.data} aria-label="${esc(item.label)}">${item.art || ''}<span>${esc(item.text)}</span><b aria-hidden="true">✕</b></button></li>`).join('')}</ul>`;
}

function earnScreen(state) {
  return `<h1>How much did you earn?</h1>
    <p class="pd-lead">How much money did you earn this week? Type it in dollars, like 6.50.</p>
    ${moneyField('earn', 'Money I earned', state.earned === null ? '' : (state.earned / 100).toFixed(2))}
    <div id="pd-note">${note(state.feedback)}</div>
    <div class="pd-actions"><button type="button" class="cqd-button cqd-primary" data-action="payday-earn-submit">Next</button></div>`;
}

function handedScreen(state, v) {
  return `<h1>What were you handed?</h1>
    <p class="pd-lead">You earned <strong>${formatMoney(state.earned)}</strong>. Now tell me the bills and coins you were handed. Tap + for each one.</p>
    ${counters(state.handed, PIECE_IDS, MAX_HANDED, 'payday-piece')}
    <p class="pd-total" aria-live="polite">My bills and coins add up to <strong>${formatMoney(v.handedTotal)}</strong>.</p>
    <div id="pd-note">${note(state.feedback)}</div>
    <div class="pd-actions"><button type="button" class="cqd-button cqd-primary" data-action="payday-handed-done">That's everything</button></div>
    ${links()}`;
}

function recapScreen(state) {
  return `<h1>Is this right?</h1>
    <div id="pd-note">${note(state.feedback)}</div>
    <p class="pd-lead">You earned <strong>${formatMoney(state.earned)}</strong>. You were handed: <strong>${esc(describePieces(state.handed))}</strong>. Is this right?</p>
    ${pieces(state.handed)}
    <div class="pd-actions"><button type="button" class="cqd-button cqd-primary" data-action="payday-recap-yes">Yes</button><button type="button" class="cqd-button" data-action="payday-change-pieces">No</button></div>
    ${links()}`;
}

function jarsScreen(state) {
  return `<h1>Your three jars</h1>
    <p class="pd-lead">Here is how your money is split.</p>
    <ul class="pd-jars">${['give', 'save', 'spend'].map((jar) => `<li class="pd-jar" data-jar="${jar}"><span class="pd-jar-name">${JAR_NAMES[jar]}</span><span class="pd-jar-pct">(${JAR_PERCENT[jar]}%)</span><strong>${formatMoney(state.jars[jar])}</strong></li>`).join('')}</ul>
    <div class="pd-actions"><button type="button" class="cqd-button cqd-primary" data-action="payday-jars-next">Next</button></div>`;
}

function addScreen(state, v) {
  const chips = trayChips(state.tray.map((jar) => ({ action: 'payday-tray-remove', data: `data-jar="${jar}"`, label: `Take your ${JAR_NAMES[jar]} jar, ${formatMoney(state.jars[jar])}, out of the tray`, text: `${JAR_NAMES[jar]} ${formatMoney(state.jars[jar])}` })));
  return `<h1>Add the jars</h1>
    <p class="pd-lead">Add your three jars together. Tap each jar to add it to your tray. What total do you get?</p>
    <ul class="pd-jars pd-jars-tap">${['give', 'save', 'spend'].map((jar) => `<li><button type="button" class="pd-jar" data-jar="${jar}" data-action="payday-tray-add" ${state.tray.includes(jar) ? 'disabled aria-pressed="true"' : 'aria-pressed="false"'}><span class="pd-jar-name">${JAR_NAMES[jar]}</span><span class="pd-jar-pct">(${JAR_PERCENT[jar]}%)</span><strong>${formatMoney(state.jars[jar])}</strong></button></li>`).join('')}</ul>
    <div class="pd-tray"><p class="pd-total" aria-live="polite">So far: <strong>${formatMoney(v.trayTotal)}</strong></p>${chips}</div>
    ${moneyField('add', 'My total, in dollars')}
    <div id="pd-note">${note(state.feedback)}</div>
    <div class="pd-actions"><button type="button" class="cqd-button cqd-primary" data-action="payday-add-answer">Check my total</button></div>`;
}

function makeScreen(state, v) {
  const jar = state.jar;
  const name = JAR_NAMES[jar];
  const goal = state.jars[jar];
  const title = `<h1>Make your ${name} jar</h1><p class="pd-goal">This jar needs <strong>${formatMoney(goal)}</strong></p>`;
  if (state.phase === 'built') {
    const empty = goal === 0;
    return `${title}
      <div id="pd-note">${note(state.feedback)}</div>
      <p class="pd-lead">${empty ? `Your ${name} jar is ${formatMoney(0)} this time, so there is nothing to put in it.` : `The pieces moved into your ${name} jar. Here is what is left in your hand:`}</p>
      ${pieces(state.hand)}
      <div class="pd-actions"><button type="button" class="cqd-button cqd-primary" data-action="payday-jar-next">${jar === 'give' ? 'Next: the Save jar' : 'Next: the Spend jar'}</button></div>`;
  }
  if (state.phase === 'can') {
    return `${title}
      <p class="pd-lead">You need <strong>${formatMoney(goal)}</strong> for your ${name} jar. Here is what you have right now:</p>
      ${pieces(state.hand)}
      <p class="pd-question">Can you make exactly ${formatMoney(goal)} with only these pieces, without breaking any?</p>
      <div class="cqd-bank pd-yesno" role="group" aria-label="Your answer"><button type="button" class="cqd-chip" data-action="payday-can" data-value="yes">yes</button><button type="button" class="cqd-chip" data-action="payday-can" data-value="no">no</button></div>
      <div id="pd-note">${note(state.feedback)}</div>`;
  }
  if (state.phase === 'pick') {
    return `${title}
      <p class="pd-lead">No group of these pieces makes ${formatMoney(goal)}, so you need to break one.</p>
      <p class="pd-question">Which bill or coin will you break into smaller pieces?</p>
      ${pieces(state.hand, 'payday-pick', (id, n) => `${n} ${pieceName(id, n)}. Tap to break one`)}
      <div id="pd-note">${note(state.feedback)}</div>`;
  }
  if (state.phase === 'replace') {
    return `${title}
      <p class="pd-lead">You are breaking 1 ${esc(pieceName(state.breaking, 1))} (worth <strong>${formatMoney(v.breakingCents)}</strong>). What smaller pieces will you ask for instead? They must add up to the same amount.</p>
      ${counters(state.replacement, v.smaller, MAX_REPLACEMENT, 'payday-replace')}
      <p class="pd-total" aria-live="polite">The new pieces add up to <strong>${formatMoney(v.replacementTotal)}</strong>.</p>
      <div id="pd-note">${note(state.feedback)}</div>
      <div class="pd-actions"><button type="button" class="cqd-button cqd-primary" data-action="payday-replace-done">Those are my new pieces</button><button type="button" class="cqd-link-button" data-action="payday-replace-cancel">Pick a different piece</button></div>`;
  }
  // build
  const inJar = pieces(state.selection, 'payday-jar-remove', (id, n) => `${n} ${pieceName(id, n)} in the jar. Tap to take one back`);
  return `${title}
    <p class="pd-lead">Now build your ${name} jar. Tap the pieces you will put in the jar.</p>
    <h2 class="pd-sub">In your hand</h2>
    ${pieces(v.inHand, 'payday-jar-add', (id, n) => `${n} ${pieceName(id, n)} in your hand. Tap to put one in the jar`)}
    <div class="pd-jarbox"><h2 class="pd-sub">In your ${name} jar</h2>${inJar}
      <p class="pd-total" aria-live="polite">In your jar so far: <strong>${formatMoney(v.selectionTotal)}</strong></p>
      <p class="pd-total">This jar needs: <strong>${formatMoney(goal)}</strong></p></div>
    <div id="pd-note">${note(state.feedback)}</div>
    <div class="pd-actions"><button type="button" class="cqd-button cqd-primary" data-action="payday-jar-done">My jar is ready</button></div>`;
}

function spendScreen(state, v) {
  return `<h1>Your Spend jar</h1>
    <p class="pd-lead">Your Give and Save jars are done. Look at what is left in your hand. Tap each piece to add it to your tray. What total do you get?</p>
    <h2 class="pd-sub">In your hand</h2>
    ${pieces(v.inHand, 'payday-spend-add', (id, n) => `${n} ${pieceName(id, n)} in your hand. Tap to add one to your tray`)}
    <div class="pd-tray"><h2 class="pd-sub">Your tray</h2>${pieces(state.selection, 'payday-spend-remove', (id, n) => `${n} ${pieceName(id, n)} in your tray. Tap to take one back`)}
      <p class="pd-total" aria-live="polite">So far: <strong>${formatMoney(v.selectionTotal)}</strong></p></div>
    ${moneyField('spend', 'My total, in dollars')}
    <div id="pd-note">${note(state.feedback)}</div>
    <div class="pd-actions"><button type="button" class="cqd-button cqd-primary" data-action="payday-spend-answer">Check my total</button></div>`;
}

function doneScreen(state) {
  const j = state.jars;
  return `<h1>All three jars are done</h1>
    <div id="pd-note">${note(state.feedback)}</div>
    <p class="pd-lead">All three jars are done: Give ${formatMoney(j.give)}, Save ${formatMoney(j.save)}, Spend ${formatMoney(j.spend)}.</p>
    <ul class="pd-jars pd-jars-done">${['give', 'save', 'spend'].map((jar) => `<li class="pd-jar" data-jar="${jar}"><span class="pd-jar-name">${JAR_NAMES[jar]}</span><strong>${formatMoney(j[jar])}</strong><span class="pd-jar-has">${esc(describePieces(jar === 'spend' ? state.hand : state.built[jar]))}</span></li>`).join('')}</ul>
    <div class="pd-actions"><button type="button" class="cqd-button cqd-primary" data-action="payday-new">Start a new payday</button><button type="button" class="cqd-button" data-action="back-to-calendar">Back to my week</button></div>`;
}

function stuckScreen() {
  return `<h1>${esc(COPY.grownUp)}</h1>
    <div class="pd-actions"><button type="button" class="cqd-button cqd-primary" data-action="payday-grownup-ok">My grown-up helped me. Try again.</button></div>`;
}

// The whole Payday Helper screen for one payday state. `ui` = { confirmRestart }.
export function renderPayday(state, ui = {}) {
  const v = derive(state);
  const nav = '<div class="cqd-sheet-nav"><button type="button" class="cqd-link-button" data-action="back-to-calendar">← This week</button></div>';
  let body;
  if (state.feedback && state.feedback.kind === 'stuck') body = stuckScreen();
  else if (state.screen === 'earn') body = earnScreen(state);
  else if (state.screen === 'handed') body = handedScreen(state, v);
  else if (state.screen === 'recap') body = recapScreen(state);
  else if (state.screen === 'jars') body = jarsScreen(state);
  else if (state.screen === 'add') body = addScreen(state, v);
  else if (state.screen === 'make') body = makeScreen(state, v);
  else if (state.screen === 'spend') body = spendScreen(state, v);
  else body = doneScreen(state);
  const showFooter = state.screen !== 'done' && !(state.feedback && state.feedback.kind === 'stuck');
  return `${nav}<section class="pd" data-screen="${state.screen}" data-phase="${state.screen === 'make' ? state.phase : ''}">${header(state)}<div class="pd-body">${body}</div>${showFooter ? footer(ui) : ''}</section>`;
}

export { PIECES, piecesTotal, pieceCents };
