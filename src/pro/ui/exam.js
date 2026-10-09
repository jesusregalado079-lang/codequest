// Certification exam practice pages (#/exam...). Security+ SY0-801 first; the rules live in ../exam/exam-logic.js.
//   #/exam                 hub: readiness, mock exams, review queue, study first, domains, history
//   #/exam/domain/<n>      one domain: objectives, accuracy, practice
//   #/exam/session         the open session (mock, domain check, practice, review)
//   #/exam/result/<id>     a finished mock or check
import exam from '../exam/secplus-801.js';
import {
  domainQuotas, domainAverages, domainStats, drawExam, finishExamSession, newSession, objectiveStats,
  practiceOrder, practiceSet, readiness, reviewDue, studyFirst, visibleInPractice, addEntries,
} from '../exam/exam-logic.js';
import { getExamState, saveExamState } from '../progress.js';

const { blueprint: bp, questions, sources, byId } = exam;
const EXAM = bp.id;
const LETTERS = ['A', 'B', 'C', 'D'];
const MOCK_MS = bp.minutes * 60000;
const CHECK_SIZE = 15;
const quotas = domainQuotas(bp.domains, bp.questions);
const domainOf = (n) => bp.domains.find((d) => String(d.n) === String(n));

let ctx = null; // { app, header, esc, celebrate, saveWarn, fmtDate }
let timer = null;
let keyHandler = null;
let pendingStart = null; // a start that needs "replace the unfinished session?" confirmation

// Closing, reloading or switching away mid-mock keeps the time already spent.
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => flushTimer(true));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushTimer(true); });
}

// Called by the router before every page: no timer or key listener outlives its page.
export function leaveExam() {
  if (timer) { clearInterval(timer.id); flushTimer(true); timer = null; }
  if (keyHandler) { document.removeEventListener('keydown', keyHandler); keyHandler = null; }
}

const load = () => getExamState(EXAM);
function store(state) {
  const r = saveExamState(EXAM, state);
  if (!r.ok) ctx.saveWarn();
  return r.ok;
}

const fmtClock = (ms) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
const fmtDay = (t) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const fmtIso = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
const pctBar = (pct, cls = '') => `<span class="ex-bar ${cls}"><i style="width:${pct ?? 0}%"></i></span>`;

export function showExam(parts, context) {
  ctx = context;
  leaveExam();
  pendingStart = null;
  const [view, arg] = parts;
  if (!questions.length) return showEmpty();
  if (view === 'domain' && domainOf(arg)) return showDomain(Number(arg));
  if (view === 'session') return showSession();
  if (view === 'result' && arg) return showResult(arg);
  return showHub();
}

function showEmpty() {
  ctx.app.innerHTML = `${ctx.header('exam')}<main class="exam"><h1>Exam practice</h1><p>The question bank is not loaded yet.</p></main>`;
}

/* ---------------- starting sessions ---------------- */

function sessionLabel(s) {
  const done = Object.keys(s.answers).length;
  return `${s.title} · ${done} of ${s.ids.length} answered`;
}

// Start a new session (or ask first when one is open). spec: { kind, title, ids, orders, limitMs, domain }
function start(spec) {
  const state = load();
  if (state.session && !pendingStart) {
    pendingStart = spec;
    showHub();
    const bar = ctx.app.querySelector('.ex-replace');
    if (bar) bar.focus();
    return;
  }
  pendingStart = null;
  if (!spec.ids.length) return;
  state.session = newSession({ ...spec });
  if (store(state)) location.hash = '/exam/session';
}

function startMock() {
  const d = drawExam({ questions, domains: bp.domains, state: load(), total: bp.questions });
  start({ kind: 'mock', title: `Full mock exam · ${d.ids.length} questions`, limitMs: MOCK_MS, ...d });
}
function startCheck(n) {
  const d = drawExam({ questions, domains: bp.domains, state: load(), total: CHECK_SIZE, onlyDomain: n });
  start({ kind: 'check', title: `Domain ${n} check · ${domainOf(n).name}`, domain: n, ...d });
}
function startPractice(list, title, n = 10) {
  const state = load();
  const pool = practiceOrder(list.filter((q) => visibleInPractice(q, state)), state);
  start({ kind: 'practice', title, ...practiceSet(pool, n) });
}
function startReview() {
  const due = reviewDue(questions, load());
  start({ kind: 'review', title: `Review queue · ${Math.min(20, due.length)} due`, ...practiceSet(due, 20) });
}
function startMisses(ids) {
  const list = ids.map((id) => byId[id]).filter(Boolean);
  start({ kind: 'practice', title: `Practice your ${list.length} misses`, ...practiceSet(list, 50) });
}

