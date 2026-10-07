import { DAILY_WORK } from '../cq/daily-work/content.js';
import { currentWeek } from '../cq/daily-work/schedule.js';
import { itemMeta, storedDay } from '../cq/daily-work/daily-work-ui.js';
import { blockFillFor, commit, drawingFor, historyFor, load, refreshed, saveDrawing, setBlockFill, snapshotHistory, withTrack } from './store.js';
import { blockPlan, nextFill } from './blocks.js';
import { currentWeekSnapshots, renderCalendar, renderVerseScreen } from './calendar.js';
import { applyDailyAction, dayComplete, dayReady, dayReopened, renderSheetArticle, sheetsForDay } from './sheet-view.js';
import { attachDrawing, loadDrawing, sizeCanvas } from './drawing.js';
import { createDailyMotion } from './motion.js';
import { act as paydayReduce, newSession as newPayday } from '../payday/session.js';
import { abandonOpen, actOnOpen, addSession, openSession } from '../payday/state.js';
import { renderPayday } from '../payday/view.js';
import { lockParent, parentUnlocked, resetParentPin } from './pin.js';
import {
  RESET_PHRASE, checkDailyParentPin, createParentState, gradeDailyWork, renderParent, setDailyParentPin,
} from './parent-view.js';

const app = document.getElementById('app');
const motion = createDailyMotion(app);
let store = load();
let route = { screen: 'calendar', dayKey: null, sheetIndex: 0 };
let parentState = createParentState();
let drawingController = null;
let pinPending = false;
let parentSession = 0;
// 'Show me the blocks' taps (Thursday-style demo-on-demand problems). Kept for this visit only: reload and the demo is closed again.
const revealedBlocks = new Set();
const revealKey = (week, day, sheet, item) => `${week}|${day}|${sheet}|${item}`;
// The Payday Helper: a payday he has not typed an amount for yet lives only here; once he has, it is saved with the rest.
let paydayDraft = null;
let paydayAsk = false; // the "Start a new payday?" question is showing
let paydayDoneId = null; // the payday he just finished stays on screen until he starts a new one

function todayIso() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const today = new Date();
let viewedMonth = { year: today.getFullYear(), month: today.getMonth() };
const MIN_MONTHS_BACK = 12; // how far into history the boys can look back, from today
const MAX_MONTHS_FORWARD = 1; // never more than "next month" — there is no future content to show

// Every write goes through here. The change is applied to the latest saved answers (see store.js's
// commit), and a failed save is shown to the kid instead of being lost silently.
let saveOk = true;

function showSaveAlert() {
  let alert = document.getElementById('cqd-save-alert');
  if (!alert) {
    alert = document.createElement('div');
    alert.id = 'cqd-save-alert';
    alert.className = 'cqd-save-alert';
    alert.setAttribute('role', 'alert');
    alert.innerHTML = '<span class="cqd-save-alert-icon" aria-hidden="true">!</span><span class="cqd-save-alert-copy"><strong>This iPad is not saving right now.</strong><span>Keep this page open and tell a grown-up before you close it.</span></span>';
    document.body.appendChild(alert);
  }
  alert.hidden = saveOk;
}

function persist(change, options) {
  const result = commit(store, change, options);
  store = result.store;
  if (result.core) { saveOk = result.core.ok; showSaveAlert(); }
}

// Pulls in answers another tab saved since this one loaded (never replacing unsaved ones).
function syncStore() {
  const latest = refreshed(store);
  if (latest) store = latest;
}

