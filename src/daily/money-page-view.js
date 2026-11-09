// The boy's monthly paper money page. Amounts here are only what he wrote.
import { monthKey, monthMondays, monthPageEditable, weekDates, weekMathEditable, weekMonday } from './chores.js';
import { choresOf } from './store.js';

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
const amount = (cents) => cents === null || cents === undefined ? '' : (cents / 100).toFixed(2);
const shown = (cents) => cents === null || cents === undefined ? '—' : `$${amount(cents)}`;
const date = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const monthName = (month) => new Date(`${month}-01T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const monthWord = (month) => new Date(`${month}-01T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
const shiftMonth = (month, offset) => {
  const next = new Date(`${month}-01T12:00:00Z`);
  next.setUTCMonth(next.getUTCMonth() + offset);
  return next.toISOString().slice(0, 7);
};

export function moneyPageBounds(store, todayIso) {
  const current = monthKey(todayIso);
  const chores = choresOf(store);
  const months = [
    ...Object.values(chores.entries).map((entry) => monthKey(weekMonday(entry.date))),
    ...Object.keys(chores.paid).map((monday) => monthKey(monday)),
    ...Object.keys(chores.math).map((monday) => monthKey(monday)),
    ...Object.values(chores.savingsUsed).map((record) => monthKey(record.date)),
    ...Object.keys(chores.months || {}),
  ].filter(Boolean).sort();
  const first = months[0];
  return { earliest: first && first < current ? first : current, latest: current };
}

const weekFields = [['totalCents', 'Earned'], ['giveCents', 'Give 10%'], ['saveCents', 'Save 20%'], ['spendCents', 'Spend 70%']];
const monthFields = [
  ['goalFor', 'I am saving for:', 'text'], ['goalCostCents', 'It costs about:', 'money'], ['goalSavedCents', 'I have saved so far:', 'money'],
  ['savingsFromLastCents', 'Savings from last month', 'money'], ['spendingFromLastCents', 'Spending money from last month', 'money'],
  ['savingsNowCents', 'Savings I have now', 'money'], ['spendingNowCents', 'Spending money I have now', 'money'],
  ['savingForMonth', 'Saving for this month:', 'text'], ['earningGoalCents', 'My earning goal:', 'money'],
  ['totalEarnedCents', 'TOTAL EARNED', 'money'], ['totalGivenCents', 'TOTAL GIVEN', 'money'],
  ['totalSavedCents', 'TOTAL SAVED', 'money'], ['totalSpentCents', 'TOTAL SPENT', 'money'],
];
export const moneyMonthFields = monthFields;

function field(record, key, label, kind, editable) {
  const value = record ? record[key] : kind === 'text' ? '' : null;
  return editable
    ? `<label class="cqd-money-field"><span>${label}</span><span class="cqd-money-control">${kind === 'money' ? '<span aria-hidden="true">$</span>' : ''}<input type="text" ${kind === 'money' ? 'inputmode="decimal"' : 'maxlength="80"'} data-money-month="${key}" value="${esc(kind === 'money' ? amount(value) : value)}"></span></label>`
    : `<div class="cqd-money-field"><strong>${label}</strong><span>${kind === 'money' ? shown(value) : esc(value || '—')}</span></div>`;
}

function savingsHtml(chores, month, todayIso) {
  const uses = Object.values(chores.savingsUsed).filter((record) => monthKey(record.date) === month)
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt) || b.id.localeCompare(a.id));
  return `<section class="cqd-chore-savings cqd-money-savings"><h2>Savings I used</h2>
    ${month === monthKey(todayIso) ? `<div class="cqd-chore-savings-form"><label>How much did you use?<span class="cqd-chore-money-input"><span>$</span><input type="text" inputmode="decimal" data-money-savings-cents></span></label>
      <label>What did you use it for?<input type="text" maxlength="120" data-money-savings-why></label>
      <button type="button" class="cqd-button" data-action="money-savings-add">Send to a grown-up</button></div>` : ''}
    <p class="cqd-chore-feedback" data-money-savings-status role="status"></p>
    ${uses.length ? `<ul class="cqd-chore-savings-list">${uses.map((record) => `<li><strong>${shown(record.cents)}</strong> ${esc(record.why)} <small>${esc(date(record.date))}</small>
      <span class="cqd-chore-chip ${record.status === 'approved' ? 'ok' : record.status === 'declined' ? 'back' : 'wait'}">${record.status === 'approved' ? '✓ Approved' : record.status === 'declined' ? '↩ Not approved. Ask a grown-up.' : '⏳ Waiting for a grown-up'}</span>
      ${record.status === 'waiting' && record.date === todayIso ? `<button type="button" class="cqd-chore-remove" data-action="money-savings-remove" data-id="${esc(record.id)}" aria-label="Remove savings use">×</button>` : ''}</li>`).join('')}</ul>` : '<p>None this month.</p>'}</section>`;
}

