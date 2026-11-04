import { activeJobs, dayEntries, groupByJob, monthKey, monthTotals, weekDates, weekMonday, weekTotals } from './chores.js';
import { choresOf } from './store.js';

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
const money = (cents) => `$${(cents / 100).toFixed(2)}`;
// Read aloud: "1 dollar 50 cents", never "150 cents".
const spoken = (cents) => {
  const dollars = Math.floor(cents / 100); const rest = cents % 100; const parts = [];
  if (dollars) parts.push(`${dollars} ${dollars === 1 ? 'dollar' : 'dollars'}`);
  if (rest) parts.push(`${rest} ${rest === 1 ? 'cent' : 'cents'}`);
  return parts.join(' ') || 'no money';
};
const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const longDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
function dateLabel(iso, weekday = 'long') {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { weekday, month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export function renderChores(store, todayIso, selectedIso = todayIso, message = '') {
  const chores = choresOf(store);
  const monday = weekMonday(todayIso);
  const dates = weekDates(monday);
  const selected = dates.includes(selectedIso) && selectedIso <= todayIso ? selectedIso : todayIso;
  const isToday = selected === todayIso;
  const entries = dayEntries(chores, selected);
  const groups = groupByJob(entries);
  const weekly = weekTotals(chores, monday);
  const monthly = monthTotals(chores, monthKey(todayIso));
  const dayPills = dates.map((date, index) => {
    const count = dayEntries(chores, date);
    const waiting = count.filter((entry) => entry.status === 'waiting').length;
    const label = `${shortDays[index]} ${Number(date.slice(-2))}`;
    const small = count.length ? `${count.length} ${count.length === 1 ? 'job' : 'jobs'}${waiting ? ` · ${waiting} ⏳` : ''}` : '&nbsp;';
    return date > todayIso
      ? `<button type="button" class="cqd-chore-day dim" aria-pressed="false" disabled>${label}<small>${small}</small></button>`
      : `<button type="button" class="cqd-chore-day ${date === selected ? 'on' : ''}" data-action="chore-day" data-date="${date}" aria-pressed="${date === selected}">${label}<small>${small}</small></button>`;
  }).join('');
  const loggedToday = dayEntries(chores, todayIso);
  const jobs = isToday ? `<section class="cqd-chore-card"><h2>Tap the jobs you did</h2>
    <div class="cqd-chore-grid">${activeJobs(store.track, chores).map((job) => {
      const count = loggedToday.filter((entry) => entry.jobId === job.id).length;
      return `<button type="button" class="cqd-chore-job ${count ? 'done' : ''}" data-action="chore-add" data-job="${esc(job.id)}" data-date="${todayIso}" aria-label="${esc(job.name)}, ${spoken(job.cents)}, ${count ? `added ${count === 1 ? 'once' : `${count} times`} today, tap to add again` : 'tap to add'}">
        <span class="cqd-chore-job-icon" aria-hidden="true">${esc(job.icon)}</span><span class="cqd-chore-price">${money(job.cents)}</span>
        <b>${esc(job.name)}</b><i>${esc(job.es)}</i>${count ? `<span class="cqd-chore-added">${count > 1 ? `x${count}` : '✓ Added'}</span>` : ''}</button>`;
    }).join('')}</div>
    <div class="cqd-chore-form"><input class="cqd-chore-input" data-chore-other type="text" maxlength="80" aria-label="Something else I did" placeholder="Something else I did…"><button type="button" class="cqd-chore-add-button" data-action="chore-add-other" data-date="${todayIso}">Add</button></div>
    <p class="cqd-chore-note">A grown-up picks the price when they check it.</p></section>` : '';
  const rows = groups.map((group) => {
    const removable = isToday && group.status === 'waiting' && group.entries.some((entry) => entry.by === 'kid');
    const removableEntry = removable ? group.entries.find((entry) => entry.by === 'kid') : null;
    const chip = group.status === 'confirmed' ? '<span class="cqd-chore-chip ok">✓ Confirmed</span>'
      : group.status === 'declined' ? '<span class="cqd-chore-chip back">↩ Ask a grown-up</span>'
        : `<span class="cqd-chore-chip wait">⏳ ${group.cents === null ? 'Waiting, a grown-up picks the price' : 'Waiting for a grown-up'}</span>`;
    return `<li class="cqd-chore-row"><span class="cqd-chore-row-icon" aria-hidden="true">${esc(group.icon)}</span>
      <span class="cqd-chore-name">${esc(group.name)}${group.count > 1 ? ` x${group.count}` : ''}<small>${esc(group.es)}</small></span>
      <span class="cqd-chore-meta"><span class="cqd-chore-amount">${group.cents === null ? '' : money(group.cents * group.count)}</span>${chip}</span>
      ${removableEntry ? `<button type="button" class="cqd-chore-remove" data-action="chore-remove" data-id="${esc(removableEntry.id)}" data-date="${todayIso}" aria-label="Remove one ${esc(group.name)} entry">×</button>` : ''}</li>`;
  }).join('');
  return `<div class="cqd-sheet-nav"><button type="button" class="cqd-link-button" data-action="back-to-calendar">← This week</button></div>
    <section class="cqd-chore-screen"><span class="cqd-chore-eyebrow">My chores · ${esc(dateLabel(todayIso))}</span>
    <h1>What did you do today?</h1><p class="cqd-chore-lead">Tap a job when you finish it. A grown-up checks it, and then you get paid.</p>
    <nav class="cqd-chore-days" aria-label="Days this week">${dayPills}</nav>
    <button type="button" class="cqd-button cqd-chore-sheet-open" data-action="open-chore-sheet">📄 My chore sheet</button>
    ${!isToday ? `<p class="cqd-chore-banner">Looking back at ${longDays[dates.indexOf(selected)]}. You can only add jobs for today. If you forgot one, ask a grown-up.</p>` : ''}
    ${message ? `<p class="cqd-chore-message" role="alert">${esc(message)}</p>` : ''}
    ${jobs}<section class="cqd-chore-card"><h2>${isToday ? 'Today' : longDays[dates.indexOf(selected)]} I did</h2>
    ${rows ? `<ul class="cqd-chore-rows">${rows}</ul>` : '<p class="cqd-chore-empty">No jobs logged for this day yet.</p>'}
    <div class="cqd-chore-totals" aria-live="polite"><div class="a"><strong>${money(weekly.confirmedCents)}</strong><small>Confirmed this week</small></div>
    <div class="b"><strong>${money(weekly.waitingCents)}</strong><small>Waiting for a grown-up</small></div>
    <div class="c"><strong>${money(monthly.confirmedCents)}</strong><small>This month</small></div></div>
    <p class="cqd-chore-note">The x only works until a grown-up has checked it.</p></section></section>`;
}