// Folds the current real week's live status into history under real calendar dates, so it
// survives once this week's content eventually rotates out (see store.js's snapshotHistory).
// Only writes when a day's status actually changed, so simply looking at the calendar never
// rewrites (and can never overwrite) saved answers.
function snapshotToday() {
  const iso = todayIso();
  const changed = currentWeekSnapshots(store, iso).filter((entry) => {
    const saved = historyFor(store, entry.iso);
    return !saved || saved.status !== entry.status || saved.weekId !== entry.weekId || saved.dayKey !== entry.dayKey;
  });
  if (!changed.length) return;
  persist((s) => changed.reduce((next, entry) => snapshotHistory(next, entry.iso, entry.weekId, entry.dayKey, entry.status), s));
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
    <div class="cqd-drawing-toolbar" role="toolbar" aria-label="Worksheet tools">
      <div class="cqd-mode-toggle" role="group" aria-label="Type or draw">
        <button type="button" class="cqd-mode-btn is-active" data-action="set-mode" data-mode="type" aria-pressed="true">⌨️ Type</button>
        <button type="button" class="cqd-mode-btn" data-action="set-mode" data-mode="draw" aria-pressed="false">✏️ Draw</button>
      </div>
      <div class="cqd-tool-toggle" role="group" aria-label="Drawing tool">
        <button type="button" class="cqd-tool-btn is-active" data-action="set-tool" data-tool="pen" aria-pressed="true">✏️ Pen</button>
        <button type="button" class="cqd-tool-btn" data-action="set-tool" data-tool="eraser" aria-pressed="false">◻ Eraser</button>
      </div>
      <button type="button" class="cqd-link-button cqd-clear-drawing" data-action="clear-drawing">Clear drawing on this page</button>
    </div>
    <div class="cqd-sheet-wrap">
      <div class="cqd-sheet-stage" data-mode="type">
        ${renderSheetArticle(week, route.dayKey, sheet, dayState, reopened, (item) => blockFillFor(store, week.id, route.dayKey, sheet.id, item.id), (item) => revealedBlocks.has(revealKey(week.id, route.dayKey, sheet.id, item.id)))}
        <canvas class="cqd-ink" aria-label="Draw here to show your work"></canvas>
      </div>
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
    onStroke: (dataUrl) => { persist((s) => saveDrawing(s, week.id, route.dayKey, sheet.id, dataUrl), { core: false, ink: true, keep: [week.id, route.dayKey, sheet.id] }); },
  });
}

function paydayCurrent() {
  const done = paydayDoneId && store.payday.sessions.find((session) => session.id === paydayDoneId);
  return done || openSession(store.payday) || paydayDraft || (paydayDraft = newPayday(new Date().toISOString()));
}

// One tap in the Payday Helper. The rules live in src/payday/session.js; this only saves the result.
function paydayAct(action) {
  const now = new Date().toISOString();
  try {
    if (openSession(store.payday)) {
      persist((s) => ({ ...s, payday: actOnOpen(s.payday, action, now) }));
    } else {
      const next = paydayReduce(paydayDraft || newPayday(now), action, now);
      if (next.earned !== null && next.screen !== 'earn') { persist((s) => ({ ...s, payday: addSession(s.payday, next) })); paydayDraft = null; } else paydayDraft = next;
    }
  } catch (error) {
    console.error(error);
  }
  const top = store.payday.sessions[0];
  if (top && top.screen === 'done') paydayDoneId = top.id;
  render();
}

const paydayText = (key) => { const input = app.querySelector(`[data-payday-input="${key}"]`); return input ? input.value : ''; };

