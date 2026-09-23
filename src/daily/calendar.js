// The landing screen. Two things live here now (2026-09-22 month-view revision):
// - A full MONTH grid, not just the current week's 5 tiles — Jesse wants the boys to look back at
//   what they did across past months, and forward isn't meaningful yet (no future content exists).
//   Only the real calendar week containing "today" ever has live, clickable content; every other
//   cell in the grid is either a read-only history snapshot (see store.js's snapshotHistory) or
//   blank. Content genuinely rotates out month to month (doc §0a) — this is what makes history
//   survive that instead of silently vanishing with the old week's content.
// - A button to the memory-verse reference screen (moved off the calendar's own body, which is now
//   a full month grid with no natural room for it inline) rather than always-inline as before.
import { DAILY_WORK } from '../cq/daily-work/content.js';
import { currentWeek } from '../cq/daily-work/schedule.js';
import { allItems, hasFixes, isComplete, storedDay, storedItem } from '../cq/daily-work/daily-work-ui.js';
import { historyFor } from './store.js';
import { sheetsForDay, weekVerse } from './sheet-view.js';
import { bibleCoverMark, bibleMark, bookMark, calendarRobot, monthIllustration, seasonMark, statusMark } from './calendar-art.js';

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const ALL_DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_LABELS = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday' };
const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const SEASONS = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'fall', 'fall', 'fall', 'winter'];
// Matches app.js's own MIN_MONTHS_BACK/MAX_MONTHS_FORWARD (duplicated, not imported — this stays a
// small pure rendering module, no reverse dependency on the page controller for two constants).
const MONTH_NAV_BACK = 12;
const MONTH_NAV_FORWARD = 1;
const esc = (value) => String(value).replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

// Duplicated from daily-work-parent.js on purpose, not imported: that module also pulls in
// progress.js (the PC hub's codequest-v1 store) for its PIN helpers, and this page must never
// carry even an unused transitive import of that shared storage key. This function itself has no
// storage dependency at all — it only reads the dayState/sheets it's handed.
export function dayStatus(dayState, sheets) {
  if (dayState.submittedAt && isComplete(dayState, sheets)) return 'complete';
  if (hasFixes(dayState, sheets)) return 'needs-fixes';
  if (dayState.submittedAt) return 'awaiting-check';
  if (allItems(sheets).some((item) => storedItem(dayState, item.sheetId, item.id).value !== null)) return 'in-progress';
  return 'not-started';
}

const STATUS_LABELS = {
  'not-started': 'Not started', 'in-progress': 'In progress', 'awaiting-check': 'Waiting on a parent',
  'needs-fixes': 'Fix a few things', complete: 'All done!',
};

function pad2(n) { return String(n).padStart(2, '0'); }
function isoOf(y, m, d) { return `${y}-${pad2(m + 1)}-${pad2(d)}`; }
function partsOf(iso) { return iso.split('-').map(Number); }

// The real Monday-Friday of the calendar week containing todayIso — computed directly from
// today's date, independent of any week's `assignedWeekOf` (which the live content doesn't
// currently set). This is deliberate: it's what actually anchors "today" to real dates for the
// month grid and for history snapshots, regardless of whether content authoring ever starts
// setting assignedWeekOf.
export function realWeekDates(todayIso) {
  const [y, m, d] = partsOf(todayIso);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dow = date.getUTCDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(date.getTime() + mondayOffset * 86400000);
  return DAY_KEYS.map((dayKey, i) => {
    const d2 = new Date(monday.getTime() + i * 86400000);
    return { dayKey, iso: isoOf(d2.getUTCFullYear(), d2.getUTCMonth(), d2.getUTCDate()) };
  });
}

// Live status + week/day identity for each of the current real week's authored days — what
// app.js snapshots into history on every calendar render so "today's" week survives once its
// content eventually rotates out. Pure; writing the snapshot is the caller's job (store.js).
export function currentWeekSnapshots(store, todayIso) {
  const week = currentWeek(DAILY_WORK, store.track, todayIso);
  if (!week) return [];
  return realWeekDates(todayIso).map(({ dayKey, iso }) => {
    const sheets = sheetsForDay(week, dayKey);
    if (!sheets.length) return null;
    return { iso, weekId: week.id, dayKey, status: dayStatus(storedDay(store, week.id, dayKey), sheets) };
  }).filter(Boolean);
}