/* ---------------- hub ---------------- */

function readinessGauge(r) {
  const size = 150;
  const stroke = 13;
  const rad = (size - stroke) / 2;
  const c = 2 * Math.PI * rad;
  const pct = r.avg3 ?? 0;
  const tAngle = (bp.target / 100) * 360 - 90;
  const tx = size / 2 + rad * Math.cos((tAngle * Math.PI) / 180);
  const ty = size / 2 + rad * Math.sin((tAngle * Math.PI) / 180);
  return `<svg class="ex-gauge" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">
    <defs><linearGradient id="exG" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#5aa9ff"/><stop offset="1" stop-color="${r.ready ? '#42d6a4' : '#ffd166'}"/></linearGradient></defs>
    <circle cx="${size / 2}" cy="${size / 2}" r="${rad}" fill="none" stroke="rgba(255,255,255,.09)" stroke-width="${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${rad}" fill="none" stroke="url(#exG)" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${(c * pct) / 100} ${c}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
    <circle cx="${tx}" cy="${ty}" r="5" fill="#fff" stroke="#10141b" stroke-width="2"/>
  </svg>`;
}

function showHub() {
  const { esc } = ctx;
  const state = load();
  const r = readiness(state, questions, bp.target);
  const due = reviewDue(questions, state);
  const first = studyFirst(questions, state, bp);
  const avgs = domainAverages(state);
  const lastChecks = {};
  state.attempts.filter((a) => a.kind === 'check').forEach((a) => { lastChecks[a.domain] = a; });
  const mocks = state.attempts.filter((a) => a.kind === 'mock').slice().reverse();
  const s = state.session;
  const verdict = r.mocks === 0 ? 'Take your first full mock to get a readiness score.'
    : r.ready ? `Ready by your own bar: your last three mocks were all ${bp.target}% or higher.`
      : `Ready means three mocks in a row at ${bp.target}%+. You have ${r.mocks} mock${r.mocks === 1 ? '' : 's'} so far.`;

  ctx.app.innerHTML = `
    ${ctx.header('exam')}
    <main class="exam">
      <section class="ex-hero">
        <div class="ex-hero-text">
          <div class="ex-kicker">${esc(bp.name)} · ${esc(bp.code)} (${esc(bp.version)}) · launches ${fmtIso(bp.launches)}</div>
          <h1>Exam practice</h1>
          <ul class="ex-facts">
            <li><b>${bp.questions}</b> questions max</li>
            <li><b>${bp.minutes}</b> minutes</li>
            <li>pass <b>750</b> of 900</li>
            <li>multiple choice + hands-on sims</li>
          </ul>
          <p class="ex-note">${esc(bp.previous.code)} stays bookable until ${fmtIso(bp.previous.retires)}. Checked against <a href="${esc(bp.links.page)}" target="_blank" rel="noopener noreferrer">CompTIA</a> and the <a href="${esc(bp.links.objectives)}" target="_blank" rel="noopener noreferrer">V8 objectives</a> on ${fmtIso(bp.checked)}.</p>
        </div>
        <div class="ex-ready${r.ready ? ' is-ready' : ''}">
          <div class="ex-gauge-wrap">${readinessGauge(r)}<div class="ex-gauge-label"><b>${r.avg3 === null ? 'n/a' : `${r.avg3}%`}</b><span>last 3 mocks</span></div></div>
          <p>${esc(verdict)}</p>
          <div class="ex-mini">
            <span><b>${r.mocks}</b> mock${r.mocks === 1 ? '' : 's'}</span><span><b>${r.best ?? 'n/a'}${r.best === null ? '' : '%'}</b> best</span><span><b>${r.seen}/${questions.length}</b> seen</span>
          </div>
        </div>
      </section>

      ${s ? `
      <section class="ex-open" aria-label="Unfinished session">
        <div><strong>Unfinished:</strong> ${esc(sessionLabel(s))}${s.kind === 'mock' ? ` · ${fmtClock(s.limitMs - s.elapsedMs)} left` : ''}</div>
        <div class="ex-actions"><a class="ex-btn primary" href="#/exam/session">Resume</a><button type="button" class="ex-btn ghost" data-discard>Discard it</button></div>
      </section>` : ''}

      ${pendingStart ? `
      <section class="ex-replace" tabindex="-1" role="alertdialog" aria-label="Replace the unfinished session?">
        <p><strong>Replace your unfinished session?</strong> ${esc(sessionLabel(s))}. ${s.kind === 'mock' || s.kind === 'check' ? 'Its answers are not scored or saved.' : 'Answers you already gave are saved.'}</p>
        <div class="ex-actions"><button type="button" class="ex-btn primary" data-replace>Replace it and start</button><button type="button" class="ex-btn ghost" data-keep>Keep it</button></div>
      </section>` : ''}

      <section class="ex-cards">
        <article class="ex-card big">
          <div class="ex-card-tag">Exam conditions</div>
          <h2>Full mock exam</h2>
          <p>A fresh ${bp.questions}-question draw by the official domain weights, ${bp.minutes}-minute clock, no answers until you submit. Questions you have not seen or got wrong come first.</p>
          <button type="button" class="ex-btn primary" data-mock>Start a new mock</button>
        </article>
        <article class="ex-card">
          <div class="ex-card-tag">Spaced review</div>
          <h2>${due.length} due</h2>
          <p>Missed questions come back now; right ones after 1, 3, 7, 14 and 30 days.</p>
          <button type="button" class="ex-btn" data-review ${due.length ? '' : 'disabled'}>${due.length ? 'Start review' : 'Nothing due'}</button>
        </article>
        <article class="ex-card">
          <div class="ex-card-tag">Quick practice</div>
          <h2>Quiz me</h2>
          <p>20 questions with instant feedback: your misses first, then new ones.</p>
          <button type="button" class="ex-btn" data-quiz>Quiz me · 20</button>
        </article>
      </section>

      <section>
        <h2 class="ex-h2">Study first</h2>
        ${first.length ? `<ol class="ex-first">${first.map((o) => `
          <li><span class="ex-obj">${esc(o.id)}</span><div><strong>${esc(o.label)}</strong><small>${o.wrong} missed on your latest answers · ${o.accuracy}% right</small></div>
          <button type="button" class="ex-btn small" data-obj="${esc(o.id)}">Practice</button></li>`).join('')}</ol>`
    : '<p class="ex-muted">Answer some questions first (Quiz me or a mock) and this lists the objectives costing you the most points.</p>'}
      </section>

      <section>
        <h2 class="ex-h2">Domains</h2>
        <div class="ex-domains">
          ${bp.domains.map((d) => {
    const st = domainStats(questions, state, d.n);
    const chk = lastChecks[d.n];
    return `
          <article class="ex-domain" style="--w:${d.weight}">
            <a class="ex-domain-head" href="#/exam/domain/${d.n}"><span class="ex-dn">${d.n}.0</span><strong>${esc(d.name)}</strong></a>
            <div class="ex-weight"><span>${d.weight}% of the exam</span><span>about ${quotas[d.n]} of ${bp.questions}</span></div>
            ${pctBar(st.accuracy, st.accuracy === null ? '' : st.accuracy >= bp.target ? 'good' : st.accuracy >= 70 ? 'mid' : 'low')}
            <div class="ex-dstats"><span>${st.accuracy === null ? 'not started' : `${st.accuracy}% right`}</span><span>${st.seen}/${st.total} seen</span>${chk ? `<span>check ${chk.percent}%</span>` : ''}${avgs[d.n] !== undefined && avgs[d.n] !== null ? `<span>mocks ${avgs[d.n]}%</span>` : ''}</div>
            <div class="ex-actions"><button type="button" class="ex-btn small" data-dpractice="${d.n}">Practice 10</button><button type="button" class="ex-btn small ghost" data-check="${d.n}">Check · ${CHECK_SIZE}</button></div>
          </article>`;
  }).join('')}
        </div>
      </section>

      ${mocks.length ? `
      <section>
        <h2 class="ex-h2">Mock history <span>${mocks.length}</span></h2>
        <div class="ex-trend" aria-hidden="true">${mocks.slice(0, 12).reverse().map((a) => `<i class="${a.percent >= bp.target ? 'good' : ''}" style="height:${Math.max(6, a.percent)}%" title="${a.percent}%"></i>`).join('')}<b style="bottom:${bp.target}%"></b></div>
        <ul class="ex-history">${mocks.map((a) => `<li><a href="#/exam/result/${esc(a.id)}"><span>${fmtDay(a.finishedAt)}</span><strong class="${a.percent >= bp.target ? 'good' : ''}">${a.percent}%</strong><span>${a.correct}/${a.total}</span><span>${fmtClock(a.seconds * 1000)}${a.overTime ? ' · over time' : ''}</span></a></li>`).join('')}</ul>
      </section>` : ''}

      <section class="ex-honest">
        <h2 class="ex-h2">What this is, honestly</h2>
        <ul>
          <li>Every question is original and checked against official sources (NIST, CISA, OWASP, MITRE, vendor docs). None are real exam questions.</li>
          <li>The real exam also has hands-on simulations (a firewall, a network diagram, a terminal). Those labs come next; meanwhile try <a href="${esc(bp.links.demo)}" target="_blank" rel="noopener noreferrer">CompTIA's own demo simulation</a>.</li>
          <li>CompTIA's pass mark is a scaled 750 of 900, not a fixed percentage. ${bp.target}% here is a stricter bar on purpose, the way 80% got you through the pest-control exam.</li>
          <li>Some questions are held out: they only show up in mocks and domain checks, so a mock is never just a repeat of practice.</li>
        </ul>
      </section>
    </main>`;

  const on = (sel, fn) => ctx.app.querySelectorAll(sel).forEach((el) => el.addEventListener('click', () => fn(el)));
  on('[data-mock]', () => startMock());
  on('[data-review]', () => startReview());
  on('[data-quiz]', () => startPractice(questions, 'Quiz me', 20));
  on('[data-obj]', (el) => startPractice(questions.filter((q) => q.obj === el.dataset.obj), `Objective ${el.dataset.obj}`, 10));
  on('[data-dpractice]', (el) => startPractice(questions.filter((q) => String(q.d) === el.dataset.dpractice), `Domain ${el.dataset.dpractice} practice`, 10));
  on('[data-check]', (el) => startCheck(Number(el.dataset.check)));
  on('[data-discard]', () => { const st = load(); st.session = null; store(st); pendingStart = null; showHub(); });
  on('[data-replace]', () => { const spec = pendingStart; const st = load(); st.session = null; store(st); pendingStart = null; start(spec); });
  on('[data-keep]', () => { pendingStart = null; showHub(); });
}

