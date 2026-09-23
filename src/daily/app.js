import { DAILY_WORK } from '../cq/daily-work/content.js';
import { currentWeek } from '../cq/daily-work/schedule.js';
import { storedDay } from '../cq/daily-work/daily-work-ui.js';
import { load, save, setTrack, drawingFor, saveDrawing, snapshotHistory } from './store.js';
import { currentWeekSnapshots, renderCalendar, renderVerseScreen } from './calendar.js';
import { applyDailyAction, dayComplete, dayReady, dayReopened, renderSheetArticle, sheetsForDay } from './sheet-view.js';
import { attachDrawing, loadDrawing, sizeCanvas } from './drawing.js';
import { createDailyMotion } from './motion.js';
import {
  checkDailyParentPin, createParentState, gradeDailyWork, renderParent, setDailyParentPin,
} from './parent-view.js';

const app = document.getElementById('app');
const motion = createDailyMotion(app);
let store = load();
let route = { screen: 'calendar', dayKey: null, sheetIndex: 0 };
let parentState = createParentState();
let drawingController = null;

function todayIso() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const today = new Date();
let viewedMonth = { year: today.getFullYear(), month: today.getMonth() };
const MIN_MONTHS_BACK = 12; // how far into history the boys can look back, from today
const MAX_MONTHS_FORWARD = 1; // never more than "next month" — there is no future content to show

function persist(nextStore) {
  store = nextStore;
  save(store);
}

// Folds the current real week's live status into history under real calendar dates, so it
// survives once this week's content eventually rotates out (see store.js's snapshotHistory).
// Safe to call on every calendar render — it's an upsert, not an append log. Accumulates all of
// this week's entries into one store value before persisting once, not one save() per entry.
function snapshotToday() {
  const iso = todayIso();
  let next = store;
  currentWeekSnapshots(store, iso).forEach((entry) => {
    next = snapshotHistory(next, entry.iso, entry.weekId, entry.dayKey, entry.status);
  });
  if (next !== store) persist(next);
}

function detachDrawing() {
  if (drawingController) { drawingController.detach(); drawingController = null; }
}

function trackPickerHtml() {
  return `<section class="cqd-track-picker">
    <h1>Whose iPad is this?</h1>
    <p>Pick the quest line for this iPad. You only need to do this once — ask a grown-up to change it later.</p>
    <div class="cqd-track-options">
      <button type="button" class="cqd-button cqd-primary" data-action="pick-track" data-track="guided"><span class="cqd-track-number" aria-hidden="true">9</span><span class="cqd-track-label">Age 9 <small>Guided worksheets</small></span><span class="cqd-track-arrow" aria-hidden="true">→</span></button>
      <button type="button" class="cqd-button cqd-primary" data-action="pick-track" data-track="standard"><span class="cqd-track-number" aria-hidden="true">10</span><span class="cqd-track-label">Age 10 <small>Standard worksheets</small></span><span class="cqd-track-arrow" aria-hidden="true">→</span></button>
    </div>
  </section>`;
}

function sheetScreenHtml() {
  const week = currentWeek(DAILY_WORK, store.track, todayIso());
  if (!week || !route.dayKey) { route = { screen: 'calendar', dayKey: null, sheetIndex: 0 }; return renderCalendar(store, todayIso(), viewedMonth.year, viewedMonth.month); }
  const allSheets = sheetsForDay(week, route.dayKey);
  if (!allSheets.length) { route = { screen: 'calendar', dayKey: null, sheetIndex: 0 }; return renderCalendar(store, todayIso(), viewedMonth.year, viewedMonth.month); }
  const index = Math.min(Math.max(0, route.sheetIndex), allSheets.length - 1);
  route.sheetIndex = index;
  const dayState = storedDay(store, week.id, route.dayKey);
  const completed = dayComplete(dayState, allSheets);
  const reopened = dayReopened(dayState, allSheets);
  const nav = `<div class="cqd-sheet-nav"><button type="button" class="cqd-link-button" data-action="back-to-calendar">← This week</button></div>`;
  if (dayState.submittedAt && completed) {
    return `${nav}<section class="cqd-empty cqd-finished"><h1>All done, great job!</h1><p>Your parent checked everything for ${route.dayKey}.</p></section>`;
  }
  if (dayState.submittedAt && !reopened) {
    return `${nav}<section class="cqd-empty"><h1>Nice work!</h1><p>Waiting for a parent to check it.</p></section>`;
  }
  const sheet = allSheets[index];
  const pager = allSheets.length > 1
    ? `<div class="cqd-pager">
        <button type="button" class="cqd-button" data-action="prev-sheet" ${index === 0 ? 'disabled' : ''}>‹ Prev</button>
        <span class="cqd-pager-middle"><span class="cqd-pager-count">Sheet ${index + 1} of ${allSheets.length}</span><span class="cqd-pager-dots" aria-hidden="true">${allSheets.map((s, i) => `<span class="cqd-dot ${i === index ? 'is-current' : ''}"></span>`).join('')}</span></span>
        <button type="button" class="cqd-button" data-action="next-sheet" ${index === allSheets.length - 1 ? 'disabled' : ''}>Next ›</button>
      </div>` : '';
  const ready = dayReady(dayState, allSheets);
  return `${nav}
    ${reopened ? '<p class="cqd-reopen">A parent sent back a few answers to fix. Your finished answers are locked.</p>' : ''}
    <div class="cqd-sheet-wrap">
      <div class="cqd-mode-toggle" role="group" aria-label="Type or draw">
        <button type="button" class="cqd-mode-btn is-active" data-action="set-mode" data-mode="type">⌨️ Type</button>
        <button type="button" class="cqd-mode-btn" data-action="set-mode" data-mode="draw">✏️ Draw</button>
      </div>
      <div class="cqd-sheet-stage" data-mode="type">
        ${renderSheetArticle(week, route.dayKey, sheet, dayState, reopened)}
        <canvas class="cqd-ink" aria-label="Draw here to show your work"></canvas>
      </div>
      <button type="button" class="cqd-link-button cqd-clear-drawing" data-action="clear-drawing">Clear drawing on this page</button>
    </div>
    ${pager}
    <div class="cqd-actions"><button type="button" class="cqd-button cqd-primary" data-action="daily-submit" data-week="${week.id}" data-day="${route.dayKey}" ${ready ? '' : 'disabled'}>I’m done — go get a parent!</button></div>`;
}

