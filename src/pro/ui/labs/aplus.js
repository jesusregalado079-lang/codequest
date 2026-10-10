// The A+ labs (group 'aplus'): one lab's page (refresher, cases, remembered mode) and the case page every A+ lab shares:
// the ticket with glossary popovers, the Guided / Practice / Exam switch, the lab area (sim, terminal, build bench or
// ordering list), the Coach panel (goal checklist, three-tier hints, live coaching in Guided), Check with per-goal
// corrections, Show me, and a Show solution walkthrough replayed on a fresh copy of the case.
// Rules and scoring live in ../../labs/aplus/ (coach.js and the engines); this module only draws and wires them.
import { MODES, createCoach, createNextAttemptAssistance, createPendingAssistStore } from '../../labs/aplus/coach.js';
import { isMastered, isPassed, bestScore } from '../../labs/lab-logic.js';
import { BLUEPRINTS } from '../../exam/blueprints.js';
import { getLabs } from '../../progress.js';
import { S, esc, bestLine, examChips, focusResult, itemIdOf, levelName, nextCaseHref, onLeave, record, stopwatch } from './shared.js';
import { createSimArea, simEngine } from './aplus-sim.js';
import { createShellArea, shellEngine } from './aplus-shell.js';
import { createBuildArea, buildEngine } from './aplus-build.js';
import { createOrderArea, orderEngine } from './aplus-order.js';
import { labsSummary } from './summary.js';

const AREAS = {
  sim: { create: createSimArea, engine: simEngine },
  shell: { create: createShellArea, engine: shellEngine },
  pcbuild: { create: createBuildArea, engine: buildEngine },
  order: { create: createOrderArea, engine: orderEngine },
};
const TIER = ['Nudge', 'Hint', 'Show me'];
const MODE_TEXT = {
  guided: 'The checklist is on, the coach tells you when a goal is done or something went wrong, and offers a hint when you stall.',
  practice: 'The checklist is on and hints are there when you ask. No coaching until you check.',
  exam: 'Like the real performance-based question: the ticket and a suggested time, no checklist, no hints, no feedback until Check. A pass here marks the case Mastered ★.',
};
const MODE_NAME = { guided: 'Guided', practice: 'Practice', exam: 'Exam' };

// ---------- per-lab mode, a UI preference (never inside codequest-pro-v1) ----------
const PREF_KEY = 'codequest-pro-ui';
function readPrefs() {
  try {
    const o = JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
    return o && typeof o === 'object' && !Array.isArray(o) ? o : {};
  } catch { return {}; }
}
export function modeFor(labId) {
  const m = readPrefs().labModes;
  const v = m && typeof m === 'object' ? m[labId] : null;
  return MODES.includes(v) ? v : 'guided';
}
function saveMode(labId, mode) {
  try {
    const p = readPrefs();
    const m = p.labModes && typeof p.labModes === 'object' && !Array.isArray(p.labModes) ? p.labModes : {};
    localStorage.setItem(PREF_KEY, JSON.stringify({ ...p, labModes: { ...m, [labId]: mode } }));
  } catch { /* storage blocked: the mode still applies on this page */ }
}

// ---------- "next attempt is assisted" after Show solution, per case, for this page session ----------
// The Map lives as long as this lazily loaded chunk, so it survives a re-render of the case page and hash navigation
// away and back; sessionStorage (same tab only) keeps the flag across a reload. Storage access is guarded.
const PENDING_ASSIST = new Map();
let assistStore = null;
function pendingAssist() {
  if (!assistStore) {
    let ss = null;
    try { ss = sessionStorage; } catch { /* storage blocked: the Map still holds the flag on this page */ }
    assistStore = createPendingAssistStore(PENDING_ASSIST, ss);
  }
  return assistStore;
}