/* ---------------- one domain ---------------- */

function showDomain(n) {
  const { esc } = ctx;
  const d = domainOf(n);
  const state = load();
  const st = domainStats(questions, state, n);
  ctx.app.innerHTML = `
    ${ctx.header('exam')}
    <main class="exam">
      <a class="ex-back" href="#/exam">← Exam practice</a>
      <div class="ex-kicker">Domain ${d.n}.0 · ${d.weight}% of the exam · about ${quotas[d.n]} of ${bp.questions} questions</div>
      <h1>${esc(d.name)}</h1>
      <p class="ex-muted">${st.seen} of ${st.total} questions seen${st.accuracy === null ? '' : ` · ${st.accuracy}% right on your latest answers`} · ${st.total - st.practice} held out for mocks and checks.</p>
      <div class="ex-actions"><button type="button" class="ex-btn primary" data-dpractice>Practice 10</button><button type="button" class="ex-btn" data-check>Domain check · ${CHECK_SIZE}</button></div>
      <ul class="ex-objs">
        ${d.objectives.map((o) => {
    const os = objectiveStats(questions, state, o.id);
    return `<li><span class="ex-obj">${esc(o.id)}</span><div><strong>${esc(o.label)}</strong>${pctBar(os.accuracy, os.accuracy === null ? '' : os.accuracy >= bp.target ? 'good' : os.accuracy >= 70 ? 'mid' : 'low')}<small>${os.seen}/${os.total} seen${os.accuracy === null ? '' : ` · ${os.accuracy}% right`}${os.wrong ? ` · ${os.wrong} to fix` : ''}</small></div><button type="button" class="ex-btn small" data-obj="${esc(o.id)}">Practice</button></li>`;
  }).join('')}
      </ul>
    </main>`;
  ctx.app.querySelector('[data-dpractice]').addEventListener('click', () => startPractice(questions.filter((q) => q.d === n), `Domain ${n} practice`, 10));
  ctx.app.querySelector('[data-check]').addEventListener('click', () => startCheck(n));
  ctx.app.querySelectorAll('[data-obj]').forEach((b) => b.addEventListener('click', () => startPractice(questions.filter((q) => q.obj === b.dataset.obj), `Objective ${b.dataset.obj}`, 10)));
}

