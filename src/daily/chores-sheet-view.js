// The boy's saved week, shown without changing chore records.
import { dayEntries, groupByJob, weekDates, weekMonday, weekTotals, weekMathEditable } from './chores.js';
import { choresOf } from './store.js';

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
const money = (cents) => `$${(cents / 100).toFixed(2)}`;
const dateLabel = (iso, weekday = 'long') => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
  weekday, month: 'short', day: 'numeric', timeZone: 'UTC',
});
const shortDate = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
  month: 'short', day: 'numeric', timeZone: 'UTC',
});
// Same local-time date as the grown-up "Paid on" line, so both pages agree on the day.
const stampDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const nextWeek = (monday, offset) => new Date(Date.parse(`${monday}T12:00:00Z`) + offset * 7 * 86400000).toISOString().slice(0, 10);

export function choreSheetBounds(store, todayIso) {
  const latest = weekMonday(todayIso);
  const chores = choresOf(store);
  const dates = [
    ...Object.values(chores.entries).map((entry) => entry.date),
    ...Object.keys(chores.paid),
    ...Object.keys(chores.math),
    ...Object.values(chores.savingsUsed).map((record) => record.date),
  ];
  const earliest = dates.map(weekMonday).filter(Boolean).sort()[0];
  return { earliest: earliest && earliest < latest ? earliest : latest, latest };
}

function groupsForDay(entries) {
  const bySource = new Map();
  for (const entry of entries) {
    if (!bySource.has(entry.by)) bySource.set(entry.by, []);
    bySource.get(entry.by).push(entry);
  }
  return [...bySource].flatMap(([by, sourceEntries]) => groupByJob(sourceEntries).map((group) => ({ ...group, by })));
}

function jobHtml(group) {
  const status = group.status === 'confirmed' ? '<span class="cqd-chore-chip ok">✓ Confirmed</span>'
    : group.status === 'declined' ? '<span class="cqd-chore-chip back">↩ Ask a grown-up</span>'
      : `<span class="cqd-chore-chip wait">⏳ ${group.cents === null ? 'Waiting, a grown-up picks the price' : 'Waiting for a grown-up'}</span>`;
  return `<li class="cqd-chore-sheet-job"><span class="cqd-chore-sheet-icon" aria-hidden="true">${esc(group.icon)}</span>
    <span class="cqd-chore-sheet-name"><strong>${esc(group.name)}${group.count > 1 ? ` x${group.count}` : ''}</strong>${group.es ? `<small lang="es">${esc(group.es)}</small>` : ''}
      ${group.by === 'parent' ? '<small>A grown-up wrote this in.</small>' : ''}</span>
    <span class="cqd-chore-sheet-job-meta">${group.cents === null ? '' : `<strong>${money(group.cents) + (group.count > 1 ? ' each' : '')}</strong>`}${status}</span></li>`;
}

const jobs = (count) => `${count} ${count === 1 ? 'job' : 'jobs'}`;
const mathFields = [['totalCents', 'My total for the week'], ['giveCents', 'Give 10%'], ['saveCents', 'Save 20%'], ['spendCents', 'Spend 70%']];
function mathHtml(chores, monday, todayIso) {
  if (monday > weekMonday(todayIso)) return '';
  const saved = chores.math[monday];
  const editable = weekMathEditable(chores, monday, todayIso);
  return `<section class="cqd-chore-math"><h2>My money math</h2>
    <p>Add up your confirmed jobs, then split your total. A grown-up checks it.</p>
    <div class="cqd-chore-math-grid">${mathFields.map(([key, label]) => editable
    ? `<label>${label}<span class="cqd-chore-money-input"><span>$</span><input type="text" inputmode="decimal" data-chore-math="${key}" value="${saved?.[key] === null || saved?.[key] === undefined ? '' : (saved[key] / 100).toFixed(2)}"></span></label>`
    : `<div><strong>${label}</strong><span>${saved?.[key] === null || saved?.[key] === undefined ? '—' : money(saved[key])}</span></div>`).join('')}</div>
    ${editable ? `<button type="button" class="cqd-button" data-action="chore-math-save" data-monday="${monday}">Save my math</button>` : '<p>Locked after payday.</p>'}
    <p class="cqd-chore-feedback" data-chore-math-status role="status"></p></section>`;
}
function savingsHtml(chores, monday, todayIso) {
  const uses = Object.values(chores.savingsUsed).filter((record) => weekMonday(record.date) === monday)
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt) || b.id.localeCompare(a.id));
  return `<section class="cqd-chore-savings"><h2>Savings I used</h2>
    ${monday === weekMonday(todayIso) ? `<div class="cqd-chore-savings-form"><label>How much did you use?<span class="cqd-chore-money-input"><span>$</span><input type="text" inputmode="decimal" data-chore-savings-cents></span></label>
    <label>What did you use it for?<input type="text" maxlength="120" data-chore-savings-why></label>
    <button type="button" class="cqd-button" data-action="chore-savings-add">Send to a grown-up</button></div>` : ''}
    <p class="cqd-chore-feedback" data-chore-savings-status role="status"></p>
    ${uses.length ? `<ul class="cqd-chore-savings-list">${uses.map((record) => `<li><strong>${money(record.cents)}</strong> ${esc(record.why)} <small>${esc(shortDate(record.date))}</small>
      <span class="cqd-chore-chip ${record.status === 'approved' ? 'ok' : record.status === 'declined' ? 'back' : 'wait'}">${record.status === 'approved' ? '✓ Approved' : record.status === 'declined' ? '↩ Not approved. Ask a grown-up.' : '⏳ Waiting for a grown-up'}</span>
      ${record.status === 'waiting' && record.date === todayIso ? `<button type="button" class="cqd-chore-remove" data-action="chore-savings-remove" data-id="${esc(record.id)}" aria-label="Remove savings use">×</button>` : ''}</li>`).join('')}</ul>` : '<p>None this week.</p>'}</section>`;
}

