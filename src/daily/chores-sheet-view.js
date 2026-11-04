// The boy's saved week, shown without changing chore records.
import { dayEntries, groupByJob, summarize, weekDates, weekMonday, weekTotals } from './chores.js';
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
    <span class="cqd-chore-sheet-job-meta">${group.cents === null ? '' : `<strong>${money(group.cents * group.count)}</strong>`}${status}</span></li>`;
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
    ? `<span class="cqd-chore-sheet-paid">PAID · ${esc(stampDate(paid.paidAt))} · ${money(paid.cents)}</span>`
    : `<p class="cqd-chore-sheet-payment">${dates[6] < todayIso ? 'Not paid yet.' : 'This week is still going.'}</p>`;
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
      const entries = future ? [] : dayEntries(chores, date);
      const confirmed = summarize(entries).confirmedCents;
      return `<li class="cqd-chore-sheet-day${future ? ' is-future' : ''}"><h2>${esc(dateLabel(date))}${date === todayIso ? ' <small>today</small>' : ''}</h2>
        ${future ? '<p class="cqd-chore-sheet-empty">Not yet.</p>' : entries.length
    ? `<ul class="cqd-chore-sheet-jobs">${groupsForDay(entries).map(jobHtml).join('')}</ul>`
    : '<p class="cqd-chore-sheet-empty">No jobs.</p>'}
        ${confirmed > 0 ? `<p class="cqd-chore-sheet-day-total">Confirmed: ${money(confirmed)}</p>` : ''}</li>`;
    }).join('')}</ol>
    <section class="cqd-chore-sheet-summary" aria-label="Week summary"><h2>Week summary</h2>
      <div class="cqd-chore-sheet-totals"><p><strong>Confirmed</strong> <span>${money(totals.confirmedCents)}</span></p>
      <p><strong>Waiting for a grown-up</strong> <span>${money(totals.waitingCents)}</span></p>
      ${totals.declinedJobs ? `<p><strong>Ask a grown-up</strong> <span>${totals.declinedJobs} ${totals.declinedJobs === 1 ? 'job' : 'jobs'}</span></p>` : ''}</div>
      ${weekStatus}</section>
    <p class="cqd-chore-sheet-note">Every week stays here on this iPad. Tap ← Earlier week to look back.</p></div></section>`;
}
