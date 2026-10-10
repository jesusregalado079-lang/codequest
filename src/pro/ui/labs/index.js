// Hands-on Labs (#/labs...): practice for the exam's performance-based questions.
//   #/labs                    hub: stats, the A+ labs and the Security+ & Network+ labs, recent runs
//   #/labs/<labId>            one lab: its cases with best scores (A+ labs: refresher, mode, mastered marks)
//   #/labs/<labId>/<caseId>   the runner for one case (one module per Security+ lab; aplus.js for every A+ lab)
// Rules live in ../../labs/ (pure); attempts are saved through progress.js as runs.
import './labs.css';
import './labs-aplus.css';
import { labSummary } from '../../labs/lab-logic.js';
import { getLabs } from '../../progress.js';
import { LABS, isAplus, labOf } from './meta.js';
import { contentLoaded, fullCase, loadContent, withContent } from './content.js';
import { labsForObjectives } from './summary.js';
import { S, bestLine, esc, examChips, leaveAll, levelName, objChips } from './shared.js';
import { showFirewall } from './firewall.js';
import { showLogs } from './logs.js';
import { showSubnet } from './subnet.js';
import { showCli } from './cli.js';
import { showPhish } from './phish.js';
import { showCode } from './code.js';
import { retryImport } from '../lazy.js';

// What a page needs before it draws: its lab's content (one chunk per lab) and, on A+ pages, the A+ pages and engines
// (their own chunk; the shell simulator alone is ~200 kB). Already loaded: draw at once. Otherwise a loading line, then
// draw only if the route is still the same; a failed load offers Retry.
let aplus = null;
const loadAplus = () => (aplus ? Promise.resolve(aplus) : retryImport(() => import('./aplus.js'), (m) => typeof m.showAplusCase === 'function').then((m) => { aplus = m; return m; }));
const loadLab = (labId) => loadContent(labId, (load) => retryImport(load, (m) => Array.isArray(m.default)));
function whenReady(lab, needAplus, render) {
  if (contentLoaded(lab.id) && (!needAplus || aplus)) return loadContent(lab.id).then((mod) => render(withContent(lab, mod), mod, aplus));
  const hash = location.hash;
  const show = (inner) => { S.ctx.app.innerHTML = `${S.ctx.header('labs')}<main class="exam labs">${inner}</main>`; };
  const attempt = () => {
    show(`<p class="lazy-line" role="status" aria-live="polite">Loading ${esc(lab.name)}…</p>`);
    Promise.all([loadLab(lab.id), needAplus ? loadAplus() : null]).then(([mod, ap]) => {
      if (location.hash === hash) render(withContent(lab, mod), mod, ap);
    }, () => {
      if (location.hash !== hash) return;
      show(`<div class="lazy-line lazy-error" role="alert"><p><strong>Could not load ${esc(lab.name)}.</strong> You may be offline, or the app was updated since this page opened.</p><div class="ex-actions"><button type="button" class="ex-btn primary" data-lab-retry>Retry</button></div></div>`);
      const b = S.ctx.app.querySelector('[data-lab-retry]');
      b.addEventListener('click', attempt);
      b.focus();
    });
  };
  return attempt();
}

const RUNNERS = { firewall: showFirewall, logs: showLogs, subnet: showSubnet, cli: showCli, phish: showPhish, code: showCode,
  sim: (lab, kase) => aplus.showAplusCase(lab, kase), shell: (lab, kase) => aplus.showAplusCase(lab, kase),
  pcbuild: (lab, kase) => aplus.showAplusCase(lab, kase), order: (lab, kase) => aplus.showAplusCase(lab, kase) };

// Called by the router before every page: no timer or listener outlives its page.
export function leaveLabs() { leaveAll(); }

// For the Journey page, the exam hub and the achievements: labSummary over the labs index.
export function labsSummary() {
  return labSummary(getLabs(), LABS);
}

// Labs whose cases practice any of these objective ids on one exam (Security+ when none is given).
export { labsForObjectives };

