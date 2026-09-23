// Parent grading mode for the dedicated iPad page. Deliberately NOT built on daily-work-parent.js —
// that module imports progress.js (the PC hub's codequest-v1 store plus its whole character/gear
// schema) just to reach its PIN helpers, and pulling that transitively into this page would defeat
// the entire point of giving it its own small, isolated bundle. Grading semantics are duplicated
// here in full (gradeSuggestion/gradeDailyWork) rather than imported, same call as pin.js and
// calendar.js's dayStatus — this page never touches progress.js at all, even unused.
import { DAILY_WORK } from '../cq/daily-work/content.js';
import { currentWeek, weekdayKey } from '../cq/daily-work/schedule.js';
import { coinCounts, coinSummary, coinTotal, displayValue, storedDay, storedItem } from '../cq/daily-work/daily-work-ui.js';
import { checkParentPin, hasParentPin, setParentPin } from './pin.js';
import { load } from './store.js';
import { dayStatus } from './calendar.js';
import { sheetsForDay } from './sheet-view.js';

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const esc = (value) => String(value).replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

export function createParentState() {
  return { open: false, unlocked: false, selectedDay: null, pinMessage: '' };
}

function gradeSuggestion(item, value) {
  if (item.kind === 'numeric') return Number(value) === Number(item.answer);
  if (item.kind === 'fill-blank') {
    return Array.isArray(value) && Array.isArray(item.answer) && value.length === item.answer.length
      && value.every((entry, index) => entry === item.answer[index]);
  }
  if (item.kind === 'coin-total' && item.targetCents !== null && item.targetCents !== undefined) {
    return coinTotal(coinCounts(value)) === item.targetCents;
  }
  if (item.kind === 'coin-total' && item.pile) return Number(value) === Number(item.answer);
  return null;
}

function answerText(item, value) {
  if (value === null || value === undefined) return 'Not answered';
  if (item.kind === 'coin-total' && item.targetCents !== null && item.targetCents !== undefined) return coinSummary(coinCounts(value));
  return displayValue(value);
}

function choiceKey(sheetId, itemId) {
  return `${sheetId}/${itemId}`;
}

export function gradeDailyWork(store, weekId, dayKey, choices, nowIso) {
  const week = DAILY_WORK[store.track] && DAILY_WORK[store.track].weeks && DAILY_WORK[store.track].weeks[weekId];
  if (!week || !DAY_KEYS.includes(dayKey)) return store;
  const selected = choices || {};
  const next = JSON.parse(JSON.stringify(store.dailyWork || { weeks: {} }));
  const weeks = next.weeks || (next.weeks = {});
  const storedWeek = weeks[weekId] || (weeks[weekId] = { days: {} });
  const days = storedWeek.days || (storedWeek.days = {});
  const day = days[dayKey] || (days[dayKey] = { sheets: {}, submittedAt: null });
  const savedSheets = day.sheets || (day.sheets = {});
  sheetsForDay(week, dayKey).forEach((sheet) => {
    const savedSheet = savedSheets[sheet.id] || (savedSheets[sheet.id] = { items: {} });
    const savedItems = savedSheet.items || (savedSheet.items = {});
    (sheet.items || []).forEach((item) => {
      const choice = selected[choiceKey(sheet.id, item.id)];
      if (choice !== 'correct' && choice !== 'wrong') return;
      const prior = savedItems[item.id] || { value: null, status: 'unanswered', checkedAt: null };
      savedItems[item.id] = choice === 'correct'
        ? { ...prior, status: 'correct', checkedAt: nowIso }
        : { ...prior, value: null, status: 'wrong', checkedAt: nowIso };
    });
  });
  return { ...store, dailyWork: next };
}

export async function setDailyParentPin(pin, again) {
  if (pin !== again) return { ok: false, message: 'Those PINs do not match.' };
  try {
    await setParentPin(pin);
    return { ok: true, message: '' };
  } catch {
    return { ok: false, message: 'Use exactly 4 digits.' };
  }
}

export async function checkDailyParentPin(pin, now) {
  try {
    const result = await checkParentPin(pin, now);
    if (result.ok) return { unlocked: true, message: '' };
    return {
      unlocked: false,
      message: result.lockedMs
        ? `Too many tries — wait ${Math.ceil(result.lockedMs / 1000)} seconds`
        : `Wrong PIN — ${result.triesLeft} tries left before a 1-minute wait`,
    };
  } catch {
    return { unlocked: false, message: 'Could not check the PIN. Please try again.' };
  }
}