// ---------- shared bits ----------
const EXAM_SHORT = Object.fromEntries(BLUEPRINTS.map((bp) => [bp.id, bp.short]));
function srcLinks(lab, keys, label = 'Source') {
  const src = lab.sources || {};
  const links = [...new Set(keys || [])].map((k) => src[k]).filter((x) => Array.isArray(x) && x.length >= 2);
  return links.length ? `<p class="ex-src">${esc(label)}: ${links.map(([title, url]) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(title)}</a>`).join(' · ')}</p>` : '';
}
let tblN = 0;
function bodyHtml(body, caption) {
  const items = Array.isArray(body) ? body : [body];
  return items.map((it) => {
    if (typeof it === 'string') return `<p>${esc(it)}</p>`;
    if (!Array.isArray(it) || !it.length) return '';
    const [head, ...rows] = it;
    tblN += 1;
    return `<div class="ap-tablewrap" role="region" aria-labelledby="ap-tc-${tblN}" tabindex="0"><table class="ap-table ap-ptable"><caption id="ap-tc-${tblN}">${esc(caption)}</caption>
      <thead><tr>${head.map((h) => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${esc(c)}</th>` : `<td>${esc(c)}</td>`)).join('')}</tr>`).join('')}</tbody></table></div>`;
  }).join('');
}
export function primerHtml(lab, level = 3) {
  const p = lab.primer;
  if (!p || !Array.isArray(p.sections)) return '';
  return `${p.sections.map((sec) => `<section class="ap-psec"><h${level}>${esc(sec.h)}</h${level}>${bodyHtml(sec.body, sec.h)}</section>`).join('')}${srcLinks(lab, p.src, 'Sources')}`;
}
const fmtClock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Scenario text with glossary terms as popover buttons (first use of each term). Every piece is escaped.
let termN = 0;
function withTerms(text, terms) {
  const names = Object.keys(terms || {}).filter((t) => t && t.length > 1).sort((a, b) => b.length - a.length);
  if (!names.length) return esc(text);
  const rx = new RegExp(`(?<![\\w-])(${names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\w-])`, 'gi');
  const used = new Set();
  let out = '';
  let last = 0;
  String(text).replace(rx, (m, _g, at) => {
    const name = names.find((n) => n.toLowerCase() === m.toLowerCase());
    if (!name || used.has(name)) return m;
    used.add(name);
    termN += 1;
    out += `${esc(String(text).slice(last, at))}<button type="button" class="ap-gloss" data-term="${termN}" aria-expanded="false" aria-controls="ap-def-${termN}">${esc(m)}</button><span class="ap-def" id="ap-def-${termN}" role="note" hidden><b>${esc(name)}</b> ${esc(terms[name])}</span>`;
    last = at + m.length;
    return m;
  });
  return out + esc(String(text).slice(last));
}
function wireTerms(root) {
  let open = null;
  const close = () => { if (!open) return; open.btn.setAttribute('aria-expanded', 'false'); open.def.hidden = true; open = null; };
  const place = (btn, def) => {
    def.hidden = false;
    const r = btn.getBoundingClientRect();
    const w = Math.min(340, innerWidth - 24);
    def.style.width = `${w}px`;
    def.style.left = `${Math.max(12, Math.min(r.left, innerWidth - w - 12))}px`;
    const h = def.offsetHeight;
    def.style.top = `${r.bottom + 8 + h > innerHeight && r.top > h + 8 ? r.top - h - 8 : r.bottom + 8}px`;
  };
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('.ap-gloss');
    if (!btn) { if (open && !e.target.closest('.ap-def')) close(); return; }
    const def = root.querySelector(`#ap-def-${btn.dataset.term}`);
    if (open && open.btn === btn) { close(); return; }
    close();
    btn.setAttribute('aria-expanded', 'true');
    place(btn, def);
    open = { btn, def };
  });
  const onKey = (e) => { if (e.key === 'Escape' && open) { const b = open.btn; close(); b.focus(); } };
  const onScroll = () => close();
  document.addEventListener('keydown', onKey);
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onLeave(() => { document.removeEventListener('keydown', onKey); removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); });
}

const modeSwitch = (name, mode) => `
  <fieldset class="ap-modes" data-modes>
    <legend>Mode</legend>
    <div class="ap-seg">${MODES.map((m) => `<label class="ap-seg-opt${m === mode ? ' on' : ''}"><input type="radio" name="${name}" value="${m}"${m === mode ? ' checked' : ''}><span>${MODE_NAME[m]}</span></label>`).join('')}</div>
    <p class="ap-mode-text" aria-live="polite">${esc(MODE_TEXT[mode])}</p>
  </fieldset>`;