export function showLabs(parts, context) {
  S.ctx = context;
  leaveAll();
  const [labId, caseId] = parts;
  if (!labId) return showHub();
  const lab = labOf(labId);
  if (!lab) { location.hash = '/labs'; return; }
  if (!caseId) return isAplus(lab) ? whenReady(lab, true, (full, mod, ap) => ap.showAplusLab(full)) : showLab(lab);
  const meta = lab.cases.find((c) => c.id === caseId);
  if (!meta) { location.hash = `/labs/${lab.id}`; return; }
  return whenReady(lab, isAplus(lab), (full, mod) => {
    const kase = fullCase(mod, caseId);
    if (!kase) { location.hash = `/labs/${lab.id}`; return; }
    RUNNERS[lab.kind](full, { ...kase, ...meta }, S.ctx);
  });
}

const fmtAgo = (t) => {
  const d = Math.round((Date.now() - t) / 60000);
  if (d < 1) return 'just now';
  if (d < 60) return `${d} min ago`;
  if (d < 1440) return `${Math.round(d / 60)} h ago`;
  return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};
const bar = (pct, cls = '') => `<span class="ex-bar ${cls}"><i style="width:${Math.max(0, Math.min(100, pct))}%"></i></span>`;

function labCard(lab, p, i) {
  const pct = p.total ? Math.round((p.passed / p.total) * 100) : 0;
  const go = p.nextCaseId ? `#/labs/${lab.id}/${p.nextCaseId}` : `#/labs/${lab.id}`;
  const cta = p.nextCaseId ? (p.attempted ? 'Continue' : 'Start') : 'Review';
  const aplus = isAplus(lab);
  return `
        <article class="lb-card${p.total && p.passed === p.total ? ' done' : ''}${aplus ? ' ap-card' : ''}" style="--i:${i}">
          <a class="lb-card-head" href="#/labs/${esc(lab.id)}"><span class="lb-icon" aria-hidden="true">${lab.icon}</span><strong>${esc(lab.name)}</strong></a>
          <p>${esc(lab.blurb)}</p>
          ${aplus ? examChips(lab.examObjs) : objChips(lab.objs)}
          ${bar(pct, pct === 100 ? 'good' : '')}
          <div class="lb-card-foot">
            <span>${p.passed} of ${p.total} passed${aplus ? ` · ${p.mastered || 0} mastered ★` : ''}${lab.pass === 100 ? ' · pass 100%' : ''}</span>
            <a class="ex-btn small${p.nextCaseId ? ' primary' : ''}" href="${esc(go)}" data-go-lab="${esc(lab.id)}">${cta}${p.nextCaseId ? ' →' : ''}</a>
          </div>
        </article>`;
}