function handlePayday(button, action) {
  const piece = button.dataset.piece;
  const simple = {
    'payday-handed-done': 'handed-done', 'payday-change-amount': 'change-amount', 'payday-pieces-clear': 'pieces-clear', 'payday-change-pieces': 'change-pieces',
    'payday-recap-yes': 'recap-yes', 'payday-jars-next': 'jars-next', 'payday-replace-done': 'replace-done', 'payday-replace-cancel': 'replace-cancel',
    'payday-jar-done': 'jar-done', 'payday-jar-next': 'jar-next', 'payday-dismiss': 'dismiss', 'payday-grownup-ok': 'grownup-ok',
  };
  if (simple[action]) return paydayAct({ type: simple[action] });
  switch (action) {
    case 'payday-earn-submit': return paydayAct({ type: 'earn-submit', text: paydayText('earn') });
    case 'payday-add-answer': return paydayAct({ type: 'add-answer', text: paydayText('add') });
    case 'payday-spend-answer': return paydayAct({ type: 'spend-answer', text: paydayText('spend') });
    case 'payday-piece-plus': return paydayAct({ type: 'piece-adjust', id: piece, delta: 1 });
    case 'payday-piece-minus': return paydayAct({ type: 'piece-adjust', id: piece, delta: -1 });
    case 'payday-replace-plus': return paydayAct({ type: 'replace-adjust', id: piece, delta: 1 });
    case 'payday-replace-minus': return paydayAct({ type: 'replace-adjust', id: piece, delta: -1 });
    case 'payday-tray-add': return paydayAct({ type: 'tray-add', jar: button.dataset.jar });
    case 'payday-tray-remove': return paydayAct({ type: 'tray-remove', jar: button.dataset.jar });
    case 'payday-can': return paydayAct({ type: 'can-answer', value: button.dataset.value });
    case 'payday-pick': return paydayAct({ type: 'pick-piece', id: piece });
    case 'payday-jar-add': return paydayAct({ type: 'jar-add', id: piece });
    case 'payday-jar-remove': return paydayAct({ type: 'jar-remove', id: piece });
    case 'payday-spend-add': return paydayAct({ type: 'spend-add', id: piece });
    case 'payday-spend-remove': return paydayAct({ type: 'spend-remove', id: piece });
    case 'payday-new': paydayDraft = newPayday(new Date().toISOString()); paydayDoneId = null; paydayAsk = false; render(); return undefined;
    case 'payday-restart': paydayAsk = true; render(); return undefined;
    case 'payday-restart-no': paydayAsk = false; render(); return undefined;
    case 'payday-restart-yes':
      paydayAsk = false;
      persist((s) => ({ ...s, payday: abandonOpen(s.payday) }));
      paydayDraft = newPayday(new Date().toISOString());
      render();
      return undefined;
    default: return undefined;
  }
}

function render(motionIntent) {
  syncStore();
  const previousVisuals = motion.capture(motionIntent);
  if (!store.track) { app.innerHTML = trackPickerHtml(); }
  else if (route.screen === 'parent') {
    const now = Date.now();
    app.innerHTML = `<div class="cqd-parent-exit"><button type="button" class="cqd-link-button" data-action="daily-parent-exit">← Exit Parent Mode</button>${parentUnlocked(store, now) ? '<button type="button" class="cqd-parent-lock" data-action="daily-parent-lock">🔒 Lock now</button>' : ''}</div>${renderParent(store, parentState, todayIso(), now)}`;
  }
  else if (route.screen === 'sheet') { app.innerHTML = sheetScreenHtml(); setupDrawing(); }
  else if (route.screen === 'payday') { app.innerHTML = renderPayday(paydayCurrent(), { confirmRestart: paydayAsk }); }
  else if (route.screen === 'verse') {
    app.innerHTML = `<div class="cqd-sheet-nav"><button type="button" class="cqd-link-button" data-action="back-to-calendar">← This week</button></div>${renderVerseScreen(store, todayIso())}`;
  }
  else {
    snapshotToday();
    app.innerHTML = `${renderCalendar(store, todayIso(), viewedMonth.year, viewedMonth.month)}<div class="cqd-parent-entry"><button type="button" class="cqd-link-button" data-action="daily-parent-open">🔒 Parent Mode</button></div>`;
  }
  motion.play(previousVisuals, `${store.track || 'picker'}/${route.screen}/${route.dayKey || ''}/${route.sheetIndex}/${viewedMonth.year}-${viewedMonth.month}`);
}