// A full month grid (Sunday-first, matching US calendar convention), one cell per day plus nulls
// padding the first/last rows out to full weeks. Only cells inside the real current week can ever
// be `clickable` (live content); everything else is a read-only status from history, or blank.
export function buildMonth(store, year, month, todayIso) {
  const week = currentWeek(DAILY_WORK, store.track, todayIso);
  const thisWeek = new Map(realWeekDates(todayIso).map((d) => [d.iso, d.dayKey]));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const leadingBlanks = new Date(Date.UTC(year, month, 1)).getUTCDay();

  const cells = [];
  for (let i = 0; i < leadingBlanks; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    const iso = isoOf(year, month, day);
    const dayKey = ALL_DAY_KEYS[new Date(Date.UTC(year, month, day)).getUTCDay()];
    const isWeekend = dayKey === 'saturday' || dayKey === 'sunday';
    const isCurrentWeek = thisWeek.has(iso);
    let status = null;
    let hasWork = false;
    let clickable = false;
    if (!isWeekend) {
      if (isCurrentWeek && week) {
        const sheets = sheetsForDay(week, dayKey);
        hasWork = sheets.length > 0;
        if (hasWork) { status = dayStatus(storedDay(store, week.id, dayKey), sheets); clickable = true; }
      } else {
        const snapshot = historyFor(store, iso);
        if (snapshot) { status = snapshot.status; hasWork = true; }
      }
    }
    cells.push({ iso, day, dayKey, isWeekend, isToday: iso === todayIso, isCurrentWeek, hasWork, status, clickable });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const monthDate = new Date(Date.UTC(year, month, 1));
  return {
    year, month, cells,
    // timeZone:'UTC' is required here — without it, toLocaleDateString renders monthDate in the
    // browser's LOCAL timezone, and midnight UTC on the 1st is still the evening of the PREVIOUS
    // day anywhere west of Greenwich, silently showing the wrong month name (caught in testing:
    // September 2026 displayed as "August 2026" in Pacific time).
    monthLabel: monthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' }),
    season: SEASONS[month],
  };
}

function monthCellHtml(cell, track) {
  if (!cell) return '<span class="cqd-month-cell cqd-month-blank" aria-hidden="true"></span>';
  const classes = ['cqd-month-cell'];
  if (cell.isWeekend) classes.push('cqd-month-weekend');
  if (cell.isToday) classes.push('is-today');
  if (cell.isCurrentWeek) classes.push('is-current-week');
  if (cell.status) classes.push(`cqd-status-${cell.status}`);
  const label = cell.hasWork ? (STATUS_LABELS[cell.status] || '') : '';
  const accessibleLabel = `${cell.dayKey} ${cell.day}${cell.isToday ? ', today' : ''}${label ? `, ${label}` : ''}${cell.hasWork && !cell.clickable ? ', saved history' : ''}`;
  const contents = `${cell.isToday ? '<span class="cqd-month-today" aria-hidden="true">Today</span>' : ''}
    <span class="cqd-month-daynum">${cell.day}</span>${cell.hasWork ? `<span class="cqd-month-dot" aria-hidden="true">${statusMark(cell.status)}</span>` : ''}`;
  const presentation = cell.hasWork ? ` data-calendar-key="${esc(track)}:${esc(cell.iso)}" data-calendar-status="${esc(cell.status)}"` : '';
  if (cell.clickable) {
    return `<button type="button" class="${classes.join(' ')}" data-action="open-day" data-day="${esc(cell.dayKey)}" data-iso="${esc(cell.iso)}"${presentation} aria-label="${esc(accessibleLabel)}"${cell.isToday ? ' aria-current="date"' : ''}>${contents}</button>`;
  }
  return `<span class="${classes.join(' ')} cqd-month-readonly"${presentation} role="img" aria-label="${esc(accessibleLabel)}"${cell.isToday ? ' aria-current="date"' : ''}>${contents}</span>`;
}

export function renderCalendar(store, todayIso, viewedYear, viewedMonth) {
  const week = currentWeek(DAILY_WORK, store.track, todayIso);
  const verse = week ? weekVerse(week) : null;
  const month = buildMonth(store, viewedYear, viewedMonth, todayIso);
  const weekdayHeader = DAY_INITIALS.map((initial) => `<span class="cqd-month-weekday">${initial}</span>`).join('');
  const grid = month.cells.map((cell) => monthCellHtml(cell, store.track)).join('');
  const verseButton = verse
    ? `<button type="button" class="cqd-button cqd-verse-open" data-action="open-verse">
        <span class="cqd-verse-open-icon" aria-hidden="true">${bibleMark()}${monthIllustration(month.month + 1, 'seal')}</span>
        <span class="cqd-verse-open-copy">This week's memory verse<small>${verse.citation ? `${esc(verse.citation)} · ` : ''}Read it. Say it. Remember it.</small></span>
        <span class="cqd-verse-open-arrow" aria-hidden="true">↗</span>
      </button>`
    : '';
  const [ty, tm] = partsOf(todayIso);
  const monthsFromToday = (viewedYear - ty) * 12 + (viewedMonth - (tm - 1));
  const prevDisabled = monthsFromToday <= -MONTH_NAV_BACK ? 'disabled' : '';
  const nextDisabled = monthsFromToday >= MONTH_NAV_FORWARD ? 'disabled' : '';
  return `<section class="cqd-calendar" data-month="${month.month + 1}" data-season="${esc(month.season)}" data-calendar-month="${month.year * 12 + month.month}">
    <div class="cqd-mascot" aria-hidden="true">${calendarRobot(month.month + 1)}</div>
    <header class="cqd-calendar-head">
      <div class="cqd-calendar-welcome"><span class="cqd-eyebrow">Daily work <span class="cqd-season-label">${seasonMark()} ${esc(month.season)}</span></span>
        <p>One day at a time.</p>
        ${monthIllustration(month.month + 1)}
      </div>
      <div class="cqd-month-nav">
        <button type="button" class="cqd-link-button" data-action="prev-month" aria-label="Previous month" ${prevDisabled}>‹</button>
        <h1 aria-live="polite" aria-atomic="true">${esc(month.monthLabel)}</h1>
        <button type="button" class="cqd-link-button" data-action="next-month" aria-label="Next month" ${nextDisabled}>›</button>
      </div>
    </header>
    <p class="cqd-month-help" id="cqd-month-help"><span class="cqd-live-key" aria-hidden="true"></span>Raised days open this week's work. Other days are a look back or ahead.</p>
    <div class="cqd-month-garden">
      <div class="cqd-month-edge cqd-month-edge-left" aria-hidden="true">${monthIllustration(month.month + 1, 'margin')}</div>
      <div class="cqd-month-edge cqd-month-edge-right" aria-hidden="true">${monthIllustration(month.month + 1, 'margin')}</div>
      <div class="cqd-month-grid" role="group" aria-label="${esc(month.monthLabel)}" aria-describedby="cqd-month-help">
        <div class="cqd-month-weekdays" aria-hidden="true">${weekdayHeader}</div>
        <div class="cqd-month-cells">${grid}</div>
      </div>
      <div class="cqd-month-foot" aria-hidden="true">
        ${monthIllustration(month.month + 1, 'footer-left')}<span class="cqd-month-foot-rule"></span>${monthIllustration(month.month + 1, 'footer-right')}
      </div>
    </div>
    <ul class="cqd-month-key" aria-label="Day status key">${Object.entries(STATUS_LABELS).map(([status, label]) => `<li class="cqd-month-key-item cqd-status-${status}"><span class="cqd-month-dot" aria-hidden="true">${statusMark(status)}</span>${esc(label)}</li>`).join('')}</ul>
    ${verseButton}
  </section>`;
}

export function renderVerseScreen(store, todayIso) {
  const week = currentWeek(DAILY_WORK, store.track, todayIso);
  const verse = week ? weekVerse(week) : null;
  if (!verse) return '<section class="cqd-empty"><h1>No verse this week</h1></section>';
  return `<section class="cqd-verse-screen">
    <div class="cqd-verse-book">
    <div class="cqd-verse-card cqd-verse-card-full">
      <input class="cqd-verse-cover" type="checkbox" id="cqd-verse-cover" aria-describedby="cqd-verse-help">
      <header class="cqd-verse-heading"><span class="cqd-verse-emblem" aria-hidden="true">${bookMark()}</span>
        <span class="cqd-eyebrow">This week's memory verse</span>
        <h1 tabindex="-1">Words to carry with you.</h1>
      </header>
      <div class="cqd-verse-stage">
        <blockquote class="cqd-verse-reading"><p class="cqd-verse-text">${verse.html}</p></blockquote>
        <div class="cqd-verse-recall" aria-hidden="true"><span class="cqd-recall-bubbles">•••</span><strong>Say it from memory.</strong><span>Picture the words. Take your time.</span></div>
      </div>
      ${verse.citation ? `<p class="cqd-verse-citation">${esc(verse.citation)}</p>` : ''}
      <label class="cqd-verse-cover-label" for="cqd-verse-cover"><span class="cqd-verse-switch" aria-hidden="true"></span>Cover the verse</label>
      <p class="cqd-verse-hint" id="cqd-verse-help">Read it aloud, then cover it and try from memory. Uncheck to reveal it.</p>
      <ol class="cqd-verse-steps"><li><strong>Read</strong><span>Hear the words.</span></li><li><strong>Picture</strong><span>Imagine what they mean.</span></li><li><strong>Say</strong><span>Tell Dad on Friday.</span></li></ol>
    </div>
    <div class="cqd-bible-opening" aria-hidden="true">
      <div class="cqd-bible-leaf cqd-bible-leaf-last"><span class="cqd-bible-face"></span><span class="cqd-bible-face cqd-bible-face-back"></span></div>
      <div class="cqd-bible-leaf cqd-bible-leaf-middle"><span class="cqd-bible-face"></span><span class="cqd-bible-face cqd-bible-face-back"></span></div>
      <div class="cqd-bible-leaf cqd-bible-leaf-first"><span class="cqd-bible-face"></span><span class="cqd-bible-face cqd-bible-face-back"></span></div>
      <div class="cqd-bible-cover"><span class="cqd-bible-face cqd-bible-cover-front">${bibleCoverMark()}</span><span class="cqd-bible-face cqd-bible-face-back cqd-bible-cover-back"></span></div>
    </div>
    </div>
  </section>`;
}