// ---------- one A+ lab: refresher, cases, mode ----------
export function showAplusLab(lab) {
  const sum = labsSummary();
  const p = sum.perLab.find((x) => x.id === lab.id) || { passed: 0, total: lab.cases.length, mastered: 0 };
  const labs = getLabs();
  const pct = p.total ? Math.round((p.passed / p.total) * 100) : 0;
  let mode = modeFor(lab.id);
  S.ctx.app.innerHTML = `
    ${S.ctx.header('labs')}
    <main class="exam labs ap ap-labpage">
      <a class="ex-back" href="#/labs">← Hands-on Labs</a>
      <section class="lb-labhead">
        <span class="lb-bigicon" aria-hidden="true">${lab.icon}</span>
        <div>
          <div class="ex-kicker">A+ lab · ${p.passed} of ${p.total} passed · ${p.mastered || 0} mastered ★ · pass mark ${lab.pass}%</div>
          <h1>${esc(lab.name)}</h1>
          <p class="ex-muted">${esc(lab.blurb)}</p>
          ${examChips(lab.examObjs)}
          <span class="ex-bar${pct === 100 ? ' good' : ''}"><i style="width:${pct}%"></i></span>
        </div>
      </section>
      ${modeSwitch('ap-labmode', mode)}
      ${lab.primer ? `<details class="ap-refresher" id="refresher"><summary><span class="ap-ref-k">Refresher</span> <strong>${esc(lab.primer.title || 'The rules to know')}</strong> <small>${lab.primer.sections?.length || 0} short sections · tables and rules with sources</small></summary><div class="ap-ref-body">${primerHtml(lab, 3)}</div></details>` : ''}
      <h2 class="ex-h2 c-h2">Cases <span>${lab.cases.length} · warm-up to exam-hard</span></h2>
      <ol class="lb-cases ap-cases">
        ${lab.cases.map((c, i) => {
    const id = itemIdOf(lab, c);
    const passed = isPassed(labs, id, lab.pass);
    const star = isMastered(labs, id, lab.pass);
    const best = bestScore(labs, id);
    return `
        <li class="lb-case" style="--i:${i}">
          <a href="#/labs/${esc(lab.id)}/${esc(c.id)}" data-case="${esc(c.id)}">
            <span class="lb-case-n${passed ? ' ok' : ''}">${star ? '★' : passed ? '✓' : i + 1}</span>
            <span class="lb-case-body">
              <strong>${esc(c.title)}</strong>
              <small>${esc(levelName(c.level))}${c.minutes ? ` · about ${c.minutes} min` : ''}</small>
              <span class="lb-case-meta">${Object.entries(c.examObjs || {}).flatMap(([k, objs]) => objs.map((o) => `<i>${esc(EXAM_SHORT[k] || k)} ${esc(o)}</i>`)).join('')}${best === null ? '<span class="lb-best none">Not tried yet</span>' : bestLine(lab, c)}</span>
            </span>
            <span class="lb-case-go" aria-hidden="true">→</span>
          </a>
        </li>`;
  }).join('')}
      </ol>
      <section class="ex-honest">
        <h2 class="ex-h2 c-h2">How these work</h2>
        <ul>
          <li><b>Guided</b> coaches you as you go, <b>Practice</b> keeps the checklist and hints on request, <b>Exam</b> gives only the ticket and a suggested time. Your choice is remembered for this lab.</li>
          <li>Each goal has three hints: a nudge, a hint, and Show me, which points at the exact control. Show me makes that attempt assisted. Viewing the solution walkthrough makes the next attempt in this page session assisted. Assisted attempts are saved, but only an unassisted run at ${lab.pass}% passes.</li>
          <li>A pass in Exam mode marks the case mastered ★. Every case is original, with fictional people and companies.</li>
        </ul>
      </section>
    </main>`;
  S.ctx.app.querySelector('[data-modes]').addEventListener('change', (e) => {
    if (!e.target.matches('input[type="radio"]')) return;
    mode = e.target.value;
    saveMode(lab.id, mode);
    const fs = e.target.closest('[data-modes]');
    fs.querySelectorAll('.ap-seg-opt').forEach((l) => l.classList.toggle('on', l.querySelector('input').checked));
    fs.querySelector('.ap-mode-text').textContent = MODE_TEXT[mode];
  });
}

// ---------- the case page ----------
function goalStepMap(lab, kase) {
  const map = {};
  try {
    const eng = AREAS[lab.kind].engine(kase);
    (kase.solution || []).forEach((step, i) => {
      eng.apply(step);
      eng.check().goals.forEach((g) => { if (g.pass && map[g.id] === undefined) map[g.id] = i; });
    });
  } catch { /* a broken solution never breaks the page: Show me then has no target */ }
  return map;
}