function setSheetMode(mode) {
  const stage = app.querySelector('.cqd-sheet-stage');
  if (!stage || (mode !== 'type' && mode !== 'draw')) return;
  stage.dataset.mode = mode;
  app.querySelectorAll('.cqd-mode-btn').forEach((button) => {
    const active = button.dataset.mode === mode;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function onClick(event) {
  const button = event.target.closest('button[data-action]');
  if (!button || !app.contains(button)) return;
  const action = button.dataset.action;

  if (action === 'pick-track') {
    persist((s) => withTrack(s, button.dataset.track));
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
    setSheetMode(button.dataset.mode);
    return;
  }
  if (action === 'set-tool') {
    const tool = button.dataset.tool;
    if (!drawingController || (tool !== 'pen' && tool !== 'eraser')) return;
    drawingController.setTool(tool);
    app.querySelectorAll('.cqd-tool-btn').forEach((choice) => {
      const active = choice.dataset.tool === tool;
      choice.classList.toggle('is-active', active);
      choice.setAttribute('aria-pressed', String(active));
    });
    setSheetMode('draw');
    return;
  }
  if (action === 'clear-drawing') {
    if (drawingController) drawingController.clear();
    return;
  }
  if (action === 'open-payday') {
    detachDrawing();
    paydayAsk = false;
    paydayDoneId = null;
    route = { screen: 'payday', dayKey: null, sheetIndex: 0 };
    render();
    return;
  }
  if (action.indexOf('payday-') === 0) { handlePayday(button, action); return; }
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
    if (action === 'daily-parent-open') { detachDrawing(); parentSession += 1; parentState = createParentState(); parentState.open = true; route = { screen: 'parent', dayKey: null, sheetIndex: 0 }; render(); return; }
    if (action === 'daily-parent-exit') { parentSession += 1; parentState = createParentState(); route = { screen: 'calendar', dayKey: null, sheetIndex: 0 }; render(); return; }
    if (action === 'daily-parent-lock') { parentSession += 1; persist((s) => lockParent(s)); parentState = createParentState(); route = { screen: 'calendar', dayKey: null, sheetIndex: 0 }; render(); return; }
    if (action === 'daily-parent-set-pin') {
      if (pinPending) return;
      const pin = app.querySelector('[data-parent-pin="new"]');
      const again = app.querySelector('[data-parent-pin="again"]');
      const session = parentSession;
      pinPending = true;
      setDailyParentPin(store, pin ? pin.value : '', again ? again.value : '').then((result) => {
        if (result.store.parent !== store.parent) persist((s) => ({ ...s, parent: result.store.parent }));
        pinPending = false;
        if (session !== parentSession || route.screen !== 'parent') return;
        parentState.pinMessage = result.message;
        render();
      });
      return;
    }
    if (action === 'daily-parent-enter-pin') {
      if (pinPending) return;
      const pin = app.querySelector('[data-parent-pin="enter"]');
      const session = parentSession;
      pinPending = true;
      checkDailyParentPin(store, pin ? pin.value : '').then((result) => {
        if (result.store.parent !== store.parent) persist((s) => ({ ...s, parent: result.store.parent }));
        pinPending = false;
        if (session !== parentSession || route.screen !== 'parent') return;
        parentState.pinMessage = result.message;
        render();
      });
      return;
    }
    if (action === 'daily-parent-forgot') { parentState.resetting = true; parentState.pinMessage = ''; render(); return; }
    if (action === 'daily-parent-reset-back') { parentState.resetting = false; parentState.pinMessage = ''; render(); return; }
    if (action === 'daily-parent-reset') {
      // Clears only the PIN (and a lockout). Answers, grades and drawings are untouched; the reset is logged and shown in Parent Mode.
      const phrase = app.querySelector('[data-parent-pin="phrase"]');
      if (!phrase || phrase.value.trim().replace(/\s+/g, ' ').toUpperCase() !== RESET_PHRASE) { parentState.pinMessage = `Type ${RESET_PHRASE} exactly, then tap Reset PIN.`; render(); return; }
      persist((s) => resetParentPin(s));
      parentState.resetting = false;
      parentState.pinMessage = 'The PIN is cleared. Choose a new 4-digit PIN.';
      render();
      return;
    }
    if (action === 'daily-parent-day') { parentState.selectedDay = button.dataset.day; render(); return; }
    if (action === 'daily-parent-grade') {
      const key = button.dataset.gradeKey;
      app.querySelectorAll(`[data-grade-key="${key}"]`).forEach((choice) => choice.setAttribute('aria-pressed', String(choice === button)));
      return;
    }
    if (action === 'daily-parent-save') {
      const choices = {};
      app.querySelectorAll('[data-action="daily-parent-grade"][aria-pressed="true"]').forEach((choice) => { choices[choice.dataset.gradeKey] = choice.dataset.choice; });
      persist((s) => gradeDailyWork(s, button.dataset.week, button.dataset.day, choices, new Date().toISOString()));
      render();
      return;
    }
    return;
  }

  if (action === 'daily-block-reveal') {
    const data = { week: button.dataset.week, day: button.dataset.day, sheet: button.dataset.sheet, item: button.dataset.item };
    const item = itemMeta(DAILY_WORK, store.track, data);
    if (!item || item.help !== 'demand') return;
    revealedBlocks.add(revealKey(data.week, data.day, data.sheet, data.item));
    render();
    const first = app.querySelector(`.cqd-block-bar [data-item="${CSS.escape(data.item)}"]`);
    if (first) first.focus({ preventScroll: true });
    return;
  }

  if (action === 'daily-block-fill') {
    // The block count comes from the authored problem, never from the DOM, so a tampered attribute
    // can't store a nonsense fill.
    const data = { week: button.dataset.week, day: button.dataset.day, sheet: button.dataset.sheet, item: button.dataset.item };
    const item = itemMeta(DAILY_WORK, store.track, data);
    const plan = item && blockPlan(item.part, item.whole, item.perItem === true);
    if (!plan) return;
    const next = nextFill(blockFillFor(store, data.week, data.day, data.sheet, data.item), Number(button.dataset.block), plan.count);
    persist((s) => setBlockFill(s, data.week, data.day, data.sheet, data.item, next));
    render();
    return;
  }

  if (action.indexOf('daily-') === 0) {
    const data = { week: button.dataset.week, day: button.dataset.day, sheet: button.dataset.sheet, item: button.dataset.item, index: button.dataset.index, denom: button.dataset.denom };
    if (action === 'daily-submit' && !dayReadyForSubmit()) return;
    const value = action === 'daily-word' ? button.dataset.word : action === 'daily-scale' ? button.dataset.value : null;
    persist((s) => applyDailyAction(s, action, data, value, new Date().toISOString()));
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
  persist((s) => applyDailyAction(s, 'daily-input', data, input.value, new Date().toISOString()));
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
  persist((s) => applyDailyAction(s, 'daily-percent-set', data, count, new Date().toISOString()));
  render();
}

// Safari can adjust the visual viewport again after focus when the keyboard opens. Keep the
// focused answer below the sticky tools in both the initial focus and that later resize.
function keepFocusedAnswerVisible() {
  const field = document.activeElement;
  if (!field || !field.matches('.cqd-sheet-stage input, .cqd-sheet-stage textarea') || !app.contains(field)) return;
  const toolbar = app.querySelector('.cqd-drawing-toolbar');
  if (!toolbar) return;
  const overlap = toolbar.getBoundingClientRect().bottom + 12 - field.getBoundingClientRect().top;
  if (overlap > 0) window.scrollBy(0, -overlap);
}

function checkFocusedAnswer() { requestAnimationFrame(keepFocusedAnswerVisible); }

// Another tab (or this one, restored from the background) may have saved answers meanwhile. Nothing is
// ever lost either way, because writes merge onto the latest saved copy; this just keeps the screen current.
// The sheet screen is left alone so a refresh never steals focus from an answer being typed.
function refreshScreen() {
  if (route.screen === 'calendar') render();
  else syncStore();
}
window.addEventListener('storage', refreshScreen);
window.addEventListener('pageshow', (event) => { if (event.persisted) refreshScreen(); });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') refreshScreen();
  else if (!saveOk) persist((s) => s); // one more try to save anything typed while storage was full
});
// Ask Safari not to clear this site's saved answers when the iPad is short on space (best effort).
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch { /* optional */ }

// Enter in a Payday Helper answer box presses that screen's main button.
app.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' || !event.target.matches || !event.target.matches('[data-payday-input]')) return;
  event.preventDefault();
  const main = app.querySelector('.pd-actions .cqd-primary[data-action]');
  if (main) handlePayday(main, main.dataset.action);
});
app.addEventListener('click', onClick);
app.addEventListener('click', onGridClick);
app.addEventListener('input', onInput);
app.addEventListener('focusin', checkFocusedAnswer);
if (globalThis.visualViewport) globalThis.visualViewport.addEventListener('resize', checkFocusedAnswer);
render();