function pinGateHtml(state) {
  if (!hasParentPin()) {
    return `<section class="cqd-parent-gate"><h1>Set a grown-up PIN</h1>
    <p>Choose a 4-digit PIN. This is a simple kids-only boundary, not a password.</p>
    <label class="cqd-field"><span>New 4-digit PIN</span><input class="cqd-input" type="password" inputmode="numeric" maxlength="4" data-parent-pin="new" aria-label="New 4 digit PIN"></label>
    <label class="cqd-field"><span>Confirm PIN</span><input class="cqd-input" type="password" inputmode="numeric" maxlength="4" data-parent-pin="again" aria-label="Confirm 4 digit PIN"></label>
    <p class="cqd-parent-error" aria-live="polite">${esc(state.pinMessage || '')}</p>
    <button type="button" class="cqd-button cqd-primary" data-action="daily-parent-set-pin">Save PIN</button></section>`;
  }
  const remaining = Math.max(0, load().parent.lockUntil - Date.now());
  const locked = remaining > 0;
  return `<section class="cqd-parent-gate"><h1>Grown-ups only</h1>
    <label class="cqd-field"><span>4-digit PIN</span><input class="cqd-input" type="password" inputmode="numeric" maxlength="4" data-parent-pin="enter" aria-label="4 digit PIN" ${locked ? 'disabled' : ''}></label>
    <p class="cqd-parent-error" aria-live="polite">${esc(locked ? `Too many tries — wait ${Math.ceil(remaining / 1000)} seconds` : state.pinMessage || '')}</p>
    <button type="button" class="cqd-button cqd-primary" data-action="daily-parent-enter-pin" ${locked ? 'disabled' : ''}>Enter</button>
    <p><button type="button" class="cqd-link-button" data-action="daily-parent-forgot">Forgot PIN?</button></p></section>`;
}

function trackerHtml(store, week, selectedDay) {
  return `<div class="cqd-tracker" aria-label="This week's Daily Work status">${DAY_KEYS.map((dayKey) => {
    const state = storedDay(store, week.id, dayKey);
    const status = dayStatus(state, sheetsForDay(week, dayKey));
    return `<button type="button" class="cqd-tracker-day cqd-status-${status} ${selectedDay === dayKey ? 'is-selected' : ''}" data-action="daily-parent-day" data-day="${dayKey}" aria-pressed="${selectedDay === dayKey}"><strong>${dayKey.slice(0, 3)}</strong></button>`;
  }).join('')}</div>`;
}

function checkedItemHtml(sheet, item, state) {
  const suggestion = gradeSuggestion(item, state.value);
  const key = choiceKey(sheet.id, item.id);
  const correctChecked = state.status === 'correct' || (state.status !== 'wrong' && suggestion === true);
  const wrongChecked = state.status === 'wrong' || (state.status !== 'correct' && suggestion === false);
  const neutral = suggestion === null;
  return `<li class="cqd-check-item"><p class="cqd-check-prompt">${esc(item.prompt)}</p>
    <p class="cqd-check-answer"><strong>Answer:</strong> ${esc(answerText(item, state.value))}</p>
    ${neutral ? '<p class="cqd-muted">No automatic suggestion — you decide.</p>' : `<p class="cqd-suggestion">Suggested: ${suggestion ? 'Correct' : 'Incorrect'}</p>`}
    <div class="cqd-grade" role="group" aria-label="Grade this item">
      <button type="button" data-action="daily-parent-grade" data-choice="correct" data-grade-key="${esc(key)}" aria-pressed="${correctChecked}">Correct</button>
      <button type="button" data-action="daily-parent-grade" data-choice="wrong" data-grade-key="${esc(key)}" aria-pressed="${wrongChecked}">Incorrect</button>
    </div>
    ${state.checkedAt ? `<p class="cqd-muted">Checked ${esc(new Date(state.checkedAt).toLocaleString())}</p>` : ''}</li>`;
}

function checkWorkHtml(store, state, todayIso) {
  const week = currentWeek(DAILY_WORK, store.track, todayIso);
  if (!week) return '<section class="cqd-empty"><h1>No Daily Work yet</h1></section>';
  const todayKey = weekdayKey(todayIso);
  const selectedDay = DAY_KEYS.includes(state.selectedDay) ? state.selectedDay : (DAY_KEYS.includes(todayKey) ? todayKey : 'monday');
  state.selectedDay = selectedDay;
  const sheets = sheetsForDay(week, selectedDay);
  const saved = storedDay(store, week.id, selectedDay);
  return `<section class="cqd-parent"><header class="cqd-calendar-head"><span class="cqd-eyebrow">PARENT MODE · ${esc(week.label.toUpperCase())}</span><h1>Check work</h1></header>
    ${trackerHtml(store, week, selectedDay)}
    <p class="cqd-muted">${saved.submittedAt ? `Submitted ${esc(new Date(saved.submittedAt).toLocaleString())}` : 'Not submitted yet. You can still check any item.'}</p>
    ${sheets.length ? sheets.map((sheet) => `<article class="cqd-sheet cqd-check-sheet"><h3>${esc(sheet.title)}</h3><ol class="cqd-check-items">${sheet.items.map((item) => checkedItemHtml(sheet, item, storedItem(saved, sheet.id, item.id))).join('')}</ol></article>`).join('') : '<p class="cqd-muted">No work for this day.</p>'}
    <div class="cqd-actions"><button type="button" class="cqd-button cqd-primary" data-action="daily-parent-save" data-week="${esc(week.id)}" data-day="${selectedDay}">Save</button></div></section>`;
}

export function renderParent(store, state, todayIso) {
  return state.unlocked ? checkWorkHtml(store, state, todayIso) : pinGateHtml(state);
}