function showHub() {
  const sum = labsSummary();
  const per = Object.fromEntries(sum.perLab.map((p) => [p.id, p]));
  const started = sum.perLab.filter((p) => p.attempted > 0).length;
  const mastered = sum.perLab.reduce((s, p) => s + (p.mastered || 0), 0);
  const empty = (lab) => ({ passed: 0, total: lab.cases.length, attempted: 0, mastered: 0, nextCaseId: lab.cases[0] ? lab.cases[0].id : null });
  const group = (labs) => labs.map((lab, i) => labCard(lab, per[lab.id] || empty(lab), i)).join('');
  const aplus = LABS.filter(isAplus);
  const rest = LABS.filter((l) => !isAplus(l));
  const groupSum = (labs) => labs.reduce((a, l) => { const p = per[l.id] || empty(l); return { passed: a.passed + p.passed, total: a.total + p.total }; }, { passed: 0, total: 0 });
  const ga = groupSum(aplus);
  const gs = groupSum(rest);
  S.ctx.app.innerHTML = `
    ${S.ctx.header('labs')}
    <main class="exam labs">
      <section class="lb-hero">
        <div class="lb-hero-text">
          <div class="ex-kicker">A+ · Network+ · Security+ · performance-based practice</div>
          <h1>Hands-on Labs</h1>
          <p class="lb-lead">The exam's performance-based questions put you in a firewall, a terminal, a log, an inbox. The A+ labs add Windows tools, a command line, a PC build, a router, a phone and a printer. Practice the moves here.</p>
        </div>
        <div class="lb-stats">
          <div><b>${sum.passed}<small>/${sum.total}</small></b><span>cases passed</span></div>
          <div><b>${sum.perfect}</b><span>perfect 100%</span></div>
          <div><b>${mastered}</b><span>mastered ★</span></div>
          <div><b>${started}<small>/${LABS.length}</small></b><span>labs started</span></div>
        </div>
      </section>

      <section class="lb-group" aria-labelledby="lb-g-aplus">
        <h2 class="ex-h2 c-h2" id="lb-g-aplus">A+ labs <span>Core 1 (220-1201) and Core 2 (220-1202) · ${ga.passed} of ${ga.total} passed</span></h2>
        <p class="lb-group-lead">Guided, Practice or Exam mode on every case, three-tier hints, corrections with the rule behind them, and a step-by-step solution you can watch.</p>
        <div class="lb-grid lb-grid-aplus">${group(aplus)}</div>
      </section>

      <section class="lb-group" aria-labelledby="lb-g-sec">
        <h2 class="ex-h2 c-h2" id="lb-g-sec">Security+ &amp; Network+ labs <span>${gs.passed} of ${gs.total} passed</span></h2>
        <div class="lb-grid lb-grid-sec">${group(rest)}</div>
      </section>

      ${sum.recent.length ? `
      <section>
        <h2 class="ex-h2 c-h2">Recent runs <span>${sum.runs} saved</span></h2>
        <ul class="lb-recent">${sum.recent.map((r) => {
    const lab = labOf(r.labId);
    const c = lab && lab.cases.find((x) => x.id === r.caseId);
    const ok = lab && r.score >= lab.pass;
    return `<li><a href="#/labs/${esc(r.labId)}/${esc(r.caseId)}"><span aria-hidden="true">${lab ? lab.icon : '•'}</span><span class="lb-recent-t">${esc(c ? c.title : r.itemId)}</span><strong class="${ok ? 'good' : ''}">${r.score}%</strong><span class="ex-muted">${esc(fmtAgo(r.t))}</span></a></li>`;
  }).join('')}</ul>
      </section>` : ''}

      <section class="ex-honest">
        <h2 class="ex-h2 c-h2">How these work</h2>
        <ul>
          <li>Every case is original, with fictional companies, <code>.example</code> domains and documentation IP ranges. None are real exam items.</li>
          <li>Each check saves a run. A case is passed when a run reaches the lab's pass mark (80%, or 100% for code). In the A+ labs a run that used Show me or the solution is saved but does not count as a pass, and a pass in Exam mode marks the case mastered ★.</li>
          <li>Objective chips link to the matching exam domain, so a weak spot in a lab can turn into question practice.</li>
        </ul>
      </section>
    </main>`;
}

function showLab(lab) {
  const sum = labsSummary();
  const p = sum.perLab.find((x) => x.id === lab.id) || { passed: 0, total: lab.cases.length, perfect: 0 };
  const pct = p.total ? Math.round((p.passed / p.total) * 100) : 0;
  S.ctx.app.innerHTML = `
    ${S.ctx.header('labs')}
    <main class="exam labs">
      <a class="ex-back" href="#/labs">← Hands-on Labs</a>
      <section class="lb-labhead">
        <span class="lb-bigicon" aria-hidden="true">${lab.icon}</span>
        <div>
          <div class="ex-kicker">${p.passed} of ${p.total} passed · ${p.perfect} perfect · pass mark ${lab.pass}%</div>
          <h1>${esc(lab.name)}</h1>
          <p class="ex-muted">${esc(lab.blurb)}</p>
          ${objChips(lab.objs)}
          ${bar(pct, pct === 100 ? 'good' : '')}
        </div>
      </section>
      <ol class="lb-cases${lab.kind === 'subnet' ? ' lb-levels' : ''}">
        ${lab.cases.map((c, i) => {
    const full = lab.kind === 'subnet' ? c : null;
    return `
        <li class="lb-case" style="--i:${i}">
          <a href="#/labs/${esc(lab.id)}/${esc(c.id)}" data-case="${esc(c.id)}">
            <span class="lb-case-n">${i + 1}</span>
            <span class="lb-case-body">
              <strong>${esc(c.title)}</strong>
              <small>${esc(levelName(c.level))}${full && full.blurb ? ` · ${esc(full.blurb)}` : ''}</small>
              <span class="lb-case-meta">${c.objs.map((o) => `<i>Sec+ ${esc(o)}</i>`).join('')}${bestLine(lab, c)}</span>
            </span>
            <span class="lb-case-go" aria-hidden="true">→</span>
          </a>
        </li>`;
  }).join('')}
      </ol>
    </main>`;
}
