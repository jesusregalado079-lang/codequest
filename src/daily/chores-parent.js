// Parent Mode chore screens. HTML only: actions and storage live in app.js.
import { activeJobs, catalogFor, dayEntries, monthKey, monthRightAmounts, savingsSoFarCents, splitCents, summarize, weekDates, weekEntries, weekMonday } from './chores.js';
import { choresOf } from './store.js';

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
const money = (cents) => `$${(cents / 100).toFixed(2)}`;
const dateObj = (iso) => new Date(`${iso}T12:00:00Z`);
const shortDate = (iso) => dateObj(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const fullDate = (iso) => dateObj(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' });
const dayLabel = (iso) => dateObj(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
const monthName = (key) => key ? dateObj(`${key}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : '';
const time = (iso) => new Date(iso).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' });
const stampDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const disabled = (paid) => paid ? ' disabled' : '';
const button = (action, label, extra = '', cls = '', display = label) => `<button type="button" class="cqd-chore-parent-button ${cls}" data-action="${action}" aria-label="${esc(label)}" ${extra}>${esc(display)}</button>`;
const priceInput = (value, label, attr, paid = false) => `<label class="cqd-chore-parent-money"><span>$</span><input type="number" min="0" max="1000" step="0.01" inputmode="decimal" value="${value === null ? '' : (value / 100).toFixed(2)}" aria-label="${esc(label)}" ${attr}${disabled(paid)}></label>`;

export function choreWaitingCount(store) {
  const chores = choresOf(store);
  return Object.values(chores.entries).filter((entry) => entry.status === 'waiting' && !chores.paid[weekMonday(entry.date)]).length;
}

export function initializeChoreParentState(store, state, todayIso) {
  const chores = choresOf(store);
  if (!state.weekMonday) {
    const waiting = Object.values(chores.entries).filter((entry) => entry.status === 'waiting' && !chores.paid[weekMonday(entry.date)]).sort((a, b) => a.date.localeCompare(b.date));
    state.day = waiting.length ? waiting[waiting.length - 1].date : todayIso;
    state.weekMonday = weekMonday(state.day);
  }
  const dates = weekDates(state.weekMonday);
  if (!dates.includes(state.day)) state.day = dates.includes(todayIso) ? todayIso : dates[0];
}

function entryHtml(entry, paid) {
  const label = `${entry.name}, ${entry.cents === null ? 'unpriced' : money(entry.cents)}`;
  const status = entry.status;
  return `<div class="cqd-chore-parent-item" data-entry="${esc(entry.id)}">
    <span class="cqd-chore-parent-icon" aria-hidden="true">${esc(entry.icon)}</span>
    <div class="cqd-chore-parent-name"><strong>${esc(entry.name)}</strong>${entry.es ? `<small lang="es">${esc(entry.es)}</small>` : ''}
      <small>Added ${esc(time(entry.addedAt))} by ${entry.by === 'parent' ? 'grown-up' : 'boy'} · ${entry.cents === null ? 'Price needed' : money(entry.cents)}</small></div>
    <div class="cqd-chore-parent-controls">
      ${entry.cents === null ? `${priceInput(null, `Price for ${entry.name} in dollars`, `data-entry-price="${esc(entry.id)}"`, paid)}${button('chores-set-entry-price', `Set price for ${entry.name}`, `data-id="${esc(entry.id)}"${disabled(paid)}`, '', 'Set price')}` : ''}
      <div class="cqd-chore-parent-pick" role="group" aria-label="Check ${esc(entry.name)}">
        ${button('chores-entry-status', status === 'confirmed' ? `Confirmed ${label}` : `Confirm ${label}`, `data-id="${esc(entry.id)}" data-status="confirmed" aria-pressed="${status === 'confirmed'}"${disabled(paid || entry.cents === null)}`, status === 'confirmed' ? 'is-confirmed' : '', status === 'confirmed' ? '✓ Confirmed' : 'Confirm')}
        ${button('chores-entry-status', `Not done ${label}`, `data-id="${esc(entry.id)}" data-status="declined" aria-pressed="${status === 'declined'}"${disabled(paid)}`, status === 'declined' ? 'is-declined' : '', 'Not done')}
        ${button('chores-remove-entry', `Remove ${label}`, `data-id="${esc(entry.id)}"${disabled(paid)}`, 'cqd-chore-parent-trash', '🗑️')}
      </div>
    </div></div>`;
}

function checkHtml(store, state, todayIso) {
  const chores = choresOf(store);
  const dates = weekDates(state.weekMonday);
  const paid = chores.paid[state.weekMonday];
  const day = state.day;
  const entries = dayEntries(chores, day);
  const waiting = weekEntries(chores, state.weekMonday).filter((entry) => entry.status === 'waiting');
  const pricedWaiting = waiting.filter((entry) => entry.cents !== null);
  const skipped = waiting.length - pricedWaiting.length;
  const selectable = activeJobs(store.track, chores);
  const daySkipped = entries.filter((entry) => entry.status === 'waiting' && entry.cents === null).length;
  return `<div class="cqd-chore-parent-heading"><div><h1>Check chores</h1><p>Confirm what you saw. Only confirmed jobs count toward pay.</p></div>${button('chores-jobs', 'Job list and prices')}</div>
    <div class="cqd-chore-parent-week"><button type="button" data-action="chores-prev-week" aria-label="Previous chore week">←</button><strong>${esc(shortDate(dates[0]))} – ${esc(shortDate(dates[6]))}</strong><button type="button" data-action="chores-next-week" aria-label="Next chore week">→</button></div>
    <div class="cqd-chore-parent-days" role="group" aria-label="Days of this chore week">${dates.map((date) => {
      const count = summarize(dayEntries(chores, date)).waitingJobs;
      return `<button type="button" data-action="chores-day" data-date="${date}" aria-label="${esc(fullDate(date))}${count ? `, ${count} to check` : ''}" aria-pressed="${date === day}" class="${date === todayIso ? 'is-today' : ''}"><strong>${esc(dateObj(date).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }))} ${esc(date.slice(-2).replace(/^0/, ''))}</strong><small>${count ? `${count} to check` : ''}${date === todayIso ? ' · today' : ''}</small></button>`;
    }).join('')}</div>
    ${paid ? `<div class="cqd-chore-parent-banner" role="status">Paid on ${esc(stampDate(paid.paidAt))}: ${money(paid.cents)}. This week is locked. ${button('chores-reopen-week', 'Reopen this week')}</div>` : ''}
    <section class="cqd-chore-parent-card"><h2>${esc(fullDate(day))}</h2>${entries.length ? entries.map((entry) => entryHtml(entry, !!paid)).join('') : '<p>No jobs for this day.</p>'}
      ${button('chores-confirm-day', `Confirm all of ${fullDate(day)}`, `${disabled(!!paid)}`, 'is-green')}${daySkipped ? `<p class="cqd-chore-parent-note">${daySkipped} unpriced ${daySkipped === 1 ? 'job will be' : 'jobs will be'} skipped.</p>` : ''}</section>
    <section class="cqd-chore-parent-card"><h2>Whole week at once</h2><p>${waiting.length} to check · ${money(pricedWaiting.reduce((sum, entry) => sum + entry.cents, 0))} priced</p>
      ${button('chores-confirm-week', `Confirm the whole week (${money(pricedWaiting.reduce((sum, entry) => sum + entry.cents, 0))})`, `${disabled(!!paid)}`, 'is-green')}
      <p class="cqd-chore-parent-note">${skipped} unpriced ${skipped === 1 ? 'job' : 'jobs'} will be skipped. Jobs marked Not done stay that way.</p></section>
    <section class="cqd-chore-parent-card"><h2>Add a job for ${esc(fullDate(day))}</h2><div class="cqd-chore-parent-form">
      <label>Job<select data-chores-add-job aria-label="Job to add"${disabled(!!paid)}>${selectable.map((job) => `<option value="${esc(job.id)}">${esc(job.icon)} ${esc(job.name)} · ${money(job.cents)}</option>`).join('')}<option value="other">Something else</option></select></label>
      <label>Name for something else<input data-chores-other-name maxlength="80" aria-label="Name for something else"${disabled(!!paid)}></label>
      ${priceInput(null, 'Price for something else in dollars', 'data-chores-other-price', !!paid)}
      ${button('chores-add-entry', `Add a job for ${fullDate(day)}`, `${disabled(!!paid)}`, 'is-green')}</div><p class="cqd-chore-parent-note">For Something else, enter its name and price.</p></section>
    ${savingsParentHtml(chores)}
    ${payHtml(store, state, todayIso)}`;
}

function mathParentHtml(chores, monday, total, split) {
  const math = chores.math[monday];
  const rows = [['Total', 'totalCents', total], ['Give 10%', 'giveCents', split?.give],
    ['Save 20%', 'saveCents', split?.save], ['Spend 70%', 'spendCents', split?.spend]];
  return `<section class="cqd-chore-parent-math"><h3>His money math</h3>
    ${math ? `<div class="cqd-chore-parent-table-wrap"><table><thead><tr><th></th><th>He wrote</th><th>Right amount</th></tr></thead><tbody>
    ${rows.map(([label, key, right]) => `<tr><th>${label}</th><td>${math[key] === null ? '—' : `${money(math[key])}${math[key] === right ? ' ✓' : ''}`}</td><td>${right === undefined ? '—' : money(right)}</td></tr>`).join('')}
    </tbody></table></div>` : '<p>He has not done his money math for this week yet.</p>'}
    <p class="cqd-chore-parent-note">A cent off can be rounding.</p></section>`;
}
function moneyPageParentHtml(chores, month) {
  const record = (chores.months || {})[month];
  const right = monthRightAmounts(chores, month);
  const rows = [['Total earned', 'totalEarnedCents', right.earned], ['Total given', 'totalGivenCents', right.given],
    ['Total saved', 'totalSavedCents', right.saved], ['Total spent', 'totalSpentCents', right.spent],
    ['Savings I have now', 'savingsNowCents', right.savingsNow]];
  const moneyLine = (label, key) => `<p><strong>${label}</strong> ${record[key] === null ? '—' : money(record[key])}</p>`;
  return `<section class="cqd-chore-parent-card cqd-chore-parent-money-page"><h2>His money page · ${esc(monthName(month))}</h2>
    ${record ? `<div class="cqd-chore-parent-table-wrap"><table><thead><tr><th></th><th>He wrote</th><th>Right amount</th></tr></thead><tbody>
      ${rows.map(([label, key, value]) => { const correct = right.paidWeeks || key === 'savingsNowCents' ? value : null; return `<tr><th>${label}</th><td>${record[key] === null ? '—' : `${money(record[key])}${correct !== null && record[key] === correct ? ' ✓' : ''}`}</td><td>${correct === null ? '—' : money(correct)}</td></tr>`; }).join('')}</tbody></table></div>
      ${right.savingsNow === null ? '<p class="cqd-chore-parent-note">Needs his Savings from last month.</p>' : ''}
      <p class="cqd-chore-parent-note">${right.paidWeeks ? `Right amounts come from the ${right.paidWeeks} paid ${right.paidWeeks === 1 ? 'week' : 'weeks'} in ${esc(monthWord(month))}. A cent off can be rounding.` : `No paid weeks in ${esc(monthWord(month))} yet, so there is nothing to check the totals against.`}</p>
      <div class="cqd-chore-parent-money-details"><p><strong>I am saving for:</strong> ${esc(record.goalFor || '—')}</p>
      ${moneyLine('It costs about:', 'goalCostCents')}${moneyLine('I have saved so far:', 'goalSavedCents')}
      ${moneyLine('Savings from last month:', 'savingsFromLastCents')}${moneyLine('Spending money from last month:', 'spendingFromLastCents')}
      ${moneyLine('Spending money I have now:', 'spendingNowCents')}
      <p><strong>Saving for this month:</strong> ${esc(record.savingForMonth || '—')}</p>${moneyLine('My earning goal:', 'earningGoalCents')}</div>`
    : `<p>He has not filled in his money page for ${esc(monthWord(month))} yet.</p>`}</section>`;
}
const monthWord = (key) => key ? dateObj(`${key}-01`).toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' }) : '';

function savingsParentHtml(chores) {
  const all = Object.values(chores.savingsUsed).sort((a, b) => b.addedAt.localeCompare(a.addedAt) || b.id.localeCompare(a.id));
  const waiting = all.filter((record) => record.status === 'waiting');
  const decided = all.filter((record) => record.status !== 'waiting').slice(0, 20);
  const row = (record) => `<li><strong>${esc(shortDate(record.date))} · ${money(record.cents)}</strong> ${esc(record.why)}
    <span class="cqd-chore-chip ${record.status === 'approved' ? 'ok' : record.status === 'declined' ? 'back' : 'wait'}">${record.status === 'approved' ? '✓ Approved' : record.status === 'declined' ? '↩ Not approved' : '⏳ Waiting for a grown-up'}</span>
    ${record.checkedAt ? `<small>Checked ${esc(stampDate(record.checkedAt))}</small>` : ''}
    ${record.status !== 'approved' ? button('chores-savings-approve', 'Approve', `data-id="${esc(record.id)}"`) : ''}
    ${record.status !== 'declined' ? button('chores-savings-decline', 'Not approved', `data-id="${esc(record.id)}"`) : ''}</li>`;
  const balance = savingsSoFarCents(chores);
  return `<section class="cqd-chore-parent-card"><h2>Savings he used</h2>
    <p>Saved so far, by the app: ${balance < 0 ? '-' : ''}${money(Math.abs(balance))}</p>
    ${waiting.length ? `<ul class="cqd-chore-savings-list">${waiting.map(row).join('')}</ul>` : '<p>No requests waiting.</p>'}
    ${decided.length ? `<h3>Checked</h3><ul class="cqd-chore-savings-list">${decided.map(row).join('')}</ul>` : ''}</section>`;
}

function payHtml(store, state, todayIso) {
  const chores = choresOf(store);
  const dates = weekDates(state.weekMonday);
  const entries = weekEntries(chores, state.weekMonday);
  const sum = summarize(entries);
  const paid = chores.paid[state.weekMonday];
  const totalCents = paid ? paid.cents : sum.confirmedCents;
  const split = totalCents <= 100000 ? splitCents(totalCents) : null;
  const history = Object.entries(chores.paid).sort(([a], [b]) => b.localeCompare(a));
  const month = monthKey(todayIso);
  const monthSum = summarize(Object.values(chores.entries).filter((entry) => monthKey(entry.date) === month && entry.date <= todayIso));
  return `<section class="cqd-chore-parent-card"><h2>Pay the week</h2><div class="cqd-chore-parent-table-wrap"><table><thead><tr><th>Day</th><th>Jobs</th><th>Not done</th><th>Confirmed</th></tr></thead><tbody>${dates.map((date) => {
    const day = summarize(dayEntries(chores, date));
    return `<tr><th>${esc(dayLabel(date))}</th><td>${day.confirmedJobs + day.waitingJobs + day.declinedJobs}</td><td>${day.declinedJobs}</td><td>${money(day.confirmedCents)}</td></tr>`;
  }).join('')}<tr class="is-total"><th>Week</th><td>${entries.length}</td><td>${sum.declinedJobs}</td><td>${money(sum.confirmedCents)}</td></tr></tbody></table></div>
  ${mathParentHtml(chores, state.weekMonday, totalCents, split)}
  ${split ? `<div class="cqd-chore-parent-split"><div><strong>${money(split.give)}</strong><small>Give 10%</small></div><div><strong>${money(split.save)}</strong><small>Save 20%</small></div><div><strong>${money(split.spend)}</strong><small>Spend 70%</small></div></div><p class="cqd-chore-parent-note">The 10/20/70 split is a guide.</p>` : '<p class="cqd-chore-parent-note">Guide unavailable for this amount.</p>'}</section>
  <section class="cqd-chore-parent-card"><div class="cqd-chore-parent-pay-actions">${button('chores-pay-week', `Mark the week as paid · ${money(sum.confirmedCents)}`, `${disabled(!!paid || !!sum.waitingJobs || !sum.confirmedJobs)}`, 'is-green')}
  </div>
  ${paid ? '<p>Week paid and locked.</p>' : sum.waitingJobs ? `<p>Check the ${sum.waitingJobs} waiting jobs first.</p>` : !sum.confirmedJobs ? '<p>Nothing confirmed yet.</p>' : '<p>Marking paid locks this week and keeps a record.</p>'}</section>
  ${moneyPageParentHtml(chores, monthKey(state.weekMonday))}
  <section class="cqd-chore-parent-card"><h2>Paid so far</h2><div class="cqd-chore-parent-table-wrap"><table><thead><tr><th>Week</th><th>Paid on</th><th>Amount</th></tr></thead><tbody>${history.map(([monday, record]) => `<tr><th>Week of ${esc(shortDate(monday))}</th><td>${esc(stampDate(record.paidAt))}</td><td>${money(record.cents)}</td></tr>`).join('') || '<tr><td colspan="3">No paid weeks yet.</td></tr>'}</tbody></table></div><p class="cqd-chore-parent-month">This month (${esc(monthName(month))}): ${money(monthSum.confirmedCents)} confirmed</p></section>`;
}

function jobsHtml(store) {
  const chores = choresOf(store);
  return `<div class="cqd-chore-parent-heading"><div><h1>Job list and prices</h1><p>${store.track === 'guided' ? 'Younger son' : 'Older son'}. Turn a job off to hide it. Old weeks keep the price they were paid at.</p></div>${button('chores-check', 'Back to check chores')}</div>
    <section class="cqd-chore-parent-card">${catalogFor(store.track, chores).map((job) => `<div class="cqd-chore-parent-item" data-job-id="${esc(job.id)}"><span class="cqd-chore-parent-icon" aria-hidden="true">${esc(job.icon)}</span><span class="cqd-chore-parent-name"><strong>${esc(job.name)}</strong><small lang="es">${esc(job.es)}</small></span>
      <div class="cqd-chore-parent-job-controls">${priceInput(job.cents, `Price for ${job.name} in dollars`, `data-job-price="${esc(job.id)}"`)}
      <button type="button" data-action="chores-toggle-job" data-id="${esc(job.id)}" aria-label="${job.active ? 'Turn off' : 'Turn on'} ${esc(job.name)}" aria-pressed="${job.active}" class="cqd-chore-parent-toggle">${job.active ? 'On' : 'Off'}</button>
      ${job.custom ? button('chores-remove-job', `Remove ${job.name}`, `data-id="${esc(job.id)}"`, 'cqd-chore-parent-trash', '🗑️') : ''}</div></div>`).join('')}</section>
    <section class="cqd-chore-parent-card"><h2>Add a job</h2><div class="cqd-chore-parent-form"><label>English name<input data-custom-name maxlength="80" aria-label="New job English name"></label><label>Spanish name (optional)<input data-custom-es maxlength="80" aria-label="New job Spanish name"></label><label>Icon<select data-custom-icon aria-label="New job icon">${['⭐', '🧹', '🧺', '🧽', '🐱', '🍽️', '🌿'].map((icon) => `<option value="${esc(icon)}">${esc(icon)}</option>`).join('')}</select></label>${priceInput(null, 'New job price in dollars', 'data-custom-price')}${button('chores-add-job', 'Add a job', '', 'is-green')}</div></section>`;
}

export function renderChoresParent(store, state, todayIso) {
  initializeChoreParentState(store, state, todayIso);
  return `<section class="cqd-parent cqd-chore-parent"><header class="cqd-calendar-head"><span class="cqd-eyebrow">PARENT MODE · CHORES · ${store.track === 'guided' ? 'YOUNGER SON' : 'OLDER SON'}</span></header>
    <p class="cqd-chore-parent-message" role="status" aria-live="polite">${esc(state.choreMessage || '')}</p>
    ${state.choresView === 'jobs' ? jobsHtml(store) : checkHtml(store, state, todayIso)}
    <section class="cqd-chore-parent-card cqd-chore-backup"><h2>Backup</h2>
      ${button('chores-export-backup', 'Export backup file')}
      <label>Import a backup file<input type="file" accept=".json,application/json" data-chores-backup-file></label>
      <label class="cqd-chore-backup-replace"><input type="checkbox" data-chores-backup-replace> Replace everything here</label>
      <p class="cqd-chore-parent-note">Replace erases the chores on this iPad and uses the file instead. Leave it unchecked to only add what is missing.</p>
      ${button('chores-import-backup', 'Import a backup file')}
      <p class="cqd-chore-parent-message cqd-chore-backup-message" data-backup-status role="status" aria-live="polite">${esc(state.backupMessage || '')}</p>
    </section></section>`;
}