export function renderChoreSheet(store, todayIso, mondayIso) {
  const chores = choresOf(store);
  const { earliest, latest } = choreSheetBounds(store, todayIso);
  const monday = weekMonday(mondayIso) === mondayIso && mondayIso >= earliest && mondayIso <= latest ? mondayIso : latest;
  const dates = weekDates(monday);
  const earlier = nextWeek(monday, -1);
  const later = nextWeek(monday, 1);
  const totals = weekTotals(chores, monday);
  const paid = chores.paid[monday];
  const weekStatus = paid
    ? `<span class="cqd-chore-sheet-paid">PAID · ${esc(stampDate(paid.paidAt))}</span>`
    : `<p class="cqd-chore-sheet-payment">${dates[6] >= todayIso ? 'This week is still going.' : totals.confirmedJobs + totals.waitingJobs + totals.declinedJobs ? 'Not paid yet.' : 'No chores this week.'}</p>`;
  return `<section class="cqd-chore-sheet-screen">
    <div class="cqd-sheet-nav"><button type="button" class="cqd-link-button" data-action="open-chores">← My chores</button></div>
    <div class="cqd-chore-sheet-paper"><header class="cqd-chore-sheet-header"><span class="cqd-chore-eyebrow">My chore sheet</span>
      <h1>Week of ${esc(shortDate(monday))}</h1><p>${esc(dateLabel(dates[0], 'short'))} to ${esc(dateLabel(dates[6], 'short'))}</p>
      ${monday === latest ? '<span class="cqd-chore-sheet-current">This week</span>' : ''}</header>
    <nav class="cqd-chore-sheet-nav" aria-label="Chore sheet weeks">
      <button type="button" data-action="chore-sheet-week" data-monday="${earlier}" ${monday <= earliest ? 'disabled' : ''}>← Earlier week</button>
      <button type="button" data-action="chore-sheet-week" data-monday="${later}" ${monday >= latest ? 'disabled' : ''}>Later week →</button></nav>
    <ol class="cqd-chore-sheet-days">${dates.map((date) => {
      const future = date > todayIso;
      // A grown-up can write a job in on a later day; show it so the totals below never count a hidden job.
      const entries = dayEntries(chores, date);
      return `<li class="cqd-chore-sheet-day${future ? ' is-future' : ''}"><h2>${esc(dateLabel(date))}${date === todayIso ? ' <small>today</small>' : ''}</h2>
        ${entries.length
    ? `<ul class="cqd-chore-sheet-jobs">${groupsForDay(entries).map(jobHtml).join('')}</ul>`
    : `<p class="cqd-chore-sheet-empty">${future ? 'Not yet.' : 'No jobs.'}</p>`}
      </li>`;
    }).join('')}</ol>
    ${mathHtml(chores, monday, todayIso)}
    <section class="cqd-chore-sheet-summary" aria-label="Week summary"><h2>Week summary</h2>
      <div class="cqd-chore-sheet-totals"><p><strong>Confirmed:</strong> <span>${jobs(totals.confirmedJobs)}</span></p>
      <p><strong>Waiting for a grown-up:</strong> <span>${jobs(totals.waitingJobs)}</span></p>
      ${totals.declinedJobs ? `<p><strong>Ask a grown-up:</strong> <span>${totals.declinedJobs} ${totals.declinedJobs === 1 ? 'job' : 'jobs'}</span></p>` : ''}</div>
      ${weekStatus}</section>
    ${savingsHtml(chores, monday, todayIso)}
    <p class="cqd-chore-sheet-note">Every week stays here on this iPad. Tap ← Earlier week to look back.</p></div></section>`;
}