function setupDrawing() {
  detachDrawing();
  const canvas = app.querySelector('.cqd-ink');
  const stage = app.querySelector('.cqd-sheet-stage');
  if (!canvas || !stage) return;
  const week = currentWeek(DAILY_WORK, store.track, todayIso());
  const allSheets = week ? sheetsForDay(week, route.dayKey) : [];
  const sheet = allSheets[route.sheetIndex];
  if (!week || !sheet) return;
  sizeCanvas(canvas, stage);
  loadDrawing(canvas, drawingFor(store, week.id, route.dayKey, sheet.id));
  drawingController = attachDrawing(canvas, {
    onStroke: (dataUrl) => { persist(saveDrawing(store, week.id, route.dayKey, sheet.id, dataUrl)); },
  });
}

function render(motionIntent) {
  const previousVisuals = motion.capture(motionIntent);
  if (!store.track) { app.innerHTML = trackPickerHtml(); }
  else if (route.screen === 'parent') {
    app.innerHTML = `<div class="cqd-parent-exit"><button type="button" class="cqd-link-button" data-action="daily-parent-exit">← Exit Parent Mode</button></div>${renderParent(store, parentState, todayIso())}`;
  }
  else if (route.screen === 'sheet') { app.innerHTML = sheetScreenHtml(); setupDrawing(); }
  else if (route.screen === 'verse') {
    app.innerHTML = `<div class="cqd-sheet-nav"><button type="button" class="cqd-link-button" data-action="back-to-calendar">← This week</button></div>${renderVerseScreen(store, todayIso())}`;
  }
  else {
    snapshotToday();
    app.innerHTML = `${renderCalendar(store, todayIso(), viewedMonth.year, viewedMonth.month)}<div class="cqd-parent-entry"><button type="button" class="cqd-link-button" data-action="daily-parent-open">🔒 Parent Mode</button></div>`;
  }
  motion.play(previousVisuals, `${store.track || 'picker'}/${route.screen}/${route.dayKey || ''}/${route.sheetIndex}/${viewedMonth.year}-${viewedMonth.month}`);
}

