import { checkParentPin, hasParentPin, load, setParentPin } from '../../progress.js';
import { currentWeek, weekdayKey } from './schedule.js';
import {
  allItems, coinCounts, coinSummary, coinTotal, displayValue, hasFixes, isComplete,
  itemWithSheet, sheetsFor, storedDay, storedItem,
} from './daily-work-ui.js';

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const esc = (value) => String(value).replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

function localToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function daySheets(week, dayKey) {
  const day = (week.days || {})[dayKey] || { sheets: [] };
  return sheetsFor(week, day).map((sheet) => ({ ...sheet, items: itemWithSheet(sheet) }));
}

export function createDailyParentState() {
  return { open: false, unlocked: false, selectedDay: null, pinMessage: '' };
}

export function dayStatus(dayState, sheets) {
  if (dayState.submittedAt && isComplete(dayState, sheets)) return 'complete';
  if (hasFixes(dayState, sheets)) return 'needs-fixes';
  if (dayState.submittedAt) return 'awaiting-check';
  if (allItems(sheets).some((item) => storedItem(dayState, item.sheetId, item.id).value !== null)) return 'in-progress';
  return 'not-started';
}

export function gradeSuggestion(item, value) {
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

export function gradeDailyWork(cq, content, weekId, dayKey, choices, nowIso) {
  const week = content[cq.track] && content[cq.track].weeks && content[cq.track].weeks[weekId];
  if (!week || !DAY_KEYS.includes(dayKey)) return cq;
  const selected = choices || {};
  const next = JSON.parse(JSON.stringify(cq.dailyWork || { weeks: {} }));
  const weeks = next.weeks || (next.weeks = {});
  const storedWeek = weeks[weekId] || (weeks[weekId] = { days: {} });
  const days = storedWeek.days || (storedWeek.days = {});
  const day = days[dayKey] || (days[dayKey] = { sheets: {}, submittedAt: null });
  const savedSheets = day.sheets || (day.sheets = {});
  daySheets(week, dayKey).forEach((sheet) => {
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
  return { ...cq, dailyWork: next };
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
  if (!hasParentPin()) return `<section class="cq-dw-parent-gate"><h2>Set a grown-up PIN</h2>
    <p>Choose a 4-digit PIN. This is a simple kids-only boundary, not a password.</p>
    <label><span>New 4-digit PIN</span><input class="cq-dw-input" type="password" inputmode="numeric" maxlength="4" data-parent-pin="new" aria-label="New 4 digit PIN"></label>
    <label><span>Confirm PIN</span><input class="cq-dw-input" type="password" inputmode="numeric" maxlength="4" data-parent-pin="again" aria-label="Confirm 4 digit PIN"></label>
    <p class="cq-dw-parent-error" aria-live="polite">${esc(state.pinMessage || '')}</p>
    <button type="button" class="cq-button cq-primary" data-action="daily-parent-set-pin">Save PIN</button>
    <p class="cq-muted">This only protects the active kid’s Daily Work.</p></section>`;
  const remaining = Math.max(0, load().parent.lockUntil - Date.now());
  const locked = remaining > 0;
  return `<section class="cq-dw-parent-gate"><h2>Grown-ups only</h2>
    <label><span>4-digit PIN</span><input class="cq-dw-input" type="password" inputmode="numeric" maxlength="4" data-parent-pin="enter" aria-label="4 digit PIN" ${locked ? 'disabled' : ''}></label>
    <p class="cq-dw-parent-error" aria-live="polite">${esc(locked ? `Too many tries — wait ${Math.ceil(remaining / 1000)} seconds` : state.pinMessage || '')}</p>
    <button type="button" class="cq-button cq-primary" data-action="daily-parent-enter-pin" ${locked ? 'disabled' : ''}>Enter</button>
    <p><button type="button" class="cq-link-button" data-action="daily-parent-forgot">Forgot PIN?</button></p></section>`;
}

function trackerHtml(cq, week, selectedDay) {
  return `<section class="cq-dw-tracker" aria-label="This week’s Daily Work status"><h3>This week</h3><div class="cq-dw-tracker-days">${DAY_KEYS.map((dayKey) => {
    const state = storedDay(cq, week.id, dayKey);
    const status = dayStatus(state, daySheets(week, dayKey));
    return `<button type="button" class="cq-dw-tracker-day cq-dw-status-${status} ${selectedDay === dayKey ? 'is-selected' : ''}" data-action="daily-parent-day" data-day="${dayKey}" aria-pressed="${selectedDay === dayKey}"><strong>${dayKey.slice(0, 3)}</strong><span>${status.replace(/-/g, ' ')}</span></button>`;
  }).join('')}</div></section>`;
}

function checkedItemHtml(sheet, item, state) {
  const suggestion = gradeSuggestion(item, state.value);
  const key = choiceKey(sheet.id, item.id);
  const correctChecked = state.status === 'correct' || (state.status !== 'wrong' && suggestion === true);
  const wrongChecked = state.status === 'wrong' || (state.status !== 'correct' && suggestion === false);
  const neutral = suggestion === null;
  return `<li class="cq-dw-check-item"><p class="cq-dw-check-prompt">${esc(item.prompt)}</p>
    <p class="cq-dw-check-answer"><strong>Answer:</strong> ${esc(answerText(item, state.value))}</p>
    ${neutral ? '<p class="cq-muted">No automatic suggestion — parent decides.</p>' : `<p class="cq-dw-suggestion">Suggested: ${suggestion ? 'Correct' : 'Incorrect'}</p>`}
    <div class="cq-dw-grade" role="group" aria-label="Grade this item"><button type="button" data-action="daily-parent-grade" data-choice="correct" data-grade-key="${esc(key)}" aria-pressed="${correctChecked}">Correct</button><button type="button" data-action="daily-parent-grade" data-choice="wrong" data-grade-key="${esc(key)}" aria-pressed="${wrongChecked}">Incorrect</button></div>
    ${state.checkedAt ? `<p class="cq-muted">Checked ${esc(new Date(state.checkedAt).toLocaleString())}</p>` : ''}</li>`;
}

function checkWorkHtml(cq, content, state, todayIso) {
  const week = currentWeek(content, cq.track, todayIso);
  if (!week) return '<section class="cq-dw-empty"><h2>No Daily Work yet</h2><p>There is no current week to check.</p></section>';
  const todayKey = weekdayKey(todayIso);
  const selectedDay = DAY_KEYS.includes(state.selectedDay) ? state.selectedDay : (DAY_KEYS.includes(todayKey) ? todayKey : 'monday');
  state.selectedDay = selectedDay;
  const sheets = daySheets(week, selectedDay);
  const saved = storedDay(cq, week.id, selectedDay);
  return `<section class="cq-dw-parent"><div class="cq-section-head"><div><span class="cq-eyebrow">PARENT MODE · ${esc(week.label.toUpperCase())}</span><h2>Check work</h2></div></div>${trackerHtml(cq, week, selectedDay)}
    <div class="cq-dw-day-picker" aria-label="Choose a weekday">${DAY_KEYS.map((dayKey) => `<button type="button" data-action="daily-parent-day" data-day="${dayKey}" aria-pressed="${dayKey === selectedDay}">${dayKey}</button>`).join('')}</div>
    <p class="cq-muted">${saved.submittedAt ? `Submitted ${esc(new Date(saved.submittedAt).toLocaleString())}` : 'Not submitted yet. You can still check any item.'}</p>
    ${sheets.map((sheet) => `<article class="cq-dw-sheet cq-dw-check-sheet"><h3>${esc(sheet.title)}</h3><ol class="cq-dw-check-items">${sheet.items.map((item) => checkedItemHtml(sheet, item, storedItem(saved, sheet.id, item.id))).join('')}</ol></article>`).join('')}
    <div class="cq-actions"><button type="button" class="cq-button cq-primary" data-action="daily-parent-save" data-week="${esc(week.id)}" data-day="${selectedDay}">Save</button></div></section>`;
}

export function dailyParentHtml(cq, options = {}) {
  const state = options.state || createDailyParentState();
  const content = options.content;
  const todayIso = options.todayIso || localToday();
  return state.unlocked ? checkWorkHtml(cq, content, state, todayIso) : pinGateHtml(state);
}