/* ---------------- the session runner ---------------- */

function flushTimer(force = false) {
  if (!timer) return;
  const now = Date.now();
  if (document.visibilityState === 'visible') timer.pending += now - timer.since;
  timer.since = now;
  if (timer.pending >= 1000 || (force && timer.pending > 0)) {
    const st = load();
    if (st.session && st.session.id === timer.sid) { st.session.elapsedMs += timer.pending; store(st); }
    timer.pending = 0;
  }
}

function sourceLinks(q) {
  const { esc } = ctx;
  const links = (q.src || []).map((k) => sources[k]).filter(Boolean);
  return links.length ? `<p class="ex-src">Source: ${links.map(([title, url]) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(title)}</a>`).join(' · ')}</p>` : '';
}

function feedbackHtml(q, chose) {
  const { esc } = ctx;
  const ok = chose === q.answer;
  const whyNot = !ok && chose >= 0 && q.whyNot && q.whyNot[String(chose)];
  return `<div class="ex-feedback ${ok ? 'ok' : 'no'}" role="status">
    <strong>${ok ? 'Correct.' : chose < 0 ? 'Not answered.' : 'Not quite.'}</strong> ${ok ? '' : `The answer is <b>${esc(q.choices[q.answer])}</b>.`}
    <p>${esc(q.why)}</p>
    ${whyNot ? `<p class="ex-whynot"><b>Why not this one:</b> ${esc(whyNot)}</p>` : ''}
    ${sourceLinks(q)}
  </div>`;
}

function showSession() {
  const { esc } = ctx;
  leaveExam(); // one timer and one key listener at a time
  const state = load();
  const s = state.session;
  if (!s) { location.hash = '/exam'; return; }
  const live = s.ids.filter((id) => byId[id]);
  if (!live.length) { state.session = null; store(state); location.hash = '/exam'; return; }
  const id = s.ids[s.pos];
  const q = byId[id];
  const order = s.orders[id];
  const chose = s.answers[id];
  const locked = s.feedback && chose !== undefined;
  const answeredCount = Object.keys(s.answers).length;
  const isTimed = s.kind === 'mock';
  const last = s.pos === s.ids.length - 1;
  const doneAll = s.feedback && answeredCount === s.ids.length;

  ctx.app.innerHTML = `
    ${ctx.header('exam')}
    <main class="exam ex-run" data-kind="${s.kind}">
      <div class="ex-runbar">
        <div><div class="ex-kicker">${esc(s.title)}</div><strong>Question ${s.pos + 1} of ${s.ids.length}</strong> <span class="ex-muted">· ${answeredCount} answered</span></div>
        ${isTimed ? `<div class="ex-timer" aria-live="off"><span id="ex-clock">${fmtClock(s.limitMs - s.elapsedMs)}</span><small>left</small></div>` : ''}
      </div>
      ${pctBar(Math.round((answeredCount / s.ids.length) * 100), 'thin')}
      ${isTimed ? '<p class="ex-overtime" id="ex-overtime" hidden>Time is up. On the real exam it would end here; submit when you are ready.</p>' : ''}
      ${q ? `
      <article class="ex-q">
        ${s.feedback ? `<div class="ex-obj-tag">${esc(q.obj)} · ${esc((domainOf(q.d).objectives.find((o) => o.id === q.obj) || {}).label || '')}</div>` : ''}
        <h2 id="ex-qtext">${esc(q.q)}</h2>
        <div class="ex-choices" role="group" aria-labelledby="ex-qtext">
          ${order.map((bank, i) => {
    let cls = '';
    if (locked) cls = bank === q.answer ? ' right' : bank === chose ? ' wrong' : ' dim';
    else if (bank === chose) cls = ' picked';
    return `<button type="button" class="ex-choice${cls}" data-bank="${bank}" aria-pressed="${bank === chose}" ${locked ? 'aria-disabled="true"' : ''}><span class="ex-letter">${LETTERS[i]}</span><span>${esc(q.choices[bank])}</span></button>`;
  }).join('')}
        </div>
        ${locked ? feedbackHtml(q, chose) : ''}
      </article>` : '<article class="ex-q"><p>This question was retired from the bank and is not scored. Move on.</p></article>'}

      <div class="ex-nav">
        <button type="button" class="ex-btn ghost" data-prev ${s.pos === 0 ? 'disabled' : ''}>← Previous</button>
        ${s.feedback ? '' : `<button type="button" class="ex-btn ghost${s.flags[id] ? ' flagged' : ''}" data-flag aria-pressed="${!!s.flags[id]}">${s.flags[id] ? '⚑ Flagged' : '⚐ Flag'}</button>`}
        ${last ? '' : `<button type="button" class="ex-btn${s.feedback && !locked ? ' ghost' : ' primary'}" data-next>Next →</button>`}
        ${s.feedback ? (doneAll || last ? '<button type="button" class="ex-btn primary" data-finish>Finish</button>' : '') : '<button type="button" class="ex-btn" data-submit>Submit…</button>'}
      </div>

      ${s.feedback ? '' : `
      <details class="ex-navigator"${s.ids.length <= 20 ? ' open' : ''}>
        <summary>All questions · ${answeredCount} answered · ${Object.keys(s.flags).length} flagged</summary>
        <div class="ex-grid">${s.ids.map((qid, i) => `<button type="button" class="ex-cell${s.answers[qid] !== undefined ? ' done' : ''}${s.flags[qid] ? ' flag' : ''}${i === s.pos ? ' here' : ''}" data-go="${i}" aria-label="Question ${i + 1}${s.answers[qid] !== undefined ? ', answered' : ''}${s.flags[qid] ? ', flagged' : ''}">${i + 1}</button>`).join('')}</div>
      </details>
      <section class="ex-submit" id="ex-submit" hidden tabindex="-1" role="alertdialog" aria-label="Submit the exam?">
        <p><strong>Submit now?</strong> ${s.ids.length - answeredCount} unanswered (they count as wrong) and ${Object.keys(s.flags).length} flagged.</p>
        <div class="ex-actions"><button type="button" class="ex-btn primary" data-confirm>Submit and see my score</button><button type="button" class="ex-btn ghost" data-cancel>Keep working</button></div>
      </section>`}
      <p class="ex-keys ex-muted">Keys: 1 to 4 or A to D choose · ← → move${s.feedback ? '' : ' · F flags'}</p>
    </main>`;

  const go = (pos) => { flushTimer(); const st = load(); if (!st.session) return; st.session.pos = Math.max(0, Math.min(st.session.ids.length - 1, pos)); store(st); showSession(); const first = ctx.app.querySelector('.ex-choice'); if (first) first.focus(); };
  const choose = (bank) => {
    if (!q || locked) return;
    flushTimer();
    const st = load();
    if (!st.session) return;
    st.session.answers[id] = bank;
    // practice and review: the answer goes into history now (and may unlock an achievement); mocks score at the end
    if (s.feedback) ctx.celebrate(() => store(addEntries(st, [[id, { t: Date.now(), c: bank, ok: bank === q.answer, m: s.kind === 'review' ? 'r' : 'p' }]])));
    else store(st);
    showSession();
    const focusEl = ctx.app.querySelector(s.feedback ? '[data-next], [data-finish]' : `.ex-choice[data-bank="${bank}"]`);
    if (focusEl) focusEl.focus();
  };
  ctx.app.querySelectorAll('.ex-choice').forEach((b) => b.addEventListener('click', () => choose(Number(b.dataset.bank))));
  const click = (sel, fn) => { const el = ctx.app.querySelector(sel); if (el) el.addEventListener('click', fn); };
  click('[data-prev]', () => go(s.pos - 1));
  click('[data-next]', () => go(s.pos + 1));
  click('[data-flag]', () => { const st = load(); if (st.session.flags[id]) delete st.session.flags[id]; else st.session.flags[id] = true; store(st); showSession(); const f = ctx.app.querySelector('[data-flag]'); if (f) f.focus(); });
  ctx.app.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => go(Number(b.dataset.go))));
  click('[data-submit]', () => { const box = ctx.app.querySelector('#ex-submit'); box.hidden = false; box.focus(); });
  click('[data-cancel]', () => { ctx.app.querySelector('#ex-submit').hidden = true; ctx.app.querySelector('[data-submit]').focus(); });
  click('[data-confirm]', () => finishScored());
  click('[data-finish]', () => finishPractice());

  if (isTimed) {
    timer = { id: 0, sid: s.id, since: Date.now(), pending: 0 };
    const tick = () => {
      if (!timer) return;
      const now = Date.now();
      if (document.visibilityState === 'visible') timer.pending += now - timer.since;
      timer.since = now;
      const left = s.limitMs - s.elapsedMs - timer.pending;
      const clock = document.getElementById('ex-clock');
      if (clock) clock.textContent = fmtClock(left);
      const over = document.getElementById('ex-overtime');
      if (over) over.hidden = left > 0;
      if (timer.pending >= 10000) {
        const st = load();
        if (st.session && st.session.id === timer.sid) { st.session.elapsedMs += timer.pending; s.elapsedMs = st.session.elapsedMs; store(st); }
        timer.pending = 0;
      }
    };
    timer.id = setInterval(tick, 1000);
    tick();
  }

  keyHandler = (e) => {
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    const idx = '1234'.indexOf(k) >= 0 ? '1234'.indexOf(k) : 'abcd'.indexOf(k);
    if (idx >= 0 && order && idx < order.length) { e.preventDefault(); choose(order[idx]); } else if (e.key === 'ArrowRight' && !last) { e.preventDefault(); go(s.pos + 1); } else if (e.key === 'ArrowLeft' && s.pos > 0) { e.preventDefault(); go(s.pos - 1); } else if (k === 'f' && !s.feedback) { e.preventDefault(); const f = ctx.app.querySelector('[data-flag]'); if (f) f.click(); }
  };
  document.addEventListener('keydown', keyHandler);
}

function finishScored() {
  leaveExam();
  let attempt = null;
  ctx.celebrate(() => {
    const res = finishExamSession(load(), byId);
    attempt = res.attempt;
    store(res.state);
  });
  if (attempt) location.hash = `/exam/result/${attempt.id}`;
}

function finishPractice() {
  const st = load();
  const s = st.session;
  if (!s) { location.hash = '/exam'; return; }
  const right = s.ids.filter((qid) => byId[qid] && s.answers[qid] === byId[qid].answer).length;
  const total = Object.keys(s.answers).length;
  st.session = null;
  store(st);
  ctx.app.innerHTML = `
    ${ctx.header('exam')}
    <main class="exam">
      <section class="ex-done">
        <div class="ex-kicker">${ctx.esc(s.title)}</div>
        <h1>${right} of ${total} right</h1>
        <p class="ex-muted">Every answer is in your history: misses come back in the review queue now, right answers after 1, 3, 7, 14 and 30 days.</p>
        <div class="ex-actions"><a class="ex-btn primary" href="#/exam">Back to exam practice</a></div>
      </section>
    </main>`;
  const b = ctx.app.querySelector('.ex-done .ex-btn');
  if (b) b.focus();
}

/* ---------------- results ---------------- */

function showResult(attemptId) {
  const { esc } = ctx;
  const state = load();
  const a = state.attempts.find((x) => x.id === attemptId);
  if (!a) { location.hash = '/exam'; return; }
  const mocks = state.attempts.filter((x) => x.kind === a.kind && (a.kind !== 'check' || x.domain === a.domain));
  const prev = mocks[mocks.findIndex((x) => x.id === a.id) - 1];
  const delta = prev ? a.percent - prev.percent : null;
  const missed = a.ids.filter((qid) => byId[qid] && a.answers[qid] !== byId[qid].answer);
  const atBar = a.percent >= bp.target;
  ctx.app.innerHTML = `
    ${ctx.header('exam')}
    <main class="exam">
      <a class="ex-back" href="#/exam">← Exam practice</a>
      <section class="ex-score${atBar ? ' good' : ''}">
        <div class="ex-kicker">${a.kind === 'mock' ? 'Full mock exam' : `Domain ${a.domain} check`} · ${fmtDay(a.finishedAt)} · ${fmtClock(a.seconds * 1000)}${a.overTime ? ' (over time)' : ''}</div>
        <div class="ex-score-row">
          <b class="ex-big">${a.percent}%</b>
          <div>
            <strong>${a.correct} of ${a.total} right</strong>
            <p>${atBar ? `At or above your ${bp.target}% bar.` : `Below your ${bp.target}% bar by ${bp.target - a.percent} points.`}${delta === null ? '' : ` ${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)} points vs your previous ${a.kind === 'mock' ? 'mock' : 'check'}.`}</p>
            ${a.removed ? `<p class="ex-muted">${a.removed} retired question${a.removed === 1 ? ' was' : 's were'} not scored.</p>` : ''}
          </div>
        </div>
      </section>
      <section>
        <h2 class="ex-h2">By domain</h2>
        <ul class="ex-bydomain">${Object.entries(a.byDomain).map(([d, [c, t]]) => { const p = t ? Math.round((c / t) * 100) : 0; return `<li><span>${d}.0 ${esc(domainOf(d).name)}</span>${pctBar(p, p >= bp.target ? 'good' : p >= 70 ? 'mid' : 'low')}<b>${c}/${t}</b></li>`; }).join('')}</ul>
      </section>
      ${missed.length ? `
      <section>
        <h2 class="ex-h2">What you missed <span>${missed.length}</span></h2>
        <div class="ex-actions"><button type="button" class="ex-btn primary" data-misses>Practice these ${missed.length} now</button></div>
        <div class="ex-missed">${missed.map((qid, i) => {
    const q = byId[qid];
    const chose = a.answers[qid] === undefined ? -1 : a.answers[qid];
    return `<details class="ex-miss"><summary><span class="ex-obj">${esc(q.obj)}</span> ${i + 1}. ${esc(q.q)}</summary>
            <ul class="ex-miss-choices">${q.choices.map((c, ci) => `<li class="${ci === q.answer ? 'right' : ci === chose ? 'wrong' : ''}">${ci === q.answer ? '✓' : ci === chose ? '✗' : '·'} ${esc(c)}</li>`).join('')}</ul>
            ${feedbackHtml(q, chose)}</details>`;
  }).join('')}</div>
      </section>` : '<p class="ex-muted">Nothing missed. Clean sheet.</p>'}
    </main>`;
  const b = ctx.app.querySelector('[data-misses]');
  if (b) b.addEventListener('click', () => startMisses(missed));
}

// For the Journey page: a one-line summary of exam practice.
export function examSummary() {
  const state = load();
  const r = readiness(state, questions, bp.target);
  let run = 0;
  const mocks = state.attempts.filter((a) => a.kind === 'mock');
  for (let i = mocks.length - 1; i >= 0 && mocks[i].percent >= bp.target && run < 3; i -= 1) run += 1;
  return { ...r, due: reviewDue(questions, state).length, total: questions.length, target: bp.target, name: `${bp.name} ${bp.code}`, runAtTarget: run };
}