export function renderMoneyPage(store, todayIso, requestedMonth) {
  const chores = choresOf(store);
  const bounds = moneyPageBounds(store, todayIso);
  const month = typeof requestedMonth === 'string' && requestedMonth >= bounds.earliest && requestedMonth <= bounds.latest && monthMondays(requestedMonth).length ? requestedMonth : bounds.latest;
  const editable = monthPageEditable(chores, month, todayIso);
  const record = (chores.months || {})[month];
  const weekCanSave = monthMondays(month).some((monday) => weekMathEditable(chores, monday, todayIso));
  const f = (key) => { const item = monthFields.find((entry) => entry[0] === key); return field(record, item[0], item[1], item[2], editable); };
  return `<section class="cqd-money-screen" data-money-month="${month}">
    <div class="cqd-sheet-nav"><button type="button" class="cqd-link-button" data-action="back-to-calendar">← Home</button></div>
    <nav class="cqd-money-nav" aria-label="Money page months"><button type="button" data-action="money-month" data-month="${shiftMonth(month, -1)}" ${month <= bounds.earliest ? 'disabled' : ''}>← Earlier month</button><button type="button" data-action="money-month" data-month="${shiftMonth(month, 1)}" ${month >= bounds.latest ? 'disabled' : ''}>Later month →</button></nav>
    <div class="cqd-money-paper">
      <header class="cqd-money-head"><h1>Give · Save · Spend Tracker</h1><strong>${esc(monthName(month))}</strong></header>
      <section class="cqd-money-goal"><h2>My Savings Goal</h2><div class="cqd-money-goal-fields">${f('goalFor')}${f('goalCostCents')}${f('goalSavedCents')}</div></section>
      <div class="cqd-money-jars"><div class="give"><strong>1. Give · Da</strong><small>(10% — first, always)</small></div><div class="save"><strong>2. Save · Ahorra</strong><small>(20% toward my goal)</small></div><div class="spend"><strong>3. Spend · Gasta</strong><small>(70% — mine to use)</small></div></div>
      <section class="cqd-money-weeks" aria-label="Weekly money">${monthMondays(month).map((monday, index) => {
    const saved = chores.math[monday];
    const canEdit = weekMathEditable(chores, monday, todayIso);
    const future = monday > todayIso;
    const dates = weekDates(monday);
    return `<div class="cqd-money-week" data-money-week="${monday}"><div class="cqd-money-week-name"><strong>Week ${index + 1}</strong><small>${esc(date(dates[0]))} – ${esc(date(dates[6]))}</small></div>
      ${future ? '<p>Not yet.</p>' : `<div class="cqd-money-week-fields">${weekFields.map(([key, label]) => canEdit
    ? `<label><span>${label}</span><span class="cqd-money-control"><span aria-hidden="true">$</span><input type="text" inputmode="decimal" data-money-week-field="${key}" value="${esc(amount(saved?.[key]))}"></span></label>`
    : `<div><strong>${label}</strong><span>${shown(saved?.[key])}</span></div>`).join('')}</div>`}</div>`;
  }).join('')}</section>
      <section class="cqd-money-review"><h2>${esc(monthWord(month))} Money Review · Revisión Mensual</h2><div class="cqd-money-review-grid"><div><h3>Coming INTO this month<small>Al empezar el mes</small></h3>${f('savingsFromLastCents')}${f('spendingFromLastCents')}</div><div><h3>LEAVING this month<small>Al terminar el mes</small></h3>${f('savingsNowCents')}${f('spendingNowCents')}</div></div></section>
      <section class="cqd-money-month-goal">${f('savingForMonth')}${f('earningGoalCents')}</section>
      <section class="cqd-money-totals" aria-label="Monthly totals">${['totalEarnedCents', 'totalGivenCents', 'totalSavedCents', 'totalSpentCents'].map(f).join('')}</section>
      ${editable || weekCanSave ? '<button type="button" class="cqd-button cqd-primary cqd-money-save" data-action="money-save">Save my page</button>' : ''}
      ${editable ? '' : `<p class="cqd-money-locked">${weekCanSave ? 'The month boxes are locked after payday. You can still finish an open week.' : 'Locked after payday.'}</p>`}
      <p class="cqd-chore-feedback" data-money-status role="status"></p>
      ${savingsHtml(chores, month, todayIso)}
      <p class="cqd-chore-sheet-note">Every month stays here on this iPad. Tap ← Earlier month to look back.</p>
    </div></section>`;
}