function onClick(event) {
  const button = event.target.closest('button[data-action]');
  if (!button || !app.contains(button)) return;
  const action = button.dataset.action;

  if (action === 'pick-track') {
    persist(setTrack(button.dataset.track));
    render();
    return;
  }
  if (action === 'open-day') {
    detachDrawing();
    route = { screen: 'sheet', dayKey: button.dataset.day, sheetIndex: 0 };
    render();
    return;
  }
  if (action === 'back-to-calendar') {
    detachDrawing();
    route = { screen: 'calendar', dayKey: null, sheetIndex: 0 };
    render();
    return;
  }
  if (action === 'prev-sheet' || action === 'next-sheet') {
    route.sheetIndex += action === 'prev-sheet' ? -1 : 1;
    render();
    return;
  }
  if (action === 'set-mode') {
    const stage = app.querySelector('.cqd-sheet-stage');
    if (stage) stage.dataset.mode = button.dataset.mode;
    app.querySelectorAll('.cqd-mode-btn').forEach((b) => b.classList.toggle('is-active', b === button));
    return;
  }
  if (action === 'clear-drawing') {
    if (drawingController) drawingController.clear();
    return;
  }
  if (action === 'open-verse') {
    route = { screen: 'verse', dayKey: null, sheetIndex: 0 };
    render('open-verse');
    return;
  }
  if (action === 'prev-month' || action === 'next-month') {
    const delta = action === 'prev-month' ? -1 : 1;
    const next = new Date(Date.UTC(viewedMonth.year, viewedMonth.month + delta, 1));
    const monthsFromToday = (next.getUTCFullYear() - today.getFullYear()) * 12 + (next.getUTCMonth() - today.getMonth());
    if (monthsFromToday < -MIN_MONTHS_BACK || monthsFromToday > MAX_MONTHS_FORWARD) return;
    viewedMonth = { year: next.getUTCFullYear(), month: next.getUTCMonth() };
    render();
    return;
  }

  if (action.indexOf('daily-parent-') === 0) {
    if (action === 'daily-parent-open') { detachDrawing(); parentState = createParentState(); parentState.open = true; route = { screen: 'parent', dayKey: null, sheetIndex: 0 }; render(); return; }
    if (action === 'daily-parent-exit') { parentState = createParentState(); route = { screen: 'calendar', dayKey: null, sheetIndex: 0 }; render(); return; }
    if (action === 'daily-parent-set-pin') {
      const pin = app.querySelector('[data-parent-pin="new"]');
      const again = app.querySelector('[data-parent-pin="again"]');
      setDailyParentPin(pin ? pin.value : '', again ? again.value : '').then((result) => {
        parentState.pinMessage = result.message;
        if (result.ok) parentState.unlocked = true;
        render();
      });
      return;
    }
    if (action === 'daily-parent-enter-pin') {
      const pin = app.querySelector('[data-parent-pin="enter"]');
      checkDailyParentPin(pin ? pin.value : '').then((result) => {
        parentState.pinMessage = result.message;
        if (result.unlocked) parentState.unlocked = true;
        render();
      });
      return;
    }
    if (action === 'daily-parent-forgot') { parentState.pinMessage = 'Ask the grown-up who set it up to reset the PIN from this iPad’s Settings.'; render(); return; }
    if (action === 'daily-parent-day') { parentState.selectedDay = button.dataset.day; render(); return; }
    if (action === 'daily-parent-grade') {
      const key = button.dataset.gradeKey;
      app.querySelectorAll(`[data-grade-key="${key}"]`).forEach((choice) => choice.setAttribute('aria-pressed', String(choice === button)));
      return;
    }
    if (action === 'daily-parent-save') {
      const choices = {};
      app.querySelectorAll('[data-action="daily-parent-grade"][aria-pressed="true"]').forEach((choice) => { choices[choice.dataset.gradeKey] = choice.dataset.choice; });
      persist(gradeDailyWork(store, button.dataset.week, button.dataset.day, choices, new Date().toISOString()));
      render();
      return;
    }
    return;
  }

  if (action.indexOf('daily-') === 0) {
    const data = { week: button.dataset.week, day: button.dataset.day, sheet: button.dataset.sheet, item: button.dataset.item, index: button.dataset.index, denom: button.dataset.denom };
    if (action === 'daily-submit' && !dayReadyForSubmit()) return;
    const value = action === 'daily-word' ? button.dataset.word : action === 'daily-scale' ? button.dataset.value : null;
    persist(applyDailyAction(store, action, data, value, new Date().toISOString()));
    render();
  }
}

function dayReadyForSubmit() {
  const week = currentWeek(DAILY_WORK, store.track, todayIso());
  if (!week || !route.dayKey) return false;
  const sheets = sheetsForDay(week, route.dayKey);
  return sheets.length > 0 && dayReady(storedDay(store, week.id, route.dayKey), sheets);
}

function onInput(event) {
  const input = event.target.closest('[data-action="daily-input"]');
  if (!input || !app.contains(input)) return;
  const data = { week: input.dataset.week, day: input.dataset.day, sheet: input.dataset.sheet, item: input.dataset.item };
  persist(applyDailyAction(store, 'daily-input', data, input.value, new Date().toISOString()));
  const submit = app.querySelector('[data-action="daily-submit"]');
  if (submit) submit.disabled = !dayReadyForSubmit();
}

// The percent grid is one big interactive surface, not 100 separate buttons (see sheet-view.js's
// percentGridItem) — a tap anywhere sets the shaded count from its row/col position. Kept as its
// own listener rather than folded into onClick since it isn't a button and reads coordinates, not
// a dataset value.
function onGridClick(event) {
  const grid = event.target.closest('.cqd-percent-grid');
  if (!grid || !app.contains(grid)) return;
  const rect = grid.getBoundingClientRect();
  const col = Math.min(9, Math.max(0, Math.floor((event.clientX - rect.left) / (rect.width / 10))));
  const row = Math.min(9, Math.max(0, Math.floor((event.clientY - rect.top) / (rect.height / 10))));
  const count = row * 10 + col + 1;
  const data = { week: grid.dataset.week, day: grid.dataset.day, sheet: grid.dataset.sheet, item: grid.dataset.item };
  persist(applyDailyAction(store, 'daily-percent-set', data, count, new Date().toISOString()));
  render();
}

app.addEventListener('click', onClick);
app.addEventListener('click', onGridClick);
app.addEventListener('input', onInput);
render();
