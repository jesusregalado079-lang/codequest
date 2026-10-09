// What every lab page shares: the page context, cleanup on leave, the runner header, saving a graded attempt and the
// "Try again / Next case" row. No lab-specific logic here.
import { bestScore, isPassed, recordRun } from '../../labs/lab-logic.js';
import { LAB_SOURCES } from '../../labs/catalog.js';
import { getLabs, saveLabs } from '../../progress.js';
import { SECPLUS_801 } from '../../exam/blueprints.js';

export const S = { ctx: null, cleanups: [] };

// Run fn when the router leaves the page (timers, document listeners).
export const onLeave = (fn) => { S.cleanups.push(fn); };
export function leaveAll() {
  const list = S.cleanups.splice(0);
  list.forEach((fn) => { try { fn(); } catch { /* a cleanup never blocks navigation */ } });
}

export const esc = (s) => S.ctx.esc(s);
export const itemIdOf = (lab, kase) => `${lab.id}/${kase.id}`;

// Security+ objective labels from its blueprint only (never its question bank, which is a separate chunk).
const OBJ_LABELS = Object.fromEntries(SECPLUS_801.domains.flatMap((d) => d.objectives.map((o) => [o.id, o.label])));
export const objLabel = (id) => OBJ_LABELS[id] || '';
export function objChips(objs, cls = '') {
  return `<span class="lb-objs ${cls}">${(objs || []).map((o) => `<a class="lb-obj" href="#/exam/${SECPLUS_801.id}/domain/${esc(String(o).split('.')[0])}" title="${esc(objLabel(o))}">Sec+ ${esc(o)}</a>`).join('')}</span>`;
}

export const levelName = (n) => ['', 'Level 1 · warm-up', 'Level 2 · working', 'Level 3 · exam-hard'][n] || `Level ${n}`;

export function bestLine(lab, kase) {
  const best = bestScore(getLabs(), itemIdOf(lab, kase));
  if (best === null) return '<span class="lb-best none">Not tried yet</span>';
  const ok = best >= lab.pass;
  return `<span class="lb-best${ok ? ' ok' : ''}">Best ${best}%${ok ? ' · passed ✓' : ` · pass is ${lab.pass}%`}</span>`;
}

// The top of every runner: back link, lab + case title, level, objective chips, previous best.
export function runnerHead(lab, kase) {
  return `
    <a class="ex-back" href="#/labs/${esc(lab.id)}">← ${esc(lab.name)}</a>
    <section class="lb-runhead">
      <span class="lb-runicon" aria-hidden="true">${lab.icon}</span>
      <div>
        <div class="ex-kicker">${esc(lab.name)} · ${esc(levelName(kase.level))}</div>
        <h1>${esc(kase.title)}</h1>
        <div class="lb-runmeta">${objChips(kase.objs)}${bestLine(lab, kase)}</div>
      </div>
    </section>`;
}

export function sourceLinks(lab, kase) {
  const src = LAB_SOURCES[lab.id] || {};
  const links = (kase.src || []).map((k) => src[k]).filter((x) => Array.isArray(x) && x.length >= 2);
  return links.length ? `<p class="ex-src">Source: ${links.map(([title, url]) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(title)}</a>`).join(' · ')}</p>` : '';
}

// A clock per attempt: seconds spent on the page since the runner (or Try again) started.
export function stopwatch() {
  let start = Date.now();
  return { reset: () => { start = Date.now(); }, secs: () => Math.max(0, Math.min(86400, Math.round((Date.now() - start) / 1000))) };
}

// Save one graded attempt (celebrating any badge it unlocks). Returns { ok, score, best, prevBest, passed, firstPass }.
export function record(lab, kase, score, secs) {
  const id = itemIdOf(lab, kase);
  const before = getLabs();
  const prevBest = bestScore(before, id);
  const wasPassed = isPassed(before, id, lab.pass);
  const clean = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  let ok = true;
  S.ctx.celebrate(() => { ok = saveLabs(recordRun(getLabs(), id, { score: clean, secs: Math.max(0, Math.min(86400, Math.round(secs) || 0)) })).ok; });
  if (!ok) S.ctx.saveWarn();
  const shown = S.ctx.app.querySelector('.lb-runmeta .lb-best');
  if (shown) shown.outerHTML = bestLine(lab, kase);
  // not saved: nothing changed in his record, so claim nothing new (the page-wide warning already says so)
  if (!ok) return { ok, score: clean, best: prevBest, prevBest, passed: wasPassed, firstPass: false, scoredPass: clean >= lab.pass };
  const best = Math.max(prevBest ?? 0, clean);
  const passed = clean >= lab.pass;
  return { ok, score: clean, best, prevBest, passed, firstPass: passed && !wasPassed, scoredPass: passed };
}

export function nextCaseHref(lab, kase) {
  const i = lab.cases.findIndex((c) => c.id === kase.id);
  const next = lab.cases[i + 1];
  return next ? { href: `#/labs/${lab.id}/${next.id}`, label: 'Next case →' } : { href: `#/labs/${lab.id}`, label: `Back to ${lab.name}` };
}

// The score banner shown after grading, with Try again and Next case.
export function scoreBanner(lab, kase, r, extra = '') {
  const nx = nextCaseHref(lab, kase);
  const msg = !r.ok
    ? `Scored ${r.score}%${r.scoredPass ? ', a pass,' : ''} but not saved: this browser's storage is full or blocked.`
    : r.passed
    ? (r.firstPass ? 'Passed. That one is yours now.' : 'Passed again.')
    : `Pass is ${lab.pass}%. ${r.prevBest !== null && r.prevBest >= lab.pass ? 'You passed this before, so your best still counts.' : 'Look at what missed, then try again.'}`;
  return `
    <div class="lb-score${r.ok && r.passed ? ' ok' : ''}${r.ok ? '' : ' unsaved'}">
      <b class="lb-score-num">${r.score}%</b>
      <div><strong>${r.ok && r.passed ? '✓ ' : ''}${esc(msg)}</strong><small>${r.ok
    ? `Best ${r.best}%${r.prevBest !== null && r.score > r.prevBest ? ` · up from ${r.prevBest}%` : ''}`
    : `This attempt was scored, not saved · saved best ${r.best === null ? 'none yet' : `${r.best}%`}`}</small>${extra}</div>
    </div>
    <div class="ex-actions lb-after">
      <button type="button" class="ex-btn" data-again>Try again</button>
      <a class="ex-btn${r.passed ? ' primary' : ''}" href="${esc(nx.href)}" data-nextcase>${esc(nx.label)}</a>
    </div>`;
}

export function wireAgain(root, restart) {
  const b = root.querySelector('[data-again]');
  if (b) b.addEventListener('click', restart);
}

// Move focus to a results block (and bring it into view) after Check.
export function focusResult(el) {
  if (!el) return;
  el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
  el.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}