export function showAplusCase(lab, kase) {
  const def = AREAS[lab.kind];
  const solution = Array.isArray(kase.solution) ? kase.solution : [];
  const goals = kase.goals || [];
  const steps = goalStepMap(lab, kase);
  const R = { mode: modeFor(lab.id), coach: null, nextAssistance: createNextAttemptAssistance(pendingAssist(), itemIdOf(lab, kase)), area: null, clock: stopwatch(), idle: 0, offered: false, checked: false, feed: [], walk: null, timer: null, showme: '' };
  const { app, header } = S.ctx;
  const nx = nextCaseHref(lab, kase);
  app.innerHTML = `
    ${header('labs')}
    <main class="exam labs lb-run ap ap-case ap-kind-${esc(lab.kind)}">
      <a class="ex-back" href="#/labs/${esc(lab.id)}">← ${esc(lab.name)}</a>
      <section class="lb-runhead">
        <span class="lb-runicon" aria-hidden="true">${lab.icon}</span>
        <div>
          <div class="ex-kicker">${esc(lab.name)} · ${esc(levelName(kase.level))}${kase.minutes ? ` · about ${kase.minutes} min` : ''}</div>
          <h1>${esc(kase.title)}</h1>
          <div class="lb-runmeta">${examChips(kase.examObjs)}${bestLine(lab, kase)}</div>
        </div>
      </section>
      <section class="ap-ticket" aria-label="Ticket">
        <div class="cl-ticket"><span>Ticket</span><b>${esc(kase.id)}</b><small>${esc(MODE_NAME[R.mode])}</small></div>
        <div class="ap-ticket-body"><p class="ap-scenario">${withTerms(kase.scenario || '', lab.terms)}</p>
          ${lab.primer ? '<button type="button" class="ap-linkbtn" data-primer>Need a refresher?</button>' : ''}</div>
      </section>
      ${modeSwitch('ap-mode', R.mode)}
      <div class="ap-showme" role="status" aria-live="polite" hidden></div>
      <div class="ap-work">
        <section class="ap-area" aria-label="${esc(lab.name)}: the lab"></section>
        <div class="ap-side"><aside class="ap-coach" aria-labelledby="ap-coach-h"></aside><div class="ap-side-extra"></div></div>
      </div>
      <div class="ex-actions ap-checkbar"><button type="button" class="ex-btn primary" data-check>Check</button><button type="button" class="ex-btn" data-restart>Restart</button></div>
      <section class="lb-result ap-result" aria-live="polite"></section>
      <section class="ap-walk" hidden aria-labelledby="ap-walk-h"></section>
      ${lab.primer ? `<dialog class="ap-primer" aria-labelledby="ap-primer-h"><div class="ap-primer-head"><h2 id="ap-primer-h">${esc(lab.primer.title || 'Refresher')}</h2><button type="button" class="ex-btn small" data-primer-close>Close</button></div><div class="ap-primer-body">${primerHtml(lab, 3)}</div></dialog>` : ''}
    </main>`;
  const $ = (sel) => app.querySelector(sel);
  const areaHost = $('.ap-area');
  const coachEl = $('.ap-coach');
  const resultEl = $('.ap-result');
  const walkEl = $('.ap-walk');
  const showmeEl = $('.ap-showme');

  const srcHtml = (keys) => srcLinks(lab, keys);
  function start() {
    R.coach = createCoach(kase, R.mode);
    R.nextAssistance.startAttempt(R.coach);
    if (R.area) R.area.destroy();
    R.area = def.create({ kase, esc, mode: R.mode, onAction, srcHtml });
    areaHost.replaceChildren(R.area.el);
    $('.ap-side-extra').replaceChildren(...(R.area.side ? [R.area.side] : []));
    R.area.render();
    R.clock.reset();
    R.idle = 0;
    R.offered = false;
    R.checked = false;
    R.feed = [];
    R.seen = 0;
    R.showme = '';
    areaHost.inert = false;
    if (R.mode === 'guided') say('info', 'Guided mode is on. I will tell you when a goal is done or when something goes wrong. Each goal has hints if you want them.');
    resultEl.innerHTML = '';
    closeWalk();
    drawShowme();
    drawCoach();
    $('[data-check]').disabled = false;
    $('.cl-ticket small').textContent = MODE_NAME[R.mode];
  }

  // ----- coach panel -----
  function liveGoals() {
    try { return R.area.check().goals; } catch { return goals.map((g) => ({ id: g.id, pass: false })); }
  }
  function say(kind, text, extra = {}) {
    R.feed.push({ kind, text, ...extra });
    if (R.feed.length > 8) { R.seen = Math.max(0, (R.seen || 0) - (R.feed.length - 8)); R.feed = R.feed.slice(-8); }
  }
  function feedHtml() {
    const seen = R.seen || 0;
    R.seen = R.feed.length;
    return R.feed.map((m, i) => `<li class="ap-msg ${m.kind}${i >= seen ? ' new' : ''}"><span class="ap-msg-k">${{ done: '✓ Done', trap: '⚠ Problem', error: 'Not quite', hint: m.tier ? TIER[m.tier - 1] : 'Hint', offer: 'Coach', info: 'Coach' }[m.kind] || 'Coach'}</span>
      <p>${esc(m.text)}</p>${m.why ? `<p class="ap-rule"><b>Rule:</b> ${esc(m.why)}</p>` : ''}${m.critical ? '<p class="ap-crit">Critical: while this is left this way, the score is capped at 60.</p>' : ''}${m.src ? srcHtml(m.src) : ''}
      ${m.offer ? `<button type="button" class="ex-btn small" data-offer="${esc(m.offer)}">Get a ${esc(TIER[Math.min(2, R.coach.tiers[m.offer] || 0)].toLowerCase())}</button>` : ''}</li>`).join('');
  }
  function drawCoach() {
    if (R.mode === 'exam') {
      coachEl.className = 'ap-coach exam';
      coachEl.innerHTML = `<h2 id="ap-coach-h" class="ap-coach-h">Exam mode</h2>
        <div class="ap-clock"><div><span>Suggested</span><b>${kase.minutes ? `${esc(kase.minutes)} min` : 'none'}</b></div><div><span>Elapsed</span><b data-elapsed>${fmtClock(R.clock.secs())}</b></div></div>
        <p class="ap-exam-note">No checklist, no hints and no feedback until you select Check, as on the real exam. The time is a guide, not a limit. Pass without help to master this case ★.</p>`;
      return;
    }
    const live = liveGoals();
    const tiers = R.coach.tiers;
    const done = live.filter((g) => g.pass).length;
    coachEl.className = `ap-coach ${R.mode}`;
    coachEl.innerHTML = `<h2 id="ap-coach-h" class="ap-coach-h">Coach <small>${done} of ${goals.length} goals done</small></h2>
      <ol class="ap-goallist">${goals.map((g) => {
    const pass = !!live.find((x) => x.id === g.id)?.pass;
    const t = tiers[g.id] || 0;
    const next = Math.min(3, t + 1);
    return `<li class="ap-goal${pass ? ' done' : ''}" data-goal="${esc(g.id)}">
          <span class="ap-gmark" aria-hidden="true">${pass ? '✓' : ''}</span>
          <div class="ap-gbody"><span class="ap-gtext">${esc(g.text)}</span><span class="visually-hidden">${pass ? ' (done)' : ' (not done yet)'}</span>
            ${t ? `<div class="ap-hints">${(g.hints || []).slice(0, t).map((h, i) => `<p class="ap-hint t${i + 1}"><b>${TIER[i]}</b> ${esc(h)}</p>`).join('')}</div>` : ''}
            <button type="button" class="ap-hintbtn${t >= 2 && t < 3 ? ' warn' : ''}" data-hint="${esc(g.id)}" aria-label="${esc(t >= 3 ? 'Show me again' : TIER[next - 1])} for: ${esc(g.text)}">${t >= 3 ? 'Show me again' : TIER[next - 1]}</button>
            ${t === 2 ? '<small class="ap-assist-note">Show me points at the exact control and marks this run assisted (saved, but not a pass).</small>' : ''}
          </div></li>`;
  }).join('')}</ol>
      <h3 class="ap-feed-h">${R.mode === 'guided' ? 'Coaching' : 'Hints'}</h3>
      <ol class="ap-feed" role="log" aria-live="polite" aria-label="Coach messages">${feedHtml()}</ol>
      ${R.mode === 'practice' && !R.feed.length ? '<p class="ap-exam-note">Practice mode: hints are on each goal. Full feedback when you check.</p>' : ''}`;
    const list = coachEl.querySelector('.ap-feed');
    if (list) list.scrollTop = list.scrollHeight;
  }
  function drawShowme() {
    showmeEl.hidden = !R.showme;
    showmeEl.innerHTML = R.showme ? `<span class="ap-showme-k">Show me</span> ${esc(R.showme)}` : '';
  }
  function flashEl(el) {
    if (!el) return;
    el.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
    if (el.matches('button, input, select, a, [tabindex]') && !el.disabled) el.focus({ preventScroll: true });
    else el.querySelector('button, input, select')?.focus({ preventScroll: true });
  }
  function showMe(goalId) {
    const g = goals.find((x) => x.id === goalId);
    const hint = R.coach.showMe(goalId);
    if (!g || !hint) return;
    R.showme = hint.text;
    drawShowme();
    drawCoach();
    const at = steps[goalId];
    flashEl(at === undefined ? null : R.area.showMe(solution, at));
  }
  function hint(goalId) {
    if (R.checked) return;
    const t = R.coach.tiers[goalId] || 0;
    if (t >= 2) { showMe(goalId); return; }
    const h = R.coach.hint(goalId);
    if (!h) return;
    R.idle = 0;
    drawCoach();
    coachEl.querySelector(`[data-goal="${CSS.escape(goalId)}"] .ap-hint.t${h.tier}`)?.setAttribute('tabindex', '-1');
    const btn = coachEl.querySelector(`[data-hint="${CSS.escape(goalId)}"]`);
    if (btn) btn.focus({ preventScroll: true });
  }
  function offer() {
    const live = liveGoals();
    const g = goals.find((x) => !live.find((y) => y.id === x.id)?.pass);
    if (!g) return;
    R.offered = true;
    say('offer', `Stuck on "${g.text}"? A hint can point you the right way.`, { offer: g.id });
    drawCoach();
  }
  function onAction(r) {
    if (R.checked || !R.coach) return;
    const o = R.coach.observe(r);
    if ((r.goalsChanged || []).length) { R.idle = 0; R.offered = false; R.showme = ''; drawShowme(); }
    if (R.mode === 'guided') {
      o.messages.filter((m) => m.kind === 'done' || m.kind === 'error').forEach((m) => say(m.kind, m.text));
      (r.trapsHit || []).forEach((tid) => { const t = (kase.traps || []).find((x) => x.id === tid); if (t) say('trap', t.message, { why: t.why, src: t.src, critical: !!t.critical }); });
      if (o.offerHint && !R.offered) offer();
    }
    if (R.mode !== 'exam') drawCoach();
  }
  function tick() {
    if (R.mode === 'exam') { const el = coachEl.querySelector('[data-elapsed]'); if (el && !R.checked) { const s = R.clock.secs(); el.textContent = fmtClock(s); el.classList.toggle('over', !!kase.minutes && s > kase.minutes * 60); } return; }
    if (R.mode !== 'guided' || R.checked || R.offered) return;
    R.idle += 1;
    if (R.coach.offerHint(R.idle)) offer();
  }

  // ----- Check and results -----
  function check() {
    if (R.checked) return;
    const pend = R.area.pending();
    if (pend) {
      resultEl.innerHTML = `<div class="ap-pending" role="alert"><p><b>Unsaved changes on ${esc(pend)}.</b> The router only uses settings you save.</p><div class="ex-actions"><button type="button" class="ex-btn primary" data-pend-save>Save and check</button><button type="button" class="ex-btn" data-pend-discard>Discard and check</button></div></div>`;
      resultEl.querySelector('[data-pend-save]').focus();
      return;
    }
    const res = R.area.check();
    const run = R.coach.finishRun(res, R.clock.secs());
    const rec = record(lab, kase, run.score, run.secs, { mode: run.mode, assisted: run.assisted });
    R.checked = true;
    R.area.setLocked(true);
    areaHost.inert = true;
    if (R.area.side) R.area.side.inert = true;
    R.area.markResults?.(res);
    $('[data-check]').disabled = true;
    resultEl.innerHTML = resultsHtml(res, rec, run);
    focusResult(resultEl);
  }
  function verdict(rec, run) {
    if (!rec.ok) return `Scored ${rec.score}% but not saved: this browser's storage is full or blocked.`;
    if (run.assisted) return `Scored ${rec.score}% with help (Show me or the solution), so this run is saved but is not a pass. Try again or Restart for another attempt.`;
    if (rec.passed && run.mode === 'exam') return rec.firstMastered ? 'Mastered ★. You passed in Exam mode with no help.' : 'Passed in Exam mode again. Still mastered ★.';
    if (rec.passed) return rec.firstPass ? 'Passed. That one is yours now.' : 'Passed again.';
    return `Pass is ${lab.pass}%. Read what missed below, fix it with Try again, or use Show me.`;
  }
  function resultsHtml(res, rec, run) {
    const ok = rec.ok && rec.passed;
    const hits = (res.traps || []).filter((t) => t.hit);
    const trapDef = (id) => (kase.traps || []).find((t) => t.id === id) || {};
    const goalDef = (id) => goals.find((g) => g.id === id) || {};
    return `
      <div class="lb-score${ok ? ' ok' : ''}${rec.ok ? '' : ' unsaved'}${run.assisted ? ' assisted' : ''}">
        <b class="lb-score-num">${rec.score}%</b>
        <div><strong>${ok ? '✓ ' : ''}${esc(verdict(rec, run))}</strong><small>${rec.ok ? `Best ${rec.best}%${rec.prevBest !== null && rec.score > rec.prevBest ? ` · up from ${rec.prevBest}%` : ''} · ${MODE_NAME[run.mode]} mode` : 'This attempt was scored, not saved'}</small></div>
      </div>
      <h3 class="lb-h3">Goals <small>${res.goals.filter((g) => g.pass).length} of ${res.goals.length} met</small></h3>
      <ul class="lb-goals ap-res-goals">${res.goals.map((g) => `<li class="${g.pass ? 'ok' : 'no'}"><span class="lb-mark">${g.pass ? '✓' : '✗'}</span><div><strong>${esc(g.text)}</strong>
        <p class="ap-why"><b>Why it matters:</b> ${esc(g.why || '')}</p>
        ${g.pass ? '' : `<p class="ap-expect"><b>What done looks like:</b> ${esc(g.expect || '')}</p>${steps[g.id] !== undefined ? `<button type="button" class="ex-btn small" data-showme="${esc(g.id)}">Show me</button>` : ''}`}
        ${srcHtml(goalDef(g.id).src)}</div></li>`).join('')}</ul>
      ${hits.length ? `<h3 class="lb-h3">Problems in your fix <small>each one costs a goal's worth${hits.some((t) => t.critical) ? '; a critical one caps the score at 60' : ''}</small></h3>
      <ul class="lb-goals ap-res-traps">${hits.map((t) => `<li class="no"><span class="lb-mark">⚠</span><div><strong>${esc(t.message)}</strong>${t.critical ? '<span class="ap-badge crit">Critical</span>' : ''}<p class="ap-rule"><b>Rule to remember:</b> ${esc(t.why || '')}</p>${srcHtml(trapDef(t.id).src || t.src)}</div></li>`).join('')}</ul>` : ''}
      ${R.area.results ? R.area.results(res) : ''}
      ${srcLinks(lab, kase.src, 'Sources for this case')}
      <div class="ex-actions lb-after ap-after">
        ${solution.length ? '<button type="button" class="ex-btn" data-solution>Show solution</button>' : ''}
        <button type="button" class="ex-btn" data-again>Try again</button>
        <button type="button" class="ex-btn" data-restart>Restart</button>
        <a class="ex-btn${ok ? ' primary' : ''}" href="${esc(nx.href)}" data-nextcase>${esc(nx.label)}</a>
      </div>`;
  }
  function again() {
    closeWalk();
    // Try again keeps the lab state, so the new attempt keeps the help the last one had (SPEC 2.3/2.4).
    R.coach = createCoach(kase, R.mode, { continuesFrom: R.coach });
    R.nextAssistance.startAttempt(R.coach);
    R.clock.reset();
    R.checked = false;
    areaHost.inert = false;
    if (R.area.side) R.area.side.inert = false;
    R.area.setLocked(false);
    resultEl.innerHTML = '';
    $('[data-check]').disabled = false;
    R.idle = 0;
    R.offered = false;
    R.feed = [];
    R.seen = 0;
    R.showme = '';
    drawShowme();
    drawCoach();
  }

  // ----- Show solution -----
  function closeWalk() {
    if (R.walk) { R.walk.area.destroy(); R.walk = null; }
    walkEl.hidden = true;
    walkEl.innerHTML = '';
  }
  function openWalk() {
    R.nextAssistance.viewSolution();
    closeWalk();
    const area = def.create({ kase, esc, demo: true, mode: 'practice', srcHtml });
    R.walk = { area, at: 0 };
    walkEl.hidden = false;
    walkEl.innerHTML = `<h2 id="ap-walk-h" class="ex-h2 c-h2" tabindex="-1">Solution walkthrough <span>${solution.length} steps</span></h2>
      <p class="ap-walk-note">Replayed on a fresh copy of the case, so you can watch each step work. The highlighted control is the one the next step uses.</p>
      <p class="ap-assist-note">Your checked result stays as graded. Your next attempt on this case is assisted, so it cannot pass or master.</p>
      <div class="ap-walk-grid">
        <ol class="ap-walk-steps"></ol>
        <div class="ap-walk-stage" inert></div>
      </div>
      <div class="ap-walk-bar"><button type="button" class="ex-btn" data-wprev>← Back</button><span class="ap-walk-pos" role="status"></span><button type="button" class="ex-btn primary" data-wnext>Next →</button></div>
      <div class="ex-actions"><button type="button" class="ex-btn" data-wclose>Close walkthrough</button><button type="button" class="ex-btn" data-restart>Restart and try it yourself</button></div>`;
    walkEl.querySelector('.ap-walk-stage').append(area.el);
    walkTo(0);
    walkEl.querySelector('#ap-walk-h').focus({ preventScroll: true });
    walkEl.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' });
  }
  function walkTo(at) {
    const w = R.walk;
    if (!w) return;
    w.at = Math.max(0, Math.min(solution.length, at));
    w.area.reset();
    for (let i = 0; i < w.at; i += 1) w.area.apply(solution[i]);
    const score = w.area.check().score;
    if (w.at < solution.length) w.area.preview(solution[w.at]);
    walkEl.querySelector('.ap-walk-steps').innerHTML = solution.map((s, i) => `<li class="${i < w.at ? 'done' : i === w.at ? 'now' : ''}"${i === w.at ? ' aria-current="step"' : ''}><button type="button" class="ap-wstep" data-wgo="${i}"><span class="ap-wn">${i < w.at ? '✓' : i + 1}</span><span><code class="ap-do">${esc(w.area.describe(s))}</code><span class="ap-wex">${esc(s.explain || '')}</span></span></button></li>`).join('')
      + `<li class="${w.at === solution.length ? 'now' : ''}"${w.at === solution.length ? ' aria-current="step"' : ''}><button type="button" class="ap-wstep" data-wgo="${solution.length}"><span class="ap-wn">✓</span><span><code class="ap-do">Done</code><span class="ap-wex">Every goal passes.</span></span></button></li>`;
    walkEl.querySelector('.ap-walk-pos').textContent = w.at < solution.length ? `Step ${w.at + 1} of ${solution.length} · score so far ${score}%` : `All ${solution.length} steps done · score ${score}%`;
    walkEl.querySelector('[data-wprev]').disabled = w.at === 0;
    walkEl.querySelector('[data-wnext]').disabled = w.at >= solution.length;
  }

  // ----- wiring -----
  app.querySelector('main.ap').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    const d = b.dataset;
    if (d.check !== undefined) return check();
    if (d.restart !== undefined) { start(); areaHost.scrollIntoView({ block: 'nearest' }); return null; }
    if (d.again !== undefined) { again(); R.area.el.querySelector('button:not([disabled]), input:not([disabled]), select:not([disabled])')?.focus(); return null; }
    if (d.hint) return hint(d.hint);
    if (d.offer) return hint(d.offer);
    if (d.showme) { again(); return showMe(d.showme); }
    if (d.solution !== undefined) return openWalk();
    if (d.wnext !== undefined) return walkTo(R.walk.at + 1);
    if (d.wprev !== undefined) return walkTo(R.walk.at - 1);
    if (d.wgo !== undefined) return walkTo(Number(d.wgo));
    if (d.wclose !== undefined) { closeWalk(); resultEl.querySelector('[data-solution]')?.focus(); return null; }
    if (d.pendSave !== undefined) { R.area.savePending(); return check(); }
    if (d.pendDiscard !== undefined) { R.area.discardPending(); return check(); }
    if (d.primer !== undefined) { const dlg = $('.ap-primer'); dlg.showModal(); dlg.querySelector('[data-primer-close]').focus(); return null; }
    if (d.primerClose !== undefined) { $('.ap-primer').close(); $('[data-primer]')?.focus(); return null; }
    return null;
  });
  const dlg = $('.ap-primer');
  if (dlg) dlg.addEventListener('click', (e) => { if (e.target === dlg) { dlg.close(); $('[data-primer]')?.focus(); } });
  $('.ap-modes').addEventListener('change', (e) => {
    if (!e.target.matches('input[type="radio"]')) return;
    R.mode = e.target.value;
    saveMode(lab.id, R.mode);
    const fs = $('.ap-modes');
    fs.querySelectorAll('.ap-seg-opt').forEach((l) => l.classList.toggle('on', l.querySelector('input').checked));
    fs.querySelector('.ap-mode-text').textContent = `${MODE_TEXT[R.mode]} Switching mode starts the case again.`;
    start();
  });
  wireTerms(app.querySelector('.ap-ticket'));
  R.timer = setInterval(tick, 1000);
  onLeave(() => { clearInterval(R.timer); if (dlg?.open) dlg.close(); R.area?.destroy(); closeWalk(); });
  start();
}
